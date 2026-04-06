// FAQ Accordion for BAFA page
document.querySelectorAll('.faq-question').forEach(function(btn) {
    btn.addEventListener('click', function() {
        var item = this.closest('.faq-item');
        var isOpen = item.classList.contains('open');
        // Close all
        document.querySelectorAll('.faq-item').forEach(function(i) {
            i.classList.remove('open');
            i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        });
        // Toggle current
        if (!isOpen) {
            item.classList.add('open');
            this.setAttribute('aria-expanded', 'true');
        }
    });
});
