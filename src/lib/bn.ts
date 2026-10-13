// Bengali formatting helpers. Machine-readable values (URLs, form values, DB) stay in ASCII digits;
// these helpers are for display only.

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export const DHAKA_TZ = "Asia/Dhaka";
/** Bangladesh has no daylight saving time. */
export const DHAKA_OFFSET = "+06:00";

/** Convert ASCII digits in a value to Bengali digits ("2026" → "২০২৬"). */
export function toBn(value: number | string): string {
  return String(value).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

/** Convert Bengali digits to ASCII digits ("০১৭" → "017"). */
export function fromBnDigits(value: string): string {
  return value.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

/** Format a number with Bengali digits and South-Asian grouping (১২,৩৪,৫৬৭). */
export function formatBnNumber(value: number): string {
  return new Intl.NumberFormat("bn-BD").format(value);
}

/** e.g. "শুক্রবার, ২২ জানুয়ারি ২০২৭" */
export function formatBnDate(date: Date | string, opts: { weekday?: boolean } = {}): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat("bn-BD", {
    timeZone: DHAKA_TZ,
    weekday: opts.weekday ? "long" : undefined,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  // Normalize ICU's "জানুয়ারী" spelling to the more common modern "জানুয়ারি".
  const month = get("month").replace(/ী$/, "ি");
  const core = `${get("day")} ${month} ${get("year")}`;
  return opts.weekday ? `${get("weekday")}, ${core}` : core;
}

function dayPeriod(hour: number): string {
  if (hour >= 4 && hour < 6) return "ভোর";
  if (hour >= 6 && hour < 12) return "সকাল";
  if (hour >= 12 && hour < 15) return "দুপুর";
  if (hour >= 15 && hour < 18) return "বিকেল";
  if (hour >= 18 && hour < 20) return "সন্ধ্যা";
  return "রাত";
}

/** Format a "HH:MM[:SS]" time as "সকাল ৮:৩০". */
export function formatBnTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${dayPeriod(h)} ${toBn(hour12)}:${toBn(String(m).padStart(2, "0"))}`;
}

/** Time-of-day of a timestamp in Dhaka, e.g. "সকাল ৮:৩০". */
export function formatBnTimeOfDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const hm = new Intl.DateTimeFormat("en-GB", {
    timeZone: DHAKA_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(d);
  return formatBnTime(hm);
}

export function formatBnDateTime(date: Date | string): string {
  return `${formatBnDate(date)}, ${formatBnTimeOfDate(date)}`;
}

/** Convert a Date to the "YYYY-MM-DDTHH:MM" value of an <input type="datetime-local"> in Dhaka time. */
export function toDhakaInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const shifted = new Date(d.getTime() + 6 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 16);
}

/** Parse an <input type="datetime-local"> value entered in Dhaka time. Returns null for empty/invalid. */
export function fromDhakaInputValue(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const d = new Date(`${value}:00${DHAKA_OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatTaka(amount: number): string {
  return `${formatBnNumber(amount)} টাকা`;
}
