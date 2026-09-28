const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const contact = require('../api/contact');

function checkCopy() {
  const hits = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'vendor') continue;
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (/\.(html|js)$/.test(file)) {
        const source = fs.readFileSync(file, 'utf8')
          .replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/^\s*\/\/.*$/gm, '');
        if (/[\u2013\u2014]|&[mn]dash;|&#(?:8211|8212);|&#x201[34];|\\u201[34]/i.test(source)) hits.push(file);
      }
    }
  }
  walk(path.join(__dirname, '../public'));
  assert.deepEqual(hits, [], 'Gedankenstriche in Website-Texten');
  console.log('  OK    Website-Texte ohne Gedankenstriche (HTML und eigenes JavaScript)');
}

// Vercel-Vorschau: nur die eigene Adresse der Vorschau zusätzlich zulassen,
// nie eine andere Vorschau. Das Modul liest die Umgebung beim Laden, daher
// wird es hier mit gesetzten Variablen frisch geladen.
function checkPreviewOrigin() {
  const keys = ['VERCEL_ENV', 'VERCEL_URL', 'VERCEL_BRANCH_URL'];
  const original = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const modul = require.resolve('../api/_shared/security');
  const laden = (env) => {
    for (const key of keys) {
      if (env[key] === undefined) delete process.env[key];
      else process.env[key] = env[key];
    }
    delete require.cache[modul];
    return require(modul).ALLOWED_ORIGINS;
  };
  try {
    const vorschau = laden({ VERCEL_ENV: 'preview', VERCEL_URL: 'ki-beratung-website-abc123-team.vercel.app',
      VERCEL_BRANCH_URL: 'ki-beratung-website-git-feat-team.vercel.app' });
    assert.ok(vorschau.includes('https://ki-beratung-website-abc123-team.vercel.app'));
    assert.ok(vorschau.includes('https://ki-beratung-website-git-feat-team.vercel.app'));
    assert.ok(!vorschau.includes('https://andere-vorschau.vercel.app'));
    assert.ok(!laden({ VERCEL_ENV: 'preview', VERCEL_URL: 'evil.example/x' }).some(o => o.includes('evil')));
    const live = laden({ VERCEL_ENV: 'production', VERCEL_URL: 'ki-beratung-website-abc123-team.vercel.app' });
    assert.deepEqual(live, ['https://neuratex.de', 'https://www.neuratex.de']);
    console.log('  OK    Vorschau lässt nur ihre eigene Adresse zu, live nur neuratex.de');
  } finally {
    laden(original);
  }
}

async function checkEndpoint() {
  const originalFetch = global.fetch;
  const keys = ['BREVO_API_KEY', 'BREVO_CONTACT_SENDER_EMAIL', 'CONTACT_RECIPIENT_EMAIL'];
  const originalEnv = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  let calls = [];
  let ip = 0;
  const valid = { name: "Alex O'Connor", email: 'alex@example.com', company: '', message: 'KI-Strategie\nBitte um Rückmeldung.', privacy: true };
  const request = async (body = valid, options = {}) => {
    const { headers = {}, ...rest } = options;
    const req = { method: 'POST', body, ...rest, headers: {
      origin: 'https://neuratex.de', 'content-type': 'application/json',
      'x-forwarded-for': 'contact-test-' + (++ip), ...headers,
    } };
    const res = { headers: {}, statusCode: 0,
      setHeader(key, value) { this.headers[key] = value; },
      status(code) { this.statusCode = code; return this; },
      json(value) { this.body = value; return this; },
      send(value) { this.body = value; return this; }, end() { return this; },
    };
    await contact(req, res);
    return res;
  };
  try {
    process.env.BREVO_API_KEY = 'test-key-not-a-secret';
    delete process.env.BREVO_CONTACT_SENDER_EMAIL;
    delete process.env.CONTACT_RECIPIENT_EMAIL;
    global.fetch = async (url, options) => {
      calls.push({ url, ...JSON.parse(options.body) });
      return { status: 201 };
    };
    assert.equal((await request()).body.ok, true);
    assert.equal(calls[0].url, 'https://api.brevo.com/v3/smtp/email');
    assert.equal(calls[0].to[0].email, 'philippkoch@neuratex.de');
    assert.equal(calls[0].sender.email, 'philippkoch@neuratex.de');
    assert.deepEqual(calls[0].replyTo, { email: valid.email, name: valid.name });
    assert.ok(calls[0].textContent.includes(valid.message));
    assert.equal(calls[0].htmlContent, undefined);
    // Pilotbuchung der Landingpage: Website-Adresse statt Nachricht, Angaben für
    // Messung und Rechnung, Herkunft der Anzeige. Danach geht eine feste
    // Eingangsbestätigung an den Kunden. Die Spamfalle heißt weiterhin "website".
    // Datenschutz ist bei der Buchung ein Hinweis, kein Häkchen: kein privacy-Feld.
    const pilot = { name: 'Alex Test', email: 'Alex@Example.com', company: 'Beispiel GmbH',
      domain: 'www.beispiel.de', herkunft: 'utm_source=chatgpt; utm_campaign=pilot',
      leistungen: 'Industriewartung, Ersatzteile', kunden: 'Maschinenbauer, 50 bis 500 Mitarbeitende',
      markt: 'DACH', region: '', wettbewerber: '', strasse: 'Musterstraße 1', plz: '40210', ort: 'Düsseldorf',
      bestaetigung: true };
    calls = [];
    const gebucht = await request(pilot);
    assert.equal(gebucht.statusCode, 200);
    assert.match(gebucht.body.message, /Eingangsbestätigung/);
    assert.equal(calls.length, 2, 'Buchung an uns, Eingangsbestätigung an den Kunden');
    const [intern, eingang] = calls;
    assert.deepEqual(intern.to, [{ email: 'philippkoch@neuratex.de' }]);
    assert.equal(intern.replyTo.email, 'alex@example.com');
    assert.equal(intern.subject, 'Neue Pilotbuchung AI Visibility Audit: Beispiel GmbH');
    for (const zeile of ['Website: www.beispiel.de', 'Leistungen: Industriewartung, Ersatzteile',
      'Kunden: Maschinenbauer, 50 bis 500 Mitarbeitende', 'Markt: Deutschland, Österreich, Schweiz',
      'keine Angabe, aus den Antworten ermitteln', 'Rechnungsanschrift:\nBeispiel GmbH\nMusterstraße 1\n40210 Düsseldorf',
      'Bucht als Unternehmer, Referenz und Fallstudie nach Freigabe: bestätigt',
      'Herkunft: utm_source=chatgpt; utm_campaign=pilot']) {
      assert.ok(intern.textContent.includes(zeile), 'Mail an uns enthält: ' + zeile);
    }
    assert.ok(!intern.textContent.includes('Nachricht:'));
    assert.deepEqual(eingang.to, [{ email: 'alex@example.com' }]);
    assert.deepEqual(eingang.replyTo, { email: 'philippkoch@neuratex.de', name: 'Philipp Koch' });
    assert.equal(eingang.htmlContent, undefined);
    for (const wert of ['Alex', 'Beispiel', 'beispiel.de', 'Industriewartung', 'Maschinenbauer', 'Musterstraße']) {
      assert.ok(!eingang.textContent.includes(wert) && !eingang.subject.includes(wert), 'Keine Formularinhalte in der Eingangsbestätigung: ' + wert);
    }
    calls = [];
    assert.equal((await request({ ...pilot, markt: 'Region', region: 'NRW' })).statusCode, 200);
    assert.ok(calls[0].textContent.includes('Markt: Region: NRW'));
    calls = [];
    assert.equal((await request({ ...pilot, herkunft: { x: 1 } })).statusCode, 200, 'Unbrauchbare Herkunft weist niemanden ab');
    assert.ok(calls[0].textContent.includes('Herkunft: keine Angabe'));
    calls = [];
    assert.equal((await request({ ...pilot, herkunft: 'x\r\nBcc: y@example.com' })).statusCode, 200);
    assert.ok(calls[0].textContent.includes('Herkunft: x Bcc: y@example.com'));
    calls = [];
    const nativePilot = await request(new URLSearchParams({ ...pilot, bestaetigung: 'on' }).toString(), { headers: { 'content-type': 'application/x-www-form-urlencoded' } });
    assert.equal(nativePilot.statusCode, 200);
    assert.match(nativePilot.body, /Vielen Dank für Ihre Buchung/);
    assert.match(nativePilot.body, /ki-sichtbarkeit\.html#pilot-anfrage/);
    assert.ok(!/beispiel|Industriewartung/i.test(nativePilot.body), 'Kein Echo personenbezogener Daten');
    assert.equal(calls.length, 2);
    assert.ok(calls[0].textContent.includes('Website: www.beispiel.de'));
    // Scheitert nur die Eingangsbestätigung, bleibt die Buchungsanfrage eingegangen. Die
    // Meldung verspricht dann keine Bestätigungsmail.
    const brevo = global.fetch;
    for (const zweiterAufruf of [async () => ({ status: 400 }), async () => { throw new Error('Simulierter Timeout'); }]) {
      let erster = true;
      global.fetch = async (...args) => {
        if (!erster) return zweiterAufruf();
        erster = false;
        return brevo(...args);
      };
      const ohneEingang = await request(pilot);
      assert.equal(ohneEingang.statusCode, 200, 'Buchungsanfrage bleibt ohne Eingangsbestätigung eingegangen');
      assert.doesNotMatch(ohneEingang.body.message, /Eingangsbestätigung/);
    }
    global.fetch = brevo;
    calls = [];
    for (const patch of [ { name: '' }, { name: ' '.repeat(3) }, { name: 'A'.repeat(121) },
      { name: 'A\r\nBcc: x@example.com' }, { email: 'invalid' }, { email: ['x@example.com'] },
      { company: {} }, { company: 'A'.repeat(141) }, { message: '' }, { message: 'A'.repeat(5001) },
      { message: '\u0000' }, { privacy: false }, { privacy: 'true' }, { website: 'https://spam.example' } ]) {
      assert.equal((await request({ ...valid, ...patch })).statusCode, 400, JSON.stringify(patch));
    }
    for (const patch of [ { company: '' }, { company: '  ' }, { domain: 'a\nb' }, { domain: 'x'.repeat(201) },
      { domain: '' }, { domain: ['www.beispiel.de'] }, { website: 'https://spam.example' },
      { leistungen: '' }, { leistungen: '  ' }, { leistungen: 'x'.repeat(601) }, { leistungen: ['x'] },
      { leistungen: 'a\nb' }, { kunden: '' }, { kunden: 'a\nb' }, { markt: '' }, { markt: {} },
      { markt: 'Mond' }, { markt: 'hasOwnProperty' }, { markt: 'Region', region: '' }, { markt: 'Region', region: 'a\nb' },
      { wettbewerber: 'x'.repeat(601) }, { strasse: '' }, { strasse: 'x'.repeat(121) }, { plz: '' }, { plz: '1' },
      { plz: '40210!' }, { plz: 40210 }, { ort: '' }, { ort: 'a\nb' },
      { bestaetigung: false }, { bestaetigung: 'on' }, { bestaetigung: undefined }, { bestaetigung: 'true' } ]) {
      assert.equal((await request({ ...pilot, ...patch })).statusCode, 400, 'Pilot ' + JSON.stringify(patch));
    }
    for (const body of [null, [], 'malformed']) assert.equal((await request(body)).statusCode, 400);
    assert.equal((await request(valid, { method: 'GET' })).statusCode, 405);
    assert.equal((await request(valid, { method: 'OPTIONS' })).statusCode, 204);
    assert.equal((await request(valid, { headers: { origin: 'https://evil.example', referer: 'https://neuratex.de/' } })).statusCode, 403);
    assert.equal((await request(valid, { headers: { 'content-length': '40000' } })).statusCode, 413);
    assert.equal((await request({ ...valid, message: 'x'.repeat(40000) }, { headers: { 'content-length': '1' } })).statusCode, 413);
    assert.equal((await request(valid, { headers: { 'content-type': 'text/plain' } })).statusCode, 415);
    assert.equal(calls.length, 0, 'Ungültige Anfragen dürfen Brevo nicht erreichen');
    const native = await request(new URLSearchParams({ ...valid, privacy: 'on' }).toString(), { headers: { 'content-type': 'application/x-www-form-urlencoded' } });
    assert.equal(native.statusCode, 200);
    assert.match(native.body, /Nachricht wurde übermittelt/);
    assert.ok(!native.body.includes(valid.email), 'Kein Echo personenbezogener Daten');
    assert.equal((await request({ ...valid, message: '😀'.repeat(2500) })).statusCode, 200);
    for (let n = 0; n < 5; n++) assert.equal((await request(valid, { headers: { 'x-forwarded-for': 'rate-test' } })).statusCode, 200);
    const rate = await request(valid, { headers: { 'x-forwarded-for': 'rate-test' } });
    assert.equal(rate.statusCode, 429);
    assert.ok(rate.headers['Retry-After'] > 0);
    delete process.env.BREVO_API_KEY;
    assert.equal((await request()).statusCode, 503);
    process.env.BREVO_API_KEY = 'test-key-not-a-secret';
    global.fetch = async () => ({ status: 400 });
    assert.equal((await request()).statusCode, 502);
    global.fetch = async () => { throw new Error('Simulierter Timeout'); };
    assert.equal((await request()).statusCode, 502);
    console.log('  OK    Kontakt-API: Versandpayload, Pilotbuchung mit Eingangsbestätigung, Validierung, Datenschutz, Origin, Größenlimit, Rate-Limit, Fehler und Versand ohne JS');
  } finally {
    global.fetch = originalFetch;
    for (const key of keys) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  }
}

async function checkBrowser(browser, base) {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  await context.route('https://cloud.umami.is/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await context.route('**/_vercel/insights/script.js', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await context.route('https://calendly.com/**', route => route.fulfill({ body: 'Test calendar' }));
  await context.addInitScript(() => {
    window.__events = [];
    window.umami = { track: (...args) => { window.__events.push(args); return Promise.resolve(); } };
  });
  const page = await context.newPage();
  const jsErrors = [];
  page.on('pageerror', error => jsErrors.push(error.message));
  const events = () => page.evaluate(() => window.__events);
  async function open(url) {
    await page.goto(base + url, { waitUntil: 'networkidle' });
    const accept = page.getByRole('button', { name: 'Nur notwendige', exact: true });
    if (await accept.isVisible()) await accept.click();
  }
  try {
    await open('/pages/kontakt.html');
    let payload;
    let requests = 0;
    let success = false;
    await page.route('**/api/contact', async route => {
      requests++;
      payload = route.request().postDataJSON();
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.fulfill({ status: success ? 200 : 502, contentType: 'application/json', body: JSON.stringify(success ? { ok: true } : { error: 'api_error', message: 'Bitte später erneut versuchen.' }) });
    });
    await page.locator('#contact-form button').click();
    assert.equal(requests, 0);
    await page.locator('#contact-name').fill('Alex Test');
    await page.locator('#contact-email').fill('alex@example.com');
    await page.locator('#contact-company').fill('Beispielfirma');
    await page.locator('#contact-message').fill('Wir möchten eine KI-Strategie entwickeln.');
    await page.locator('#contact-form button').click();
    assert.equal(requests, 0, 'Datenschutz ist Pflicht');
    await page.locator('#contact-privacy').check();
    await page.locator('#contact-form button').click();
    await page.waitForFunction(() => document.querySelector('#contact-status').dataset.state === 'error');
    assert.equal(await page.locator('#contact-name').inputValue(), 'Alex Test');
    assert.deepEqual(await events(), []);
    success = true;
    await page.locator('#contact-form button').click();
    await page.locator('#contact-form').dispatchEvent('submit');
    await page.waitForFunction(() => document.querySelector('#contact-status').dataset.state === 'success');
    assert.equal(requests, 2, 'Kein doppelter Request während Übermittlung');
    assert.equal(payload.privacy, true);
    assert.equal(payload.message, 'Wir möchten eine KI-Strategie entwickeln.');
    assert.equal(await page.locator('#contact-name').inputValue(), '');
    assert.equal(await page.locator('#contact-status').evaluate(el => document.activeElement === el), true);
    assert.deepEqual(await events(), [['form_complete', { form: 'contact' }]]);

    fs.mkdirSync(path.join(__dirname, '../.cache/contact-qa'), { recursive: true });
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.screenshot({ path: path.join(__dirname, `../.cache/contact-qa/${width}.png`), fullPage: true });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Kontaktseite ${width}px ohne Überlauf`);
    }

    // Landingpage: Pilotanfrage mit Website-Adresse und Herkunft der Anzeige.
    // Dasselbe Skript wie die Kontaktseite oben. Bewusst ohne ".html": Der
    // lokale serve-Server leitet .html auf die saubere Adresse um und verwirft
    // dabei die Parameter. Vercel liefert .html direkt aus, dort bleiben sie.
    await open('/pages/ki-sichtbarkeit?utm_source=chatgpt&utm_medium=paid&utm_campaign=pilot-audit');
    requests = 0;
    const buchung = { name: 'Alex Test', email: 'alex@example.com', company: 'Beispiel GmbH',
      leistungen: 'Industriewartung', kunden: 'Maschinenbauer', strasse: 'Musterstraße 1', plz: '40210', ort: 'Düsseldorf' };
    assert.equal(await page.locator('#contact-region').isVisible(), false, 'Region nur bei Auswahl Region');
    for (const [key, value] of Object.entries(buchung)) await page.locator('#contact-' + key).fill(value);
    await page.locator('#contact-bestaetigung').check();
    await page.locator('#contact-form button').click();
    assert.equal(requests, 0, 'Website-Adresse ist Pflicht');
    await page.locator('#contact-domain').fill('www.beispiel.de');
    await page.locator('#contact-markt').selectOption('Region');
    await page.locator('#contact-form button').click();
    assert.equal(requests, 0, 'Bei Auswahl Region ist die Region Pflicht');
    await page.locator('#contact-region').fill('NRW');
    await page.locator('#contact-bestaetigung').uncheck();
    await page.locator('#contact-form button').click();
    assert.equal(requests, 0, 'Bestätigung als Unternehmen und zu Referenz ist Pflicht');
    await page.locator('#contact-bestaetigung').check();
    await page.locator('#contact-form button').click();
    await page.waitForFunction(() => document.querySelector('#contact-status').dataset.state === 'success');
    assert.equal(requests, 1);
    assert.deepEqual(payload, { ...buchung, domain: 'www.beispiel.de', message: '', wettbewerber: '',
      markt: 'Region', region: 'NRW', herkunft: 'utm_source=chatgpt; utm_medium=paid; utm_campaign=pilot-audit',
      website: '', privacy: false, bestaetigung: true });
    assert.equal(await page.locator('#contact-region').isVisible(), false, 'Nach dem Absenden wieder Deutschland');
    // Formularbeginn genau einmal, trotz vieler Eingaben, für die Abbruchquote.
    assert.deepEqual(await events(), [['form_start', { form: 'pilot' }], ['form_complete', { form: 'pilot' }]]);
    fs.mkdirSync(path.join(__dirname, '../.cache/landing-qa'), { recursive: true });
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: path.join(__dirname, `../.cache/landing-qa/${width}.png`), fullPage: true });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Landingpage ${width}px ohne Überlauf`);
      const cta = await page.locator('.av-hero .cta-button').boundingBox();
      assert.ok(cta.y + cta.height <= 844, `Landingpage ${width}px: Button im ersten Bildschirm`);
    }
    console.log('  OK    Landingpage: Pilotbuchung mit allen Pflichtangaben und UTM-Herkunft, Event, Button im ersten Bildschirm, kein Überlauf');
    for (const url of ['/', '/pages/kontakt.html', '/pages/leistungen.html']) {
      await open(url);
      assert.equal(await page.locator('a[href^="https://calendly.com/"]:not([data-calendly-location])').count(), 0);
      const link = page.locator('[data-calendly-location]').first();
      const popupPromise = context.waitForEvent('page');
      await link.click();
      await (await popupPromise).close();
      assert.deepEqual(await events(), [['calendly_click', { location: await link.getAttribute('data-calendly-location') }]]);
    }
    await open('/');
    await page.locator('#quizForm').dispatchEvent('submit');
    assert.deepEqual(await events(), [], 'Unvollständiges Quiz zählt nicht');
    const steps = page.locator('.quiz-step');
    for (let i = 0; i < await steps.count(); i++) await steps.nth(i).locator('input[type="radio"]').first().check();
    await page.locator('#quizSubmit').click();
    await page.locator('#quizForm').dispatchEvent('submit');
    assert.deepEqual(await events(), [['quiz_complete', {}]]);
    await page.route('**/api/quiz-lead', route => route.fulfill({ json: { ok: true } }));
    await page.locator('#quiz-name').fill('Alex Test');
    await page.locator('#quiz-email').fill('alex@example.com');
    await page.locator('#quiz-privacy').check();
    await page.locator('#quiz-lead-form button').click();
    await page.waitForFunction(() => document.querySelector('#quiz-lead-gate').hidden);
    assert.deepEqual(await events(), [['quiz_complete', {}], ['form_complete', { form: 'quiz_lead' }]]);

    await open('/pages/lernplattform.html');
    await page.route('**/api/whitepaper', route => route.fulfill({ json: { ok: true } }));
    await page.route('**/api/newsletter', route => route.fulfill({ json: { ok: true } }));
    await page.locator('#wp-name').fill('Alex Test');
    await page.locator('#wp-email').fill('alex@example.com');
    await page.locator('#wp-privacy').check();
    const download = page.waitForEvent('download');
    await page.locator('#whitepaper-form button').click();
    await download;
    await page.locator('#newsletter-email').fill('alex@example.com');
    await page.locator('#newsletter-form button').click();
    await page.waitForFunction(() => window.__events.length === 2);
    assert.deepEqual(await events(), [['form_complete', { form: 'whitepaper' }], ['form_complete', { form: 'newsletter' }]]);
    await page.evaluate(() => {
      window.umami.track = () => { throw new Error('Blockiert'); };
      window.neuratexTrack('quiz_complete');
      window.umami.track = () => Promise.reject(new Error('Offline'));
      window.neuratexTrack('quiz_complete');
      delete window.umami;
      window.neuratexTrack('quiz_complete');
      Object.defineProperty(navigator, 'doNotTrack', { configurable: true, value: '1' });
      window.umami = { track: () => { throw new Error('DNT ignoriert'); } };
      window.neuratexTrack('quiz_complete');
    });
    assert.deepEqual(jsErrors, []);
    console.log('  OK    Kontaktformular, mobile Layouts, Calendly, Quiz und alle Formular-Events; keine Eingaben im Tracking');
  } finally { await context.close(); }
  // reducedMotion: Geprueft wird hier das Absenden ohne JavaScript, nicht das
  // Scrollverhalten. Die Datenschutz-Checkbox liegt weit unten, Playwright
  // scrollt automatisch hin, und das weiche Scrollen der Seite liess die
  // Stabilitaetspruefung des Klicks in die Zeitueberschreitung laufen.
  // Mit reduzierter Bewegung springt die Seite, das Formular verhaelt sich
  // unveraendert.
  const noJs = await browser.newPage({ javaScriptEnabled: false, reducedMotion: 'reduce' });
  try {
    await noJs.goto(base + '/pages/kontakt.html');
    let body;
    await noJs.route('**/api/contact', async route => {
      body = new URLSearchParams(route.request().postData());
      await route.fulfill({ contentType: 'text/html', body: '<h1>Danke</h1>' });
    });
    await noJs.locator('#contact-name').fill('Alex Test');
    await noJs.locator('#contact-email').fill('alex@example.com');
    await noJs.locator('#contact-message').fill('Anfrage ohne JavaScript');
    await noJs.locator('#contact-privacy').check();
    await noJs.locator('#contact-form button').click();
    await noJs.waitForURL('**/api/contact');
    assert.equal(body.get('message'), 'Anfrage ohne JavaScript');
    assert.equal(body.get('privacy'), 'on');
    await noJs.goto(base + '/pages/ki-sichtbarkeit.html');
    const buchung = { name: 'Alex Test', email: 'alex@example.com', company: 'Beispiel GmbH', domain: 'www.beispiel.de',
      leistungen: 'Industriewartung', kunden: 'Maschinenbauer', region: 'NRW', strasse: 'Musterstraße 1', plz: '40210', ort: 'Düsseldorf' };
    assert.equal(await noJs.locator('#contact-region').isVisible(), true, 'Ohne JavaScript ist die Region immer sichtbar');
    for (const [key, value] of Object.entries(buchung)) await noJs.locator('#contact-' + key).fill(value);
    await noJs.locator('#contact-markt').selectOption('Region');
    await noJs.locator('#contact-bestaetigung').check();
    await noJs.locator('#contact-form button').click();
    await noJs.waitForURL('**/api/contact');
    for (const [key, value] of Object.entries(buchung)) assert.equal(body.get(key), value, key);
    assert.equal(body.get('markt'), 'Region');
    assert.equal(body.get('bestaetigung'), 'on');
    assert.equal(body.get('website'), '');
    console.log('  OK    Kontaktformular und Pilotbuchung senden auch ohne JavaScript');
  } finally { await noJs.close(); }
}

module.exports = async function checkConversions(browser, base) {
  console.log('\n7. Kontaktformular, Conversion-Tracking und Website-Texte');
  checkCopy();
  checkPreviewOrigin();
  await checkEndpoint();
  await checkBrowser(browser, base);
};
