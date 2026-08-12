/**
 * leistungen-anim.js – Nur noch seitenspezifische Interaktionen
 *
 * Das Einblenden beim Scrollen lag hier früher doppelt vor: Diese Datei und
 * main.js beobachteten dieselben .featured-section und .service-card, nur mit
 * unterschiedlichen Schwellwerten (0.2/0.1 gegen 0.2/0.15). Beides ist nach
 * scroll-reveal.js gewandert, das auf allen Seiten identisch arbeitet.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Icon-Animation beim Überfahren. Bei reduzierter Bewegung unterbleibt sie.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.querySelectorAll('.leistung-icon').forEach(icon => {
        icon.addEventListener('mouseenter', () => icon.classList.add('icon-animate'));
        icon.addEventListener('mouseleave', () => icon.classList.remove('icon-animate'));
    });
});
