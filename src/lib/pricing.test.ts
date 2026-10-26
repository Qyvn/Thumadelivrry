import {
  commissionBps,
  commissionCents,
  courierPay,
  DEFAULT_PRICING as C,
  deliveryFeeForDistance,
  estimateDistance,
  minimumOrderCents,
  normalisePricingCategory,
  pricingFromSettings,
  quoteOrder,
} from "./pricing";
import { fromForm, toDisplay } from "./pricing-fields";

let passed = 0;
function eq<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
  passed++;
}

// --- Delivery bands: R19 0-3 km, R25 3-6, R32 6-10, +R3/km, cap R45
eq(deliveryFeeForDistance(0, C), 1900, "0 km");
eq(deliveryFeeForDistance(3, C), 1900, "3 km is band 1");
eq(deliveryFeeForDistance(3.1, C), 2500, "3.1 km band 2");
eq(deliveryFeeForDistance(6, C), 2500, "6 km band 2");
eq(deliveryFeeForDistance(6.5, C), 3200, "6.5 km band 3");
eq(deliveryFeeForDistance(10, C), 3200, "10 km band 3");
eq(deliveryFeeForDistance(10.2, C), 3500, "10.2 km rounds up 1 extra km");
eq(deliveryFeeForDistance(12, C), 3800, "12 km = R32 + 2×R3");
eq(deliveryFeeForDistance(14, C), 4400, "14 km");
eq(deliveryFeeForDistance(15, C), 4500, "15 km hits cap");
eq(deliveryFeeForDistance(40, C), 4500, "40 km capped R45");
let threw = false;
try { deliveryFeeForDistance(-1, C); } catch { threw = true; }
eq(threw, true, "negative distance rejected");
eq(deliveryFeeForDistance(2, { ...C, deliveryBand1Cents: 2200 }), 2200, "bands configurable");

// --- Distance estimate
const merchant = { lat: -29.7058, lng: 31.0476 };
const d1 = estimateDistance({ merchant, customer: { lat: -29.7005, lng: 31.0452 }, config: C });
eq(d1.source, "HAVERSINE", "haversine when both pins");
eq(d1.km > 0 && d1.km < 1, true, "short haversine distance");
const d2 = estimateDistance({ merchant: null, customer: { lat: -29.8587, lng: 31.0218 }, zoneCenter: { lat: -29.8587, lng: 31.0218 }, config: C });
eq(d2.source, "ZONE_CENTER", "zone centre fallback");
eq(d2.km, 0, "same point = 0 km");
const d3 = estimateDistance({ merchant, customer: null, config: C });
eq(d3.source, "FALLBACK", "fallback without customer pin");
eq(d3.km, C.fallbackDistanceKm, "fallback distance from settings");

// --- Service fee R5, waived over R400
eq(quoteOrder({ itemTotalCents: 20000, category: "FOOD", distanceKm: 2, config: C }).serviceFeeCents, 500, "service fee R5");
eq(quoteOrder({ itemTotalCents: 40000, category: "FOOD", distanceKm: 2, config: C }).serviceFeeCents, 500, "R400 exactly not waived");
eq(quoteOrder({ itemTotalCents: 40001, category: "FOOD", distanceKm: 2, config: C }).serviceFeeCents, 0, "over R400 waived");

// --- Small-order fee R10 under R100
eq(quoteOrder({ itemTotalCents: 9999, category: "FOOD", distanceKm: 2, config: C }).smallOrderFeeCents, 1000, "small order fee under R100");
eq(quoteOrder({ itemTotalCents: 10000, category: "FOOD", distanceKm: 2, config: C }).smallOrderFeeCents, 0, "no small order fee at R100");

// --- Minimum order by category
eq(minimumOrderCents("FOOD", C), 6000, "food min R60");
eq(minimumOrderCents("GROCERY", C), 10000, "grocery min R100");
eq(minimumOrderCents("RETAIL", C), 10000, "retail uses grocery min");
const qMin = quoteOrder({ itemTotalCents: 5000, category: "FOOD", distanceKm: 2, config: C });
eq(qMin.meetsMinimum, false, "R50 food below min");
eq(qMin.shortfallCents, 1000, "shortfall R10");
eq(quoteOrder({ itemTotalCents: 9000, category: "GROCERY", distanceKm: 2, config: C }).meetsMinimum, false, "R90 grocery below min");
eq(normalisePricingCategory("MARKET"), "GROCERY", "MARKET maps to GROCERY");
eq(normalisePricingCategory(undefined), "FOOD", "default FOOD");

// --- Totals
const q = quoteOrder({ itemTotalCents: 8000, category: "FOOD", distanceKm: 4, tipCents: 1000, config: C });
eq(q.totalCents, 8000 + 2500 + 500 + 1000 + 1000, "total = items+delivery+service+small+tip");

// --- Peak fee (off by default, toggle on)
eq(quoteOrder({ itemTotalCents: 20000, category: "FOOD", distanceKm: 2, config: C }).peakFeeCents, 0, "peak off by default");
const peakCfg = { ...C, peakFeeEnabled: true };
eq(quoteOrder({ itemTotalCents: 20000, category: "FOOD", distanceKm: 2, config: peakCfg }).peakFeeCents, 500, "peak R5 when on");
eq(courierPay({ km: 2, peakFeeCents: 500, config: peakCfg }).totalCents, 3000, "peak fee passed to courier");

// --- Commission
eq(commissionBps({ category: "FOOD", config: C }).bps, 1500, "restaurant 15%");
eq(commissionBps({ category: "GROCERY", config: C }).bps, 800, "grocery 8%");
eq(commissionBps({ category: "RETAIL", config: C }).bps, 800, "retail 8%");
eq(commissionBps({ category: "FOOD", fulfilment: "PICKUP", config: C }).bps, 500, "pickup 5%");
eq(commissionBps({ category: "FOOD", overrideBps: 1000, config: C }).bps, 1000, "merchant override wins");
const start = new Date("2026-10-01T00:00:00Z");
eq(commissionBps({ category: "FOOD", isIndependent: true, introRateStartedAt: start, now: new Date("2026-12-15T00:00:00Z"), config: C }).bps, 1200, "intro 12% within 3 months");
eq(commissionBps({ category: "FOOD", isIndependent: true, introRateStartedAt: start, now: new Date("2027-01-02T00:00:00Z"), config: C }).bps, 1500, "intro ends after 3 months");
eq(commissionBps({ category: "FOOD", isIndependent: false, introRateStartedAt: start, now: new Date("2026-10-15T00:00:00Z"), config: C }).bps, 1500, "intro only for independents");
eq(commissionBps({ category: "GROCERY", isIndependent: true, introRateStartedAt: start, now: new Date("2026-10-15T00:00:00Z"), config: C }).bps, 800, "intro never raises grocery rate");
eq(commissionBps({ category: "FOOD", isIndependent: true, introRateStartedAt: start, now: new Date("2026-10-15T00:00:00Z"), config: { ...C, introCommissionEnabled: false } }).bps, 1500, "intro toggle off");
eq(commissionCents(20000, 1500), 3000, "15% of R200 = R30");

// --- Courier pay: R25 base + R3/km after 3 km, R12 per extra drop, tips 100%
eq(courierPay({ km: 3, config: C }).totalCents, 2500, "base R25 up to 3 km");
eq(courierPay({ km: 5, config: C }).totalCents, 3100, "5 km = R25 + 2×R3");
eq(courierPay({ km: 3.4, config: C }).totalCents, 2800, "part km rounds up");
eq(courierPay({ km: 2, extraDrops: 2, config: C }).totalCents, 4900, "two extra drops R24");
eq(courierPay({ km: 2, tipCents: 2000, config: C }).tipCents, 2000, "tip passes 100%");
eq(courierPay({ km: 2, tipCents: 2000, config: C }).totalCents, 4500, "tip in courier total");

// --- THUMA Plus
const plusFood = quoteOrder({ itemTotalCents: 15100, category: "FOOD", distanceKm: 5, hasPlus: true, config: C });
eq(plusFood.deliveryFeeCents, 0, "Plus free delivery food > R150 within 6 km");
eq(plusFood.serviceFeeCents, 0, "Plus no service fee");
eq(plusFood.plusApplied, true, "plusApplied flag");
eq(quoteOrder({ itemTotalCents: 15000, category: "FOOD", distanceKm: 5, hasPlus: true, config: C }).deliveryFeeCents, 2500, "Plus food R150 exactly pays delivery");
eq(quoteOrder({ itemTotalCents: 20000, category: "FOOD", distanceKm: 7, hasPlus: true, config: C }).deliveryFeeCents, 3200, "Plus beyond 6 km pays delivery");
eq(quoteOrder({ itemTotalCents: 20000, category: "GROCERY", distanceKm: 4, hasPlus: true, config: C }).deliveryFeeCents, 2500, "Plus grocery R200 pays delivery");
eq(quoteOrder({ itemTotalCents: 25100, category: "GROCERY", distanceKm: 4, hasPlus: true, config: C }).deliveryFeeCents, 0, "Plus grocery > R250 free");
eq(quoteOrder({ itemTotalCents: 25100, category: "GROCERY", distanceKm: 4, hasPlus: true, config: { ...C, plusEnabled: false } }).serviceFeeCents, 500, "Plus disabled = normal fees");

// --- Settings mapping + admin form units
const cfg = pricingFromSettings({ serviceFeeCents: 700, peakFeeEnabled: true });
eq(cfg.serviceFeeCents, 700, "settings override service fee");
eq(cfg.peakFeeEnabled, true, "settings override toggle");
eq(cfg.deliveryFeeCapCents, 4500, "missing settings fall back to defaults");
eq(pricingFromSettings(null).courierBaseCents, 2500, "null settings → defaults");
eq(fromForm("rand", "19.00"), 1900, "rand → cents");
eq(fromForm("percent", "12"), 1200, "percent → bps");
eq(fromForm("toggle", "on"), true, "checkbox on");
eq(fromForm("toggle", null), false, "checkbox off");
eq(toDisplay("rand", 4500), "45.00", "cents → rand display");
threw = false;
try { fromForm("rand", "-1"); } catch { threw = true; }
eq(threw, true, "negative form values rejected");

console.log(`pricing tests: ${passed} assertions passed`);
