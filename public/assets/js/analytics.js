/** Conversion-Events enthalten ausschließlich fest definierte Kategorien. */
(function initAnalytics() {
    'use strict';
    window.neuratexTrack = function (event, data = {}) {
        if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
        // Analysefehler dürfen niemals Formulare oder Links blockieren.
        try {
            if (typeof window.umami?.track !== 'function') return;
            Promise.resolve(window.umami.track(event, data)).catch(() => {});
        } catch { /* Auch mit blockiertem Tracker bleibt die Seite bedienbar. */ }
    };
    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[data-calendly-location]');
        if (!link) return;
        window.neuratexTrack('calendly_click', { location: link.dataset.calendlyLocation });
    });
})();
