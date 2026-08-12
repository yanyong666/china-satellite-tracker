export type IndexAvailability = "available" | "unavailable";

export function getIndexAvailability(indices: unknown[] | undefined): IndexAvailability {
  return indices && indices.length > 0 ? "available" : "unavailable";
}
