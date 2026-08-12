/**
 * Main.js - Zentrale JavaScript-Datei
 * Enthält Navigation, Scroll-Animationen und allgemeine Interaktionen
 */
(function initMain() {
    'use strict';
    
    // ========================================
    // Copyright Year
    // ========================================
    const cy = document.getElementById('copyright-year');
    if (cy) cy.textContent = new Date().getFullYear();

    // ========================================
    // Mobile Navigation
    // ========================================
    function initMobileNav() {
        const nav = document.querySelector('.main-nav');
        const navToggle = document.querySelector('.mobile-nav-toggle');
        
        if (!nav || !navToggle) return;
        
        navToggle.addEventListener('click', () => {
            const isVisible = nav.getAttribute('data-visible') === 'true';
            nav.setAttribute('data-visible', !isVisible);
            navToggle.setAttribute('aria-expanded', !isVisible);
        });
        
        // Schließen bei Klick auf Link
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.setAttribute('data-visible', 'false');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });
        
        // Schließen bei Escape-Taste
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && nav.getAttribute('data-visible') === 'true') {
                nav.setAttribute('data-visible', 'false');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }
    
    // ========================================
    // Scroll Progress Bar
    // ========================================
    function initScrollProgress() {
        const scrollBar = document.getElementById('scroll-progress');
        // Die Section heißt 'problem-solution'; die alte ID 'problem' existierte nicht,
        // wodurch der Aktivierungs-Listener nie entfernt wurde und dauerhaft mitlief.
        const triggerEl = document.getElementById('problem-solution');

        if (!scrollBar) return;

        let progressActive = false;
        let ticking = false;

        function render() {
            ticking = false;
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? scrollTop / docHeight : 0;

            scrollBar.style.transform = `scaleY(${progress})`;
        }

        function updateScrollBar() {
            if (!progressActive || ticking) return;
            ticking = true;
            requestAnimationFrame(render);
        }

        function activate() {
            progressActive = true;
            scrollBar.style.display = 'block';
            scrollBar.classList.add('active');
            render();
            window.removeEventListener('scroll', checkActivateBar);
        }

        function checkActivateBar() {
            if (!triggerEl) {
                activate();
                return;
            }

            const rect = triggerEl.getBoundingClientRect();
            if (rect.top <= window.innerHeight * 0.9) {
                activate();
            }
        }

        window.addEventListener('scroll', updateScrollBar, { passive: true });
        window.addEventListener('scroll', checkActivateBar, { passive: true });
    }
    
    // ========================================
    // Scroll Reveal Animations (DRY-konsolidiert)
    // ========================================
    function initScrollAnimations() {
        // Fallback für Browser ohne IntersectionObserver
        if (!('IntersectionObserver' in window)) {
            document.querySelectorAll('.problem-column, .solution-column, .service-card, .featured-section')
                .forEach(el => el.classList.add('visible', 'in-view'));
            return;
        }
        
        let revealCount = 0;

        // Generische Observer-Factory
        function createObserver(threshold = 0.2, once = true) {
            return new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible', 'in-view');
                        revealCount++;
                        if (once) observer.unobserve(entry.target);
                    }
                });
            }, { threshold });
        }
        
        // Problem & Lösung Columns
        const columnObserver = createObserver(0.2);
        document.querySelectorAll('.problem-column, .solution-column')
            .forEach(el => columnObserver.observe(el));
        
        // Service Cards
        const cardObserver = createObserver(0.15);
        document.querySelectorAll('.services-grid .service-card')
            .forEach(el => cardObserver.observe(el));
        
        // Featured Sections (Leistungen)
        const sectionObserver = createObserver(0.2);
        document.querySelectorAll('.featured-section')
            .forEach(el => sectionObserver.observe(el));
        
        // Sicherheitsnetz: Nur wenn der Observer nach 2s überhaupt nichts ausgelöst
        // hat, gehen wir von einem Defekt aus und machen alles sichtbar. Vorher wurde
        // hier pauschal alles eingeblendet, was die Scroll-Animation wirkungslos machte.
        setTimeout(() => {
            if (revealCount > 0) return;
            document.querySelectorAll('.service-card, .problem-column, .solution-column, .featured-section')
                .forEach(el => el.classList.add('visible', 'in-view'));
        }, 2000);
    }
    
    // ========================================
    // Heading Animations
    // ========================================
    function initHeadingAnimations() {
        // Ohne IntersectionObserver bleiben die Ueberschriften unangetastet und
        // damit sichtbar. Die Klasse darf dann gar nicht erst gesetzt werden,
        // weil sie die Deckkraft auf 0 stellt.
        if (!('IntersectionObserver' in window)) return;

        // Nur Sektionsueberschriften. Frueher lief der Effekt auf allen h1, h2
        // und h3 der Seite, also auf ueber 30 Elementen. Beim Scrollen entstand
        // daraus eine Dauerbewegung. h3 in Karten animiert ohnehin die Karte.
        const excludeSelectors = '.service-card, .stage-card, .testimonial-card, .principle-card,'
            + ' .lead-gen-form-container, .contact-card, .hero-section, .result-card';
        const headings = Array.from(document.querySelectorAll('h2'))
            .filter(h => !h.closest(excludeSelectors));

        headings.forEach(h => h.classList.add('heading-watch'));

        const headingObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                // Klasse bleibt bestehen: Der Auftritt ist ein Fade-in, kein Blitz.
                // Wuerde sie nach der Animation entfernt, faellt die Ueberschrift
                // auf Deckkraft 0 zurueck und verschwindet.
                entry.target.classList.add('heading-in-view');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.25 });

        headings.forEach(h => headingObserver.observe(h));

        // Sicherheitsnetz: Ueberschriften, die nach 2 Sekunden nie beobachtet
        // wurden (etwa in anfangs ausgeblendeten Bereichen), werden sichtbar.
        setTimeout(() => {
            headings.forEach(h => h.classList.add('heading-in-view'));
        }, 2000);
    }
    
    // ========================================
    // Case Study Metric Count-Up Animation
    // ========================================
    function initCaseStudyMetrics() {
        const metrics = document.querySelectorAll('.cs-metric');
        if (!metrics.length || !('IntersectionObserver' in window)) return;

        function easeOutExpo(t) {
            return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        }

        function animateValue(el, target, prefix, suffix, decimals, duration) {
            const start = performance.now();
            function tick(now) {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                const eased = easeOutExpo(progress);
                const current = eased * target;
                const formatted = decimals > 0
                    ? current.toFixed(decimals).replace('.', ',')
                    : Math.round(current).toLocaleString('de-DE');
                el.textContent = prefix + formatted + suffix;
                if (progress < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        }

        const metricsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const metric = entry.target;
                metric.classList.add('in-view');
                metricsObserver.unobserve(metric);

                const valueEl = metric.querySelector('.cs-metric-value');
                const target = parseFloat(metric.dataset.target);
                const prefix = metric.dataset.prefix || '';
                const suffix = metric.dataset.suffix || '';
                const decimals = String(target).includes('.') ? 2 : 0;
                const delay = parseFloat(getComputedStyle(valueEl).transitionDelay) * 1000 || 0;

                setTimeout(() => {
                    animateValue(valueEl, target, prefix, suffix, decimals, 1800);
                }, delay);
            });
        }, { threshold: 0.3 });

        metrics.forEach(m => metricsObserver.observe(m));
    }

    // ========================================
    // Problem Section Lines Animation
    // ========================================
    function initProblemLines() {
        const lines = document.querySelectorAll('.problem-line');
        if (!lines.length) return;
        
        // Alle Lines sichtbar machen (Legacy-Support)
        lines.forEach(l => l.classList.add('show'));
    }
    
    // ========================================
    // Initialisierung
    // ========================================
    function init() {
        initMobileNav();
        initScrollProgress();
        initScrollAnimations();
        initHeadingAnimations();
        initCaseStudyMetrics();
        initProblemLines();
    }
    
    // Start wenn DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
