'use strict';

// Qibla compass logic: computes bearing to Kaaba and rotates an arrow using device orientation when available.

const QIBLA_CONST = {
  kaabaLat: 21.4225,
  kaabaLon: 39.8262,
  settingsKey: 'settings',
  storageLastLocationKey: 'lastLocation',
  storageQiblaBearingKey: 'qiblaBearing',
};

function toRadians(deg) { return (deg * Math.PI) / 180; }
function toDegrees(rad) { return (rad * 180) / Math.PI; }
function normalizeBearing(b) { return (b % 360 + 360) % 360; }

function computeQiblaBearing(latitude, longitude) {
  // Formula based on great-circle initial bearing
  const φ1 = toRadians(latitude);
  const λ1 = toRadians(longitude);
  const φ2 = toRadians(QIBLA_CONST.kaabaLat);
  const λ2 = toRadians(QIBLA_CONST.kaabaLon);
  const Δλ = λ2 - λ1;
  const y = Math.sin(Δλ);
  const x = Math.cos(φ1) * Math.tan(φ2) - Math.sin(φ1) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return normalizeBearing(toDegrees(θ));
}

function cardinalFromBearing(bearing) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const idx = Math.round(bearing / 45) % 8;
  return dirs[idx];
}

function setArrowRotation(deg) {
  const arrow = document.getElementById('qibla-arrow');
  if (!arrow) return;
  arrow.style.transform = `translate(-50%, -100%) rotate(${deg}deg)`;
}

function setInfoText(text) {
  const el = document.getElementById('qibla-info');
  if (el) el.textContent = text;
}

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get([QIBLA_CONST.settingsKey], ({ settings }) => resolve(settings || {}));
  });
}

async function getStoredLastLocation() {
  return new Promise((resolve) => {
    chrome.storage.local.get([QIBLA_CONST.storageLastLocationKey], (obj) => resolve(obj[QIBLA_CONST.storageLastLocationKey] || null));
  });
}

async function storeLocation(coords) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [QIBLA_CONST.storageLastLocationKey]: coords }, resolve);
  });
}

async function storeQiblaBearing(bearing) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [QIBLA_CONST.storageQiblaBearingKey]: bearing }, resolve);
  });
}

async function getCoordinates(settings) {
  // Priority: manual settings → geolocation → stored last location
  if (settings.locationMode === 'manual' && settings.manualLat != null && settings.manualLon != null) {
    return { latitude: settings.manualLat, longitude: settings.manualLon };
  }
  // Geolocation (may fail inside popup on some desktops; best-effort)
  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 });
    });
    const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    storeLocation(coords);
    return coords;
  } catch (e) {
    const cached = await getStoredLastLocation();
    if (cached) return cached;
    return null;
  }
}

let currentQiblaBearing = null;

function handleDeviceOrientation(evt) {
  if (currentQiblaBearing == null) return;
  // alpha is 0..360, degrees clockwise from device's top to magnetic north (varies across platforms)
  let heading = evt.alpha;
  // iOS provides webkitCompassHeading (degrees from North)
  if (typeof evt.webkitCompassHeading === 'number') {
    heading = evt.webkitCompassHeading;
  }
  if (typeof heading !== 'number' || isNaN(heading)) return;
  const rotation = normalizeBearing(currentQiblaBearing - heading);
  setArrowRotation(rotation);
}

async function requestOrientationPermissionIfNeeded() {
  const anyDO = (window.DeviceOrientationEvent || window.DeviceOrientationAbsoluteEvent);
  if (!anyDO) return true;
  // iOS 13+ requires permission via gesture
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const state = await DeviceOrientationEvent.requestPermission();
      return state === 'granted';
    } catch (e) {
      return false;
    }
  }
  return true;
}

function startOrientation() {
  window.addEventListener('deviceorientation', handleDeviceOrientation, true);
}

async function initQibla() {
  const settings = await getSettings();
  const coords = await getCoordinates(settings);
  if (!coords) {
    setInfoText('Location unavailable. Set manual coordinates in Settings.');
    return;
  }
  const bearing = computeQiblaBearing(coords.latitude, coords.longitude);
  currentQiblaBearing = bearing;
  await storeQiblaBearing(bearing);
  setInfoText(`Qibla: ${bearing.toFixed(1)}° ${cardinalFromBearing(bearing)}`);
}

async function enableCompassFlow() {
  const ok = await requestOrientationPermissionIfNeeded();
  if (!ok) {
    setInfoText('Compass permission denied. Showing static bearing.');
    return;
  }
  startOrientation();
}

document.addEventListener('DOMContentLoaded', () => {
  const enableBtn = document.getElementById('enableCompassBtn');
  if (enableBtn) enableBtn.addEventListener('click', enableCompassFlow);
  initQibla();
});


