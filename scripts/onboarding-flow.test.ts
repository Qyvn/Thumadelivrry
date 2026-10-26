/**
 * DB integration test: apply -> reject / approve -> merchant login + access control ->
 * add product + CSV import -> product visible to customers (approved merchant, active product).
 * Runs against the DB from DATABASE_URL / THUMA_USE_TMP_DB. Cleans up after itself.
 */
import { prisma } from "../src/lib/db";
import {
  approveApplication,
  importProducts,
  merchantForUser,
  rejectApplication,
  saveProduct,
  submitApplication,
} from "../src/lib/merchant-onboarding";
import { applicationSchema, parseProductCsv } from "../src/lib/onboarding";
import { commissionBps, normalisePricingCategory } from "../src/lib/pricing";
import { loadPricingConfig } from "../src/lib/pricing-server";
import bcrypt from "bcryptjs";

let passed = 0;
function ok(cond: unknown, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed++;
}
async function rejects(p: Promise<unknown>, msg: string) {
  let t = false;
  try { await p; } catch { t = true; }
  ok(t, msg);
}

const tag = Date.now().toString(36);
const email = `onboard-${tag}@test.invalid`;
const rejEmail = `onboard-rej-${tag}@test.invalid`;

function input(e: string, name: string) {
  const r = applicationSchema.safeParse({
    businessName: name, ownerName: "Test Owner", contactPhone: "0821234567", contactEmail: e,
    password: "test-pass-123", pricingCategory: "FOOD", isIndependent: "yes",
    addressLine1: "1 Test Rd", suburb: "Cornubia", city: "Durban", latitude: "-29.674", longitude: "31.074",
  });
  if (!r.success) throw new Error(r.error.message);
  return r.data;
}

async function main() {
  const admin = await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } });
  const hours = { mon: { open: "08:00", close: "17:00" } };

  // Reject path
  const rej = await submitApplication(input(rejEmail, `TEST Reject ${tag}`), { hours });
  await rejects(rejectApplication({ applicationId: rej.id, adminId: admin.id, notes: " " }), "reject requires notes");
  await rejectApplication({ applicationId: rej.id, adminId: admin.id, notes: "Outside service area" });
  const rejRow = await prisma.merchantApplication.findUniqueOrThrow({ where: { id: rej.id } });
  ok(rejRow.status === "REJECTED" && rejRow.reviewNotes === "Outside service area", "rejected with notes");
  ok(rejRow.passwordHash === null, "password hash cleared on reject");
  ok(!(await prisma.user.findUnique({ where: { email: rejEmail } })), "no user created on reject");

  // Apply + approve path
  const app = await submitApplication(input(email, `TEST Kitchen ${tag}`), { hours });
  await rejects(submitApplication(input(email, "dup"), { hours }), "duplicate pending application blocked");
  ok(app.status === "PENDING_REVIEW", "pending after submit");
  const now = new Date("2026-10-26T10:00:00Z");
  const merchant = await approveApplication({ applicationId: app.id, adminId: admin.id, notes: "Looks good", now });
  await rejects(approveApplication({ applicationId: app.id, adminId: admin.id }), "cannot approve twice");
  ok(merchant.status === "APPROVED" && !merchant.isDevSample, "merchant approved, not dev sample");
  ok(merchant.pricingCategory === "FOOD" && merchant.isIndependent, "category + independent copied");
  ok(merchant.introRateStartedAt?.getTime() === now.getTime(), "intro rate starts on approval");
  ok(merchant.latitude === -29.674 && merchant.hoursJson?.includes("08:00"), "pin + hours copied");
  const cfg = await loadPricingConfig();
  const rate = commissionBps({ category: normalisePricingCategory(merchant.pricingCategory), isIndependent: true, introRateStartedAt: merchant.introRateStartedAt, now: new Date("2026-11-15"), config: cfg });
  ok(rate.reason === "INTRO_INDEPENDENT" && rate.bps === cfg.introCommissionBps, "intro rate in effect");

  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  ok(user.role === "MERCHANT_STAFF", "merchant user created");
  ok(await bcrypt.compare("test-pass-123", user.passwordHash), "applicant password works for login");

  // Access control
  ok((await merchantForUser(user))?.id === merchant.id, "staff sees own merchant");
  const other = await prisma.merchant.findFirstOrThrow({ where: { id: { not: merchant.id } } });
  ok((await merchantForUser(user, other.id)) === null, "staff cannot open another merchant");
  const customer = await prisma.user.findFirstOrThrow({ where: { role: "CUSTOMER" } });
  ok((await merchantForUser(customer, merchant.id)) === null, "customer cannot manage merchant");
  ok((await merchantForUser(admin, merchant.id))?.id === merchant.id, "admin can open merchant by id");

  // Not visible to customers until products exist; then visible
  const visibleBefore = await prisma.product.count({ where: { merchantId: merchant.id, isActive: true, merchant: { status: "APPROVED" } } });
  ok(visibleBefore === 0, "no products before setup");
  const p = await saveProduct({ merchant, input: { name: "Bunny chow (test)", priceCents: 6500, isAvailable: true, browseCategory: "food" }, actorId: user.id });
  await rejects(saveProduct({ merchant: other, productId: p.id, input: { name: "hijack", priceCents: 1, isAvailable: true, browseCategory: "food" }, actorId: user.id }), "cannot edit product via another merchant");
  await saveProduct({ merchant, productId: p.id, input: { name: "Bunny chow (test)", priceCents: 7000, description: "Quarter", isAvailable: true, browseCategory: "food" }, actorId: user.id });
  const csv = parseProductCsv("name,price,available\nBunny chow (test),75,yes\nSamoosas (test),20,no\n", "FOOD");
  ok(csv.errors.length === 0, "csv ok");
  const r = await importProducts({ merchant, products: csv.products, actorId: user.id });
  ok(r.created === 1 && r.updated === 1, "csv created 1 updated 1");
  const visible = await prisma.product.findMany({ where: { merchantId: merchant.id, isActive: true, merchant: { status: "APPROVED" } } });
  ok(visible.length === 2, "products visible to customers");
  ok(visible.find((v) => v.name === "Bunny chow (test)")?.priceCents === 7500, "csv updated price");

  // Cleanup
  await prisma.product.deleteMany({ where: { merchantId: merchant.id } });
  await prisma.merchant.delete({ where: { id: merchant.id } });
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.merchantApplication.deleteMany({ where: { id: { in: [app.id, rej.id] } } });
  console.log(`onboarding flow tests: ${passed} assertions passed`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
