import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const storage = vi.hoisted(() => ({
  list: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("./db", () => ({
  listUserSavedStocks: storage.list,
  saveUserStock: storage.save,
  removeUserStock: storage.remove,
}));

import { appRouter } from "./routers";

function authenticatedContext(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "member-router-test",
      email: "member-router@example.com",
      name: "Member Router",
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

describe("member 收藏成功路径", () => {
  beforeEach(() => {
    storage.list.mockReset();
    storage.save.mockReset();
    storage.remove.mockReset();
  });

  it("以当前会话用户身份保存标的，并允许幂等重复收藏", async () => {
    storage.save.mockResolvedValue({ stockId: "china-satellite", saved: true });
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.member.saveStock({ stockId: "china-satellite" })).resolves.toEqual({ stockId: "china-satellite", saved: true });
    await expect(caller.member.saveStock({ stockId: "china-satellite" })).resolves.toEqual({ stockId: "china-satellite", saved: true });
    expect(storage.save).toHaveBeenNthCalledWith(1, 42, "china-satellite");
    expect(storage.save).toHaveBeenNthCalledWith(2, 42, "china-satellite");
  });

  it("返回已保存标的的公开股票池元数据，并支持移除", async () => {
    const createdAt = new Date("2026-08-13T00:00:00.000Z");
    storage.list.mockResolvedValue([{ stockId: "china-satellite", createdAt }]);
    storage.remove.mockResolvedValue({ stockId: "china-satellite", removed: true });
    const caller = appRouter.createCaller(authenticatedContext());

    const saved = await caller.member.savedStocks();
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ stock: { id: "china-satellite", name: "中国卫星" }, createdAt });
    expect(storage.list).toHaveBeenCalledWith(42);
    await expect(caller.member.removeStock({ stockId: "china-satellite" })).resolves.toEqual({ stockId: "china-satellite", removed: true });
    expect(storage.remove).toHaveBeenCalledWith(42, "china-satellite");
  });
});
