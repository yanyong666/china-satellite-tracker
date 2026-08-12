import { describe, expect, it } from "vitest";
import { getChartMarkers, parseDailyBars, parseQuote } from "./marketData";

describe("market data parsing", () => {
  it("parses front-adjusted daily lines into numeric chart points", () => {
    const bars = parseDailyBars([["2026-08-12", "63.51", "64.11", "64.44", "63.00", "81057"]]);

    expect(bars).toEqual([
      { date: "2026-08-12", open: 63.51, close: 64.11, high: 64.44, low: 63, volume: 81057 },
    ]);
  });

  it("derives the market snapshot and uses the reported quote timestamp", () => {
    const { snapshot } = parseQuote({
      data: {
        sh600118: {
          qfqday: [["2026-08-12", "63.51", "64.11", "64.44", "63.00", "81057"]],
          qt: { sh600118: ["1", "中国卫星", "600118", "64.11", "63.52", "63.51", "81057", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "20260812094823", "", "", "", "", "", "", "64.11/81057/515164972"] },
        },
      },
    });

    expect(snapshot.dataStatus).toBe("live");
    expect(snapshot.changePct).toBeCloseTo(0.9288, 3);
    expect(snapshot.marketCap).toBeCloseTo(75809378444.85, -2);
    expect(snapshot.updatedAt).toBe("2026-08-12T09:48:23+08:00");
  });

  it("maps key high, low and disclosed event dates into chart annotations", () => {
    const bars = parseDailyBars([
      ["2026-04-22", "93.89", "97.57", "97.99", "91.95", "1029452"],
      ["2026-07-13", "93.49", "91.25", "98.99", "85.99", "1493576"],
      ["2026-08-12", "63.51", "64.11", "64.44", "63.00", "81057"],
    ]);

    expect(getChartMarkers(bars)).toEqual([
      { date: "2026-07-13", value: 98.99, kind: "high", label: "高 98.99" },
      { date: "2026-08-12", value: 63, kind: "low", label: "低 63.00" },
      { date: "2026-04-22", value: 97.57, kind: "event", label: "一季报" },
      { date: "2026-07-13", value: 91.25, kind: "event", label: "业绩预告" },
    ]);
  });
});
