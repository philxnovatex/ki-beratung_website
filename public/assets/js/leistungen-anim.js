// Scroll-Animationen und Icon-Animationen für Leistungen

document.addEventListener("DOMContentLoaded", () => {
    const sections = document.querySelectorAll(".featured-section");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("in-view");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    sections.forEach(section => observer.observe(section));

    // Service Cards Animation
    const cards = document.querySelectorAll(".service-card");
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("in-view");
                cardObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    cards.forEach(card => cardObserver.observe(card));

    // Icon Animation (optional: z.B. wackeln beim Hover)
    const icons = document.querySelectorAll('.leistung-icon');
    icons.forEach(icon => {
        icon.addEventListener('mouseenter', () => {
            icon.classList.add('icon-animate');
        });
        icon.addEventListener('mouseleave', () => {
            icon.classList.remove('icon-animate');
        });
    });
});
