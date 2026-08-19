import { describe, expect, it } from "vitest";
import { calculateResearchScore, getChartMarkers, getFallbackDailyAiSummary, getMarketSentiment, getNorthboundDisclosure, getResearchProfile, getTechnicalSummary, isValidDailyAiSummary, parseDailyBars, parseFinanceRss, parseFundFlow, parseIndexQuotes, parseQuote, STOCK_POOL } from "./marketData";
import { getIndexAvailability, getTerminalMarketState } from "../client/src/lib/marketContextState";
import { buildSectorSummaries, getEventStatus, getPublicModuleState } from "../client/src/lib/terminalResearch";

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
    const summary = parseFundFlow({ data: { klines: ["2026-08-10,100,-10,20,30,40,0,0,0,0,0,10,1", "2026-08-11,-40,-4,3,-18,-21,0,0,0,0,0,11,1"] } }, "https://example.test");

    expect(summary.asOf).toBe("2026-08-11");
    expect(summary.latestMainNet).toBe(-40);
    expect(summary.rolling5).toBe(60);
    expect(summary.breakdown).toEqual({ main: -40, small: -4, medium: 3, large: -18, superLarge: -21 });
  });

  it("parses the three public market index quote rows", () => {
    const indices = parseIndexQuotes('v_s_sh000001="1~上证指数~000001~3944.11~10.02~0.25~0";\nv_s_sz399006="51~创业板指~399006~3588.73~39.57~1.11~0";\nv_s_sh000688="1~科创50~000688~1725.91~16.41~0.96~0";');

    expect(indices).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "shanghai", price: 3944.11, changePct: 0.25 }),
      expect.objectContaining({ key: "chinext", price: 3588.73, changePct: 1.11 }),
      expect.objectContaining({ key: "star50", price: 1725.91, changePct: 0.96 }),
    ]));
  });

  it("parses public finance RSS titles, timestamps, source links and transparent tags", () => {
    const xml = `<rss><channel><item><title><![CDATA[上市公司发布年度报告]]></title><link>https://example.test/news/1</link><description>公开公告摘要</description><pubDate>Tue, 18 Aug 2026 17:04:34 +0800</pubDate></item></channel></rss>`;
    const news = parseFinanceRss(xml);

    expect(news).toHaveLength(1);
    expect(news[0]).toMatchObject({ title: "上市公司发布年度报告 · 公开公告摘要", source: "中新网财经 RSS", url: "https://example.test/news/1", tag: "财报公告" });
    expect(news[0]?.time).toContain("2026-08-18T09:04:34");
  });

  it("keeps AI daily summary output short, sourced and non-advisory", () => {
    const fallback = getFallbackDailyAiSummary(new Date("2026-08-18T00:00:00.000Z"));
    expect(fallback.status).toBe("fallback");
    expect(fallback.model).toBe("fallback-rule-engine");
    expect(fallback.summaryText).toContain("所有数据均来自公开披露，不构成投资建议");
    expect(isValidDailyAiSummary(fallback)).toBe(true);
    expect(isValidDailyAiSummary({ summaryText: "缺少免责声明", keyTheme: "测试" })).toBe(false);
    expect(isValidDailyAiSummary({ summaryText: `${"过长".repeat(130)}所有数据均来自公开披露，不构成投资建议`, keyTheme: "测试" })).toBe(false);
  });

  it("computes market sentiment only from supplied index breadth and keeps its source explicit", () => {
    expect(getMarketSentiment(3, 3)).toMatchObject({ sentiment: "偏强情绪", score: 85, sourceUrl: "https://www.sse.com.cn/" });
    expect(getMarketSentiment(3, 1).sentiment).toBe("区间震荡");
    expect(getMarketSentiment(3, 0).sentiment).toBe("审慎观望");
  });

  it("provides explicit and non-fabricated fallbacks for unavailable index, flow and northbound data", () => {
    const emptyFlow = parseFundFlow({}, "https://example.test/flow");
    const northbound = getNorthboundDisclosure();

    expect(parseIndexQuotes("unexpected payload")).toEqual([]);
    expect(getIndexAvailability([])).toBe("unavailable");
    expect(getIndexAvailability(undefined)).toBe("unavailable");
    expect(getIndexAvailability([{ key: "shanghai" }])).toBe("available");
    expect(emptyFlow).toMatchObject({ asOf: null, latestMainNet: null, rolling5: null, rolling10: null, breakdown: { main: null, superLarge: null, large: null, medium: null, small: null } });
    expect(northbound).toMatchObject({ intradayStatus: "not-disclosed", display: "盘中净流入未公开披露" });
  });

  it("builds a transparent research score from stated public-data rules", () => {
    const score = calculateResearchScore(
      { name: "测试", symbol: "000001.SZ", price: 11, previousClose: 10, change: 1, changePct: 10, open: 10, high: 11, low: 10, volume: 1, turnover: 1, updatedAt: "2026-08-12T00:00:00+08:00", dataStatus: "live", sourceUrl: "https://example.test" },
      { ma5: 11, ma10: 10, ma20: 9, supports: [] },
      { asOf: "2026-08-11", latestMainNet: 1, rolling5: 1, rolling10: 1, breakdown: { main: 1, superLarge: 1, large: 0, medium: 0, small: 0 }, sourceUrl: "https://example.test" },
      getResearchProfile("china-satellite"),
    );

    expect(score.total).toBe(100);
    expect(score.label).toBe("观察较强");
    expect(score.definition).toContain("不预测收益");
  });

  it("ranks only the configured stock-pool sectors and labels unavailable sector quotes", () => {
    const sectors = buildSectorSummaries([
      { stock: { sector: "商业航天", sectorKey: "aerospace" }, snapshot: { changePct: 1.5 } },
      { stock: { sector: "军工电子", sectorKey: "defense-electronics" }, snapshot: null },
    ]);

    expect(sectors[0]).toMatchObject({ sector: "商业航天", changePct: 1.5, coveredStocks: 1, availableQuotes: 1 });
    expect(sectors[1]).toMatchObject({ sector: "军工电子", changePct: null, coveredStocks: 1, availableQuotes: 0 });
  });

  it("computes disclosed, upcoming and monitoring event states without inferring event facts", () => {
    expect(getEventStatus("2026-07-13", "2026-08-12")).toEqual({ kind: "disclosed", label: "已披露" });
    expect(getEventStatus("2026-10-28", "2026-08-12")).toEqual({ kind: "upcoming", label: "待披露" });
    expect(getEventStatus(null, "2026-08-12")).toEqual({ kind: "monitoring", label: "持续监测" });
  });

  it("uses explicit unavailable states for unconnected chips and missing primary disclosures", () => {
    expect(getPublicModuleState("chips", false)).toMatchObject({ kind: "unavailable", title: "公开源未连接" });
    expect(getPublicModuleState("disclosures", false)).toMatchObject({ kind: "unavailable", title: "原始披露待补充" });
  });

  it("moves from loading to a retryable unavailable state when a public quote request fails", () => {
    expect(getTerminalMarketState(false, false, true)).toBe("loading");
    expect(getTerminalMarketState(true, false, false)).toBe("unavailable");
    expect(getTerminalMarketState(true, true, false)).toBe("ready");
  });

  it("parses quote payload using the selected stock configuration", () => {
    const { snapshot } = parseQuote({ data: { sh600118: { qfqday: [["2026-08-12", "63.51", "64.11", "64.44", "63.00", "81057"]], qt: { sh600118: ["1", "中国卫星", "600118", "64.11", "63.52", "63.51", "81057", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "20260812094823", "", "", "", "", "", "", "64.11/81057/515164972"] } } } }, satellite);

    expect(snapshot.symbol).toBe("600118.SH");
    expect(snapshot.changePct).toBeCloseTo(0.9288, 3);
  });
});
