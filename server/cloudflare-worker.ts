import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { getDailyMarketSummary, getMarketBriefing, getMarketContext, getMarketData, getMarketOverview, getResearchProfile, STOCK_POOL } from "./marketData";
import { createPasswordRecord, destroyMemberSession, normalizeMemberEmail, requireMemberRepository, requireSessionMember, startMemberSession, validateMemberPassword, verifyPassword, type WorkerEnv } from "./cloudflare-member";

type WorkerContext = {
  request: Request;
  env: WorkerEnv;
  setCookie?: string;
};

const t = initTRPC.context<WorkerContext>().create({ transformer: superjson });
const stockId = z.enum(["china-satellite", "torch-electronics", "naura", "zhongji-innolight", "catl"]);

/** 公开研究接口保持在 /api/trpc，永不要求会员登录。 */
export const publicWorkerRouter = t.router({
  tracker: t.router({
    universe: t.procedure.query(() => STOCK_POOL),
    context: t.procedure.query(() => getMarketContext()),
    briefing: t.procedure.query(() => getMarketBriefing()),
    dailySummary: t.procedure.query(() => getDailyMarketSummary()),
    overview: t.procedure.query(() => getMarketOverview()),
    market: t.procedure.input(z.object({ stockId })).query(({ input }) => getMarketData(input.stockId)),
    research: t.procedure.input(z.object({ stockId })).query(({ input }) => getResearchProfile(input.stockId)),
  }),
});

/** 会员接口独立部署在 /member/api，由 Worker 管理安全哈希与 HttpOnly 会话。 */
export const memberWorkerRouter = t.router({
  auth: t.router({
    register: t.procedure.input(z.object({ email: z.string(), displayName: z.string().trim().min(1).max(80).optional(), password: z.string() })).mutation(async ({ ctx, input }) => {
      const email = normalizeMemberEmail(input.email);
      validateMemberPassword(input.password);
      const repository = requireMemberRepository(ctx.env);
      if (await repository.findMemberCredential(email)) {
        throw new TRPCError({ code: "CONFLICT", message: "该邮箱已注册，请直接登录。" });
      }
      const password = await createPasswordRecord(input.password);
      const displayName = input.displayName?.trim() || null;
      await repository.createMember({ email, displayName }, password);
      ctx.setCookie = await startMemberSession(repository, email);
      return { email, displayName };
    }),
    login: t.procedure.input(z.object({ email: z.string(), password: z.string() })).mutation(async ({ ctx, input }) => {
      const email = normalizeMemberEmail(input.email);
      const repository = requireMemberRepository(ctx.env);
      const now = Math.floor(Date.now() / 1000);
      const lock = await repository.getLoginLock(email);
      if (lock?.locked_until && lock.locked_until > now) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "登录尝试过多，请稍后再试。" });
      }
      const credential = await repository.findMemberCredential(email);
      const valid = credential ? await verifyPassword(input.password, credential.password_salt, credential.password_hash) : false;
      if (!credential || !valid) {
        await repository.registerFailedLogin(email, now);
        throw new TRPCError({ code: "UNAUTHORIZED", message: "邮箱或密码不正确。" });
      }
      await repository.clearLoginFailures(email);
      ctx.setCookie = await startMemberSession(repository, email);
      return { email, displayName: credential.displayName };
    }),
    me: t.procedure.query(async ({ ctx }) => {
      const { member, repository } = await requireSessionMember(ctx.request, ctx.env);
      const savedStocks = await repository.listSavedStockIds(member.email);
      return {
        ...member,
        savedStocks: savedStocks.map(saved => ({
          stockId: saved.stock_id,
          createdAt: saved.created_at,
          stock: STOCK_POOL.find(stock => stock.id === saved.stock_id) ?? null,
        })),
      };
    }),
    logout: t.procedure.mutation(async ({ ctx }) => {
      ctx.setCookie = await destroyMemberSession(ctx.request, ctx.env);
      return { success: true as const };
    }),
  }),
  member: t.router({
    profile: t.procedure.query(async ({ ctx }) => {
      const { member, repository } = await requireSessionMember(ctx.request, ctx.env);
      const savedStocks = await repository.listSavedStockIds(member.email);

      return {
        email: member.email,
        displayName: member.displayName,
        savedStocks: savedStocks.map(saved => ({
          stockId: saved.stock_id,
          createdAt: saved.created_at,
          stock: STOCK_POOL.find(stock => stock.id === saved.stock_id) ?? null,
        })),
      };
    }),
    saveStock: t.procedure.input(z.object({ stockId })).mutation(async ({ ctx, input }) => {
      const { member, repository } = await requireSessionMember(ctx.request, ctx.env);
      await repository.saveStock(member.email, input.stockId);
      return { success: true as const };
    }),
    removeStock: t.procedure.input(z.object({ stockId })).mutation(async ({ ctx, input }) => {
      const { member, repository } = await requireSessionMember(ctx.request, ctx.env);
      await repository.removeStock(member.email, input.stockId);
      return { success: true as const };
    }),
  }),
});

const PUBLIC_API_PREFIX = "/api/trpc";
const MEMBER_API_PREFIX = "/member/api";

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const pathname = new URL(request.url).pathname;
    const isMemberRequest = pathname.startsWith(MEMBER_API_PREFIX);
    const isPublicRequest = pathname.startsWith(PUBLIC_API_PREFIX);

    if (!isMemberRequest && !isPublicRequest) {
      return new Response("Not Found", { status: 404 });
    }

    return fetchRequestHandler({
      endpoint: isMemberRequest ? MEMBER_API_PREFIX : PUBLIC_API_PREFIX,
      req: request,
      router: isMemberRequest ? memberWorkerRouter : publicWorkerRouter,
      createContext: () => ({ request, env }),
      responseMeta({ ctx }) {
        return ctx?.setCookie ? { headers: { "set-cookie": ctx.setCookie } } : {};
      },
    });
  },
};
