import { createTRPCReact } from "@trpc/react-query";
import type { memberWorkerRouter } from "../../../server/cloudflare-worker";

/**
 * 同域会员 API：仅请求 /member/api，由 Cloudflare Access 负责浏览器登录页与会话，
 * Worker 再校验 Access JWT。它不复用 Manus OAuth 的 /api/trpc 会话。
 */
export const memberTrpc = createTRPCReact<typeof memberWorkerRouter>();
