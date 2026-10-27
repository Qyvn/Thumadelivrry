import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const BASE = process.env.THUMA_URL || "http://localhost:3456";
const SITE = process.env.SITE_URL || pathToFileURL(path.resolve("site/index.html")).href;
const OUT = path.resolve("screenshots");
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function shot(url, name, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  await context.close();
  console.log("wrote", file);
}

const mobile = { width: 390, height: 844 };
const desktop = { width: 1280, height: 800 };

await shot(BASE, "onestop-home-mobile.png", mobile);
await shot(`${BASE}/gems`, "onestop-gems-mobile.png", mobile);
await shot(`${BASE}/food`, "onestop-food-mobile.png", mobile);
await shot(`${BASE}/homes`, "onestop-homes-mobile.png", mobile);
await shot(`${BASE}/homes/list`, "onestop-homes-list-mobile.png", mobile);
await shot(`${BASE}/gems/submit`, "onestop-gems-submit-mobile.png", mobile);
await shot(SITE, "onestop-site-mobile.png", mobile);
await shot(SITE, "onestop-site-desktop.png", desktop);
await shot(BASE, "onestop-home-desktop.png", desktop);

await browser.close();
console.log("done");
