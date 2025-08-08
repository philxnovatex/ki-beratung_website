window.addEventListener('DOMContentLoaded', () => {
  const lines = document.querySelectorAll('.problem-line');
  if (!lines.length) return;

  lines.forEach((line, idx) => line.dataset.index = idx);
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.index * 150;
        entry.target.style.transitionDelay = `${delay}ms`;
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  lines.forEach(line => observer.observe(line));
});
