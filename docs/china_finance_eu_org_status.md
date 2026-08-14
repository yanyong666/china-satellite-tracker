# china-finance.eu.org 域名接入状态

> 本文仅记录账户控制台中已显示的配置事实，不代表域名已经完成注册或解析。

## Cloudflare DNS Zone

| 项目 | 当前值 |
| --- | --- |
| 域名 | `china-finance.eu.org` |
| Cloudflare 套餐 | Free（US$0） |
| 扫描到的现有 DNS 记录 | 0 条 |
| 当前状态 | 等待上游注册机构委派 Cloudflare Nameserver |

## EU.org 申请表应填写的 Nameserver

| EU.org 字段 | 值 |
| --- | --- |
| Name1 | `augustus.ns.cloudflare.com` |
| Name2 | `deb.ns.cloudflare.com` |

在 EU.org 审核通过并完成上述 Nameserver 委派前，Cloudflare 不能将该 Zone 激活；此时不应为根域手动添加指向 Worker 的 A/AAAA/CNAME 记录。待 Zone 激活后，再在 Cloudflare Workers 的 `stock-terminal` 服务中添加 `china-finance.eu.org` 作为自定义域。

## EU.org 表单状态

申请表的完整域名字段已填写为 `china-finance.eu.org`。Name1 已填写 `augustus.ns.cloudflare.com`，Name2 已填写 `deb.ns.cloudflare.com`；IP1、IP2 及其余 Name/IP 行均保持为空。

该申请已于 2026-08-12 提交。EU.org 的提交结果显示两条 Nameserver 均可解析，且针对 `china-finance.eu.org` 的 SOA 与 NS 校验均通过；申请引用编号为 `20260812124602-arf-40032`。当前等待 EU.org 的后续审核与顶级区域委派生效，审核或委派完成前不应尝试在 Worker 中添加该自定义域。

## 临时公开入口核验

`https://stock-terminal.yanyong-email.workers.dev/` 已于 2026-08-12 成功返回“华夏股票研究终端”主页面，并完成公开行情初始化。`/api/trpc/tracker.universe?input={"json":null}` 返回 5 只首期股票池标的；`/api/trpc/tracker.overview?input={"json":null}` 成功返回公开股票快照、指数、前复权日线及板块概览；携带 `stockId=china-satellite` 的 `tracker.market` 和 `tracker.research` 接口分别返回行情/日线与透明研究卡/公开披露来源。深层路径 `/research/china-satellite` 返回了带有“华夏股票研究终端”标题的 SPA 应用及其内部 NotFound 视图，而非 Cloudflare 边缘 404，说明 Worker 的 SPA 回退生效。旧 Pages 项目的最终处置状态仍待独立确认。

旧地址 `https://china-satellite-tracker.pages.dev` 于同日返回 HTTP 404（Cloudflare 响应），因此不再是有效生产入口。当前对外访问应使用 `stock-terminal.yanyong-email.workers.dev`，直至 `china-finance.eu.org` 获得 EU.org 委派并绑定到该 Worker。

## EU.org 创建状态截图

用户于 2026-08-13 提供的 EU.org 账户截图中，状态行清晰显示 `Domain Created Updated DNSSEC Flags`。该截图可确认 EU.org 已创建相应域名记录；但截图未显示域名文本、Nameserver 委派明细或 Cloudflare Zone 的 `Active` 状态。因此，下一步仍须在 Cloudflare 控制台核验 Zone 已激活后，才能将 `china-finance.eu.org` 绑定至 `stock-terminal` Worker。

随后在 Cloudflare Zone 概览中确认，`china-finance.eu.org` 目前显示“正在等待注册机构传播新的名称服务器”。控制台给出的预期是通常 1–2 小时、最长可达 24 小时，并保留“立即检查名称服务器”入口。该 Zone 尚未激活，且当前状态为“未连接 Workers”；因此此刻不应执行自定义域绑定，待 Cloudflare 变为 `Active` 后再继续。

已执行 Cloudflare 的“立即检查名称服务器”。控制台确认正在检查 `china-finance.eu.org` 的 Nameserver，并提示“请等待几个小时进行更新”；检查后状态仍为等待注册机构传播，故未进行 Worker 绑定。

## 公共 DNS 与注册记录核验

在 2026-08-13 的查询中，Cloudflare DNS over HTTPS 与 Google Public DNS 对 `china-finance.eu.org` 的 NS 查询均返回 `Status: 3`（NXDOMAIN），并在权威区段中仅返回 `eu.org` 的 SOA；这表示该子域的委派记录尚未在公共递归解析器中可见。RDAP 对该三级域的请求没有返回可用域名对象；直接 WHOIS 服务查询也未返回可解析的域名条目。该阶段与 Cloudflare 控制台“等待注册机构传播”状态一致，不能据此认为域名已完成公开委派。

Cloudflare 已于同日拉取并部署最新 GitHub 构建：`https://stock-terminal.yanyong-email.workers.dev/` 根路径现显示“华夏股票研究终端”品牌标题页，且其主入口指向 `/terminal`。这确认 `stock-terminal` Worker 已基于包含品牌首页的最新代码运行。

在标题页部署完成后的复查中，公共 NS 查询仍返回 `Status: 3`（NXDOMAIN）；父区域 `eu.org` 的 SOA 序列号已从 `2026081305` 更新为 `2026081307`，但该响应中仍未包含 `china-finance.eu.org` 的 NS 记录。因此，当前可确认父区域正在更新，但尚不能确认已完成该子域到 Cloudflare 的公开委派。

2026-08-13 后续复查（Cloudflare DNS-over-HTTPS）中，`china-finance.eu.org` 的 NS 与 SOA 查询仍为 `Status: 3`（NXDOMAIN），Authority 仅含父区域 `eu.org` 的 SOA，序列号为 `2026081309`；A 查询也未得到可用记录。较早的父区序列号已有变化，但该三级域仍未公开委派至 `augustus.ns.cloudflare.com` 与 `deb.ns.cloudflare.com`。因此保持 `stock-terminal.yanyong-email.workers.dev` 为当前公开入口，不执行 Worker 自定义域绑定。

同日以 Google Public DNS 交叉查询 NS 与 SOA，亦从 `108.61.167.174` 返回 `Status: 3` 和相同的父区 `eu.org` SOA（序列号 `2026081309`）。两家独立公共递归解析器结果一致，确认此时并非单一缓存差异。

在终端导航改造发布后的再次交叉查询中，Cloudflare DNS over HTTPS 与 Google Public DNS 的 NS 响应仍同为 `Status: 3`（NXDOMAIN），且均只返回父区 `eu.org` 的 SOA，序列号为 `2026081316`。这表示父区已有后续更新，但 `china-finance.eu.org` 仍未公开委派至 Cloudflare Nameserver；每日自动核验保持启用，当前继续使用 `stock-terminal.yanyong-email.workers.dev`。

随后对该域 SOA 的单独查询仍返回 `Status: 3`（NXDOMAIN），父区 `eu.org` SOA 序列号更新为 `2026081317`，但响应未出现 `china-finance.eu.org` 的权威记录。该变化不足以证明委派完成，继续等待每日自动核验确认 NS 记录实际出现。

同一序列号下的 Cloudflare DNS over HTTPS 与 Google Public DNS NS 查询均仍返回 `Status: 3`，且均未提供该子域 NS Answer。这再次排除了单一递归缓存造成的假阴性。

随后使用已连接的浏览器访问 Cloudflare Dashboard 账户首页，页面两次均显示“Dashboard is temporarily unavailable”，因此当时无法通过控制台读取 Zone 激活状态或进行绑定操作。公共 DNS 仍为未委派状态，故该控制台暂时不可用不阻塞当前的安全等待策略；不应在未恢复前重复提交配置修改。

最新外部 DNS 生效核验中，Cloudflare DNS over HTTPS 与 Google Public DNS 对 `NS`、`SOA`（Cloudflare 另查 `A`）的结果一致：均为 `Status: 3`（NXDOMAIN），未返回该三级域的 Answer，Authority 只包含父区 `eu.org` 的 SOA，序列号已更新为 `2026081400`。这表明父区有新版本但尚未产生 `china-finance.eu.org` 的公开委派；仍不可绑定自定义域。

每日自动核验在 2026-08-14 触发后，随后的即时复查显示 Cloudflare 与 Google 的 NS 查询仍为 `Status: 3`，Cloudflare A 查询同样为 `Status: 3`；两者父区 SOA 序列号均已更新至 `2026081403`。父区仍在变化，但尚未公开委派该子域，继续等待。

最新复核中，Cloudflare 与 Google 的 NS、SOA 查询，以及 Cloudflare 的 A 查询仍全部返回 `Status: 3`（NXDOMAIN），Authority 仅包含 `eu.org` 的 SOA；两家解析器一致显示父区序列号更新至 `2026081405`。这说明父区继续变化，但 `china-finance.eu.org` 尚未获得公开 NS 委派，仍不能绑定到 Worker。

再次检测中，Cloudflare 与 Google 对 NS、SOA 的结果，以及 Cloudflare 对 A 的结果继续一致为 `Status: 3`（NXDOMAIN）；父区 SOA 序列号进一步更新至 `2026081406`。因此仍未出现 `augustus.ns.cloudflare.com` 或 `deb.ns.cloudflare.com` 的公开委派，保持等待，不修改生产 DNS 或 Worker 域名设置。

同轮在已登录 Cloudflare 控制台对 Zone 概览进行了只读复核。界面明确显示“正在等待注册机构传播新的名称服务器”，列出待委派的 `augustus.ns.cloudflare.com` 与 `deb.ns.cloudflare.com`，并显示当前“未连接 Workers”。Zone 仍为 Free 计划、DNS 设置为“完全”，但尚未激活；这一状态与两家公共解析器的 NXDOMAIN 结果一致。因此本轮未点击“连接 Worker”或修改任何域名配置。

随后刷新 Zone 概览，仍显示相同的“正在等待注册机构传播新的名称服务器”状态及“未连接 Workers”提示，说明 Cloudflare 尚未接收到可激活该 Zone 的权威委派。本次刷新仅用于状态核验，未触发名称服务器检查、未创建 DNS 记录，也未连接 `stock-terminal` Worker。

作为补充的第三方交叉核验，AdGuard 公共 DNS 对该域的 NS 查询也返回 `Status: 3`（NXDOMAIN）。该结果与 Cloudflare DNS over HTTPS、Google Public DNS 的既有结果一致，进一步支持“当前尚无公开委派”的结论。

在本轮后续的 Cloudflare Zone 只读刷新中，控制台继续显示“正在等待注册机构传播新的名称服务器”，并保持“未连接 Workers”。界面仍列出 `augustus.ns.cloudflare.com` 与 `deb.ns.cloudflare.com` 作为待传播的委派目标，未显示 Zone Active、可用地址记录或可访问的自定义域。未点击名称服务器检查、连接 Worker 或任何配置变更入口。

启用 DNSSEC 数据的 NS 查询仍返回 `Status: 3`（NXDOMAIN）。响应中出现的是父区 `eu.org` 的已签名 SOA 与否定证明记录，而非 `china-finance.eu.org` 的委派记录；因此该结果不改变“公开委派尚未生效”的判断。

为排除递归解析器缓存影响，本轮使用标准 DNS 工具直接向 EU.org 权威名称服务器 `ns.eu.org` 查询该域。NS 与 SOA 查询均返回权威 `NXDOMAIN`（响应带 `aa` 标志），Authority 中仅为父区 `EU.ORG` 的 SOA，序列号仍为 `2026081406`；`dig +trace` 也在 EU.org 权威层结束，未出现目标域的委派 NS。故可以确认：截至本次直接权威查询，EU.org 父区尚未发布 `china-finance.eu.org` 的公开委派，不能绑定 Worker。

进一步向另一台 EU.org 权威名称服务器 `gra.wolfhugel.eu` 直接查询 NS，得到同样带 `aa` 标志的权威 `NXDOMAIN` 与父区 SOA `2026081406`。两台独立权威节点结果一致，未发现区域同步差异或已发布但未传播的委派记录。

第三台 EU.org 权威名称服务器 `ns3.keltia.net` 的直接 NS 查询同样带 `aa` 标志返回 `NXDOMAIN`，Authority 仍仅为父区 SOA `2026081406`。至此三台不同权威节点的结果一致：目标域尚未在 EU.org 父区发布委派。

第四台 EU.org 权威名称服务器 `ns.bortzmeyer.eu.org` 也直接返回带 `aa` 标志的 `NXDOMAIN`，父区 SOA 仍为 `2026081406`。多个权威节点的持续一致性表明当前不存在局部节点同步差异，委派记录仍未发布。

后续在已登录 Cloudflare 控制台只读打开 Zone 概览时，页面仍停留在“内容加载/正在加载”状态，未呈现可用的 Zone Active 或 Worker 连接状态。该未完成加载不作为状态改变证据；继续以已获得的权威 DNS NXDOMAIN 结论作为是否禁止绑定的依据，未进行任何控制台配置修改。

在随后的完整加载复核中，Cloudflare Zone 概览明确显示“正在等待注册机构传播新的名称服务器”，并显示“未连接 Workers”；界面继续列出 `augustus.ns.cloudflare.com` 与 `deb.ns.cloudflare.com` 作为待传播的 Nameserver。这与权威 DNS 的 NXDOMAIN 一致，说明 Zone 仍未激活。本次仅进行查看，未点击“立即检查名称服务器”、未连接 Worker，也未修改 DNS。
