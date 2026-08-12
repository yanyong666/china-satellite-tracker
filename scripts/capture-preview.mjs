import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const outputDirectory = "/home/ubuntu/china_satellite_analysis/visual_checks";
const pageUrl = "http://127.0.0.1:3000/";

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox", "--disable-gpu"] });

try {
  for (const viewport of [
    { name: "desktop", width: 1440, height: 1024 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 20_000 });
    await page.waitForSelector(".terminal-shell", { timeout: 20_000 });
    await page.waitForTimeout(10_000);
    await page.screenshot({ path: `${outputDirectory}/${viewport.name}.png`, fullPage: true });
    await page.close();
  }
} finally {
  await browser.close();
}
