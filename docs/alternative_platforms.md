# 华夏股票研究终端：免人机验证托管平台与替代方案对比

**更新日期：** 2026-08-12  
**项目架构：** React 19 前端 + Express 4 / tRPC 11 后端（含公开行情实时抓取、评分计算与资金流解析）。

---

## 一、 为什么部分平台会触发频繁的人机验证？
像 Cloudflare Dashboard 在自动化或数据中心 IP 环境中，常会因安全策略触发严格的 `Verify you are human` 校验。而如果通过 **Git 托管仓库授权（如 GitHub OAuth）**，则由第三方平台在服务端拉取代码并自动构建，基本可以彻底绕过人工在控制台频繁点验证码的痛点。

---

## 二、 适配全栈项目的替代部署平台对比

针对本项目的 **前端 + Node.js 服务端** 架构，以下平台无需复杂的人机校验且支持全栈运行：

| 平台名称 | 部署方式 | 是否支持全栈 (Node.js 后端) | 人机验证/账号门槛 | 推荐指数与适用场景 |
| :--- | :--- | :--- | :--- | :--- |
| **1. Cloudflare Workers / Pages** | 关联 GitHub 仓库自动构建 | 支持（通过 Workers 兼容入口） | 仅初次绑定 GitHub 时需要，后续零验证码 | ⭐⭐⭐⭐⭐（已有账户，配置 Wrangler 资产后最适合全球边缘加速） |
| **2. Render (render.com)** | 关联 GitHub Web Service | 完全支持标准 Node.js 应用 | 极少触发，注册简单 | ⭐⭐⭐⭐☆（免费或低成本托管完整 Node.js + Vite 服务，免运维） |
| **3. Railway (railway.app)** | 关联 GitHub 一键部署 | 完全支持（原生 Docker / Node） | 极少触发 | ⭐⭐⭐⭐☆（对全栈应用支持极佳，但免费额度有限） |
| **4. Vercel** | 关联 GitHub 部署 | 仅限 Serverless Functions | 极少触发 | ⭐⭐⭐☆☆（前端极佳，但由于本项目包含 Express/tRPC 服务端轮询与行情接口，需转换为 Serverless 路由） |

---

## 三、 当前项目的实际推荐路径

由于你已经手动连接了 Cloudflare，并且代码已完整同步至 `https://github.com/yanyong666/china-satellite-tracker`：

1. **首选路径（Cloudflare Pages/Workers Git 自动集成）：**
   - 当你在本地或已登录的浏览器中成功连接 GitHub 仓库后，后续的所有代码更新（`git push`）都会由 Cloudflare 自动完成，不会再受到沙盒控制台人机验证的干扰。
2. **备选路径（Render / Railway）：**
   - 如果希望避开 Cloudflare 所有的控制台细节，只需在 Render 或 Railway 官网上用 GitHub 账号一键导入 `yanyong666/china-satellite-tracker`，系统会自动识别 `package.json` 中的构建脚本并在线运行。

---

## 参考资料
1. Cloudflare Workers Documentation. https://developers.cloudflare.com/workers/
2. Render Web Services Documentation. https://render.com/docs/web-services
