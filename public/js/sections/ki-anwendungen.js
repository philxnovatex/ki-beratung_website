// KI-Anwendungen Scroll Reveal & Accessibility
(function(){
  const root = document.documentElement;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    root.classList.add('prefers-reduced-motion');
  }
  const section = document.getElementById('ki-anwendungen');
  if(!section) return;
  const cards = Array.from(section.querySelectorAll('.ki-apps__card'));
  let revealed = false;

  const opts = { threshold: 0.2 };
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        if(entry.target === section && !revealed){
          section.classList.add('revealed');
          revealed = true;
        }
        if(cards.includes(entry.target)){
          const idx = cards.indexOf(entry.target);
          const delay = Math.min(120, 80 + idx * 40); // slight stagger
          if(!root.classList.contains('prefers-reduced-motion')){
            entry.target.style.transitionDelay = (idx * 120) + 'ms';
          }
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      }
    });
  }, opts);

  io.observe(section); // observe section for title effect
  cards.forEach(c => io.observe(c));

  // Fallback if IntersectionObserver unsupported
  if(!('IntersectionObserver' in window)){
    cards.forEach(c => c.classList.add('in-view'));
    section.classList.add('revealed');
  }
})();
