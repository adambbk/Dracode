/*
 * Dracode — interactions du site
 * Version nettoyée : aucun accès à des éléments inexistants, aucune variable globale non définie.
 */

'use strict';

const PAYMENT_LINKS = {
  card: {
    Essentiel: 'https://buy.stripe.com/cNi00ledLeY801L6cH9oc00L',
    Business: 'https://buy.stripe.com/4gM4gB2v317i3dXfNh9oc01',
    Premium: 'https://buy.stripe.com/6oU9AV7Png2cg0JeJd9oc02'
  },
  crypto: {
    Essentiel: 'https://commerce.coinbase.com/checkout/a01a7da6-bdca-47d9-b0d2-f78f1047ec91',
    Business: 'https://commerce.coinbase.com/checkout/be451f09-7b84-4514-91eb-c245550dd9a4',
    Premium: 'https://commerce.coinbase.com/checkout/9f55932f-8322-49f0-b2e1-83973e1e0783'
  }
};

function normalisePlan(value) {
  const plan = String(value || '').trim().toLowerCase();
  if (plan === 'business' || plan === 'quarterly') return 'Business';
  if (plan === 'premium' || plan === 'yearly') return 'Premium';
  return 'Essentiel';
}

function repairMarkup() {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) viewport.setAttribute('content', 'width=device-width, initial-scale=1');

  const hero = document.querySelector('.hero');
  if (hero && !hero.id) hero.id = 'hero';

  document.querySelectorAll('a[href="mailto:adam.bouberka@gmail.com.com"]').forEach((link) => {
    link.href = 'mailto:adam.bouberka@gmail.com';
  });

  document.querySelectorAll('img[src="images/lgo.drck.png"]').forEach((image) => {
    image.src = 'lgo.drck.png';
  });

  const duplicatedPrices = document.querySelectorAll('#proPrice');
  duplicatedPrices.forEach((element, index) => {
    if (index > 0) element.removeAttribute('id');
  });
}

function setupMobileMenu() {
  const button = document.querySelector('.mobile-menu-btn');
  const links = document.querySelector('.nav-links');
  const cta = document.querySelector('.nav-cta');
  if (!button || !links) return;

  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', 'Ouvrir le menu');

  const closeMenu = () => {
    links.classList.remove('active');
    if (cta) cta.classList.remove('active');
    button.textContent = '☰';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Ouvrir le menu');
  };

  button.addEventListener('click', () => {
    const open = links.classList.toggle('active');
    if (cta) cta.classList.toggle('active', open);
    button.textContent = open ? '✕' : '☰';
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  });

  links.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
}

function setupPricing() {
  const buttons = [...document.querySelectorAll('.billing-option')];
  const cards = [...document.querySelectorAll('.pricing-card')];

  const selectPlan = (rawPlan) => {
    const plan = normalisePlan(rawPlan);
    const targetIndex = plan === 'Business' ? 1 : plan === 'Premium' ? 2 : 0;

    buttons.forEach((button) => {
      button.classList.toggle('active', normalisePlan(button.dataset.billing) === plan);
    });

    cards.forEach((card, index) => {
      const selected = index === targetIndex;
      card.classList.toggle('featured', selected);
      card.style.opacity = selected ? '1' : '0.65';
      card.style.transform = selected ? 'translateY(-8px)' : 'none';
    });
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => selectPlan(button.dataset.billing));
  });

  document.querySelectorAll('.pricing-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const card = button.closest('.pricing-card');
      const planName = card?.querySelector('.pricing-name')?.textContent;
      const plan = normalisePlan(planName);
      window.location.href = `checkout.html?plan=${encodeURIComponent(plan)}`;
    });
  });

  if (cards.length) selectPlan('Essentiel');
}

function setupSliders() {
  const sliders = [...document.querySelectorAll('.slider-track')];
  if (!sliders.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  window.setInterval(() => {
    sliders.forEach((slider) => {
      const atEnd = slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 5;
      slider.scrollTo({
        left: atEnd ? 0 : slider.scrollLeft + slider.clientWidth,
        behavior: 'smooth'
      });
    });
  }, 5000);
}

function setupCheckout() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const requestedPlan = normalisePlan(params.get('plan'));
  const matchingPlan = form.querySelector(`input[name="plan"][value="${requestedPlan}"]`);
  if (matchingPlan) matchingPlan.checked = true;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const plan = normalisePlan(form.elements.plan?.value);
    const payment = form.elements.payment?.value === 'crypto' ? 'crypto' : 'card';
    const email = String(form.elements.email?.value || '').trim();
    const submitButton = form.querySelector('button[type="submit"]');
    const status = document.getElementById('checkout-status');

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      if (status) status.textContent = 'Veuillez saisir une adresse e-mail valide.';
      form.elements.email?.focus();
      return;
    }

    const destination = PAYMENT_LINKS[payment]?.[plan];
    if (!destination) {
      if (status) status.textContent = 'Le lien de paiement est indisponible.';
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Redirection…';
    }
    if (status) status.textContent = 'Préparation du paiement sécurisé…';

    try {
      const response = await fetch('https://formspree.io/f/xlgeawpp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, formule: plan, paiement: payment })
      });
      if (!response.ok) console.warn('Notification Formspree non confirmée:', response.status);
    } catch (error) {
      console.warn('Notification Formspree impossible:', error);
    }

    const separator = destination.includes('?') ? '&' : '?';
    window.location.assign(`${destination}${separator}prefilled_email=${encodeURIComponent(email)}`);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  repairMarkup();
  setupMobileMenu();
  setupPricing();
  setupSliders();
  setupCheckout();
});
