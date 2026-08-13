export type TerminalStockId = "china-satellite" | "torch-electronics" | "naura" | "zhongji-innolight" | "catl";

type TerminalTabSource = {
  id: string;
  name: string;
  code: string;
  sector: string;
};

export function getTerminalResearchTabs<T extends TerminalTabSource>(universe: T[], selectedId: string) {
  return universe.map((stock) => ({
    id: stock.id,
    name: stock.name,
    code: stock.code,
    sector: stock.sector,
    isActive: stock.id === selectedId,
  }));
}

type ChangeSnapshot = { changePct: number } | null;

export function sortOverviewByChange<T extends { snapshot: ChangeSnapshot }>(items: T[]): T[] {
  return [...items].sort((left, right) => (right.snapshot?.changePct ?? -Infinity) - (left.snapshot?.changePct ?? -Infinity));
}

export function selectTerminalStock(current: TerminalStockId, requested: TerminalStockId, available: TerminalStockId[]): TerminalStockId {
  return available.includes(requested) ? requested : current;
}
