'use strict';

// Minimal prayer time calculator inspired by praytimes.org algorithm
// Supports Fajr, Dhuhr, Asr, Maghrib, Isha for a given date/location.

const PrayerCalcMethod = {
  MuslimWorldLeague: { fajrAngle: 18, isha: { type: 'angle', value: 17 } },
  Egyptian: { fajrAngle: 19.5, isha: { type: 'angle', value: 17.5 } },
  Karachi: { fajrAngle: 18, isha: { type: 'angle', value: 18 } },
  UmmAlQura: { fajrAngle: 18.5, isha: { type: 'fixed', value: 90 } }, // 90 min after Maghrib
  ISNA: { fajrAngle: 15, isha: { type: 'angle', value: 15 } },
  MWL: { fajrAngle: 18, isha: { type: 'angle', value: 17 } },
};

function toRadians(deg) { return (deg * Math.PI) / 180; }
function toDegrees(rad) { return (rad * 180) / Math.PI; }

function fixAngle(a) { return a - 360 * (Math.floor(a / 360)); }

const julianDate = (year, month, day) => {
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
  return JD;
}

const sunPosition = (jd) => {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * Math.sin(toRadians(g)) + 0.020 * Math.sin(toRadians(2 * g)));
  const e = 23.439 - 0.00000036 * D;
  const RA = toDegrees(Math.atan2(Math.cos(toRadians(e)) * Math.sin(toRadians(L)), Math.cos(toRadians(L)))) / 15;
  const eqt = q / 15 - fixHour(RA);
  const decl = toDegrees(Math.asin(Math.sin(toRadians(e)) * Math.sin(toRadians(L))));
  return { declination: decl, equation: eqt };
}

function fixHour(h) { return h - 24 * Math.floor(h / 24); }

const midDay = (jd, tz, lon) => {
  const sp = sunPosition(jd - lon / 360);
  const Z = fixHour(12 - sp.equation);
  return Z;
}

const hourAngle = (angle, lat, decl) => {
  const term = (Math.cos(toRadians(angle)) - Math.sin(toRadians(lat)) * Math.sin(toRadians(decl))) /
    (Math.cos(toRadians(lat)) * Math.cos(toRadians(decl)));
  // avoid NaN from floating errors
  const clamped = Math.min(1, Math.max(-1, term));
  return toDegrees(Math.acos(clamped)) / 15;
}

const computeTimes = (date, lat, lon, tzOffsetMinutes, method) => {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const jd = julianDate(y, m, d);
  const tz = -tzOffsetMinutes / 60; // JS gives minutes behind UTC, so negate

  const decl = sunPosition(jd - lon / 360).declination;
  const Z = midDay(jd, tz, lon);

  // Dhuhr
  const dhuhr = Z;

  // Sunrise/Sunset use angle -0.833 (refraction)
  const sunriseHA = hourAngle(90 + 0.833, lat, decl);
  const sunsetHA = sunriseHA;
  const sunrise = Z - sunriseHA;
  const sunset = Z + sunsetHA;

  // Fajr
  const fajrHA = hourAngle(90 + method.fajrAngle, lat, decl);
  const fajr = Z - fajrHA;

  // Maghrib is sunset
  const maghrib = sunset;

  // Isha (angle or fixed minutes after Maghrib)
  let isha;
  if (method.isha.type === 'angle') {
    const ishaHA = hourAngle(90 + method.isha.value, lat, decl);
    isha = Z + ishaHA;
  } else {
    isha = maghrib + method.isha.value / 60;
  }

  // Asr (shadow factor: 1 for Shafi/Maliki/Hanbali; 2 for Hanafi). We'll use 1 by default.
  const asrShadowFactor = 1;
  const asrHA = asrHourAngle(lat, decl, asrShadowFactor);
  const asr = Z + asrHA;

  const toDate = (hoursFraction) => {
    const local = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const ms = Math.round(hoursFraction * 3600 * 1000);
    local.setTime(local.getTime() + ms);
    return local;
  }

  return {
    Fajr: toDate(fajr + tz - lon / 15),
    Sunrise: toDate(sunrise + tz - lon / 15),
    Dhuhr: toDate(dhuhr + tz - lon / 15),
    Asr: toDate(asr + tz - lon / 15),
    Maghrib: toDate(maghrib + tz - lon / 15),
    Isha: toDate(isha + tz - lon / 15),
  };
}

const asrHourAngle = (lat, decl, factor) => {
  // angle for Asr shadow factor
  const phi = Math.abs(lat);
  const angle = toDegrees(Math.atan(1 / (factor + Math.tan(Math.abs(phi - decl) * Math.PI / 180))));
  // compute HA for altitude = 90 - angle
  const ha = hourAngle(90 - angle, lat, decl);
  return ha;
}

const getPrayerTimes = (date, coords, options) => {
  const { latitude, longitude } = coords;
  const tzOffsetMinutes = date.getTimezoneOffset();
  const method = options?.method || PrayerCalcMethod.MWL;
  return computeTimes(date, latitude, longitude, tzOffsetMinutes, method);
}

// Expose API on self for worker importScripts usage
self.PrayerTimes = {
  getPrayerTimes,
  PrayerCalcMethod,
};


