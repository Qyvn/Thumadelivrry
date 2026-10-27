import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const BASE = process.env.THUMA_URL || "http://localhost:3456";
const SITE = pathToFileURL(path.resolve("site/index.html")).href;
const OUT = path.resolve("screenshots");
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });

async function shot(url, name, viewport) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  page.setDefaultTimeout(25000);
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, name), fullPage: false });
  await ctx.close();
  console.log("wrote", name);
}

const m = { width: 390, height: 844 };
const d = { width: 1280, height: 800 };
await shot(BASE, "fill-home-mobile.png", m);
await shot(`${BASE}/gems`, "fill-gems-mobile.png", m);
await shot(`${BASE}/stays`, "fill-stays-mobile.png", m);
await shot(`${BASE}/food`, "fill-food-mobile.png", m);
await shot(SITE, "fill-site-mobile.png", m);
await shot(SITE, "fill-site-desktop.png", d);
await shot(BASE, "fill-home-desktop.png", d);
await browser.close();
console.log("done");
