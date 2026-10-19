const HEX = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export function isValidHex(value: string): boolean {
  return HEX.test(value.trim());
}

/** Normalizuje wpis użytkownika („a855f7”, „#A855F7”) do postaci #rrggbb lub zwraca null. */
export function normalizeHex(value: string): string | null {
  let v = value.trim();
  if (!v.startsWith('#')) v = `#${v}`;
  return isValidHex(v) ? v.toLowerCase() : null;
}

/** Dodaje przezroczystość do koloru #rgb/#rrggbb(aa). */
export function withAlpha(hex: string, alpha: number): string {
  const n = normalizeHex(hex);
  if (!n) return `rgba(168,85,247,${alpha})`;
  let h = n.slice(1);
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function safeColor(value: string | undefined, fallback: string): string {
  return value && isValidHex(value) ? value : fallback;
}
