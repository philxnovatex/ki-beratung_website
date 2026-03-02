/**
 * ⚠️  DEPRECATED – Nicht in Produktion verwendet!
 *
 * Dieses File war ein lokaler Express-Dev-Server für Tests.
 * Das Projekt wird statisch auf Vercel gehostet.
 * Newsletter läuft über: api/newsletter.js (Vercel Serverless Function + Brevo API)
 *
 * Kann bei Bedarf für lokale Entwicklung genutzt werden:
 *   npm install && npm run dev
 *
 * Für Produktion: Vercel deployed nur public/ + api/
 */

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { promisify } = require('util');
const nodemailer = require('nodemailer');
const compression = require('compression');
const config = require('./config');
const logger = require('./lib/logger');
const crmStore = require('./lib/crmStore');

const app = express();
const port = config.port;
const scryptAsync = promisify(crypto.scrypt);

const ADMIN_SESSION_COOKIE = 'admin_session';
const ADMIN_SESSION_TTL_MS = Number(process.env.ADMIN_SESSION_TTL_MS || 8 * 60 * 60 * 1000);
const ADMIN_CREDS_PATH = path.join(__dirname, 'data', 'admin_credentials.json');
const loginRateLimitMap = new Map();
const LOGIN_RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const LOGIN_RATE_LIMIT_MAX = 12;
const adminSessions = new Map();
let adminCredentialStore = null;

// Helper: Escape HTML to prevent XSS
const escapeHtml = (str) => String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Build CSP Header from config
function buildCSP() {
    const csp = config.csp;
    const directives = [
        `default-src ${csp.defaultSrc.join(' ')}`,
        `script-src ${csp.scriptSrc.join(' ')}`,
        `style-src ${csp.styleSrc.join(' ')}`,
        `font-src ${csp.fontSrc.join(' ')}`,
        `img-src ${csp.imgSrc.join(' ')}`,
        `connect-src ${csp.connectSrc.join(' ')}`,
        `frame-src ${csp.frameSrc.join(' ')}`,
        `object-src ${csp.objectSrc.join(' ')}`,
        `base-uri ${csp.baseUri.join(' ')}`,
        `form-action ${csp.formAction.join(' ')}`,
        `frame-ancestors ${csp.frameAncestors.join(' ')}`
    ];
    return directives.join('; ');
}

// Gzip/Brotli Compression
app.use(compression({
    level: config.compression.level,
    threshold: config.compression.threshold
}));

// Request Logging (nur in development)
if (config.nodeEnv === 'development') {
    app.use(logger.requestLogger);
}

// Security Headers Middleware (inkl. CSP)
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('Content-Security-Policy', buildCSP());
    next();
});

// Simple Rate Limiting (in-memory, for production use redis)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = config.rateLimit.windowMs;
const RATE_LIMIT_MAX = config.rateLimit.maxRequests;

// Periodisch abgelaufene Rate-Limit-Einträge entfernen (alle 5 Minuten)
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap) {
        if (now - record.start > RATE_LIMIT_WINDOW) {
            rateLimitMap.delete(ip);
        }
    }
}, 5 * 60 * 1000).unref();

function rateLimiter(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const record = rateLimitMap.get(ip);
    
    if (!record || now - record.start > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(ip, { start: now, count: 1 });
        return next();
    }
    
    if (record.count >= RATE_LIMIT_MAX) {
        return res.status(429).json({ error: 'too_many_requests', retry_after: Math.ceil((RATE_LIMIT_WINDOW - (now - record.start)) / 1000) });
    }
    
    record.count++;
    next();
}

app.use(express.json({ limit: '200kb' }));

// Do not expose admin UI as directly static files.
app.use((req, res, next) => {
  if (req.path === '/admin.html' || req.path === '/pages/admin.html') {
    return res.redirect('/admin');
  }
  if (req.path === '/admin-login.html') {
    return res.redirect('/admin/login');
  }
  return next();
});

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
  }catch(e){ logger.error('consent write error', { error: e.message }); }
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
app.post('/api/newsletter', rateLimiter, async (req, res) => {
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
    logger.error('newsletter token error', { error: err.message });
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

    // show a simple confirmation page (escaped to prevent XSS)
    return res.send(`<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>Bestätigung erfolgreich</title><style>body{font-family:system-ui,sans-serif;background:#0A1931;color:#fff;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}div{text-align:center;padding:2rem}a{color:#FFC947}</style></head><body><div><h1>Danke!</h1><p>Ihre E‑Mail <strong>${escapeHtml(entry.email)}</strong> wurde bestätigt.</p><p><a href="/pages/lernplattform.html">Zurück zur Lernplattform</a></p></div></body></html>`);
  } catch(err){ logger.error('confirm error', { error: err.message }); return res.status(500).send('server error'); }
});

function safeCompareText(a, b) {
  const aBuf = Buffer.from(String(a || ''), 'utf8');
  const bBuf = Buffer.from(String(b || ''), 'utf8');
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

async function hashPassword(password, salt) {
  const out = await scryptAsync(String(password || ''), String(salt || ''), 64);
  return Buffer.from(out).toString('hex');
}

async function ensureAdminCredentials() {
  if (process.env.ADMIN_USER && process.env.ADMIN_PASS) {
    adminCredentialStore = {
      source: 'env',
      user: process.env.ADMIN_USER,
      pass: process.env.ADMIN_PASS
    };
    logger.info('Admin credentials loaded from environment.');
    return;
  }

  try {
    const raw = await fs.readFile(ADMIN_CREDS_PATH, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    if (parsed && parsed.user && parsed.salt && parsed.hash) {
      adminCredentialStore = {
        source: 'file',
        user: parsed.user,
        salt: parsed.salt,
        hash: parsed.hash
      };
      logger.info('Admin credentials loaded from file.', { file: ADMIN_CREDS_PATH });
      return;
    }
  } catch (err) {
    // continue with auto-generation
  }

  const generatedUser = 'admin';
  const generatedPass = crypto.randomBytes(12).toString('base64url');
  const generatedSalt = crypto.randomBytes(16).toString('hex');
  const generatedHash = await hashPassword(generatedPass, generatedSalt);

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    ADMIN_CREDS_PATH,
    JSON.stringify(
      {
        user: generatedUser,
        salt: generatedSalt,
        hash: generatedHash,
        createdAt: new Date().toISOString(),
        note: 'Set ADMIN_USER and ADMIN_PASS in production.'
      },
      null,
      2
    ),
    'utf8'
  );

  adminCredentialStore = {
    source: 'file',
    user: generatedUser,
    salt: generatedSalt,
    hash: generatedHash
  };

  logger.warn('Generated local admin credentials.', {
    user: generatedUser,
    password: generatedPass,
    file: ADMIN_CREDS_PATH
  });
}

function parseBasicAuth(authHeader){
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Basic') return null;
  try {
    const decoded = Buffer.from(parts[1], 'base64').toString('utf8');
    const idx = decoded.indexOf(':');
    if (idx === -1) return null;
    return { user: decoded.slice(0, idx), pass: decoded.slice(idx + 1) };
  } catch (e) {
    return null;
  }
}

function parseCookies(req){
  const raw = req.get('cookie') || '';
  if (!raw) return {};
  const out = {};
  raw.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (!key) return;
    try {
      out[key] = decodeURIComponent(val);
    } catch (e) {
      out[key] = val;
    }
  });
  return out;
}

function getCookie(req, name){
  const cookies = parseCookies(req);
  return cookies[name] || '';
}

function setAdminSessionCookie(res, sessionToken){
  const parts = [
    `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(sessionToken)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${Math.floor(ADMIN_SESSION_TTL_MS / 1000)}`
  ];
  if (config.nodeEnv === 'production') {
    parts.push('Secure');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearAdminSessionCookie(res){
  const parts = [
    `${ADMIN_SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0'
  ];
  if (config.nodeEnv === 'production') {
    parts.push('Secure');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

function getLoginRateKey(req){
  return req.ip || req.connection.remoteAddress || 'unknown';
}

function loginRateLimiter(req, res, next){
  const key = getLoginRateKey(req);
  const now = Date.now();
  const current = loginRateLimitMap.get(key);

  if (!current || now - current.start > LOGIN_RATE_LIMIT_WINDOW) {
    loginRateLimitMap.set(key, { start: now, count: 1 });
    return next();
  }

  if (current.count >= LOGIN_RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: 'too_many_login_attempts',
      retry_after: Math.ceil((LOGIN_RATE_LIMIT_WINDOW - (now - current.start)) / 1000)
    });
  }

  current.count += 1;
  return next();
}

function createAdminSession(req, user){
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const userAgent = String(req.get('user-agent') || '').slice(0, 250);
  adminSessions.set(token, {
    user,
    userAgent,
    createdAt: now,
    expiresAt: now + ADMIN_SESSION_TTL_MS
  });
  return token;
}

function getValidAdminSession(req){
  const token = getCookie(req, ADMIN_SESSION_COOKIE);
  if (!token) return null;
  const session = adminSessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    adminSessions.delete(token);
    return null;
  }

  const requestUA = String(req.get('user-agent') || '').slice(0, 250);
  if (session.userAgent && requestUA && session.userAgent !== requestUA) {
    return null;
  }

  session.expiresAt = Date.now() + ADMIN_SESSION_TTL_MS;
  return { token, user: session.user };
}

async function verifyCredentialLogin(username, password){
  if (!adminCredentialStore) return false;

  const userMatch = safeCompareText(username, adminCredentialStore.user);
  if (!userMatch) return false;

  if (adminCredentialStore.source === 'env') {
    return safeCompareText(password, adminCredentialStore.pass);
  }

  const computedHash = await hashPassword(password, adminCredentialStore.salt);
  return safeCompareText(computedHash, adminCredentialStore.hash);
}

function isValidBasicAuth(req){
  if (!(process.env.ADMIN_USER && process.env.ADMIN_PASS)) {
    return false;
  }
  const creds = parseBasicAuth(req.get('authorization'));
  if (!creds) return false;
  return safeCompareText(creds.user, process.env.ADMIN_USER) && safeCompareText(creds.pass, process.env.ADMIN_PASS);
}

function adminAuthMiddleware(req, res, next){
  const session = getValidAdminSession(req);
  if (session) {
    req.adminUser = session.user;
    return next();
  }

  if (isValidBasicAuth(req)) {
    req.adminUser = process.env.ADMIN_USER;
    return next();
  }

  const legacyToken = req.get('x-admin-token') || '';
  if (process.env.ADMIN_TOKEN && safeCompareText(legacyToken, process.env.ADMIN_TOKEN)) {
    req.adminUser = 'token';
    return next();
  }

  return res.status(401).json({ error: 'unauthorized' });
}

function adminPageAuthMiddleware(req, res, next){
  const session = getValidAdminSession(req);
  if (session) {
    req.adminUser = session.user;
    return next();
  }
  return res.redirect('/admin/login');
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of loginRateLimitMap) {
    if (now - value.start > LOGIN_RATE_LIMIT_WINDOW) {
      loginRateLimitMap.delete(key);
    }
  }
  for (const [token, session] of adminSessions) {
    if (session.expiresAt <= now) {
      adminSessions.delete(token);
    }
  }
}, 5 * 60 * 1000).unref();

function handleCRMError(res, err, logLabel){
  if(err instanceof crmStore.CRMValidationError){
    return res.status(400).json({ error: err.code, message: err.message });
  }
  logger.error(logLabel, { error: err.message });
  return res.status(500).json({ error: 'server_error' });
}

app.get('/admin/login', (req, res) => {
  const session = getValidAdminSession(req);
  if (session) {
    return res.redirect('/admin');
  }
  return res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.post('/api/admin/login', loginRateLimiter, async (req, res) => {
  try {
    const username = String((req.body || {}).username || '').trim();
    const password = String((req.body || {}).password || '');

    if (!username || !password) {
      return res.status(400).json({ error: 'missing_credentials', message: 'Bitte Benutzername und Passwort angeben.' });
    }

    const ok = await verifyCredentialLogin(username, password);
    if (!ok) {
      return res.status(401).json({ error: 'invalid_credentials', message: 'Benutzername oder Passwort falsch.' });
    }

    const sessionToken = createAdminSession(req, username);
    setAdminSessionCookie(res, sessionToken);
    loginRateLimitMap.delete(getLoginRateKey(req));
    return res.json({
      ok: true,
      user: username,
      expiresInSeconds: Math.floor(ADMIN_SESSION_TTL_MS / 1000)
    });
  } catch (err) {
    logger.error('admin login error', { error: err.message });
    return res.status(500).json({ error: 'server_error' });
  }
});

app.post('/api/admin/logout', adminAuthMiddleware, (req, res) => {
  const token = getCookie(req, ADMIN_SESSION_COOKIE);
  if (token) {
    adminSessions.delete(token);
  }
  clearAdminSessionCookie(res);
  return res.json({ ok: true });
});

app.get('/api/admin/session', adminAuthMiddleware, (req, res) => {
  return res.json({
    ok: true,
    user: req.adminUser || 'admin'
  });
});

app.get('/admin/export.csv', adminAuthMiddleware, async (req, res) => {
  try{
    const list = await readJsonSafe(NEWS_PATH);
    const rows = ['email,confirmed'].concat((list||[]).map(it => `${it.email},${it.confirmed||''}`));
    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition','attachment; filename="newsletter_export.csv"');
    res.send(rows.join('\n'));
  }catch(e){ logger.error('export error', { error: e.message }); res.status(500).send('server error'); }
});

// simple admin UI
app.get('/admin', adminPageAuthMiddleware, (req, res) => {
  return res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/api/newsletter', adminAuthMiddleware, async (req, res) => {
  try {
    const raw = await fs.readFile(NEWS_PATH, 'utf8');
    const list = JSON.parse(raw || '[]');
    res.json(list);
  } catch (e) {
    res.json([]);
  }
});

// CRM API
app.get('/api/crm/leads', adminAuthMiddleware, async (req, res) => {
  try {
    const leads = await crmStore.listLeads({
      stage: req.query.stage,
      temperature: req.query.temperature,
      search: req.query.search
    });
    return res.json(leads);
  } catch (err) {
    return handleCRMError(res, err, 'crm list error');
  }
});

app.post('/api/crm/leads', adminAuthMiddleware, async (req, res) => {
  try {
    const lead = await crmStore.createLead(req.body || {});
    return res.status(201).json(lead);
  } catch (err) {
    return handleCRMError(res, err, 'crm create error');
  }
});

app.patch('/api/crm/leads/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const lead = await crmStore.patchLead(req.params.id, req.body || {});
    return res.json(lead);
  } catch (err) {
    return handleCRMError(res, err, 'crm patch error');
  }
});

app.delete('/api/crm/leads/:id', adminAuthMiddleware, async (req, res) => {
  try {
    await crmStore.removeLead(req.params.id);
    return res.status(204).send();
  } catch (err) {
    return handleCRMError(res, err, 'crm delete error');
  }
});

app.post('/api/crm/leads/:id/notes', adminAuthMiddleware, async (req, res) => {
  try {
    const lead = await crmStore.addNote(req.params.id, req.body || {});
    return res.json(lead);
  } catch (err) {
    return handleCRMError(res, err, 'crm note error');
  }
});

app.post('/api/crm/leads/:id/interactions', adminAuthMiddleware, async (req, res) => {
  try {
    const lead = await crmStore.addInteraction(req.params.id, req.body || {});
    return res.json(lead);
  } catch (err) {
    return handleCRMError(res, err, 'crm interaction error');
  }
});

app.get('/api/crm/analytics', adminAuthMiddleware, async (req, res) => {
  try {
    const analytics = await crmStore.getAnalytics();
    return res.json(analytics);
  } catch (err) {
    return handleCRMError(res, err, 'crm analytics error');
  }
});

app.get('/admin/crm-export.csv', adminAuthMiddleware, async (req, res) => {
  try {
    const csv = await crmStore.exportCsvRows();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="crm_export.csv"');
    return res.send(csv);
  } catch (err) {
    return handleCRMError(res, err, 'crm csv export error');
  }
});

ensureAdminCredentials()
  .then(() => {
    app.listen(port, () => logger.info('Server running', { url: `http://localhost:${port}`, env: config.nodeEnv }));
  })
  .catch((err) => {
    logger.error('admin credentials init failed', { error: err.message });
    process.exit(1);
  });
