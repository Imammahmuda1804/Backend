/**
 * Menyamakan format nama topik sebelum dibandingkan.
 *
 * Contoh: "  Pemandangan   Bagus " dan "pemandangan bagus"
 * dianggap sebagai nama yang sama.
 */
export function normalizeTopicNameForMatch(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
