/**
 * Vercel Serverless Function – Newsletter Signup via Brevo API
 *
 * Environment Variables (set in Vercel Dashboard):
 *   BREVO_API_KEY   – Brevo (ex-Sendinblue) API key
 *   BREVO_LIST_ID   – Numeric ID of the "Website Leads" list (default: 5)
 *
 * Endpoint: POST /api/newsletter
 * Body:     { "email": "user@example.com" }
 */

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

  // ── Validate input ──────────────────────────────────────────────
  const { email } = req.body || {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(String(email).trim())) {
    res.status(400).json({ error: 'invalid_email', message: 'Bitte eine gültige E-Mail-Adresse angeben.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  // ── Brevo API Key ───────────────────────────────────────────────
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error('[newsletter] BREVO_API_KEY is not set');
    res.status(500).json({ error: 'server_config_error', message: 'Newsletter-Service ist nicht konfiguriert.' });
    return;
  }

  const listId = parseInt(process.env.BREVO_LIST_ID, 10) || 5;

  // ── Call Brevo API ──────────────────────────────────────────────
  try {
    const brevoRes = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        email: normalizedEmail,
        listIds: [listId],
        updateEnabled: true,
      }),
    });

    // Brevo returns 201 for new contacts, 204 for updated contacts
    if (brevoRes.status === 201 || brevoRes.status === 204) {
      res.status(200).json({ ok: true, message: 'Erfolgreich eingetragen!' });
      return;
    }

    // Handle "Contact already exists" (duplicate) – still a success from user perspective
    if (brevoRes.status === 400) {
      const errorBody = await brevoRes.json().catch(() => ({}));
      if (errorBody.code === 'duplicate_parameter') {
        // Contact exists → make sure they're on the list
        try {
          await addExistingContactToList(normalizedEmail, listId, apiKey);
        } catch (e) {
          console.warn('[newsletter] Could not add existing contact to list:', e.message);
        }
        res.status(200).json({ ok: true, message: 'Sie sind bereits eingetragen.' });
        return;
      }
      console.error('[newsletter] Brevo API error:', errorBody);
      res.status(502).json({ error: 'api_error', message: 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es später.' });
      return;
    }

    const errorText = await brevoRes.text().catch(() => '');
    console.error('[newsletter] Brevo unexpected status:', brevoRes.status, errorText);
    res.status(502).json({ error: 'api_error', message: 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es später.' });
  } catch (err) {
    console.error('[newsletter] Fetch error:', err.message);
    res.status(500).json({ error: 'server_error', message: 'Interner Serverfehler.' });
  }
};

/**
 * If a contact already exists in Brevo, add them to the target list
 * POST https://api.brevo.com/v3/contacts/lists/{listId}/contacts/add
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
