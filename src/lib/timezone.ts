// The learner's IANA time zone ("Europe/Chisinau"), stored by the browser
// in a cookie so server code can count "night" and "morning" in local time.
export const TIME_ZONE_COOKIE = "ef-tz";

// Cookies are untrusted: anything Intl does not know falls back to UTC.
export function parseTimeZone(value: string | undefined): string {
  if (!value || value.length > 64) return "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return value;
  } catch {
    return "UTC";
  }
}
