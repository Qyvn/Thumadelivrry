/**
 * Scheduled peak-fee windows. Times are wall-clock in Africa/Johannesburg (SAST, UTC+2, no DST).
 * days: 0 = Sunday … 6 = Saturday. A window whose end <= start runs past midnight
 * (e.g. 22:00–02:00 on Fri covers Fri 22:00 → Sat 02:00).
 */
export type PeakWindow = { days: number[]; start: string; end: string };

export const PEAK_TZ = "Africa/Johannesburg";
export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toMinutes(hhmm: string): number {
  const m = HHMM.exec(hhmm);
  if (!m) throw new Error(`Invalid time "${hhmm}" (use HH:MM, 24h)`);
  return Number(m[1]) * 60 + Number(m[2]);
}

export function validatePeakWindow(w: unknown): PeakWindow {
  const o = (w ?? {}) as Record<string, unknown>;
  const days = Array.isArray(o.days) ? o.days.map(Number) : [];
  const uniq = [...new Set(days)].sort();
  if (uniq.length === 0) throw new Error("Each peak window needs at least one day");
  if (uniq.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) throw new Error("Invalid day");
  const start = String(o.start ?? "");
  const end = String(o.end ?? "");
  if (toMinutes(start) === toMinutes(end)) throw new Error("Peak window start and end must differ");
  return { days: uniq, start, end };
}

export function parsePeakWindows(json: string | null | undefined): PeakWindow[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return [];
    const out: PeakWindow[] = [];
    for (const w of arr) {
      try {
        out.push(validatePeakWindow(w));
      } catch {
        /* skip invalid stored window */
      }
    }
    return out;
  } catch {
    return [];
  }
}

/** Day-of-week (0=Sun) and minutes since midnight in Africa/Johannesburg. */
export function sastClock(now: Date): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: PEAK_TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = DAY_LABELS.indexOf(get("weekday") as (typeof DAY_LABELS)[number]);
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

export function isInPeakWindow(windows: PeakWindow[], now: Date): boolean {
  const { day, minutes } = sastClock(now);
  const prevDay = (day + 6) % 7;
  return windows.some((w) => {
    const s = toMinutes(w.start);
    const e = toMinutes(w.end);
    if (s < e) return w.days.includes(day) && minutes >= s && minutes < e;
    // Overnight: today's late part, or the early-morning tail of yesterday's window
    return (w.days.includes(day) && minutes >= s) || (w.days.includes(prevDay) && minutes < e);
  });
}

export function describePeakWindow(w: PeakWindow): string {
  return `${w.days.map((d) => DAY_LABELS[d]).join(", ")} ${w.start}–${w.end}`;
}
