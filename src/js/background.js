'use strict';

const SETTINGS_KEY = 'settings';
const DAILY_VERSE_KEY = 'dailyVerse';
const DAILY_VERSE_DATE = 'dailyVerseDate';

// Ensure praytimes is available in worker
try { importScripts('praytimes.js'); } catch (e) {}

function getDaysSinceEpoch() { return Math.floor(Date.now() / 86400000); }

function selectHadithFileName(days) {
  const files = ['src/hadiths/qudsi40.json', 'src/hadiths/nawawi40.json', 'src/hadiths/shahwaliullah40.json'];
  return files[days % files.length];
}

async function getHadithOfDayText() {
  try {
    const days = getDaysSinceEpoch();
    const filePath = selectHadithFileName(days);
    const url = chrome.runtime.getURL(filePath);
    const res = await fetch(url);
    const json = await res.json();
    const idx = days % (json.hadiths?.length || 1);
    const h = json.hadiths[idx] || {};
    const text = (h.english && h.english.text) || '';
    const narrator = (h.english && h.english.narrator) || '';
    const title = (json.metadata && json.metadata.english && json.metadata.english.title) || 'Hadith';
    return { title, text, narrator };
  } catch (e) {
    return { title: 'Hadith', text: '', narrator: '' };
  }
}

function parseTimeToNextWhen(localTimeHHMM) {
  // Returns a timestamp (ms) for the next occurrence of HH:MM local time
  const [hh, mm] = (localTimeHHMM || '08:00').split(':').map(n => parseInt(n, 10));
  const now = new Date();
  const next = new Date();
  next.setHours(hh, mm, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime();
}

async function scheduleAlarmsFromSettings() {
  const { settings } = await chrome.storage.local.get([SETTINGS_KEY]);
  const s = settings || {};

  // Clear known alarms first
  await chrome.alarms.clear('dailyHadith');
  await chrome.alarms.clear('prayerCheck');
  await chrome.alarms.clear('Fajr');
  await chrome.alarms.clear('Dhuhr');
  await chrome.alarms.clear('Asr');
  await chrome.alarms.clear('Maghrib');
  await chrome.alarms.clear('Isha');
  await chrome.alarms.clear('dailyVerse');

  if (s.enableHadithNotification) {
    const when = parseTimeToNextWhen(s.hadithNotificationTime);
    chrome.alarms.create('dailyHadith', { when, periodInMinutes: 24 * 60 });
  }

  // Daily Quran verse alarm (configurable)
  await chrome.alarms.clear('dailyVerse');
  if (s.enableQuranNotification) {
    const verseTime = s.quranNotificationTime || s.hadithNotificationTime || '08:00';
    chrome.alarms.create('dailyVerse', { when: parseTimeToNextWhen(verseTime), periodInMinutes: 24 * 60 });
  }

  // Islamic event daily check alarm
  await chrome.alarms.clear('dailyEvents');
  if (s.enableEventNotification) {
    const eventTime = s.eventNotificationTime || '09:00';
    chrome.alarms.create('dailyEvents', { when: parseTimeToNextWhen(eventTime), periodInMinutes: 24 * 60 });
  }

  if (s.enablePrayerNotifications) {
    const coords = await getUserCoordinates(s);
    if (coords) {
      const times = self.PrayerTimes?.getPrayerTimes(new Date(), coords, { method: self.PrayerTimes?.PrayerCalcMethod?.MWL });
      const reminderMin = Number.isFinite(s.prayerReminderMinutes) ? Math.max(0, Math.min(60, s.prayerReminderMinutes)) : 0;
      schedulePrayerAlarms(times, reminderMin);
      // Also set a re-schedule at midnight to compute next day's times
      const tomorrow = new Date();
      tomorrow.setHours(24, 0, 5, 0);
      chrome.alarms.create('prayerCheck', { when: tomorrow.getTime() });
    }
  }
}

function schedulePrayerAlarms(times, reminderMinutes) {
  if (!times) return;
  const entries = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  for (const name of entries) {
    const t = times[name];
    if (!(t instanceof Date) || isNaN(t.getTime())) continue;
    const when = new Date(t.getTime() - reminderMinutes * 60 * 1000);
    if (when.getTime() > Date.now()) {
      chrome.alarms.create(name, { when: when.getTime() });
    }
  }
}

async function getUserCoordinates(settings) {
  if (settings.locationMode === 'manual' && settings.manualLat != null && settings.manualLon != null) {
    return { latitude: settings.manualLat, longitude: settings.manualLon };
  }
  // Try geolocation permission; wrap in promise
  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 });
    });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch (e) {
    return null;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  scheduleAlarmsFromSettings();
});

chrome.runtime.onStartup?.addListener(() => {
  scheduleAlarmsFromSettings();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[SETTINGS_KEY]) {
    scheduleAlarmsFromSettings();
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm || !alarm.name) return;
  if (alarm.name === 'dailyHadith') {
    const { title, text, narrator } = await getHadithOfDayText();
    const message = narrator ? `${text}\n— ${narrator}` : text;
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '../images/ramadan.png',
      title: `${title} (Daily)`,
      message: message || 'Hadith of the day',
      priority: 0
    });
    return;
  }
  if (alarm.name === 'dailyVerse') {
    const v = await getDailyVerse();
    const title = 'Daily Quran Verse';
    const message = v?.translation ? `${v.verseKey}: ${v.translation}` : (v?.text || '');
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '../images/ramadan.png',
      title,
      message: message || 'Verse unavailable',
      priority: 0
    });
    return;
  }
  if (alarm.name === 'dailyEvents') {
    await maybeNotifyIslamicEvent();
    return;
  }
  if (alarm.name === 'prayerCheck') {
    // Recompute for next day
    scheduleAlarmsFromSettings();
    return;
  }
  // Prayer-specific alarms
  if (['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(alarm.name)) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '../images/ramadan.png',
      title: `${alarm.name} Reminder`,
      message: `It's almost time for ${alarm.name}.`,
      priority: 0
    });
  }
});

// Daily Quran Verse implementation
async function getDailyVerse() {
  const today = new Date().toISOString().slice(0,10);
  const stored = await chrome.storage.local.get([DAILY_VERSE_KEY, DAILY_VERSE_DATE]);
  if (stored[DAILY_VERSE_KEY] && stored[DAILY_VERSE_DATE] === today) {
    return stored[DAILY_VERSE_KEY];
  }

  // Pick a deterministic verse id (1..6236) by day
  const totalVerses = 6236;
  const days = getDaysSinceEpoch();
  const verseId = (days % totalVerses) + 1;

  try {
    const metaUrl = `https://api.quran.com/api/v4/verses/by_key/${verseId}?language=en&fields=text_uthmani`;
    const transUrl = `https://api.quran.com/api/v4/quran/translations/131?verse_key=${verseId}`; // 131=Saheeh International
    const [metaRes, transRes] = await Promise.all([fetch(metaUrl), fetch(transUrl)]);
    const metaJson = await metaRes.json();
    const transJson = await transRes.json();
    const verseKey = metaJson?.verse?.verse_key || `v${verseId}`;
    const text = metaJson?.verse?.text_uthmani || '';
    const translation = transJson?.translations?.[0]?.text || '';
    const tafsirLink = `https://quran.com/${verseKey.replace(':','/')}`;
    const result = { verseId, verseKey, text, translation, tafsirLink };
    await chrome.storage.local.set({ [DAILY_VERSE_KEY]: result, [DAILY_VERSE_DATE]: today });
    return result;
  } catch (_) {
    return stored[DAILY_VERSE_KEY] || null;
  }
}

// Islamic event notifier using the same event list as calendar (duplicated minimal list)
function getHijriToday() {
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic', { day: 'numeric', month: 'numeric' }).formatToParts(new Date());
    const month = parseInt(parts.find(p=>p.type==='month').value,10);
    const day = parseInt(parts.find(p=>p.type==='day').value,10);
    return { month, day };
  } catch (_) {
    return null;
  }
}

async function maybeNotifyIslamicEvent() {
  const today = getHijriToday();
  if (!today) return;
  const events = [
    { month: 1, day: 10, label: 'Ashura' },
    { month: 3, day: 12, label: 'Mawlid' },
    { month: 7, day: 27, label: 'Isra and Mi\u0027raj' },
    { month: 8, day: 15, label: 'Mid-Sha\u0027ban' },
    { month: 9, day: 1, label: 'Ramadan Begins' },
    { month: 9, day: 27, label: 'Laylat al-Qadr (27th)' },
    { month: 10, day: 1, label: 'Eid al-Fitr' },
    { month: 12, day: 9, label: 'Day of Arafah' },
    { month: 12, day: 10, label: 'Eid al-Adha' }
  ];
  const hit = events.find(ev => ev.month === today.month && ev.day === today.day);
  if (!hit) return;
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '../images/ramadan.png',
    title: 'Islamic Event Today',
    message: hit.label,
    priority: 0
  });
}

chrome.notifications.onButtonClicked.addListener(async () => {
  const item = await chrome.storage.sync.get(['minutes']);
  chrome.action.setBadgeText({ text: 'ON' });
  chrome.alarms.create({ delayInMinutes: item.minutes });
});