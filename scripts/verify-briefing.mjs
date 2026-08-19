import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";

const baseUrl = process.env.PREVIEW_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const results = [];

for (const viewport of [{ width: 1280, height: 720 }, { width: 375, height: 812 }]) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const result = { viewport: `${viewport.width}x${viewport.height}`, checks: {} };
  try {
    await page.goto(`${baseUrl}/terminal`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector(".terminal-shell", { timeout: 30000 });
    await page.waitForSelector(".briefing-panel", { timeout: 30000 });
    await page.waitForTimeout(800);
    const text = await page.locator(".briefing-panel").innerText();
    const box = await page.locator(".briefing-panel").boundingBox();
    result.checks.heading = text.includes("实时市场情绪") && text.includes("财经播报");
    result.checks.liveStatus = text.includes("公开源在线");
    result.checks.realNewsSource = text.includes("中新网财经 RSS");
    result.checks.tickerItems = await page.locator(".news-ticker-item").count() > 0;
    result.checks.sentimentSummary = await page.locator(".sentiment-summary").count() === 1;
    result.checks.aiSummaryCard = await page.locator(".ai-summary-card").count() === 1;
    result.checks.aiSummaryState = text.includes("AI 实时生成") || text.includes("规则兜底生成") || text.includes("AI 生成中");
    result.checks.aiSummaryTheme = (await page.locator(".ai-summary-head strong").textContent())?.trim().length > 0;
    result.checks.sectorMover = (await page.locator(".sector-mover-badge").textContent())?.includes("板块异动") ?? false;
    const aiSummaryModelText = await page.locator(".ai-summary-model").textContent();
    result.checks.aiSummaryModel = Boolean(aiSummaryModelText && /模型：(?:gpt-5-mini|fallback-rule-engine|待连接)/.test(aiSummaryModelText));
    result.checks.aiSummaryDisclaimer = text.includes("所有数据均来自公开披露，不构成投资建议");
    result.checks.withinViewport = Boolean(box && box.x >= 0 && box.x + box.width <= viewport.width + 1);
    result.checks.disclaimer = text.includes("不预测收益或构成投资建议");
    result.pass = Object.values(result.checks).every(Boolean);
    result.newsPreview = text.split("\n").filter((line) => line.includes("中新网财经 RSS")).slice(0, 2);
  } catch (error) {
    result.pass = false;
    result.error = error instanceof Error ? error.message : String(error);
  } finally {
    await page.close();
  }
  results.push(result);
}

await writeFile("docs/briefing_visual_verification.json", `${JSON.stringify({ baseUrl, results }, null, 2)}\n`);
await browser.close();
const pass = results.every((result) => result.pass);
console.log(JSON.stringify({ pass, results }, null, 2));
if (!pass) process.exitCode = 1;
