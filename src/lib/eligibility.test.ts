import {
  basketLineTotal,
  computeOrderTotals,
  isAddressInServiceArea,
  meetsMinimumOrder,
} from "./eligibility";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const durbanBoundary = JSON.stringify({
  type: "radius",
  center: { lat: -29.8587, lng: 31.0218 },
  radiusKm: 40,
  allowedCities: ["durban", "umhlanga", "cornubia", "pinetown"],
});

assert(
  isAddressInServiceArea(
    {
      line1: "Sample street",
      suburb: "Cornubia",
      city: "Umhlanga",
      building: "Block A",
      unitNumber: "12",
      latitude: -29.7005,
      longitude: 31.0685,
    },
    durbanBoundary,
  ),
  "Cornubia pin should be inside Greater Durban radius",
);

assert(
  isAddressInServiceArea(
    { line1: "Florida Road", suburb: "Morningside", city: "Durban" },
    durbanBoundary,
  ),
  "Durban Central text should be eligible via city allowlist",
);

assert(
  !isAddressInServiceArea(
    {
      line1: "Church Street",
      suburb: "CBD",
      city: "Pietermaritzburg",
      latitude: -29.6009,
      longitude: 30.3796,
    },
    durbanBoundary,
  ),
  "Pietermaritzburg pin must be outside 40 km Durban radius",
);

assert(basketLineTotal(1899, 3) === 5697, "line total");
assert(
  computeOrderTotals({
    itemTotalCents: 5000,
    deliveryFeeCents: 2500,
    serviceFeeCents: 500,
  }).totalCents === 8000,
  "order total",
);

const under = meetsMinimumOrder(6500, 20000);
assert(!under.ok && under.shortfallCents === 13500, "under minimum");
const okMin = meetsMinimumOrder(20000, 20000);
assert(okMin.ok && okMin.shortfallCents === 0, "meets minimum");

console.log("eligibility.test.ts: all assertions passed");
