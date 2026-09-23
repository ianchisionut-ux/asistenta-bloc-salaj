const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const menuButton = $('.menu-button');
const mainNav = $('.main-nav');

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  mainNav.classList.toggle('open', !open);
  document.body.classList.toggle('menu-open', !open);
});

$$('.main-nav a').forEach((link) => link.addEventListener('click', () => {
  menuButton.setAttribute('aria-expanded', 'false');
  mainNav.classList.remove('open');
  document.body.classList.remove('menu-open');
}));

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

$$('.step button').forEach((button) => button.addEventListener('click', () => {
  const target = button.closest('.step');
  $$('.step').forEach((step) => {
    const active = step === target ? !step.classList.contains('active') : false;
    step.classList.toggle('active', active);
    $('button', step).setAttribute('aria-expanded', String(active));
    $('i', step).textContent = active ? '−' : '+';
  });
}));

const services = {
  financiar: {
    index: '01',
    title: 'Financiar & contabil',
    description: 'O evidență coerentă înseamnă decizii mai bune și mai puține întrebări fără răspuns.',
    items: ['Calculul și afișarea listelor de plată', 'Evidența facturilor și a fondurilor asociației', 'Situații și rapoarte pentru comitet', 'Urmărirea încasărilor și a obligațiilor']
  },
  tehnic: {
    index: '02',
    title: 'Tehnic & mentenanță',
    description: 'Problemele tehnice sunt urmărite de la sesizare până la soluționare, cu responsabilități clare.',
    items: ['Centralizarea și prioritizarea sesizărilor', 'Programarea verificărilor periodice', 'Coordonarea furnizorilor și intervențiilor', 'Urmărirea lucrărilor până la închidere']
  },
  comunicare: {
    index: '03',
    title: 'Relația cu proprietarii',
    description: 'Informația utilă ajunge la timp, într-o formă care poate fi înțeleasă și verificată.',
    items: ['Informări administrative clare', 'Preluarea solicitărilor proprietarilor', 'Avizier și anunțuri organizate', 'Istoric documentat al comunicării']
  },
  infiintare: {
    index: '04',
    title: 'Înființare asociație de proprietari',
    description: 'Oferim îndrumare practică pentru organizarea și constituirea asociației de proprietari a blocului.',
    items: ['Lista documentelor necesare', 'Sprijin pentru statut și acordul de asociere', 'Organizarea adunării constitutive', 'Îndrumare pentru pașii de înregistrare']
  }
};

const serviceModal = $('#serviceModal');
$$('.service-open').forEach((button) => button.addEventListener('click', () => {
  const service = services[button.dataset.service];
  $('#modalIndex').textContent = service.index;
  $('#modalTitle').textContent = service.title;
  $('#modalDescription').textContent = service.description;
  $('#modalList').innerHTML = service.items.map((item) => `<li><span>✓</span>${item}</li>`).join('');
  serviceModal.showModal();
}));

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

const offerForm = $('#offerForm');
const requestModal = $('#requestModal');
offerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(offerForm);
  const details = String(data.get('details') || '').trim() || 'Evaluare generală a serviciilor de administrare.';
  const summary = `Solicitare evaluare — Asistență Bloc Sălaj\n\nNume: ${data.get('name')}\nTelefon: ${data.get('phone')}\nLocalitate: ${data.get('city')}\nNumăr apartamente: ${data.get('apartments')}\n\nNecesități:\n${details}`;
  $('#requestSummary').textContent = summary;
  requestModal.showModal();
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

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2800);
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const delay = Number(entry.target.dataset.delay || 0);
    setTimeout(() => entry.target.classList.add('visible'), delay);
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12 });

$$('.reveal').forEach((element) => revealObserver.observe(element));

const header = $('.site-header');
window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 16), { passive: true });
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
