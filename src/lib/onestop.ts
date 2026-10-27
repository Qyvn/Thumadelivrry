/** Duban one-stop: Hidden Gems + Stays helpers. No invented listings. */

import { z } from "zod";
import { slugify } from "@/lib/utils";

export const WHATSAPP_E164 = "27645527661";
export const WHATSAPP_DISPLAY = "+27 64 552 7661";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_E164}`;

export function enquiryWhatsAppUrl(message: string): string {
  return `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
}

export const GEM_CATEGORIES = [
  { code: "BEACH", label: "Beach & coast" },
  { code: "FOOD", label: "Food & drink" },
  { code: "NATURE", label: "Nature & outdoors" },
  { code: "CULTURE", label: "Culture & history" },
  { code: "NIGHTLIFE", label: "Nightlife" },
  { code: "SHOPPING", label: "Markets & shopping" },
  { code: "OTHER", label: "Other" },
] as const;
export type GemCategory = (typeof GEM_CATEGORIES)[number]["code"];

export const HOME_LISTING_TYPES = [
  { code: "SHORT_STAY", label: "Short stay (nightly)" },
  { code: "LONG_TERM", label: "Long-term rental (monthly)" },
] as const;
export type HomeListingType = (typeof HOME_LISTING_TYPES)[number]["code"];

export const HOME_PROPERTY_TYPES = [
  { code: "HOTEL", label: "Hotel" },
  { code: "GUESTHOUSE", label: "Guesthouse" },
  { code: "BNB", label: "B&B" },
  { code: "HOLIDAY_HOME", label: "Holiday home" },
  { code: "MONTHLY_RENTAL", label: "Monthly rental" },
] as const;
export type HomePropertyType = (typeof HOME_PROPERTY_TYPES)[number]["code"];

/** Derive SHORT_STAY vs LONG_TERM from the stay property type. */
export function listingTypeForProperty(propertyType: string): HomeListingType {
  return propertyType === "MONTHLY_RENTAL" ? "LONG_TERM" : "SHORT_STAY";
}

export function isHotelProperty(propertyType: string): boolean {
  return propertyType === "HOTEL";
}

export const COMMON_AMENITIES = [
  "Wifi",
  "Parking",
  "Pool",
  "Air conditioning",
  "Kitchen",
  "Washer",
  "TV",
  "Workspace",
  "Pet friendly",
  "Garden",
  "Security",
  "Backup power",
] as const;

export const ListingStatus = {
  PENDING_REVIEW: "PENDING_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  SUSPENDED: "SUSPENDED",
} as const;
export type ListingStatus = (typeof ListingStatus)[keyof typeof ListingStatus];

const phoneOk = z
  .string()
  .trim()
  .min(7, "Phone is required")
  .max(32);

export const gemSubmitSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(20).max(2000),
  category: z.enum([
    "BEACH",
    "FOOD",
    "NATURE",
    "CULTURE",
    "NIGHTLIFE",
    "SHOPPING",
    "OTHER",
  ]),
  area: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80).default("Durban"),
  addressHint: z.string().trim().max(200).optional().or(z.literal("")),
  tipNote: z.string().trim().max(500).optional().or(z.literal("")),
  submitterName: z.string().trim().min(2).max(120),
  submitterPhone: phoneOk.optional().or(z.literal("")),
  submitterEmail: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal("")),
});

export const homeSubmitSchema = z
  .object({
    title: z.string().trim().min(5).max(140),
    description: z.string().trim().min(40).max(4000),
    propertyType: z.enum([
      "HOTEL",
      "GUESTHOUSE",
      "BNB",
      "HOLIDAY_HOME",
      "MONTHLY_RENTAL",
    ]),
    area: z.string().trim().min(2).max(80),
    city: z.string().trim().min(2).max(80).default("Durban"),
    addressHint: z.string().trim().max(200).optional().or(z.literal("")),
    bedrooms: z.coerce.number().int().min(0).max(20),
    bathrooms: z.coerce.number().int().min(1).max(20),
    beds: z.coerce.number().int().min(0).max(40).optional().or(z.nan()).transform((v) => (Number.isNaN(v) ? undefined : v)),
    maxGuests: z.coerce.number().int().min(1).max(40).optional().or(z.nan()).transform((v) => (Number.isNaN(v) ? undefined : v)),
    nightlyPriceRand: z.string().trim().optional().or(z.literal("")),
    monthlyPriceRand: z.string().trim().optional().or(z.literal("")),
    minNights: z.coerce.number().int().min(1).max(90).optional().or(z.nan()).transform((v) => (Number.isNaN(v) ? undefined : v)),
    checkInFrom: z.string().trim().max(10).optional().or(z.literal("")),
    checkOutBy: z.string().trim().max(10).optional().or(z.literal("")),
    hotelRoomTypesNote: z.string().trim().max(800).optional().or(z.literal("")),
    websiteUrl: z
      .string()
      .trim()
      .url()
      .max(300)
      .optional()
      .or(z.literal("")),
    amenities: z.array(z.string()).max(40).optional(),
    hostName: z.string().trim().min(2).max(120),
    hostPhone: phoneOk,
    hostEmail: z.string().trim().email().optional().or(z.literal("")),
    hostBio: z.string().trim().max(800).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const listingType = listingTypeForProperty(data.propertyType);
    if (listingType === "SHORT_STAY") {
      const n = parseRandToCents(data.nightlyPriceRand ?? "");
      if (n == null || n < 10000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nightlyPriceRand"],
          message: "Nightly price required (min R100)",
        });
      }
      if (!data.maxGuests && data.propertyType !== "HOTEL") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["maxGuests"],
          message: "Max guests required for short stays",
        });
      }
    } else {
      const m = parseRandToCents(data.monthlyPriceRand ?? "");
      if (m == null || m < 100000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["monthlyPriceRand"],
          message: "Monthly rent required (min R1 000)",
        });
      }
    }
    if (data.propertyType === "HOTEL" && !(data.hotelRoomTypesNote || "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hotelRoomTypesNote"],
        message: "Add a short note about room types",
      });
    }
  });

export function parseRandToCents(raw: string): number | null {
  let cleaned = raw.replace(/R/gi, "").replace(/\u00a0/g, " ").trim();
  if (!cleaned) return null;
  // Allow "1 250,50" or "1250.50" or "1250"
  cleaned = cleaned.replace(/\s/g, "");
  if (cleaned.includes(",") && cleaned.includes(".")) {
    // Assume comma = thousands, dot = decimal
    cleaned = cleaned.replace(/,/g, "");
  } else if (cleaned.includes(",")) {
    // Comma as decimal separator
    cleaned = cleaned.replace(/,/g, ".");
  }
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function uniqueSlug(base: string, salt?: string): string {
  const s = slugify(base) || "listing";
  const tail = (salt ?? Math.random().toString(36).slice(2, 8)).toLowerCase();
  return `${s}-${tail}`;
}

export function parseAmenitiesJson(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function parsePhotosJson(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.length > 0) : [];
  } catch {
    return [];
  }
}

export function gemCategoryLabel(code: string): string {
  return GEM_CATEGORIES.find((c) => c.code === code)?.label ?? code;
}

export function listingTypeLabel(code: string): string {
  return HOME_LISTING_TYPES.find((c) => c.code === code)?.label ?? code;
}

export function propertyTypeLabel(code: string): string {
  return HOME_PROPERTY_TYPES.find((c) => c.code === code)?.label ?? code;
}

export function homeEnquiryMessage(listing: {
  title: string;
  listingType: string;
  area: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}): string {
  const bits = [
    `Hi Duban — I'd like to enquire about "${listing.title}" (${listing.listingType === "SHORT_STAY" ? "short stay" : "long-term"}) in ${listing.area}.`,
  ];
  if (listing.listingType === "SHORT_STAY") {
    if (listing.checkIn) bits.push(`Check-in: ${listing.checkIn}`);
    if (listing.checkOut) bits.push(`Check-out: ${listing.checkOut}`);
    if (listing.guests) bits.push(`Guests: ${listing.guests}`);
  }
  bits.push("This is an enquiry only — no payment via Duban.");
  return bits.join("\n");
}

export function gemEnquiryMessage(gem: { name: string; area: string }): string {
  return `Hi Duban — I'd like to know more about the hidden gem "${gem.name}" in ${gem.area}.`;
}
