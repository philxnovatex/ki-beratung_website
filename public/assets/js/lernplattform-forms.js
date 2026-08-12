const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Löst einen Datei-Download aus, ohne die Seite zu verlassen.
// window.location.href würde das PDF in den meisten Browsern inline öffnen
// und den Nutzer damit von der Lernplattform wegnavigieren.
function triggerDownload(url) {
  const a = document.createElement('a');
  a.href = url;
  a.download = '';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// ── Whitepaper-Formular: Daten an Brevo senden, dann PDF-Download ──
const whitepaperForm = document.getElementById('whitepaper-form');
if (whitepaperForm) {
  whitepaperForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const nameEl = document.getElementById('wp-name');
    const emailEl = document.getElementById('wp-email');
    const privacyEl = document.getElementById('wp-privacy');
    const companyEl = document.getElementById('wp-company');
    const statusEl = document.getElementById('wp-status');
    const submitBtn = whitepaperForm.querySelector('button[type="submit"]');

    // Ohne diese Felder ist das Formular nicht bedienbar. Lieber sichtbar
    // scheitern als dem Nutzer eine irreführende Netzwerkfehler-Meldung zeigen.
    if (!nameEl || !emailEl || !privacyEl) {
      console.error('[whitepaper] Pflichtfelder fehlen im DOM');
      return;
    }

    function setStatus(msg, color) {
      if (statusEl) { statusEl.textContent = msg; statusEl.style.color = color; }
    }

    // Validierung
    if (!nameEl.value.trim() || !emailEl.value.trim() || !privacyEl.checked) {
      setStatus('Bitte Name, E‑Mail ausfüllen und Datenschutz bestätigen.', '#ff6b6b');
      return;
    }
    if (!emailPattern.test(emailEl.value.trim())) {
      setStatus('Bitte eine gültige E‑Mail-Adresse eingeben.', '#ff6b6b');
      return;
    }

    // UI-Feedback: Button deaktivieren
    const originalLabel = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Wird gesendet…'; }
    setStatus('', '');

    try {
      const response = await fetch('/api/whitepaper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailEl.value.trim(),
          name: nameEl.value.trim(),
          company: companyEl ? companyEl.value.trim() : ''
        })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok) {
        setStatus(data.message || 'Vielen Dank! Der Download startet…', '#4caf50');
        whitepaperForm.reset();
        triggerDownload('/assets/downloads/neuratex-whitepaper.pdf');
      } else {
        setStatus(data.message || 'Anfrage fehlgeschlagen. Bitte versuchen Sie es später.', '#ff6b6b');
      }
    } catch (error) {
      console.warn('whitepaper submit error', error);
      setStatus('Netzwerkfehler. Bitte versuchen Sie es später.', '#ff6b6b');
    } finally {
      // Label aus dem DOM übernehmen statt hart zu kodieren, damit Textänderungen
      // im HTML nicht stillschweigend überschrieben werden.
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
    }
  });
}

const newsletterForm = document.getElementById('newsletter-form');
const newsletterInput = document.getElementById('newsletter-email');

if (newsletterForm && newsletterInput) {
  const nlStatus = document.getElementById('newsletter-status');
  function setNlStatus(msg, color) {
    if (nlStatus) { nlStatus.textContent = msg; nlStatus.style.color = color; }
  }
  newsletterForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = newsletterInput.value.trim();
    if (!email) {
      setNlStatus('Bitte E‑Mail angeben.', '#ff6b6b');
      return;
    }
    if (!emailPattern.test(email)) {
      setNlStatus('Bitte eine gültige E‑Mail-Adresse eingeben.', '#ff6b6b');
      return;
    }

    // Disable button during request
    const submitBtn = newsletterForm.querySelector('button[type="submit"]');
    const originalLabel = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Wird gesendet…'; }
    setNlStatus('', '');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok) {
        setNlStatus(data.message || 'Erfolgreich eingetragen! Vielen Dank.', '#4caf50');
        newsletterInput.value = '';
      } else {
        setNlStatus(data.message || 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es später.', '#ff6b6b');
      }
    } catch (error) {
      setNlStatus('Netzwerkfehler. Bitte versuchen Sie es später.', '#ff6b6b');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
    }
  });
}
