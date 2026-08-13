# Cloudflare 同域会员架构

## 结论

用户选择“B”后，会员中心应采用 **Cloudflare Access 身份验证 + Worker JWT 验证 + D1 收藏存储**。公开研究页继续保持公开；会员入口、会员 API 与收藏数据路径由同一个 Access 应用保护。Worker 必须验证 Access 注入的 `Cf-Access-Jwt-Assertion`，并从经验证的 JWT `email` 声明推导用户身份，不能相信前端传入的用户 ID。[1] [2]

| 层级 | 采用组件 | 职责 |
| --- | --- | --- |
| 身份验证 | Cloudflare Access One-time PIN | 向被 Access 策略允许的邮箱发送一次性登录码；PIN 单次使用且有效期为 10 分钟 [1] |
| 请求鉴权 | Access JWT + Worker `jose` 验证 | 校验签名、签发者和应用 AUD；只接受 `Cf-Access-Jwt-Assertion` 头 [2] |
| 用户数据 | Cloudflare D1 | 保存经身份令牌确定的成员邮箱和收藏标的；Worker 通过 D1 binding 使用参数化查询 [3] |
| 公开研究 | `stock-terminal` Worker | 根路径和 `/terminal` 继续公开；不要求注册即可看公开披露与行情 |

## 路由边界

为避免公共首页被登录墙拦截，会员页面和接口必须采用共同的专用前缀，例如 `/member` 与 `/member-api/*`，并配置为 Access 的受保护范围；公开页和公开行情接口不纳入同一 Access 应用。此种划分需要在域名激活后配置相应的 Access 应用、允许策略、OTP 身份提供商和 Worker 环境变量。

## 必要配置

1. 创建一个 D1 数据库并将其以 `MEMBER_DB` binding 绑定到 `stock-terminal` Worker。
2. 在 Cloudflare Zero Trust 创建 One-time PIN 身份提供商与一个路径范围的 Access 应用。
3. 设置只允许指定邮箱或指定邮箱域的 Allow 策略；Access 默认拒绝不匹配策略的用户。[4]
4. 将该 Access 应用的 AUD Tag 和 Cloudflare One team domain 设为 Worker 机密/环境变量。
5. Worker 使用远程 JWKS 校验签名、`issuer` 和 `audience`，然后以验证后的邮箱作为会员数据主键。[2]

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

## 参考资料

[1]: https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/ "Cloudflare One — One-time PIN login"
[2]: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/ "Cloudflare One — Validate JWTs"
[3]: https://developers.cloudflare.com/d1/get-started/ "Cloudflare D1 — Getting started"
[4]: https://developers.cloudflare.com/cloudflare-one/access-controls/policies/ "Cloudflare One — Access policies"
