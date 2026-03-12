/**
 * page-common.js – Shared functionality for all sub-pages
 * Replaces duplicate inline <script> blocks across:
 *   kontakt.html, leistungen.html, datenschutz.html, impressum.html, danke.html
 *
 * Features:
 *   - Copyright year auto-update
 *   - Mobile nav toggle with null-safety
 */
'use strict';

(function () {
    // ── Copyright year ────────────────────────────────────────────
    const cy = document.getElementById('copyright-year');
    if (cy) cy.textContent = new Date().getFullYear();

    // ── Mobile nav toggle (null-safe) ─────────────────────────────
    const nav = document.querySelector('.main-nav');
    const navToggle = document.querySelector('.mobile-nav-toggle');

    if (nav && navToggle) {
        navToggle.addEventListener('click', function () {
            const isVisible = nav.getAttribute('data-visible') === 'true';
            nav.setAttribute('data-visible', !isVisible);
            navToggle.setAttribute('aria-expanded', !isVisible);
        });
    }
})();
