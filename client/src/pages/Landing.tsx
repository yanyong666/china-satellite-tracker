import { LANDING_PRIMARY_CTA, LANDING_PRINCIPLES } from "@/lib/landingContent";
import { memberTrpc } from "@/lib/cloudflareMemberTrpc";
import { SITE_ROUTES } from "@/lib/siteRoutes";
import { Activity, ArrowUpRight, BarChart3, BookmarkCheck, ChevronRight, CircleDot, Database, Globe, Layers3, LogIn, Radar, RefreshCw, Search, ShieldCheck, TrendingUp } from "lucide-react";
import React from "react";
import { Link } from "wouter";
import "./landing.css";

const signalCards = [
  { label: "研究覆盖", value: "05", detail: "重点板块 · 首期股票池" },
  { label: "行情机制", value: "60s", detail: "打开即取 · 定时刷新" },
  { label: "研究口径", value: "100%", detail: "公开披露 · 来源可查" },
] as const;

const tickerItems = ["沪深市场快照", "板块相对强弱", "透明个股评分", "披露事件跟踪", "资金结构说明"] as const;

export default function Landing() {
  const memberSession = memberTrpc.auth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const hasMemberSession = Boolean(memberSession.data);
  const memberName = memberSession.data?.displayName || "研究会员";
  const memberEntryTitle = memberSession.isLoading ? "正在读取会员状态" : hasMemberSession ? `进入 ${memberName} 的工作台` : "登录或创建工作台";
  const memberEntryDetail = memberSession.isLoading ? "会话仅用于识别你的个人研究清单" : hasMemberSession ? "已登录 · 查看已收藏标的" : "保存标的时登录；公开研究无需登录";

  return (
    <div className="landing-shell">
      <div className="landing-grid" aria-hidden="true" />
      <header className="landing-header">
        <Link href={SITE_ROUTES.home} className="landing-brand" aria-label="华夏股票研究终端首页">
          <span className="landing-brand-mark"><BarChart3 size={18} /></span>
          <span>
            <small>HUAXIA / PUBLIC MARKETS</small>
            <strong>华夏股票研究终端</strong>
          </span>
        </Link>
        <nav className="landing-nav" aria-label="首页导航">
          <a href="#method">研究方法</a>
          <a href="#coverage">覆盖范围</a>
          <Link href={SITE_ROUTES.member} className="landing-nav-member"><span className={hasMemberSession ? "member-status-dot signed-in" : "member-status-dot"} />{hasMemberSession ? "我的工作台" : "会员中心"}</Link>
          <Link href={LANDING_PRIMARY_CTA.href} className="landing-nav-cta">终端入口 <ArrowUpRight size={14} /></Link>
        </nav>
      </header>

      <div className="landing-ticker" aria-label="终端能力概览">
        <span className="ticker-status"><Activity size={12} /> PUBLIC RESEARCH SYSTEM / ONLINE</span>
        <div className="ticker-items">{tickerItems.map((item) => <span key={item}><CircleDot size={8} /> {item}</span>)}</div>
        <span className="ticker-date">A-SHARE · CN</span>
      </div>

      <main>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-copy">
            <div className="eyebrow"><span /> INDEPENDENT MARKET RESEARCH</div>
            <h1 id="landing-title">把公开信息，<br /><em>转化为可复核的</em><br />研究工作流。</h1>
            <p>面向具备研究背景的 A 股观察者，以公开行情、交易所披露与透明规则构建专注、克制、可追溯的研究界面。</p>
            <div className="landing-actions">
              <Link href={LANDING_PRIMARY_CTA.href} className="primary-entry">{LANDING_PRIMARY_CTA.label} <ChevronRight size={17} /></Link>
              <a href="#method" className="secondary-entry">了解研究口径 <ArrowUpRight size={15} /></a>
            </div>
            <Link href={SITE_ROUTES.member} className="landing-member-entry" aria-label={memberEntryTitle}>
              <span className="member-entry-icon">{hasMemberSession ? <BookmarkCheck size={17} /> : <LogIn size={17} />}</span>
              <span className="member-entry-copy"><small>MEMBER DESK / NO PAYMENT</small><strong>{memberEntryTitle}</strong><em>{memberEntryDetail}</em></span>
              <ArrowUpRight size={16} />
            </Link>
            <div className="landing-proof">{LANDING_PRINCIPLES.map((item) => <span key={item}><ShieldCheck size={14} /> {item}</span>)}</div>
          </div>

          <div className="landing-stage" aria-label="终端能力预览">
            <div className="stage-topline"><span>MARKET INTELLIGENCE / 01</span><span>LIVE DATA INTERFACE</span></div>
            <div className="stage-orbit stage-orbit-a" /><div className="stage-orbit stage-orbit-b" />
            <div className="stage-quote stage-quote-primary"><span>公开数据链路</span><strong>TRACEABLE</strong><small><Database size={12} /> 交易所 / 行情源 / 原始披露</small></div>
            <div className="stage-quote stage-quote-secondary"><span>研究规则</span><strong>EXPLICIT</strong><small><Radar size={12} /> 评分因子逐项可见</small></div>
            <div className="stage-screen">
              <div className="screen-head"><span><i /> MARKET PULSE</span><span>60 SEC REFRESH <RefreshCw size={11} /></span></div>
              <div className="screen-market"><div><span>商业航天</span><strong>600118.SH</strong><small>中国卫星</small></div><b>+3.23%</b></div>
              <div className="screen-chart"><span className="chart-point chart-point-one" /><span className="chart-point chart-point-two" /><span className="chart-point chart-point-three" /><svg viewBox="0 0 430 130" preserveAspectRatio="none" aria-hidden="true"><path d="M0,99 C30,84 45,103 67,74 C97,34 106,65 133,66 C158,67 164,36 191,46 C226,58 230,14 262,30 C296,46 300,79 331,58 C365,35 388,59 430,18" fill="none" pathLength="1" /><path d="M0,99 C30,84 45,103 67,74 C97,34 106,65 133,66 C158,67 164,36 191,46 C226,58 230,14 262,30 C296,46 300,79 331,58 C365,35 388,59 430,18 L430,130 L0,130Z" className="chart-fill" /></svg></div>
              <div className="screen-grid"><span>板块强度 <b>05</b></span><span>研究卡 <b>OPEN</b></span><span>评分 <b>90 / 100</b></span></div>
            </div>
            <div className="stage-corner"><TrendingUp size={17} /><span>以证据管理<br />不确定性</span></div>
          </div>
        </section>

        <section id="coverage" className="landing-signals" aria-label="研究终端能力">
          {signalCards.map((card, index) => <article key={card.label}><span>0{index + 1}</span><div><small>{card.label}</small><strong>{card.value}</strong><p>{card.detail}</p></div></article>)}
        </section>

        <section id="method" className="landing-method">
          <div className="method-intro"><span className="eyebrow"><span /> RESEARCH PROTOCOL</span><h2>不是推荐页，<br />而是研究起点。</h2></div>
          <div className="method-list">
            <article><Search size={18} /><div><strong>公开源优先</strong><p>行情、资金、新闻与披露均标识来源与可用边界。</p></div><span>01</span></article>
            <article><Layers3 size={18} /><div><strong>多板块观察</strong><p>在统一数据口径下比较板块代理表现与重点股票池。</p></div><span>02</span></article>
            <article><Globe size={18} /><div><strong>透明而非预测</strong><p>评分只汇总公开因子，不对收益做承诺或推断。</p></div><span>03</span></article>
          </div>
        </section>

        <section className="landing-final">
          <div><span className="eyebrow"><span /> READY FOR REVIEW</span><h2>从市场快照开始，<br />回到原始披露结束。</h2></div>
          <Link href={LANDING_PRIMARY_CTA.href} className="final-entry">进入华夏股票研究终端 <ChevronRight size={18} /></Link>
        </section>
      </main>

      <footer className="landing-footer"><span>HUAXIA STOCK RESEARCH TERMINAL © 2026</span><span>所有数据均来自公开披露，不构成投资建议。</span><span>CN / PUBLIC RESEARCH</span></footer>

    </div>
  );
}
