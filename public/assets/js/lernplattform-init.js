// Copyright year
(function(){ var cy = document.getElementById('copyright-year'); if (cy) cy.textContent = new Date().getFullYear(); })();

document.addEventListener('DOMContentLoaded', function() {
  // Slide-in Animation bei Scroll
  function animateOnScroll() {
    const items = document.querySelectorAll('.slide-in');
    const windowHeight = window.innerHeight;

    items.forEach(item => {
      const elementTop = item.getBoundingClientRect().top;
      const elementVisible = 150;

      if (elementTop < windowHeight - elementVisible) {
        item.classList.add('visible');
      }
    });
  }

  // FAQ Toggle Funktionalität
  function setupFAQToggle() {
    const faqItems = document.querySelectorAll('.faq-card');

    faqItems.forEach(card => {
      const header = card.querySelector('.faq-header');
      const content = card.querySelector('.faq-content');
      const icon = card.querySelector('.faq-icon');

      header.addEventListener('click', () => {
        const isOpen = card.classList.contains('active');

        // Schließe alle anderen FAQ-Items
        faqItems.forEach(otherCard => {
          if (otherCard !== card) {
            otherCard.classList.remove('active');
            const otherContent = otherCard.querySelector('.faq-content');
            const otherIcon = otherCard.querySelector('.faq-icon');
            otherContent.style.maxHeight = '0';
            otherContent.style.opacity = '0';
            otherIcon.style.transform = 'rotate(0deg)';
            otherIcon.textContent = '+';
          }
        });

        if (isOpen) {
          // Schließen
          card.classList.remove('active');
          content.style.maxHeight = '0';
          content.style.opacity = '0';
          icon.style.transform = 'rotate(0deg)';
          icon.textContent = '+';
        } else {
          // Öffnen
          card.classList.add('active');
          content.style.maxHeight = content.scrollHeight + 'px';
          content.style.opacity = '1';
          icon.style.transform = 'rotate(45deg)';
          icon.textContent = '×';

          // Smooth scroll zum geöffneten Element
          setTimeout(() => {
            card.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }, 200);
        }
      });
    });
  }

  // Parallax-Effekt für Glow-Text
  function setupParallaxGlow() {
    const glowText = document.querySelector('.glow-text');

    window.addEventListener('mousemove', (e) => {
      if (!glowText) return;

      const rect = glowText.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      const distance = Math.sqrt(x * x + y * y);
      const maxDistance = 300;

      if (distance < maxDistance) {
        const intensity = (maxDistance - distance) / maxDistance;
        const glowStrength = intensity * 60;
        glowText.style.textShadow = `0 0 ${glowStrength}px #FFC947, 0 0 ${glowStrength * 1.5}px #FFC947, 0 0 ${glowStrength * 2}px #FFC947`;
      } else {
        glowText.style.textShadow = '';
      }
    });
  }

  // Initialisiere alle Funktionen
  setupFAQToggle();
  setupParallaxGlow();
  animateOnScroll();

  // Event Listener für Scroll-Animation
  window.addEventListener('scroll', animateOnScroll);

  // Trigger initial animation
  setTimeout(animateOnScroll, 100);
});
