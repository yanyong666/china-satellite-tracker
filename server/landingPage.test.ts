import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { LANDING_PRINCIPLES, LANDING_PRIMARY_CTA } from "../client/src/lib/landingContent";
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
    const markup = renderToStaticMarkup(createElement(
      Router,
      { ssrPath: SITE_ROUTES.home },
      createElement(Landing),
    ));
    expect(markup).toContain('href="/terminal"');
    expect(markup).toContain("进入研究终端");
    expect(markup).toContain("华夏股票研究终端");
  });
});
