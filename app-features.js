const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const showToast = window.pbmShowToast;

function whenNearViewport(element, initialize, rootMargin = '320px 0px') {
  if (!element || !('IntersectionObserver' in window)) {
    initialize();
    return;
  }
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    initialize();
  }, { rootMargin });
  observer.observe(element);
}

whenNearViewport($('#calculator'), () => {
  const range = $('#apartmentRange');
  const rangeOutput = $('#apartmentOutput');
  const packageChecks = $$('.service-options input[type="checkbox"]');

  function updateEstimate() {
    const apartments = Number(range.value);
    const perApartment = packageChecks.reduce((sum, input) => input.checked ? sum + Number(input.dataset.price) : sum, 0);
    const percentage = ((apartments - Number(range.min)) / (Number(range.max) - Number(range.min))) * 100;
    range.style.setProperty('--range-progress', `${percentage}%`);
    rangeOutput.value = apartments;
    $('#pricePerApartment').textContent = perApartment;
    $('#totalPrice').textContent = `${(apartments * perApartment).toLocaleString('ro-RO')} lei`;
    $('input[name="apartments"]').value = apartments;
  }

  range.addEventListener('input', updateEstimate);
  packageChecks.forEach((input) => input.addEventListener('change', updateEstimate));
  updateEstimate();
});

whenNearViewport($('#proces'), () => {
  $$('.step button').forEach((button) => button.addEventListener('click', () => {
    const target = button.closest('.step');
    $$('.step').forEach((step) => {
      const active = step === target ? !step.classList.contains('active') : false;
      step.classList.toggle('active', active);
      $('button', step).setAttribute('aria-expanded', String(active));
      $('i', step).textContent = active ? '−' : '+';
    });
  }));
});

const services = {
  financiar: {
    index: '01', title: 'Financiar & contabil',
    description: 'O evidență coerentă înseamnă decizii mai bune și mai puține întrebări fără răspuns.',
    items: ['Calculul și afișarea listelor de plată', 'Evidența facturilor și a fondurilor asociației', 'Situații și rapoarte pentru comitet', 'Urmărirea încasărilor și a obligațiilor'],
  },
  tehnic: {
    index: '02', title: 'Tehnic & mentenanță',
    description: 'Problemele tehnice sunt urmărite de la sesizare până la soluționare, cu responsabilități clare.',
    items: ['Centralizarea și prioritizarea sesizărilor', 'Programarea verificărilor periodice', 'Coordonarea furnizorilor și intervențiilor', 'Urmărirea lucrărilor până la închidere'],
  },
  comunicare: {
    index: '03', title: 'Relația cu proprietarii',
    description: 'Informația utilă ajunge la timp, într-o formă care poate fi înțeleasă și verificată.',
    items: ['Informări administrative clare', 'Preluarea solicitărilor proprietarilor', 'Avizier și anunțuri organizate', 'Istoric documentat al comunicării'],
  },
  infiintare: {
    index: '04', title: 'Înființare asociație de proprietari',
    description: 'Oferim îndrumare practică pentru organizarea și constituirea asociației de proprietari a blocului.',
    items: ['Lista documentelor necesare', 'Sprijin pentru statut și acordul de asociere', 'Organizarea adunării constitutive', 'Îndrumare pentru pașii de înregistrare'],
  },
};

const serviceModal = $('#serviceModal');
whenNearViewport($('#servicii'), () => {
  $$('.service-open').forEach((button) => button.addEventListener('click', () => {
    const service = services[button.dataset.service];
    $('#modalIndex').textContent = service.index;
    $('#modalTitle').textContent = service.title;
    $('#modalDescription').textContent = service.description;
    $('#modalList').innerHTML = service.items.map((item) => `<li><span>✓</span>${item}</li>`).join('');
    serviceModal.showModal();
  }));
});

function closeDialog(dialog) {
  if (dialog.open) dialog.close();
}

$$('.modal-close').forEach((button) => button.addEventListener('click', () => closeDialog(button.closest('dialog'))));
$$('dialog').forEach((dialog) => dialog.addEventListener('click', (event) => {
  const rect = dialog.getBoundingClientRect();
  const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  if (outside) closeDialog(dialog);
}));
$('#modalCta').addEventListener('click', () => closeDialog(serviceModal));

whenNearViewport($('#oferta'), () => {
  const offerForm = $('#offerForm');
  const requestModal = $('#requestModal');

  offerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(offerForm);
    const details = String(data.get('details') || '').trim() || 'Evaluare generală a serviciilor de administrare.';
    const summary = `Solicitare evaluare — PRO BLOC MANAGER\n\nNume: ${data.get('name')}\nTelefon: ${data.get('phone')}\nLocalitate: ${data.get('city')}\nNumăr apartamente: ${data.get('apartments')}\n\nNecesități:\n${details}`;
    const submitButton = offerForm.querySelector('[type="submit"]');
    const initialButtonContent = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.textContent = 'Se trimite…';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'), phone: data.get('phone'), city: data.get('city'),
          apartments: data.get('apartments'), details, website: data.get('website'),
          requestId: crypto.randomUUID(),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Cererea nu a putut fi trimisă.');

      $('#requestSummary').textContent = summary;
      requestModal.showModal();
      offerForm.reset();
      $('input[name="apartments"]').value = $('#apartmentRange').value;
      showToast('Cererea a fost trimisă cu succes.');
    } catch (error) {
      showToast(error.message || 'Cererea nu a putut fi trimisă. Încearcă din nou.');
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = initialButtonContent;
    }
  });

  $('#copyRequest').addEventListener('click', async () => {
    const text = $('#requestSummary').textContent;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Cererea a fost copiată.');
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents($('#requestSummary'));
      selection.removeAllRanges();
      selection.addRange(range);
      showToast('Textul este selectat — folosește Ctrl+C.');
    }
  });
});

const carousel = $('[data-carousel]');
whenNearViewport(carousel, () => {
  const slides = $$('[data-slide]', carousel);
  const dots = $$('[data-slide-to]', carousel);
  const status = $('[data-carousel-status]', carousel);
  const currentSlide = $('[data-current-slide]', carousel);
  const progress = $('.carousel-progress span', carousel);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = 6500;
  let activeIndex = 0;
  let timer;
  let paused = false;
  let carouselVisible = false;

  function scheduleNext() {
    clearTimeout(timer);
    progress.classList.remove('is-running');
    if (reduceMotion || paused || !carouselVisible || document.hidden) return;
    requestAnimationFrame(() => progress.classList.add('is-running'));
    timer = setTimeout(() => showSlide(activeIndex + 1), duration);
  }

  function showSlide(index, announce = true) {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === activeIndex;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });
    dots.forEach((dot, dotIndex) => {
      const active = dotIndex === activeIndex;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', String(active));
    });
    currentSlide.textContent = String(activeIndex + 1).padStart(2, '0');
    if (announce) status.textContent = `Capitolul ${activeIndex + 1} din ${slides.length}: ${dots[activeIndex].getAttribute('aria-label')}`;
    scheduleNext();
  }

  $('.carousel-prev', carousel).addEventListener('click', () => showSlide(activeIndex - 1));
  $('.carousel-next', carousel).addEventListener('click', () => showSlide(activeIndex + 1));
  dots.forEach((dot) => dot.addEventListener('click', () => showSlide(Number(dot.dataset.slideTo))));
  carousel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') showSlide(activeIndex - 1);
    if (event.key === 'ArrowRight') showSlide(activeIndex + 1);
  });
  carousel.addEventListener('mouseenter', () => { paused = true; scheduleNext(); });
  carousel.addEventListener('mouseleave', () => { paused = false; scheduleNext(); });
  carousel.addEventListener('focusin', () => { paused = true; scheduleNext(); });
  carousel.addEventListener('focusout', (event) => {
    if (carousel.contains(event.relatedTarget)) return;
    paused = false;
    scheduleNext();
  });
  document.addEventListener('visibilitychange', scheduleNext);

  const visibilityObserver = new IntersectionObserver(([entry]) => {
    carouselVisible = entry.isIntersecting;
    if (carouselVisible && !progress.dataset.started) {
      progress.dataset.started = 'true';
      showSlide(0, false);
      return;
    }
    scheduleNext();
  }, { rootMargin: '240px 0px' });
  visibilityObserver.observe(carousel);
}, '240px 0px');

if (!window.matchMedia('(max-width: 720px)').matches) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const delay = Number(entry.target.dataset.delay || 0);
      setTimeout(() => entry.target.classList.add('visible'), delay);
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach((element) => revealObserver.observe(element));
}
