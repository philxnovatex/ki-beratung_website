/**
 * Prüfskript für die statische Website.
 *
 * Voraussetzung: der Server läuft unter http://127.0.0.1:4173
 *   npx serve public -l 4173
 *
 * Aufruf:  node tests/run.js
 * Rückgabe: 0 bei Erfolg, 1 bei mindestens einem Fehlschlag.
 */
const { chromium } = require('playwright');

const BASIS = process.env.TEST_URL || 'http://127.0.0.1:4173';

const SEITEN = [
  '/',
  '/pages/leistungen.html',
  '/pages/ki-sichtbarkeit.html',
  '/pages/kontakt.html',
  '/pages/lernplattform.html',
  '/pages/legal/impressum.html',
  '/pages/legal/datenschutz.html',
  '/404.html',
];

let fehler = 0;
const ok = (t) => console.log('  OK    ' + t);
const nok = (t) => { fehler++; console.log('  FEHLER ' + t); };

async function ganzDurchscrollen(page) {
  // Bewusst über das Mausrad statt über window.scrollTo:
  // Ein Sprung per Skript löst kein Scroll-Ereignis aus und findet zwischen
  // zwei Einzelbildern statt. Beobachter und Scroll-Handler können dabei nicht
  // greifen, was zu Fehlalarmen führt. Das Mausrad erzeugt dieselben Ereignisse
  // wie eine echte Bedienung.
  const hoehe = await page.evaluate(() => document.body.scrollHeight);
  const schritte = Math.ceil(hoehe / 400);
  for (let i = 0; i < schritte; i++) {
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(70);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  // Warten, bis keine Einblendung mehr läuft, statt eine feste Zeit zu raten.
  // Eine feste Wartezeit führte unter Last zu Fehlalarmen: Elemente waren nicht
  // defekt, sondern noch mitten in ihrem Übergang.
  await page
    .waitForFunction(
      () => {
        const laufend = document.getAnimations
          ? document.getAnimations().filter((a) => a.playState === 'running' && a.effect &&
              a.effect.getTiming().iterations !== Infinity)
          : [];
        return laufend.length === 0;
      },
      { timeout: 6000 }
    )
    .catch(() => {});
  await page.waitForTimeout(400);
}

// ── 1. Erreichbarkeit ──────────────────────────────────────────────────────
async function pruefeSeiten(browser) {
  console.log('\n1. Erreichbarkeit und JavaScript-Fehler');
  for (const pfad of SEITEN) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const jsFehler = [];
    const tot = [];
    page.on('pageerror', (e) => jsFehler.push(e.message));
    page.on('response', (r) => {
      if (r.status() >= 400 && !r.url().includes('_vercel')) tot.push(r.status() + ' ' + r.url());
    });
    const antwort = await page.goto(BASIS + pfad, { waitUntil: 'networkidle' }).catch(() => null);
    await page.waitForTimeout(500);
    const h1 = await page.locator('h1').count();
    const status = antwort ? antwort.status() : 0;

    const meldung = `${pfad}  HTTP ${status}, h1: ${h1}, JS-Fehler: ${jsFehler.length}, tote Ressourcen: ${tot.length}`;
    if (status === 200 && h1 === 1 && !jsFehler.length && !tot.length) ok(meldung);
    else {
      nok(meldung);
      jsFehler.forEach((f) => console.log('         JS: ' + f));
      tot.forEach((f) => console.log('         ' + f));
    }
    await page.close();
  }
}

// ── 2. Sichtbarkeit in drei Modi ───────────────────────────────────────────
const REVEAL_SELEKTOREN =
  '.stage-card, .timeline-item, .cs-card, .ki-apps__card, .service-card, .problem-column, .solution-column, .featured-section, .av-reveal';

async function pruefeSichtbarkeit(browser) {
  console.log('\n2. Sichtbarkeit (normal, reduzierte Bewegung, ohne JavaScript)');
  for (const pfad of ['/', '/pages/leistungen.html', '/pages/ki-sichtbarkeit.html']) {
    for (const modus of ['normal', 'reduced', 'ohne-js']) {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 900 },
        javaScriptEnabled: modus !== 'ohne-js',
      });
      if (modus === 'reduced') await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(BASIS + pfad, { waitUntil: modus === 'ohne-js' ? 'load' : 'networkidle' });

      let unsichtbar = 0;
      if (modus === 'ohne-js') {
        // Ohne Seiten-JavaScript über das Playwright-Protokoll prüfen
        const n = await page.locator(REVEAL_SELEKTOREN).count();
        for (let i = 0; i < n; i++) {
          if (!(await page.locator(REVEAL_SELEKTOREN).nth(i).isVisible())) unsichtbar++;
        }
      } else {
        await ganzDurchscrollen(page);
        // Geprüft wird, ob das Element ausgelöst wurde, nicht seine momentane
        // Deckkraft. Ein Element mitten im Einblendvorgang hat eine Deckkraft
        // unter 1, ist aber nicht defekt. Die Klasse dagegen wird sofort
        // gesetzt und ist damit das verlässliche Signal.
        unsichtbar = await page.evaluate((sel) => {
          let n = 0;
          for (const el of document.querySelectorAll(sel)) {
            const cs = getComputedStyle(el);
            const ausgeloest = el.classList.contains('in-view') || el.classList.contains('visible');
            // Elemente ohne Einblend-Logik (Deckkraft ohnehin 1) zählen nicht.
            const brauchtAusloesung = !ausgeloest && parseFloat(cs.opacity) < 0.9;
            if (brauchtAusloesung) n++;
          }
          return n;
        }, REVEAL_SELEKTOREN);
      }

      const meldung = `${pfad} [${modus}]  unsichtbare Elemente: ${unsichtbar}`;
      unsichtbar === 0 ? ok(meldung) : nok(meldung);
      await page.close();
    }
  }
}

// ── 3. Bewegung des Seitenhintergrunds ─────────────────────────────────────
// Der Vertrag hat sich mit dem durchgehenden Hintergrund geändert. Vorher galt
// "steht still, sobald der Hero aus dem Bild ist". Das Knotennetz liegt jetzt
// hinter der gesamten Seite und soll beim Scrollen ausdrücklich weiterlaufen,
// weil es den Fortschritt abbildet.
//
// Geprüft wird deshalb nicht mehr Stillstand beim Scrollen, sondern dass die
// Schleife überall dort aussetzt, wo sie nur Strom kostet: bei reduzierter
// Bewegung, auf schmalen Fenstern und im Hintergrundtab.
async function pruefeBewegung(browser) {
  console.log('\n3. Seitenhintergrund: laeuft beim Scrollen, steht wo er nichts bringt');

  async function frames(optionen) {
    const o = optionen || {};
    const page = await browser.newPage({
      viewport: { width: o.breite || 1280, height: 900 },
    });
    if (o.reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(BASIS + '/', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      window.__f = 0;
      const orig = window.requestAnimationFrame;
      window.requestAnimationFrame = function (cb) { window.__f++; return orig.call(window, cb); };
    });
    if (o.wegscrollen) {
      await page.evaluate(() => window.scrollTo(0, 6000));
      // Warten, bis einmalige Animationen (Zähler der Case Study) durchgelaufen sind
      await page.waitForTimeout(3500);
    }
    if (o.versteckt) {
      // Hintergrundtab nachstellen: document.hidden lässt sich nicht setzen,
      // also wird der Wert überschrieben und das Ereignis ausgelöst.
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
        Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
    }
    await page.evaluate(() => { window.__f = 0; });
    await page.waitForTimeout(2000);
    const n = await page.evaluate(() => window.__f);
    await page.close();
    return n;
  }

  const oben = await frames({});
  oben > 0 ? ok(`Seitenanfang: ${oben} Frames in 2s (Hintergrund laeuft)`)
           : nok('Seitenanfang: keine Frames, Hintergrund laeuft nicht');

  const gescrollt = await frames({ wegscrollen: true });
  gescrollt > 0 ? ok(`Weit gescrollt: ${gescrollt} Frames (laeuft weiter, wie vorgesehen)`)
                : nok('Weit gescrollt: 0 Frames, der durchgehende Hintergrund steht still');

  const red = await frames({ reduced: true });
  red === 0 ? ok('prefers-reduced-motion: 0 Frames')
            : nok(`prefers-reduced-motion: ${red} Frames, Animation laeuft trotzdem`);

  const schmal = await frames({ breite: 420 });
  schmal === 0 ? ok('Schmales Fenster: 0 Frames (Telefon bleibt unbelastet)')
               : nok(`Schmales Fenster: ${schmal} Frames, Schleife laeuft auf dem Telefon`);

  const versteckt = await frames({ versteckt: true });
  versteckt === 0 ? ok('Hintergrundtab: 0 Frames')
                  : nok(`Hintergrundtab: ${versteckt} Frames, Schleife pausiert nicht`);
}

// ── 4. Bildverhältnisse ────────────────────────────────────────────────────
async function pruefeBilder(browser) {
  console.log('\n4. Bildverhaeltnisse');
  for (const pfad of ['/', '/pages/leistungen.html', '/pages/lernplattform.html']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASIS + pfad, { waitUntil: 'networkidle' });
    await ganzDurchscrollen(page);
    const verzerrt = await page.evaluate(() => {
      const out = [];
      for (const img of document.querySelectorAll('img')) {
        if (!img.naturalWidth || !img.naturalHeight) continue;
        const r = img.getBoundingClientRect();
        if (r.width < 5 || r.height < 5) continue;
        const objectFit = getComputedStyle(img).objectFit;
        // Nur fill und none dehnen das Bild tatsaechlich; contain und cover nicht.
        if (objectFit !== 'fill' && objectFit !== 'none') continue;
        const soll = img.naturalWidth / img.naturalHeight;
        const ist = r.width / r.height;
        if (Math.abs(soll - ist) / soll > 0.05) {
          out.push(`${img.src.split('/').pop()} ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
      }
      return out;
    });
    const meldung = `${pfad}  verzerrte Bilder: ${verzerrt.length}`;
    verzerrt.length === 0 ? ok(meldung) : nok(meldung + ' -> ' + verzerrt.join(', '));
    await page.close();
  }
}

// ── 5. Typo-Hierarchie und Überlauf ────────────────────────────────────────
async function pruefeLayout(browser) {
  console.log('\n5. Typo-Hierarchie und horizontaler Ueberlauf');
  for (const breite of [390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width: breite, height: 900 } });
    await page.goto(BASIS + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    const r = await page.evaluate(() => {
      const px = (s) => {
        const el = document.querySelector(s);
        return el ? parseFloat(getComputedStyle(el).fontSize) : 0;
      };
      window.scrollTo(300, 0);
      const x = window.scrollX;
      window.scrollTo(0, 0);
      return { h1: px('h1'), h2: px('#services h2'), scrollX: x };
    });
    const hierarchie = r.h1 > r.h2;
    const meldung = `${breite}px  h1 ${Math.round(r.h1)} > h2 ${Math.round(r.h2)}: ${hierarchie}, horizontal verschiebbar: ${r.scrollX !== 0}`;
    hierarchie && r.scrollX === 0 ? ok(meldung) : nok(meldung);
    await page.close();
  }
}

// ── 6. Kontrast nach WCAG AA ───────────────────────────────────────────────
async function pruefeKontrast(browser) {
  console.log('\n6. Kontrast nach WCAG AA');
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASIS + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const verstoesse = await page.evaluate(() => {
    const lum = (c) => {
      const [r, g, b] = c.map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const parse = (s) => { const m = s.match(/\d+/g); return m ? m.slice(0, 3).map(Number) : null; };
    // Hintergrund suchen: Flaechen mit Farbverlauf werden uebersprungen, dort
    // laesst sich der Wert nicht zuverlaessig bestimmen.
    const hintergrund = (el) => {
      let n = el;
      while (n && n !== document.documentElement) {
        const cs = getComputedStyle(n);
        if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
        const bg = cs.backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)') {
          const a = bg.match(/rgba?\([^)]*,\s*([\d.]+)\)/);
          if (!a || parseFloat(a[1]) > 0.85) return parse(bg);
        }
        n = n.parentElement;
      }
      return [10, 25, 49];
    };
    const out = [];
    const gesehen = new Set();
    for (const el of document.querySelectorAll('p, li, a, h1, h2, h3, span, button, label')) {
      const txt = (el.textContent || '').trim();
      if (!txt || txt.length < 4) continue;
      if (el.querySelector('p, li, h1, h2, h3')) continue;
      const cs = getComputedStyle(el);
      const rc = el.getBoundingClientRect();
      if (rc.width < 2 || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.5) continue;
      const fg = parse(cs.color);
      const bg = hintergrund(el);
      if (!fg || !bg) continue;
      const schluessel = cs.color + '|' + cs.fontSize;
      if (gesehen.has(schluessel)) continue;
      gesehen.add(schluessel);
      const k = (Math.max(lum(fg), lum(bg)) + 0.05) / (Math.min(lum(fg), lum(bg)) + 0.05);
      const gross = parseFloat(cs.fontSize) >= 24 ||
        (parseFloat(cs.fontSize) >= 18.66 && parseInt(cs.fontWeight) >= 700);
      const grenze = gross ? 3 : 4.5;
      if (k < grenze) out.push(`${k.toFixed(2)} statt ${grenze} bei ${cs.color} ${cs.fontSize}: "${txt.slice(0, 30)}"`);
    }
    return out;
  });
  verstoesse.length === 0
    ? ok('alle geprueften Kombinationen erfuellen WCAG AA')
    : nok(`${verstoesse.length} Verstoesse`);
  verstoesse.forEach((v) => console.log('         ' + v));
  await page.close();
}

(async () => {
  console.log('Pruefe ' + BASIS);
  const browser = await chromium.launch();
  try {
    await pruefeSeiten(browser);
    await pruefeSichtbarkeit(browser);
    await pruefeBewegung(browser);
    await pruefeBilder(browser);
    await pruefeLayout(browser);
    await pruefeKontrast(browser);
    try {
      await require('./conversions')(browser, BASIS);
    } catch (error) {
      nok('Kontakt/Conversions: ' + error.stack);
    }
  } finally {
    await browser.close();
  }
  console.log('\n' + (fehler === 0 ? 'Alle Pruefungen bestanden.' : fehler + ' Pruefung(en) fehlgeschlagen.'));
  process.exit(fehler === 0 ? 0 : 1);
})();
