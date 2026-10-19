Consent-based Family Location Demo (local)
=========================================

WARNING: Demo only. Use only with explicit permission from device owners. Do NOT use or deploy this to track people without their informed consent. For real emergencies contact local authorities and the mobile carrier.

Files
- server.js         - Express demo server (serves UI and API)
- public/parent.html - Parent UI (lookup by system password + phone)
- public/child.html  - Child device page (register + report location)

Quick start (local)
1. Put `server.js` at repo root and create `public/` containing `parent.html` and `child.html`.
2. Install & run:
   npm init -y
   npm install express cors body-parser
   node server.js

3. Open parent UI locally (same machine):
   http://localhost:3000/parent.html

4. Create a pairing code (parent step). From terminal:
   curl -X POST http://localhost:3000/api/create-pairing \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer 300309" \
     -d '{"phone":"+1234567890"}'

   Copy the returned `pairingCode`.

5. On child device (must reach the server; use server LAN IP if on different device):
   Open http://<server-ip>:3000/child.html
   Enter pairingCode, accept location permission.

6. Parent: enter system password `300309` (prefilled) and the same phone string used in step 4 (`+1234567890`) then click Lookup.

Troubleshooting
- "Failed to fetch" typically means the page cannot reach the server. Ensure:
  - Server is running (node server.js).
  - You are opening parent.html from the same server (http://localhost:3000/parent.html) — do not use an HTTPS GitHub Pages page to call http://localhost:3000 (mixed-content blocked).
  - If using multiple devices, use the server machine LAN IP and ensure firewall allows port 3000.
- The demo stores data in memory — restarting the server clears pairings/devices/locations. Re-run pairing/register/report if you restart.

Security notes
- MASTER_PASSWORD is set to '300309' by default in this demo. Replace with strong secrets in production and never commit secrets to source control.
- Use HTTPS/TLS, persistent database, per-user tokens (JWT/OAuth), rate-limiting, logging, and access controls before deploying.
