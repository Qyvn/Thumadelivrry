/**
 * Browser e2e (Playwright): apply -> admin approves -> merchant logs in, adds a product
 * (form + CSV) -> product shows to customers on the shop page.
 * Needs a running app: THUMA_URL (default http://localhost:3456) on a seeded DB.
 * Screenshots: SHOTS_DIR (default ./screenshots) onboarding-*.png, mobile + desktop.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.THUMA_URL || "http://localhost:3456";
const OUT = process.env.SHOTS_DIR || path.resolve("screenshots");
const PASSWORD = "thuma-demo-2026";
fs.mkdirSync(OUT, { recursive: true });

const tag = Date.now().toString(36);
const biz = `E2E Test Kitchen ${tag}`;
const email = `e2e-${tag}@test.invalid`;
const productName = `E2E Bunny Chow ${tag}`;
// 1x1 PNG
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const imgFile = path.join("/tmp", `e2e-${tag}.png`);
fs.writeFileSync(imgFile, png);
const csvFile = path.join("/tmp", `e2e-${tag}.csv`);
fs.writeFileSync(csvFile, `name,price,description,available,aisle\n"E2E Samoosas ${tag}",20.00,"Mince, 4 pack",yes,food\n`);

const VIEWPORTS = { mobile: { width: 390, height: 844 }, desktop: { width: 1366, height: 900 } };
let failures = 0;
const check = (cond, msg) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`);
  if (!cond) failures++;
};

const browser = await chromium.launch({ headless: true });
async function ctx(vp) {
  const c = await browser.newContext({ viewport: VIEWPORTS[vp] });
  const p = await c.newPage();
  p.setDefaultTimeout(20000);
  return { c, p };
}
async function shot(page, name, vp) {
  await page.screenshot({ path: path.join(OUT, `onboarding-${name}-${vp}.png`), fullPage: true });
}
async function login(page, user, pw = PASSWORD) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", user);
  await page.fill("#password", pw);
  await page.getByRole("button", { name: /Log in/i }).click();
  await page.waitForURL((u) => !u.pathname.includes("/login"));
}

try {
  // 1. Apply (mobile)
  {
    const { c, p } = await ctx("mobile");
    await p.goto(`${BASE}/merchant/apply`, { waitUntil: "networkidle" });
    await shot(p, "01-apply-form", "mobile");
    // Validation: submit empty
    await p.getByRole("button", { name: /Submit for review/ }).click();
    await p.getByText("Please fix the highlighted fields").waitFor();
    check(await p.getByText("Enter a valid SA phone number").isVisible(), "empty application shows validation errors");
    await shot(p, "02-apply-validation", "mobile");
    await p.fill("input[name=businessName]", biz);
    await p.fill("input[name=ownerName]", "E2E Owner");
    await p.fill("input[name=contactPhone]", "082 123 4567");
    await p.fill("input[name=whatsappPhone]", "0821234567");
    await p.fill("input[name=contactEmail]", email);
    await p.fill("input[name=password]", "e2e-pass-123");
    await p.fill("input[name=passwordConfirm]", "e2e-pass-123");
    await p.selectOption("select[name=pricingCategory]", "FOOD");
    await p.check("input[name=isIndependent][value=yes]");
    await p.fill("input[name=addressLine1]", "1 Test Road");
    await p.fill("input[name=suburb]", "Cornubia");
    await p.fill("input[name=latitude]", "-29.6740");
    await p.fill("input[name=longitude]", "31.0740");
    await p.check("input[name=hours_sun_closed]");
    await p.setInputFiles("input[name=logo]", imgFile);
    await p.getByRole("button", { name: /Submit for review/ }).click();
    await p.getByText("Application submitted for review.").waitFor();
    check(true, "application submitted");
    await shot(p, "03-apply-submitted", "mobile");
    await c.close();
  }

  // 2. Merchant cannot log in before approval
  {
    const { c, p } = await ctx("mobile");
    await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await p.fill("#email", email);
    await p.fill("#password", "e2e-pass-123");
    await p.getByRole("button", { name: /Log in/i }).click();
    await p.waitForTimeout(1500);
    check(p.url().includes("/login"), "applicant cannot log in before approval");
    await c.close();
  }

  // 3. Admin approves (desktop)
  {
    const { c, p } = await ctx("desktop");
    await login(p, "admin@thuma.local");
    await p.goto(`${BASE}/admin/merchants`, { waitUntil: "networkidle" });
    const card = p.getByTestId("application").filter({ hasText: biz });
    check(await card.isVisible(), "application in admin review queue");
    check(await card.getByText(/intro commission 12\.0% for 3 months/).isVisible(), "intro rate preview shown");
    await shot(p, "04-admin-review-queue", "desktop");
    await card.locator("textarea[name=notes]").fill("Verified by phone (e2e)");
    await card.getByRole("button", { name: "Approve" }).click();
    await p.getByText(`Approved ${biz}`).waitFor();
    const row = p.locator("tr", { hasText: biz });
    check(await row.getByText("12.0%").isVisible(), "approved merchant shows 12% intro rate in effect");
    await shot(p, "05-admin-merchants-earnings", "desktop");
    // Peak windows
    await p.goto(`${BASE}/admin/settings/pricing#peak`, { waitUntil: "networkidle" });
    await p.locator("#peak input[name=days][value='5']").check();
    await p.locator("#peak input[name=start]").fill("17:00");
    await p.locator("#peak input[name=end]").fill("20:00");
    await p.getByRole("button", { name: "Add window" }).click();
    await p.getByText("Fri 17:00–20:00").waitFor();
    check(true, "peak window added");
    await p.locator("#peak").scrollIntoViewIfNeeded();
    await p.screenshot({ path: path.join(OUT, "onboarding-06-peak-windows-desktop.png") });
    // remove it again so other tests aren't affected
    await p.locator("#peak li", { hasText: "Fri 17:00–20:00" }).getByRole("button", { name: "Remove" }).click();
    await p.waitForLoadState("networkidle");
    await c.close();
  }

  // 4. Merchant adds products (mobile + desktop screenshot)
  let shopUrl;
  {
    const { c, p } = await ctx("mobile");
    await login(p, email, "e2e-pass-123");
    check(new URL(p.url()).pathname === "/merchant", "approved merchant lands on merchant dashboard");
    await p.goto(`${BASE}/merchant/catalogue`, { waitUntil: "networkidle" });
    check(await p.getByText("Set up your menu").isVisible(), "first-run menu setup shown");
    await shot(p, "07-catalogue-empty", "mobile");
    const tpl = await p.request.get(`${BASE}/merchant/catalogue/template.csv`);
    check(tpl.ok() && (await tpl.text()).startsWith("name,price"), "CSV template downloadable");
    const form = p.locator("form", { has: p.getByRole("button", { name: "Add product" }) });
    await form.locator("input[name=price]").fill("abc");
    await form.locator("input[name=name]").fill(productName);
    await form.getByRole("button", { name: "Add product" }).click();
    await p.getByText(/Invalid price/).waitFor();
    check(true, "invalid price rejected");
    await form.locator("input[name=name]").fill(productName);
    await form.locator("input[name=price]").fill("65.00");
    await form.locator("input[name=description]").fill("Quarter chicken bunny");
    await form.locator("input[name=image]").setInputFiles(imgFile);
    await form.getByRole("button", { name: "Add product" }).click();
    await p.getByText("Product saved").waitFor();
    await p.locator("input[name=csv]").setInputFiles(csvFile);
    await p.getByRole("button", { name: "Upload CSV" }).click();
    await p.getByText("Imported: 1 new, 0 updated").waitFor();
    check(true, "product added via form and CSV");
    await shot(p, "08-catalogue-products", "mobile");
    shopUrl = await p.getByRole("link", { name: /View your shop/ }).getAttribute("href");
    const d = await browser.newContext({ viewport: VIEWPORTS.desktop, storageState: await c.storageState() });
    const dp = await d.newPage();
    await dp.goto(`${BASE}/merchant/catalogue`, { waitUntil: "networkidle" });
    await shot(dp, "08-catalogue-products", "desktop");
    // Access control: merchant cannot open admin
    await dp.goto(`${BASE}/admin/merchants`, { waitUntil: "networkidle" });
    check(!new URL(dp.url()).pathname.startsWith("/admin"), "merchant cannot open admin pages");
    await d.close();
    await c.close();
  }

  // 5. Customer sees the product
  for (const vp of ["mobile", "desktop"]) {
    const { c, p } = await ctx(vp);
    await login(p, "customer@thuma.local");
    await p.goto(`${BASE}${shopUrl}`, { waitUntil: "networkidle" });
    check(await p.getByText(productName).first().isVisible(), `customer sees new product on shop page (${vp})`);
    check(await p.getByText(`E2E Samoosas ${tag}`).first().isVisible(), `customer sees CSV product (${vp})`);
    await shot(p, "09-customer-shop", vp);
    if (vp === "desktop") {
      await p.goto(`${BASE}/merchant/apply`, { waitUntil: "networkidle" });
      await shot(p, "01-apply-form", "desktop");
      await p.goto(`${BASE}/merchant/catalogue`, { waitUntil: "networkidle" });
      check(!(await p.getByText("Add a product").isVisible().catch(() => false)), "customer cannot open merchant catalogue");
    }
    await c.close();
  }
} catch (e) {
  failures++;
  console.error("FAIL  exception:", e);
} finally {
  await browser.close();
}
console.log(failures ? `onboarding e2e: ${failures} failure(s)` : "onboarding e2e: all passed");
process.exit(failures ? 1 : 0);
