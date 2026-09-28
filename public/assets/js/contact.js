(function initContactForm() {
    'use strict';
    const form = document.getElementById('contact-form');
    if (!form) return;
    const button = form.querySelector('button[type="submit"]');
    const status = document.getElementById('contact-status');
    // Die Beschriftung kommt aus dem Markup, nicht aus diesem Skript. Auf der
    // Seite zur KI-Sichtbarkeit heisst der Schalter "Audit fuer 500 Euro
    // verbindlich buchen"; fest verdrahtetes "Nachricht senden" haette ihn nach dem
    // ersten Absenden stillschweigend umbenannt.
    const beschriftung = button.textContent;
    let sending = false;

    // Herkunft des Besuchs fuer die Auswertung von Kampagnen, nur auf Formularen
    // mit dem verborgenen Feld "herkunft". Erfasst werden ausschliesslich die
    // UTM-Parameter der Anzeige. Bewusst nur aus dem aktuellen Aufruf und ohne
    // sessionStorage: Speichern auf dem Endgeraet fuer die Kampagnenauswertung
    // ist nicht unbedingt erforderlich (Paragraf 25 TDDDG) und braeuchte eine
    // Einwilligung. Das Formular steht auf derselben Seite wie der Einstieg.
    const herkunft = form.elements.herkunft;
    if (herkunft) {
        const params = new URLSearchParams(location.search);
        let wert = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
            .filter((key) => params.get(key))
            .map((key) => `${key}=${params.get(key).slice(0, 80)}`)
            .join('; ');
        if (!wert) {
            try { wert = document.referrer ? 'Verweis von ' + new URL(document.referrer).hostname : ''; }
            catch { wert = ''; }
        }
        herkunft.value = wert || 'direkt oder unbekannt';
    }

    // Formularbeginn, nur auf Formularen mit data-track-start (Pilotbuchung).
    // Zusammen mit form_complete ergibt das die Abbruchquote. Einmal pro
    // Seitenaufruf, bei der ersten Eingabe, ohne Inhalte.
    if ('trackStart' in form.dataset) {
        form.addEventListener('input', () => {
            window.neuratexTrack?.('form_start', { form: form.dataset.form || 'contact' });
        }, { once: true });
    }

    // Regionsfeld der Pilotbuchung: nur sichtbar und Pflicht, wenn als Markt
    // "Eine Region in Deutschland" gewaehlt ist. Ohne JavaScript bleibt es
    // sichtbar, der Server verlangt es nur bei dieser Auswahl.
    const markt = form.elements.markt;
    const regionFeld = form.querySelector('[data-region-feld]');
    if (markt && regionFeld) {
        const region = regionFeld.querySelector('input');
        const zeigeRegion = () => {
            const aktiv = markt.value === 'Region';
            regionFeld.hidden = !aktiv;
            region.required = aktiv;
            if (!aktiv) region.value = '';
        };
        markt.addEventListener('change', zeigeRegion);
        zeigeRegion();
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (sending || !form.reportValidity()) return;
        const fields = new FormData(form);
        // Nur Leerzeichen gelten als leer. Welche Felder Pflicht sind, steht im
        // Markup, damit Kontaktseite und Landingpage dasselbe Skript nutzen.
        const leer = [...form.querySelectorAll('input[required]:not([type="checkbox"]), textarea[required]')]
            .some((feld) => !feld.value.trim());
        if (leer) {
            status.textContent = 'Bitte füllen Sie alle Pflichtfelder aus.';
            status.dataset.state = 'error';
            status.focus();
            return;
        }
        const text = (key) => (fields.get(key) || '').trim();
        const daten = {
            name: text('name'), email: text('email'),
            company: text('company'), message: text('message'),
            privacy: fields.get('privacy') === 'on', website: fields.get('website'),
        };
        // Nur die Pilotbuchung der Landingpage hat diese Felder. Fehlen sie,
        // bleibt die Anfrage der Kontaktseite wie bisher.
        for (const key of ['domain', 'herkunft', 'leistungen', 'kunden', 'markt', 'region', 'wettbewerber', 'strasse', 'plz', 'ort']) {
            if (fields.has(key)) daten[key] = text(key);
        }
        if (form.elements.bestaetigung) daten.bestaetigung = fields.get('bestaetigung') === 'on';
        sending = true;
        button.disabled = true;
        button.textContent = 'Wird gesendet…';
        form.setAttribute('aria-busy', 'true');
        status.dataset.state = 'pending';
        status.textContent = 'Ihre Angaben werden übermittelt.';
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch(form.action, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify(daten),
            });
            const data = await response.json().catch(() => ({}));
            if (response.ok && data.ok === true) {
                status.textContent = data.message || 'Vielen Dank! Ihre Nachricht wurde übermittelt. Wir melden uns per E-Mail bei Ihnen.';
                status.dataset.state = 'success';
                form.reset();
                // reset() loest kein change aus; Regionsfeld wieder ausblenden.
                form.elements.markt?.dispatchEvent(new Event('change'));
                // Feste Kategorie aus dem Markup, niemals Formularinhalte.
                window.neuratexTrack?.('form_complete', { form: form.dataset.form || 'contact' });
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
