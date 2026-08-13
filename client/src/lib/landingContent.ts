import { SITE_ROUTES } from "./siteRoutes";

export const LANDING_PRIMARY_CTA = {
  href: SITE_ROUTES.terminal,
  label: "进入研究终端",
} as const;

export const LANDING_PRINCIPLES = [
  "公开数据可追溯",
  "研究规则可解释",
  "不以估算替代披露",
] as const;
