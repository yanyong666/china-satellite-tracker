export type TerminalStockId = "china-satellite" | "torch-electronics" | "naura" | "zhongji-innolight" | "catl";

type ChangeSnapshot = { changePct: number } | null;

export function sortOverviewByChange<T extends { snapshot: ChangeSnapshot }>(items: T[]): T[] {
  return [...items].sort((left, right) => (right.snapshot?.changePct ?? -Infinity) - (left.snapshot?.changePct ?? -Infinity));
}

export function selectTerminalStock(current: TerminalStockId, requested: TerminalStockId, available: TerminalStockId[]): TerminalStockId {
  return available.includes(requested) ? requested : current;
}
