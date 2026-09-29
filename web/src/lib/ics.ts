const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const ymd = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

/** Download a one-day calendar reminder (.ics) — works with Apple, Google and Outlook calendars. */
export function downloadReminder({ title, date, notes, filename = "reminder" }: { title: string; date: string; notes?: string; filename?: string }) {
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(start.getTime() + 864e5);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Labora//Follow-up planner//EN",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@labora`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${ymd(start)}`,
    `DTEND;VALUE=DATE:${ymd(end)}`,
    `SUMMARY:${esc(title)}`,
    ...(notes ? [`DESCRIPTION:${esc(notes)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
