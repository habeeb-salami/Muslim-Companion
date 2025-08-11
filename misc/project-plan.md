Muslim Companion — Technical Blueprint (Concise & Actionable)

How each feature will be implemented (short action plan)
Prayer times
	•	Primary: Use local calculation with praytimes.js (or salahtimes-js) + dayjs/timezone for accuracy.
	•	Fallback/Sync: Optionally query AlAdhan API when online for validation.
	•	Notifications: Use chrome.alarms + chrome.notifications from the service worker. Pre-salah reminders are scheduled with additional alarms.
Daily Hadith
	•	Use Sunnah.com API or a vetted Hadith JSON bundle embedded in the extension (for offline). Tag source (Bukhari/Muslim/etc.). Cache one/day.
Daily Quran verse & Tafsir link
	•	Cache a daily verse locally. Use Quran API (quran.api or quran.com) to fetch verse metadata once/day and cache in chrome.storage.local for offline. Provide translation and link to tafsir (e.g., tafsir page on quran.com).
Dua of the Day
	•	Small embedded JSON of categorized Duas (Arabic + translit + meaning). Shallow local DB for offline.
Hijri & Gregorian calendar
	•	Use hijri-js or moment-hijri to compute Hijri date locally. Add local table of common events (Ramadan, Eid) and compute date offsets for years.
To-Do list with Islamic reminders
	•	Local storage in chrome.storage.local (or IndexedDB if complex). Tasks can attach to prayers or custom times.
Distraction block during Salah times
	•	Content script that, when enabled by user and during prayer windows, hides/blocks configured domains. Implementation:
	◦	Background schedules alarms.
	◦	On alarm, send message to content scripts to apply CSS overlays / redirect to safe page.
	◦	Keep block logic client-side and opt-in.
Multi-language
	•	Use simple i18n JSON files in src/i18n/. UI text loaded at runtime; translations stored locally.
Offline-first
	•	All essential data (duas, hadith bundle skeleton, prayer algorithms, UI strings) included in package. Network used only for optional sync or richer audio downloads.
Libraries & APIs (recommended)
Calculation / Time
	•	praytimes.js (client-side prayer calc) — lightweight.
	•	dayjs + dayjs/plugin/timezone — small, fast date handling.
Qibla
	•	Implement formula locally (bearing math), or use AlAdhan qibla endpoint if online.
Quran
	•	quran.com API (API v4) or al-quran-cloud for verse metadata & audio links. Cache results.
Hadith
	•	sunnah.com JSON endpoints (or embed curated Hadith JSON for offline).
Hijri
	•	hijri-date-lib or moment-hijri. Prefer small libs (hijri-js) to reduce bundle.
Storage
	•	chrome.storage.local API — primary.
	•	IndexedDB for larger cached media (audio recitations).
Data flow (textual diagram)
	1	User action / device → popup/options UI reads/writes to chrome.storage.local.
	2	Service Worker (background):
	◦	On install/start: load bundled data (duas, hadith index).
	◦	On location change or hourly check: compute prayer times locally; optionally fetch AlAdhan to verify.
	◦	Schedules alarms (chrome.alarms) for notifications.
	3	Alarms fire → service worker triggers chrome.notifications and posts messages to active content scripts (for block mode).
	4	Network sync (optional) → when online and user allowed, fetch remote APIs (Quran, Hadith updates) and update local cache. No telemetry is sent; all network calls are discrete and conditional.
	5	UI reads from chrome.storage.local for immediate rendering; falls back to bundled JSON if storage empty.
Background / Content / Popup script responsibilities
Background (serviceWorker.js)
	•	Compute & schedule prayer alarms.
	•	Handle chrome.alarms and push notifications.
	•	Manage cached resources (fetch updates daily if allowed).
	•	Central authority for on/off switch for distraction-block mode.
Popup (popup/index.tsx)
	•	Present concise dashboard: next prayer, countdown, Qibla arrow, daily ayah/hadith, quick settings.
	•	Quick actions: “Snooze notifications”, “Mark prayer as done (streak)”.
Options page
	•	Full settings: location override, madhab calc preference, adhan selection, languages, block list for distraction mode, export/import settings.
Content script (optional/minimal)
	•	Apply distraction-block overlays or site-block CSS when requested by background.
	•	Prefer minimal privilege: only inject into pages when block mode active (use scripting.executeScript).
