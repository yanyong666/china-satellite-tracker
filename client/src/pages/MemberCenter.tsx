import { memberTrpc } from "@/lib/cloudflareMemberTrpc";
import { SITE_ROUTES } from "@/lib/siteRoutes";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, BarChart3, Bookmark, ChevronRight, CircleUserRound, Database, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

function MemberStateNotice({ message }: { message: string }) {
  return <section className="member-notice">
    <ShieldCheck size={22} />
    <div><span>SECURE MEMBER ACCESS</span><h2>{message}</h2><p>会员资料与研究收藏仅通过已登录会话关联；公开行情和原始披露仍不要求登录。</p></div>
  </section>;
}

function memberServiceMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : "";
  if (raw.includes("Unexpected token") || raw.includes("Failed to fetch") || raw.includes("Not Found")) {
    return "会员服务正在部署中";
  }
  return raw || "会员身份暂不可用。";
}

export default function MemberCenter() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  const selectedStockId = params.get("stock");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const sessionQuery = memberTrpc.auth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const profileQuery = memberTrpc.member.profile.useQuery(undefined, { enabled: Boolean(sessionQuery.data), retry: false, refetchOnWindowFocus: false });
  const register = memberTrpc.auth.register.useMutation({ onSuccess: () => void sessionQuery.refetch() });
  const login = memberTrpc.auth.login.useMutation({ onSuccess: () => void sessionQuery.refetch() });
  const logout = memberTrpc.auth.logout.useMutation({ onSuccess: () => void sessionQuery.refetch() });
  const saveStock = memberTrpc.member.saveStock.useMutation({ onSuccess: () => profileQuery.refetch() });
  const removeStock = memberTrpc.member.removeStock.useMutation({ onSuccess: () => profileQuery.refetch() });
  const overviewQuery = trpc.tracker.overview.useQuery(undefined, { refetchInterval: 60_000, refetchOnWindowFocus: true });
  const overviewMap = useMemo(() => {
    const map = new Map<string, { price: number; change: number; changePct: number; updated: boolean }>();
    for (const item of overviewQuery.data ?? []) {
      if (item.snapshot) {
        map.set(item.stock.id, {
          price: item.snapshot.price,
          change: item.snapshot.change,
          changePct: item.snapshot.changePct,
          updated: true,
        });
      }
    }
    return map;
  }, [overviewQuery.data]);

  const submitAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    try {
      if (mode === "register") await register.mutateAsync({ email, displayName: displayName || undefined, password });
      else await login.mutateAsync({ email, password });
    } catch (error) {
      setFormError(memberServiceMessage(error));
    }
  };

  const requestSave = async () => {
    if (!selectedStockId) return;
    await saveStock.mutateAsync({ stockId: selectedStockId as "china-satellite" | "torch-electronics" | "naura" | "zhongji-innolight" | "catl" });
    navigate(SITE_ROUTES.member);
  };

  const profile = profileQuery.data;
  const isSessionLoading = sessionQuery.isLoading || sessionQuery.isFetching;
  const hasSession = Boolean(sessionQuery.data);
  const serviceError = sessionQuery.error && !(sessionQuery.error as { data?: { code?: string } }).data?.code?.includes("UNAUTHORIZED") ? memberServiceMessage(sessionQuery.error) : "";

  return <div className="member-shell">
    <header className="member-header"><Link href={SITE_ROUTES.home} className="member-brand"><span><BarChart3 size={17} /></span><div><small>HUAXIA / MEMBER DESK</small><strong>会员研究工作台</strong></div></Link><nav><Link href={SITE_ROUTES.terminal}>研究终端</Link><Link href={SITE_ROUTES.home}>品牌首页</Link></nav></header>
    <main className="member-main">
      <section className="member-hero"><div><span className="member-overline">PRIVATE RESEARCH WORKSPACE</span><h1>把关注标的，<em>留在自己的研究清单。</em></h1><p>会员中心只保存你的账户身份与主动收藏的股票标识；不保存交易密码，不代管证券账户，也不构成投资建议。</p></div><div className="member-protocol"><span>IDENTITY</span><strong>Private Session</strong><small>Worker 哈希密码 · HttpOnly 会话 Cookie</small><span>STORAGE</span><strong>D1 Scoped Data</strong><small>邮箱与收藏标的组成唯一记录</small></div></section>

      {isSessionLoading ? <MemberStateNotice message="正在读取会员会话" /> : serviceError ? <MemberStateNotice message={serviceError} /> : !hasSession ? <section className="member-auth-card"><div><span className="member-overline">MEMBER ACCESS / NO PAYMENT</span><h2>{mode === "login" ? "登录研究工作台" : "创建你的研究工作台"}</h2><p>不需要银行卡或支付信息。密码只在 Worker 端进行安全哈希，系统不会保存明文密码或证券账户凭据。</p></div><div className="auth-mode"><button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>登录</button><button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>注册</button></div><form onSubmit={event => void submitAuth(event)}><label>邮箱<input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="researcher@example.com" /></label>{mode === "register" ? <label>显示名称（可选）<input value={displayName} onChange={event => setDisplayName(event.target.value)} maxLength={80} placeholder="研究者" /></label> : null}<label>密码<input required type="password" value={password} onChange={event => setPassword(event.target.value)} minLength={12} maxLength={128} placeholder="至少 12 个字符" /></label>{formError ? <p className="auth-error">{formError}</p> : null}<button className="auth-submit" disabled={register.isPending || login.isPending}>{register.isPending || login.isPending ? <><Loader2 className="animate-spin" size={15} /> 处理中</> : mode === "login" ? "登录会员中心" : "创建无卡会员账户"}<ChevronRight size={15} /></button></form><small className="auth-note">连续错误登录将被暂时限制。注册即表示你同意仅将本服务用于公开研究清单管理。</small></section> : <>
        <section className="member-account"><div className="account-avatar"><CircleUserRound size={30} /></div><div><span>ACCOUNT / MEMBER EMAIL</span><h2>{profile?.displayName ?? sessionQuery.data?.displayName ?? "研究会员"}</h2><p>{profile?.email ?? sessionQuery.data?.email}</p></div><Link href={SITE_ROUTES.terminal} className="account-terminal">进入研究终端 <ArrowUpRight size={14} /></Link><button className="account-logout" onClick={() => logout.mutate()}><LogOut size={13} /> 退出</button></section>

        {selectedStockId ? <section className="member-save-prompt"><Bookmark size={20} /><div><span>READY TO SAVE</span><strong>将当前终端标的加入研究清单</strong><small>{selectedStockId}</small></div><button disabled={saveStock.isPending} onClick={() => void requestSave()}>{saveStock.isPending ? "保存中" : "确认收藏"} <ChevronRight size={14} /></button></section> : null}

        <section className="member-saved"><div className="saved-heading"><div><span className="member-overline">SAVED RESEARCH</span><h2>已收藏标的</h2></div><span>{profile?.savedStocks.length ?? 0} 项</span></div>
          {profile?.savedStocks.length ? <div className="saved-list">{profile.savedStocks.map(entry => {
            const quote = overviewMap.get(entry.stockId);
            const positive = (quote?.change ?? 0) >= 0;
            return <article key={entry.stockId}><div className="saved-mark"><Bookmark size={16} /></div><div><small>{entry.stock?.sector ?? "股票池标的"}</small><h3>{entry.stock?.name ?? entry.stockId}</h3><p>{entry.stock?.code ?? entry.stockId}</p></div><div className="saved-quote">{quote ? <><strong className={positive ? "up" : "down"}>{quote.price.toFixed(2)}</strong><small className={positive ? "up" : "down"}>{positive ? "+" : ""}{quote.change.toFixed(2)} · {positive ? "+" : ""}{quote.changePct.toFixed(2)}%</small></> : <span className="quote-pending">行情同步中</span>}</div><Link href={`${SITE_ROUTES.terminal}?stock=${entry.stockId}`}>查看终端 <ArrowUpRight size={14} /></Link><button onClick={() => removeStock.mutate({ stockId: entry.stockId as "china-satellite" | "torch-electronics" | "naura" | "zhongji-innolight" | "catl" })}>移除</button></article>;
          })}</div> : <div className="saved-empty"><Database size={22} /><div><h3>尚未收藏标的</h3><p>从研究终端选择重点公司，建立个人的公开研究工作清单。</p></div><Link href={SITE_ROUTES.terminal}>浏览股票池 <ChevronRight size={14} /></Link></div>}
        </section>
      </>}
    </main>
    <footer className="member-footer">所有数据均来自公开披露，不构成投资建议。会员数据仅用于维护个人研究清单。</footer>
    <style>{`
      .member-shell{min-height:100vh;background:#f1eee7;color:#0b1020;font-family:var(--font-sans)}.member-header{height:76px;display:flex;justify-content:space-between;align-items:center;padding:0 clamp(20px,5vw,72px);border-bottom:1px solid rgba(11,16,32,.15)}.member-brand{display:flex;gap:10px;align-items:center;text-decoration:none;color:inherit}.member-brand>span{display:grid;place-items:center;width:34px;height:34px;background:#d31e2a;color:#fff;box-shadow:4px 4px 0 #0b1020}.member-brand small{display:block;color:#74747a;font:700 8px var(--font-mono);letter-spacing:.15em}.member-brand strong{display:block;margin-top:3px;font:700 16px var(--font-serif);letter-spacing:.04em}.member-header nav{display:flex;gap:20px}.member-header nav a{color:#303644;text-decoration:none;font-size:12px;font-weight:700}.member-main{max-width:1180px;margin:auto;padding:clamp(45px,7vw,92px) clamp(20px,5vw,72px)}.member-hero{display:grid;grid-template-columns:1.1fr .9fr;gap:55px;padding-bottom:54px;border-bottom:1px solid rgba(11,16,32,.16)}.member-overline,.member-protocol span,.member-account span,.member-save-prompt span{display:block;color:#ab1f29;font:700 9px var(--font-mono);letter-spacing:.15em}.member-hero h1{max-width:600px;margin:16px 0;font:700 clamp(40px,5vw,70px)/.98 var(--font-serif);letter-spacing:-.055em}.member-hero h1 em{color:#d31e2a;font-style:normal}.member-hero p{max-width:520px;color:#5c606a;font-size:14px;line-height:1.8}.member-protocol{align-self:end;display:grid;grid-template-columns:1fr auto;gap:8px 20px;padding:22px;border:1px solid rgba(11,16,32,.18);background:#111827;color:#f4f0e7;box-shadow:10px 10px 0 #d5d0c5}.member-protocol span{color:#e96770}.member-protocol strong{font:700 19px var(--font-serif)}.member-protocol small{grid-column:1/-1;padding-bottom:12px;color:#aeb7c5;font-size:10px;border-bottom:1px solid rgba(255,255,255,.12)}.member-protocol small:last-child{padding-bottom:0;border:0}.member-notice{display:flex;gap:16px;align-items:flex-start;max-width:720px;margin:52px auto;padding:25px;border-left:4px solid #d31e2a;background:#fffdfa;box-shadow:8px 8px 0 #d7d1c6}.member-notice>svg{color:#d31e2a;flex:none}.member-notice span{color:#a21e26;font:700 9px var(--font-mono);letter-spacing:.13em}.member-notice h2{margin:7px 0;font:700 26px var(--font-serif)}.member-notice p{margin:0;color:#666a73;font-size:12px;line-height:1.65}.member-account{display:flex;align-items:center;gap:15px;padding:26px 0;border-bottom:1px solid rgba(11,16,32,.15)}.account-avatar{display:grid;place-items:center;width:54px;height:54px;background:#d31e2a;color:#fff}.member-account h2{margin:5px 0 2px;font:700 25px var(--font-serif)}.member-account p{margin:0;color:#636772;font:12px var(--font-mono)}.account-terminal{margin-left:auto;display:flex;gap:6px;align-items:center;color:#151b2c;font-size:12px;font-weight:700;text-decoration:none}.member-save-prompt{display:flex;align-items:center;gap:12px;margin-top:22px;padding:16px;background:#101827;color:#f4f0e7}.member-save-prompt>svg{color:#e7bd69}.member-save-prompt strong,.member-save-prompt small{display:block}.member-save-prompt strong{margin:4px 0;font-size:13px}.member-save-prompt small{color:#9ca8b8;font:10px var(--font-mono)}.member-save-prompt button{margin-left:auto;display:flex;gap:5px;align-items:center;border:0;background:#d31e2a;color:#fff;padding:9px 11px;font-size:11px;font-weight:700;cursor:pointer}.member-saved{margin-top:48px}.saved-heading{display:flex;justify-content:space-between;align-items:end;border-bottom:1px solid rgba(11,16,32,.15);padding-bottom:13px}.saved-heading h2{margin:5px 0 0;font:700 31px var(--font-serif)}.saved-heading>span{color:#74777c;font:11px var(--font-mono)}      .saved-list article{display:grid;grid-template-columns:auto 1fr auto auto auto;gap:16px;align-items:center;padding:16px 4px;border-bottom:1px solid rgba(11,16,32,.12)}.saved-quote{text-align:right}.saved-quote strong{display:block;font:500 16px var(--font-mono);letter-spacing:-.04em}.saved-quote small{display:block;font:11px var(--font-mono);margin-top:2px}.saved-quote .up{color:#b33b3b!important}.saved-quote .down{color:#1a7f76!important}.quote-pending{color:#777b84;font:10px var(--font-mono)}.saved-mark{display:grid;place-items:center;width:35px;height:35px;color:#c7232e;background:#f0d7d5}.saved-list small{color:#797c82;font-size:10px}.saved-list h3{margin:3px 0;font:700 18px var(--font-serif)}.saved-list p{margin:0;color:#8a8d92;font:10px var(--font-mono)}.saved-list a{display:flex;align-items:center;gap:5px;color:#192036;font-size:11px;font-weight:700;text-decoration:none}.saved-list button{border:1px solid rgba(11,16,32,.2);background:transparent;color:#5f636b;padding:6px 8px;font-size:10px;cursor:pointer}.saved-empty{display:flex;align-items:center;gap:13px;padding:35px 0;color:#5f636b}.saved-empty>svg{color:#c4202b}.saved-empty h3{margin:0 0 6px;font:700 20px var(--font-serif);color:#111628}.saved-empty p{margin:0;font-size:12px}.saved-empty a{margin-left:auto;display:flex;gap:5px;align-items:center;color:#182033;font-size:11px;font-weight:700;text-decoration:none}.member-footer{padding:18px clamp(20px,5vw,72px);background:#0b1020;color:#aeb5c0;font:9px var(--font-mono);letter-spacing:.05em}@media(max-width:720px){.member-header{height:65px}.member-header nav{gap:12px}.member-header nav a{font-size:10px}.member-brand strong{font-size:14px}.member-hero{grid-template-columns:1fr;gap:28px}.member-protocol{max-width:420px}.member-account{align-items:flex-start;flex-wrap:wrap}.account-terminal{margin-left:69px}.member-save-prompt{align-items:flex-start;flex-wrap:wrap}.member-save-prompt button{margin-left:32px}.saved-list article{grid-template-columns:auto 1fr auto}.saved-quote{grid-column:1/-1;text-align:left;display:flex;gap:12px;align-items:baseline;padding-top:4px;border-top:1px dashed rgba(11,16,32,.08)}.saved-list a,.saved-list button{grid-column:auto}.saved-empty{align-items:flex-start;flex-wrap:wrap}.saved-empty a{margin:4px 0 0 35px}.member-footer{line-height:1.6}}
    `}</style>
    <style>{`
      .member-auth-card{max-width:680px;margin:52px auto;padding:28px;border:1px solid rgba(11,16,32,.18);background:#fffdfa;box-shadow:10px 10px 0 #d7d1c6}.member-auth-card h2{margin:8px 0;font:700 32px var(--font-serif)}.member-auth-card>div>p{margin:0;color:#626672;font-size:12px;line-height:1.7}.auth-mode{display:flex;gap:8px;margin:24px 0 15px}.auth-mode button{border:1px solid rgba(11,16,32,.2);background:transparent;padding:8px 12px;color:#515661;font-size:11px;font-weight:700;cursor:pointer}.auth-mode button.active{background:#101827;color:#fff;border-color:#101827}.member-auth-card form{display:grid;gap:13px}.member-auth-card label{display:grid;gap:6px;color:#343946;font-size:11px;font-weight:700}.member-auth-card input{width:100%;box-sizing:border-box;border:1px solid rgba(11,16,32,.22);background:#fff;padding:11px 12px;color:#101827;font-size:13px;outline:0}.member-auth-card input:focus{border-color:#d31e2a;box-shadow:0 0 0 3px rgba(211,30,42,.1)}.auth-submit{display:flex;align-items:center;justify-content:center;gap:7px;border:0;background:#d31e2a;color:#fff;padding:12px;font-size:12px;font-weight:700;cursor:pointer}.auth-submit:disabled{opacity:.6}.auth-error{margin:0;color:#b4222c;font-size:11px}.auth-note{display:block;margin-top:16px;color:#777b84;font-size:10px;line-height:1.6}.account-logout{display:flex;align-items:center;gap:5px;border:1px solid rgba(11,16,32,.2);background:transparent;color:#555b65;padding:7px 9px;font-size:10px;cursor:pointer}@media(max-width:720px){.member-auth-card{margin:32px auto;padding:20px}}
    `}</style>
  </div>;
}
