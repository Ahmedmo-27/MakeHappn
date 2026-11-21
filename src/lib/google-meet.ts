const CALL_MINUTES = 30;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** Formats a datetime-local value (yyyy-mm-ddThh:mm) as a floating Google Calendar time. */
function calendarTime(date: Date) {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00`
  );
}

/** Opens a prefilled Google Calendar event where the call can be given a Google Meet link. */
export function googleMeetScheduleUrl(input: {
  title: string;
  details: string;
  startLocal: string;
  guestEmails?: string[];
}): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(input.startLocal);
  if (!match) throw new Error("Choose a call date and time");
  const [, year, month, day, hour, minute] = match.map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const end = new Date(start.getTime() + CALL_MINUTES * 60_000);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    details: input.details,
    dates: `${calendarTime(start)}/${calendarTime(end)}`,
  });
  if (input.guestEmails?.length) params.set("add", input.guestEmails.join(","));
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
