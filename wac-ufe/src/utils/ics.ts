export interface CalendarEvent {
  /** stays the same for the same event, so a calendar app updates it instead of adding a copy */
  uid: string;
  /** the local day as YYYY-MM-DD */
  date: string;
  summary: string;
  url?: string;
}

const escapeText = (text: string) => text.replace(/[\\;,]/g, '\\$&').replace(/\r?\n/g, '\\n');

/** Splits a line longer than 75 octets into continuation lines that start with a space. */
function fold(line: string): string {
  const encoder = new TextEncoder();
  let result = '';
  let octets = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (octets + size > 75) {
      result += '\r\n ';
      octets = 1;
    }
    result += char;
    octets += size;
  }
  return result;
}

/** An iCalendar file (RFC 5545) with one all-day event per entry. */
export function toIcs(events: CalendarEvent[], now = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HarKap//Ambulance Devices//EN',
    'CALSCALE:GREGORIAN',
    ...events.flatMap(event => [
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${event.date.replace(/-/g, '')}`,
      `SUMMARY:${escapeText(event.summary)}`,
      ...(event.url ? [`URL:${event.url}`] : []),
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}
