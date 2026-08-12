# Cloudflare Pages / Workers 部署配置指南

针对 `china-satellite-tracker.pages.dev` 出现 `ERR_CONNECTION_CLOSED`（连接关闭）或 404/500 错误，通常是由 **Cloudflare Pages 的构建输出目录设置不正确** 或 **未将项目作为 Workers Fullstack 部署** 引起的。

---

## 一、 正确的 Cloudflare 部署配置参数

如果你在 Cloudflare 控制台中连接了 `yanyong666/china-satellite-tracker` 仓库，请在 **Build settings** 中确保以下参数完全正确：

| 配置项 | 正确填写值 | 说明 |
| :--- | :--- | :--- |
| **Framework preset** | `None` 或 `Vite` | 不使用默认预设，自定义构建命令 |
| **Build command** | `pnpm build` | 运行 Vite 编译前端并在 `dist/public` 生成静态文件，同时打包服务端 Worker |
| **Build output directory** | `dist/public` | 存放静态前端页面（index.html 及 assets） |

---

## 二、 为什么会出现连接关闭 (`ERR_CONNECTION_CLOSED`)？

1. **输出目录误配：** 如果在 Cloudflare Pages 中误填了 `dist`（而不是 `dist/public`），Cloudflare 找不到正确的 `index.html` 入口，会导致服务无响应或连接断开。
2. **混合全栈路由：** 本项目既包含 React 前端，又包含公开行情读取逻辑。通过 `wrangler.jsonc` 中的 `"assets": { "directory": "./dist/public", "run_worker_first": ["/api/*"] }` 配置，前端请求走静态资产，API 请求走 Worker。如果直接按照纯静态 Pages 部署，后端 tRPC 接口将无法响应。

---

## 三、 推荐的验证方式

在 Cloudflare 控制台更新构建输出目录为 `dist/public` 并重新触发部署后，访问生成的 `*.pages.dev` 域名即可正常加载“华夏股票研究终端”。如果需要最稳定的生产环境，当前 Manus 托管地址始终保持可用：`https://chinasattrk-n6wbuzkr.manus.space`。

## Git 自动构建触发记录

Cloudflare Worker `china-satellite-tracker` 已连接 GitHub 仓库 `yanyong666/china-satellite-tracker`，生产分支为 `main`。构建命令为 `pnpm build`，部署命令为 `npx wrangler deploy`；Worker 的静态资产目录和入口由仓库根目录的 `wrangler.jsonc` 管理。首次连接后需要 `main` 分支产生一次新提交，Cloudflare 才会开始第一次构建。
