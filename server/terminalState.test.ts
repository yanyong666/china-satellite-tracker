import { describe, expect, it } from "vitest";
import { getTerminalResearchTabs, selectTerminalStock, sortOverviewByChange } from "../client/src/lib/terminalState";

describe("terminal interaction state", () => {
  it("sorts available stock rows by descending percentage change and places unavailable quotes last", () => {
    const sorted = sortOverviewByChange([
      { id: "a", snapshot: { changePct: -1.2 } },
      { id: "b", snapshot: null },
      { id: "c", snapshot: { changePct: 2.8 } },
    ]);

    expect(sorted.map((item) => item.id)).toEqual(["c", "a", "b"]);
  });

  it("changes the active stock only when it belongs to the configured universe", () => {
    const available = ["china-satellite", "torch-electronics"] as const;

    expect(selectTerminalStock("china-satellite", "torch-electronics", [...available])).toBe("torch-electronics");
    expect(selectTerminalStock("china-satellite", "naura", [...available])).toBe("china-satellite");
  });

  it("creates title-style research tabs with a single active stock", () => {
    const tabs = getTerminalResearchTabs([
      { id: "china-satellite", name: "中国卫星", code: "600118", sector: "商业航天" },
      { id: "torch-electronics", name: "火炬电子", code: "603678", sector: "军工电子" },
    ], "torch-electronics");

    expect(tabs.map((tab) => ({ id: tab.id, isActive: tab.isActive }))).toEqual([
      { id: "china-satellite", isActive: false },
      { id: "torch-electronics", isActive: true },
    ]);
    expect(tabs[1]).toMatchObject({ name: "火炬电子", code: "603678", sector: "军工电子" });
  });
});
