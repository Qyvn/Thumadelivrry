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
  page.setDefaultTimeout(20000);
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  await ctx.close();
  console.log("wrote", file);
}

const m = { width: 390, height: 844 };
const d = { width: 1280, height: 800 };
await shot(BASE, "appfeel-home-mobile.png", m);
await shot(`${BASE}/gems`, "appfeel-gems-mobile.png", m);
await shot(`${BASE}/food`, "appfeel-food-mobile.png", m);
await shot(`${BASE}/homes`, "appfeel-homes-mobile.png", m);
await shot(SITE, "appfeel-site-mobile.png", m);
await shot(SITE, "appfeel-site-desktop.png", d);
await shot(BASE, "appfeel-home-desktop.png", d);
await browser.close();
console.log("done");
