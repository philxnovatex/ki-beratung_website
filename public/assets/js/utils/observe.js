/**
 * Utility: Intersection Observer Factory
 * Wiederverwendbare Funktion für Scroll-Animationen (DRY-Prinzip)
 * 
 * @param {string} selector - CSS Selector für die Elemente
 * @param {string} activeClass - CSS Klasse die hinzugefügt wird
 * @param {Object} options - IntersectionObserver Optionen
 * @param {boolean} once - Nur einmal animieren (default: true)
 * @returns {IntersectionObserver|null}
 */
export function observeElements(selector, activeClass = 'visible', options = {}, once = true) {
    const elements = document.querySelectorAll(selector);
    if (!elements.length) return null;
    
    const defaultOptions = {
        threshold: 0.2,
        rootMargin: '0px'
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Fallback für Browser ohne IntersectionObserver
    if (!('IntersectionObserver' in window)) {
        elements.forEach(el => el.classList.add(activeClass));
        return null;
    }
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add(activeClass);
                if (once) {
                    observer.unobserve(entry.target);
                }
            } else if (!once) {
                entry.target.classList.remove(activeClass);
            }
        });
    }, mergedOptions);
    
    elements.forEach(el => observer.observe(el));
    
    return observer;
}

/**
 * Observe mit Timeout-Fallback
 * Falls Observer nicht triggert, werden Elemente nach Timeout sichtbar
 */
export function observeWithFallback(selector, activeClass = 'visible', options = {}, fallbackMs = 2000) {
    const elements = document.querySelectorAll(selector);
    
    observeElements(selector, activeClass, options, true);
    
    // Fallback: Nach Timeout alle sichtbar machen
    setTimeout(() => {
        elements.forEach(el => el.classList.add(activeClass));
    }, fallbackMs);
}

/**
 * Heading Animation Observer
 * Spezielle Logik für Überschriften mit temporärer Animation
 */
export function observeHeadings(selector, excludeSelector = '') {
    let elements = Array.from(document.querySelectorAll(selector));
    
    if (excludeSelector) {
        elements = elements.filter(h => !h.closest(excludeSelector));
    }
    
    elements.forEach(h => h.classList.add('heading-watch', 'hover-flash'));
    
    if (!('IntersectionObserver' in window)) return null;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('heading-in-view');
                entry.target.addEventListener('animationend', () => {
                    entry.target.classList.remove('heading-in-view');
                }, { once: true });
            }
        });
    }, { threshold: 0.4 });
    
    elements.forEach(h => observer.observe(h));
    
    return observer;
}
