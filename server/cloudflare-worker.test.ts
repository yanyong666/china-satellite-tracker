import { describe, expect, it } from "vitest";
import { memberWorkerRouter } from "./cloudflare-worker";
import type { D1Database, D1Statement, WorkerEnv } from "./cloudflare-member";

function createAuthenticatedMemberDb(): D1Database {
  const statementFor = (query: string): D1Statement => ({
    bind: () => statementFor(query),
    all: async <T>() => ({
      results: (query.includes("FROM saved_stocks")
        ? [{ stock_id: "china-satellite", created_at: 1_786_600_000 }]
        : []) as T[],
    }),
    first: async <T>() => (query.includes("FROM member_sessions")
      ? {
          token_hash: "stored-session-hash",
          expires_at: 1_999_999_999,
          email: "member@example.com",
          displayName: "研究会员",
          session_version: 1,
        }
      : null) as T | null,
    run: async () => ({ meta: { changes: 1 } }),
  });
  return { prepare: query => statementFor(query) };
}

describe("Cloudflare member Worker routes", () => {
  it("returns a signed-in profile with member identity and resolvable saved-stock metadata", async () => {
    const env: WorkerEnv = { MEMBER_DB: createAuthenticatedMemberDb() };
    const request = new Request("https://stock-terminal.example/member/api/auth.me", {
      headers: { cookie: "hx_member_session=test-session-token" },
    });
    const caller = memberWorkerRouter.createCaller({ request, env });

    const session = await caller.auth.me();
    const profile = await caller.member.profile();

    for (const result of [session, profile]) {
      expect(result.email).toBe("member@example.com");
      expect(result.displayName).toBe("研究会员");
      expect(result.savedStocks).toHaveLength(1);
      expect(result.savedStocks[0]).toMatchObject({
        stockId: "china-satellite",
        stock: { name: "中国卫星", code: "600118" },
      });
    }
  });
});
