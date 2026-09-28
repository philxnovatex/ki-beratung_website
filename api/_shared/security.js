/**
 * Shared security utilities for Vercel Serverless Functions
 *
 * Features:
 *   - Origin validation (only allow requests from neuratex.de)
 *   - In-memory rate limiting (per IP, survives warm instances)
 *   - Input sanitization (strip HTML/script tags)
 *   - Stricter email validation
 */

// ── Allowed origins ───────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://neuratex.de',
  'https://www.neuratex.de',
];

// In development, also allow localhost
if (process.env.VERCEL_ENV !== 'production') {
  ALLOWED_ORIGINS.push('http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:3000');
}

// In einer Vercel-Vorschau zusätzlich genau die eigene Adresse dieser Vorschau
// zulassen, damit sich Formulare dort mit echtem Versand testen lassen. Vercel
// setzt beide Variablen selbst. Andere Vorschauen und fremde Domains bleiben
// gesperrt, die Vorschau selbst ist durch den Vercel-Login geschützt.
if (process.env.VERCEL_ENV === 'preview') {
  for (const host of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) {
    if (host && /^[a-z0-9.-]+\.vercel\.app$/.test(host)) ALLOWED_ORIGINS.push('https://' + host);
  }
}

/**
 * Validate that the request originates from an allowed domain.
 * Returns true if origin is valid, false otherwise.
 * Note: This is defense-in-depth. CORS alone doesn't protect against curl/scripts.
 */
function validateOrigin(req) {
  const origin = req.headers.origin || '';
  const referer = req.headers.referer || '';

  // Ist ein Origin gesetzt, entscheidet allein er. Ein fremder Origin darf
  // nicht über einen passenden Referer doch noch durchkommen.
  if (origin) return ALLOWED_ORIGINS.includes(origin);

  // Fallback nur ohne Origin: check referer header.
  // Wichtig: Vergleich über den geparsten Origin, nicht über startsWith().
  // startsWith('https://neuratex.de') passt sonst auch auf
  // https://neuratex.de.angreifer.example/ und lässt fremde Hosts durch.
  if (referer) {
    try {
      return ALLOWED_ORIGINS.includes(new URL(referer).origin);
    } catch {
      return false; // unparsbarer Referer
    }
  }

  // No origin and no referer → might be server-to-server or curl
  // In production, reject. In dev, allow.
  return process.env.VERCEL_ENV !== 'production';
}

// ── Rate Limiting (in-memory, per warm instance) ──────────────────
const rateLimitStore = new Map();

// Clean old entries every 5 minutes.
// unref(): Ohne das hält der Timer den Event-Loop offen und verhindert, dass eine
// Lambda-Instanz sauber einfriert bzw. ein Node-Prozess terminiert.
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now - entry.windowStart > 120_000) { // 2 min window
      rateLimitStore.delete(key);
    }
  }
}, 300_000);

if (typeof cleanupTimer.unref === 'function') cleanupTimer.unref();

/**
 * Check rate limit for an IP address.
 * @param {string} ip
 * @param {number} maxRequests - Max requests per window (default: 10)
 * @param {number} windowMs - Window size in ms (default: 60000 = 1 min)
 * @returns {{ allowed: boolean, remaining: number, retryAfterMs: number }}
 */
function checkRateLimit(ip, maxRequests = 10, windowMs = 60_000) {
  const now = Date.now();
  const key = ip || 'unknown';

  let entry = rateLimitStore.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    // New or expired window
    entry = { windowStart: now, count: 1 };
    rateLimitStore.set(key, entry);
    return { allowed: true, remaining: maxRequests - 1, retryAfterMs: 0 };
  }

  entry.count++;

  if (entry.count > maxRequests) {
    const retryAfterMs = windowMs - (now - entry.windowStart);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  return { allowed: true, remaining: maxRequests - entry.count, retryAfterMs: 0 };
}

/**
 * Get client IP from Vercel headers.
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || 'unknown';
}

// ── Input Sanitization ────────────────────────────────────────────

/**
 * Strip HTML tags and dangerous characters from a string.
 * Prevents stored XSS when values are displayed in Brevo Dashboard or emails.
 */
function sanitizeString(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '')           // Strip HTML tags
    .replace(/[<>"'`]/g, '')           // Remove remaining dangerous chars
    .replace(/javascript:/gi, '')      // Remove JS URI scheme
    .replace(/on\w+\s*=/gi, '')        // Remove event handlers (onerror=, onclick=, etc.)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')  // Remove control characters
    .trim();
}

// ── Email Validation ──────────────────────────────────────────────

/**
 * Stricter email regex:
 * - At least 1 char before @
 * - Domain with at least one dot
 * - TLD at least 2 chars
 * - Max 254 chars total (RFC 5321)
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  return trimmed.length <= 254 && EMAIL_REGEX.test(trimmed);
}

// ── Request body size check ───────────────────────────────────────

/**
 * Check if the request body is suspiciously large.
 * Vercel limits body to 5MB by default, but we want a tighter limit.
 */
function isBodyTooLarge(req, maxBytes = 10_000) {
  const raw = req.headers['content-length'];
  const contentLength = parseInt(raw, 10);

  // Fehlender oder unlesbarer Header darf die Prüfung nicht aushebeln:
  // dann anhand des bereits geparsten Body entscheiden.
  if (!Number.isFinite(contentLength)) {
    if (req.body === undefined || req.body === null) return false;
    try {
      const size = Buffer.byteLength(
        typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
        'utf8'
      );
      return size > maxBytes;
    } catch {
      return true; // nicht serialisierbar → im Zweifel ablehnen
    }
  }

  return contentLength > maxBytes;
}

/**
 * fetch mit Timeout. Ohne Limit kann ein haengender Brevo-Aufruf die Function
 * bis zum Vercel-Timeout blockieren und den Nutzer ohne Rueckmeldung lassen.
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  validateOrigin,
  checkRateLimit,
  getClientIP,
  sanitizeString,
  isValidEmail,
  isBodyTooLarge,
  fetchWithTimeout,
  ALLOWED_ORIGINS,
};
