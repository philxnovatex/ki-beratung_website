/**
 * POST /api/contact: Kontaktanfrage oder Pilotbuchung als Transaktionsmail über Brevo.
 * BREVO_API_KEY ist erforderlich. Optional: BREVO_CONTACT_SENDER_EMAIL und
 * CONTACT_RECIPIENT_EMAIL (jeweils Standard: philippkoch@neuratex.de).
 * Der Absender muss in Brevo verifiziert sein. Keine Newsletter-Anmeldung.
 * Bei einer Pilotbuchung geht zusätzlich eine feste Eingangsbestätigung an den Kunden.
 */
const { validateOrigin, checkRateLimit, getClientIP, isValidEmail,
  isBodyTooLarge, fetchWithTimeout, ALLOWED_ORIGINS } = require('./_shared/security');

// Eingangsbestätigung an den Kunden. Bewusst ohne Formularinhalte: Wer eine
// fremde Adresse einträgt, kann darüber keinen eigenen Text verschicken.
const EINGANGSBESTAETIGUNG = [
  'Guten Tag,',
  '',
  'vielen Dank für Ihre Buchung eines Pilotplatzes für den AI Visibility Audit. Ihre Angaben sind bei uns eingegangen.',
  '',
  'So geht es weiter:',
  '1. Wir prüfen Ihre Angaben und senden Ihnen innerhalb eines Werktags die Auftragsbestätigung per E-Mail. Mit ihr kommt der Auftrag zustande.',
  '2. Die schriftliche Auswertung erhalten Sie innerhalb von drei Werktagen, gezählt ab dem Werktag nach der Auftragsbestätigung.',
  '3. Mit der Auswertung erhalten Sie die Rechnung, zahlbar innerhalb von 14 Tagen. Den Termin für die Besprechung der Ergebnisse stimmen wir mit Ihnen ab.',
  '',
  'Haben Sie diese Buchung nicht selbst vorgenommen, antworten Sie bitte kurz auf diese E-Mail. Wir löschen die Angaben dann.',
  '',
  'Bei Fragen antworten Sie einfach auf diese E-Mail.',
  '',
  'Viele Grüße',
  'Philipp Koch',
  '',
  'Neuratex AI',
  'Pionierstraße 43, 40215 Düsseldorf',
  'www.neuratex.de',
].join('\n');

// Grund einer Ablehnung durch Brevo für das Log: immer nur Brevos Fehlercode,
// bei 401 und 403 zusätzlich die Meldung (betrifft Schlüssel oder IP-Adresse).
// Andere Meldungen können Formularinhalte wiederholen und bleiben draußen.
async function brevoGrund(response) {
  try {
    const { code = '', message = '' } = await response.json();
    return [401, 403].includes(response.status) ? `${code}: ${String(message).slice(0, 200)}` : String(code);
  } catch {
    return '';
  }
}

// Nachrichten-ID einer angenommenen Mail für das Log. Damit lässt sich jede
// Mail in Brevos Protokoll und beim Support eindeutig finden. Keine Inhalte.
async function brevoId(response) {
  try {
    const { messageId = '' } = await response.json();
    return String(messageId).slice(0, 120);
  } catch {
    return '';
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const contentType = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  const nativeForm = contentType === 'application/x-www-form-urlencoded';
  // Pilotbuchung der Landingpage, erkannt am Feld domain (siehe unten).
  let pilot = false;
  // Ausschließlich feste Meldungen ausgeben, niemals Formulardaten in HTML einsetzen.
  function reply(status, error, message) {
    res.status(status);
    if (!nativeForm) return res.json(error ? { error, message } : { ok: true, message });
    const titel = error ? (pilot ? 'Buchung nicht gesendet' : 'Nachricht nicht gesendet')
      : (pilot ? 'Vielen Dank für Ihre Buchung' : 'Vielen Dank für Ihre Anfrage');
    const zurueck = pilot
      ? '<a href="/pages/ki-sichtbarkeit.html#pilot-anfrage">Zurück zum Buchungsformular</a>'
      : '<a href="/pages/kontakt.html">Zurück zum Kontaktformular</a>';
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(`<!doctype html><html lang="de"><head><meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${pilot ? 'Pilotbuchung' : 'Kontakt'} | Neuratex AI</title><link rel="stylesheet" href="/assets/css/style.css"></head>
      <body><main class="container page-hero"><h1>${titel}</h1>
      <p>${message}</p><p>${zurueck}</p>
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
  const { name, email, company = '', message = '', privacy, website = '', domain = '', herkunft = '',
    leistungen = '', kunden = '', markt = '', wettbewerber = '', anschrift = '', unternehmer, referenz } = body;
  if (website !== '') return reply(400, 'invalid_request', 'Anfrage konnte nicht verarbeitet werden.');
  // Pilotbuchungen der Landingpage schicken statt einer Nachricht die Website
  // des Kunden. Dann sind Unternehmen, Website und die Angaben für Messung und
  // Rechnung Pflicht, die Nachricht nicht. Das Feld heißt bewusst domain, denn
  // website ist die Spamfalle.
  pilot = typeof domain === 'string' && domain.trim() !== '';
  // Klartext erhalten, einschließlich Apostrophen und Zeilenumbrüchen. Kein HTML-Versand.
  const validText = (value, max, required) => typeof value === 'string'
    && value.length <= max && (!required || value.trim().length > 0)
    && !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value);
  const validLine = (value, max, required) => validText(value, max, required) && !/[\r\n]/.test(value);
  if (!validLine(name, 120, true) || !validLine(company, 140, pilot) || !validLine(domain, 200, false)
    || !validText(message, 5000, !pilot) || !isValidEmail(email)) {
    return reply(400, 'invalid_fields', pilot
      ? 'Bitte prüfen Sie Name, E-Mail, Unternehmen und Website-Adresse.'
      : 'Bitte prüfen Sie Name, E-Mail und Nachricht sowie die angegebenen Zeichenlimits.');
  }
  if (pilot && (!validText(leistungen, 600, true) || !validLine(kunden, 300, true) || !validLine(markt, 120, true)
    || !validText(wettbewerber, 600, false) || !validText(anschrift, 300, true))) {
    return reply(400, 'invalid_fields', 'Bitte prüfen Sie Ihre Angaben zu Leistungen, Kunden, Markt und Rechnungsanschrift.');
  }
  // Herkunft des Besuchs (UTM-Parameter), vom Skript befüllt. Sie dient nur der
  // Auswertung der Kampagnen. Fehlt sie oder ist sie unbrauchbar, geht die
  // Anfrage trotzdem durch, statt einen echten Interessenten abzuweisen.
  const quelle = typeof herkunft === 'string'
    ? herkunft.replace(/[\x00-\x1f\x7f]+/g, ' ').trim().slice(0, 300) : '';
  const bestaetigt = (value) => value === true || (nativeForm && value === 'on');
  if (!bestaetigt(privacy)) {
    return reply(400, 'privacy_required', 'Bitte bestätigen Sie die Datenschutzhinweise.');
  }
  if (pilot && (!bestaetigt(unternehmer) || !bestaetigt(referenz))) {
    return reply(400, 'terms_required', 'Bitte bestätigen Sie, dass Sie als Unternehmen buchen, und Ihr Einverständnis zu Referenz und Fallstudie.');
  }
  // Beim Einfügen im Dashboard rutschen leicht Leerzeichen oder Umbrüche mit.
  const apiKey = (process.env.BREVO_API_KEY || '').trim();
  const sender = process.env.BREVO_CONTACT_SENDER_EMAIL || 'philippkoch@neuratex.de';
  const recipient = process.env.CONTACT_RECIPIENT_EMAIL || 'philippkoch@neuratex.de';
  if (!apiKey || !isValidEmail(sender) || !isValidEmail(recipient)) {
    console.error('[contact] Missing or invalid server configuration');
    return reply(503, 'server_config_error', 'Das Formular ist derzeit nicht verfügbar. Bitte schreiben Sie uns per E-Mail.');
  }
  const send = (mail, timeoutMs) => fetchWithTimeout('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json', 'api-key': apiKey },
    body: JSON.stringify(mail),
  }, timeoutMs);
  const kunde = email.trim().toLowerCase();
  const eingang = `Eingang: ${new Date().toISOString()}`;
  const text = pilot ? [
    'Pilotbuchung AI Visibility Audit: verbindlich gebucht, Auftragsbestätigung steht aus', '',
    `Name: ${name.trim()}`, `E-Mail: ${kunde}`, `Unternehmen: ${company.trim()}`, `Website: ${domain.trim()}`, '',
    'Wofür empfohlen werden:', leistungen.trim(), '',
    `Kunden: ${kunden.trim()}`, `Markt: ${markt.trim()}`, '',
    'Wettbewerber:', wettbewerber.trim() || 'keine Angabe, aus den Antworten ermitteln', '',
    'Rechnungsanschrift:', company.trim(), anschrift.trim(), '',
    'Bucht als Unternehmer: ja', 'Referenz und Fallstudie nach Freigabe: einverstanden',
    'Datenschutzhinweise bestätigt: ja', `Herkunft: ${quelle || 'keine Angabe'}`, eingang,
  ] : [
    `Name: ${name.trim()}`, `E-Mail: ${kunde}`,
    `Unternehmen: ${company.trim() || 'Nicht angegeben'}`,
    ...(quelle ? [`Herkunft: ${quelle}`] : []),
    ...(message.trim() ? ['', 'Nachricht:', message.trim()] : []), '',
    'Datenschutzhinweise bestätigt: ja', eingang,
  ];
  try {
    const response = await send({
      sender: { email: sender.trim(), name: 'Neuratex AI Website' },
      to: [{ email: recipient.trim() }],
      replyTo: { email: kunde, name: name.trim() },
      subject: pilot ? `Neue Pilotbuchung AI Visibility Audit: ${company.trim()}` : 'Neue Kontaktanfrage über neuratex.de',
      textContent: text.join('\n'),
    });
    if (response.status !== 201) {
      console.error('[contact] Brevo status:', response.status, await brevoGrund(response));
      return reply(502, 'api_error', 'Übermittlung fehlgeschlagen. Bitte versuchen Sie es später oder schreiben Sie uns per E-Mail.');
    }
    console.log('[contact] Brevo angenommen, Mail an uns:', await brevoId(response));
  } catch {
    // Keine Nutzereingaben oder Provider-Antworten in Logs schreiben.
    console.error('[contact] Brevo request failed');
    return reply(502, 'api_error', 'Die Übermittlung konnte nicht bestätigt werden. Bitte versuchen Sie es später oder schreiben Sie uns per E-Mail.');
  }
  if (!pilot) return reply(200, null, 'Vielen Dank! Ihre Nachricht wurde übermittelt. Wir melden uns per E-Mail bei Ihnen.');
  // Die Buchung liegt jetzt bei uns. Scheitert die Eingangsbestätigung, bleibt
  // die Buchungsanfrage eingegangen, die Meldung verspricht dann nur keine Bestätigungsmail.
  // Kurzes Zeitlimit, damit beide Aufrufe unter den 15 Sekunden des Browsers bleiben.
  let eingangsmail = false;
  try {
    const response = await send({
      sender: { email: sender.trim(), name: 'Philipp Koch, Neuratex AI' },
      to: [{ email: kunde }],
      replyTo: { email: recipient.trim(), name: 'Philipp Koch' },
      subject: 'Eingang Ihrer Buchung: Pilotplatz AI Visibility Audit',
      textContent: EINGANGSBESTAETIGUNG,
    }, 4000);
    eingangsmail = response.status === 201;
    if (eingangsmail) console.log('[contact] Brevo angenommen, Eingangsbestätigung:', await brevoId(response));
    else console.error('[contact] Eingangsbestätigung Brevo status:', response.status, await brevoGrund(response));
  } catch {
    console.error('[contact] Eingangsbestätigung fehlgeschlagen');
  }
  return reply(200, null, eingangsmail
    ? 'Vielen Dank! Ihre Buchung ist eingegangen. Sie erhalten eine Eingangsbestätigung per E-Mail und innerhalb eines Werktags unsere Auftragsbestätigung.'
    : 'Vielen Dank! Ihre Buchung ist eingegangen. Sie erhalten innerhalb eines Werktags unsere Auftragsbestätigung per E-Mail.');
};
