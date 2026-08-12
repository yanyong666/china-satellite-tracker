import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getMarketData, getMarketOverview, getResearchProfile, STOCK_POOL } from "./marketData";
import { z } from "zod";

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
    overview: publicProcedure.query(() => getMarketOverview()),
    market: publicProcedure.input(z.object({ stockId: z.enum(["china-satellite", "torch-electronics", "naura", "zhongji-innolight", "catl"]) })).query(({ input }) => getMarketData(input.stockId)),
    research: publicProcedure.input(z.object({ stockId: z.enum(["china-satellite", "torch-electronics", "naura", "zhongji-innolight", "catl"]) })).query(({ input }) => getResearchProfile(input.stockId)),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
