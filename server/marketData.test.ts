import { describe, expect, it } from "vitest";
import { getChartMarkers, getTechnicalSummary, parseDailyBars, parseFundFlow, parseQuote, STOCK_POOL } from "./marketData";

const satellite = STOCK_POOL[0];

describe("multi-stock market data", () => {
  it("parses generic stock day lines and derives layered support inputs", () => {
    const bars = parseDailyBars([
      ["2026-08-10", "60", "61", "62", "59", "100"],
      ["2026-08-11", "61", "63", "64", "60", "120"],
      ["2026-08-12", "63", "64", "65", "62", "140"],
    ]);
    const technical = getTechnicalSummary(bars);

    expect(bars).toHaveLength(3);
    expect(technical.ma5).toBeCloseTo(62.67, 2);
    expect(technical.supports[0]?.range).toBe("60.00 元附近");
  });

  it("maps high, low and configured company events into chart annotations", () => {
    const bars = parseDailyBars([
      ["2026-04-22", "93.89", "97.57", "97.99", "91.95", "1029452"],
      ["2026-07-13", "93.49", "91.25", "98.99", "85.99", "1493576"],
      ["2026-08-12", "63.51", "64.11", "64.44", "63.00", "81057"],
    ]);
    const markers = getChartMarkers(bars, satellite);

    expect(markers.some((item) => item.label === "一季报")).toBe(true);
    expect(markers.some((item) => item.label === "业绩预告")).toBe(true);
    expect(markers.find((item) => item.kind === "high")?.value).toBe(98.99);
  });

  it("parses public main-flow lines into rolling windows", () => {
    const summary = parseFundFlow({ data: { klines: ["2026-08-10,100,0,0,0,0,0,0,0,0,0,10,1", "2026-08-11,-40,0,0,0,0,0,0,0,0,0,11,1"] } }, "https://example.test");

    expect(summary.asOf).toBe("2026-08-11");
    expect(summary.latestMainNet).toBe(-40);
    expect(summary.rolling5).toBe(60);
  });

  it("parses quote payload using the selected stock configuration", () => {
    const { snapshot } = parseQuote({ data: { sh600118: { qfqday: [["2026-08-12", "63.51", "64.11", "64.44", "63.00", "81057"]], qt: { sh600118: ["1", "中国卫星", "600118", "64.11", "63.52", "63.51", "81057", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "20260812094823", "", "", "", "", "", "", "64.11/81057/515164972"] } } } }, satellite);

    expect(snapshot.symbol).toBe("600118.SH");
    expect(snapshot.changePct).toBeCloseTo(0.9288, 3);
  });
});
