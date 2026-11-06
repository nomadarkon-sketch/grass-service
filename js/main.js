/**
 * GreenCut — Main JavaScript
 * Modules: Header scroll, Mobile nav, Equipment tabs, AOS, Form validation, Smooth scroll
 */

'use strict';

/* ============================================================
   UTILS
   ============================================================ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function debounce(fn, ms = 150) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* ============================================================
   1. HEADER — scroll behaviour
   ============================================================ */
function initHeader() {
  const header = $('#header');
  if (!header) return;

  const toggle = () => {
    const scrolled = window.scrollY > 20;
    header.classList.toggle('scrolled', scrolled);
  };

  toggle();
  window.addEventListener('scroll', toggle, { passive: true });
}

/* ============================================================
   2. MOBILE NAV — burger toggle
   ============================================================ */
function initMobileNav() {
  const burger    = $('#burger');
  const mobileNav = $('#mobileNav');
  if (!burger || !mobileNav) return;

  const links = $$('.mobile-nav__link, .mobile-nav__actions .btn', mobileNav);

  function open() {
    burger.classList.add('active');
    mobileNav.classList.add('open');
    mobileNav.removeAttribute('aria-hidden');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    burger.classList.remove('active');
    mobileNav.classList.remove('open');
    mobileNav.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  burger.addEventListener('click', () => {
    mobileNav.classList.contains('open') ? close() : open();
  });

  links.forEach(l => l.addEventListener('click', close));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mobileNav.classList.contains('open')) close();
  });

  // Close on outside tap
  document.addEventListener('click', e => {
    if (
      mobileNav.classList.contains('open') &&
      !mobileNav.contains(e.target) &&
      !burger.contains(e.target)
    ) close();
  });
}

/* ============================================================
   3. EQUIPMENT TABS
   ============================================================ */
function initEquipmentTabs() {
  const tabs  = $$('.equip-tab');
  const items = $$('.equip-item');
  const specs = $$('.spec-card');
  if (!tabs.length) return;

  function activate(idx) {
    tabs.forEach((t, i) => {
      const active = i === idx;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active);
    });
    items.forEach((it, i) => it.classList.toggle('active', i === idx));
    specs.forEach((s, i) => s.classList.toggle('spec-active', i === idx));
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activate(i));
  });

  specs.forEach((s, i) => {
    s.addEventListener('click', () => activate(i));
  });
}

/* ============================================================
   4. CUSTOM AOS (Animate On Scroll)
   ============================================================ */
function initAOS() {
  const elements = $$('[data-aos]');
  if (!elements.length) return;

  // Check prefers-reduced-motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    elements.forEach(el => el.classList.add('aos-animate'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('aos-animate');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

/* ============================================================
   5. SMOOTH SCROLL (native fallback for older browsers)
   ============================================================ */
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ============================================================
   6. FORM VALIDATION & SUBMISSION
   ============================================================ */
function initForm() {
  const form    = $('#orderForm');
  const success = $('#formSuccess');
  const submit  = $('#submitBtn');
  if (!form) return;

  // Helpers
  function getError(field) {
    return field.closest('.form-group')?.querySelector('.form-error');
  }
  function setError(field, msg) {
    field.classList.add('error');
    const err = getError(field);
    if (err) err.textContent = msg;
  }
  function clearError(field) {
    field.classList.remove('error');
    const err = getError(field);
    if (err) err.textContent = '';
  }
  function validatePhone(val) {
    return /^[+\d\s\-().]{7,20}$/.test(val.trim());
  }

  // Real-time clearing
  $$('input, textarea', form).forEach(field => {
    field.addEventListener('input', () => clearError(field));
    field.addEventListener('blur', () => {
      if (field.value.trim()) clearError(field);
    });
  });

  function validate() {
    let valid = true;
    const t = (key, fallback) => (window.GreenCutI18n ? window.GreenCutI18n.t(key) : null) || fallback;

    const name = $('#name');
    if (!name.value.trim()) {
      setError(name, t('order.err_name', 'Пожалуйста, введите ваше имя'));
      valid = false;
    } else clearError(name);

    const phone = $('#phone');
    if (!phone.value.trim()) {
      setError(phone, t('order.err_phone_empty', 'Пожалуйста, введите номер телефона'));
      valid = false;
    } else if (!validatePhone(phone.value)) {
      setError(phone, t('order.err_phone_invalid', 'Введите корректный номер телефона'));
      valid = false;
    } else clearError(phone);

    const agree = $('#agree');
    if (!agree.checked) {
      const err = agree.closest('.form-group')?.querySelector('.form-error');
      if (err) err.textContent = t('order.err_agree', 'Необходимо дать согласие на обработку данных');
      valid = false;
    } else {
      const err = agree.closest('.form-group')?.querySelector('.form-error');
      if (err) err.textContent = '';
    }

    return valid;
  }

  // Clear errors or re-translate on language change
  window.addEventListener('languageChanged', () => {
    const errorFields = $$('.form-input.error', form);
    if (errorFields.length || $('#agree')?.closest('.form-group')?.querySelector('.form-error')?.textContent) {
      validate();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Loading state
    submit.classList.add('btn--loading');
    submit.disabled = true;

    // Simulate network request (replace with real endpoint)
    await new Promise(r => setTimeout(r, 1200));

    // Show success (in production: check response status)
    submit.classList.remove('btn--loading');
    form.hidden = true;
    success.hidden = false;
    success.focus();

    // Scroll to form area
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

/* ============================================================
   7. ACTIVE NAV LINK (highlight on scroll)
   ============================================================ */
function initActiveNav() {
  const sections = $$('section[id]');
  const navLinks = $$('.nav__link');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          const matches = link.getAttribute('href') === `#${id}`;
          link.style.color = matches
            ? 'var(--clr-white)'
            : '';
          link.style.background = matches
            ? 'rgba(45,106,79,.2)'
            : '';
        });
      }
    });
  }, {
    threshold: 0.4,
    rootMargin: `-${parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72}px 0px 0px 0px`
  });

  sections.forEach(s => observer.observe(s));
}

/* ============================================================
   8. NUMBER COUNTER ANIMATION for hero stats
   ============================================================ */
function initCounters() {
  const counters = $$('.stat__number');
  if (!counters.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const text = el.textContent.trim();
      // Extract numeric part
      const numMatch = text.match(/[\d.]+/);
      if (!numMatch) return;
      const target = parseFloat(numMatch[0]);
      const prefix = text.slice(0, numMatch.index);
      const suffix = text.slice(numMatch.index + numMatch[0].length);
      const isDecimal = text.includes('.');
      const duration = 1200;
      const start = performance.now();

      function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = target * eased;
        el.textContent = prefix + (isDecimal ? current.toFixed(1) : Math.round(current)) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

/* ============================================================
   9. PARALLAX EFFECT for hero
   ============================================================ */
function initParallax() {
  const pattern = $('.hero__pattern');
  if (!pattern) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    pattern.style.transform = `translateY(${y * 0.3}px)`;
  }, { passive: true });
}

/* ============================================================
   10. PHONE INPUT FORMATTING
   ============================================================ */
function initPhoneFormat() {
  const phone = $('#phone');
  if (!phone) return;
  phone.addEventListener('input', (e) => {
    let val = e.target.value.replace(/[^\d+\s\-()]/g, '');
    e.target.value = val;
  });
}

/* ============================================================
   INIT ALL
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileNav();
  initEquipmentTabs();
  initAOS();
  initSmoothScroll();
  initForm();
  initActiveNav();
  initCounters();
  initParallax();
  initPhoneFormat();
});
