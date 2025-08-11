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

    // Daily Quran section: try cached verse first; if missing (e.g., first run before alarm), fetch once
    (async function loadDailyQuran() {
        const today = todayKey();
        const stored = await chrome.storage.local.get([DAILY_VERSE_KEY, DAILY_VERSE_DATE]);
        let verse = null;
        if (stored[DAILY_VERSE_KEY] && stored[DAILY_VERSE_DATE] === today) {
            verse = stored[DAILY_VERSE_KEY];
        } else {
            try {
                const totalVerses = 6236;
                const days = getDaysSinceEpoch();
                const verseId = (days % totalVerses) + 1;
                const metaUrl = `https://api.quran.com/api/v4/verses/by_key/${verseId}?language=en&fields=text_uthmani`;
                const transUrl = `https://api.quran.com/api/v4/quran/translations/131?verse_key=${verseId}`;
                const [metaRes, transRes] = await Promise.all([fetch(metaUrl), fetch(transUrl)]);
                const metaJson = await metaRes.json();
                const transJson = await transRes.json();
                const verseKey = metaJson?.verse?.verse_key || `v${verseId}`;
                const text = metaJson?.verse?.text_uthmani || '';
                const translation = transJson?.translations?.[0]?.text || '';
                const tafsirLink = `https://quran.com/${verseKey.replace(':','/')}`;
                verse = { verseId, verseKey, text, translation, tafsirLink };
                await chrome.storage.local.set({ [DAILY_VERSE_KEY]: verse, [DAILY_VERSE_DATE]: today });
            } catch (_) {
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