# Cloudflare 同域会员架构

## 现行结论

会员中心采用 **Cloudflare Worker + D1 自有账户体系**，不启用 Cloudflare Access 或 Zero Trust，因此不需要银行卡、支付信息或任何外部身份服务。公开研究页和 `/api/trpc/*` 始终保持公开；`/member/api/*` 仅通过 Worker 签发的服务器端会话识别会员。密码仅在 Worker 端以带随机盐的 PBKDF2-SHA256 哈希保存，浏览器获得 `HttpOnly`、`Secure`、`SameSite=Lax` 会话 Cookie；前端不会传入或决定用户身份。

| 层级 | 采用组件 | 职责 |
| --- | --- | --- |
| 身份验证 | Worker 自有注册与登录 | 最小账户资料、带随机盐的密码哈希与登录限流；不保存明文密码或证券账户凭据 |
| 请求鉴权 | `hx_member_session` Cookie + D1 会话表 | Worker 仅接受已哈希存储、未过期且未失效的服务器端会话；Cookie 不可由 JavaScript 读取 |
| 用户数据 | Cloudflare D1 | 保存账户、会话与主动收藏的股票标识；所有数据库写入采用参数化查询 [3] |
| 公开研究 | `stock-terminal` Worker | 根路径和 `/terminal` 继续公开；不要求注册即可看公开披露与行情 |

## 路由边界

公开内容和会员数据使用明确分层：`/` 与 `/terminal` 以及 `/api/trpc/*` 无身份依赖；`/member` 是前端会员入口；`/member/api/*` 由 Worker 优先处理，读取 Cookie 并执行会话校验。`wrangler.jsonc` 已将 `/member/api/*` 纳入 `run_worker_first`，避免资产 SPA 回退返回 HTML。

## 必要配置

1. 创建一个 D1 数据库并将其以 `MEMBER_DB` binding 绑定到 `stock-terminal` Worker。
2. 执行版本化迁移，创建会员、会话、限流和收藏表。
3. Worker 只允许通过注册或成功登录建立会话，并以 D1 中的会话哈希、有效期与版本进行校验。
4. 收藏接口只接受首期公开股票池中的 `stockId`，并通过复合主键去重。
5. 在自定义域生效后，同域 Cookie 自动覆盖会员页与 API；不需要外部密钥或支付账户。

## 已创建的 Cloudflare 资源

2026-08-13 已在 Cloudflare 账户 `2122c5da43c1f85da8abf563cbe93dc6` 创建 D1 数据库：

| 资源 | 值 | 状态 |
| --- | --- | --- |
| D1 数据库名称 | `stock-terminal-members` | 已创建 |
| D1 数据库 ID | `80f1a88c-850c-4393-a93b-960729d53058` | 已创建 |
| 当前表数量 | `0` | 等待同域会员迁移 |
| 计划 Worker binding | `MEMBER_DB` | 待绑定至 `stock-terminal` |

用户已于 2026-08-13 确认该数据库已在 Cloudflare 控制台绑定为 `stock-terminal` Worker 的 `MEMBER_DB`。仓库的 `wrangler.jsonc` 也包含相同 binding，以便 Git 自动部署不会覆盖控制台配置。

## 版本化 D1 迁移

迁移文件位于 `cloudflare/migrations/0001_members.sql`，会创建 `members` 与 `saved_stocks` 两张表。`saved_stocks` 使用 `(email, stock_id)` 复合主键，数据库层对同一会员重复收藏同一标的执行去重。迁移尚需在 D1 控制台运行；在 Access 身份策略与环境变量配置完成前，Worker 会员接口会明确返回“尚未配置”，不会接受任何由前端伪造的身份。

2026-08-13 已确认 Cloudflare D1 Console 页面可访问，数据库控制台含 SQL 输入框和“执行”按钮。下一项经用户确认的操作是执行 `cloudflare/migrations/0001_members.sql` 中仅包含 `CREATE TABLE IF NOT EXISTS` 与索引创建的非破坏性迁移。

迁移已于 2026-08-13 在 D1 Console 成功执行。Cloudflare 返回“此查询已成功执行”，响应时间 1241 毫秒、查询时间 0.79 毫秒。该迁移创建了 `members`、`saved_stocks` 以及 `saved_stocks_email_created_at_idx`，未插入、修改或删除任何会员数据。

Cloudflare Zero Trust 当前处于首次开通向导，提供 `Zero Trust 免费`（0 美元/席位/月，50 席位限制）、Standard 与 Enterprise 三种选项。会员同域方案只需免费档的 Access 一次性验证码与 HTTP 应用能力；用户此前已确认使用 Cloudflare 同域身份架构且不涉及付费服务，因此下一步将选择免费计划。

用户在 Zero Trust 免费计划页面确认系统实际要求填写银行卡并授权超额收费，因此未继续激活。用户已明确确认改用无卡自有账户方案。D1 Console 已重新加载，下一项操作是执行 `cloudflare/migrations/0002_self_auth.sql`：为现有空 `members` 表增加密码哈希、随机盐与会话版本字段，并创建服务器端会话与登录限流表；迁移不写入任何用户、密码或收藏数据。

`0002_self_auth.sql` 已于 2026-08-13 在 D1 Console 成功执行。Cloudflare 返回“此查询已成功执行”，响应时间 7550 毫秒、查询时间 0.27 毫秒。该操作仅扩展了认证表结构并创建 `member_sessions`、`member_login_locks` 及会话索引；未写入用户、明文密码、支付信息或任何证券账户信息。

最新 Git 提交 `86e780c` 已由 Cloudflare 部署到 `stock-terminal`。对 `https://stock-terminal.yanyong-email.workers.dev/member/api/auth.me` 的未登录请求返回 `application/json` 与 HTTP 401，tRPC 错误为“请先登录会员中心。”；这确认 `/member/api/*` 已由 Worker 优先处理，不再被 SPA fallback 返回 HTML，且自有会话鉴权已在生产 Worker 运行。

首次生产注册验证显示 Cloudflare Workers 的 PBKDF2 实现拒绝高于 `100000` 的迭代数（原先请求 `210000`，返回 `NotSupportedError`）。该问题未写入任何账户记录；下一版将使用 Workers 支持的最大 `100000` 次迭代并重新执行完整注册、会话和收藏验证。

随后已将迭代次数调整为 Workers 支持的 `100000`，并通过生产端到端验证：临时账户完成注册、注册 Cookie 属性（`HttpOnly`、`Secure`、`SameSite=Lax`）、会话读取、收藏写入与去重、退出后 401、重新登录 Cookie 属性、跨会话收藏恢复、取消收藏和最终退出。验证账户未保留收藏标的。

生产地址 `/member` 已在桌面和 375px 移动视口核验。未登录状态显示登录/注册表单及“无支付、不存交易密码”说明；已登录临时账户显示注册名称、邮箱、已收藏的中国卫星、终端快捷入口及移除按钮。浏览器验收脚本已执行真实移除操作并确认工作台即时变为无收藏状态，测试会话随后注销。

针对 Worker 会员路由新增了 Vitest：使用受控 D1 模拟会话验证 `auth.me` 与 `member.profile` 均返回会员邮箱、`displayName` 以及可解析为“中国卫星（600118）”的收藏元数据。当前项目共 26 项 Vitest 均通过。

## 参考资料

[1]: https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/ "Cloudflare One — One-time PIN login"
[2]: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/ "Cloudflare One — Validate JWTs"
[3]: https://developers.cloudflare.com/d1/get-started/ "Cloudflare D1 — Getting started"
[4]: https://developers.cloudflare.com/cloudflare-one/access-controls/policies/ "Cloudflare One — Access policies"
