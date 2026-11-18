const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

let featuresPromise;
function loadFeatures() {
  document.documentElement.classList.add('features-ready');
  if (!featuresPromise) {
    featuresPromise = import('/app-features.js?v=20261118').catch((error) => {
      console.error('Funcțiile interactive nu au putut fi încărcate.', error);
      featuresPromise = null;
    });
  }
  return featuresPromise;
}

const menuButton = $('.menu-button');
const mainNav = $('.main-nav');

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  mainNav.classList.toggle('open', !open);
  document.body.classList.toggle('menu-open', !open);
});

$$('.main-nav a').forEach((link) => link.addEventListener('click', () => {
  loadFeatures();
  menuButton.setAttribute('aria-expanded', 'false');
  mainNav.classList.remove('open');
  document.body.classList.remove('menu-open');
}));

const compactViewport = window.matchMedia('(max-width: 720px)').matches;
const saveData = navigator.connection?.saveData === true;
if (!compactViewport && !saveData) {
  const heroBackgrounds = $$('[data-hero-bg]');
  const reduceHeroMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const heroSection = $('.hero');
  let heroIndex = 0;
  let heroTimer;
  let heroVisible = true;

  function scheduleHeroBackground() {
    clearTimeout(heroTimer);
    if (reduceHeroMotion || document.hidden || !heroVisible) return;
    heroTimer = setTimeout(() => showHeroBackground(heroIndex + 1), 7000);
  }

  function showHeroBackground(index) {
    const nextIndex = (index + heroBackgrounds.length) % heroBackgrounds.length;
    const nextBackground = heroBackgrounds[nextIndex];
    const deferredSource = nextBackground.dataset.heroSrc;

    const activate = () => {
      heroIndex = nextIndex;
      heroBackgrounds.forEach((background, backgroundIndex) => background.classList.toggle('is-active', backgroundIndex === heroIndex));
      scheduleHeroBackground();
    };

    if (deferredSource) {
      nextBackground.addEventListener('load', activate, { once: true });
      nextBackground.addEventListener('error', activate, { once: true });
      nextBackground.src = deferredSource;
      delete nextBackground.dataset.heroSrc;
      return;
    }
    activate();
  }

  const heroVisibilityObserver = new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    scheduleHeroBackground();
  }, { threshold: 0.08 });
  heroVisibilityObserver.observe(heroSection);
  document.addEventListener('visibilitychange', scheduleHeroBackground);
}

const header = $('.site-header');
let headerIsScrolled = false;
if (location.hash && location.hash !== '#acasa') loadFeatures();
else window.addEventListener('scroll', loadFeatures, { passive: true, once: true });
function updateHeaderState() {
  const nextState = window.scrollY > 16;
  if (nextState === headerIsScrolled) return;
  headerIsScrolled = nextState;
  header.classList.toggle('scrolled', nextState);
}
window.addEventListener('scroll', updateHeaderState, { passive: true });

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2800);
}
window.pbmShowToast = showToast;

const whatsappToggle = $('#whatsappToggle');
const whatsappCard = $('#whatsappCard');
const whatsappClose = $('.whatsapp-close');

function setWhatsappCard(open) {
  whatsappCard.classList.toggle('open', open);
  whatsappCard.setAttribute('aria-hidden', String(!open));
  whatsappToggle.setAttribute('aria-expanded', String(open));
}

whatsappToggle.addEventListener('click', () => setWhatsappCard(!whatsappCard.classList.contains('open')));
whatsappClose.addEventListener('click', () => setWhatsappCard(false));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setWhatsappCard(false);
});

const cookieNotice = $('#cookieNotice');
const cookieAcknowledge = $('#cookieAcknowledge');
const cookieSettings = $('#cookieSettings');
const cookiePreferenceKey = 'pbm_cookie_notice_v1';
const cookiePreferenceLifetime = 365 * 24 * 60 * 60 * 1000;

function readCookiePreference() {
  try {
    const preference = JSON.parse(localStorage.getItem(cookiePreferenceKey));
    if (!preference || preference.status !== 'necessary-only' || Date.now() - preference.savedAt > cookiePreferenceLifetime) {
      localStorage.removeItem(cookiePreferenceKey);
      return null;
    }
    return preference;
  } catch {
    return null;
  }
}

function setCookieNotice(open) {
  cookieNotice.hidden = !open;
  whatsappToggle.classList.toggle('with-cookie-notice', open);
  whatsappCard.classList.toggle('with-cookie-notice', open);
}

function saveCookiePreference() {
  try {
    localStorage.setItem(cookiePreferenceKey, JSON.stringify({
      status: 'necessary-only', savedAt: Date.now(), version: 1,
    }));
  } catch {
    // Site-ul rămâne complet funcțional dacă stocarea locală este blocată.
  }
  document.documentElement.classList.add('cookie-preference-saved');
  setCookieNotice(false);
  showToast('Preferința de confidențialitate a fost salvată.');
}

cookieAcknowledge.addEventListener('click', saveCookiePreference);
cookieSettings.addEventListener('click', () => {
  document.documentElement.classList.remove('cookie-preference-saved');
  setCookieNotice(true);
  cookieAcknowledge.focus();
});

if (readCookiePreference()) setCookieNotice(false);
