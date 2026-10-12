import {
  basketLineTotal,
  computeOrderTotals,
  isAddressInServiceArea,
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

console.log("eligibility.test.ts: all assertions passed");
