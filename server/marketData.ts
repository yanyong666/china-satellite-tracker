export type MarketPrefix = "sh" | "sz";
export type StockId = "china-satellite" | "torch-electronics" | "naura" | "zhongji-innolight" | "catl";

export type StockMeta = {
  id: StockId;
  code: string;
  market: MarketPrefix;
  name: string;
  formalName: string;
  sector: string;
  sectorKey: "aerospace" | "defense-electronics" | "semiconductor" | "communications" | "new-energy";
  events: Array<{ date: string; label: string }>;
};

export type PricePoint = { date: string; open: number; close: number; high: number; low: number; volume: number };
export type ChartMarker = { date: string; value: number; kind: "high" | "low" | "event"; label: string };
export type MarketSnapshot = {
  name: string;
  symbol: string;
  price: number;
  previousClose: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  turnover: number;
  updatedAt: string;
  dataStatus: "live" | "unavailable";
  sourceUrl: string;
};
export type FlowBreakdown = { main: number | null; superLarge: number | null; large: number | null; medium: number | null; small: number | null };
export type FundFlowSummary = { asOf: string | null; latestMainNet: number | null; rolling5: number | null; rolling10: number | null; breakdown: FlowBreakdown; sourceUrl: string };
export type TechnicalSummary = { ma5: number | null; ma10: number | null; ma20: number | null; supports: Array<{ label: string; range: string; description: string }> };
export type IndexSnapshot = { key: "shanghai" | "chinext" | "star50"; name: string; symbol: string; price: number; change: number; changePct: number; sourceUrl: string };
export type NorthboundDisclosure = { intradayStatus: "not-disclosed"; display: string; explanation: string; sourceUrl: string };

export const STOCK_POOL: StockMeta[] = [
  { id: "china-satellite", code: "600118", market: "sh", name: "中国卫星", formalName: "中国东方红卫星股份有限公司", sector: "商业航天", sectorKey: "aerospace", events: [{ date: "2026-04-22", label: "一季报" }, { date: "2026-07-13", label: "业绩预告" }] },
  { id: "torch-electronics", code: "603678", market: "sh", name: "火炬电子", formalName: "福建火炬电子科技股份有限公司", sector: "军工电子", sectorKey: "defense-electronics", events: [] },
  { id: "naura", code: "002371", market: "sz", name: "北方华创", formalName: "北方华创科技集团股份有限公司", sector: "半导体", sectorKey: "semiconductor", events: [] },
  { id: "zhongji-innolight", code: "300308", market: "sz", name: "中际旭创", formalName: "中际旭创股份有限公司", sector: "通信计算", sectorKey: "communications", events: [] },
  { id: "catl", code: "300750", market: "sz", name: "宁德时代", formalName: "宁德时代新能源科技股份有限公司", sector: "新能源", sectorKey: "new-energy", events: [] },
];

const numberFrom = (value: unknown) => {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
};
const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const quoteUrlFor = (stock: StockMeta) => `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${stock.market}${stock.code},day,,,100,qfq`;
const flowUrlFor = (stock: StockMeta) => `https://push2his.eastmoney.com/api/qt/stock/fflow/daykline/get?lmt=30&klt=101&secid=${stock.market === "sh" ? 1 : 0}.${stock.code}&fields1=f1,f2,f3,f7&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f62,f63,f64,f65`;
const indexQuoteUrl = "https://qt.gtimg.cn/q=s_sh000001,s_sz399006,s_sh000688";
const northboundDisclosureUrl = "https://www.sse.com.cn/aboutus/mediacenter/hotandd/c/c_20240412_10753188.shtml";
const emptyBreakdown: FlowBreakdown = { main: null, superLarge: null, large: null, medium: null, small: null };

export function getStock(stockId: StockId) {
  const stock = STOCK_POOL.find((item) => item.id === stockId);
  if (!stock) throw new Error("未配置的股票标的");
  return stock;
}

export function parseDailyBars(rows: unknown): PricePoint[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (!Array.isArray(row) || row.length < 6) return [];
    const [date, open, close, high, low, volume] = row;
    const point = { date: String(date), open: numberFrom(open), close: numberFrom(close), high: numberFrom(high), low: numberFrom(low), volume: numberFrom(volume) };
    return point.date && point.close > 0 ? [point] : [];
  });
}

export function getChartMarkers(bars: PricePoint[], stock: StockMeta): ChartMarker[] {
  if (bars.length === 0) return [];
  const highest = bars.reduce((best, bar) => bar.high > best.high ? bar : best);
  const lowest = bars.reduce((best, bar) => bar.low < best.low ? bar : best);
  const events = stock.events.flatMap((event) => {
    const bar = bars.find((item) => item.date === event.date);
    return bar ? [{ date: bar.date, value: bar.close, kind: "event" as const, label: event.label }] : [];
  });
  return [
    { date: highest.date, value: highest.high, kind: "high", label: `高 ${highest.high.toFixed(2)}` },
    { date: lowest.date, value: lowest.low, kind: "low", label: `低 ${lowest.low.toFixed(2)}` },
    ...events,
  ];
}

export function getTechnicalSummary(bars: PricePoint[]): TechnicalSummary {
  const latest = bars.at(-1);
  const completed = bars.slice(0, -1);
  const lastComplete = completed.at(-1);
  const recent20 = bars.slice(-20);
  const low20 = recent20.length ? Math.min(...recent20.map((bar) => bar.low)) : null;
  const ma5 = average(bars.slice(-5).map((bar) => bar.close));
  const ma10 = average(bars.slice(-10).map((bar) => bar.close));
  const ma20 = average(recent20.map((bar) => bar.close));
  const shortLow = latest && lastComplete ? Math.min(latest.low, lastComplete.low) : latest?.low ?? null;
  const supports = [
    shortLow ? { label: "近端低点", range: `${shortLow.toFixed(2)} 元附近`, description: "由当前与最近完整交易日低点构成；收盘放量跌破时短线结构转弱。" } : null,
    ma10 && ma20 ? { label: "均线支撑带", range: `${Math.min(ma10, ma20).toFixed(2)}–${Math.max(ma10, ma20).toFixed(2)} 元`, description: "10 日与 20 日简单均线重叠区，需结合成交量判断支撑强度。" } : null,
    low20 ? { label: "20 日低点", range: `${low20.toFixed(2)} 元`, description: "近 20 个交易日前复权日线的最低价；失守后应重新评估反弹结构。" } : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  return { ma5, ma10, ma20, supports };
}

export function parseFundFlow(payload: unknown, sourceUrl: string): FundFlowSummary {
  const lines = (payload as { data?: { klines?: unknown[] } })?.data?.klines;
  if (!Array.isArray(lines) || lines.length === 0) return { asOf: null, latestMainNet: null, rolling5: null, rolling10: null, breakdown: emptyBreakdown, sourceUrl };
  const flows = lines.flatMap((line) => {
    if (typeof line !== "string") return [];
    const fields = line.split(",");
    const value = numberFrom(fields[1]);
    return fields[0] && Number.isFinite(value) ? [{ date: fields[0], mainNet: value, small: numberFrom(fields[2]), medium: numberFrom(fields[3]), large: numberFrom(fields[4]), superLarge: numberFrom(fields[5]) }] : [];
  });
  const sum = (count: number) => flows.slice(-count).reduce((total, item) => total + item.mainNet, 0);
  const latest = flows.at(-1);
  return {
    asOf: latest?.date ?? null,
    latestMainNet: latest?.mainNet ?? null,
    rolling5: sum(5),
    rolling10: sum(10),
    breakdown: latest ? { main: latest.mainNet, small: latest.small, medium: latest.medium, large: latest.large, superLarge: latest.superLarge } : emptyBreakdown,
    sourceUrl,
  };
}

export function parseIndexQuotes(raw: string): IndexSnapshot[] {
  const definitions: Array<{ key: IndexSnapshot["key"]; query: string; name: string; symbol: string }> = [
    { key: "shanghai", query: "sh000001", name: "上证指数", symbol: "000001.SH" },
    { key: "chinext", query: "sz399006", name: "创业板指", symbol: "399006.SZ" },
    { key: "star50", query: "sh000688", name: "科创50", symbol: "000688.SH" },
  ];
  return definitions.flatMap((definition) => {
    const match = raw.match(new RegExp(`v_s_${definition.query}="([^"]+)"`));
    const fields = match?.[1]?.split("~");
    if (!fields || fields.length < 6) return [];
    const price = numberFrom(fields[3]);
    return price > 0 ? [{ key: definition.key, name: fields[1] || definition.name, symbol: definition.symbol, price, change: numberFrom(fields[4]), changePct: numberFrom(fields[5]), sourceUrl: indexQuoteUrl }] : [];
  });
}

export function getNorthboundDisclosure(): NorthboundDisclosure {
  return {
    intradayStatus: "not-disclosed",
    display: "盘中净流入未公开披露",
    explanation: "沪深股通实时买入、卖出及交易总额已不再披露；页面不以估算值替代官方盘中净流入。",
    sourceUrl: northboundDisclosureUrl,
  };
}

export async function getMarketContext() {
  const fallbackNorthbound = getNorthboundDisclosure();
  try {
    const response = await fetch(indexQuoteUrl, { headers: { "User-Agent": "AshareResearchTerminal/1.0" }, signal: AbortSignal.timeout(8_000) });
    if (!response.ok) return { indices: [], northbound: fallbackNorthbound, updatedAt: new Date().toISOString() };
    const text = new TextDecoder("gb18030").decode(await response.arrayBuffer());
    return { indices: parseIndexQuotes(text), northbound: fallbackNorthbound, updatedAt: new Date().toISOString() };
  } catch {
    return { indices: [], northbound: fallbackNorthbound, updatedAt: new Date().toISOString() };
  }
}

export function parseQuote(payload: unknown, stock: StockMeta) {
  const key = `${stock.market}${stock.code}`;
  const quote = (payload as { data?: Record<string, { qfqday?: unknown; qt?: Record<string, string[]> }> })?.data?.[key];
  const fields = quote?.qt?.[key];
  const bars = parseDailyBars(quote?.qfqday);
  if (!fields || fields.length < 7 || bars.length === 0) throw new Error("公开行情返回结构不完整");
  const price = numberFrom(fields[3]);
  const previousClose = numberFrom(fields[4]);
  const latestBar = bars.at(-1);
  const tradeComposite = fields.find((value) => /^\d+(?:\.\d+)?\/\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/.test(value));
  const timestamp = fields.find((value) => /^\d{14}$/.test(value));
  const change = price - previousClose;
  const updatedAt = timestamp
    ? `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}-${timestamp.slice(6, 8)}T${timestamp.slice(8, 10)}:${timestamp.slice(10, 12)}:${timestamp.slice(12, 14)}+08:00`
    : new Date().toISOString();
  return {
    snapshot: {
      name: fields[1] || stock.name,
      symbol: `${stock.code}.${stock.market.toUpperCase()}`,
      price,
      previousClose,
      change,
      changePct: previousClose ? (change / previousClose) * 100 : 0,
      open: numberFrom(fields[5]),
      high: latestBar?.high ?? 0,
      low: latestBar?.low ?? 0,
      volume: numberFrom(fields[6]),
      turnover: tradeComposite ? numberFrom(tradeComposite.split("/")[2]) : 0,
      updatedAt,
      dataStatus: "live" as const,
      sourceUrl: quoteUrlFor(stock),
    },
    bars,
    markers: getChartMarkers(bars, stock),
    technical: getTechnicalSummary(bars),
  };
}

export async function getMarketData(stockId: StockId) {
  const stock = getStock(stockId);
  const quoteUrl = quoteUrlFor(stock);
  const flowUrl = flowUrlFor(stock);
  const [quoteResult, flowResult] = await Promise.allSettled([
    fetch(quoteUrl, { headers: { "User-Agent": "AshareResearchTerminal/1.0" }, signal: AbortSignal.timeout(8_000) }),
    fetch(flowUrl, { headers: { "User-Agent": "AshareResearchTerminal/1.0" }, signal: AbortSignal.timeout(8_000) }),
  ]);
  if (quoteResult.status !== "fulfilled" || !quoteResult.value.ok) throw new Error(`${stock.name} 行情暂不可用`);
  const quote = parseQuote(await quoteResult.value.json(), stock);
  const flow = flowResult.status === "fulfilled" && flowResult.value.ok
    ? parseFundFlow(await flowResult.value.json(), flowUrl)
    : { asOf: null, latestMainNet: null, rolling5: null, rolling10: null, breakdown: emptyBreakdown, sourceUrl: flowUrl };
  return { stock, ...quote, flow };
}

export async function getMarketOverview() {
  const results = await Promise.allSettled(STOCK_POOL.map((stock) => getMarketData(stock.id)));
  return results.map((result, index) => result.status === "fulfilled"
    ? result.value
    : { stock: STOCK_POOL[index], snapshot: null, error: result.reason instanceof Error ? result.reason.message : "行情暂不可用" });
}

type ResearchProfile = { coverage: "deep" | "basic"; watchpoints: string[]; sources: Array<{ label: string; url: string }> };
const RESEARCH_PROFILES: Record<StockId, ResearchProfile> = {
  "china-satellite": { coverage: "deep", watchpoints: ["重点卫星型号验收与收入确认", "正式中报的扣非利润、毛利率与经营现金流", "商业航天板块风险偏好"], sources: [{ label: "2025 年年度报告", url: "https://money.finance.sina.com.cn/corp/view/vCB_AllBulletinDetail.php?stockid=600118&id=12038644" }, { label: "2026 年半年度业绩预告", url: "https://money.finance.sina.com.cn/corp/view/vCB_AllBulletinDetail.php?stockid=600118&id=12441769" }] },
  "torch-electronics": { coverage: "deep", watchpoints: ["主力净额是否延续为正", "48.3–49.5 元近端支撑带", "均线重叠带与成交量确认"], sources: [{ label: "2025 年年度报告", url: "https://money.finance.sina.com.cn/corp/view/vCB_AllBulletinDetail.php?stockid=603678&id=12039732" }] },
  naura: { coverage: "basic", watchpoints: ["基础行情与资金流已接入", "深度财务与催化研究待补充"], sources: [] },
  "zhongji-innolight": { coverage: "basic", watchpoints: ["基础行情与资金流已接入", "深度财务与催化研究待补充"], sources: [] },
  catl: { coverage: "basic", watchpoints: ["基础行情与资金流已接入", "深度财务与催化研究待补充"], sources: [] },
};

export const getResearchProfile = (stockId: StockId) => RESEARCH_PROFILES[stockId];
