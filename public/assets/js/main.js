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
        const problemEl = document.getElementById('problem');
        
        if (!scrollBar) return;
        
        let progressActive = false;
        
        function updateScrollBar() {
            if (!progressActive) return;
            
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? scrollTop / docHeight : 0;
            
            scrollBar.style.transform = `scaleY(${progress})`;
            scrollBar.classList.add('active');
        }
        
        function checkActivateBar() {
            if (!problemEl) {
                progressActive = true;
                scrollBar.style.display = 'block';
                return;
            }
            
            const rect = problemEl.getBoundingClientRect();
            if (rect.top <= window.innerHeight * 0.9) {
                progressActive = true;
                scrollBar.style.display = 'block';
                updateScrollBar();
                window.removeEventListener('scroll', checkActivateBar);
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
        
        // Generische Observer-Factory
        function createObserver(threshold = 0.2, once = true) {
            return new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible', 'in-view');
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
        
        // Fallback: Nach 2s alle sichtbar machen
        setTimeout(() => {
            document.querySelectorAll('.service-card, .problem-column, .solution-column')
                .forEach(el => el.classList.add('visible', 'in-view'));
        }, 2000);
    }
    
    // ========================================
    // Heading Animations
    // ========================================
    function initHeadingAnimations() {
        const excludeSelectors = '.service-card, .principle-card, .lead-gen-form-container, .contact-card';
        const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
            .filter(h => !h.closest(excludeSelectors));
        
        headings.forEach(h => h.classList.add('heading-watch', 'hover-flash'));
        
        if (!('IntersectionObserver' in window)) return;
        
        const headingObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('heading-in-view');
                    entry.target.addEventListener('animationend', () => {
                        entry.target.classList.remove('heading-in-view');
                    }, { once: true });
                }
            });
        }, { threshold: 0.4 });
        
        headings.forEach(h => headingObserver.observe(h));
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
