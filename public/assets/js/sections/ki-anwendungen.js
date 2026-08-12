// KI-Anwendungen: Nur noch der Titel-Effekt der Sektion.
// Die Karten selbst blendet scroll-reveal.js ein, inklusive Staffelung.
// Vorher lag hier eine dritte, eigene Reveal-Implementierung.
(function () {
    const section = document.getElementById('ki-anwendungen');
    if (!section) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.classList.add('prefers-reduced-motion');
        section.classList.add('revealed');
        return;
    }

    if (!('IntersectionObserver' in window)) {
        section.classList.add('revealed');
        return;
    }

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            section.classList.add('revealed');
            io.unobserve(entry.target);
        });
    }, { threshold: 0.2 });

    io.observe(section);
})();
