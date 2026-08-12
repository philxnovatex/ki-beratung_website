/**
 * scroll-reveal.js – Einheitliches Einblendsystem für alle Seiten
 *
 * Ersetzt drei getrennte Implementierungen, die sich teils widersprachen:
 *   - main.js            beobachtete .problem-column, .solution-column,
 *                        .service-card (0.15) und .featured-section (0.2)
 *   - leistungen-anim.js beobachtete dieselben .featured-section (0.2) und
 *                        .service-card, aber mit Schwelle 0.1
 *   - ki-anwendungen.js  hatte eine eigene Staffelung für seine Karten
 *
 * Neu ist die Staffelung: Elemente derselben Gruppe erscheinen nacheinander
 * statt gleichzeitig. Das führt das Auge und wirkt ruhiger als ein Sprung.
 *
 * Verwendung im Markup, wahlweise:
 *   <div data-reveal>                     einzelnes Element
 *   <div data-reveal-group>               Kinder erscheinen gestaffelt
 * Die unten aufgeführten Klassen werden zusätzlich automatisch erfasst, damit
 * bestehendes Markup unverändert weiterläuft.
 */
(function initScrollReveal() {
    'use strict';

    // Elemente, die ohne Attribut im Markup erfasst werden. Reihenfolge egal.
    const AUTO_SELEKTOREN = [
        '.problem-column',
        '.solution-column',
        '.services-grid .service-card',
        '.featured-section',
        '.stage-card',
        '.testimonial-card',
        '.timeline-item',
        '.ki-apps__card',
        '.cs-card'
    ];

    // Container, deren Kinder gestaffelt erscheinen sollen
    const GRUPPEN_SELEKTOREN = [
        '.stage-grid',
        '.services-grid',
        '.testimonials-grid',
        '.ki-apps__grid',
        '.timeline'
    ];

    const STAFFEL_MS = 90;   // Abstand zwischen Geschwistern
    const STAFFEL_MAX = 5;   // ab hier kein weiterer Zuwachs, sonst wartet man zu lang

    const reduziert = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function sichtbarMachen(el) {
        // Beide Klassen, weil die vorhandenen CSS-Regeln historisch mal die eine,
        // mal die andere verwenden.
        el.classList.add('visible', 'in-view');
    }

    function start() {
        const elemente = new Set();
        AUTO_SELEKTOREN.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => elemente.add(el));
        });
        document.querySelectorAll('[data-reveal]').forEach(el => elemente.add(el));
        document.querySelectorAll('[data-reveal-group]').forEach(gruppe => {
            Array.from(gruppe.children).forEach(el => elemente.add(el));
        });

        if (!elemente.size) return;

        // Ohne Bewegungswunsch oder ohne Observer: sofort sichtbar, keine Animation.
        if (reduziert || !('IntersectionObserver' in window)) {
            elemente.forEach(sichtbarMachen);
            return;
        }

        // Staffelposition innerhalb der Elterngruppe bestimmen.
        // Bewusst über alle Nachfahren statt nur über die direkten Kinder: Die
        // Karten liegen häufig in einem umschließenden Link, etwa
        // .stage-grid > .stage-card-link > .stage-card. Über children wären sie
        // nie gefunden worden und die Staffelung bliebe wirkungslos.
        const staffel = new Map();
        GRUPPEN_SELEKTOREN.forEach(sel => {
            document.querySelectorAll(sel).forEach(gruppe => {
                let position = 0;
                gruppe.querySelectorAll('*').forEach(nachfahre => {
                    if (!elemente.has(nachfahre)) return;
                    staffel.set(nachfahre, Math.min(position, STAFFEL_MAX));
                    position++;
                });
            });
        });

        let ausgeloest = 0;

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                const verzoegerung = (staffel.get(el) || 0) * STAFFEL_MS;

                if (verzoegerung) {
                    el.style.transitionDelay = verzoegerung + 'ms';
                }
                sichtbarMachen(el);
                ausgeloest++;
                obs.unobserve(el);

                // Verzögerung wieder entfernen, damit sie spätere Übergänge
                // wie Hover-Effekte nicht ausbremst.
                if (verzoegerung) {
                    setTimeout(() => { el.style.transitionDelay = ''; }, verzoegerung + 900);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

        elemente.forEach(el => observer.observe(el));

        // Sicherheitsnetz: Wenn nach 2,5 Sekunden nichts ausgelöst wurde, gehen
        // wir von einem Defekt aus und zeigen alles. Greift bewusst nur dann,
        // damit die Animation nicht pauschal übersprungen wird.
        setTimeout(() => {
            if (ausgeloest > 0) return;
            elemente.forEach(sichtbarMachen);
        }, 2500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
