import { createTRPCReact } from "@trpc/react-query";
import { createContext } from "react";
import type { AppRouter } from "../../../server/routers";

export const publicTrpcContext = createContext(null);
export const trpc = createTRPCReact<AppRouter>({ context: publicTrpcContext });
