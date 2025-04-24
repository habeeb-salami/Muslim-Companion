'use strict';

chrome.alarms.onAlarm.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '../images/ramadan.png',
    title: 'Time For Salat',
    message: "Just want to remind you it is time for Salat!",
    buttons: [{ title: 'Go Pray.' }],
    priority: 0
  });
});

chrome.notifications.onButtonClicked.addListener(async () => {
  const item = await chrome.storage.sync.get(['minutes']);
  chrome.action.setBadgeText({ text: 'ON' });
  chrome.alarms.create({ delayInMinutes: item.minutes });
});