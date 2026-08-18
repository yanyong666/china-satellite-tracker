import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";

const baseUrl = process.env.PREVIEW_URL ?? "https://3000-iwk5qevkysbbu6wl6elbq-54970c67.us1.manus.computer";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 });
const result = { viewport: "375x812", url: `${baseUrl}/terminal`, checks: {} };

try {
  await page.goto(`${baseUrl}/terminal`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector(".terminal-shell", { timeout: 30000 });
  await page.waitForTimeout(800);
  const bodyText = await page.locator("body").innerText();
  result.checks.loadedTerminal = bodyText.includes("今日涨幅前列") && bodyText.includes("大盘实时概览");
  result.checks.homeLinkVisible = await page.locator(".terminal-home-button").count() > 0;
  result.checks.tabsVisible = await page.getByRole("tab").count() >= 5;
  result.checks.marketVisible = bodyText.includes("今日涨幅前列") && bodyText.includes("大盘实时概览");
  result.checks.favoriteVisible = bodyText.includes("收藏到工作台");
  result.checks.disclaimerVisible = bodyText.includes("所有数据均来自公开披露，不构成投资建议。");

  if (result.checks.tabsVisible) {
    await page.getByRole("tab", { name: /火炬电子/ }).click();
    await page.waitForTimeout(300);
    result.checks.tabSwitch = (await page.locator(".terminal-tab.active .terminal-tab-name").innerText()) === "火炬电子";
  } else {
    result.checks.tabSwitch = false;
  }

  if (result.checks.homeLinkVisible) {
    await page.locator(".terminal-home-button").first().click();
    await page.waitForLoadState("domcontentloaded");
    result.checks.homeNavigation = new URL(page.url()).pathname === "/";
  } else {
    result.checks.homeNavigation = false;
  }

  result.textSample = bodyText.match(/(?:返回首页|收藏到工作台|所有数据均来自公开披露，不构成投资建议。)/g) ?? [];
  result.pass = Object.values(result.checks).every(Boolean);
} catch (error) {
  result.pass = false;
  result.error = error instanceof Error ? error.message : String(error);
} finally {
  await writeFile("docs/terminal_mobile_verification.json", `${JSON.stringify(result, null, 2)}\n`);
  await browser.close();
}

if (!result.pass) process.exitCode = 1;
console.log(JSON.stringify(result, null, 2));
