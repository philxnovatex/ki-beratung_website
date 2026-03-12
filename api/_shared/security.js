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

/**
 * Validate that the request originates from an allowed domain.
 * Returns true if origin is valid, false otherwise.
 * Note: This is defense-in-depth. CORS alone doesn't protect against curl/scripts.
 */
function validateOrigin(req) {
  const origin = req.headers.origin || '';
  const referer = req.headers.referer || '';

  // Allow if origin matches
  if (origin && ALLOWED_ORIGINS.includes(origin)) return true;

  // Fallback: check referer header
  if (referer) {
    return ALLOWED_ORIGINS.some(o => referer.startsWith(o));
  }

  // No origin and no referer → might be server-to-server or curl
  // In production, reject. In dev, allow.
  return process.env.VERCEL_ENV !== 'production';
}

// ── Rate Limiting (in-memory, per warm instance) ──────────────────
const rateLimitStore = new Map();

// Clean old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now - entry.windowStart > 120_000) { // 2 min window
      rateLimitStore.delete(key);
    }
  }
}, 300_000);

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
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  return contentLength > maxBytes;
}

module.exports = {
  validateOrigin,
  checkRateLimit,
  getClientIP,
  sanitizeString,
  isValidEmail,
  isBodyTooLarge,
  ALLOWED_ORIGINS,
};
