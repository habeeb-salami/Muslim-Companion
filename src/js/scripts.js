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
    // chrome.notifications.create('notificationId', {
    //     type: 'basic',
    //     iconUrl: './images/ramadan.png', 
    //     title: 'Salat Notification',
    //     message: "Salam Alaikum, Time for Salat!!!"
    // });
    const hadithLinks = [
        'qudsi40.json',
        'nawawi40.json',
        'shahwaliullah40.json'
    ];
    console.log(hadithLinks);
    const quranLink = ["https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/quran.json"];
    const hadithLink = "http://haya.zya.me/hadith/forties/nawawi40.json";

    const hadith = "./hadiths/" + hadithLinks[getRndInteger(0, hadithLinks.length)];
    // console.log(hadith);
    getData(hadith).then((res) => {
        // console.log(res.hadiths);
        const randNumber = getRndInteger(0, res.hadiths.length);
        $("#hadith").html(res.hadiths[randNumber].english.text);
        $("#from").html(res.hadiths[randNumber].english.narrator);
    });

    $("#sampleMinute").click(setAlarm);
    $("#min15").click(setAlarm);
    $("#min30").click(setAlarm);
    $("#cancelAlarm").click(clearAlarm);
});