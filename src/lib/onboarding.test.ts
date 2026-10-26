import {
  applicationSchema,
  CSV_TEMPLATE,
  imageToDataUrl,
  introRateEndsAt,
  normaliseSaPhone,
  parseCsv,
  parseHoursForm,
  parseProductCsv,
  randToCents,
} from "./onboarding";
import { isInPeakWindow, parsePeakWindows, sastClock, validatePeakWindow } from "./peak";
import { commissionBps, DEFAULT_PRICING as C, isPeakActive, pricingFromSettings, quoteOrder } from "./pricing";

let passed = 0;
function eq<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
  passed++;
}
function throws(fn: () => unknown, message: string) {
  let t = false;
  try { fn(); } catch { t = true; }
  eq(t, true, message);
}

// --- Phone normalisation
eq(normaliseSaPhone("082 123 4567"), "+27821234567", "local mobile");
eq(normaliseSaPhone("+27 82-123-4567"), "+27821234567", "intl mobile");
eq(normaliseSaPhone("12345"), null, "bad phone");

// --- Application validation
const good = {
  businessName: "Test Kitchen", ownerName: "Thandi Test", contactPhone: "0821234567",
  contactEmail: "Owner@Example.com", password: "longenough", pricingCategory: "FOOD",
  isIndependent: "yes", addressLine1: "1 Test Rd", suburb: "Cornubia", city: "Durban",
  latitude: "-29.674", longitude: "31.074",
};
const ok = applicationSchema.safeParse(good);
eq(ok.success, true, "valid application parses");
if (ok.success) {
  eq(ok.data.isIndependent, true, "independent yes -> true");
  eq(ok.data.contactEmail, "owner@example.com", "email lowercased");
  eq(ok.data.latitude, -29.674, "lat coerced");
}
eq(applicationSchema.safeParse({ ...good, pricingCategory: "PHARMACY" }).success, false, "bad category rejected");
eq(applicationSchema.safeParse({ ...good, latitude: "51.5" }).success, false, "pin outside SA rejected");
eq(applicationSchema.safeParse({ ...good, latitude: undefined }).success, false, "missing pin rejected");
eq(applicationSchema.safeParse({ ...good, password: "short" }).success, false, "short password rejected");
eq(applicationSchema.safeParse({ ...good, isIndependent: undefined }).success, false, "independent required");
eq(applicationSchema.safeParse({ ...good, contactEmail: "nope" }).success, false, "bad email rejected");

// --- Hours
const form: Record<string, string> = { hours_mon_open: "08:00", hours_mon_close: "17:00", hours_sun_closed: "on", hours_sun_open: "09:00", hours_sun_close: "12:00" };
const h = parseHoursForm((k) => form[k] ?? null);
eq(h.mon?.close, "17:00", "hours parsed");
eq(h.sun, undefined, "closed day skipped");
throws(() => parseHoursForm(() => null), "no hours rejected");
throws(() => parseHoursForm((k) => ({ hours_mon_open: "8am", hours_mon_close: "17:00" })[k] ?? null), "bad hours rejected");

// --- Images
throws(() => imageToDataUrl({ type: "image/gif", size: 10 }, Buffer.from("x")), "gif rejected");
throws(() => imageToDataUrl({ type: "image/png", size: 400 * 1024 }, Buffer.alloc(1)), "oversize rejected");
eq(imageToDataUrl({ type: "image/png", size: 1 }, Buffer.from("a")), "data:image/png;base64,YQ==", "data url");

// --- Prices & CSV
eq(randToCents("45"), 4500, "R45");
eq(randToCents("R12,50"), 1250, "R12,50");
throws(() => randToCents("0"), "zero price rejected");
throws(() => randToCents("abc"), "text price rejected");
eq(parseCsv('a,b\n"x, ""y""",2\r\n').length, 2, "csv rows");
eq(parseCsv('a,b\n"x, ""y""",2\r\n')[1][0], 'x, "y"', "csv quoted field");
const tpl = parseProductCsv(CSV_TEMPLATE, "FOOD");
eq(tpl.errors.length, 0, "template parses cleanly");
eq(tpl.products.length, 2, "template rows");
eq(tpl.products[1].isAvailable, false, "available=no");
const bad = parseProductCsv("name,price\nChips,abc\n,10\nPie,25", "GROCERY");
eq(bad.errors.length, 2, "two bad rows reported");
eq(bad.products[0].browseCategory, "groceries", "default aisle by category");
eq(parseProductCsv("title,cost\nx,1", "FOOD").errors.length, 1, "bad header rejected");

// --- Intro rate on approval: 12% for 3 months for independents
const start = new Date("2026-10-26T10:00:00Z");
eq(introRateEndsAt(start, 3).toISOString().slice(0, 10), "2027-01-26", "intro ends after 3 months");
eq(commissionBps({ category: "FOOD", isIndependent: true, introRateStartedAt: start, now: new Date("2026-12-01"), config: C }).bps, 1200, "intro 12% in window");
eq(commissionBps({ category: "FOOD", isIndependent: true, introRateStartedAt: start, now: new Date("2027-02-01"), config: C }).bps, 1500, "back to 15% after");
eq(commissionBps({ category: "FOOD", isIndependent: false, introRateStartedAt: null, now: new Date("2026-12-01"), config: C }).bps, 1500, "chain: 15%");

// --- Peak windows (Africa/Johannesburg = UTC+2)
eq(sastClock(new Date("2026-10-26T15:30:00Z")).minutes, 17 * 60 + 30, "SAST clock");
eq(sastClock(new Date("2026-10-26T15:30:00Z")).day, 1, "Monday");
const weekdayEvening = [{ days: [1, 2, 3, 4, 5], start: "17:00", end: "20:00" }];
eq(isInPeakWindow(weekdayEvening, new Date("2026-10-26T15:30:00Z")), true, "Mon 17:30 SAST in window");
eq(isInPeakWindow(weekdayEvening, new Date("2026-10-26T18:00:00Z")), false, "Mon 20:00 SAST end exclusive");
eq(isInPeakWindow(weekdayEvening, new Date("2026-10-25T15:30:00Z")), false, "Sunday not in window");
const overnight = [{ days: [5], start: "22:00", end: "02:00" }];
eq(isInPeakWindow(overnight, new Date("2026-10-30T21:00:00Z")), true, "Fri 23:00 overnight");
eq(isInPeakWindow(overnight, new Date("2026-10-30T23:30:00Z")), true, "Sat 01:30 tail of Fri window");
eq(isInPeakWindow(overnight, new Date("2026-10-31T21:00:00Z")), false, "Sat 23:00 not");
throws(() => validatePeakWindow({ days: [], start: "17:00", end: "18:00" }), "no days rejected");
throws(() => validatePeakWindow({ days: [1], start: "25:00", end: "18:00" }), "bad time rejected");
throws(() => validatePeakWindow({ days: [1], start: "18:00", end: "18:00" }), "zero-length rejected");
eq(parsePeakWindows("not json").length, 0, "bad json -> []");
const cfg = pricingFromSettings({ peakFeeEnabled: true, peakWindowsJson: JSON.stringify(weekdayEvening) });
eq(cfg.peakWindows.length, 1, "windows loaded from settings");
eq(isPeakActive(cfg, new Date("2026-10-26T15:30:00Z")), true, "peak active in window");
eq(isPeakActive({ ...cfg, peakFeeEnabled: false }, new Date("2026-10-26T15:30:00Z")), false, "disabled overrides window");
eq(isPeakActive({ ...cfg, peakWindows: [] }, new Date("2026-10-25T03:00:00Z")), true, "no windows = always when enabled");
eq(quoteOrder({ itemTotalCents: 20000, category: "FOOD", distanceKm: 2, config: cfg, now: new Date("2026-10-26T15:30:00Z") }).peakFeeCents, 500, "quote charges peak in window");
eq(quoteOrder({ itemTotalCents: 20000, category: "FOOD", distanceKm: 2, config: cfg, now: new Date("2026-10-26T10:00:00Z") }).peakFeeCents, 0, "quote no peak outside window");

console.log(`onboarding + peak tests: ${passed} assertions passed`);
