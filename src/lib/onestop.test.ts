import {
  enquiryWhatsAppUrl,
  gemSubmitSchema,
  homeEnquiryMessage,
  homeSubmitSchema,
  parseAmenitiesJson,
  parsePhotosJson,
  parseRandToCents,
  uniqueSlug,
  WHATSAPP_E164,
} from "./onestop";

let passed = 0;
function eq<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  passed++;
}
function ok(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
  passed++;
}

eq(parseRandToCents("R 1 250,50"), 125050, "rand with nbsp/comma decimal");
eq(parseRandToCents("850"), 85000, "plain rand");
eq(parseRandToCents("1 250"), 125000, "rand with spaces thousands");
eq(parseRandToCents(""), null, "empty rand");
eq(parseRandToCents("abc"), null, "bad rand");

ok(uniqueSlug("Beach Cafe").startsWith("beach-cafe-"), "slug prefix");
eq(parseAmenitiesJson('["Wifi","Pool"]').join(","), "Wifi,Pool", "amenities");
eq(parseAmenitiesJson("not-json").length, 0, "bad amenities");
eq(parsePhotosJson("[]").length, 0, "empty photos");

const gem = gemSubmitSchema.safeParse({
  name: "Real Spot",
  description: "A genuine description that is long enough to pass validation.",
  category: "BEACH",
  area: "Umhlanga",
  city: "Durban",
  submitterName: "Thandi",
});
ok(gem.success, "valid gem");

const badGem = gemSubmitSchema.safeParse({
  name: "x",
  description: "short",
  category: "FAKE",
  area: "A",
  submitterName: "T",
});
ok(!badGem.success, "invalid gem rejected");

const shortStay = homeSubmitSchema.safeParse({
  title: "Sea view flat in Durban North",
  description: "A real two-bedroom apartment near the beach with wifi and parking for guests.",
  listingType: "SHORT_STAY",
  propertyType: "APARTMENT",
  area: "Durban North",
  bedrooms: "2",
  bathrooms: "1",
  maxGuests: "4",
  nightlyPriceRand: "950",
  minNights: "2",
  hostName: "Sipho Host",
  hostPhone: "0821234567",
  amenities: ["Wifi", "Parking"],
});
ok(shortStay.success, "valid short stay");

const longTerm = homeSubmitSchema.safeParse({
  title: "Family house in Westville",
  description: "Three-bedroom long-term rental with garden, suitable for a family relocating to Durban.",
  listingType: "LONG_TERM",
  propertyType: "HOUSE",
  area: "Westville",
  bedrooms: "3",
  bathrooms: "2",
  monthlyPriceRand: "12000",
  hostName: "Lebo Landlord",
  hostPhone: "+27821234567",
});
ok(longTerm.success, "valid long term");

const missingNightly = homeSubmitSchema.safeParse({
  title: "Missing price stay",
  description: "Description long enough for validation but missing the nightly price on purpose.",
  listingType: "SHORT_STAY",
  propertyType: "STUDIO",
  area: "Berea",
  bedrooms: "1",
  bathrooms: "1",
  maxGuests: "2",
  hostName: "Host",
  hostPhone: "0821234567",
});
ok(!missingNightly.success, "short stay needs nightly price");

const msg = homeEnquiryMessage({
  title: "Sea view flat",
  listingType: "SHORT_STAY",
  area: "Durban North",
  checkIn: "2026-11-01",
  checkOut: "2026-11-04",
  guests: 2,
});
ok(msg.includes("enquiry only"), "enquiry disclaimer");
ok(msg.includes("Check-in: 2026-11-01"), "check-in in message");
ok(enquiryWhatsAppUrl("hi").startsWith(`https://wa.me/${WHATSAPP_E164}?text=`), "wa link");

console.log(`onestop.test.ts: ${passed} assertions passed`);
