document.addEventListener('DOMContentLoaded', () => {
  const menuButton = document.querySelector('.menu-button');
  const mainNav = document.querySelector('.main-nav');

  function setMenu(open) {
    if (!menuButton || !mainNav) return;
    menuButton.setAttribute('aria-expanded', String(open));
    mainNav.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
  }

  if (menuButton && mainNav) {
    menuButton.addEventListener('click', () => {
      setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
    });

    mainNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenu(false));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setMenu(false);
    });
  }

  document.querySelectorAll('[data-current-year]').forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
});
