import { chromium } from "playwright";

const origin = "https://stock-terminal.yanyong-email.workers.dev";
const runId = crypto.randomUUID().slice(0, 12);
const email = `ui-e2e-${runId}@example.invalid`;
const password = `UI-Verify-${runId}-Member!`;
const displayName = "UI 验证会员";

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

async function call(path, { method = "GET", input, cookie = "" } = {}) {
  const headers = { Accept: "application/json" };
  if (method !== "GET") headers["Content-Type"] = "application/json";
  if (cookie) headers.Cookie = cookie;
  const url = new URL(`/member/api/${path}`, origin);
  if (method === "GET") url.searchParams.set("input", JSON.stringify({ json: input ?? null }));
  const response = await fetch(url, {
    method,
    headers,
    body: method === "GET" ? undefined : JSON.stringify({ json: input ?? null }),
  });
  const text = await response.text();
  let payload;
  try { payload = JSON.parse(text); } catch { throw new Error(`${path} returned non-JSON: ${text.slice(0, 120)}`); }
  return { response, payload };
}

async function addMemberCookie(context, sessionCookie) {
  const [name, value] = sessionCookie.split("=", 2);
  await context.addCookies([{
    name,
    value,
    url: origin,
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  }]);
}

const register = await call("auth.register", {
  method: "POST",
  input: { email, displayName, password },
});
expect(register.response.status === 200, `register expected 200, got ${register.response.status}: ${JSON.stringify(register.payload)}`);
const cookie = (register.response.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
expect(cookie.startsWith("hx_member_session="), "registration did not return a member session cookie");

const save = await call("member.saveStock", { method: "POST", cookie, input: { stockId: "china-satellite" } });
expect(save.response.status === 200, `saveStock expected 200, got ${save.response.status}`);

const browser = await chromium.launch({
  headless: true,
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await addMemberCookie(desktop, cookie);
  const desktopPage = await desktop.newPage();
  await desktopPage.goto(`${origin}/member`, { waitUntil: "networkidle" });
  try {
    await desktopPage.getByRole("heading", { name: displayName }).waitFor();
  } catch (error) {
    const cookieMetadata = (await desktop.cookies(origin)).map(({ name, domain, httpOnly, secure, sameSite }) => ({ name, domain, httpOnly, secure, sameSite }));
    const sessionState = await desktopPage.evaluate(async () => {
      const response = await fetch("/member/api/auth.me?input=%7B%22json%22%3Anull%7D", { credentials: "include" });
      return { status: response.status, body: await response.text() };
    });
    console.error(JSON.stringify({
      cookieMetadata,
      sessionStatus: sessionState.status,
      sessionBody: sessionState.body.slice(0, 300),
      pageText: (await desktopPage.locator("body").innerText()).slice(0, 800),
    }, null, 2));
    throw error;
  }
  expect(await desktopPage.getByText(email).count() > 0, "desktop workbench did not render the account email");
  expect(await desktopPage.getByRole("heading", { name: "中国卫星" }).count() > 0, "desktop workbench did not render the saved stock");
  expect(await desktopPage.getByRole("link", { name: /进入研究终端/ }).count() > 0, "desktop workbench is missing terminal shortcut");
  await desktopPage.screenshot({ path: "/home/ubuntu/webdev-static-assets/member-verification/production-member-signed-in-desktop.png", fullPage: true });

  const mobile = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });
  await addMemberCookie(mobile, cookie);
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${origin}/member`, { waitUntil: "networkidle" });
  await mobilePage.getByRole("heading", { name: "中国卫星" }).waitFor();
  expect(await mobilePage.getByRole("button", { name: "移除" }).count() === 1, "mobile workbench is missing the remove action");
  await mobilePage.screenshot({ path: "/home/ubuntu/webdev-static-assets/member-verification/production-member-signed-in-mobile.png", fullPage: true });

  await desktopPage.getByRole("button", { name: "移除" }).click();
  await desktopPage.getByRole("heading", { name: "尚未收藏标的" }).waitFor();
  expect(await desktopPage.getByRole("heading", { name: "中国卫星" }).count() === 0, "remove action did not update the desktop workbench");

  await desktop.close();
  await mobile.close();
} finally {
  await browser.close();
  await call("auth.logout", { method: "POST", cookie });
}

console.log(JSON.stringify({
  status: "passed",
  testEmail: email,
  checks: ["desktop account profile", "desktop saved-stock list", "terminal shortcut", "mobile saved-stock list", "mobile remove action", "interactive remove", "test session cleanup"],
}, null, 2));
