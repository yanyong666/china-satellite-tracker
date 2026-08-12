export type IndexAvailability = "available" | "unavailable";

export function getIndexAvailability(indices: unknown[] | undefined): IndexAvailability {
  return indices && indices.length > 0 ? "available" : "unavailable";
}

export type TerminalMarketState = "loading" | "ready" | "unavailable";

export function getTerminalMarketState(hasStock: boolean, hasMarket: boolean, isLoading: boolean): TerminalMarketState {
  if (hasStock && hasMarket) return "ready";
  if (isLoading || !hasStock) return "loading";
  return "unavailable";
}
