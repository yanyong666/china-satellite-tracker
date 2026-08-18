import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { listUserSavedStocks, removeUserStock, saveUserStock } from "./db";
import { getMarketBriefing, getMarketContext, getMarketData, getMarketOverview, getResearchProfile, STOCK_POOL } from "./marketData";
import { z } from "zod";

const stockIdSchema = z.enum(["china-satellite", "torch-electronics", "naura", "zhongji-innolight", "catl"]);

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  tracker: router({
    universe: publicProcedure.query(() => STOCK_POOL),
    context: publicProcedure.query(() => getMarketContext()),
    briefing: publicProcedure.query(() => getMarketBriefing()),
    overview: publicProcedure.query(() => getMarketOverview()),
    market: publicProcedure.input(z.object({ stockId: stockIdSchema })).query(({ input }) => getMarketData(input.stockId)),
    research: publicProcedure.input(z.object({ stockId: stockIdSchema })).query(({ input }) => getResearchProfile(input.stockId)),
  }),

  member: router({
    savedStocks: protectedProcedure.query(async ({ ctx }) => {
      const saved = await listUserSavedStocks(ctx.user.id);
      return saved.flatMap((entry) => {
        const stock = STOCK_POOL.find((item) => item.id === entry.stockId);
        return stock ? [{ stock, createdAt: entry.createdAt }] : [];
      });
    }),
    saveStock: protectedProcedure.input(z.object({ stockId: stockIdSchema })).mutation(({ ctx, input }) =>
      saveUserStock(ctx.user.id, input.stockId)),
    removeStock: protectedProcedure.input(z.object({ stockId: stockIdSchema })).mutation(({ ctx, input }) =>
      removeUserStock(ctx.user.id, input.stockId)),
  }),
});

export type AppRouter = typeof appRouter;
