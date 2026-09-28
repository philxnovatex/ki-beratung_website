// Reiter im Beispielreport
const tabs = document.querySelectorAll('[role="tab"]');
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => { t.setAttribute('aria-selected', 'false'); document.getElementById(t.getAttribute('aria-controls')).hidden = true; });
    tab.setAttribute('aria-selected', 'true');
    document.getElementById(tab.getAttribute('aria-controls')).hidden = false;
  });
  tab.addEventListener('keydown', e => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowRight' && e.key !== 'ArrowUp' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = tabs[(i + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    next.focus(); next.click();
  });
});
