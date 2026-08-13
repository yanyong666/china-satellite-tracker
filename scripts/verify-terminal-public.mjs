import { chromium } from "playwright";

const origin = (process.env.TERMINAL_ORIGIN ?? "https://stock-terminal.yanyong-email.workers.dev").replace(/\/$/, "");
const mobile = process.env.TERMINAL_VIEWPORT === "mobile";
const viewport = mobile ? { width: 375, height: 812 } : { width: 1280, height: 900 };
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
  const context = await browser.newContext({ viewport, isMobile: mobile });
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
  const terminalLoaded = (await page.getByRole("tab").count()) > 0 && bodyText.includes("中国卫星");
  const publicApiLoaded = apiResponses.some(response => response.status === 200);
  await page.getByRole("tab", { name: /火炬电子/ }).click();
  await page.getByRole("heading", { name: /火炬电子/ }).waitFor();
  const tabSwitchWorked = (await page.locator("body").innerText()).includes("火炬电子603678.SH");
  await page.screenshot({ path: `/home/ubuntu/webdev-static-assets/member-verification/production-terminal-public-${mobile ? "mobile" : "desktop"}.png`, fullPage: true });
  await page.getByRole("link", { name: "返回华夏股票研究终端首页" }).first().click();
  await page.waitForURL(`${origin}/`);
  const homeReturnWorked = (await page.locator("body").innerText()).includes("华夏股票研究终端");

  console.log(JSON.stringify({
    url: page.url(),
    viewport,
    bodyText: bodyText.slice(0, 1200),
    terminalLoaded,
    tabSwitchWorked,
    homeReturnWorked,
    apiResponses,
    failedResponses,
    requestFailures,
    resourceEntries: resourceEntries.filter(url => url.includes("api") || url.includes("trpc")),
    consoleEntries,
  }, null, 2));
  if (!terminalLoaded || !publicApiLoaded || !tabSwitchWorked || !homeReturnWorked) {
    throw new Error("公开研究终端未完成数据加载、页签切换或返回首页导航验收。");
  }
  await context.close();
} finally {
  await browser.close();
}
