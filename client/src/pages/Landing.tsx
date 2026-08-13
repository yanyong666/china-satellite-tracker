import { LANDING_PRIMARY_CTA, LANDING_PRINCIPLES } from "@/lib/landingContent";
import { SITE_ROUTES } from "@/lib/siteRoutes";
import { Activity, ArrowUpRight, BarChart3, ChevronRight, CircleDot, Database, Globe, Layers3, Radar, RefreshCw, Search, ShieldCheck, TrendingUp } from "lucide-react";
import React from "react";
import { Link } from "wouter";

const signalCards = [
  { label: "研究覆盖", value: "05", detail: "重点板块 · 首期股票池" },
  { label: "行情机制", value: "60s", detail: "打开即取 · 定时刷新" },
  { label: "研究口径", value: "100%", detail: "公开披露 · 来源可查" },
] as const;

const tickerItems = ["沪深市场快照", "板块相对强弱", "透明个股评分", "披露事件跟踪", "资金结构说明"] as const;

export default function Landing() {
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

      <style>{`
        .landing-shell{--ink:#0b1020;--paper:#f1eee7;--muted:#9c9ca0;--red:#d31e2a;--line:rgba(9,13,26,.15);min-height:100vh;overflow:hidden;position:relative;background:var(--paper);color:var(--ink);font-family:var(--font-sans)}.landing-grid{position:absolute;inset:0;pointer-events:none;opacity:.5;background-image:linear-gradient(rgba(13,17,31,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(13,17,31,.055) 1px,transparent 1px);background-size:42px 42px;mask-image:linear-gradient(to bottom,black 0%,black 42%,transparent 81%)}.landing-header,.landing-ticker,main,.landing-footer{position:relative;z-index:1}.landing-header{height:82px;padding:0 clamp(20px,5vw,72px);display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}.landing-brand{color:inherit;text-decoration:none;display:flex;align-items:center;gap:11px}.landing-brand-mark{display:grid;place-items:center;width:36px;height:36px;color:#fff;background:var(--red);box-shadow:5px 5px 0 var(--ink)}.landing-brand small{display:block;color:#74747a;font:700 9px var(--font-mono);letter-spacing:.14em}.landing-brand strong{display:block;margin-top:2px;font:700 17px var(--font-serif);letter-spacing:.04em}.landing-nav{display:flex;align-items:center;gap:28px}.landing-nav a{color:#333745;text-decoration:none;font-size:12px;font-weight:650}.landing-nav-cta{display:flex;align-items:center;gap:5px!important;padding:9px 12px;background:var(--ink);color:#fff!important}.landing-ticker{height:38px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:22px;padding:0 clamp(20px,5vw,72px);background:var(--ink);color:#f4f0e7;font:10px var(--font-mono);letter-spacing:.05em}.ticker-status{display:flex;gap:7px;align-items:center;color:#fff0e6}.ticker-status svg{color:#ff675f}.ticker-items{display:flex;gap:22px;min-width:0;overflow:hidden;white-space:nowrap}.ticker-items span{display:flex;align-items:center;gap:6px;color:#b9bbc4}.ticker-items svg{color:#d52a34}.ticker-date{color:#e84d55}.landing-hero{min-height:610px;display:grid;grid-template-columns:minmax(0,1.02fr) minmax(420px,.98fr);gap:clamp(30px,7vw,110px);align-items:center;max-width:1380px;padding:clamp(70px,10vw,130px) clamp(20px,5vw,72px) 78px;margin:auto}.landing-copy{max-width:650px}.eyebrow{display:flex;gap:9px;align-items:center;color:#ab1f29;font:700 10px var(--font-mono);letter-spacing:.16em}.eyebrow>span{width:23px;height:2px;background:var(--red)}.landing-copy h1{margin:21px 0 20px;font:700 clamp(48px,6vw,88px)/.94 var(--font-serif);letter-spacing:-.06em}.landing-copy h1 em{color:var(--red);font-style:normal}.landing-copy>p{max-width:510px;margin:0;color:#565966;font-size:15px;line-height:1.8}.landing-actions{display:flex;align-items:center;gap:23px;margin-top:34px}.primary-entry,.final-entry{display:inline-flex;align-items:center;gap:13px;background:var(--red);color:#fff;text-decoration:none;padding:15px 18px;font-weight:700;font-size:13px;box-shadow:8px 8px 0 var(--ink);transition:transform .18s var(--ease-out),box-shadow .18s var(--ease-out)}.primary-entry:hover,.final-entry:hover{transform:translate(3px,3px);box-shadow:5px 5px 0 var(--ink)}.primary-entry:active,.final-entry:active{transform:translate(5px,5px) scale(.97);box-shadow:3px 3px 0 var(--ink)}.secondary-entry{display:flex;align-items:center;gap:6px;color:#222735;font-size:12px;font-weight:700;text-decoration:none}.landing-proof{display:flex;flex-wrap:wrap;gap:11px 16px;margin-top:36px;padding-top:17px;border-top:1px solid var(--line)}.landing-proof span{display:flex;align-items:center;gap:5px;color:#696b74;font-size:10px}.landing-proof svg{color:#a91c26}.landing-stage{min-height:440px;position:relative;background:linear-gradient(138deg,#121a31,#080c19 68%);box-shadow:20px 22px 0 #d3cec4;overflow:hidden;isolation:isolate}.stage-topline{display:flex;justify-content:space-between;padding:14px 16px;color:#aeb4c5;border-bottom:1px solid rgba(255,255,255,.12);font:9px var(--font-mono);letter-spacing:.1em}.stage-orbit{position:absolute;border:1px solid rgba(221,34,47,.45);border-radius:50%;z-index:-1}.stage-orbit-a{width:520px;height:520px;right:-260px;bottom:-300px}.stage-orbit-b{width:330px;height:330px;right:-130px;bottom:-195px;border-color:rgba(255,255,255,.14)}.stage-screen{position:absolute;left:11%;right:9%;bottom:12%;padding:16px;border:1px solid rgba(255,255,255,.14);background:rgba(8,12,25,.69);box-shadow:0 20px 50px rgba(0,0,0,.27);backdrop-filter:blur(10px)}.screen-head,.screen-market,.screen-grid{display:flex;align-items:center;justify-content:space-between}.screen-head{color:#aeb6c3;font:9px var(--font-mono);letter-spacing:.1em}.screen-head span{display:flex;align-items:center;gap:5px}.screen-head i{width:6px;height:6px;border-radius:50%;background:#ea313c;box-shadow:0 0 0 4px rgba(234,49,60,.16)}.screen-market{padding:22px 0 15px}.screen-market>div{display:grid;gap:3px}.screen-market span{color:#d83742;font-size:10px}.screen-market strong{color:#f5f0e5;font:700 26px var(--font-mono);letter-spacing:-.07em}.screen-market small{color:#aab1be;font-size:11px}.screen-market b{color:#fa8b80;font:500 22px var(--font-mono);letter-spacing:-.07em}.screen-chart{height:128px;position:relative;border-top:1px solid rgba(255,255,255,.1);border-bottom:1px solid rgba(255,255,255,.1);background:repeating-linear-gradient(to bottom,transparent 0,transparent 31px,rgba(255,255,255,.05) 32px)}.screen-chart svg{width:100%;height:100%;overflow:visible}.screen-chart path:first-child{stroke:#e22935;stroke-width:2.3}.screen-chart .chart-fill{fill:url(#none);fill:rgba(226,41,53,.12)}.chart-point{position:absolute;width:7px;height:7px;border:2px solid #f5f0e5;border-radius:50%;background:#d92330;z-index:1}.chart-point-one{left:31%;top:50%}.chart-point-two{left:60%;top:23%}.chart-point-three{right:4%;top:10%}.screen-grid{gap:8px;margin-top:14px}.screen-grid span{flex:1;color:#aeb7c5;font-size:9px}.screen-grid b{display:block;margin-top:4px;color:#f1ede3;font:600 11px var(--font-mono)}.stage-quote{position:absolute;display:grid;gap:5px;padding:12px 13px;border:1px solid rgba(255,255,255,.13);background:rgba(14,20,39,.88);box-shadow:9px 9px 0 rgba(0,0,0,.17)}.stage-quote span{color:#929bad;font:9px var(--font-mono);letter-spacing:.1em}.stage-quote strong{color:#f4f0e7;font:700 17px var(--font-serif);letter-spacing:.08em}.stage-quote small{display:flex;align-items:center;gap:5px;color:#c0c6d1;font-size:9px}.stage-quote-primary{left:6%;top:17%;border-left:3px solid var(--red)}.stage-quote-secondary{right:4%;top:27%;border-left:3px solid #e6b95e}.stage-corner{position:absolute;right:14px;bottom:14px;display:flex;gap:7px;color:#bcc5d0;font-size:9px;line-height:1.4}.stage-corner svg{color:#e33a44}.landing-signals{display:grid;grid-template-columns:repeat(3,1fr);max-width:1380px;margin:0 auto;padding:0 clamp(20px,5vw,72px);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.landing-signals article{display:flex;gap:16px;padding:24px 18px;border-right:1px solid var(--line)}.landing-signals article:first-child{padding-left:0}.landing-signals article:last-child{border-right:0}.landing-signals article>span{color:#aaa8a2;font:10px var(--font-mono)}.landing-signals small{display:block;color:#85858a;font-size:10px}.landing-signals strong{display:block;margin:3px 0;color:#111728;font:700 28px var(--font-serif)}.landing-signals p{margin:0;color:#585b65;font-size:10px}.landing-method{display:grid;grid-template-columns:.75fr 1.25fr;gap:clamp(30px,7vw,110px);max-width:1380px;padding:clamp(80px,10vw,130px) clamp(20px,5vw,72px);margin:auto}.method-intro h2,.landing-final h2{margin:15px 0 0;font:700 clamp(34px,4vw,58px)/.98 var(--font-serif);letter-spacing:-.05em}.method-list{border-top:1px solid var(--line)}.method-list article{display:grid;grid-template-columns:30px 1fr auto;gap:15px;padding:22px 0;border-bottom:1px solid var(--line)}.method-list svg{color:#c9232d}.method-list strong{display:block;color:#171c2b;font-size:15px}.method-list p{max-width:390px;margin:7px 0 0;color:#666974;font-size:12px;line-height:1.65}.method-list article>span{color:#a7a5a0;font:10px var(--font-mono)}.landing-final{display:flex;align-items:end;justify-content:space-between;gap:30px;max-width:1380px;margin:0 auto;padding:55px clamp(20px,5vw,72px);background:var(--ink);color:#f1eee7}.landing-final .eyebrow{color:#f0525b}.landing-final h2{max-width:650px}.final-entry{box-shadow:8px 8px 0 #f0ece3;white-space:nowrap}.landing-footer{display:flex;justify-content:space-between;gap:20px;padding:18px clamp(20px,5vw,72px);background:#0b1020;color:#9da5b4;font:9px var(--font-mono);letter-spacing:.06em}.landing-nav a:focus-visible,.primary-entry:focus-visible,.secondary-entry:focus-visible,.final-entry:focus-visible{outline:2px solid var(--red);outline-offset:4px}@media(max-width:900px){.landing-hero{grid-template-columns:1fr;gap:58px;padding-top:74px}.landing-stage{max-width:640px;width:100%;justify-self:center}.landing-method{grid-template-columns:1fr;gap:48px}.landing-final{align-items:flex-start;flex-direction:column}.landing-nav{gap:16px}.landing-nav>a:not(.landing-nav-cta){display:none}}@media(max-width:620px){.landing-header{height:70px}.landing-brand strong{font-size:14px}.landing-brand small{font-size:8px}.landing-ticker{grid-template-columns:1fr;height:32px}.ticker-items,.ticker-date{display:none}.landing-hero{padding-top:54px;padding-bottom:56px}.landing-copy h1{font-size:49px}.landing-copy>p{font-size:13px}.landing-actions{align-items:flex-start;flex-direction:column}.landing-stage{min-height:355px;box-shadow:11px 12px 0 #d3cec4}.stage-quote{transform:scale(.84);transform-origin:top left}.stage-quote-secondary{right:-7%;top:20%;transform-origin:top right}.stage-screen{left:6%;right:6%;bottom:9%;padding:13px}.screen-market{padding:16px 0 11px}.screen-market strong{font-size:20px}.screen-chart{height:97px}.landing-signals{grid-template-columns:1fr}.landing-signals article,.landing-signals article:first-child{padding:17px 0;border-right:0;border-bottom:1px solid var(--line)}.landing-signals article:last-child{border-bottom:0}.landing-method{padding-top:72px;padding-bottom:72px}.landing-footer{align-items:flex-start;flex-direction:column}.landing-footer span:last-child{display:none}}@media(prefers-reduced-motion:no-preference){.landing-stage{animation:stage-in .6s var(--ease-out) both}.landing-copy{animation:copy-in .55s var(--ease-out) both}.stage-orbit-a{animation:orbit 16s linear infinite}.stage-orbit-b{animation:orbit 12s linear infinite reverse}@keyframes stage-in{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes copy-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@keyframes orbit{to{transform:rotate(360deg)}}}
      `}</style>
    </div>
  );
}
