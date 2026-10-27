/** Single source of truth for how numbers and dates read across the UI and exports. */
export const APP_TIME_ZONE = process.env.NEXT_PUBLIC_TIME_ZONE ?? "America/Costa_Rica";
const LOCALE = "es-CR";

const integer = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: APP_TIME_ZONE,
});
const date = new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeZone: APP_TIME_ZONE });
const isoDate = new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE });

export const formatNumber = (value: number) => integer.format(value);
export const formatDateTime = (value: Date) => dateTime.format(value);
export const formatDate = (value: Date) => date.format(value);
/** YYYY-MM-DD in the app time zone (used in file names). */
export const formatIsoDate = (value: Date) => isoDate.format(value);

export function formatDelta(delta: number) {
  return `${delta > 0 ? "+" : delta < 0 ? "−" : ""}${integer.format(Math.abs(delta))}`;
}
