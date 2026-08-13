import { describe, expect, it } from "vitest";
import { createMemberRepository, createPasswordRecord, verifyPassword, type D1Database, type D1Statement } from "./cloudflare-member";

type Call = { query: string; values: unknown[] };

function createFakeD1(): { db: D1Database; calls: Call[] } {
  const calls: Call[] = [];
  const statementFor = (query: string, values: unknown[] = []): D1Statement => ({
    bind: (...nextValues: unknown[]) => statementFor(query, nextValues),
    all: async <T>() => ({ results: [] as T[] }),
    first: async <T>() => null as T | null,
    run: async () => {
      calls.push({ query, values });
      return { meta: { changes: 1 } };
    },
  });

  return {
    db: { prepare: query => statementFor(query) },
    calls,
  };
}

describe("Cloudflare D1 member repository", () => {
  it("uses parameter binding for password-hash member creation and avoids raw user input in SQL", async () => {
    const { db, calls } = createFakeD1();
    const repository = createMemberRepository(db);
    await repository.createMember(
      { email: "member@example.com", displayName: "Member" },
      { passwordHash: "hash-value", passwordSalt: "salt-value" },
    );

    expect(calls).toHaveLength(1);
    expect(calls[0]?.query).toContain("password_hash");
    expect(calls[0]?.query).not.toContain("member@example.com");
    expect(calls[0]?.values).toEqual(["member@example.com", "Member", "hash-value", "salt-value"]);
  });

  it("generates distinct salted password records and verifies only the correct password", async () => {
    const first = await createPasswordRecord("correct horse battery staple");
    const second = await createPasswordRecord("correct horse battery staple");

    expect(first.passwordSalt).not.toBe(second.passwordSalt);
    expect(first.passwordHash).not.toBe(second.passwordHash);
    await expect(verifyPassword("correct horse battery staple", first.passwordSalt, first.passwordHash)).resolves.toBe(true);
    await expect(verifyPassword("incorrect password", first.passwordSalt, first.passwordHash)).resolves.toBe(false);
  });

  it("scopes save and remove operations to the authenticated member email", async () => {
    const { db, calls } = createFakeD1();
    const repository = createMemberRepository(db);
    await repository.saveStock("member@example.com", "china-satellite");
    await repository.removeStock("member@example.com", "china-satellite");

    expect(calls).toHaveLength(2);
    expect(calls[0]?.query).toContain("INSERT OR IGNORE");
    expect(calls[0]?.values).toEqual(["member@example.com", "china-satellite"]);
    expect(calls[1]?.query).toContain("WHERE email = ? AND stock_id = ?");
    expect(calls[1]?.values).toEqual(["member@example.com", "china-satellite"]);
  });

  it("aliases D1 display_name to the MemberIdentity displayName field for login and session reads", async () => {
    const queries: string[] = [];
    const db: D1Database = {
      prepare(query) {
        queries.push(query);
        const statement: D1Statement = {
          bind: () => statement,
          all: async <T>() => ({ results: [] as T[] }),
          first: async <T>() => null as T | null,
          run: async () => ({ meta: { changes: 0 } }),
        };
        return statement;
      },
    };
    const repository = createMemberRepository(db);

    await repository.findMemberCredential("member@example.com");
    await repository.findSession("session-hash", 123);

    expect(queries).toHaveLength(2);
    expect(queries[0]).toContain("display_name AS displayName");
    expect(queries[1]).toContain("display_name AS displayName");
  });
});
