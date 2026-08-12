/**
 * page-common.js – Gemeinsame Funktionen der Unterseiten
 *
 * Verhaelt sich jetzt identisch zur Startseite. Vorher fehlten hier das
 * Schliessen per Escape-Taste und das Schliessen beim Klick auf einen Link,
 * die main.js bereits hatte. Das Menue liess sich auf Unterseiten also nur
 * ueber den Schalter wieder schliessen.
 */
'use strict';

(function () {
    // ── Copyright year ────────────────────────────────────────────
    const cy = document.getElementById('copyright-year');
    if (cy) cy.textContent = new Date().getFullYear();

    // ── Mobile nav toggle (null-safe) ─────────────────────────────
    const nav = document.querySelector('.main-nav');
    const navToggle = document.querySelector('.mobile-nav-toggle');
    if (!nav || !navToggle) return;

    function setzeZustand(sichtbar) {
        nav.setAttribute('data-visible', String(sichtbar));
        navToggle.setAttribute('aria-expanded', String(sichtbar));
        navToggle.setAttribute('aria-label', sichtbar ? 'Navigation schließen' : 'Navigation öffnen');
    }

    navToggle.addEventListener('click', () => {
        setzeZustand(nav.getAttribute('data-visible') !== 'true');
    });

    // Schliessen beim Klick auf einen Link
    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => setzeZustand(false));
    });

    // Schliessen per Escape, dann Fokus zurueck auf den Schalter
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && nav.getAttribute('data-visible') === 'true') {
            setzeZustand(false);
            navToggle.focus();
        }
    });
})();
