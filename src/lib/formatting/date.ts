const RELATIVE_UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
const absoluteFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

/** "3 hours ago" style label. Falls back to "just now" under a minute. */
export function formatRelativeTime(isoDate: string, now: Date = new Date()): string {
  const target = new Date(isoDate);
  const diffSeconds = Math.round((target.getTime() - now.getTime()) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 60) {
    return "just now";
  }

  for (const [unit, secondsInUnit] of RELATIVE_UNITS) {
    if (absSeconds >= secondsInUnit) {
      return relativeFormatter.format(Math.round(diffSeconds / secondsInUnit), unit);
    }
  }

  return relativeFormatter.format(Math.round(diffSeconds / 60), "minute");
}

/** Exact date/time for tooltips and accessible labels. */
export function formatAbsoluteTime(isoDate: string): string {
  return absoluteFormatter.format(new Date(isoDate));
}
