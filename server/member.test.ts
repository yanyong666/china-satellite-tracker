import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function anonymousContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function authenticatedContext(): TrpcContext {
  return {
    user: {
      id: 9,
      openId: "member-test-user",
      email: "member@example.com",
      name: "Member Test",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("member 收藏接口", () => {
  it("拒绝未登录用户读取个人收藏", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.member.savedStocks()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("在访问数据库前拒绝不属于首期股票池的标的", async () => {
    const caller = appRouter.createCaller(authenticatedContext());
    await expect(caller.member.saveStock({ stockId: "unknown-stock" } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
