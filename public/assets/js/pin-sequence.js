/**
 * pin-sequence.js – Abschnitte, die beim Scrollen einrasten und durchschalten
 *
 * Nachfolger von ablauf-pin.js. Die Scroll-Mechanik ist fuer alle solchen
 * Abschnitte dieselbe, deshalb steht sie hier einmal und wird ueber die Liste
 * SEKTIONEN konfiguriert, statt pro Abschnitt kopiert zu werden.
 *
 * Das Skript setzt ausschliesslich Klassen:
 *   - .pin-aktiv an der Sektion, die im CSS das Layout umschaltet
 *   - die konfigurierte Klasse am jeweils sichtbaren Schritt
 * Die gesamte Gestaltung liegt im CSS (sections/ablauf.css, style.css).
 *
 * Wann nicht eingerastet wird:
 *   - ohne JavaScript (dann laeuft dieses Skript gar nicht)
 *   - bei prefers-reduced-motion
 *   - unter 900 px Fensterbreite
 *   - unter 560 px Fensterhoehe
 * In all diesen Faellen bleibt die gewohnte Darstellung stehen, mit allen
 * Schritten sichtbar. Die Schwellen sind bewusst niedrig: Ein 1366x768-Laptop
 * hat nach Browser- und Taskleiste rund 600 px Hoehe, und ein Abschnitt, der
 * dort kommentarlos auf die Liste zurueckfaellt, sieht aus wie ein Fehler.
 */
(function initPinSequence() {
    'use strict';

    /* Pro Abschnitt: wo er steht, was seine Schritte sind, wie der aktive
       Schritt heisst, und ob er eine Fortschrittsleiste und grosse Ziffern
       bekommt. Weitere Abschnitte brauchen nur einen Eintrag hier plus die
       passenden CSS-Regeln. */
    const SEKTIONEN = [
        {
            id: 'principles',
            schritte: '[data-phase]',
            aktivKlasse: 'phase-aktiv',
            leiste: true,
            leisteLabel: 'Phase',
            ziffern: true
        },
        {
            id: 'problem-solution',
            schritte: '[data-pin-step]',
            aktivKlasse: 'schritt-aktiv',
            leiste: false,
            // Diese Schritte tragen keine Namen, die sich beschriften liessen.
            // Drei Striche zeigen den Fortschritt, ohne etwas zu behaupten.
            punkte: true,
            ziffern: false
        }
    ];

    const bewegungReduziert = window.matchMedia('(prefers-reduced-motion: reduce)');
    const zuSchmal = window.matchMedia('(max-width: 900px)');

    function darfPinnen() {
        if (bewegungReduziert.matches || zuSchmal.matches) return false;
        return window.innerHeight >= 560;
    }

    /* Der klebende Kopfbereich liegt ueber jeder eingerasteten Buehne. Seine
       Hoehe wird gemessen und ans CSS gereicht, damit Ueberschriften nicht
       darunter verschwinden. */
    function kopfHoehe() {
        const kopf = document.querySelector('.main-header');
        return kopf ? Math.round(kopf.getBoundingClientRect().height) : 0;
    }

    function baueSequenz(konfig) {
        const sektion = document.getElementById(konfig.id);
        if (!sektion) return null;

        const schritte = Array.prototype.slice.call(sektion.querySelectorAll(konfig.schritte));
        if (schritte.length < 2) return null;

        let aktiv = false;
        let rail = null;
        let punkte = null;
        let letzterSchritt = -1;
        let wartetAufBild = false;

        /* Die Leiste wird hier erzeugt und nicht ins HTML geschrieben: Ohne
           Einrasten waere sie sinnlos. */
        function baueRail() {
            if (rail || !konfig.leiste) return;
            rail = document.createElement('div');
            rail.className = 'pin-rail';
            rail.setAttribute('aria-hidden', 'true');
            rail.style.setProperty('--phasen', schritte.length);

            schritte.forEach((el, i) => {
                const h3 = el.querySelector('h3');
                // "1. Analyse & Potenzial" -> "Analyse & Potenzial"
                const text = (h3 ? h3.textContent : '').replace(/^\s*\d+\.\s*/, '').trim();
                const eintrag = document.createElement('div');
                eintrag.className = 'pin-rail__step';
                eintrag.dataset.status = 'offen';

                const nr = document.createElement('span');
                nr.className = 'pin-rail__nr';
                nr.textContent = (konfig.leisteLabel || 'Schritt') + ' ' + (i + 1);

                const label = document.createElement('span');
                label.className = 'pin-rail__label';
                label.textContent = text;

                eintrag.appendChild(nr);
                eintrag.appendChild(label);
                rail.appendChild(eintrag);
            });

            const ziel = schritte[0].closest('.timeline, .problem-solution-grid') || schritte[0].parentNode;
            ziel.parentNode.insertBefore(rail, ziel);
        }

        function bauePunkte() {
            if (punkte || !konfig.punkte) return;
            punkte = document.createElement('div');
            punkte.className = 'pin-punkte';
            punkte.setAttribute('aria-hidden', 'true');
            schritte.forEach(() => {
                const s = document.createElement('span');
                s.className = 'pin-punkt';
                s.dataset.status = 'offen';
                punkte.appendChild(s);
            });
            const ziel = schritte[0].closest('.problem-solution-grid') || schritte[0].parentNode;
            ziel.parentNode.insertBefore(punkte, ziel.nextSibling);
        }

        /* Ueberschriften der Form "1. Analyse & Potenzial" werden geteilt: Die
           Ziffer wird zur grossen Marke, der Rest zum Titel. Aufgebaut ueber
           Textknoten, nicht ueber innerHTML. */
        function ziffernTrennen() {
            if (!konfig.ziffern) return;
            schritte.forEach((el, i) => {
                const h3 = el.querySelector('h3');
                if (!h3 || h3.querySelector('.phase-nr')) return;
                const roh = h3.textContent.trim();
                const treffer = roh.match(/^(\d+)\.\s*(.+)$/);
                if (!treffer) return;

                h3.dataset.original = roh;
                h3.textContent = '';

                const nr = document.createElement('span');
                nr.className = 'phase-nr';
                nr.setAttribute('aria-hidden', 'true');
                nr.textContent = String(i + 1).padStart(2, '0');

                // Die grosse Ziffer traegt die Nummer optisch. Fuer Screenreader
                // muss sie erhalten bleiben, weil sie dort ausgeblendet ist.
                const vorgelesen = document.createElement('span');
                vorgelesen.className = 'sr-only';
                vorgelesen.textContent = 'Phase ' + treffer[1] + ': ';

                const titel = document.createElement('span');
                titel.className = 'phase-titel';
                titel.textContent = treffer[2];

                h3.appendChild(nr);
                h3.appendChild(vorgelesen);
                h3.appendChild(titel);
            });
        }

        function ziffernZuruecksetzen() {
            schritte.forEach(el => {
                const h3 = el.querySelector('h3');
                if (!h3 || !h3.dataset.original) return;
                h3.textContent = h3.dataset.original;
                delete h3.dataset.original;
            });
        }

        function zeigeSchritt(index) {
            if (index === letzterSchritt) return;
            letzterSchritt = index;
            schritte.forEach((el, i) => el.classList.toggle(konfig.aktivKlasse, i === index));

            const anzeige = rail || punkte;
            if (!anzeige) return;
            Array.prototype.forEach.call(anzeige.children, (el, i) => {
                el.dataset.status = i < index ? 'fertig' : i === index ? 'aktiv' : 'offen';
            });
        }

        function berechne() {
            wartetAufBild = false;
            if (!aktiv) return;

            const r = sektion.getBoundingClientRect();
            const weg = r.height - window.innerHeight;
            if (weg <= 0) return;

            // 0 am Beginn des Einrastens, 1 am Ende.
            let p = -r.top / weg;
            p = p < 0 ? 0 : p > 1 ? 1 : p;

            // Gleichmaessig verteilen. Das Ende gehoert noch dem letzten
            // Schritt, sonst flackert er beim Verlassen kurz weg.
            const index = Math.min(schritte.length - 1, Math.floor(p * schritte.length));
            zeigeSchritt(index);
        }

        function anfordern() {
            if (wartetAufBild) return;
            wartetAufBild = true;
            window.requestAnimationFrame(berechne);
        }

        function kopfHoeheSetzen() {
            const h = kopfHoehe();
            if (h > 0) sektion.style.setProperty('--kopf-hoehe', h + 'px');
        }

        function einschalten() {
            if (aktiv) return;
            aktiv = true;
            kopfHoeheSetzen();
            sektion.style.setProperty('--schritte', schritte.length);
            baueRail();
            bauePunkte();
            ziffernTrennen();
            sektion.classList.add('pin-aktiv');
            window.addEventListener('scroll', anfordern, { passive: true });
            letzterSchritt = -1;
            berechne();
        }

        function ausschalten() {
            if (!aktiv) return;
            aktiv = false;
            window.removeEventListener('scroll', anfordern);
            sektion.classList.remove('pin-aktiv');
            ziffernZuruecksetzen();
            // Alle Schritte wieder sichtbar zuruecklassen, nicht halb geschaltet.
            schritte.forEach(el => el.classList.remove(konfig.aktivKlasse));
            if (rail) { rail.remove(); rail = null; }
            if (punkte) { punkte.remove(); punkte = null; }
            letzterSchritt = -1;
        }

        return {
            pruefe: function () {
                if (darfPinnen()) einschalten();
                else ausschalten();
            },
            messen: function () {
                if (aktiv) { kopfHoeheSetzen(); anfordern(); }
            }
        };
    }

    const start = () => {
        const sequenzen = SEKTIONEN.map(baueSequenz).filter(Boolean);
        if (!sequenzen.length) return;

        const pruefeAlle = () => sequenzen.forEach(s => s.pruefe());
        pruefeAlle();

        [bewegungReduziert, zuSchmal].forEach(q => {
            if (q.addEventListener) q.addEventListener('change', pruefeAlle);
            else if (q.addListener) q.addListener(pruefeAlle);
        });

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                pruefeAlle();
                sequenzen.forEach(s => s.messen());
            }, 150);
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
