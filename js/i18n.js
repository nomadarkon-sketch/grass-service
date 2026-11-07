/**
 * GreenCut — Internationalization (i18n) Engine
 * Manages language switching, persistent preferences, and DOM updates
 */

(function () {
  'use strict';

  const SUPPORTED_LANGS = ['ru', 'ka', 'en'];
  const DEFAULT_LANG = 'ru';
  const STORAGE_KEY = 'greencut_lang';

  const LANG_DATA = {
    ru: { code: 'RU', name: 'Русский', flag: '🇷🇺' },
    ka: { code: 'KA', name: 'ქართული', flag: '🇬🇪' },
    en: { code: 'EN', name: 'English', flag: '🇬🇧' }
  };

  let currentLang = DEFAULT_LANG;

  // Safely get dictionary from window or global scope
  function getTranslationsDict() {
    if (typeof window !== 'undefined' && window.TRANSLATIONS) {
      return window.TRANSLATIONS;
    }
    if (typeof TRANSLATIONS !== 'undefined') {
      return TRANSLATIONS;
    }
    return null;
  }

  // Resolve nested dictionary key like "hero.title"
  function getTranslation(key, lang = currentLang) {
    const dict = getTranslationsDict();
    if (!dict || !dict[lang]) return null;

    const parts = key.split('.');
    let cur = dict[lang];
    for (const p of parts) {
      if (cur == null || typeof cur !== 'object') return null;
      cur = cur[p];
    }
    return cur;
  }

  // Detect initial language
  function detectInitialLanguage() {
    // 1. URL search param: ?lang=ka
    try {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get('lang');
      if (urlLang && SUPPORTED_LANGS.includes(urlLang.toLowerCase())) {
        return urlLang.toLowerCase();
      }
    } catch (e) {}

    // 2. Local storage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED_LANGS.includes(stored)) {
        return stored;
      }
    } catch (e) {}

    // 3. Browser language
    try {
      const navLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
      if (navLang.startsWith('ka')) return 'ka';
      if (navLang.startsWith('en')) return 'en';
      if (navLang.startsWith('ru') || navLang.startsWith('be') || navLang.startsWith('uk')) return 'ru';
    } catch (e) {}

    return DEFAULT_LANG;
  }

  // Update all DOM elements for selected language
  function applyLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) lang = DEFAULT_LANG;
    currentLang = lang;

    const dict = getTranslationsDict();
    const langData = dict ? dict[lang] : null;

    // 1. HTML lang attribute
    document.documentElement.lang = lang;

    // 2. Meta tags & Title
    if (langData?.meta) {
      if (langData.meta.title) document.title = langData.meta.title;
      const descEl = document.querySelector('meta[name="description"]');
      if (descEl && langData.meta.description) descEl.setAttribute('content', langData.meta.description);
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle && langData.meta.ogTitle) ogTitle.setAttribute('content', langData.meta.ogTitle);
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc && langData.meta.ogDescription) ogDesc.setAttribute('content', langData.meta.ogDescription);
    }

    // 3. Text content / HTML
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const val = getTranslation(key, lang);
      if (val != null) {
        el.innerHTML = val;
      }
    });

    // 4. Input placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = getTranslation(key, lang);
      if (val != null) {
        el.placeholder = val;
      }
    });

    // 5. Aria labels
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria');
      const val = getTranslation(key, lang);
      if (val != null) {
        el.setAttribute('aria-label', val);
      }
    });

    // 6. Title attributes
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      const val = getTranslation(key, lang);
      if (val != null) {
        el.setAttribute('title', val);
      }
    });

    // 7. Dynamic WhatsApp pre-filled messages
    const waText = langData?.contacts?.wa_prefill || '';
    if (waText) {
      const encodedMsg = encodeURIComponent(waText);
      document.querySelectorAll('a[data-i18n-wa]').forEach((a) => {
        const baseHref = a.getAttribute('data-wa-base') || a.href.split('?')[0];
        a.setAttribute('data-wa-base', baseHref);
        a.href = `${baseHref}?text=${encodedMsg}`;
      });
    }

    // 8. Update language switchers UI state
    updateSwitcherUI(lang);

    // 9. Dispatch custom event
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    console.log('[GreenCut i18n] Language applied:', lang);
  }

  // Update switcher controls (Header, Mobile Nav, Footer)
  function updateSwitcherUI(lang) {
    const data = LANG_DATA[lang] || LANG_DATA[DEFAULT_LANG];

    // Header switcher button
    const currentFlag = document.getElementById('langCurrentFlag');
    const currentCode = document.getElementById('langCurrentCode');
    if (currentFlag) currentFlag.textContent = data.flag;
    if (currentCode) currentCode.textContent = data.code;

    // Header dropdown options
    document.querySelectorAll('.lang-selector__option').forEach((opt) => {
      const isSelected = opt.getAttribute('data-lang') === lang;
      opt.classList.toggle('active', isSelected);
      opt.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });

    // Mobile pills
    document.querySelectorAll('.lang-pill').forEach((pill) => {
      pill.classList.toggle('active', pill.getAttribute('data-lang') === lang);
    });

    // Footer buttons
    document.querySelectorAll('.footer__lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
  }

  // Set language with persistence
  function setLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) return;
    applyLanguage(lang);

    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      // Ignore storage errors
    }

    // Update URL query param cleanly without reload (http/https only)
    try {
      if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
        const url = new URL(window.location.href);
        url.searchParams.set('lang', lang);
        window.history.replaceState({}, '', url.toString());
      }
    } catch (e) {
      // Ignore history errors
    }
  }

  // Initialize interactive UI for language switchers
  function initLanguageUI() {
    const selector = document.getElementById('langSelector');
    const btn = document.getElementById('langBtn');
    const dropdown = document.getElementById('langDropdown');

    if (btn && dropdown) {
      const openDropdown = () => {
        selector.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      };
      const closeDropdown = () => {
        selector.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      };

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        selector.classList.contains('open') ? closeDropdown() : openDropdown();
      });

      document.addEventListener('click', (e) => {
        if (!selector.contains(e.target)) closeDropdown();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && selector.classList.contains('open')) {
          closeDropdown();
          btn.focus();
        }
      });
    }

    // Delegate language click events across all switchers (header, mobile, footer)
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-lang]');
      if (!target) return;
      const lang = target.getAttribute('data-lang');
      if (lang && SUPPORTED_LANGS.includes(lang)) {
        setLanguage(lang);
        const selector = document.getElementById('langSelector');
        if (selector) {
          selector.classList.remove('open');
          const btn = document.getElementById('langBtn');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        }
      }
    });
  }

  // Public API
  window.GreenCutI18n = {
    getLanguage: () => currentLang,
    setLanguage: setLanguage,
    t: (key) => getTranslation(key, currentLang),
    supportedLangs: SUPPORTED_LANGS
  };

  // Run initial translation
  const initialLang = detectInitialLanguage();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      applyLanguage(initialLang);
      initLanguageUI();
    });
  } else {
    applyLanguage(initialLang);
    initLanguageUI();
  }
})();
