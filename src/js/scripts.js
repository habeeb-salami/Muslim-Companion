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
$(function () {
    // chrome.notifications.create('notificationId', {
    //     type: 'basic',
    //     iconUrl: './images/ramadan.png', 
    //     title: 'Salat Notification',
    //     message: "Salam Alaikum, Time for Salat!!!"
    // });
    fetchData();
    $("#sampleMinute").click(setAlarm);
    $("#min15").click(setAlarm);
    $("#min30").click(setAlarm);
    $("#cancelAlarm").click(clearAlarm);
});



async function fetchData() {
    $.ajax({
        headers: { "Accept": "application/json" },
        type: 'GET',
        url: "https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/quran.json",
        crossDomain: true,
        beforeSend: function (xhr) {
            xhr.withCredentials = true;
        },
        success: function (data, textStatus, request) {
            let quote = '';
            // console.log(data[0]);
            for (var i = 0; i < data.length; i++) {
                quote += "<li>"+data[i].name + " <br/>" + data[i].transliteration+"</li>"
            }
            $("#chapter-list").html(quote);
        }
    });
}
