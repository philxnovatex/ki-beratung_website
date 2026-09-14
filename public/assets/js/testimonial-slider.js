/**
 * testimonial-slider.js – Kundenstimmen als Slideshow
 *
 * Zeigt genau eine Stimme und schaltet ueber zwei Pfeile weiter.
 *
 * Aufbau wie bei pin-sequence.js: Das Skript erzeugt die Bedienelemente selbst
 * und setzt Klassen, die Gestaltung liegt vollstaendig im CSS.
 *
 * Ohne JavaScript passiert nichts. Dann bleibt der Abschnitt das Raster mit
 * allen Stimmen untereinander, denn Pfeile ohne Skript waeren tote Schalter
 * und die Zitate waeren nicht erreichbar.
 *
 * Kein automatischer Wechsel. Eine Slideshow, die von allein weiterspringt,
 * nimmt dem Leser die Kontrolle ueber einen Text, den er gerade liest.
 */
(function initTestimonialSlider() {
    'use strict';

    const start = () => {
        const bereich = document.getElementById('stimmen');
        if (!bereich) return;

        const spur = bereich.querySelector('.testimonials-grid');
        if (!spur) return;

        const karten = Array.prototype.slice.call(spur.querySelectorAll('.testimonial-card'));
        if (karten.length < 2) return;

        const bewegungReduziert = window.matchMedia('(prefers-reduced-motion: reduce)');

        let aktuell = 0;
        let punkte = [];

        /* Bedienelemente. Sie stehen nicht im HTML, weil sie ohne dieses Skript
           keine Funktion haetten. */
        const huelle = document.createElement('div');
        huelle.className = 'tm-slider';

        const zurueck = document.createElement('button');
        zurueck.type = 'button';
        zurueck.className = 'tm-nav tm-nav--zurueck';
        zurueck.setAttribute('aria-label', 'Vorherige Kundenstimme');
        zurueck.innerHTML = '<i class="icon icon-arrow-right" aria-hidden="true"></i>';

        const vor = document.createElement('button');
        vor.type = 'button';
        vor.className = 'tm-nav tm-nav--vor';
        vor.setAttribute('aria-label', 'Nächste Kundenstimme');
        vor.innerHTML = '<i class="icon icon-arrow-right" aria-hidden="true"></i>';

        const leiste = document.createElement('div');
        leiste.className = 'tm-punkte';

        karten.forEach((karte, i) => {
            const knopf = document.createElement('button');
            knopf.type = 'button';
            knopf.className = 'tm-punkt';
            const name = karte.querySelector('.tm-name');
            knopf.setAttribute('aria-label', 'Stimme ' + (i + 1) + ' von ' + karten.length +
                                             (name ? ': ' + name.textContent : ''));
            knopf.addEventListener('click', () => zeige(i));
            leiste.appendChild(knopf);
            punkte.push(knopf);
        });

        // Huelle um die Spur legen, ohne die Spur aus dem Dokument zu reissen.
        spur.parentNode.insertBefore(huelle, spur);
        huelle.appendChild(zurueck);
        huelle.appendChild(spur);
        huelle.appendChild(vor);
        huelle.parentNode.insertBefore(leiste, huelle.nextSibling);

        /* Eine Live-Region meldet den Wechsel an Screenreader. Ohne sie bliebe
           das Weiterschalten fuer nicht sehende Nutzer stumm. */
        const meldung = document.createElement('p');
        meldung.className = 'sr-only';
        meldung.setAttribute('aria-live', 'polite');
        bereich.appendChild(meldung);

        function zeige(index) {
            aktuell = (index + karten.length) % karten.length;

            karten.forEach((karte, i) => {
                const sichtbar = i === aktuell;
                karte.classList.toggle('tm-aktiv', sichtbar);
                // Ausgeblendete Stimmen sind fuer Screenreader und Tastatur weg,
                // nicht nur unsichtbar.
                karte.setAttribute('aria-hidden', sichtbar ? 'false' : 'true');
                if (sichtbar) karte.removeAttribute('inert');
                else karte.setAttribute('inert', '');
            });

            punkte.forEach((knopf, i) => {
                knopf.setAttribute('aria-current', i === aktuell ? 'true' : 'false');
            });

            const name = karten[aktuell].querySelector('.tm-name');
            meldung.textContent = 'Stimme ' + (aktuell + 1) + ' von ' + karten.length +
                                  (name ? ', ' + name.textContent : '');
        }

        zurueck.addEventListener('click', () => zeige(aktuell - 1));
        vor.addEventListener('click', () => zeige(aktuell + 1));

        // Pfeiltasten, sobald der Fokus im Bereich liegt.
        bereich.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') { zeige(aktuell - 1); }
            else if (e.key === 'ArrowRight') { zeige(aktuell + 1); }
            else return;
            e.preventDefault();
        });

        // Wischen auf Touchgeraeten. Bewusst nur horizontal und erst ab einer
        // deutlichen Strecke, damit senkrechtes Scrollen nicht gestoert wird.
        let startX = null, startY = null;
        spur.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });
        spur.addEventListener('touchend', (e) => {
            if (startX === null) return;
            const dx = e.changedTouches[0].clientX - startX;
            const dy = e.changedTouches[0].clientY - startY;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
                zeige(aktuell + (dx < 0 ? 1 : -1));
            }
            startX = startY = null;
        }, { passive: true });

        if (bewegungReduziert.matches) huelle.classList.add('tm-ohne-bewegung');
        const beiAenderung = () => huelle.classList.toggle('tm-ohne-bewegung', bewegungReduziert.matches);
        if (bewegungReduziert.addEventListener) bewegungReduziert.addEventListener('change', beiAenderung);
        else if (bewegungReduziert.addListener) bewegungReduziert.addListener(beiAenderung);

        bereich.classList.add('tm-slider-aktiv');
        zeige(0);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
