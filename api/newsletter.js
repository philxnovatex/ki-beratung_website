/**
 * Vercel Serverless Function – Newsletter-Anmeldung mit Double-Opt-In über Brevo
 *
 * Environment Variables (set in Vercel Dashboard):
 *   BREVO_API_KEY             – Brevo (ex-Sendinblue) API key
 *   BREVO_NEWSLETTER_LIST_ID  – ID der Liste "Newsletter" (nur bestätigte Abonnenten)
 *   BREVO_DOI_TEMPLATE_ID     – ID der Double-Opt-In-Vorlage in Brevo
 *
 * Endpoint: POST /api/newsletter
 * Body:     { "email": "user@example.com" }
 *
 * Brevo schickt eine Bestätigungsmail. Erst mit dem Klick auf den Link darin
 * landet die Adresse auf der Newsletter-Liste. Bewusst NICHT die Lead-Liste
 * BREVO_LIST_ID: Whitepaper- und Quiz-Kontakte haben keine Werbeeinwilligung.
 *
 * Security: Origin validation, rate limiting, input validation
 */

const { validateOrigin, checkRateLimit, getClientIP, isValidEmail, isBodyTooLarge, fetchWithTimeout } = require('./_shared/security');

const BREVO_DOI_URL = 'https://api.brevo.com/v3/contacts/doubleOptinConfirmation';
const REDIRECT_URL = 'https://www.neuratex.de/pages/newsletter-bestaetigt.html';

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

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
  // Body size check
  if (isBodyTooLarge(req)) {
    res.status(413).json({ error: 'payload_too_large', message: 'Anfrage zu groß.' });
    return;
  }

  // Origin validation
  if (!validateOrigin(req)) {
    res.status(403).json({ error: 'forbidden', message: 'Zugriff verweigert.' });
    return;
  }

  // Rate limiting (5 requests per minute per IP)
  const rateCheck = checkRateLimit('newsletter:' + getClientIP(req), 5, 60_000);
  res.setHeader('X-RateLimit-Remaining', rateCheck.remaining);

  if (!rateCheck.allowed) {
    res.setHeader('Retry-After', Math.ceil(rateCheck.retryAfterMs / 1000));
    res.status(429).json({ error: 'rate_limited', message: 'Zu viele Anfragen. Bitte versuchen Sie es später.' });
    return;
  }

  // ── Validate input ──────────────────────────────────────────────
  const { email } = req.body || {};

  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'invalid_email', message: 'Bitte eine gültige E-Mail-Adresse angeben.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  // ── Konfiguration ───────────────────────────────────────────────
  // Ohne eigene Liste und Vorlage lieber gar nicht anmelden als ohne Bestätigung.
  const apiKey = (process.env.BREVO_API_KEY || '').trim();
  const listId = parseInt(process.env.BREVO_NEWSLETTER_LIST_ID, 10);
  const templateId = parseInt(process.env.BREVO_DOI_TEMPLATE_ID, 10);
  if (!apiKey || !(listId > 0) || !(templateId > 0)) {
    console.error('[newsletter] Missing or invalid server configuration');
    res.status(503).json({ error: 'server_config_error', message: 'Die Newsletter-Anmeldung ist derzeit nicht verfügbar.' });
    return;
  }

  // ── Call Brevo API ──────────────────────────────────────────────
  try {
    const brevoRes = await fetchWithTimeout(BREVO_DOI_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        email: normalizedEmail,
        includeListIds: [listId],
        templateId,
        redirectionUrl: REDIRECT_URL,
      }),
    });

    // 201 = neuer Kontakt, 204 = Kontakt existiert bereits. Beide Fälle gleich
    // beantworten, damit sich nicht abfragen lässt, wer schon eingetragen ist.
    if (brevoRes.status === 201 || brevoRes.status === 204) {
      res.status(200).json({ ok: true, message: 'Fast geschafft: Bitte bestätigen Sie Ihre Anmeldung über den Link in der E-Mail, die wir Ihnen gerade geschickt haben.' });
      return;
    }

    // Nur Status und Brevos Fehlercode loggen. Die Meldung kann die Adresse enthalten.
    const { code = '' } = await brevoRes.json().catch(() => ({}));
    console.error('[newsletter] Brevo status:', brevoRes.status, String(code));
    res.status(502).json({ error: 'api_error', message: 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es später.' });
  } catch {
    console.error('[newsletter] Brevo request failed');
    res.status(502).json({ error: 'api_error', message: 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es später.' });
  }
};
