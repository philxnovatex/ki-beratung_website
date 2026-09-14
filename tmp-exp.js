const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [name, css] of [
      ['unveraendert', ''],
      ['ohne smooth', 'html { scroll-behavior: auto !important; }'],
      ['ohne clip am html', 'html { overflow-x: visible !important; }'],
  ]) {
    const p = await b.newPage({ javaScriptEnabled: false });
    if (css) await p.addStyleTag({ content: css }).catch(() => {});
    await p.goto('http://localhost:4173/pages/kontakt.html', { waitUntil: 'load' });
    if (css) await p.addStyleTag({ content: css });
    const t0 = Date.now();
    let ergebnis;
    try {
      await p.locator('#contact-privacy').check({ timeout: 8000 });
      ergebnis = 'OK nach ' + (Date.now() - t0) + ' ms';
    } catch (e) {
      ergebnis = 'FEHLGESCHLAGEN: ' + e.message.split('\n')[0];
    }
    console.log('  ' + name.padEnd(20) + ergebnis);
    await p.close();
  }
  await b.close();
})();
