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
        '.cs-card',
        '.av-reveal'
    ];

    // Container, deren Kinder gestaffelt erscheinen sollen
    const GRUPPEN_SELEKTOREN = [
        '.stage-grid',
        '.services-grid',
        '.testimonials-grid',
        '.ki-apps__grid',
        '.timeline',
        // Ohne diesen Eintrag erschienen Kinder von data-reveal-group
        // gleichzeitig, obwohl der Kopfkommentar Staffelung verspricht.
        '[data-reveal-group]'
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

        // Eigene Ausloeselinie per data-reveal-linie="0.55": Das Element startet
        // erst, wenn seine Oberkante ueber 55 % der Fensterhoehe steht. Fuer
        // Szenen, die man sehen soll, statt dass sie unten am Rand verpuffen.
        // Solche Elemente laufen nicht ueber den Beobachter, sondern allein
        // ueber die Pruefung beim Scrollen weiter unten.
        function linie(el) {
            const a = parseFloat(el.dataset.revealLinie);
            return isNaN(a) ? null : window.innerHeight * a;
        }

        // Elemente, die beim Laden bereits sichtbar oder schon vorbeigescrollt
        // sind, sofort einblenden. Ein Einblendeffekt für etwas, das der Nutzer
        // ohnehin schon sieht, bringt nichts. Vor allem aber schützt das gegen
        // den Fall, dass der Beobachter für diese Elemente nie auslöst und sie
        // dauerhaft unsichtbar bleiben.
        const sofort = [];
        elemente.forEach(el => {
            const r = el.getBoundingClientRect();
            const grenze = linie(el);
            if (r.top < (grenze === null ? window.innerHeight * 0.9 : grenze)) sofort.push(el);
        });
        sofort.forEach(el => { sichtbarMachen(el); elemente.delete(el); });

        // Der Beobachter meldet sich direkt nach observe() einmal fuer jedes
        // Element, sichtbar oder nicht. Bleibt diese Meldung aus, ist er defekt.
        let beobachterLebt = false;

        const observer = new IntersectionObserver((entries, obs) => {
            beobachterLebt = true;
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                if (linie(entry.target) !== null) return;
                const el = entry.target;
                const verzoegerung = (staffel.get(el) || 0) * STAFFEL_MS;

                if (verzoegerung) {
                    el.style.transitionDelay = verzoegerung + 'ms';
                }
                sichtbarMachen(el);
                obs.unobserve(el);
                // Aus der Menge nehmen, damit die Nachtrag-Prüfung beim Scrollen
                // und dieser Beobachter nicht auseinanderlaufen.
                elemente.delete(el);

                // Verzögerung wieder entfernen, damit sie spätere Übergänge
                // wie Hover-Effekte nicht ausbremst.
                if (verzoegerung) {
                    setTimeout(() => { el.style.transitionDelay = ''; }, verzoegerung + 900);
                }
            });
        // threshold 0 statt eines Anteils: Bei schnellem Scrollen kann eine
        // anteilige Schwelle zwischen zwei Einzelbildern über- und wieder
        // unterschritten werden, das Element bleibt dann dauerhaft unsichtbar.
        // Genau das trat bei drei großen Abschnitten der Leistungsseite auf.
        // Der negative rootMargin sorgt weiterhin dafür, dass der Auftritt erst
        // beginnt, wenn das Element deutlich im Bild ist.
        }, { threshold: 0, rootMargin: '0px 0px -80px 0px' });

        elemente.forEach(el => observer.observe(el));

        // Absicherung gegen sehr schnelles Scrollen.
        // Der IntersectionObserver wertet nur an Einzelbildgrenzen aus. Wer mit
        // der Ende-Taste springt oder auf dem Telefon schnell wischt, kann
        // Abschnitte überspringen, die dann dauerhaft unsichtbar bleiben.
        // Getestet auf der Leistungsseite: Bei 450 Pixel großen Sprüngen blieben
        // drei Abschnitte zurück, bei ruhigem Scrollen keiner.
        let geplant = false;
        function nachtragen() {
            geplant = false;
            if (!elemente.size) {
                window.removeEventListener('scroll', beiScroll);
                return;
            }
            const unten = window.innerHeight - 80;
            elemente.forEach(el => {
                const r = el.getBoundingClientRect();
                const grenze = linie(el);
                // Alles, was im Bild ist oder bereits daran vorbei ist
                if (r.top < (grenze === null ? unten : grenze)) {
                    sichtbarMachen(el);
                    observer.unobserve(el);
                    elemente.delete(el);
                }
            });
        }
        function beiScroll() {
            if (geplant) return;
            geplant = true;
            requestAnimationFrame(nachtragen);
        }
        window.addEventListener('scroll', beiScroll, { passive: true });

        // Regelmäßige Nachkontrolle für die erste Zeit nach dem Laden.
        // Notwendig, weil weder der Beobachter noch der Scroll-Handler greifen,
        // wenn die Bildlaufposition per Skript gesetzt wird: Solche Sprünge
        // lösen kein Scroll-Ereignis aus und finden zwischen zwei Einzelbildern
        // statt. Das passiert etwa beim Aufruf einer Adresse mit Sprungmarke.
        // Nach zehn Sekunden endet die Kontrolle, danach genügen Beobachter und
        // Scroll-Handler.
        const nachkontrolle = setInterval(() => {
            nachtragen();
            if (!elemente.size) clearInterval(nachkontrolle);
        }, 400);
        setTimeout(() => clearInterval(nachkontrolle), 10000);

        // Letzte Absicherung: Falls der Beobachter gar nicht anspringt, wird
        // nach 2,5 Sekunden pauschal alles gezeigt. Ein dauerhaft unsichtbarer
        // Inhalt wäre schlimmer als eine ausgefallene Animation.
        // Frueher zaehlte hier, ob schon etwas eingeblendet wurde. Stand beim
        // Laden nichts im Bild und scrollte niemand, galt der Beobachter
        // faelschlich als defekt, und alle Einblendungen der Seite waren
        // verschenkt, bevor man sie sah.
        setTimeout(() => {
            if (beobachterLebt) return;
            elemente.forEach(sichtbarMachen);
        }, 2500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
