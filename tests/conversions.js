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
    calls = [];
    for (const patch of [ { name: '' }, { name: ' '.repeat(3) }, { name: 'A'.repeat(121) },
      { name: 'A\r\nBcc: x@example.com' }, { email: 'invalid' }, { email: ['x@example.com'] },
      { company: {} }, { company: 'A'.repeat(141) }, { message: '' }, { message: 'A'.repeat(5001) },
      { message: '\u0000' }, { privacy: false }, { privacy: 'true' }, { website: 'https://spam.example' } ]) {
      assert.equal((await request({ ...valid, ...patch })).statusCode, 400, JSON.stringify(patch));
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
    console.log('  OK    Kontakt-API: Versandpayload, Validierung, Datenschutz, Origin, Größenlimit, Rate-Limit, Fehler und Versand ohne JS');
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
  const noJs = await browser.newPage({ javaScriptEnabled: false });
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
    console.log('  OK    Kontaktformular sendet auch ohne JavaScript');
  } finally { await noJs.close(); }
}

module.exports = async function checkConversions(browser, base) {
  console.log('\n7. Kontaktformular, Conversion-Tracking und Website-Texte');
  checkCopy();
  await checkEndpoint();
  await checkBrowser(browser, base);
};
