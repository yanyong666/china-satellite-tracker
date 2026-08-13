const origin = "https://stock-terminal.yanyong-email.workers.dev";
const runId = crypto.randomUUID().slice(0, 12);
const email = `e2e-${runId}@example.invalid`;
const password = `V3rify-${runId}-Member!`;
let cookie = "";

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

async function call(path, { method = "GET", input, authenticated = false } = {}) {
  const headers = { Accept: "application/json" };
  if (method !== "GET") headers["Content-Type"] = "application/json";
  if (authenticated) headers.Cookie = cookie;
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

const register = await call("auth.register", {
  method: "POST",
  input: { email, displayName: "E2E Verification", password },
});
expect(register.response.status === 200, `register expected 200, got ${register.response.status}: ${JSON.stringify(register.payload)}`);
const setCookie = register.response.headers.get("set-cookie") ?? "";
expect(setCookie.includes("HttpOnly"), "session cookie is not HttpOnly");
expect(setCookie.includes("Secure"), "session cookie is not Secure");
expect(setCookie.includes("SameSite=Lax"), "session cookie is not SameSite=Lax");
cookie = setCookie.split(";")[0] ?? "";
expect(cookie.startsWith("hx_member_session="), "missing member session cookie");

const me = await call("auth.me", { authenticated: true });
expect(me.response.status === 200, `auth.me expected 200, got ${me.response.status}`);
expect(me.payload.result?.data?.json?.email === email, "auth.me did not return the session account");

for (let index = 0; index < 2; index += 1) {
  const save = await call("member.saveStock", { method: "POST", authenticated: true, input: { stockId: "china-satellite" } });
  expect(save.response.status === 200, `saveStock expected 200, got ${save.response.status}`);
}

const profileAfterSave = await call("member.profile", { authenticated: true });
const savedAfterSave = profileAfterSave.payload.result?.data?.json?.savedStocks ?? [];
expect(savedAfterSave.filter(stock => stock.stockId === "china-satellite").length === 1, "duplicate favorite was not deduplicated");

const logout = await call("auth.logout", { method: "POST", authenticated: true });
expect(logout.response.status === 200, `logout expected 200, got ${logout.response.status}`);
expect((logout.response.headers.get("set-cookie") ?? "").includes("Max-Age=0"), "logout did not expire the session cookie");
const postLogout = await call("auth.me", { authenticated: true });
expect(postLogout.response.status === 401, `post-logout auth.me expected 401, got ${postLogout.response.status}`);

const login = await call("auth.login", { method: "POST", input: { email, password } });
expect(login.response.status === 200, `login expected 200, got ${login.response.status}: ${JSON.stringify(login.payload)}`);
const loginCookie = login.response.headers.get("set-cookie") ?? "";
expect(loginCookie.includes("HttpOnly"), "login session cookie is not HttpOnly");
expect(loginCookie.includes("Secure"), "login session cookie is not Secure");
expect(loginCookie.includes("SameSite=Lax"), "login session cookie is not SameSite=Lax");
cookie = loginCookie.split(";")[0] ?? "";
expect(cookie.startsWith("hx_member_session="), "login response is missing member session cookie");

const meAfterLogin = await call("auth.me", { authenticated: true });
expect(meAfterLogin.response.status === 200, `auth.me after login expected 200, got ${meAfterLogin.response.status}`);
expect(meAfterLogin.payload.result?.data?.json?.email === email, "auth.me after login did not return the session account");
const profileAfterLogin = await call("member.profile", { authenticated: true });
const savedAfterLogin = profileAfterLogin.payload.result?.data?.json?.savedStocks ?? [];
expect(savedAfterLogin.filter(stock => stock.stockId === "china-satellite").length === 1, "favorite did not persist after a new login session");

const remove = await call("member.removeStock", { method: "POST", authenticated: true, input: { stockId: "china-satellite" } });
expect(remove.response.status === 200, `removeStock expected 200, got ${remove.response.status}`);
const profileAfterRemove = await call("member.profile", { authenticated: true });
const savedAfterRemove = profileAfterRemove.payload.result?.data?.json?.savedStocks ?? [];
expect(!savedAfterRemove.some(stock => stock.stockId === "china-satellite"), "favorite remains after removeStock");
const finalLogout = await call("auth.logout", { method: "POST", authenticated: true });
expect(finalLogout.response.status === 200, `final logout expected 200, got ${finalLogout.response.status}`);

console.log(JSON.stringify({
  status: "passed",
  testEmail: email,
  checks: ["register", "register HttpOnly/Secure/SameSite cookie", "auth.me", "save", "deduplicate", "logout", "post-logout 401", "login", "login HttpOnly/Secure/SameSite cookie", "cross-session favorite", "remove", "final logout"],
}, null, 2));
