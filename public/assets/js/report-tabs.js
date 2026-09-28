/**
 * report-tabs.js: Reiter im Beispielreport der Landingpage KI-Sichtbarkeit.
 *
 * Ohne JavaScript stehen alle Bereiche untereinander. Erst hier werden sie
 * zu Reitern: nur der gewaehlte Bereich ist sichtbar, Pfeiltasten wechseln.
 */
'use strict';

(function () {
    document.querySelectorAll('[data-report]').forEach((report) => {
        const tabs = [...report.querySelectorAll('[role="tab"]')];
        const panel = (tab) => document.getElementById(tab.getAttribute('aria-controls'));
        if (!tabs.length) return;

        function waehle(aktiv, fokus) {
            tabs.forEach((tab) => {
                const an = tab === aktiv;
                tab.setAttribute('aria-selected', String(an));
                tab.tabIndex = an ? 0 : -1;
                panel(tab).hidden = !an;
            });
            if (fokus) aktiv.focus();
        }

        report.classList.add('is-tabs');
        waehle(tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0], false);

        tabs.forEach((tab, i) => {
            tab.addEventListener('click', () => waehle(tab, false));
            tab.addEventListener('keydown', (e) => {
                const schritt = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
                if (!schritt) return;
                e.preventDefault();
                waehle(tabs[(i + schritt + tabs.length) % tabs.length], true);
            });
        });
    });
})();
