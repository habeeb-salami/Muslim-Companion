'use strict';

function setAlarm(event) {
    const minutes = parseFloat(event.target.value);
    console.log(minutes);
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.alarms.create({ delayInMinutes: minutes });
    chrome.storage.sync.set({ minutes: minutes });
    window.close();
}

function clearAlarm() {
    chrome.action.setBadgeText({ text: '' });
    chrome.alarms.clearAll();
    window.close();
}
async function getData(link) {
    $.ajax({
        headers: { "Accept": "application/json" },
        type: 'GET',
        url: link,
        crossDomain: true,
        beforeSend: function (xhr) {
            xhr.withCredentials = true;
        },
        success: function (data, textStatus, request) {
            console.log(data);
            // let quote = '';
            // // console.log(data[0]);
            // for (var i = 0; i < data.length; i++) {
            //     quote += "<li>"+data[i].name + " <br/>" + data[i].transliteration+"</li>"
            // }
            // $("#chapter-list").html(quote);
        }
    });
}
$(function () {
    // chrome.notifications.create('notificationId', {
    //     type: 'basic',
    //     iconUrl: './images/ramadan.png', 
    //     title: 'Salat Notification',
    //     message: "Salam Alaikum, Time for Salat!!!"
    // });
    let hadithLink = "http://haya.zya.me/hadith/forties/nawawi40.json";
    let quranLink = "https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/quran.json";

    getData(quranLink).then(function (data) {
        console.log(data);
    },
        function (err) {
            console.log(err);
        });

    //get hadith
    getData(hadithLink).then(function (data) {
        console.log(data);
    },
        function (err) {
            console.log(err);
        });
    

    $("#sampleMinute").click(setAlarm);
    $("#min15").click(setAlarm);
    $("#min30").click(setAlarm);
    $("#cancelAlarm").click(clearAlarm);
});




