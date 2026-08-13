import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { LANDING_PRINCIPLES, LANDING_PRIMARY_CTA } from "../client/src/lib/landingContent";
import { memberTrpc } from "../client/src/lib/cloudflareMemberTrpc";
import { SITE_ROUTES } from "../client/src/lib/siteRoutes";
import Landing from "../client/src/pages/Landing";

describe("品牌标题页内容契约", () => {
  it("将首要 CTA 指向公开研究终端", () => {
    expect(LANDING_PRIMARY_CTA).toEqual({ href: SITE_ROUTES.terminal, label: "进入研究终端" });
    expect(SITE_ROUTES.terminal).toBe("/terminal");
  });

  it("保持公开、透明、不估算的研究原则", () => {
    expect(LANDING_PRINCIPLES).toContain("公开数据可追溯");
    expect(LANDING_PRINCIPLES).toContain("研究规则可解释");
    expect(LANDING_PRINCIPLES).toContain("不以估算替代披露");
  });

  it("渲染品牌首页时将主 CTA 输出为可用的终端链接", () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const memberClient = memberTrpc.createClient({ links: [httpBatchLink({ url: "https://example.invalid/member/api", transformer: superjson })] });
    const markup = renderToStaticMarkup(createElement(
      Router,
      { ssrPath: SITE_ROUTES.home },
      createElement(memberTrpc.Provider, { client: memberClient, queryClient }, createElement(QueryClientProvider, { client: queryClient }, createElement(Landing))),
    ));
    expect(markup).toContain('href="/terminal"');
    expect(markup).toContain('href="/member"');
    expect(markup).toContain("进入研究终端");
    expect(markup).toContain("MEMBER DESK / NO PAYMENT");
    expect(markup).toContain("华夏股票研究终端");
  });
});
