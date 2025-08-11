ej.base.enableRipple(true);
var addClass = ej.base.addClass;

// Islamic events keyed by Hijri month/day (1-based). Months: 1=Muharram ... 12=Dhu al-Hijjah
var islamicEvents = [
  { month: 1, day: 10, label: 'Ashura' },
  { month: 3, day: 12, label: 'Mawlid' },
  { month: 7, day: 27, label: 'Isra and Mi7raj' },
  { month: 8, day: 15, label: 'Mid-Sha7ban' },
  { month: 9, day: 1, label: 'Ramadan Begins' },
  { month: 9, day: 27, label: 'Laylat al-Qadr (27th)' },
  { month: 10, day: 1, label: 'Eid al-Fitr' },
  { month: 12, day: 9, label: 'Day of Arafah' },
  { month: 12, day: 10, label: 'Eid al-Adha' }
];

function getHijriParts(date) {
  // Use Intl with Islamic calendar to obtain hijri month/day
  try {
    var fmt = new Intl.DateTimeFormat('en-u-ca-islamic', { day: 'numeric', month: 'numeric', year: 'numeric' });
    var parts = fmt.formatToParts(date);
    var month = parseInt(parts.find(function(p){return p.type==='month';}).value, 10);
    var day = parseInt(parts.find(function(p){return p.type==='day';}).value, 10);
    return { month: month, day: day };
  } catch (e) {
    return null;
  }
}

function decorateIfIslamicEvent(args) {
  var hijri = getHijriParts(args.date);
  if (!hijri) { return; }
  for (var i = 0; i < islamicEvents.length; i++) {
    var ev = islamicEvents[i];
    if (ev.month === hijri.month && ev.day === hijri.day) {
      var span = document.createElement('span');
      addClass([args.element], ['special', 'e-day', 'event']);
      args.element.setAttribute('title', ev.label);
      args.element.appendChild(span);
      break;
    }
  }
}

var calendar = new ej.calendars.Calendar({
  calendarMode: 'Islamic',
  renderDayCell: function(args){
    decorateIfIslamicEvent(args);
  }
});
calendar.appendTo('#element');