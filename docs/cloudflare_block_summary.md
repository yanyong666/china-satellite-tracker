# 华夏股票研究终端：Cloudflare 部署阻塞与替代方案总结

**报告日期：** 2026-08-12  
**项目名称：** 华夏股票研究终端（`china-satellite-tracker`）  
**当前状态：** Manus 自动发布地址已正常运行（`https://chinasattrk-n6wbuzkr.manus.space`），未修改 DNS，无多余远程资源残留。

---

## 一、 当前 Cloudflare 验证阻塞的根本原因

在当前沙盒远程浏览器环境中尝试登录 Cloudflare 并配置 GitHub OAuth 时，遇到了 **Cloudflare Bot Management（人机识别校验 / "Verify you are human"）** 持续拦截。

1. **环境信任度差异：** 自动化数据中心 IP 和沙盒浏览器指纹通常会触发 Cloudflare 的严格安全挑战（Bot Management）。即使完成了 Google 账号的双重验证（2FA），Cloudflare 后台仍会根据浏览器指纹和会话上下文追加一次人机校验。
2. **自动化交互限制：** 这一校验必须由本地真实浏览器的鼠标点击交互来完成，智能体无法通过编程或截图点击绕过。由于沙盒网络与本地真实 IP 存在切换，校验往往会进入无限重试或验证失败循环。

---

## 二、 后续可行部署与域名方案对比

为了帮助你安全、便捷地将研究终端托管到你自己的域名或 Cloudflare 账户，以下列出三种替代路径供你选择：

| 方案名称 | 操作方式 | 优点 | 缺点 / 前提条件 |
| :--- | :--- | :--- | :--- |
| **方案 A：使用 Manus 自带托管与域名绑定** | 在 Manus 侧直接配置自定义域名或使用现有 `chinasattrk-n6wbuzkr.manus.space` 预览与生产地址 [1]。 | 零配置、零验证码、即时生效。 | 依赖 Manus 托管平台。 |
| **方案 B：本地 Wrangler 部署（跳过 Dashboard）** | 在你自己的本地电脑上克隆代码，本地运行 `pnpm build:cloudflare && npx wrangler deploy` [2]。 | 本地网络干净，极易通过 Cloudflare 认证。 | 需要本地安装 Node.js 和 Wrangler 命令行。 |
| **方案 C：稍后在本地浏览器完成 GitHub 连接** | 在你自己的日常电脑和浏览器中登录 Cloudflare 仪表板，通过 **Workers & Pages → Connect GitHub** 一键导入 `yanyong666/china-satellite-tracker`。 | 享受 Cloudflare 的全套自动化 CI/CD 和免费自定义域名。 | 需要你亲自处理一次本地登录和校验。 |

---

## 三、 当前建议与后续行动

* **项目安全：** 所有的代码修改、`wrangler.jsonc` 兼容配置、Git 仓库同步（`yanyong666/china-satellite-tracker`）均已完整保留，随时可以拉取并部署到任何 Cloudflare 兼容环境。
* **可用访问：** 你可以随时通过 Manus 生产地址访问完整的“华夏股票研究终端”。
* **如何继续：** 如果你希望由我协助打包为本地执行脚本，或需要在 Manus 管理面板中绑定你自己的自定义域名，请随时告诉我。

---

## 参考资料

1. Manus WebDev Documentation & Hosting Guide. https://manus.im
2. Cloudflare Workers Documentation: Deploy an Express.js Application. https://developers.cloudflare.com/workers/tutorials/deploy-an-express-app/
