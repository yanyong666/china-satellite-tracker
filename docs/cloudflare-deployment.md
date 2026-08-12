# Cloudflare Workers 部署说明

本项目在 Manus 运行环境中保留完整的 Express、OAuth 与存储入口；Cloudflare 版本专门提供**公开、无登录依赖**的研究终端页面和 `tracker.*` tRPC 数据接口。该边界确保前端在 Cloudflare 静态资产服务上运行时，仍由 Worker 代为读取公开行情、指数与资金流来源，而不会将数据源访问转移到浏览器端。

## 部署结构

| 路径 | Cloudflare 行为 |
| --- | --- |
| `/` 与前端资源 | 由 `dist/public` 中的 Vite 构建产物作为静态资产提供。 |
| `/api/trpc/*` | 先进入 `server/cloudflare-worker.ts`，提供股票池、行情、指数、公开资金流和研究卡接口。 |
| 其他前端路由 | 以单页应用回退到 `index.html`。 |

## 发布前检查

运行 `pnpm test`、`pnpm check` 与 `pnpm build:cloudflare`。部署前需要在 Cloudflare 中确认 Worker 名称、预览地址和目标域名；自定义域名或 DNS 记录变更必须经域名所有者确认后执行。

## 命令

```bash
pnpm cf:dev
pnpm cf:deploy
```

`cf:deploy` 会向当前登录的 Cloudflare 帐户创建或更新 Worker，并上传前端静态资产。因此必须在确认 Worker 名称和公开发布范围后运行。

