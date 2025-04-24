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

let  getRndInteger = (min, max) =>{
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

$(function () {
    // chrome.notifications.create('notificationId', {
    //     type: 'basic',
    //     iconUrl: './images/ramadan.png', 
    //     title: 'Salat Notification',
    //     message: "Salam Alaikum, Time for Salat!!!"
    // });
    getData("http://127.0.0.1/islamical-backend/hadith/forties/qudsi40.json").then((res) => {
        console.log(res.hadiths);
        const randNumber = getRndInteger(0, res.hadiths.length);
        $("#hadith").html(res.hadiths[randNumber].english.text);
        $("#from").html(res.hadiths[randNumber].english.narrator);
    });

    let hadithLink = "http://haya.zya.me/hadith/forties/nawawi40.json";
    let quranLink = "https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/quran.json";


    $("#sampleMinute").click(setAlarm);
    $("#min15").click(setAlarm);
    $("#min30").click(setAlarm);
    $("#cancelAlarm").click(clearAlarm);
});