export type IndexAvailability = "available" | "unavailable";

export function getIndexAvailability(indices: unknown[] | undefined): IndexAvailability {
  return indices && indices.length > 0 ? "available" : "unavailable";
}

export type TerminalMarketState = "loading" | "ready" | "unavailable";

export function getTerminalMarketState(hasStock: boolean, hasMarket: boolean, isLoading: boolean): TerminalMarketState {
  if (hasStock && hasMarket) return "ready";
  if (isLoading && !hasMarket) return "loading";
  if (hasStock && !hasMarket && !isLoading) return "unavailable";
  if (!hasStock) return "loading";
  return "ready";
}
