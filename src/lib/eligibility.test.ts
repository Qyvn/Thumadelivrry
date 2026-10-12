import {
  basketLineTotal,
  computeOrderTotals,
  isAddressInServiceArea,
  meetsMinimumOrder,
} from "./eligibility";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const boundary = JSON.stringify({
  allowedSuburbs: ["cornubia", "cornubia flats"],
});

assert(
  isAddressInServiceArea(
    { line1: "Cornubia Flats", suburb: "Cornubia", building: "Block A", unitNumber: "12" },
    boundary,
  ),
  "Cornubia address should be eligible",
);

assert(
  !isAddressInServiceArea(
    { line1: "Main Road", suburb: "Durban Central", city: "Durban" },
    boundary,
  ),
  "Durban Central must be outside Cornubia Flats zone",
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

let threw = false;
try {
  computeOrderTotals({
    itemTotalCents: 100,
    deliveryFeeCents: 0,
    serviceFeeCents: 0,
    discountCents: 200,
  });
} catch {
  threw = true;
}
assert(threw, "discount cannot exceed payable amount");

assert(!meetsMinimumOrder(19999, 20000).ok, "R199.99 fails R200 minimum");
assert(meetsMinimumOrder(20000, 20000).ok, "R200 meets minimum");
assert(meetsMinimumOrder(15000, 20000).shortfallCents === 5000, "shortfall R50");

console.log("eligibility.test.ts: all assertions passed");
