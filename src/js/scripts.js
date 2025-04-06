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
    chrome.notifications.create('notificationId', {
        type: 'basic',
        iconUrl: './images/ramadan.png', 
        title: 'Salat Notification',
        message: "Salam Alaikum, Time for Salat!!!"
    });

    $("#sampleMinute").click(setAlarm);
    $("#min15").click(setAlarm);
    $("#min30").click(setAlarm);
    $("#cancelAlarm").click(clearAlarm);
});