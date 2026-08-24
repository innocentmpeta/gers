// Generates calendar links/files entirely client-side — no external
// calendar service or API needed, just a URL format (Google) and a plain
// text file format (.ics, universal — Outlook, Apple Calendar, etc).

function toIcsDate(dateStr: string): string {
  return dateStr.replaceAll('-', '')
}

// Calendar date ranges are exclusive of the end date, so an event that
// should visibly span through the last day needs endDate + 1 for both formats.
// Falls back to the same-day date rather than throwing if it's unparseable
// (e.g. a Hero doc with a malformed/empty date field) — a slightly wrong
// calendar entry beats crashing the page that renders the hero.
function dayAfter(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return dateStr
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

export function getGoogleCalendarUrl(title: string, startDate: string, endDate?: string): string {
  const end = dayAfter(endDate || startDate)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${toIcsDate(startDate)}/${toIcsDate(end)}`,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function icsEscape(text: string): string {
  return text.replace(/[\\,;]/g, (m) => `\\${m}`)
}

export function getIcsContent(title: string, startDate: string, endDate?: string): string {
  const end = dayAfter(endDate || startDate)
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GERS Symposium//EN',
    'BEGIN:VEVENT',
    `UID:${startDate}-${Math.random().toString(36).slice(2)}@gers`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${toIcsDate(startDate)}`,
    `DTEND;VALUE=DATE:${toIcsDate(end)}`,
    `SUMMARY:${icsEscape(title)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
