import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { getMarketContext, getMarketData, getMarketOverview, getResearchProfile, STOCK_POOL } from "./marketData";

const t = initTRPC.create({ transformer: superjson });
const stockId = z.enum(["china-satellite", "torch-electronics", "naura", "zhongji-innolight", "catl"]);

/**
 * Cloudflare 生产入口仅公开研究终端所需的无鉴权数据接口。
 * 保留现有 Express 入口用于 Manus 运行时的 OAuth、存储与开发能力，避免耦合两种部署环境。
 */
const workerRouter = t.router({
  tracker: t.router({
    universe: t.procedure.query(() => STOCK_POOL),
    context: t.procedure.query(() => getMarketContext()),
    overview: t.procedure.query(() => getMarketOverview()),
    market: t.procedure.input(z.object({ stockId })).query(({ input }) => getMarketData(input.stockId)),
    research: t.procedure.input(z.object({ stockId })).query(({ input }) => getResearchProfile(input.stockId)),
  }),
});

const API_PREFIX = "/api/trpc";

export default {
  async fetch(request: Request): Promise<Response> {
    const pathname = new URL(request.url).pathname;
    if (!pathname.startsWith(API_PREFIX)) {
      return new Response("Not Found", { status: 404 });
    }

    return fetchRequestHandler({
      endpoint: API_PREFIX,
      req: request,
      router: workerRouter,
      createContext: () => ({}),
    });
  },
};

