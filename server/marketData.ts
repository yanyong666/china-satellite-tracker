export type RawDailyBar = [string, string, string, string, string, string];

export type PricePoint = {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
};

export type ChartMarker = {
  date: string;
  value: number;
  kind: "high" | "low" | "event";
  label: string;
};

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
  marketCap: number;
  updatedAt: string;
  dataStatus: "live" | "snapshot";
  sourceUrl: string;
};

const TOTAL_SHARES = 1_182_489_135;
const QUOTE_URL = "https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=sh600118,day,,,100,qfq";

const fallbackBars: PricePoint[] = [
  { date: "2026-07-13", open: 93.488, close: 91.248, high: 98.988, low: 85.988, volume: 1493576 },
  { date: "2026-07-24", open: 59.95, close: 57.78, high: 60.58, low: 57.75, volume: 300240 },
  { date: "2026-07-31", open: 56.01, close: 57.44, high: 58.3, low: 56.01, volume: 375607 },
  { date: "2026-08-03", open: 57.45, close: 59.77, high: 60.23, low: 56.8, volume: 389979 },
  { date: "2026-08-04", open: 60.02, close: 61.84, high: 62.16, low: 59.76, volume: 378386 },
  { date: "2026-08-05", open: 61.88, close: 63.13, high: 63.78, low: 61.88, volume: 384853 },
  { date: "2026-08-06", open: 62.5, close: 65.33, high: 66.4, low: 62.4, volume: 471162 },
  { date: "2026-08-07", open: 65.85, close: 68.68, high: 69.73, low: 64.69, volume: 527344 },
  { date: "2026-08-10", open: 69.6, close: 69.13, high: 69.99, low: 65.92, volume: 528455 },
  { date: "2026-08-11", open: 65.77, close: 63.52, high: 66.8, low: 62.31, volume: 619148 },
  { date: "2026-08-12", open: 63.51, close: 64.11, high: 64.44, low: 63, volume: 81057 },
];

const fallbackSnapshot: MarketSnapshot = {
  name: "中国卫星",
  symbol: "600118.SH",
  price: 64.11,
  previousClose: 63.52,
  change: 0.59,
  changePct: 0.93,
  open: 63.51,
  high: 64.44,
  low: 63,
  volume: 81057,
  turnover: 515164972,
  marketCap: 75809000000,
  updatedAt: "2026-08-12T09:48:23+08:00",
  dataStatus: "snapshot",
  sourceUrl: QUOTE_URL,
};

function numberFrom(value: unknown) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

export function parseDailyBars(rows: RawDailyBar[] | undefined): PricePoint[] {
  if (!rows) return [];

  return rows
    .map(([date, open, close, high, low, volume]) => ({
      date,
      open: numberFrom(open),
      close: numberFrom(close),
      high: numberFrom(high),
      low: numberFrom(low),
      volume: numberFrom(volume),
    }))
    .filter((row) => Boolean(row.date) && row.close > 0);
}

export function getChartMarkers(bars: PricePoint[]): ChartMarker[] {
  if (bars.length === 0) return [];
  const highest = bars.reduce((best, bar) => (bar.high > best.high ? bar : best));
  const lowest = bars.reduce((best, bar) => (bar.low < best.low ? bar : best));
  const eventMarkers = [
    { date: "2026-04-22", label: "一季报" },
    { date: "2026-07-13", label: "业绩预告" },
  ].flatMap((event) => {
    const bar = bars.find((item) => item.date === event.date);
    return bar ? [{ date: event.date, value: bar.close, kind: "event" as const, label: event.label }] : [];
  });

  return [
    { date: highest.date, value: highest.high, kind: "high", label: `高 ${highest.high.toFixed(2)}` },
    { date: lowest.date, value: lowest.low, kind: "low", label: `低 ${lowest.low.toFixed(2)}` },
    ...eventMarkers,
  ];
}

export function parseQuote(payload: unknown): { snapshot: MarketSnapshot; bars: PricePoint[]; markers: ChartMarker[] } {
  const root = payload as {
    data?: {
      sh600118?: { qfqday?: RawDailyBar[]; qt?: { sh600118?: string[] } };
    };
  };
  const quote = root.data?.sh600118;
  const fields = quote?.qt?.sh600118;
  const bars = parseDailyBars(quote?.qfqday);

  if (!fields || fields.length < 6 || bars.length === 0) {
    return { snapshot: fallbackSnapshot, bars: fallbackBars, markers: getChartMarkers(fallbackBars) };
  }

  const price = numberFrom(fields[3]);
  const previousClose = numberFrom(fields[4]);
  const latestBar = bars.at(-1);
  const tradeComposite = fields.find((value) => /^\d+(?:\.\d+)?\/\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/.test(value));
  const turnover = tradeComposite ? numberFrom(tradeComposite.split("/")[2]) : 0;
  const timeToken = fields.find((value) => /^\d{14}$/.test(value));
  const change = price - previousClose;

  return {
    snapshot: {
      name: fields[1] || "中国卫星",
      symbol: "600118.SH",
      price,
      previousClose,
      change,
      changePct: previousClose ? (change / previousClose) * 100 : 0,
      open: numberFrom(fields[5]),
      high: latestBar?.high ?? 0,
      low: latestBar?.low ?? 0,
      volume: numberFrom(fields[6]),
      turnover,
      marketCap: price * TOTAL_SHARES,
      updatedAt: timeToken
        ? `${timeToken.slice(0, 4)}-${timeToken.slice(4, 6)}-${timeToken.slice(6, 8)}T${timeToken.slice(8, 10)}:${timeToken.slice(10, 12)}:${timeToken.slice(12, 14)}+08:00`
        : new Date().toISOString(),
      dataStatus: "live",
      sourceUrl: QUOTE_URL,
    },
    bars,
    markers: getChartMarkers(bars),
  };
}

export async function getMarketData() {
  try {
    const response = await fetch(QUOTE_URL, {
      headers: { "User-Agent": "ChinaSatelliteTracker/1.0" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`公开行情请求失败：${response.status}`);
    return parseQuote(await response.json());
  } catch {
    return { snapshot: fallbackSnapshot, bars: fallbackBars, markers: getChartMarkers(fallbackBars) };
  }
}

export const trackingData = {
  scenarios: [
    {
      key: "baseline",
      name: "基准情景",
      weight: 50,
      range: "57–70 元",
      description: "中报大体落在预告范围内，市场围绕基本面验证与板块风险偏好反复定价。",
      trigger: "业绩兑现符合预期，成交量逐步收敛。",
    },
    {
      key: "bullish",
      name: "偏强情景",
      weight: 25,
      range: "站稳 70 元后向上延伸",
      description: "正式报告中的利润质量、毛利率或经营现金流优于市场预期，且出现新增订单或验收信息。",
      trigger: "放量站稳 70 元；新增业绩或订单信息。",
    },
    {
      key: "bearish",
      name: "偏弱情景",
      weight: 25,
      range: "失守 57–60 元后观察低位",
      description: "中报低于预期、利润质量偏弱，或商业航天板块风险偏好明显下降。",
      trigger: "跌破近期支撑；现金流或毛利率继续承压。",
    },
  ],
  catalysts: [
    {
      date: "2026 年 7 月 13 日",
      title: "半年度业绩预告",
      status: "已披露",
      content: "预计 2026H1 归母净利润 3,050–3,650 万元，预计实现扭亏为盈。",
      source: "https://money.finance.sina.com.cn/corp/view/vCB_AllBulletinDetail.php?stockid=600118&id=12441769",
    },
    {
      date: "2026 年中报披露期",
      title: "半年度报告",
      status: "待验证",
      content: "关注预告兑现、扣非利润、毛利率、经营现金流及项目验收进度。",
      source: "https://www.sse.com.cn/assortment/stock/list/info/summary/index.shtml?COMPANY_CODE=600118",
    },
    {
      date: "2026 年三季报披露期",
      title: "第三季度报告",
      status: "待验证",
      content: "关注重点卫星型号交付、订单节奏、收入确认与全年经营延续性。",
      source: "https://www.sse.com.cn/assortment/stock/list/info/summary/index.shtml?COMPANY_CODE=600118",
    },
  ],
  financials: [
    {
      period: "2025 年年报",
      audited: "经审计",
      revenue: "61.03 亿元",
      profit: "0.36 亿元",
      margin: "8.23%",
      cashflow: "3.63 亿元",
      note: "营收同比 +18.35%；主营毛利率同比下降 2.88 个百分点。",
      source: "https://money.finance.sina.com.cn/corp/view/vCB_AllBulletinDetail.php?stockid=600118&id=12038644",
    },
    {
      period: "2026 年一季报",
      audited: "未经审计",
      revenue: "6.09 亿元",
      profit: "-0.43 亿元",
      margin: "—",
      cashflow: "-1.49 亿元",
      note: "营收同比 +37.89%；归母净利润为亏损。",
      source: "https://www.cnfin.com/announ/detail/index.html?id=830139488467&code=600118&dannoun=lcdetail&announ=lc",
    },
  ],
  risks: [
    {
      name: "客户集中度",
      value: "80.50%",
      status: "需持续关注",
      description: "2025 年前五大客户销售额占年度销售总额 80.50%。",
    },
    {
      name: "毛利率趋势",
      value: "8.23% / -2.88pct",
      status: "承压",
      description: "2025 年主营毛利率同比下降，低毛利商业航天产品交付增加是披露原因之一。",
    },
    {
      name: "应收账款",
      value: "20.06 亿元",
      status: "持续跟踪",
      description: "截至 2026-03-31 的应收账款，需结合合同资产与回款节奏阅读。",
    },
    {
      name: "经营现金流",
      value: "-1.49 亿元",
      status: "阶段性波动",
      description: "2026Q1 经营现金流为负，较上年同期改善；项目型业务需关注后续回款。",
    },
  ],
  sources: [
    { label: "公开行情及前复权日线", url: QUOTE_URL },
    { label: "2025 年年度报告", url: "https://money.finance.sina.com.cn/corp/view/vCB_AllBulletinDetail.php?stockid=600118&id=12038644" },
    { label: "2026 年第一季度报告", url: "https://www.cnfin.com/announ/detail/index.html?id=830139488467&code=600118&dannoun=lcdetail&announ=lc" },
    { label: "2026 年半年度业绩预告", url: "https://money.finance.sina.com.cn/corp/view/vCB_AllBulletinDetail.php?stockid=600118&id=12441769" },
  ],
};
