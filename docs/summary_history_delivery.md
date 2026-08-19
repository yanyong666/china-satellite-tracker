# 华夏股票研究终端：AI 市场总结历史回顾功能与部署交付报告

> **发布版本**：v3.0 生产就绪版  
> **核心模块**：`dailySummaryHistory`、Cloudflare D1 数据库持久化、折叠式历史回顾面板、多端响应式视觉升级  
> **数据口径**：中新网财经 RSS、上证/创业板/科创50指数宽度、`gpt-5-mini` 智能生成与安全规则兜底  

---

## 一、 功能概述与设计原则

在华夏股票研究终端（Huaxia Stock Research Terminal）现有的“每日市场总结”与“板块异动”模块基础之上，本项目进一步新增了**历史回顾（Archive / 07 Days）**功能。该功能允许观察者在研究终端展开查看过去一周内由公开信息与 AI 智能引擎（或规则兜底引擎）提炼的每日市场总结、核心主题与板块异动记录 [1]。

为了贯彻本平台一贯坚持的**可核验、透明、无虚假填充**原则，历史回顾功能遵循了严格的工程规范：
1. **真实持久化**：移除了早期的静态示例和硬编码模板数据。系统通过 Cloudflare D1 数据库（`daily_market_summaries` 表）按北京时间（Asia/Shanghai）业务日期进行幂等写入与滚动查询 [2]。
2. **安全降级**：若 D1 数据库未连接或表结构处于迁移过渡期，系统会自动平滑降级为返回当天的真实生成结果，绝不使用虚构数据填充空白日期。
3. **免责声明与透明度**：所有历史总结均保留模型标识（如 `gpt-5-mini` 或 `fallback-rule-engine`）及法定免责声明，确保研究过程可追溯、合规且严谨。

---

## 二、 架构实现与 D1 持久化方案

### 1. 数据库迁移方案
在 Cloudflare D1 生产数据库中新增了版本化迁移脚本 `0003_summary_history.sql`，定义了每日总结表：

```sql
CREATE TABLE IF NOT EXISTS daily_market_summaries (
  summary_date TEXT PRIMARY KEY NOT NULL,
  summary_text TEXT NOT NULL,
  key_theme TEXT NOT NULL,
  sector_mover TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('live', 'fallback')),
  model TEXT NOT NULL,
  generated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS daily_market_summaries_generated_idx
  ON daily_market_summaries(generated_at DESC);
```

### 2. 仓储与 Worker 路由集成
在 `server/cloudflare-member.ts` 与 `server/cloudflare-worker.ts` 中，实现了按日期幂等插入（`UPSERT`）与最近 7 条记录降序查询：
- 当公开 API 生成当日的市场总结时，Worker 会自动以北京时间业务日期（`YYYY-MM-DD`）将其持久化至 D1 数据库 [2]。
- 用户在终端点击“历史回顾”折叠按钮时，前端通过 tRPC 异步触发 `tracker.dailySummaryHistory` 查询，按需加载最近 7 天的归档记录，避免了首屏加载延迟。

| 接口方法 | 路由路径 | 数据源与降级行为 |
| :--- | :--- | :--- |
| `tracker.dailySummary` | `/api/trpc/tracker.dailySummary` | 读取当日中新网财经 RSS 与指数宽度，调用 `gpt-5-mini` 生成并在 D1 幂等保存；LLM 不可用时启用规则兜底 [3]。 |
| `tracker.dailySummaryHistory` | `/api/trpc/tracker.dailySummaryHistory` | 从 D1 数据库逆序读取最近 7 条真实归档；若 D1 暂不可用，降级返回包含当日总结的单条数组 [3]。 |

---

## 三、 用户界面与端到端验收

### 1. 终端交互体验
- **折叠式归档面板**：在 AI 每日市场总结卡片下方新增了 “ARCHIVE / 07 DAYS 历史回顾” 抽屉式折叠按钮。
- **状态标签区分**：每条历史记录明确标示其生成方式（`AI 实时生成` 呈荧光绿边框，`规则兜底` 呈柔和琥珀色边框），并附带具体的时间戳与模型标识。
- **响应式排版**：在桌面端（1280px）采用左侧日期元数据、右侧正文内容的双栏结构；在移动端（375px）自动切换为单列堆叠布局，确保在手机端浏览时同样具备极佳的可读性。

### 2. 自动化测试与质量保证
本项目执行了严密的自动化验证，确保所有重构与新增功能零回归：
- **Vitest 单元测试**：共 33 项测试全部通过（包含日期键转换、AI 摘要约束校验、仓储幂等写入、边界限制等） [4]。
- **Playwright 端到端验证**：模拟桌面（1280x720）与移动（375x812）视口，实测点击历史折叠按钮后成功加载并呈现归档内容，结构、状态及免责声明全部符合预期 [4]。

---

## 四、 域名字段与部署前置说明

1. **当前线上地址**：所有核心功能已自动部署至 Cloudflare Workers 生产环境，可通过稳定地址 `https://stock-terminal.yanyong-email.workers.dev` 及 Manus 托管预览访问 [5]。
2. **自定义域进展**：针对用户申请的免费顶级/二级域名 `china-finance.eu.org`（EU.org 引用编号 `20260812124602-arf-40032`），每日自动巡检任务显示其父区 SOA 已更新至 `2026081903`，但顶级权威节点尚未正式发布针对该子域的委派记录。系统将坚持**安全第一、不强行绑定未生效 DNS** 的原则，待 EU.org 审核委派完成后立即一键绑定 [5]。

---

## 参考链接

- [1] 华夏股票研究终端主页: [https://stock-terminal.yanyong-email.workers.dev/](https://stock-terminal.yanyong-email.workers.dev/)
- [2] Cloudflare D1 数据库官方文档: [https://developers.cloudflare.com/d1/](https://developers.cloudflare.com/d1/)
- [3] tRPC 类型安全远程过程调用: [https://trpc.io/](https://trpc.io/)
- [4] Vitest 测试框架: [https://vitest.dev/](https://vitest.dev/)
- [5] Cloudflare Workers 部署管理: [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
