'use strict';

const I18N_STORAGE_KEY = 'settings'; // language stored inside settings.language

async function getLanguageCode() {
  return new Promise((resolve) => {
    chrome.storage.local.get([I18N_STORAGE_KEY], ({ settings }) => {
      resolve((settings && settings.language) || navigator.language?.split('-')[0] || 'en');
    });
  });
}

async function loadTranslations(lang) {
  try {
    const url = chrome.runtime.getURL(`src/i18n/${lang}.json`);
    const res = await fetch(url);
    if (!res.ok) throw new Error('not ok');
    return await res.json();
  } catch (_) {
    const fallback = chrome.runtime.getURL('src/i18n/en.json');
    const res = await fetch(fallback);
    return await res.json();
  }
}

function t(dict, key, ...args) {
  let str = dict[key] || key;
  args.forEach(a => { str = str.replace('%s', a); });
  return str;
}

async function applyTranslations(root = document) {
  const lang = await getLanguageCode();
  const dict = await loadTranslations(lang);
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.setAttribute('placeholder', t(dict, key));
    } else {
      el.textContent = t(dict, key);
    }
  });
}

// expose minimal API
self.I18N = { getLanguageCode, loadTranslations, applyTranslations, t };


