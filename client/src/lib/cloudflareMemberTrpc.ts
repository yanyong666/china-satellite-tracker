import { createTRPCReact } from "@trpc/react-query";
import { createContext } from "react";
import type { memberWorkerRouter } from "../../../server/cloudflare-worker";

/**
 * 同域会员 API：仅请求 /member/api，由 Worker + D1 自有会话校验。
 * 它使用独立 React 上下文，避免覆盖公开行情 /api/trpc 的客户端。
 */
export const memberTrpcContext = createContext(null);
export const memberTrpc = createTRPCReact<typeof memberWorkerRouter>({ context: memberTrpcContext });
