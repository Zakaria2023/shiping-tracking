/**
 * A place name reduced to letters and digits, lower-case, so "EL DEKHEILA
 * PORT-PUBLIC TML", "El Dekheila" and "ALEXANDRIA EL DEKHEILA" can be
 * compared by containment rather than by exact spelling.
 */
export const squashPlace = (value: string | null | undefined): string =>
  (value ?? "")
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9]/g, "");

/** True when either place name contains the other (after squashing). */
export const samePlace = (
  a: string | null | undefined,
  b: string | null | undefined,
): boolean => {
  const x = squashPlace(a);
  const y = squashPlace(b);
  if (x.length < 3 || y.length < 3) {
    return false;
  }
  return x.includes(y) || y.includes(x);
};

/**
 * "Shanghai/China" → "Shanghai"; "BEIRUT, LB" → "BEIRUT"; "DAMIETTA (EGDAM)" →
 * "DAMIETTA"; "DAMIETTA - DAMIETTA CONTAINER & HANDLING - DCHC" → "DAMIETTA".
 */
export const portNameOnly = (value: string): string =>
  value
    .replace(/\(.*?\)/g, "")
    .split(/[/,]| - /)[0]
    ?.trim() ?? value.trim();

/** A 5-letter UN/LOCODE inside brackets, e.g. "DAMIETTA (EGDAM)" → "EGDAM". */
export const locodeInBrackets = (value: string | null | undefined): string | null => {
  const match = (value ?? "").match(/\(([A-Z]{5})\)/);
  return match?.[1] ?? null;
};
