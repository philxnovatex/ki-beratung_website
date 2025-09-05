const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Simple newsletter persistence (local file). Intended for local/dev use only.
const DATA_DIR = path.join(__dirname, 'data');
const NEWS_PATH = path.join(DATA_DIR, 'newsletter.json');
const TOKENS_PATH = path.join(DATA_DIR, 'tokens.json');
const CONSENT_PATH = path.join(DATA_DIR, 'consent.json');

async function readJsonSafe(p) {
  try { const raw = await fs.readFile(p, 'utf8'); return JSON.parse(raw || '[]'); } catch(e){ return []; }
}
async function writeJsonSafe(p, data){ await fs.mkdir(DATA_DIR, { recursive: true }); await fs.writeFile(p, JSON.stringify(data, null, 2), 'utf8'); }

async function appendConsent(entry){
  try{
    await fs.mkdir(DATA_DIR, { recursive: true });
    let list = [];
    try{ const raw = await fs.readFile(CONSENT_PATH, 'utf8'); list = JSON.parse(raw||'[]'); }catch(e){ list = []; }
    list.push(entry);
    await fs.writeFile(CONSENT_PATH, JSON.stringify(list, null, 2), 'utf8');
  }catch(e){ console.error('consent write error', e); }
}

// Create a nodemailer transport if SMTP env vars set; otherwise we'll not send but return token URL.
let mailTransport = null;
if(process.env.SMTP_HOST && process.env.SMTP_USER){
  mailTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

// POST /api/newsletter -> create pending token and send confirmation email (double opt-in)
app.post('/api/newsletter', async (req, res) => {
  try {
    const { email } = req.body || {};
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !re.test(String(email).trim())) return res.status(400).json({ error: 'invalid_email' });
    const normalized = String(email).trim().toLowerCase();

    // generate token
    const token = crypto.randomBytes(18).toString('hex');
    const tokenEntry = { token, email: normalized, created: new Date().toISOString() };

  const tokens = await readJsonSafe(TOKENS_PATH);
    tokens.push(tokenEntry);
    await writeJsonSafe(TOKENS_PATH, tokens);

    const confirmUrl = `${req.protocol}://${req.get('host')}/api/newsletter/confirm?token=${token}`;

    // try to send email if transport configured; otherwise return URL to caller for dev/testing
    if(mailTransport){
      await mailTransport.sendMail({
        from: process.env.SMTP_FROM || 'noreply@example.com',
        to: normalized,
        subject: 'Neuratex: Bitte E‑Mail bestätigen',
        text: `Bitte bestätigen Sie Ihre Anmeldung: ${confirmUrl}`,
        html: `<p>Bitte bestätigen Sie Ihre Anmeldung: <a href="${confirmUrl}">${confirmUrl}</a></p>`
      });
      return res.status(201).json({ ok: true, method: 'email' });
    }

    // dev fallback: return confirmation URL in response
  // log consent request (timestamp and ip)
  try{ await appendConsent({ email: normalized, action: 'requested', ts: new Date().toISOString(), ip: req.ip }); }catch(e){}
  return res.status(201).json({ ok: true, method: 'dev', confirmUrl });
  } catch (err) {
    console.error('newsletter token error', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

// GET /api/newsletter/confirm?token=... -> validate token and add to newsletter.json
app.get('/api/newsletter/confirm', async (req, res) => {
  try {
    const { token } = req.query || {};
    if(!token) return res.status(400).send('missing token');
    const tokens = await readJsonSafe(TOKENS_PATH);
    const idx = tokens.findIndex(t => t.token === token);
    if(idx === -1) return res.status(404).send('token not found or expired');

    const entry = tokens[idx];
    // remove token
    tokens.splice(idx,1);
    await writeJsonSafe(TOKENS_PATH, tokens);

    // append to newsletter list if not present
    const list = await readJsonSafe(NEWS_PATH);
    if(!list.find(it => it.email === entry.email)){
      list.push({ email: entry.email, confirmed: new Date().toISOString() });
      await writeJsonSafe(NEWS_PATH, list);
    }
    try{ await appendConsent({ email: entry.email, action: 'confirmed', ts: new Date().toISOString(), ip: req.ip }); }catch(e){}

    // show a simple confirmation page
    return res.send(`<html><body><h1>Danke!</h1><p>Ihre E‑Mail ${entry.email} wurde bestätigt.</p><p><a href="/lernplattform.html">Zurück zur Lernplattform</a></p></body></html>`);
  } catch(err){ console.error('confirm error', err); return res.status(500).send('server error'); }
});

// Admin CSV export with simple token protection: GET /admin/export.csv?token=XXXXX
// Token is read from env ADMIN_TOKEN. If not set, the server will try to read
// data/admin_token.txt; if that file doesn't exist it will generate a random
// token, persist it to data/admin_token.txt and log it to the console. This
// makes local setup easier: you can start the server and then read the token.
let ADMIN_TOKEN = process.env.ADMIN_TOKEN || null;

async function ensureAdminToken(){
  if(process.env.ADMIN_TOKEN){ ADMIN_TOKEN = process.env.ADMIN_TOKEN; return; }
  const tokenFile = path.join(DATA_DIR, 'admin_token.txt');
  try{
    const existing = await fs.readFile(tokenFile, 'utf8');
    if(existing && existing.trim()){ ADMIN_TOKEN = existing.trim(); console.log('Admin token loaded from', tokenFile); return; }
  }catch(e){ /* file not present */ }

  // generate and persist
  const token = crypto.randomBytes(18).toString('hex');
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(tokenFile, token, 'utf8');
  ADMIN_TOKEN = token;
  console.log('Generated new admin token and saved to', tokenFile);
  console.log('Admin token (keep secret):', token);
}

// Admin auth middleware: prefer BASIC auth (ADMIN_USER/ADMIN_PASS), else fall back to token
function parseBasicAuth(authHeader){
  if(!authHeader) return null;
  const parts = authHeader.split(' ');
  if(parts.length!==2 || parts[0] !== 'Basic') return null;
  try{ const decoded = Buffer.from(parts[1], 'base64').toString('utf8'); const idx = decoded.indexOf(':'); if(idx===-1) return null; return { user: decoded.slice(0,idx), pass: decoded.slice(idx+1) }; }catch(e){ return null; }
}

function adminAuthMiddleware(req, res, next){
  // if basic auth env set, require it
  if(process.env.ADMIN_USER && process.env.ADMIN_PASS){
    const creds = parseBasicAuth(req.get('authorization'));
    if(!creds || creds.user !== process.env.ADMIN_USER || creds.pass !== process.env.ADMIN_PASS){
      res.set('WWW-Authenticate','Basic realm="Admin"');
      return res.status(401).send('unauthorized');
    }
    return next();
  }

  // otherwise fall back to token check
  const token = req.query.token || req.get('x-admin-token') || '';
  if(!(ADMIN_TOKEN && token && token === ADMIN_TOKEN)) return res.status(401).send('unauthorized');
  return next();
}

app.get('/admin/export.csv', adminAuthMiddleware, async (req, res) => {
  try{
    const list = await readJsonSafe(NEWS_PATH);
    const rows = ['email,confirmed'].concat((list||[]).map(it => `${it.email},${it.confirmed||''}`));
    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition','attachment; filename="newsletter_export.csv"');
    res.send(rows.join('\n'));
  }catch(e){ console.error('export error', e); res.status(500).send('server error'); }
});

// simple admin UI
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/api/newsletter', async (req, res) => {
  try {
    const raw = await fs.readFile(NEWS_PATH, 'utf8');
    const list = JSON.parse(raw || '[]');
    res.json(list);
  } catch (e) {
    res.json([]);
  }
});

app.listen(port, () => console.log(`Dev server running at http://localhost:${port}`));
