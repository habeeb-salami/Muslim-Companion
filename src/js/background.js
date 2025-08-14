'use strict';

const SETTINGS_KEY = 'muslimCompanionSettings';
const DAILY_VERSE_KEY = 'muslimCompaniondailyVerse';
const DAILY_VERSE_DATE = 'muslimCompaniondailyVerseDate';

// Ensure praytimes is available in worker
try { importScripts('praytimes.js'); } catch (e) {}

function getDaysSinceEpoch() { return Math.floor(Date.now() / 86400000); }

function selectHadithFileName(days) {
  const files = ['src/hadiths/qudsi40.json', 'src/hadiths/nawawi40.json', 'src/hadiths/shahwaliullah40.json'];
  return files[days % files.length];
}

const getHadithOfDayText = async () => {
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

const scheduleAlarmsFromSettings= async () => {
  const result = await chrome.storage.local.get([SETTINGS_KEY]);
  console.log('Getting settings for alarms:', result);
  const s = result[SETTINGS_KEY] || {};
  console.log('Settings for alarms:', s);

  // Clear known alarms first
  await chrome.alarms.clear('dailyHadith');
  await chrome.alarms.clear('dailyEvents');
  await chrome.alarms.clear('prayerCheck');
  await chrome.alarms.clear('Fajr');
  await chrome.alarms.clear('Dhuhr');
  await chrome.alarms.clear('Asr');
  await chrome.alarms.clear('Maghrib');
  await chrome.alarms.clear('Isha');
  await chrome.alarms.clear('dailyVerse');

  if (s.enableHadithNotification) {
    const when = parseTimeToNextWhen(s.hadithNotificationTime);
    console.log('Creating hadith alarm for:', new Date(when));
    chrome.alarms.create('dailyHadith', { when, periodInMinutes: 24 * 60 });
  }

  // Daily Quran verse alarm (configurable)
  await chrome.alarms.clear('dailyVerse');
  if (s.enableQuranNotification) {
    const verseTime = s.quranNotificationTime || s.hadithNotificationTime || '08:00';
    const when = parseTimeToNextWhen(verseTime);
    console.log('Creating Quran alarm for:', new Date(when));
    chrome.alarms.create('dailyVerse', { when, periodInMinutes: 24 * 60 });
  }

  // Islamic event daily check alarm
  await chrome.alarms.clear('dailyEvents');
  if (s.enableEventNotification) {
    const eventTime = s.eventNotificationTime || '09:00';
    const when = parseTimeToNextWhen(eventTime);
    console.log('Creating event alarm for:', new Date(when));
    chrome.alarms.create('dailyEvents', { when, periodInMinutes: 24 * 60 });
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

const schedulePrayerAlarms= (times, reminderMinutes) =>{
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
  console.log('Storage changed:', changes, area);
  if (area === 'local' && changes[SETTINGS_KEY]) {
    console.log('Settings changed, rescheduling alarms');
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
    const message = v?.translation ? `${v.verseKey}: ${v.translation}` : (v?.text ? `${v.verseKey}: ${v.text}` : 'Verse unavailable');
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

// Daily Quran Verse implementation using local quran.json and translations
async function getDailyVerse() {
  const today = new Date().toISOString().slice(0,10);
  const stored = await chrome.storage.local.get([DAILY_VERSE_KEY, DAILY_VERSE_DATE]);
  if (stored[DAILY_VERSE_KEY] && stored[DAILY_VERSE_DATE] === today) {
    return stored[DAILY_VERSE_KEY];
  }

  try {
    // Get user's language preference
    const settings = await chrome.storage.local.get(['muslimCompanionSettings']);
    const userLanguage = settings.muslimCompanionSettings?.language || 'en';
    
    // Load local quran.json file (Arabic text)
    const quranUrl = chrome.runtime.getURL('src/quran/quran.json');
    const response = await fetch(quranUrl);
    const quranData = await response.json();
    
    // Load translation file based on user language
    let translationData = null;
    try {
      const translationUrl = chrome.runtime.getURL(`src/quran/editions/${userLanguage}.json`);
      const translationResponse = await fetch(translationUrl);
      translationData = await translationResponse.json();
    } catch (translationError) {
      console.log(`Translation for ${userLanguage} not available, using English as fallback`);
      // Fallback to English if user's language is not available
      try {
        const fallbackUrl = chrome.runtime.getURL('src/quran/editions/en.json');
        const fallbackResponse = await fetch(fallbackUrl);
        translationData = await fallbackResponse.json();
      } catch (fallbackError) {
        console.error('Could not load any translation:', fallbackError);
      }
    }
    
    // Calculate verse based on day
    const days = getDaysSinceEpoch();
    const totalVerses = 6236; // Total verses in Quran
    const verseId = (days % totalVerses) + 1;
    
    // Find the verse in local data
    let foundVerse = null;
    let foundTranslation = null;
    let currentVerseCount = 0;
    
    // Iterate through chapters to find the specific verse
    for (const chapterNum in quranData) {
      const chapter = quranData[chapterNum];
      if (currentVerseCount + chapter.length >= verseId) {
        const verseIndex = verseId - currentVerseCount - 1;
        if (verseIndex >= 0 && verseIndex < chapter.length) {
          foundVerse = chapter[verseIndex];
          // Find corresponding translation
          if (translationData && translationData[chapterNum]) {
            foundTranslation = translationData[chapterNum][verseIndex];
          }
          break;
        }
      }
      currentVerseCount += chapter.length;
    }
    
    if (foundVerse) {
      const verseKey = `${foundVerse.chapter}:${foundVerse.verse}`;
      const result = {
        verseId,
        verseKey,
        text: foundVerse.text,
        translation: foundTranslation?.text || '',
        tafsirLink: `https://quran.com/${verseKey.replace(':','/')}`
      };
      
      await chrome.storage.local.set({ [DAILY_VERSE_KEY]: result, [DAILY_VERSE_DATE]: today });
      return result;
    }
    
    return stored[DAILY_VERSE_KEY] || null;
  } catch (error) {
    console.error('Error loading local Quran data:', error);
    return stored[DAILY_VERSE_KEY] || null;
  }
}

// Islamic event notifier using the same event list as calendar (duplicated minimal list)
const getHijriToday=() =>{
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic', { day: 'numeric', month: 'numeric' }).formatToParts(new Date());
    const month = parseInt(parts.find(p=>p.type==='month').value,10);
    const day = parseInt(parts.find(p=>p.type==='day').value,10);
    return { month, day };
  } catch (_) {
    return null;
  }
}

const  maybeNotifyIslamicEvent= async () =>{
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

// Handle messages from options page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'testNotifications') {
    // Send test notifications immediately
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '../images/ramadan.png',
      title: 'Test Hadith Notification',
      message: 'This is a test hadith notification',
      priority: 0
    });
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '../images/ramadan.png',
      title: 'Test Quran Notification',
      message: 'This is a test Quran notification',
      priority: 0
    });
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '../images/ramadan.png',
      title: 'Test Event Notification',
      message: 'This is a test Islamic event notification',
      priority: 0
    });
    
    sendResponse({ success: true });
  } else if (message.action === 'rescheduleAlarms') {
    console.log('Manual alarm rescheduling requested');
    scheduleAlarmsFromSettings().then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      console.error('Error rescheduling alarms:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  }
});