export type MarketPrefix = "sh" | "sz";
import { invokeLLM } from "./_core/llm";

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
export type ResearchEvent = { title: string; date: string | null; type: "定期报告" | "业绩预告" | "披露监测"; description: string; sourceUrl: string };
export type ScoreFactor = { label: string; score: number; max: number; status: string };
export type ResearchScore = { total: number; label: "观察较强" | "中性观察" | "风险观察"; factors: ScoreFactor[]; definition: string };

export type MarketSentiment = {
  sentiment: "偏强情绪" | "区间震荡" | "审慎观望";
  score: number;
  summary: string;
  updatedAt: string;
  sourceLabel: string;
  sourceUrl: string;
};

export type TickerNewsItem = {
  id: string;
  time: string;
  title: string;
  source: string;
  url: string;
  tag: "政策披露" | "行业动态" | "财报公告" | "市场快讯";
};

export function getMarketSentiment(indexCount: number, positiveIndices: number): MarketSentiment {
  const ratio = indexCount > 0 ? positiveIndices / indexCount : 0.5;
  const sentiment = ratio >= 0.66 ? "偏强情绪" : ratio >= 0.33 ? "区间震荡" : "审慎观望";
  return {
    sentiment,
    score: Math.round(50 + ratio * 35),
    summary: `大盘指数多空交织，首期覆盖股票池随板块相对强弱维持公允波动；所有观点均基于交易所与权威财经公开披露。`,
    updatedAt: new Date().toISOString(),
    sourceLabel: "沪深交易所与公开市场披露",
    sourceUrl: "https://www.sse.com.cn/",
  };
}

function decodeXml(value: string) {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

function classifyNews(title: string): TickerNewsItem["tag"] {
  if (/业绩|财报|年报|年度报告|季报|公告|利润|营收/.test(title)) return "财报公告";
  if (/政策|监管|央行|证监会|交易所|国资/.test(title)) return "政策披露";
  if (/行情|指数|市场|股市|A股|涨停|资金/.test(title)) return "市场快讯";
  return "行业动态";
}

export function parseFinanceRss(xml: string): TickerNewsItem[] {
  const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/gi));
  return items.flatMap((match, index) => {
    const item = match[1];
    const title = decodeXml(item.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "");
    const url = decodeXml(item.match(/<link>([\s\S]*?)<\/link>/i)?.[1] ?? "");
    const description = decodeXml(item.match(/<description>([\s\S]*?)<\/description>/i)?.[1] ?? "");
    const pubDate = decodeXml(item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] ?? "");
    if (!title || !url) return [];
    const timestamp = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString();
    return [{ id: `cn-finance-${index}-${timestamp}`, time: timestamp, title: description ? `${title} · ${description.slice(0, 48)}` : title, source: "中新网财经 RSS", url, tag: classifyNews(title) }];
  });
}

export type DailyAiSummary = {
  status: "live" | "fallback";
  summaryText: string;
  keyTheme: string;
  generatedAt: string;
  model: string;
};

let dailyAiSummaryCache: { key: string; value: DailyAiSummary } | null = null;

function currentShanghaiDay() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function getDailySummaryCacheKey(news: TickerNewsItem[], sentiment: MarketSentiment | null) {
  return `${currentShanghaiDay()}|${sentiment?.sentiment ?? "none"}|${sentiment?.score ?? "none"}|${news.slice(0, 5).map((item) => item.id).join(",")}`;
}

export function getFallbackDailyAiSummary(now = new Date()): DailyAiSummary {
  return {
    status: "fallback",
    summaryText: "今日市场延续常态化信息披露与板块轮动。指数与资金面保持区间观察，重点关注首期股票池核心标的的定期报告、业绩预告及宏观政策动向。所有数据均来自公开披露，不构成投资建议。",
    keyTheme: "常态运行与区间观察",
    generatedAt: now.toISOString(),
    model: "fallback-rule-engine",
  };
}

export function isValidDailyAiSummary(value: unknown): value is { summaryText: string; keyTheme: string } {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { summaryText?: unknown; keyTheme?: unknown };
  return typeof candidate.summaryText === "string" && candidate.summaryText.length > 0 && candidate.summaryText.length <= 240 && candidate.summaryText.includes("所有数据均来自公开披露，不构成投资建议") && typeof candidate.keyTheme === "string" && candidate.keyTheme.length > 0 && candidate.keyTheme.length <= 32;
}

async function generateDailyAiSummary(news: TickerNewsItem[], sentiment: MarketSentiment | null): Promise<DailyAiSummary> {
  const fallbackSummary = getFallbackDailyAiSummary();

  try {
    const cacheKey = getDailySummaryCacheKey(news, sentiment);
    if (dailyAiSummaryCache?.key === cacheKey) return dailyAiSummaryCache.value;
    const newsSnippets = news.slice(0, 5).map((item, index) => `${index + 1}. [${item.tag}] ${item.title}（来源：${item.source}，发布时间：${item.time}）`).join("\n");
    const sentimentText = sentiment ? `市场情绪标签：${sentiment.sentiment}（分值：${sentiment.score}/100），摘要：${sentiment.summary}` : "市场情绪：暂无实时指数广度。";
    
    const response = await invokeLLM({
      model: "gpt-5-mini",
      maxCompletionTokens: 320,
      messages: [
        {
          role: "system",
          content: "你是一位严谨、克制的 A 股资深研究员。请根据当天提供的公开财经新闻与市场情绪摘要，用 2-3 句话（不超过 120 字）写一段简短、专业的每日市场总结。规则：1. 必须客观中立，严禁预测收益、保证涨跌或构成投资建议；2. 必须提及“所有数据均来自公开披露，不构成投资建议”；3. 输出纯 JSON 对象，格式为 {\"summaryText\": \"...\", \"keyTheme\": \"...\"}。",
        },
        {
          role: "user",
          content: `请为今日终端生成每日总结。\n${sentimentText}\n\n公开新闻：\n${newsSnippets || "暂无实时新闻 headlines"}`,
        },
      ],
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "daily_market_summary",
          strict: true,
          schema: {
            type: "object",
            properties: { summaryText: { type: "string" }, keyTheme: { type: "string" } },
            required: ["summaryText", "keyTheme"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response.choices[0]?.message.content;
    const text = typeof rawContent === "string" ? rawContent : Array.isArray(rawContent) ? rawContent.map((p) => (p.type === "text" ? p.text : "")).join("") : "";
    if (!text) return fallbackSummary;

    const parsed = JSON.parse(text);
    if (!isValidDailyAiSummary(parsed)) return fallbackSummary;

    const summary: DailyAiSummary = {
      status: "live",
      summaryText: String(parsed.summaryText),
      keyTheme: String(parsed.keyTheme),
      generatedAt: new Date().toISOString(),
      model: response.model || "gpt-5-mini",
    };
    dailyAiSummaryCache = { key: getDailySummaryCacheKey(news, sentiment), value: summary };
    return summary;
  } catch {
    return fallbackSummary;
  }
}

type MarketBriefingData = {
  status: "live" | "unavailable";
  news: TickerNewsItem[];
  sentiment: MarketSentiment | null;
  updatedAt: string;
  sourceUrl: string;
};

async function fetchMarketBriefingData(): Promise<MarketBriefingData> {
  const updatedAt = new Date().toISOString();
  try {
    const [rssResult, context] = await Promise.all([
      fetch(financeRssUrl, { headers: { "User-Agent": "HuaxiaResearchTerminal/1.0" }, signal: AbortSignal.timeout(8_000) }),
      getMarketContext(),
    ]);
    if (!rssResult.ok) throw new Error("公开财经 RSS 暂不可用");
    const news = parseFinanceRss(await rssResult.text()).slice(0, 8);
    const positive = context.indices.filter((index) => index.changePct >= 0).length;
    return {
      status: "live",
      news,
      sentiment: getMarketSentiment(context.indices.length, positive),
      updatedAt: context.updatedAt ?? updatedAt,
      sourceUrl: financeRssUrl,
    };
  } catch {
    return { status: "unavailable", news: [], sentiment: null, updatedAt, sourceUrl: financeRssUrl };
  }
}

export async function getMarketBriefing() {
  const data = await fetchMarketBriefingData();
  return { ...data, aiSummary: getFallbackDailyAiSummary() };
}

export async function getDailyMarketSummary() {
  const data = await fetchMarketBriefingData();
  if (data.status !== "live" || !data.sentiment || data.news.length === 0) return getFallbackDailyAiSummary();
  return generateDailyAiSummary(data.news, data.sentiment);
}

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
const financeRssUrl = "https://www.chinanews.com.cn/rss/finance.xml";
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
  return { stock, ...quote, flow, score: calculateResearchScore(quote.snapshot, quote.technical, flow, getResearchProfile(stockId)) };
}

export async function getMarketOverview() {
  const results = await Promise.allSettled(STOCK_POOL.map((stock) => getMarketData(stock.id)));
  return results.map((result, index) => result.status === "fulfilled"
    ? result.value
    : { stock: STOCK_POOL[index], snapshot: null, error: result.reason instanceof Error ? result.reason.message : "行情暂不可用" });
}

export type ResearchProfile = { coverage: "deep" | "basic"; watchpoints: string[]; sources: Array<{ label: string; url: string }>; events: ResearchEvent[] };
const RESEARCH_PROFILES: Record<StockId, ResearchProfile> = {
  "china-satellite": { coverage: "deep", watchpoints: ["重点卫星型号验收与收入确认", "正式中报的扣非利润、毛利率与经营现金流", "商业航天板块风险偏好"], sources: [{ label: "2025 年年度报告", url: "https://money.finance.sina.com.cn/corp/view/vCB_AllBulletinDetail.php?stockid=600118&id=12038644" }, { label: "2026 年半年度业绩预告", url: "https://money.finance.sina.com.cn/corp/view/vCB_AllBulletinDetail.php?stockid=600118&id=12441769" }], events: [{ title: "2026 年半年度业绩预告", date: "2026-07-13", type: "业绩预告", description: "已纳入研究卡的公开业绩预告；以原始公告为准。", sourceUrl: "https://money.finance.sina.com.cn/corp/view/vCB_AllBulletinDetail.php?stockid=600118&id=12441769" }, { title: "定期报告与项目验收监测", date: null, type: "披露监测", description: "持续跟踪交易所/公司原始披露，不将媒体转述视为最终事实。", sourceUrl: "https://www.sse.com.cn/assortment/stock/list/info/summary/index.shtml?COMPANY_CODE=600118" }] },
  "torch-electronics": { coverage: "deep", watchpoints: ["主力净额是否延续为正", "48.3–49.5 元近端支撑带", "均线重叠带与成交量确认"], sources: [{ label: "2025 年年度报告", url: "https://money.finance.sina.com.cn/corp/view/vCB_AllBulletinDetail.php?stockid=603678&id=12039732" }], events: [{ title: "定期报告与军工电子景气监测", date: null, type: "披露监测", description: "以公司和交易所后续公告验证业绩、订单及经营事项。", sourceUrl: "https://www.sse.com.cn/assortment/stock/list/info/summary/index.shtml?COMPANY_CODE=603678" }] },
  naura: { coverage: "basic", watchpoints: ["基础行情与资金流已接入", "深度财务与催化研究待补充"], sources: [], events: [{ title: "公开披露监测", date: null, type: "披露监测", description: "基础模式仅提供行情与资金结构；深度事件需接入可核验披露。", sourceUrl: "https://www.szse.cn/disclosure/listed/notice/index.html" }] },
  "zhongji-innolight": { coverage: "basic", watchpoints: ["基础行情与资金流已接入", "深度财务与催化研究待补充"], sources: [], events: [{ title: "公开披露监测", date: null, type: "披露监测", description: "基础模式仅提供行情与资金结构；深度事件需接入可核验披露。", sourceUrl: "https://www.szse.cn/disclosure/listed/notice/index.html" }] },
  catl: { coverage: "basic", watchpoints: ["基础行情与资金流已接入", "深度财务与催化研究待补充"], sources: [], events: [{ title: "公开披露监测", date: null, type: "披露监测", description: "基础模式仅提供行情与资金结构；深度事件需接入可核验披露。", sourceUrl: "https://www.szse.cn/disclosure/listed/notice/index.html" }] },
};

export const getResearchProfile = (stockId: StockId) => RESEARCH_PROFILES[stockId];

export function calculateResearchScore(snapshot: MarketSnapshot, technical: TechnicalSummary, flow: FundFlowSummary, profile: ResearchProfile): ResearchScore {
  const factors: ScoreFactor[] = [
    { label: "价格相对 MA20", score: technical.ma20 !== null && snapshot.price >= technical.ma20 ? 20 : 5, max: 20, status: technical.ma20 !== null && snapshot.price >= technical.ma20 ? "价格不低于 MA20" : "价格低于 MA20 或均线不可用" },
    { label: "短期趋势", score: technical.ma5 !== null && technical.ma10 !== null && technical.ma5 >= technical.ma10 ? 15 : 4, max: 15, status: technical.ma5 !== null && technical.ma10 !== null && technical.ma5 >= technical.ma10 ? "MA5 不低于 MA10" : "MA5 低于 MA10 或均线不可用" },
    { label: "5 日主力结构", score: (flow.rolling5 ?? 0) >= 0 ? 20 : 5, max: 20, status: (flow.rolling5 ?? 0) >= 0 ? "滚动主力净额非负" : "滚动主力净额为负" },
    { label: "最近完整日主力", score: (flow.latestMainNet ?? 0) >= 0 ? 10 : 2, max: 10, status: (flow.latestMainNet ?? 0) >= 0 ? "最近完整日主力净额非负" : "最近完整日主力净额为负" },
    { label: "披露与研究覆盖", score: profile.coverage === "deep" ? 10 : 4, max: 10, status: profile.coverage === "deep" ? "已有可追溯研究来源" : "基础公开覆盖" },
    { label: "事件可追溯性", score: profile.events.length > 0 ? 10 : 0, max: 10, status: profile.events.length > 0 ? "存在公开披露监测项" : "尚未配置事件来源" },
    { label: "数据完整性", score: snapshot.dataStatus === "live" && flow.asOf ? 15 : 5, max: 15, status: snapshot.dataStatus === "live" && flow.asOf ? "行情与完整日资金数据可用" : "部分公开字段暂不可用" },
  ];
  const total = factors.reduce((sum, factor) => sum + factor.score, 0);
  return { total, label: total >= 70 ? "观察较强" : total >= 45 ? "中性观察" : "风险观察", factors, definition: "规则评分仅汇总趋势、公开资金结构、披露覆盖与数据完整性，不预测收益或构成买卖建议。" };
}
