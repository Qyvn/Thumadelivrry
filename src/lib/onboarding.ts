/**
 * Merchant onboarding — pure validation helpers (no DB). Used by the public application
 * form, the admin review queue and the merchant catalogue editor / CSV import.
 */
import { z } from "zod";
import type { PricingCategory } from "./pricing";

export const HOUR_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type HoursMap = Partial<Record<(typeof HOUR_DAYS)[number], { open: string; close: string }>>;

export const MERCHANT_CATEGORIES: { value: PricingCategory; label: string }[] = [
  { value: "FOOD", label: "Restaurant / takeaway" },
  { value: "GROCERY", label: "Grocery / spaza / convenience" },
  { value: "RETAIL", label: "Retail (non-food)" },
];

/** SA mobile/landline: 0XXXXXXXXX or +27XXXXXXXXX (spaces/dashes allowed). */
export function normaliseSaPhone(raw: string): string | null {
  const digits = raw.replace(/[\s\-()]/g, "");
  if (/^0\d{9}$/.test(digits)) return `+27${digits.slice(1)}`;
  if (/^\+27\d{9}$/.test(digits)) return digits;
  if (/^27\d{9}$/.test(digits)) return `+${digits}`;
  return null;
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const phone = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const n = normaliseSaPhone(v);
    if (!n) ctx.addIssue({ code: "custom", message: "Enter a valid SA phone number (e.g. 082 123 4567)" });
    return n ?? v;
  });

export const applicationSchema = z
  .object({
    businessName: z.string().trim().min(2, "Business name is required").max(120),
    ownerName: z.string().trim().min(2, "Owner name is required").max(120),
    contactPhone: phone,
    whatsappPhone: z
      .string()
      .trim()
      .optional()
      .transform((v, ctx) => {
        if (!v) return undefined;
        const n = normaliseSaPhone(v);
        if (!n) ctx.addIssue({ code: "custom", message: "Enter a valid WhatsApp number" });
        return n ?? v;
      }),
    contactEmail: z.string().trim().toLowerCase().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters").max(200),
    pricingCategory: z.enum(["FOOD", "GROCERY", "RETAIL"], {
      errorMap: () => ({ message: "Choose a category" }),
    }),
    isIndependent: z.enum(["yes", "no"], { errorMap: () => ({ message: "Say whether you are independent" }) }),
    addressLine1: z.string().trim().min(3, "Street address is required").max(200),
    suburb: z.string().trim().min(2, "Suburb is required").max(80),
    city: z.string().trim().min(2, "City is required").max(80),
    latitude: z.coerce.number({ invalid_type_error: "Set the map pin (latitude)" }).min(-35.5).max(-21.5),
    longitude: z.coerce.number({ invalid_type_error: "Set the map pin (longitude)" }).min(16).max(33.5),
    notes: z.string().trim().max(1000).optional(),
  })
  .transform((v) => ({ ...v, isIndependent: v.isIndependent === "yes" }));

export type ApplicationInput = z.infer<typeof applicationSchema>;

/** Read opening hours from form fields hours_<day>_open / hours_<day>_close / hours_<day>_closed. */
export function parseHoursForm(get: (k: string) => string | null): HoursMap {
  const out: HoursMap = {};
  for (const d of HOUR_DAYS) {
    if (get(`hours_${d}_closed`)) continue;
    const open = (get(`hours_${d}_open`) ?? "").trim();
    const close = (get(`hours_${d}_close`) ?? "").trim();
    if (!open && !close) continue;
    if (!HHMM.test(open) || !HHMM.test(close)) throw new Error(`Opening hours for ${d}: use HH:MM`);
    if (open === close) throw new Error(`Opening hours for ${d}: open and close must differ`);
    out[d] = { open, close };
  }
  if (Object.keys(out).length === 0) throw new Error("Add opening hours for at least one day");
  return out;
}

export const MAX_IMAGE_BYTES = 300 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

/** Validate an uploaded image and return a data: URL (stored inline; no external storage needed). */
export function imageToDataUrl(file: { type: string; size: number }, bytes: Buffer): string {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("Image must be PNG, JPEG or WebP");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Image must be 300 KB or smaller");
  return `data:${file.type};base64,${bytes.toString("base64")}`;
}

/** Rand string ("45", "45.50", "R45,50") -> integer cents. */
export function randToCents(raw: string): number {
  const cleaned = raw.trim().replace(/^R\s*/i, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) throw new Error(`Invalid price "${raw}"`);
  const cents = Math.round(Number(cleaned) * 100);
  if (cents <= 0) throw new Error("Price must be more than R0");
  if (cents > 10_000_000) throw new Error("Price too high");
  return cents;
}

export const productSchema = z.object({
  name: z.string().trim().min(2, "Product name is required").max(120),
  priceCents: z.number().int().positive(),
  description: z.string().trim().max(500).optional(),
  isAvailable: z.boolean(),
  browseCategory: z.enum(["groceries", "food", "drinks", "household", "personal-care", "local"]),
});
export type ProductInput = z.infer<typeof productSchema>;

export function defaultBrowseCategory(category: PricingCategory): ProductInput["browseCategory"] {
  return category === "FOOD" ? "food" : category === "GROCERY" ? "groceries" : "local";
}

export const CSV_HEADERS = ["name", "price", "description", "available", "aisle"] as const;
export const CSV_TEMPLATE =
  CSV_HEADERS.join(",") +
  "\n" +
  '"Example: Chicken bunny chow (quarter)",65.00,"Replace these example rows with your real products",yes,food\n' +
  '"Example: 2L Coke",32.99,,no,drinks\n';

/** Minimal RFC-4180 CSV parser (quoted fields, escaped quotes, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

export type CsvImportResult = { products: ProductInput[]; errors: string[] };

export function parseProductCsv(text: string, category: PricingCategory): CsvImportResult {
  const rows = parseCsv(text);
  const errors: string[] = [];
  const products: ProductInput[] = [];
  if (rows.length === 0) return { products, errors: ["CSV is empty"] };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (h: string) => header.indexOf(h);
  if (idx("name") < 0 || idx("price") < 0) {
    return { products, errors: ["CSV header must include at least: name,price (download the template)"] };
  }
  if (rows.length > 501) return { products, errors: ["Maximum 500 products per upload"] };
  rows.slice(1).forEach((r, i) => {
    const line = i + 2;
    const cell = (h: string) => (idx(h) >= 0 ? (r[idx(h)] ?? "").trim() : "");
    try {
      const avail = cell("available").toLowerCase();
      if (avail && !["yes", "no", "true", "false", "1", "0", "y", "n"].includes(avail)) {
        throw new Error(`available must be yes/no`);
      }
      const parsed = productSchema.safeParse({
        name: cell("name"),
        priceCents: randToCents(cell("price")),
        description: cell("description") || undefined,
        isAvailable: avail === "" || ["yes", "true", "1", "y"].includes(avail),
        browseCategory: cell("aisle") || defaultBrowseCategory(category),
      });
      if (!parsed.success) throw new Error(parsed.error.issues.map((x) => x.message).join("; "));
      products.push(parsed.data);
    } catch (e) {
      errors.push(`Row ${line}: ${(e as Error).message}`);
    }
  });
  return { products, errors };
}

/** End of an intro-rate window (start + N months). */
export function introRateEndsAt(start: Date, months: number): Date {
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  return end;
}
