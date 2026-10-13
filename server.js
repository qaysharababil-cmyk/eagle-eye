const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(bodyParser.json());

/*
  IMPORTANT:
  This is a consent-based demo only.
  - It is for a parent/guardian and child with permission.
  - It should not be used to track someone without consent.
  - Production use requires HTTPS, a database, user auth, encrypted storage, and audit logs.

  Change made: Allow a master password to act as a system-wide parent credential.
  MASTER_PASSWORD can be set with the environment variable MASTER_PASSWORD; defaults to '300309'.
  When the master password is used, the server will allow lookups for any paired device.
*/

const MASTER_PASSWORD = process.env.MASTER_PASSWORD || '300309';

const parents = {};
const pairings = {};
const devices = {};
const locations = {};

function genToken(prefix = 'tok') {
  return `${prefix}-${crypto.randomBytes(8).toString('hex')}`;
}

function authorizeParentHeader(headerValue) {
  if (!headerValue) return null;
  // Accept Bearer <token> or raw token/password
  const token = headerValue.startsWith('Bearer ') ? headerValue.slice(7) : headerValue;
  if (token === MASTER_PASSWORD) return { isMaster: true, token: 'master' };
  if (parents[token]) return { isMaster: false, token };
  return null;
}

// Register a parent and return a parent token (demo)
// This endpoint now requires the MASTER_PASSWORD to create a parent token.
app.post('/api/register-parent', (req, res) => {
  const { name, password } = req.body || {};

  // Allow creating a parent token only when the correct password is provided
  if (password !== MASTER_PASSWORD) {
    return res.status(401).json({ error: 'invalid_master_password' });
  }

  const token = genToken('parent');
  parents[token] = { token, name: name || 'Parent', createdAt: Date.now(), allowedPhones: [] };
  return res.json({ ok: true, parentToken: token });
});

// Parent creates a pairing code for a child phone
app.post('/api/create-pairing', (req, res) => {
  const header = req.header('Authorization')?.replace('Bearer ', '') || req.body?.auth;
  const auth = authorizeParentHeader(header);
  const { phone } = req.body || {};

  if (!auth) return res.status(401).json({ error: 'unauth' });
  if (!phone) return res.status(400).json({ error: 'phone_required' });

  const code = crypto.randomBytes(4).toString('hex');
  const expiresAt = Date.now() + 1000 * 60 * 60;

  // store parentToken as either the actual parent token or 'master'
  pairings[code] = { phone, parentToken: auth.token, expiresAt };

  return res.json({ ok: true, pairingCode: code, expiresAt });
});

// Child registers device by submitting the pairing code and a deviceToken
app.post('/api/register-device', (req, res) => {
  const { pairingCode, deviceToken } = req.body || {};
  if (!pairingCode || !deviceToken) return res.status(400).json({ error: 'missing' });

  const info = pairings[pairingCode];
  if (!info) return res.status(404).json({ error: 'invalid_pairing' });
  if (info.expiresAt < Date.now()) return res.status(410).json({ error: 'pairing_expired' });

  const phone = info.phone;
  devices[phone] = { deviceToken, registeredAt: Date.now() };

  // If the pairing was created by a real parent token, grant lookup to that parent
  if (info.parentToken && info.parentToken !== 'master' && parents[info.parentToken]) {
    const parent = parents[info.parentToken];
    if (parent && !parent.allowedPhones.includes(phone)) parent.allowedPhones.push(phone);
  }

  // Remove pairing after use
  delete pairings[pairingCode];

  console.log(`Device registered for phone=${phone}`);
  return res.json({ ok: true, phone });
});

// Child posts location periodically with deviceToken
app.post('/api/report-location', (req, res) => {
  const { deviceToken, lat, lon, ts } = req.body || {};
  if (!deviceToken || typeof lat !== 'number' || typeof lon !== 'number') {
    return res.status(400).json({ error: 'invalid_location_payload' });
  }

  const phone = Object.keys(devices).find((key) => devices[key].deviceToken === deviceToken);
  if (!phone) return res.status(401).json({ error: 'unknown_device' });

  locations[phone] = { lat, lon, ts: ts || Date.now() };
  return res.json({ ok: true, phone, location: locations[phone] });
});

// Parent retrieves the child's last known location
app.get('/api/get-location', (req, res) => {
  const header = req.header('Authorization')?.replace('Bearer ', '') || req.query?.auth;
  const auth = authorizeParentHeader(header);
  const phone = req.query.phone;

  if (!auth) return res.status(401).json({ error: 'unauth' });
  if (!phone) return res.status(400).json({ error: 'phone_required' });

  // If master password used, allow lookup for any paired device that exists
  if (auth.isMaster) {
    if (!devices[phone]) return res.status(404).json({ error: 'no_device_paired' });
    const loc = locations[phone];
    if (!loc) return res.status(404).json({ error: 'no_location' });
    return res.json({ ok: true, phone, location: loc });
  }

  const parent = parents[auth.token];
  if (!parent.allowedPhones.includes(phone)) return res.status(403).json({ error: 'forbidden' });
  const loc = locations[phone];
  if (!loc) return res.status(404).json({ error: 'no_location' });
  return res.json({ ok: true, phone, location: loc });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Consent-based location demo running on http://localhost:${PORT}`);
  console.log('Use with explicit consent only.');
});

module.exports = app;
