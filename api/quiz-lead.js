/**
 * Vercel Serverless Function – Lead-Erfassung aus dem KI-Reifegrad-Check
 *
 * Environment Variables (set in Vercel Dashboard):
 *   BREVO_API_KEY        – Brevo (ex-Sendinblue) API key
 *   BREVO_QUIZ_LIST_ID   – Numeric ID der Liste "Reifegrad-Check" (Fallback: BREVO_LIST_ID, dann 5).
 *                          Lead-Listen ohne Werbeeinwilligung, nie für Newsletter nutzen.
 *
 * Endpoint: POST /api/quiz-lead
 * Body:     { "email": "...", "name": "...", "company": "...",
 *             "level": 1|2|3, "levelLabel": "KI-Entdecker", "scorePct": 42,
 *             "subscores": { "Grundlagen": 60, ... } }
 *
 * Hinweis zu Brevo-Attributen: KI_REIFEGRAD, KI_SCORE und KI_CHECK_DATUM müssen im
 * Brevo-Konto als Kontakt-Attribute angelegt sein. Sind sie es nicht, quittiert Brevo
 * den Request mit "invalid_parameter". Wir wiederholen den Aufruf dann ohne die
 * Zusatzattribute, damit der Lead in keinem Fall verloren geht.
 *
 * Security: Origin validation, rate limiting, input sanitization
 */

const { validateOrigin, checkRateLimit, getClientIP, sanitizeString, isValidEmail, isBodyTooLarge, fetchWithTimeout } = require('./_shared/security');

const BREVO_API_URL = 'https://api.brevo.com/v3/contacts';

const LEVEL_LABELS = {
  1: 'KI-Entdecker',
  2: 'KI-Experimentator',
  3: 'KI-Stratege',
};

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

  const rateCheck = checkRateLimit('quiz-lead:' + getClientIP(req), 5, 60_000);
  res.setHeader('X-RateLimit-Remaining', rateCheck.remaining);

  if (!rateCheck.allowed) {
    res.setHeader('Retry-After', Math.ceil(rateCheck.retryAfterMs / 1000));
    res.status(429).json({ error: 'rate_limited', message: 'Zu viele Anfragen. Bitte versuchen Sie es später.' });
    return;
  }

  // ── Validate input ──────────────────────────────────────────────
  const { email, name, company, level, scorePct, subscores } = req.body || {};

  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'invalid_email', message: 'Bitte eine gültige E-Mail-Adresse angeben.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedName = sanitizeString(name).slice(0, 120);
  const normalizedCompany = sanitizeString(company).slice(0, 140);

  // Level darf ausschließlich 1, 2 oder 3 sein – alles andere kommt nicht von unserem Formular.
  const parsedLevel = parseInt(level, 10);
  const safeLevel = LEVEL_LABELS[parsedLevel] ? parsedLevel : 1;

  // Score auf 0..100 begrenzen
  const parsedScore = Number(scorePct);
  const safeScore = Number.isFinite(parsedScore)
    ? Math.max(0, Math.min(100, Math.round(parsedScore)))
    : 0;

  // ── Brevo API Key ───────────────────────────────────────────────
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error('[quiz-lead] BREVO_API_KEY is not set');
    res.status(500).json({ error: 'server_config_error', message: 'Service ist nicht konfiguriert.' });
    return;
  }

  const listId = parseInt(process.env.BREVO_QUIZ_LIST_ID, 10)
    || parseInt(process.env.BREVO_LIST_ID, 10)
    || 5;

  // ── Build Brevo contact payload ─────────────────────────────────
  const baseAttributes = {};
  if (normalizedName) baseAttributes.VORNAME = normalizedName;
  if (normalizedCompany) baseAttributes.FIRMA = normalizedCompany;

  const quizAttributes = {
    KI_REIFEGRAD: LEVEL_LABELS[safeLevel],
    KI_SCORE: safeScore,
    KI_CHECK_DATUM: new Date().toISOString().slice(0, 10),
  };

  try {
    let result = await upsertContact(normalizedEmail, listId, { ...baseAttributes, ...quizAttributes }, apiKey);

    // Fehlende Custom-Attribute im Brevo-Konto dürfen den Lead nicht kosten.
    if (!result.ok && result.retryWithoutQuizAttributes) {
      console.warn('[quiz-lead] Brevo lehnte Zusatzattribute ab, Wiederholung ohne KI_*-Felder. Bitte Attribute in Brevo anlegen.');
      result = await upsertContact(normalizedEmail, listId, baseAttributes, apiKey);
    }

    if (result.ok) {
      // Bewusst ohne E-Mail-Adresse: Logs sind kein geeigneter Ort für
      // personenbezogene Daten, und die Zuordnung passiert ohnehin in Brevo.
      console.log('[quiz-lead] Lead erfasst, Level:', LEVEL_LABELS[safeLevel], 'Score:', safeScore);
      res.status(200).json({ ok: true, message: 'Ihre Auswertung ist unterwegs.' });
      return;
    }

    console.error('[quiz-lead] Brevo error:', result.status, result.detail);
    res.status(502).json({ error: 'api_error', message: 'Übermittlung fehlgeschlagen. Bitte versuchen Sie es später.' });
  } catch (err) {
    console.error('[quiz-lead] Fetch error:', err.message);
    res.status(500).json({ error: 'server_error', message: 'Interner Serverfehler.' });
  }
};

/**
 * Legt einen Brevo-Kontakt an oder aktualisiert ihn und hängt ihn an die Liste.
 * @returns {Promise<{ok: boolean, status?: number, detail?: string, retryWithoutQuizAttributes?: boolean}>}
 */
async function upsertContact(email, listId, attributes, apiKey) {
  const response = await fetchWithTimeout(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({ email, listIds: [listId], attributes, updateEnabled: true }),
  });

  // 201 = neu angelegt, 204 = aktualisiert
  if (response.status === 201 || response.status === 204) {
    return { ok: true };
  }

  if (response.status === 400) {
    const body = await response.json().catch(() => ({}));

    // Kontakt existiert bereits: nur noch der Liste hinzufügen.
    if (body.code === 'duplicate_parameter') {
      try {
        await addExistingContactToList(email, listId, apiKey);
      } catch (e) {
        console.warn('[quiz-lead] Could not add existing contact to list:', e.message);
      }
      return { ok: true };
    }

    // Unbekanntes Attribut im Brevo-Konto
    if (body.code === 'invalid_parameter') {
      return { ok: false, status: 400, detail: String(body.code), retryWithoutQuizAttributes: true };
    }

    // Nur Brevos Fehlercode weitergeben, die Meldung kann die Adresse enthalten.
    return { ok: false, status: 400, detail: String(body.code || 'unknown') };
  }

  return { ok: false, status: response.status, detail: '' };
}

/**
 * If a contact already exists in Brevo, add them to the target list
 */
async function addExistingContactToList(email, listId, apiKey) {
  const url = `https://api.brevo.com/v3/contacts/lists/${listId}/contacts/add`;
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({ emails: [email] }),
  });
  if (!response.ok) {
    // Nur den Status, die Antwort kann die Adresse enthalten.
    throw new Error(`Brevo list-add failed: ${response.status}`);
  }
}
