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

        // Identisch zu page-common.js auf den Unterseiten.
        function setzeZustand(sichtbar) {
            nav.setAttribute('data-visible', String(sichtbar));
            navToggle.setAttribute('aria-expanded', String(sichtbar));
            navToggle.setAttribute('aria-label', sichtbar ? 'Navigation schließen' : 'Navigation öffnen');
        }

        navToggle.addEventListener('click', () => {
            setzeZustand(nav.getAttribute('data-visible') !== 'true');
        });

        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => setzeZustand(false));
        });

        // Escape schliesst und gibt den Fokus zurueck, damit Tastaturnutzer
        // nicht im geschlossenen Menue stehen bleiben.
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && nav.getAttribute('data-visible') === 'true') {
                setzeZustand(false);
                navToggle.focus();
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
    // Das Einblenden beim Scrollen liegt seit Schritt 4 zentral in
    // scroll-reveal.js und laeuft auf allen Seiten identisch. Die frueheren
    // drei Implementierungen beobachteten teils dieselben Elemente mit
    // unterschiedlichen Schwellwerten.
    
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
