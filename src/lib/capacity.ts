/**
 * Derives capacity from room type text
 * Examples:
 * - "Single Room" -> 1
 * - "Double Room" -> 2
 * - "Room for 3" -> 3
 * - "Shared Room 2-4" -> 4 (takes max)
 */
export function deriveCapacity(roomType: string): number {
  const t = roomType.toLowerCase().trim();

  // Explicit numbers like "for 3" or "3 persons", "2-3" range -> take max
  const range = t.match(/\b(\d+)\s*-\s*(\d+)\b/);
  if (range) return Math.max(parseInt(range[1]), parseInt(range[2]));

  const forN = t.match(/\bfor\s*(\d+)\b/) || t.match(/\b(\d+)\s*(persons?|people|students?)\b/);
  if (forN) return parseInt(forN[1]);

  // Keywords
  if (/\b(single|studio)\b/.test(t)) return 1;
  if (/\b(double|twin)\b/.test(t)) return 2;
  if (/\btriple\b/.test(t)) return 3;
  if (/\bquad|quadruple\b/.test(t)) return 4;

  // Fallbacks: "shared room for N" caught above; if "shared" only, default 2
  if (/\bshared\b/.test(t)) return 2;

  // Final default
  return 1;
}
