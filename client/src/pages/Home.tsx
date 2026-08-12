import { trpc } from "@/lib/trpc";
import { Area, AreaChart, CartesianGrid, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, CalendarDays, CircleDot, Clock3, Database, ExternalLink, Gauge, Loader2, RefreshCw, ShieldAlert, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const REFRESH_INTERVAL = 60_000;

function money(value: number) {
  if (Math.abs(value) >= 100_000_000) return `${(value / 100_000_000).toFixed(2)} 亿`;
  if (Math.abs(value) >= 10_000) return `${(value / 10_000).toFixed(2)} 万`;
  return value.toFixed(2);
}

function quoteTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "时间待更新" : date.toLocaleString("zh-CN", { hour12: false });
}

function ScenarioCard({ scenario }: { scenario: { key: string; name: string; weight: number; range: string; description: string; trigger: string } }) {
  const color = scenario.key === "baseline" ? "#c9a362" : scenario.key === "bullish" ? "#d75b54" : "#5ba6a3";
  return (
    <article className="scenario-card" style={{ "--scenario": color } as React.CSSProperties}>
      <div className="scenario-topline">
        <span className="scenario-name">{scenario.name}</span>
        <span className="scenario-weight">{scenario.weight}%</span>
      </div>
      <p className="scenario-range">{scenario.range}</p>
      <p className="scenario-description">{scenario.description}</p>
      <div className="scenario-trigger"><CircleDot size={13} /> {scenario.trigger}</div>
    </article>
  );
}

export default function Home() {
  const utils = trpc.useUtils();
  const marketQuery = trpc.tracker.market.useQuery(undefined, { refetchInterval: REFRESH_INTERVAL, refetchOnWindowFocus: true });
  const staticQuery = trpc.tracker.staticData.useQuery();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => void marketQuery.refetch(), REFRESH_INTERVAL);
    return () => window.clearInterval(id);
  }, [marketQuery]);

  const market = marketQuery.data;
  const tracking = staticQuery.data;
  const bars = market?.bars ?? [];
  const highest = useMemo(() => bars.reduce((best, bar) => (bar.high > (best?.high ?? -Infinity) ? bar : best), bars[0]), [bars]);
  const lowest = useMemo(() => bars.reduce((best, bar) => (bar.low < (best?.low ?? Infinity) ? bar : best), bars[0]), [bars]);
  const changePositive = (market?.snapshot.change ?? 0) >= 0;

  const refreshNow = async () => {
    setRefreshing(true);
    try {
      await utils.tracker.market.invalidate();
      await marketQuery.refetch();
      toast.success("已更新公开行情快照");
    } catch {
      toast.error("行情暂时不可用，已保留最近公开快照");
    } finally {
      setRefreshing(false);
    }
  };

  if (!market || !tracking) {
    return <div className="loading-screen"><Loader2 className="animate-spin" size={28} /><span>正在载入公开披露与行情数据</span></div>;
  }

  return (
    <div className="tracker-shell">
      <header className="topbar">
        <div className="brand-block">
          <span className="eyebrow">EQUITY RESEARCH / 600118.SH</span>
          <h1>中国卫星 <span>动态追踪</span></h1>
        </div>
        <nav aria-label="页面导航">
          <a href="#market">市场快照</a><a href="#outlook">情景预测</a><a href="#financials">财务摘要</a><a href="#risks">风险监控</a>
        </nav>
        <button className="refresh-button" onClick={refreshNow} disabled={refreshing}>
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> {refreshing ? "更新中" : "立即刷新"}
        </button>
      </header>

      <main>
        <section className="hero-grid" id="market">
          <div className="hero-copy">
            <div className="live-kicker"><span className={market.snapshot.dataStatus === "live" ? "live-pulse" : "snapshot-pulse"}></span>{market.snapshot.dataStatus === "live" ? "公开行情 · 页面自动刷新" : "公开快照 · 行情源暂不可用"}</div>
            <p className="hero-label">中国东方红卫星股份有限公司</p>
            <div className="price-row">
              <strong>{market.snapshot.price.toFixed(2)}</strong><span>CNY</span>
              <div className={changePositive ? "change-block positive" : "change-block negative"}>{changePositive ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />} {market.snapshot.change.toFixed(2)} ({market.snapshot.changePct.toFixed(2)}%)</div>
            </div>
            <p className="hero-meta"><Clock3 size={14} /> 最后更新：{quoteTime(market.snapshot.updatedAt)} · {market.snapshot.symbol}</p>
            <div className="hero-note">面向投资研究读者的公开数据追踪页面。行情于页面打开后自动刷新，每 60 秒更新一次。</div>
          </div>
          <div className="metric-grid">
            <div className="metric-tile"><span>成交额</span><strong>{money(market.snapshot.turnover)}</strong><small>当日公开行情</small></div>
            <div className="metric-tile"><span>总市值</span><strong>{money(market.snapshot.marketCap)}</strong><small>价格 × 公开股本</small></div>
            <div className="metric-tile"><span>日内区间</span><strong>{market.snapshot.low.toFixed(2)}–{market.snapshot.high.toFixed(2)}</strong><small>开盘 {market.snapshot.open.toFixed(2)}</small></div>
            <div className="metric-tile"><span>成交量</span><strong>{money(market.snapshot.volume)}</strong><small>公开行情口径</small></div>
          </div>
        </section>

        <section className="content-grid chart-section">
          <div className="panel chart-panel">
            <div className="section-heading"><div><span className="eyebrow">FRONT-ADJUSTED · 100 TRADING DAYS</span><h2>价格走势图</h2></div><span className="source-chip"><Database size={13} /> 公开前复权日线</span></div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bars} margin={{ top: 22, right: 10, left: -18, bottom: 6 }}>
                  <defs><linearGradient id="priceFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#c9a362" stopOpacity={0.3} /><stop offset="100%" stopColor="#c9a362" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid stroke="rgba(225,233,239,0.07)" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} interval="preserveStartEnd" minTickGap={54} tick={{ fill: "#87909c", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={["dataMin - 4", "dataMax + 4"]} tick={{ fill: "#87909c", fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip cursor={{ stroke: "rgba(201,163,98,.4)", strokeWidth: 1 }} contentStyle={{ background: "#151a21", border: "1px solid rgba(225,233,239,.12)", borderRadius: 10, color: "#e9e3d5" }} labelStyle={{ color: "#9ca3ad" }} formatter={(value: number) => [`${value.toFixed(2)} 元`, "收盘"]} />
                  <ReferenceLine y={70} stroke="#c9a362" strokeDasharray="4 6" strokeOpacity={0.45} label={{ value: "70 元验证区", fill: "#c9a362", position: "insideTopRight", fontSize: 11 }} />
                  <ReferenceLine y={57} stroke="#5ba6a3" strokeDasharray="4 6" strokeOpacity={0.45} label={{ value: "57 元支撑区", fill: "#79bdb9", position: "insideBottomRight", fontSize: 11 }} />
                  <Area type="monotone" dataKey="close" stroke="#d9b56f" strokeWidth={2.2} fill="url(#priceFill)" />
                  {market.markers.filter((marker) => marker.kind === "high" || marker.kind === "low").map((marker) => <ReferenceDot key={`${marker.kind}-${marker.date}`} x={marker.date} y={marker.value} r={4} fill={marker.kind === "high" ? "#d75b54" : "#5ba6a3"} stroke="#0d1015" strokeWidth={2} label={{ value: marker.label, fill: marker.kind === "high" ? "#d98b84" : "#77b8b5", position: marker.kind === "high" ? "top" : "bottom", fontSize: 11 }} />)}
                  {market.markers.filter((marker) => marker.kind === "event").map((marker) => <ReferenceDot key={`${marker.kind}-${marker.date}`} x={marker.date} y={marker.value} r={3.5} fill="#c9a362" stroke="#0d1015" strokeWidth={2} label={{ value: marker.label, fill: "#e2c789", position: "right", fontSize: 10 }} />)}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="event-notes"><span><CalendarDays size={14} /> 2026-04-22 · 一季报披露</span><span><CalendarDays size={14} /> 2026-07-13 · 半年度业绩预告</span><span><BarChart3 size={14} /> 图表为前复权日线</span></div>
          </div>
          <aside className="panel chart-aside">
            <span className="eyebrow">PRICE STRUCTURE</span><h3>关键价格结构</h3>
            <div className="level-item"><span>短期验证区</span><strong>70.00 元</strong><small>放量站稳后观察延续性</small></div>
            <div className="level-item"><span>近期支撑带</span><strong>57–60 元</strong><small>跌破后需重估反弹结构</small></div>
            <div className="level-item"><span>区间内高点</span><strong>{highest?.high.toFixed(2) ?? "—"} 元</strong><small>近 100 个交易日前复权日线</small></div>
            <p className="aside-note"><AlertTriangle size={14} /> 技术区间用于观察价格结构，不构成买卖建议。</p>
          </aside>
        </section>

        <section className="section-block" id="outlook">
          <div className="section-heading"><div><span className="eyebrow">THREE-MONTH FRAMEWORK</span><h2>三个月情景预测面板</h2></div><p>基准价格：{market.snapshot.price.toFixed(2)} 元 · 情景权重为研究判断，非收益概率保证。</p></div>
          <div className="scenario-grid">{tracking.scenarios.map((scenario) => <ScenarioCard key={scenario.key} scenario={scenario} />)}</div>
        </section>

        <section className="content-grid two-panel-section">
          <div className="panel timeline-panel">
            <div className="section-heading"><div><span className="eyebrow">DISCLOSURE WATCH</span><h2>业绩催化时间轴</h2></div></div>
            <div className="timeline">{tracking.catalysts.map((event, index) => <div className="timeline-item" key={event.title}><div className="timeline-marker">{index + 1}</div><div><div className="timeline-meta"><span>{event.date}</span><em className={event.status === "已披露" ? "status-published" : "status-pending"}>{event.status}</em></div><h3>{event.title}</h3><p>{event.content}</p><a href={event.source} target="_blank" rel="noreferrer">公开披露来源 <ExternalLink size={12} /></a></div></div>)}</div>
          </div>
          <div className="panel risk-panel" id="risks">
            <div className="section-heading"><div><span className="eyebrow">VERIFIABLE RISKS</span><h2>风险监控清单</h2></div></div>
            <div className="risk-list">{tracking.risks.map((risk) => <div className="risk-row" key={risk.name}><div><span className="risk-name">{risk.name}</span><p>{risk.description}</p></div><div className="risk-value"><strong>{risk.value}</strong><span>{risk.status}</span></div></div>)}</div>
          </div>
        </section>

        <section className="section-block" id="financials">
          <div className="section-heading"><div><span className="eyebrow">DISCLOSED FINANCIALS</span><h2>财务数据摘要卡片</h2></div><p>以公开定期报告口径呈现，非经审计数据已明确标注。</p></div>
          <div className="financial-grid">{tracking.financials.map((financial) => <article className="financial-card" key={financial.period}><div className="financial-header"><h3>{financial.period}</h3><span>{financial.audited}</span></div><div className="financial-stat-grid"><div><span>营收</span><strong>{financial.revenue}</strong></div><div><span>归母净利润</span><strong>{financial.profit}</strong></div><div><span>毛利率</span><strong>{financial.margin}</strong></div><div><span>经营现金流</span><strong>{financial.cashflow}</strong></div></div><p>{financial.note}</p><a href={financial.source} target="_blank" rel="noreferrer">查看公开披露 <ExternalLink size={13} /></a></article>)}</div>
        </section>
      </main>

      <footer>
        <div className="footer-top"><div><span className="eyebrow">DATA GOVERNANCE</span><h2>公开数据 · 研究呈现 · 审慎解读</h2></div><div className="footer-icon"><ShieldAlert size={25} /></div></div>
        <p className="disclaimer">所有数据均来自公开披露，不构成投资建议。</p>
        <p className="footer-copy">行情与前复权日线由公开行情接口提供；财务与业绩催化取自公司定期报告、业绩预告及上海证券交易所公开披露。页面打开时自动读取并每 60 秒更新行情快照；披露数据以来源文件为准。</p>
        <div className="source-links">{tracking.sources.map((source) => <a key={source.label} href={source.url} target="_blank" rel="noreferrer">{source.label} <ExternalLink size={12} /></a>)}</div>
      </footer>

      <style>{`
        .tracker-shell{min-height:100vh;background:radial-gradient(circle at 80% 0%,rgba(201,163,98,.10),transparent 28%),linear-gradient(180deg,#10141a 0%,#0d1015 48%,#101318 100%);color:var(--ink);font-family:var(--font-sans)}
        .topbar{height:82px;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(22px,5vw,76px);border-bottom:1px solid var(--line);background:rgba(13,16,21,.76);backdrop-filter:blur(18px);position:sticky;top:0;z-index:30}.brand-block h1{font-family:var(--font-serif);font-size:21px;line-height:1;margin:5px 0 0;letter-spacing:.04em}.brand-block h1 span{color:var(--gold)}.eyebrow{font-family:var(--font-mono);font-size:10px;letter-spacing:.17em;color:var(--gold);text-transform:uppercase}.topbar nav{display:flex;gap:24px}.topbar nav a{font-size:13px;color:#abb2ba;text-decoration:none;transition:color .18s ease}.topbar nav a:hover{color:var(--gold-soft)}.refresh-button{border:1px solid rgba(201,163,98,.5);background:rgba(201,163,98,.1);color:var(--gold-soft);border-radius:8px;padding:10px 13px;font:500 12px var(--font-sans);display:flex;gap:8px;align-items:center;cursor:pointer;transition:all .16s ease}.refresh-button:hover{background:rgba(201,163,98,.18);transform:translateY(-1px)}.refresh-button:active{transform:scale(.97)}.refresh-button:disabled{opacity:.65;cursor:wait}
        main{max-width:1440px;margin:0 auto;padding:0 clamp(20px,5vw,76px) 82px}.hero-grid{padding:64px 0 48px;display:grid;grid-template-columns:1.1fr .9fr;gap:42px;align-items:end}.live-kicker{display:flex;align-items:center;gap:8px;color:#afb6bf;font-size:12px}.live-pulse,.snapshot-pulse{display:block;width:8px;height:8px;border-radius:50%;background:#d75b54;box-shadow:0 0 0 5px rgba(215,91,84,.13)}.snapshot-pulse{background:#c9a362;box-shadow:0 0 0 5px rgba(201,163,98,.13)}.hero-label{color:#9ba4ae;font-size:14px;margin:24px 0 8px}.price-row{display:flex;align-items:flex-end;flex-wrap:wrap;gap:12px}.price-row strong{font-family:var(--font-serif);font-size:clamp(56px,7vw,92px);line-height:.93;font-weight:700;letter-spacing:-.05em}.price-row>span{font:12px var(--font-mono);color:var(--gold);margin-bottom:13px}.change-block{margin:0 0 11px 6px;padding:7px 9px;border-radius:6px;font:500 13px var(--font-mono);display:flex;align-items:center;gap:4px}.positive{color:#ef837b;background:rgba(215,91,84,.12)}.negative{color:#7bc1bd;background:rgba(91,166,163,.12)}.hero-meta{margin:20px 0 0;color:#88919c;font:11px var(--font-mono);display:flex;gap:7px;align-items:center}.hero-note{margin-top:18px;max-width:560px;border-left:2px solid var(--gold);padding:7px 0 7px 13px;color:#b7bdc5;font-size:12px;line-height:1.8}.metric-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.metric-tile{background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.017));border:1px solid var(--line);border-radius:10px;padding:19px}.metric-tile span,.financial-stat-grid span{display:block;color:#8f98a3;font-size:11px;margin-bottom:10px}.metric-tile strong{font:500 21px var(--font-mono);letter-spacing:-.05em;display:block}.metric-tile small{display:block;color:#71808d;font-size:10px;margin-top:9px}
        .content-grid{display:grid;grid-template-columns:1.8fr .8fr;gap:18px}.panel,.scenario-card,.financial-card{background:linear-gradient(135deg,rgba(255,255,255,.048),rgba(255,255,255,.018));border:1px solid var(--line);border-radius:12px}.chart-panel,.timeline-panel,.risk-panel{padding:25px}.section-heading{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.section-heading h2{font:700 26px var(--font-serif);letter-spacing:.03em;margin:7px 0 0}.section-heading>p{max-width:410px;color:#9099a4;font-size:12px;line-height:1.8;margin:5px 0 0;text-align:right}.source-chip{font:11px var(--font-mono);color:#b5bcc4;border:1px solid var(--line);padding:6px 8px;border-radius:5px;display:flex;gap:5px;align-items:center}.chart-wrap{height:360px;margin-top:18px}.event-notes{display:flex;flex-wrap:wrap;gap:16px;border-top:1px solid var(--line);padding-top:15px;color:#84909c;font-size:11px}.event-notes span{display:flex;align-items:center;gap:6px}.chart-aside{padding:25px}.chart-aside h3{font:700 23px var(--font-serif);margin:7px 0 26px}.level-item{padding:15px 0;border-top:1px solid var(--line)}.level-item span{display:block;color:#969fa9;font-size:11px;margin-bottom:6px}.level-item strong{font:500 20px var(--font-mono)}.level-item small{display:block;color:#757e89;font-size:11px;margin-top:7px}.aside-note{border-top:1px solid var(--line);padding-top:15px;margin:18px 0 0;color:#9c837b;font-size:11px;line-height:1.65;display:flex;gap:7px}
        .section-block{margin-top:64px}.scenario-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:19px}.scenario-card{padding:21px;position:relative;overflow:hidden}.scenario-card:before{content:"";position:absolute;top:0;left:0;width:100%;height:3px;background:var(--scenario)}.scenario-topline{display:flex;justify-content:space-between;align-items:center}.scenario-name{font-weight:600;font-size:14px}.scenario-weight{font:500 18px var(--font-mono);color:var(--scenario)}.scenario-range{font:700 22px var(--font-serif);margin:23px 0 16px}.scenario-description{color:#a3abb5;font-size:12px;line-height:1.8;min-height:64px;margin:0}.scenario-trigger{margin-top:18px;padding-top:13px;border-top:1px solid var(--line);color:#c9d0d6;font-size:11px;line-height:1.6;display:flex;gap:7px;align-items:flex-start}.two-panel-section{margin-top:64px;grid-template-columns:1fr 1fr}.timeline{margin-top:26px}.timeline-item{display:grid;grid-template-columns:32px 1fr;gap:14px;padding-bottom:24px;position:relative}.timeline-item:before{content:"";position:absolute;left:15px;top:31px;width:1px;height:calc(100% - 7px);background:var(--line)}.timeline-item:last-child:before{display:none}.timeline-marker{width:31px;height:31px;border:1px solid rgba(201,163,98,.48);border-radius:50%;display:grid;place-items:center;color:var(--gold);font:11px var(--font-mono);background:#161a20;z-index:1}.timeline-meta{display:flex;gap:9px;align-items:center;color:#8f98a3;font:11px var(--font-mono)}.timeline-meta em{font-style:normal;padding:2px 6px;border-radius:3px}.status-published{color:#e47a73;background:rgba(215,91,84,.13)}.status-pending{color:#d0aa69;background:rgba(201,163,98,.1)}.timeline h3{font-size:15px;margin:8px 0}.timeline p{font-size:12px;color:#a9b0b8;line-height:1.8;margin:0 0 9px}.timeline a,.financial-card a{color:var(--gold-soft);font-size:11px;display:inline-flex;align-items:center;gap:5px;text-decoration:none}.risk-list{margin-top:17px}.risk-row{display:flex;justify-content:space-between;gap:20px;padding:17px 0;border-top:1px solid var(--line)}.risk-name{font-size:14px;font-weight:600}.risk-row p{max-width:350px;color:#949da7;font-size:11px;line-height:1.75;margin:7px 0 0}.risk-value{text-align:right;min-width:120px}.risk-value strong{font:500 15px var(--font-mono);display:block}.risk-value span{display:inline-block;margin-top:8px;background:rgba(201,163,98,.1);color:var(--gold-soft);padding:3px 6px;border-radius:3px;font-size:10px}
        .financial-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:18px}.financial-card{padding:22px}.financial-header{display:flex;justify-content:space-between;align-items:center}.financial-header h3{font:700 20px var(--font-serif);margin:0}.financial-header span{font-size:10px;color:#a7b0b9;border:1px solid var(--line);padding:4px 7px;border-radius:4px}.financial-stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px 25px;padding:22px 0;margin:20px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.financial-stat-grid strong{font:500 19px var(--font-mono);letter-spacing:-.045em}.financial-card p{color:#99a3ad;font-size:11px;line-height:1.8;margin:0 0 15px}
        footer{max-width:1440px;margin:0 auto;padding:35px clamp(20px,5vw,76px) 52px;border-top:1px solid var(--line)}.footer-top{display:flex;align-items:end;justify-content:space-between}.footer-top h2{font:700 25px var(--font-serif);margin:7px 0 0}.footer-icon{width:43px;height:43px;border:1px solid rgba(201,163,98,.4);border-radius:50%;display:grid;place-items:center;color:var(--gold)}.disclaimer{font:700 18px var(--font-serif);color:var(--gold-soft);margin:28px 0 8px}.footer-copy{max-width:780px;color:#87919c;font-size:11px;line-height:1.85;margin:0}.source-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}.source-links a{border:1px solid var(--line);border-radius:5px;padding:7px 8px;display:flex;align-items:center;gap:5px;text-decoration:none;color:#aab2bb;font-size:10px;transition:all .16s ease}.source-links a:hover{color:var(--gold-soft);border-color:rgba(201,163,98,.45)}.loading-screen{height:100vh;display:flex;gap:12px;align-items:center;justify-content:center;background:var(--canvas);color:#b7bfca;font-size:13px}
        @media(max-width:960px){.topbar nav{display:none}.hero-grid,.content-grid,.two-panel-section{grid-template-columns:1fr}.chart-aside{display:none}.scenario-grid{grid-template-columns:1fr}.hero-grid{gap:30px}.section-heading>p{display:none}}@media(max-width:620px){.topbar{height:70px;padding:0 18px}.brand-block h1{font-size:18px}.refresh-button{padding:9px}.hero-grid{padding-top:43px}.metric-grid,.financial-grid{grid-template-columns:1fr 1fr}.metric-tile{padding:14px}.metric-tile strong{font-size:17px}.price-row strong{font-size:58px}.section-heading h2{font-size:22px}.chart-panel{padding:17px}.chart-wrap{height:275px}.event-notes{gap:9px}.financial-card{padding:17px}.financial-stat-grid{gap:17px 10px}.financial-stat-grid strong{font-size:15px}.risk-row{gap:12px}.risk-value{min-width:94px}.footer-top h2{font-size:21px}.disclaimer{font-size:16px}}
      `}</style>
    </div>
  );
}
