/**
 * POST /api/contact: Kontaktanfrage als Transaktionsmail über Brevo.
 * BREVO_API_KEY ist erforderlich. Optional: BREVO_CONTACT_SENDER_EMAIL und
 * CONTACT_RECIPIENT_EMAIL (jeweils Standard: philippkoch@neuratex.de).
 * Der Absender muss in Brevo verifiziert sein. Keine Newsletter-Anmeldung.
 */
const { validateOrigin, checkRateLimit, getClientIP, isValidEmail,
  isBodyTooLarge, fetchWithTimeout, ALLOWED_ORIGINS } = require('./_shared/security');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const contentType = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  const nativeForm = contentType === 'application/x-www-form-urlencoded';
  // Ausschließlich feste Meldungen ausgeben, niemals Formulardaten in HTML einsetzen.
  function reply(status, error, message) {
    res.status(status);
    if (!nativeForm) return res.json(error ? { error, message } : { ok: true, message });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(`<!doctype html><html lang="de"><head><meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Kontakt | Neuratex AI</title><link rel="stylesheet" href="/assets/css/style.css"></head>
      <body><main class="container page-hero"><h1>${error ? 'Nachricht nicht gesendet' : 'Vielen Dank für Ihre Anfrage'}</h1>
      <p>${message}</p><p><a href="/pages/kontakt.html">Zurück zum Kontaktformular</a></p>
      <p><a href="mailto:philippkoch@neuratex.de">philippkoch@neuratex.de</a></p></main></body></html>`);
  }
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return reply(405, 'method_not_allowed', 'Diese Methode wird nicht unterstützt.');
  }
  // Origin-Fallback nur bei fehlendem Origin verwenden, nicht bei einem fremden.
  if (req.headers.origin ? !ALLOWED_ORIGINS.includes(req.headers.origin) : !validateOrigin(req)) {
    return reply(403, 'forbidden', 'Zugriff verweigert.');
  }
  if (isBodyTooLarge(req, 32_000) || isBodyTooLarge({ ...req, headers: {} }, 32_000)) {
    return reply(413, 'payload_too_large', 'Anfrage zu groß. Bitte kürzen Sie Ihre Nachricht.');
  }
  if (!nativeForm && contentType !== 'application/json') {
    return reply(415, 'unsupported_media_type', 'Das Datenformat wird nicht unterstützt.');
  }
  const rate = checkRateLimit('contact:' + getClientIP(req), 5, 60_000);
  res.setHeader('X-RateLimit-Remaining', rate.remaining);
  if (!rate.allowed) {
    res.setHeader('Retry-After', Math.ceil(rate.retryAfterMs / 1000));
    return reply(429, 'rate_limited', 'Zu viele Anfragen. Bitte versuchen Sie es in einer Minute erneut.');
  }
  let body = req.body;
  if (nativeForm && typeof body === 'string') body = Object.fromEntries(new URLSearchParams(body));
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return reply(400, 'invalid_body', 'Bitte füllen Sie das Kontaktformular aus.');
  }
  const { name, email, company = '', message = '', privacy, website = '', domain = '', herkunft = '' } = body;
  if (website !== '') return reply(400, 'invalid_request', 'Anfrage konnte nicht verarbeitet werden.');
  // Pilotanfragen der Landingpage schicken statt einer Nachricht die Website
  // des Interessenten. Dann sind Unternehmen und Website Pflicht, die Nachricht
  // nicht. Das Feld heißt bewusst domain, denn website ist die Spamfalle.
  const pilot = typeof domain === 'string' && domain.trim() !== '';
  // Klartext erhalten, einschließlich Apostrophen und Zeilenumbrüchen. Kein HTML-Versand.
  const validText = (value, max, required) => typeof value === 'string'
    && value.length <= max && (!required || value.trim().length > 0)
    && !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value);
  if (!validText(name, 120, true) || /[\r\n]/.test(name)
    || !validText(company, 140, pilot) || /[\r\n]/.test(company)
    || !validText(domain, 200, false) || /[\r\n]/.test(domain)
    || !validText(message, 5000, !pilot) || !isValidEmail(email)) {
    return reply(400, 'invalid_fields', pilot
      ? 'Bitte prüfen Sie Name, E-Mail, Unternehmen und Website-Adresse.'
      : 'Bitte prüfen Sie Name, E-Mail und Nachricht sowie die angegebenen Zeichenlimits.');
  }
  // Herkunft des Besuchs (UTM-Parameter), vom Skript befüllt. Sie dient nur der
  // Auswertung der Kampagnen. Fehlt sie oder ist sie unbrauchbar, geht die
  // Anfrage trotzdem durch, statt einen echten Interessenten abzuweisen.
  const quelle = typeof herkunft === 'string'
    ? herkunft.replace(/[\x00-\x1f\x7f]+/g, ' ').trim().slice(0, 300) : '';
  if (privacy !== true && !(nativeForm && privacy === 'on')) {
    return reply(400, 'privacy_required', 'Bitte bestätigen Sie die Datenschutzhinweise.');
  }
  const apiKey = process.env.BREVO_API_KEY;
  const sender = process.env.BREVO_CONTACT_SENDER_EMAIL || 'philippkoch@neuratex.de';
  const recipient = process.env.CONTACT_RECIPIENT_EMAIL || 'philippkoch@neuratex.de';
  if (!apiKey || !isValidEmail(sender) || !isValidEmail(recipient)) {
    console.error('[contact] Missing or invalid server configuration');
    return reply(503, 'server_config_error', 'Das Formular ist derzeit nicht verfügbar. Bitte schreiben Sie uns per E-Mail.');
  }
  try {
    const response = await fetchWithTimeout('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify({
        sender: { email: sender.trim(), name: 'Neuratex AI Website' },
        to: [{ email: recipient.trim() }],
        replyTo: { email: email.trim().toLowerCase(), name: name.trim() },
        subject: pilot ? 'Neue Pilotanfrage AI Visibility Audit über neuratex.de' : 'Neue Kontaktanfrage über neuratex.de',
        textContent: [
          ...(pilot ? ['Anfrage: Pilotplatz AI Visibility Audit', ''] : []),
          `Name: ${name.trim()}`, `E-Mail: ${email.trim().toLowerCase()}`,
          `Unternehmen: ${company.trim() || 'Nicht angegeben'}`,
          ...(pilot ? [`Website: ${domain.trim()}`] : []),
          ...(pilot || quelle ? [`Herkunft: ${quelle || 'keine Angabe'}`] : []),
          ...(message.trim() ? ['', 'Nachricht:', message.trim()] : []), '',
          'Datenschutzhinweise bestätigt: ja', `Eingang: ${new Date().toISOString()}`].join('\n'),
      }),
    });
    if (response.status !== 201) {
      console.error('[contact] Brevo status:', response.status);
      return reply(502, 'api_error', 'Übermittlung fehlgeschlagen. Bitte versuchen Sie es später oder schreiben Sie uns per E-Mail.');
    }
    return reply(200, null, pilot
      ? 'Vielen Dank! Ihre Anfrage ist eingegangen. Wir melden uns innerhalb eines Werktags per E-Mail bei Ihnen.'
      : 'Vielen Dank! Ihre Nachricht wurde übermittelt. Wir melden uns per E-Mail bei Ihnen.');
  } catch {
    // Keine Nutzereingaben oder Provider-Antworten in Logs schreiben.
    console.error('[contact] Brevo request failed');
    return reply(502, 'api_error', 'Die Übermittlung konnte nicht bestätigt werden. Bitte versuchen Sie es später oder schreiben Sie uns per E-Mail.');
  }
};
