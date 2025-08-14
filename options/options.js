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
const SETTINGS_KEY = 'muslimCompanionSettings';
const DAILY_HADITH_KEY = 'muslimCompaniondailyHadith';
const DAILY_HADITH_DATE = 'muslimCompaniondailyHadithDate';
const DAILY_QURAN_KEY = 'muslimCompaniondailyQuran';
const DAILY_QURAN_DATE = 'muslimCompaniondailyQuranDate';
const DAILY_EVENT_KEY = 'muslimCompaniondailyEvent';
const DAILY_EVENT_DATE = 'muslimCompaniondailyEventDate';


// document.getElementById('locationMode').addEventListener('change', function () {
//   document.getElementById('manualLocationFields').style.display =
//     this.value === 'manual' ? 'grid' : 'none';
// });
// Dark Mode Toggle
const darkToggle = document.getElementById('darkModeToggle');
darkToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
});

if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
}
function $(selector) { return document.querySelector(selector); }

const mergeDefaults= (settings)=> {
  return Object.assign({}, DEFAULT_SETTINGS, settings || {});
}

const showStatus = (text, timeoutMs = 1500) =>{
  const el = $('#status');
  el.textContent = text;
  if (timeoutMs) setTimeout(() => { el.textContent = ''; }, timeoutMs);
}

const updateManualLocationVisibility = (mode)=> {
  const fields = document.getElementById('manualLocationFields');
  fields.style.display = mode === 'manual' ? 'flex' : 'none';
}

const loadSettings = () =>{
  chrome.storage.local.get([SETTINGS_KEY], (result) => {
    console.log('Loading settings:', result);
    const s = mergeDefaults(result[SETTINGS_KEY]);
    console.log('Merged settings:', s);
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

    // Ensure alarms are scheduled with current settings
    chrome.runtime.sendMessage({ action: 'rescheduleAlarms' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Error rescheduling alarms on load:', chrome.runtime.lastError.message);
      } else {
        console.log('Alarms rescheduled on load successfully');
      }
    });
  });
}

const parseNumber= (value)=> {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const saveSettings = (evt) => {
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
    console.log('Settings saved:', s);
    showStatus('Saved');

    // Trigger immediate alarm rescheduling
    chrome.runtime.sendMessage({ action: 'rescheduleAlarms' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Error rescheduling alarms:', chrome.runtime.lastError.message);
      } else {
        console.log('Alarms rescheduled successfully');
      }
    });
  });
}

const resetDefaults = () => {
  chrome.storage.local.set({ [SETTINGS_KEY]: DEFAULT_SETTINGS }, () => {
    loadSettings();
    showStatus('Reset to defaults');
  });
}

function testNotifications() {
  chrome.runtime.sendMessage({ action: 'testNotifications' }, (response) => {
    if (chrome.runtime.lastError) {
      showStatus('Error: ' + chrome.runtime.lastError.message);
    } else {
      showStatus('Test notifications sent');
    }
  });
}

function checkAlarms() {
  chrome.alarms.getAll((alarms) => {
    console.log('Current alarms:', alarms);
    if (alarms.length === 0) {
      showStatus('No alarms scheduled');
    } else {
      const alarmInfo = alarms.map(a => `${a.name}: ${new Date(a.scheduledTime).toLocaleString()}`).join(', ');
      showStatus(`Alarms: ${alarmInfo}`);
    }
  });
}

function checkNotificationPermission() {
  if (Notification.permission === 'granted') {
    showStatus('Notifications enabled');
  } else if (Notification.permission === 'denied') {
    showStatus('Notifications blocked - please enable in browser settings');
  } else {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        showStatus('Notifications enabled');
      } else {
        showStatus('Notifications denied');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  $('#optionsForm').addEventListener('submit', saveSettings);
  $('#resetBtn').addEventListener('click', resetDefaults);
  $('#testBtn').addEventListener('click', testNotifications);
  $('#checkAlarmsBtn').addEventListener('click', checkAlarms);
  $('#checkPermissionBtn').addEventListener('click', checkNotificationPermission);
  $('#locationMode').addEventListener('change', (e) => updateManualLocationVisibility(e.target.value));
  if (window.I18N) { window.I18N.applyTranslations(document); }
});


