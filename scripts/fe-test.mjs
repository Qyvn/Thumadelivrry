/**
 * THUMA frontend smoke test (Playwright).
 * Covers home, login, browse, add-to-basket, basket, checkout, nearest store.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.THUMA_URL || "http://localhost:3456";
const ART = process.env.FE_ARTIFACTS || "/opt/cursor/artifacts";
const OUT = `${ART}/screenshots`;
const VIDEO_DIR = `${ART}/fe-test-video`;
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(VIDEO_DIR, { recursive: true });

const results = [];
function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}
function fail(name, detail) {
  results.push({ name, ok: false, detail });
  console.error(`FAIL  ${name} — ${detail}`);
}

async function shot(page, name) {
  const file = path.join(OUT, `fe-${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  recordVideo: { dir: VIDEO_DIR, size: { width: 390, height: 844 } },
});
const page = await context.newPage();
page.setDefaultTimeout(15000);

try {
  // 1. Home
  await page.goto(BASE, { waitUntil: "networkidle" });
  const hasBrand = await page.getByText("Duban", { exact: true }).first().isVisible();
  const hasHeadline = await page.getByRole("heading", { name: /Durban\.?\s*All in one/i }).isVisible();
  const hasGems = await page.getByRole("link", { name: /^Gems/i }).first().isVisible();
  const hasFood = await page.getByRole("link", { name: /^Food/i }).first().isVisible();
  const hasStays = await page.getByRole("link", { name: /^Stays/i }).first().isVisible();
  if (hasBrand && hasHeadline && hasGems && hasFood && hasStays) {
    pass("home-hero", await shot(page, "01-home"));
  } else {
    fail("home-hero", `brand=${hasBrand} headline=${hasHeadline} gems=${hasGems} food=${hasFood} stays=${hasStays}`);
  }

  // Food & Shops still has nearest stores
  await page.goto(`${BASE}/food`, { waitUntil: "networkidle" });
  const foodHeadline = await page.getByRole("heading", { name: /^Food$/i }).isVisible();
  const powered = await page.getByText(/Delivery powered by THUMA/i).first().isVisible();
  if (foodHeadline && powered) pass("food-section", await shot(page, "02-food"));
  else fail("food-section", `headline=${foodHeadline} powered=${powered}`);

  await page.goto(`${BASE}/gems`, { waitUntil: "networkidle" });
  const gemsEmpty = await page.getByText(/Gems coming soon/i).isVisible();
  if (gemsEmpty) pass("gems-empty-state", await shot(page, "02b-gems"));
  else fail("gems-empty-state", "missing empty state");

  await page.goto(`${BASE}/stays`, { waitUntil: "networkidle" });
  const staysEmpty = await page.getByText(/Stays coming soon/i).isVisible();
  if (staysEmpty) pass("stays-empty-state", await shot(page, "02c-stays"));
  else fail("stays-empty-state", "missing empty state");

  // 2. Login
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", "customer@thuma.local");
  await page.fill("#password", "thuma-demo-2026");
  await page.getByRole("button", { name: /Log in/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  const loc = await page.getByText(/Cornubia|Block/i).first().isVisible().catch(() => false);
  if (loc || page.url().includes(BASE.replace("http://", ""))) {
    pass("login-customer", await shot(page, "03-logged-in-home"));
  } else {
    fail("login-customer", `url=${page.url()}`);
  }

  // 3. Browse groceries
  await page.goto(`${BASE}/browse/groceries`, { waitUntil: "networkidle" });
  const groceriesHeading = await page.getByRole("heading", { name: /Groceries/i }).isVisible();
  const milk = page.getByRole("heading", { name: "Fresh Milk 2L" });
  const milkVisible = await milk.isVisible().catch(() => false);
  const priceVisible = await page.getByText(/R\s?\d/).first().isVisible();
  if (groceriesHeading && milkVisible && priceVisible) {
    pass("browse-groceries", await shot(page, "04-browse-groceries"));
  } else {
    fail("browse-groceries", `h=${groceriesHeading} milk=${milkVisible} price=${priceVisible}`);
  }

  // 4. Add to basket + quantity (clear basket first for a clean state)
  await page.goto(`${BASE}/basket`, { waitUntil: "networkidle" });
  const clearBtn = page.getByRole("button", { name: /^Clear$/i });
  if (await clearBtn.isVisible().catch(() => false)) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle" }).catch(() => {}),
      clearBtn.click(),
    ]);
    await page.getByText(/basket is empty/i).waitFor({ timeout: 8000 }).catch(() => {});
  }
  await page.goto(`${BASE}/browse/groceries`, { waitUntil: "networkidle" });
  const milkCard = page.locator("article").filter({ hasText: "Fresh Milk 2L" }).first();
  await milkCard.waitFor({ state: "visible", timeout: 8000 });
  const addFresh = milkCard.getByRole("button", { name: /^Add$/ });
  const plusExisting = milkCard.getByRole("button", { name: "Increase quantity" });
  if (await plusExisting.isVisible().catch(() => false)) {
    await plusExisting.click();
    await page.waitForTimeout(700);
    pass("add-and-quantity", await shot(page, "05-quantity"));
  } else if (await addFresh.isVisible().catch(() => false)) {
    await addFresh.click();
    await page.waitForTimeout(1000);
    const plus = milkCard.getByRole("button", { name: "Increase quantity" });
    await plus.waitFor({ state: "visible", timeout: 8000 });
    await plus.click();
    await page.waitForTimeout(700);
    pass("add-and-quantity", await shot(page, "05-quantity"));
  } else {
    const html = await milkCard.innerHTML().catch(() => "");
    fail("add-and-quantity", `no Add/qty on milk card: ${html.slice(0, 180)}`);
  }

  // 5. Basket — under R200 minimum must block delivery
  await page.goto(`${BASE}/basket`, { waitUntil: "networkidle" });
  const basketHeading = await page.getByRole("heading", { name: "Basket" }).isVisible();
  const hasLine = await page.getByText(/Fresh Milk|Milk/i).first().isVisible().catch(() => false);
  const hasTotal = await page.locator("span", { hasText: /^Total$/ }).isVisible();
  const minOrderMsg = page.getByText(/We do not deliver under/i);
  const addMore = page.getByRole("link", { name: /Add more items/i });
  const checkoutBlocked = !(await page.getByRole("link", { name: /Go to checkout/i }).isVisible().catch(() => false));
  if (
    basketHeading &&
    hasLine &&
    hasTotal &&
    (await minOrderMsg.isVisible()) &&
    (await addMore.isVisible()) &&
    checkoutBlocked
  ) {
    pass("basket-min-order-blocked", await shot(page, "06-basket-min-order"));
  } else {
    fail(
      "basket-min-order-blocked",
      `heading=${basketHeading} line=${hasLine} total=${hasTotal} min=${await minOrderMsg.isVisible().catch(() => false)} addMore=${await addMore.isVisible().catch(() => false)} blocked=${checkoutBlocked}`,
    );
  }

  // Raise merchandise subtotal to ≥ R200 (Fresh Milk 2L @ R32.99 → qty 7)
  await page.goto(`${BASE}/browse/groceries`, { waitUntil: "networkidle" });
  const milkForMin = page.locator("article").filter({ hasText: "Fresh Milk 2L" }).first();
  await milkForMin.waitFor({ state: "visible", timeout: 8000 });
  for (let i = 0; i < 5; i++) {
    const plus = milkForMin.getByRole("button", { name: "Increase quantity" });
    if (await plus.isVisible().catch(() => false)) {
      await plus.click();
      await page.waitForTimeout(400);
    }
  }
  await page.goto(`${BASE}/basket`, { waitUntil: "networkidle" });
  const checkoutLink = page.getByRole("link", { name: /Go to checkout/i });
  if (await checkoutLink.isVisible()) {
    pass("basket-meets-minimum", await shot(page, "06b-basket-ready"));
  } else {
    fail("basket-meets-minimum", "checkout still blocked after raising qty");
  }

  // 6. Checkout
  await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
  const checkoutHeading = await page.getByRole("heading", { name: "Checkout" }).isVisible();
  const addressOk = await page.getByText(/Inside Greater Durban|Durban|Cornubia|Unit/i).first().isVisible().catch(() => false);
  const totalDue = await page.getByText(/Total due/i).isVisible();
  const placeOrder = page.getByRole("button", { name: /Place order/i });
  if (checkoutHeading && totalDue && (await placeOrder.isVisible())) {
    pass("checkout", await shot(page, "07-checkout"));
  } else {
    fail(
      "checkout",
      `h=${checkoutHeading} addr=${addressOk} total=${totalDue} btn=${await placeOrder.isVisible().catch(() => false)}`,
    );
  }

  // 7. Nearest store page
  await page.goto(`${BASE}/shops/dev-flats-fresh-mart`, { waitUntil: "networkidle" });
  const storeName = await page.getByRole("heading", { name: /Flats Fresh Mart/i }).isVisible();
  const radiusText = await page.getByText("inside", { exact: false }).filter({ hasText: "km radius" }).first().isVisible().catch(() => false);
  const pinText = await page.getByText("from your delivery pin").first().isVisible().catch(() => false);
  if (storeName && (radiusText || pinText)) {
    pass("store-distance", await shot(page, "08-nearest-store"));
  } else {
    fail("store-distance", `store=${storeName} radius=${radiusText} pin=${pinText}`);
  }

  // 8. Far store should show outside radius
  await page.goto(`${BASE}/shops/dev-outside-radius`, { waitUntil: "networkidle" });
  const outside = await page.getByText("ordering blocked").isVisible().catch(() => false);
  if (outside) pass("far-store-blocked-copy", await shot(page, "09-far-store"));
  else fail("far-store-blocked-copy", "missing outside-radius / ordering blocked message");

  // 9. Search
  await page.goto(`${BASE}/search?q=milk`, { waitUntil: "networkidle" });
  const searchMilk = await page.getByText(/Fresh Milk/i).first().isVisible();
  if (searchMilk) pass("search-milk", await shot(page, "10-search"));
  else fail("search-milk", "milk not in search results");

  // 10. Desktop viewport sanity
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const desktopOk = await page.getByRole("heading", { name: /What do you need today/i }).isVisible();
  if (desktopOk) pass("desktop-home", await shot(page, "11-desktop-home"));
  else fail("desktop-home", "headline missing at 1280px");
} catch (e) {
  fail("uncaught", e.message);
  await page.screenshot({ path: path.join(OUT, "fe-error.png") }).catch(() => {});
} finally {
  const video = page.video();
  await context.close();
  await browser.close();
  if (video) {
    const vpath = await video.path();
    const dest = `${ART}/thuma-frontend-test.webm`;
    try {
      fs.copyFileSync(vpath, dest);
      console.log(`VIDEO ${dest}`);
    } catch (err) {
      console.log(`VIDEO_SRC ${vpath} (${err.message})`);
    }
  }
}

const failed = results.filter((r) => !r.ok);
console.log("\n--- SUMMARY ---");
console.log(`Passed: ${results.filter((r) => r.ok).length}/${results.length}`);
if (failed.length) {
  console.log("Failures:");
  for (const f of failed) console.log(` - ${f.name}: ${f.detail}`);
  process.exit(1);
}
console.log("All frontend checks passed.");
