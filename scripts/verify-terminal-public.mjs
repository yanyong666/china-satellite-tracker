import { chromium } from "playwright";

const origin = "https://stock-terminal.yanyong-email.workers.dev";
const browser = await chromium.launch({
  headless: true,
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const consoleEntries = [];
const requestFailures = [];
const apiResponses = [];
const failedResponses = [];

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.on("console", message => consoleEntries.push({ type: message.type(), text: message.text() }));
  page.on("pageerror", error => consoleEntries.push({ type: "pageerror", text: error.message }));
  page.on("requestfailed", request => requestFailures.push({ url: request.url(), failure: request.failure()?.errorText ?? "unknown" }));
  page.on("response", response => {
    if (response.url().includes("/api/trpc")) apiResponses.push({ status: response.status(), url: response.url() });
    if (response.status() >= 400) failedResponses.push({ status: response.status(), url: response.url() });
  });

  await page.goto(`${origin}/terminal`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(15_000);
  const bodyText = await page.locator("body").innerText();
  const resourceEntries = await page.evaluate(() => performance.getEntriesByType("resource").map(entry => entry.name));
  await page.screenshot({ path: "/home/ubuntu/webdev-static-assets/member-verification/production-terminal-public.png", fullPage: true });

  console.log(JSON.stringify({
    url: page.url(),
    bodyText: bodyText.slice(0, 1200),
    terminalLoaded: bodyText.includes("重点股票池") && bodyText.includes("中国卫星"),
    apiResponses,
    failedResponses,
    requestFailures,
    resourceEntries: resourceEntries.filter(url => url.includes("api") || url.includes("trpc")),
    consoleEntries,
  }, null, 2));
  await context.close();
} finally {
  await browser.close();
}
