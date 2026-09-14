(function initContactForm() {
    'use strict';
    const form = document.getElementById('contact-form');
    if (!form) return;
    const button = form.querySelector('button[type="submit"]');
    const status = document.getElementById('contact-status');
    // Die Beschriftung kommt aus dem Markup, nicht aus diesem Skript. Auf der
    // Seite zur KI-Sichtbarkeit heisst der Schalter "AI Visibility Audit
    // anfragen"; fest verdrahtetes "Nachricht senden" haette ihn nach dem
    // ersten Absenden stillschweigend umbenannt.
    const beschriftung = button.textContent;
    let sending = false;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (sending || !form.reportValidity()) return;
        const fields = new FormData(form);
        if (!fields.get('name').trim() || !fields.get('message').trim()) {
            status.textContent = 'Bitte geben Sie Ihren Namen und eine Nachricht ein.';
            status.dataset.state = 'error';
            status.focus();
            return;
        }
        sending = true;
        button.disabled = true;
        button.textContent = 'Wird gesendet…';
        form.setAttribute('aria-busy', 'true');
        status.dataset.state = 'pending';
        status.textContent = 'Ihre Nachricht wird übermittelt.';
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch(form.action, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    name: fields.get('name').trim(), email: fields.get('email').trim(),
                    company: fields.get('company').trim(), message: fields.get('message').trim(),
                    privacy: fields.get('privacy') === 'on', website: fields.get('website'),
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (response.ok && data.ok === true) {
                status.textContent = 'Vielen Dank! Ihre Nachricht wurde übermittelt. Wir melden uns per E-Mail bei Ihnen.';
                status.dataset.state = 'success';
                form.reset();
                window.neuratexTrack?.('form_complete', { form: 'contact' });
            } else {
                status.textContent = data.message || 'Übermittlung fehlgeschlagen. Bitte versuchen Sie es später oder schreiben Sie uns per E-Mail.';
                status.dataset.state = 'error';
            }
        } catch {
            status.textContent = 'Die Übermittlung konnte nicht bestätigt werden. Ihre Eingaben bleiben erhalten. Bitte prüfen Sie Ihre Verbindung oder schreiben Sie uns per E-Mail.';
            status.dataset.state = 'error';
        } finally {
            clearTimeout(timer);
            sending = false;
            button.disabled = false;
            button.textContent = beschriftung;
            form.removeAttribute('aria-busy');
            status.focus();
        }
    });
})();
