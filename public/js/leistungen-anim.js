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
