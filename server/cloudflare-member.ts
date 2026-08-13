import { TRPCError } from "@trpc/server";

export type D1Statement = {
  bind: (...values: unknown[]) => D1Statement;
  all<T>(): Promise<{ results: T[] }>;
  first<T>(): Promise<T | null>;
  run(): Promise<{ meta: { changes?: number } }>;
};

export type D1Database = {
  prepare(query: string): D1Statement;
};

export type WorkerEnv = {
  MEMBER_DB?: D1Database;
};

export type MemberIdentity = {
  email: string;
  displayName: string | null;
};

type MemberCredential = MemberIdentity & {
  password_hash: string;
  password_salt: string;
  session_version: number;
};

type SessionRow = MemberIdentity & {
  token_hash: string;
  expires_at: number;
  session_version: number;
};

export type SavedStockRow = {
  stock_id: string;
  created_at: number;
};

const PASSWORD_ITERATIONS = 210_000;
const SESSION_COOKIE_NAME = "hx_member_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const LOGIN_WINDOW_SECONDS = 60 * 15;
const LOGIN_LOCK_SECONDS = 60 * 15;
const MAX_LOGIN_FAILURES = 5;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getMemberDb(env: WorkerEnv): D1Database {
  if (!env.MEMBER_DB) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "会员数据服务尚未配置。",
    });
  }
  return env.MEMBER_DB;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index] ?? 0);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

export function normalizeMemberEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (!emailPattern.test(email) || email.length > 254) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "请输入有效的邮箱地址。" });
  }
  return email;
}

export function validateMemberPassword(password: string) {
  if (password.length < 12 || password.length > 128) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "密码长度须为 12–128 个字符。" });
  }
}

async function pbkdf2(password: string, salt: Uint8Array) {
  const passwordBytes = new TextEncoder().encode(password);
  const passwordBuffer = passwordBytes.buffer.slice(passwordBytes.byteOffset, passwordBytes.byteOffset + passwordBytes.byteLength) as ArrayBuffer;
  const saltBuffer = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer;
  const key = await crypto.subtle.importKey("raw", passwordBuffer, "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: saltBuffer, iterations: PASSWORD_ITERATIONS }, key, 256);
  return bytesToBase64Url(new Uint8Array(bits));
}

export async function createPasswordRecord(password: string) {
  validateMemberPassword(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { passwordSalt: bytesToBase64Url(salt), passwordHash: await pbkdf2(password, salt) };
}

export async function verifyPassword(password: string, salt: string, passwordHash: string) {
  const computed = await pbkdf2(password, base64UrlToBytes(salt));
  if (computed.length !== passwordHash.length) return false;
  let difference = 0;
  for (let index = 0; index < computed.length; index += 1) difference |= computed.charCodeAt(index) ^ passwordHash.charCodeAt(index);
  return difference === 0;
}

async function hashSessionToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return bytesToBase64Url(new Uint8Array(digest));
}

function getCookie(request: Request, name: string) {
  const source = request.headers.get("cookie") ?? "";
  return source.split(";").map(item => item.trim()).find(item => item.startsWith(`${name}=`))?.slice(name.length + 1) ?? null;
}

function sessionCookie(token: string, maxAge = SESSION_MAX_AGE_SECONDS) {
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function expireSessionCookie() {
  return sessionCookie("", 0);
}

export function createMemberRepository(db: D1Database) {
  return {
    async createMember(member: MemberIdentity, password: { passwordHash: string; passwordSalt: string }) {
      await db
        .prepare(
          `INSERT INTO members (email, display_name, password_hash, password_salt, last_seen_at)
           VALUES (?, ?, ?, ?, unixepoch())`,
        )
        .bind(member.email, member.displayName, password.passwordHash, password.passwordSalt)
        .run();
    },

    async findMemberCredential(email: string) {
      return db.prepare(
        `SELECT email, display_name, password_hash, password_salt, session_version
         FROM members WHERE email = ?`,
      ).bind(email).first<MemberCredential>();
    },

    async createSession(email: string, tokenHash: string, expiresAt: number) {
      await db.prepare(
        "INSERT INTO member_sessions (token_hash, email, expires_at) VALUES (?, ?, ?)",
      ).bind(tokenHash, email, expiresAt).run();
    },

    async findSession(tokenHash: string, now: number) {
      return db.prepare(
        `SELECT session.token_hash, session.expires_at, member.email, member.display_name, member.session_version
         FROM member_sessions AS session
         JOIN members AS member ON member.email = session.email
         WHERE session.token_hash = ? AND session.expires_at > ?`,
      ).bind(tokenHash, now).first<SessionRow>();
    },

    async removeSession(tokenHash: string) {
      await db.prepare("DELETE FROM member_sessions WHERE token_hash = ?").bind(tokenHash).run();
    },

    async clearExpiredSessions(now: number) {
      await db.prepare("DELETE FROM member_sessions WHERE expires_at <= ?").bind(now).run();
    },

    async getLoginLock(email: string) {
      return db.prepare(
        "SELECT email, failure_count, window_started_at, locked_until FROM member_login_locks WHERE email = ?",
      ).bind(email).first<{ email: string; failure_count: number; window_started_at: number; locked_until: number | null }>();
    },

    async registerFailedLogin(email: string, now: number) {
      const existing = await this.getLoginLock(email);
      const insideWindow = existing && now - existing.window_started_at < LOGIN_WINDOW_SECONDS;
      const nextCount = insideWindow ? existing.failure_count + 1 : 1;
      const lockedUntil = nextCount >= MAX_LOGIN_FAILURES ? now + LOGIN_LOCK_SECONDS : null;
      await db.prepare(
        `INSERT INTO member_login_locks (email, failure_count, window_started_at, locked_until)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(email) DO UPDATE SET
           failure_count = excluded.failure_count,
           window_started_at = excluded.window_started_at,
           locked_until = excluded.locked_until`,
      ).bind(email, nextCount, insideWindow ? existing.window_started_at : now, lockedUntil).run();
      return lockedUntil;
    },

    async clearLoginFailures(email: string) {
      await db.prepare("DELETE FROM member_login_locks WHERE email = ?").bind(email).run();
    },

    async listSavedStockIds(email: string): Promise<SavedStockRow[]> {
      const result = await db
        .prepare(
          `SELECT stock_id, created_at
           FROM saved_stocks
           WHERE email = ?
           ORDER BY created_at DESC, stock_id ASC`,
        )
        .bind(email)
        .all<SavedStockRow>();
      return result.results;
    },

    async saveStock(email: string, stockId: string) {
      await db
        .prepare("INSERT OR IGNORE INTO saved_stocks (email, stock_id) VALUES (?, ?)")
        .bind(email, stockId)
        .run();
    },

    async removeStock(email: string, stockId: string) {
      await db
        .prepare("DELETE FROM saved_stocks WHERE email = ? AND stock_id = ?")
        .bind(email, stockId)
        .run();
    },
  };
}

export function requireMemberRepository(env: WorkerEnv) {
  return createMemberRepository(getMemberDb(env));
}

export async function startMemberSession(repository: ReturnType<typeof createMemberRepository>, email: string) {
  const rawToken = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const now = Math.floor(Date.now() / 1000);
  await repository.clearExpiredSessions(now);
  await repository.createSession(email, await hashSessionToken(rawToken), now + SESSION_MAX_AGE_SECONDS);
  return sessionCookie(rawToken);
}

export async function requireSessionMember(request: Request, env: WorkerEnv) {
  const token = getCookie(request, SESSION_COOKIE_NAME);
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "请先登录会员中心。" });
  const repository = requireMemberRepository(env);
  const session = await repository.findSession(await hashSessionToken(token), Math.floor(Date.now() / 1000));
  if (!session) throw new TRPCError({ code: "UNAUTHORIZED", message: "登录会话已失效，请重新登录。" });
  return { member: { email: session.email, displayName: session.displayName }, repository, tokenHash: session.token_hash };
}

export async function destroyMemberSession(request: Request, env: WorkerEnv) {
  const token = getCookie(request, SESSION_COOKIE_NAME);
  if (token) {
    await requireMemberRepository(env).removeSession(await hashSessionToken(token));
  }
  return expireSessionCookie();
}
