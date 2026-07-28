/**
 * Parse a price string that may use either US (1,234.56) or EU (1.234,56) formats.
 */
export function parsePrice(text: string): number | null {
  const raw = text.replace(/[^\d,.]/g, "").trim();
  if (!raw) return null;

  const lastComma = raw.lastIndexOf(",");
  const lastDot = raw.lastIndexOf(".");

  let normalized: string;
  if (lastComma > lastDot) {
    // EU: 1.234,56 or 1234,56
    normalized = raw.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    // US: 1,234.56 or 1234.56
    normalized = raw.replace(/,/g, "");
  } else if (lastComma >= 0) {
    // Only commas — treat as decimal if 1–2 digits after last comma
    const after = raw.length - lastComma - 1;
    normalized =
      after > 0 && after <= 2
        ? raw.replace(/,/g, (m, offset) => (offset === lastComma ? "." : ""))
        : raw.replace(/,/g, "");
  } else {
    normalized = raw;
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}
