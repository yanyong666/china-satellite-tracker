type SnapshotLike = { changePct: number } | null;
type OverviewLike = { stock: { sector: string; sectorKey: string }; snapshot: SnapshotLike };

export type SectorSummary = { sector: string; sectorKey: string; changePct: number | null; coveredStocks: number; availableQuotes: number };
export type EventStatus = { kind: "disclosed" | "upcoming" | "monitoring"; label: "已披露" | "待披露" | "持续监测" };
export type PublicModuleState = { kind: "available" | "unavailable"; title: string; description: string };

export function buildSectorSummaries(items: OverviewLike[]): SectorSummary[] {
  const groups = new Map<string, { sectorKey: string; values: number[]; coveredStocks: number }>();
  for (const item of items) {
    const existing = groups.get(item.stock.sector) ?? { sectorKey: item.stock.sectorKey, values: [], coveredStocks: 0 };
    existing.coveredStocks += 1;
    if (item.snapshot) existing.values.push(item.snapshot.changePct);
    groups.set(item.stock.sector, existing);
  }
  return Array.from(groups.entries()).map(([sector, data]) => ({
    sector,
    sectorKey: data.sectorKey,
    changePct: data.values.length ? data.values.reduce((sum: number, value: number) => sum + value, 0) / data.values.length : null,
    coveredStocks: data.coveredStocks,
    availableQuotes: data.values.length,
  })).sort((left, right) => (right.changePct ?? -Infinity) - (left.changePct ?? -Infinity));
}

export function getEventStatus(date: string | null, asOf: string = new Date().toISOString().slice(0, 10)): EventStatus {
  if (!date) return { kind: "monitoring", label: "持续监测" };
  return date <= asOf ? { kind: "disclosed", label: "已披露" } : { kind: "upcoming", label: "待披露" };
}

export function getPublicModuleState(module: "chips" | "disclosures", hasPublicData: boolean): PublicModuleState {
  if (hasPublicData) return module === "chips"
    ? { kind: "available", title: "逐价筹码已接入", description: "数据来源与时间口径将随公开源返回展示。" }
    : { kind: "available", title: "原始披露已配置", description: "优先展示可追溯的公司或交易所公开披露。" };
  return module === "chips"
    ? { kind: "unavailable", title: "公开源未连接", description: "当前未接入可公开核验的逐价筹码分布数据，因此不展示或推算筹码峰数值。" }
    : { kind: "unavailable", title: "原始披露待补充", description: "当前标的尚未配置可追溯的原始披露链接；仅保留公开新闻检索入口。" };
}
