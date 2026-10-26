/**
 * Merchant onboarding service (DB). Server actions call these; scripts/onboarding-flow.test.ts
 * exercises them directly. Access control (who may call) is enforced by the callers via
 * requireUser + merchantForUser.
 */
import bcrypt from "bcryptjs";
import { writeAudit } from "./audit";
import { prisma } from "./db";
import type { ApplicationInput, HoursMap, ProductInput } from "./onboarding";
import { normalisePricingCategory } from "./pricing";
import { slugify } from "./utils";
import { getLaunchZone } from "./zones";

export async function submitApplication(
  input: ApplicationInput,
  extra: { hours: HoursMap; logoDataUrl?: string; actorId?: string | null },
) {
  const pending = await prisma.merchantApplication.findFirst({
    where: { contactEmail: input.contactEmail, status: "PENDING_REVIEW" },
  });
  if (pending) throw new Error("An application with this email is already awaiting review");
  const existingUser = await prisma.user.findUnique({ where: { email: input.contactEmail } });
  if (existingUser && existingUser.role !== "CUSTOMER") {
    throw new Error("This email already has a staff account. Use a different email.");
  }
  const app = await prisma.merchantApplication.create({
    data: {
      businessName: input.businessName,
      contactName: input.ownerName,
      ownerName: input.ownerName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      whatsappPhone: input.whatsappPhone ?? null,
      pricingCategory: input.pricingCategory,
      categoryCodes: input.pricingCategory === "FOOD" ? "EATS" : "MARKET",
      isIndependent: input.isIndependent,
      addressLine1: input.addressLine1,
      suburb: input.suburb,
      city: input.city,
      latitude: input.latitude,
      longitude: input.longitude,
      hoursJson: JSON.stringify(extra.hours),
      logoDataUrl: extra.logoDataUrl ?? null,
      notes: input.notes || null,
      passwordHash: await bcrypt.hash(input.password, 10),
      status: "PENDING_REVIEW",
    },
  });
  await writeAudit({
    actorId: extra.actorId ?? null,
    entityType: "MERCHANT",
    entityId: app.id,
    action: "MERCHANT_APPLICATION_SUBMITTED",
  });
  return app;
}

export async function approveApplication(params: {
  applicationId: string;
  adminId: string;
  notes?: string;
  now?: Date;
}) {
  const app = await prisma.merchantApplication.findUnique({ where: { id: params.applicationId } });
  if (!app) throw new Error("Application not found");
  if (app.status !== "PENDING_REVIEW") throw new Error(`Application is already ${app.status}`);
  const zone = await getLaunchZone();
  const now = params.now ?? new Date();
  const category = normalisePricingCategory(app.pricingCategory);

  const merchant = await prisma.$transaction(async (tx) => {
    let user = await tx.user.findUnique({ where: { email: app.contactEmail } });
    if (user && user.role !== "CUSTOMER" && user.role !== "MERCHANT_STAFF") {
      throw new Error("Applicant email belongs to a staff account");
    }
    if (!user) {
      user = await tx.user.create({
        data: {
          email: app.contactEmail,
          passwordHash: app.passwordHash ?? (await bcrypt.hash(crypto.randomUUID(), 10)),
          fullName: app.ownerName ?? app.contactName,
          phone: app.contactPhone,
          role: "MERCHANT_STAFF",
        },
      });
    } else if (user.role === "CUSTOMER") {
      user = await tx.user.update({ where: { id: user.id }, data: { role: "MERCHANT_STAFF" } });
    }
    const m = await tx.merchant.create({
      data: {
        applicationId: app.id,
        name: app.businessName,
        slug: slugify(`${app.businessName}-${app.id.slice(-4)}`),
        description: app.notes,
        imageUrl: app.logoDataUrl,
        email: app.contactEmail,
        phone: app.contactPhone,
        status: "APPROVED",
        isDevSample: false,
        addressLine1: app.addressLine1,
        suburb: app.suburb,
        city: app.city,
        latitude: app.latitude,
        longitude: app.longitude,
        hoursJson: app.hoursJson,
        pricingCategory: category,
        isIndependent: app.isIndependent,
        // Intro rate (e.g. 12% for 3 months, per pricing settings) starts on approval for independents
        introRateStartedAt: app.isIndependent ? now : null,
        zoneId: zone?.id,
        staff: { create: { userId: user.id, isOwner: true } },
      },
    });
    await tx.merchantApplication.update({
      where: { id: app.id },
      data: {
        status: "APPROVED",
        reviewNotes: params.notes || null,
        reviewedAt: now,
        reviewedById: params.adminId,
        passwordHash: null, // copied to the user; don't keep a second copy
      },
    });
    return m;
  });
  await writeAudit({
    actorId: params.adminId,
    entityType: "MERCHANT",
    entityId: merchant.id,
    action: "MERCHANT_APPROVED",
    detail: { applicationId: app.id, notes: params.notes ?? null, category, independent: app.isIndependent },
  });
  return merchant;
}

export async function rejectApplication(params: { applicationId: string; adminId: string; notes: string }) {
  if (!params.notes.trim()) throw new Error("Add a note explaining the rejection");
  const app = await prisma.merchantApplication.findUnique({ where: { id: params.applicationId } });
  if (!app) throw new Error("Application not found");
  if (app.status !== "PENDING_REVIEW") throw new Error(`Application is already ${app.status}`);
  await prisma.merchantApplication.update({
    where: { id: app.id },
    data: {
      status: "REJECTED",
      reviewNotes: params.notes.trim(),
      reviewedAt: new Date(),
      reviewedById: params.adminId,
      passwordHash: null,
    },
  });
  await writeAudit({
    actorId: params.adminId,
    entityType: "MERCHANT",
    entityId: app.id,
    action: "MERCHANT_APPLICATION_REJECTED",
    detail: { notes: params.notes.trim() },
  });
}

/** The merchant a user may manage. Merchant staff: only their own. Admin: an explicit id. */
export async function merchantForUser(
  user: { id: string; role: string },
  merchantId?: string | null,
) {
  if (user.role === "ADMIN") {
    if (merchantId) return prisma.merchant.findUnique({ where: { id: merchantId } });
    return null;
  }
  if (user.role !== "MERCHANT_STAFF") return null;
  const staff = await prisma.merchantStaff.findFirst({
    where: { userId: user.id, ...(merchantId ? { merchantId } : {}) },
    include: { merchant: true },
  });
  return staff?.merchant ?? null;
}

async function categoryIdFor(pricingCategory: string) {
  const code = normalisePricingCategory(pricingCategory) === "FOOD" ? "EATS" : "MARKET";
  const cat = await prisma.serviceCategory.findUnique({ where: { code } });
  if (!cat) throw new Error(`Service category ${code} missing — run the seed`);
  return cat.id;
}

async function uniqueSlug(merchantId: string, name: string, excludeId?: string) {
  const base = slugify(name) || "product";
  let slug = base;
  for (let i = 2; ; i++) {
    const clash = await prisma.product.findUnique({ where: { merchantId_slug: { merchantId, slug } } });
    if (!clash || clash.id === excludeId) return slug;
    slug = `${base}-${i}`;
  }
}

export async function saveProduct(params: {
  merchant: { id: string; pricingCategory: string };
  productId?: string | null;
  input: ProductInput;
  imageUrl?: string | null; // undefined = keep existing
  actorId: string;
}) {
  const { merchant, input } = params;
  if (params.productId) {
    const existing = await prisma.product.findUnique({ where: { id: params.productId } });
    if (!existing || existing.merchantId !== merchant.id) throw new Error("Product not found");
    const p = await prisma.product.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        slug: await uniqueSlug(merchant.id, input.name, existing.id),
        priceCents: input.priceCents,
        description: input.description ?? null,
        isAvailable: input.isAvailable,
        browseCategory: input.browseCategory,
        ...(params.imageUrl !== undefined ? { imageUrl: params.imageUrl } : {}),
      },
    });
    await writeAudit({ actorId: params.actorId, entityType: "MERCHANT", entityId: merchant.id, action: "PRODUCT_UPDATED", detail: { productId: p.id } });
    return p;
  }
  const count = await prisma.product.count({ where: { merchantId: merchant.id } });
  const p = await prisma.product.create({
    data: {
      merchantId: merchant.id,
      categoryId: await categoryIdFor(merchant.pricingCategory),
      name: input.name,
      slug: await uniqueSlug(merchant.id, input.name),
      priceCents: input.priceCents,
      description: input.description ?? null,
      isAvailable: input.isAvailable,
      browseCategory: input.browseCategory,
      imageUrl: params.imageUrl ?? null,
      isDevSample: false,
      sortOrder: count,
    },
  });
  await writeAudit({ actorId: params.actorId, entityType: "MERCHANT", entityId: merchant.id, action: "PRODUCT_CREATED", detail: { productId: p.id } });
  return p;
}

/** Bulk import: creates new products, updates existing ones matched by name (case-insensitive). */
export async function importProducts(params: {
  merchant: { id: string; pricingCategory: string };
  products: ProductInput[];
  actorId: string;
}) {
  const existing = await prisma.product.findMany({ where: { merchantId: params.merchant.id } });
  const byName = new Map(existing.map((p) => [p.name.toLowerCase(), p.id]));
  let created = 0;
  let updated = 0;
  for (const input of params.products) {
    const id = byName.get(input.name.toLowerCase());
    const p = await saveProduct({ merchant: params.merchant, productId: id, input, actorId: params.actorId });
    byName.set(p.name.toLowerCase(), p.id);
    if (id) updated++;
    else created++;
  }
  return { created, updated };
}
