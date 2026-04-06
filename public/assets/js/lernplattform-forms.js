const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Whitepaper-Formular: Daten an Brevo senden, dann PDF-Download ──
const whitepaperForm = document.getElementById('whitepaper-form');
if (whitepaperForm) {
  whitepaperForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const nameEl = document.getElementById('wp-name');
    const emailEl = document.getElementById('wp-email');
    const privacyEl = document.getElementById('wp-privacy');
    const statusEl = document.getElementById('wp-status');
    const submitBtn = whitepaperForm.querySelector('button[type="submit"]');

    // Validierung
    if (!nameEl.value.trim() || !emailEl.value.trim() || !privacyEl.checked) {
      statusEl.textContent = 'Bitte Name, E\u2011Mail ausfüllen und Datenschutz bestätigen.';
      statusEl.style.color = '#ff6b6b';
      return;
    }
    if (!emailPattern.test(emailEl.value.trim())) {
      statusEl.textContent = 'Bitte eine gültige E\u2011Mail-Adresse eingeben.';
      statusEl.style.color = '#ff6b6b';
      return;
    }

    // UI-Feedback: Button deaktivieren
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Wird gesendet\u2026'; }
    statusEl.textContent = '';

    try {
      const response = await fetch('/api/whitepaper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailEl.value.trim(),
          name: nameEl.value.trim(),
          company: document.getElementById('wp-company').value.trim()
        })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok) {
        statusEl.textContent = data.message || 'Vielen Dank! Download startet\u2026';
        statusEl.style.color = '#4caf50';
        // PDF-Download starten
        window.location.href = 'downloads/neuratex-whitepaper.pdf';
        whitepaperForm.reset();
      } else {
        statusEl.textContent = data.message || 'Anfrage fehlgeschlagen. Bitte versuchen Sie es später.';
        statusEl.style.color = '#ff6b6b';
      }
    } catch (error) {
      console.warn('whitepaper submit error', error);
      statusEl.textContent = 'Netzwerkfehler. Bitte versuchen Sie es später.';
      statusEl.style.color = '#ff6b6b';
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Neuratex-Prinzip anfordern'; }
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
      setNlStatus('Bitte E\u2011Mail angeben.', '#ff6b6b');
      return;
    }
    if (!emailPattern.test(email)) {
      setNlStatus('Bitte eine gültige E\u2011Mail-Adresse eingeben.', '#ff6b6b');
      return;
    }

    // Disable button during request
    const submitBtn = newsletterForm.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Wird gesendet\u2026'; }
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
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Jetzt anmelden'; }
    }
  });
}
