/**
 * Main.js - Zentrale JavaScript-Datei
 * Enthält Navigation, Scroll-Animationen und allgemeine Interaktionen
 */
(function initMain() {
    'use strict';
    
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
        initProblemLines();
    }
    
    // Start wenn DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
