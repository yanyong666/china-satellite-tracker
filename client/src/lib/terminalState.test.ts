import { describe, expect, it } from "vitest";
import { selectTerminalStock, sortOverviewByChange } from "./terminalState";

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
});
