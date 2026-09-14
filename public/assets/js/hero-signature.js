/**
 * hero-signature.js – Die Übergabe vom Hero an den Inhalt
 *
 * Ebene 1 der Bewegungsspec: der eine scroll-gekoppelte Moment der Seite.
 * Das Skript berechnet ausschließlich einen Fortschrittswert und schreibt ihn
 * als --sig-p (0 bis 1) an den Hero. Die gesamte Gestaltung liegt im CSS
 * (hero-enhancements.css). Damit lässt sich der Effekt dort ändern, ohne hier
 * etwas anzufassen.
 *
 * Zwei Bedingungen bestimmen den Aufbau:
 *
 *  - Keine dauerhafte Schleife. Gerechnet wird nur, wenn tatsächlich gescrollt
 *    wird, und pro Bild höchstens einmal. Im Ruhezustand läuft kein
 *    requestAnimationFrame. Die Testsuite prüft das (Punkt 3: null Frames,
 *    wenn der Hero aus dem Sichtfeld gescrollt ist).
 *  - Bei reduzierter Bewegung und ohne JavaScript passiert gar nichts.
 *    --sig-p bleibt ungesetzt, das CSS rechnet dann mit dem Rückfallwert 0
 *    und der Hero steht still und vollständig sichtbar da.
 */
(function initHeroSignature() {
    'use strict';

    const start = () => {
        const hero = document.getElementById('hero');
        if (!hero) return;

        const bewegungReduziert = window.matchMedia('(prefers-reduced-motion: reduce)');

        let wartetAufBild = false;
        let letzterWert = -1;

        function fortschritt() {
            const r = hero.getBoundingClientRect();
            // Die Übergabe ist abgeschlossen, bevor der Hero ganz oben raus ist.
            // Drei Viertel der Höhe lassen den Wechsel zu Ende laufen, während
            // der folgende Abschnitt bereits ins Bild kommt.
            const weg = Math.max(1, r.height * 0.75);
            const p = -r.top / weg;
            return p < 0 ? 0 : p > 1 ? 1 : p;
        }

        function schreibe() {
            wartetAufBild = false;
            const p = fortschritt();
            // Nur schreiben, wenn sich der Wert sichtbar geändert hat. Das spart
            // überflüssige Stilneuberechnungen beim Scrollen.
            if (Math.abs(p - letzterWert) < 0.002) return;
            letzterWert = p;
            hero.style.setProperty('--sig-p', p.toFixed(4));
        }

        function anfordern() {
            if (wartetAufBild) return;
            wartetAufBild = true;
            window.requestAnimationFrame(schreibe);
        }

        function einschalten() {
            window.addEventListener('scroll', anfordern, { passive: true });
            window.addEventListener('resize', anfordern, { passive: true });
            schreibe();
        }

        function ausschalten() {
            window.removeEventListener('scroll', anfordern);
            window.removeEventListener('resize', anfordern);
            hero.style.removeProperty('--sig-p');
            letzterWert = -1;
        }

        if (!bewegungReduziert.matches) einschalten();

        // Umschalten der Systemeinstellung zur Laufzeit berücksichtigen,
        // genauso wie background-canvas.js es tut.
        const beiAenderung = () => {
            if (bewegungReduziert.matches) ausschalten();
            else einschalten();
        };
        if (bewegungReduziert.addEventListener) {
            bewegungReduziert.addEventListener('change', beiAenderung);
        } else if (bewegungReduziert.addListener) {
            bewegungReduziert.addListener(beiAenderung);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
