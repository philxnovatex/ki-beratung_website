/**
 * Vercel Serverless Function – Whitepaper Lead Capture via Brevo API
 *
 * Environment Variables (set in Vercel Dashboard):
 *   BREVO_API_KEY   – Brevo (ex-Sendinblue) API key
 *   BREVO_LIST_ID   – Numeric ID of the "Website Leads" list (default: 5)
 *
 * Endpoint: POST /api/whitepaper
 * Body:     { "email": "user@example.com", "name": "Max Mustermann", "company": "Firma GmbH" }
 *
 * Speichert den Kontakt in Brevo mit Attributen (VORNAME, FIRMA)
 * und dem Tag "whitepaper-download" für spätere Segmentierung.
 *
 * Security: Origin validation, rate limiting, input sanitization
 */

const { validateOrigin, checkRateLimit, getClientIP, sanitizeString, isValidEmail, isBodyTooLarge } = require('./_shared/security');

const BREVO_API_URL = 'https://api.brevo.com/v3/contacts';

module.exports = async function handler(req, res) {
  // CORS pre-flight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  // ── Security checks ────────────────────────────────────────────
  if (isBodyTooLarge(req)) {
    res.status(413).json({ error: 'payload_too_large', message: 'Anfrage zu groß.' });
    return;
  }

  if (!validateOrigin(req)) {
    res.status(403).json({ error: 'forbidden', message: 'Zugriff verweigert.' });
    return;
  }

  const clientIP = getClientIP(req);
  const rateCheck = checkRateLimit(clientIP, 5, 60_000);
  res.setHeader('X-RateLimit-Remaining', rateCheck.remaining);

  if (!rateCheck.allowed) {
    res.setHeader('Retry-After', Math.ceil(rateCheck.retryAfterMs / 1000));
    res.status(429).json({ error: 'rate_limited', message: 'Zu viele Anfragen. Bitte versuchen Sie es später.' });
    return;
  }

  // ── Validate input ──────────────────────────────────────────────
  const { email, name, company } = req.body || {};

  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'invalid_email', message: 'Bitte eine gültige E-Mail-Adresse angeben.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedName = sanitizeString(name).slice(0, 120);
  const normalizedCompany = sanitizeString(company).slice(0, 140);

  // ── Brevo API Key ───────────────────────────────────────────────
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error('[whitepaper] BREVO_API_KEY is not set');
    res.status(500).json({ error: 'server_config_error', message: 'Service ist nicht konfiguriert.' });
    return;
  }

  const listId = parseInt(process.env.BREVO_LIST_ID, 10) || 5;

  // ── Build Brevo contact payload ─────────────────────────────────
  const attributes = {};
  if (normalizedName) attributes.VORNAME = normalizedName;
  if (normalizedCompany) attributes.FIRMA = normalizedCompany;

  const contactPayload = {
    email: normalizedEmail,
    listIds: [listId],
    attributes,
    updateEnabled: true,
  };

  // ── Call Brevo API ──────────────────────────────────────────────
  try {
    const brevoRes = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(contactPayload),
    });

    if (brevoRes.status === 201 || brevoRes.status === 204) {
      res.status(200).json({ ok: true, message: 'Vielen Dank! Ihr Download startet gleich.' });
      return;
    }

    // Handle duplicate contact
    if (brevoRes.status === 400) {
      const errorBody = await brevoRes.json().catch(() => ({}));
      if (errorBody.code === 'duplicate_parameter') {
        try {
          await addExistingContactToList(normalizedEmail, listId, apiKey);
        } catch (e) {
          console.warn('[whitepaper] Could not add existing contact to list:', e.message);
        }
        res.status(200).json({ ok: true, message: 'Vielen Dank! Ihr Download startet gleich.' });
        return;
      }
      console.error('[whitepaper] Brevo API error:', errorBody);
      res.status(502).json({ error: 'api_error', message: 'Anfrage fehlgeschlagen. Bitte versuchen Sie es später.' });
      return;
    }

    const errorText = await brevoRes.text().catch(() => '');
    console.error('[whitepaper] Brevo unexpected status:', brevoRes.status, errorText);
    res.status(502).json({ error: 'api_error', message: 'Anfrage fehlgeschlagen. Bitte versuchen Sie es später.' });
  } catch (err) {
    console.error('[whitepaper] Fetch error:', err.message);
    res.status(500).json({ error: 'server_error', message: 'Interner Serverfehler.' });
  }
};

/**
 * If a contact already exists in Brevo, add them to the target list
 */
async function addExistingContactToList(email, listId, apiKey) {
  const url = `https://api.brevo.com/v3/contacts/lists/${listId}/contacts/add`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({ emails: [email] }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Brevo list-add failed: ${response.status} ${body}`);
  }
}
