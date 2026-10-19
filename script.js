// server.js (demo) — consent-based family location prototype
// WARNING: demo only. Use only with explicit permission. Do NOT deploy publicly without HTTPS, auth, DB, and audit logging.

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Demo master password (override with env MASTER_PASSWORD in production)
const MASTER_PASSWORD = process.env.MASTER_PASSWORD || '300309';

// In-memory demo stores
const parents = {};    // token -> { token, name, allowedPhones: [] }
const pairings = {};   // code -> { phone, parentToken, expiresAt }
const devices = {};    // phone -> { deviceToken, registeredAt }
const locations = {};  // phone -> { lat, lon, ts }

// Helpers
function genToken(prefix = 'tok') {
  return `${prefix}-${crypto.randomBytes(8).toString('hex')}`;
}
function normalizePhone(p) {
  if (!p) return '';
  return p.trim();
}
function authorizeParentHeader(headerValue) {
  if (!headerValue) return null;
  const token = headerValue.startsWith('Bearer ') ? headerValue.slice(7) : headerValue;
  if (token === MASTER_PASSWORD) return { isMaster: true, token: 'master' };
  if (parents[token]) return { isMaster: false, token };
  return null;
}

// Serve static UI files from ./public
app.use('/', express.static(path.join(__dirname, 'public')));

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// Create parent token — demo: require master password in body.password
app.post('/api/register-parent', (req, res) => {
  const { name, password } = req.body || {};
  if (password !== MASTER_PASSWORD) {
    return res.status(401).json({ error: 'invalid_master_password' });
  }
  const token = genToken('parent');
  parents[token] = { token, name: name || 'Parent', allowedPhones: [] };
  return res.json({ ok: true, parentToken: token });
});

// Parent creates pairing code (Authorization: Bearer <parentToken> OR Bearer <MASTER_PASSWORD>)
app.post('/api/create-pairing', (req, res) => {
  const header = req.header('Authorization') || req.body?.auth;
  const auth = authorizeParentHeader(header);
  const phoneRaw = req.body?.phone;
  if (!auth) return res.status(401).json({ error: 'unauth' });
  if (!phoneRaw) return res.status(400).json({ error: 'phone_required' });

  const phone = normalizePhone(phoneRaw);
  const code = crypto.randomBytes(4).toString('hex');
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
  pairings[code] = { phone, parentToken: auth.token, expiresAt };
  return res.json({ ok: true, pairingCode: code, expiresAt });
});

// Child registers device using pairing code + deviceToken
app.post('/api/register-device', (req, res) => {
  const pairingCode = req.body?.pairingCode;
  const deviceToken = req.body?.deviceToken;
  if (!pairingCode || !deviceToken) return res.status(400).json({ error: 'missing_pairing_or_deviceToken' });

  const info = pairings[pairingCode];
  if (!info) return res.status(404).json({ error: 'invalid_pairing' });
  if (info.expiresAt < Date.now()) return res.status(410).json({ error: 'pairing_expired' });

  const phone = info.phone;
  devices[phone] = { deviceToken, registeredAt: Date.now() };

  // Grant lookup permission to the real parent token (if not master)
  if (info.parentToken && info.parentToken !== 'master' && parents[info.parentToken]) {
    const parent = parents[info.parentToken];
    if (!parent.allowedPhones.includes(phone)) parent.allowedPhones.push(phone);
  }

  // Remove pairing after use
  delete pairings[pairingCode];

  return res.json({ ok: true, phone });
});

// Child posts location
app.post('/api/report-location', (req, res) => {
  const { deviceToken, lat, lon, ts } = req.body || {};
  if (!deviceToken || typeof lat !== 'number' || typeof lon !== 'number') {
    return res.status(400).json({ error: 'invalid_location_payload' });
  }
  const phone = Object.keys(devices).find(p => devices[p].deviceToken === deviceToken);
  if (!phone) return res.status(401).json({ error: 'unknown_device' });

  locations[phone] = { lat, lon, ts: ts || Date.now() };
  return res.json({ ok: true, phone, location: locations[phone] });
});

// Parent gets last-known location
app.get('/api/get-location', (req, res) => {
  const header = req.header('Authorization') || req.query?.auth;
  const auth = authorizeParentHeader(header);
  const phoneRaw = req.query?.phone;
  if (!auth) return res.status(401).json({ error: 'unauth' });
  if (!phoneRaw) return res.status(400).json({ error: 'phone_required' });

  const phone = normalizePhone(phoneRaw);

  // Master password (demo) can lookup any paired device
  if (auth.isMaster) {
    if (!devices[phone]) return res.status(404).json({ error: 'no_device_paired' });
    const loc = locations[phone];
    if (!loc) return res.status(404).json({ error: 'no_location' });
    return res.json({ ok: true, phone, location: loc });
  }

  // Normal parent token flow
  const parent = parents[auth.token];
  if (!parent) return res.status(401).json({ error: 'unauth' });
  if (!parent.allowedPhones.includes(phone)) return res.status(403).json({ error: 'forbidden' });
  const loc = locations[phone];
  if (!loc) return res.status(404).json({ error: 'no_location' });
  return res.json({ ok: true, phone, location: loc });
});

// Simple debug endpoints (not required)
// List pairings (for debug only) - remove in production
app.get('/debug/state', (req, res) => {
  res.json({
    parentsCount: Object.keys(parents).length,
    pairingsCount: Object.keys(pairings).length,
    devicesCount: Object.keys(devices).length,
    locationsCount: Object.keys(locations).length
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Demo server listening on http://0.0.0.0:${PORT} (MASTER_PASSWORD=${MASTER_PASSWORD})`);
});
