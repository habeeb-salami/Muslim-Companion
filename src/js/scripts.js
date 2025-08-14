'use strict';

let setAlarm = (event) => {
    const minutes = parseFloat(event.target.value);
    console.log(minutes);
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.alarms.create({ delayInMinutes: minutes });
    chrome.storage.sync.set({ minutes: minutes });
    window.close();
}

let clearAlarm = () => {
    chrome.action.setBadgeText({ text: '' });
    chrome.alarms.clearAll();
    window.close();
}
let getData = async (link) => {
    return $.ajax({
        headers: { "Accept": "application/json" },
        type: 'GET',
        url: link,
        crossDomain: true,
        beforeSend: function (xhr) {
            xhr.withCredentials = true;
        }
    });
}

let getRndInteger = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

$(function () {
     chrome.notifications.create('notificationId', {
         type: 'basic',
        iconUrl: './images/ramadan.png', 
         title: 'Salat Notification',
         message: "Salam Alaikum, Time for Salat!!!"
    });
    const HOD_STORAGE_KEY = 'hadithOfDay';
    const HOD_DATE_KEY = 'hadithOfDayDate';
    const DAILY_VERSE_KEY = 'dailyVerse';
    const DAILY_VERSE_DATE = 'dailyVerseDate';
    const getDaysSinceEpoch = () => Math.floor(Date.now() / 86400000);
    const todayKey = () => new Date().toISOString().slice(0, 10);
    const renderHadith = (h) => {
        if (!h) return;
        const narratorOrSource = h.narrator && h.narrator.trim().length > 0 ? h.narrator : (h.sourceTitle || '');
        $("#hadith").text(h.text || '');
        $("#from").text(narratorOrSource);
    };
    const hadithLinks = ['qudsi40.json','nawawi40.json','shahwaliullah40.json'];
    const dateKey = todayKey();
    chrome.storage.local.get([HOD_STORAGE_KEY, HOD_DATE_KEY], (stored) => {
        const cachedHadith = stored[HOD_STORAGE_KEY];
        const cachedDate = stored[HOD_DATE_KEY];
        if (cachedHadith && cachedDate === dateKey) {
            renderHadith(cachedHadith);
            return;
        }
        const days = getDaysSinceEpoch();
        const collectionIndex = days % hadithLinks.length;
        const hadithFile = "./hadiths/" + hadithLinks[collectionIndex];
        getData(hadithFile).then((res) => {
            if (!res || !res.hadiths || res.hadiths.length === 0) return;
            const hadithIndex = days % res.hadiths.length;
            const selected = res.hadiths[hadithIndex];
            const hadithObj = {
                text: (selected.english && selected.english.text) || '',
                narrator: (selected.english && selected.english.narrator) || '',
                sourceTitle: (res.metadata && res.metadata.english && res.metadata.english.title) || ''
            };
            chrome.storage.local.set({ [HOD_STORAGE_KEY]: hadithObj, [HOD_DATE_KEY]: dateKey });
            renderHadith(hadithObj);
        }); 
    });

    // Daily Quran section: try cached verse first; if missing (e.g., first run before alarm), load from local quran.json and translations
    (async function loadDailyQuran() {
        const today = todayKey();
        const stored = await chrome.storage.local.get([DAILY_VERSE_KEY, DAILY_VERSE_DATE]);
        let verse = null;
        if (stored[DAILY_VERSE_KEY] && stored[DAILY_VERSE_DATE] === today) {
            verse = stored[DAILY_VERSE_KEY];
        } else {
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
                
                const totalVerses = 6236;
                const days = getDaysSinceEpoch();
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
                    verse = {
                        verseId,
                        verseKey,
                        text: foundVerse.text,
                        translation: foundTranslation?.text || '',
                        tafsirLink: `https://quran.com/${verseKey.replace(':','/')}`
                    };
                    await chrome.storage.local.set({ [DAILY_VERSE_KEY]: verse, [DAILY_VERSE_DATE]: today });
                }
            } catch (error) {
                console.error('Error loading local Quran data:', error);
                // ignore and leave verse null
            }
        }
        if (verse) {
            $("#quran-ref").text(verse.verseKey);
            $("#quran-translation").html(verse.translation || verse.text || '');
            if (verse.tafsirLink) {
                $("#quran-tafsir").attr('href', verse.tafsirLink);
            }
        }
    })();

    $("#sampleMinute").click(setAlarm);
    $("#min15").click(setAlarm);
    $("#min30").click(setAlarm);
    $("#cancelAlarm").click(clearAlarm);

    $(document).on('click', 'a[href*="options/index.html"]', function (e) {
        e.preventDefault();
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.location.href = this.href;
        }
    });
});