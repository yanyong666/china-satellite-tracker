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
