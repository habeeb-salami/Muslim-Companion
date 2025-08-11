'use strict';

const DEFAULT_SETTINGS = {
  enablePrayerNotifications: false,
  prayerReminderMinutes: 5,
  locationMode: 'auto', // 'auto' | 'manual'
  manualLat: null,
  manualLon: null,
  enableHadithNotification: false,
  hadithNotificationTime: '08:00', // HH:MM 24h local
  enableQuranNotification: true,
  quranNotificationTime: '08:00',
  enableEventNotification: true,
  eventNotificationTime: '09:00',
  language: 'en',
};

const SETTINGS_KEY = 'settings';

function $(selector) { return document.querySelector(selector); }

function mergeDefaults(settings) {
  return Object.assign({}, DEFAULT_SETTINGS, settings || {});
}

function showStatus(text, timeoutMs = 1500) {
  const el = $('#status');
  el.textContent = text;
  if (timeoutMs) setTimeout(() => { el.textContent = ''; }, timeoutMs);
}

function updateManualLocationVisibility(mode) {
  const fields = document.getElementById('manualLocationFields');
  fields.style.display = mode === 'manual' ? 'flex' : 'none';
}

function loadSettings() {
  chrome.storage.local.get([SETTINGS_KEY], ({ settings }) => {
    const s = mergeDefaults(settings);
    $('#enablePrayerNotifications').checked = !!s.enablePrayerNotifications;
    $('#prayerReminderMinutes').value = s.prayerReminderMinutes;
    $('#locationMode').value = s.locationMode;
    updateManualLocationVisibility(s.locationMode);
    $('#manualLat').value = s.manualLat ?? '';
    $('#manualLon').value = s.manualLon ?? '';
    $('#enableHadithNotification').checked = !!s.enableHadithNotification;
    $('#hadithNotificationTime').value = s.hadithNotificationTime;
    $('#enableQuranNotification').checked = !!s.enableQuranNotification;
    $('#quranNotificationTime').value = s.quranNotificationTime;
    $('#enableEventNotification').checked = !!s.enableEventNotification;
    $('#eventNotificationTime').value = s.eventNotificationTime;
    $('#language').value = s.language || 'en';
  });
}

function parseNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function saveSettings(evt) {
  evt.preventDefault();
  const s = {
    enablePrayerNotifications: $('#enablePrayerNotifications').checked,
    prayerReminderMinutes: Math.max(0, Math.min(60, parseInt($('#prayerReminderMinutes').value || '0', 10))),
    locationMode: $('#locationMode').value,
    manualLat: parseNumber($('#manualLat').value),
    manualLon: parseNumber($('#manualLon').value),
    enableHadithNotification: $('#enableHadithNotification').checked,
    hadithNotificationTime: $('#hadithNotificationTime').value || DEFAULT_SETTINGS.hadithNotificationTime,
    enableQuranNotification: $('#enableQuranNotification').checked,
    quranNotificationTime: $('#quranNotificationTime').value || DEFAULT_SETTINGS.quranNotificationTime,
    enableEventNotification: $('#enableEventNotification').checked,
    eventNotificationTime: $('#eventNotificationTime').value || DEFAULT_SETTINGS.eventNotificationTime,
    language: $('#language').value || 'en',
  };

  if (s.locationMode === 'manual') {
    if (s.manualLat == null || s.manualLon == null || s.manualLat < -90 || s.manualLat > 90 || s.manualLon < -180 || s.manualLon > 180) {
      showStatus('Please provide valid latitude and longitude');
      return;
    }
  } else {
    s.manualLat = null;
    s.manualLon = null;
  }

  chrome.storage.local.set({ [SETTINGS_KEY]: s }, () => {
    showStatus('Saved');
  });
}

function resetDefaults() {
  chrome.storage.local.set({ [SETTINGS_KEY]: DEFAULT_SETTINGS }, () => {
    loadSettings();
    showStatus('Reset to defaults');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  $('#optionsForm').addEventListener('submit', saveSettings);
  $('#resetBtn').addEventListener('click', resetDefaults);
  $('#locationMode').addEventListener('change', (e) => updateManualLocationVisibility(e.target.value));
  if (window.I18N) { window.I18N.applyTranslations(document); }
});


