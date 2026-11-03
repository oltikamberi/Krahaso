/**
 * Safe cross-retailer matching.
 *
 * Prefer brand + OEM model code (+ capacity / CPU). When both sides have
 * overlapping identity specs that disagree, the backend refuses to merge.
 */

const NOISE = new Set([
  "laptop",
  "notebook",
  "ultrabook",
  "telefon",
  "telefone",
  "telefona",
  "smartphone",
  "celular",
  "celulare",
  "mobile",
  "phone",
  "televizor",
  "televizore",
  "television",
  "tv",
  "smart",
  "uhd",
  "fhd",
  "qled",
  "oled",
  "mini",
  "led",
  "4k",
  "8k",
  "5g",
  "4g",
  "lte",
  "gsm",
  "wifi",
  "wi",
  "fi",
  "gb",
  "tb",
  "mb",
  "ram",
  "ssd",
  "hdd",
  "nvme",
  "inch",
  "inc",
  "cm",
  "kg",
  "rpm",
  "with",
  "me",
  "per",
  "dhe",
  "nga",
  "the",
  "a",
  "an",
  "new",
  "repack",
  "repacked",
  "warranty",
  "garanci",
  "year",
  "vite",
  "vit",
  "eu",
  "usa",
  "global",
  "dual",
  "sim",
  "ai",
  "ultra",
  "hd",
  "full",
  "webos",
  "tizen",
  "google",
  "android",
  "crystal",
  "nano",
  "cell",
  "series",
  "edition",
  "model",
  "klasik",
  "klasike",
  "black",
  "white",
  "grey",
  "gray",
  "silver",
  "blue",
  "gold",
  "titanium",
  "purple",
  "green",
  "pink",
  "red",
  "teal",
  "ultramarine",
  "midnight",
  "starlight",
  "natural",
  "cosmic",
  "orange",
  "lavender",
  "sage",
  "cloud",
  "light",
  "sky",
  "deep",
  "zi",
  "zeze",
  "bardhe",
  "bardha",
  "gri",
  "argjendt",
  "kabllo",
  "cable",
  "adapter",
  "mbeshtjellese",
  "case",
  "cover",
  "gaming",
  "display",
  "ips",
  "nits",
  "hz",
  "fhd",
  "qhd",
  "wh",
  "battery",
  "windows",
  "wlan",
  "bluetooth",
  "webcam",
  "quiet",
]);

const BRANDS = new Set([
  "apple",
  "samsung",
  "xiaomi",
  "huawei",
  "lenovo",
  "hp",
  "dell",
  "asus",
  "acer",
  "lg",
  "sony",
  "philips",
  "bosch",
  "beko",
  "hisense",
  "tcl",
  "oppo",
  "realme",
  "motorola",
  "nokia",
  "honor",
  "redmi",
  "poco",
  "msi",
  "gigabyte",
  "thomson",
  "sencor",
  "candy",
  "haier",
  "midea",
  "gorenje",
  "whirlpool",
]);

const SERIES = new Set(["iphone", "ipad", "galaxy", "macbook", "watch", "pixel", "redmi", "poco"]);

const VARIANT = new Set(["pro", "max", "plus", "mini", "air", "ultra", "fe", "e"]);

/** Spec keys that identify a configuration (must agree when both present). */
export const IDENTITY_SPEC_KEYS = [
  "ram",
  "memorja",
  "memory",
  "storage",
  "disku",
  "disk",
  "ssd",
  "hdd",
  "procesori",
  "processor",
  "cpu",
  "ekrani",
  "screen",
  "display",
  "kapaciteti",
  "capacity",
  "rrotullime",
  "rpm",
  "rezolucioni",
  "resolution",
] as const;

function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function cleanText(name: string, brand: string | null): string {
  const brandNorm = fold(brand ?? "")
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();

  let text = fold(name)
    // Keep CPU / SKU hyphens: i5-1334U → i51334u, SM-S921 → sms921
    .replace(/([a-z0-9])-([a-z0-9])/gi, "$1$2")
    .replace(/([a-z0-9]{5,})\/\d+/g, "$1")
    .replace(/(\d+)\s*(gb|tb|mb)\b/g, "$1$2")
    .replace(/(\d+)\s*(?:\"|''|″|inch|inc)\b/g, "$1")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  text = text
    .replace(/\bi\s+zi\b/g, " ")
    .replace(/\be\s+zeze\b/g, " ")
    .replace(/\be\s+bardhe\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (brandNorm && !text.startsWith(brandNorm) && !text.includes(brandNorm)) {
    text = `${brandNorm} ${text}`.trim();
  }
  return text;
}

function tokensOf(text: string): string[] {
  return [...new Set(text.split(" ").filter((t) => t.length > 1 && !NOISE.has(t)))];
}

function brandToken(tokens: string[], brand: string | null): string {
  const fromTokens = tokens.find((t) => BRANDS.has(t));
  if (fromTokens) return fromTokens;
  const b = fold(brand ?? "").split(/\s+/)[0] ?? "";
  return BRANDS.has(b) ? b : b;
}

function isCpuShaped(token: string): boolean {
  return (
    /^i[3579]\d{3,5}[a-z]*$/i.test(token) ||
    /^r[3579]\d{3,5}[a-z]*$/i.test(token) ||
    token.startsWith("ryzen") ||
    /^ultra[579]\d/.test(token) ||
    /^core[3-9]\d/.test(token)
  );
}

function modelCodes(tokens: string[]): string[] {
  return tokens.filter(
    (t) => /[a-z]/.test(t) && /\d/.test(t) && t.length >= 6 && !isCpuShaped(t) && !/^\d+(gb|tb|hz)$/.test(t),
  );
}

function capacityTokens(tokens: string[]): string[] {
  return tokens.filter((t) => /^\d+(gb|tb)$/.test(t)).sort();
}

function toGb(amount: number, unit: string | undefined): number {
  return unit === "tb" ? amount * 1024 : amount;
}

function gbLabel(gb: number): string {
  if (gb >= 1024 && gb % 1024 === 0) return `${gb / 1024} TB`;
  return `${gb} GB`;
}

function foldedRaw(name: string, brand: string | null): string {
  return fold(`${brand ?? ""} ${name}`).replace(/[™®©]/g, " ");
}

function extractCpu(raw: string): string | null {
  let m = raw.match(/\b(?:intel\s+)?(?:core\s+)?ultra\s*([579])\s*[- ]?(\d{3}[a-z]?)\b/);
  if (m) return `ultra${m[1]}${m[2]}`;
  m = raw.match(/\b(?:intel\s+)?core\s*([3-9])\s*[- ](\d{2,4}[a-z])\b/);
  if (m) return `core${m[1]}${m[2]}`;
  m = raw.match(/\b(?:intel\s+)?(?:core\s+)?i\s*([3579])\s*[- ]?(\d{4,5}[a-z]{0,2})\b/);
  if (m) return `i${m[1]}${m[2]}`;
  m = raw.match(/\bryzen\s*([3579])\s*(?:ai\s*)?(\d{4}[a-z]{0,2})\b/);
  if (m) return `ryzen${m[1]}${m[2]}`;
  m = raw.match(/\bryzen\s*([3579])\b/);
  if (m) return `ryzen${m[1]}`;
  m = raw.match(/\bm([1-4])(?:\s*(pro|max|air|ultra))?\b/);
  if (m) return `m${m[1]}${m[2] ?? ""}`;
  return null;
}

function extractGpu(raw: string): string | null {
  let m = raw.match(/\b(?:geforce\s+)?(rtx|gtx)\s*(\d{3,4})\s*(ti|super)?\b/);
  if (m) return `${m[1]}${m[2]}${m[3] ?? ""}`;
  m = raw.match(/\b(?:radeon\s+)?rx\s*(\d{3,4})\b/);
  if (m) return `rx${m[1]}`;
  m = raw.match(/\bradeon\s+(\d{3,4}m)\b/);
  if (m) return `radeon${m[1]}`;
  return null;
}

function extractMemory(raw: string): { ram?: number; storage?: number } {
  let text = raw.replace(
    /\b(?:rtx|gtx|rx)\s*\d{3,4}[a-z]*\s*(?:ti|super)?\s*\d{1,2}\s*gb\b/g,
    " ",
  );
  const out: { ram?: number; storage?: number } = {};
  const slash = text.match(/\b(\d{1,2})\s*(?:gb)?\s*\/\s*(\d{3,4})\s*(gb|tb)?\b/);
  if (slash) {
    const a = parseInt(slash[1], 10);
    const b = toGb(parseInt(slash[2], 10), slash[3]);
    if (a <= 64 && b >= 64) {
      out.ram = a;
      out.storage = b;
      text = text.replace(slash[0], " ");
    }
  }
  const ram = text.match(/\b(\d{1,2})\s*(gb|tb)\s*(?:ram|ddr\d*|lpddr[\dx]*)\b/)
    ?? text.match(/\b(?:ram|ddr\d*|lpddr[\dx]*)\s*(\d{1,2})\s*(gb|tb)\b/);
  if (ram && out.ram == null) {
    out.ram = toGb(parseInt(ram[1], 10), ram[2]);
    text = text.replace(ram[0], " ");
  }
  const storage = text.match(/\b(\d{1,4})\s*(gb|tb)\s*(?:ssd|hdd|nvme|emmc|ufs)\b/);
  if (storage && out.storage == null) {
    out.storage = toGb(parseInt(storage[1], 10), storage[2]);
    text = text.replace(storage[0], " ");
  }
  if (out.ram != null && out.storage != null) return out;
  const caps = [...text.matchAll(/\b(\d{1,4})\s*(gb|tb)\b/g)].map((m) => toGb(parseInt(m[1], 10), m[2]));
  caps.sort((a, b) => a - b);
  if (caps.length >= 2) {
    if (out.ram == null && caps[0] <= 64) out.ram = caps[0];
    if (out.storage == null && caps[caps.length - 1] >= 64) out.storage = caps[caps.length - 1];
  } else if (caps.length === 1) {
    if (out.storage == null && caps[0] >= 128) out.storage = caps[0];
    else if (out.ram == null && caps[0] <= 64) out.ram = caps[0];
  }
  return out;
}

/**
 * Pull identity specs from the product title so the merge gate has
 * something to compare even when retailers don't publish a specs JSON.
 */
export function extractIdentitySpecs(
  name: string,
  brand: string | null = null,
): Record<string, string> {
  const raw = foldedRaw(name, brand);
  const text = cleanText(name, brand);
  const tokens = tokensOf(text);
  const specs: Record<string, string> = {};

  const mem = extractMemory(raw);
  if (mem.ram != null) specs.RAM = gbLabel(mem.ram);
  if (mem.storage != null) specs.Disku = gbLabel(mem.storage) + (mem.storage >= 64 ? " SSD" : "");

  const cpu = extractCpu(raw);
  if (cpu) specs.Procesori = cpu.toUpperCase();

  const gpu = extractGpu(raw);
  if (gpu) specs.Grafika = gpu.toUpperCase();

  const model = modelCodes(tokens).sort((a, b) => b.length - a.length)[0];
  if (model && !isCpuShaped(model)) {
    specs.Model = model.toUpperCase();
  }

  return specs;
}

/** Normalize a free-text spec value for comparison. */
export function normalizeSpecValue(value: unknown): string {
  if (value == null) return "";
  return fold(String(value))
    .replace(/(\d+)\s*(gb|tb|mb)\b/g, "$1$2")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function canonicalSpecKey(key: string): string {
  const k = fold(key).replace(/[^a-z0-9]+/g, "");
  if (["ram", "memorie"].includes(k)) return "ram";
  if (["memorja", "memory", "storage", "disku", "disk", "ssd", "hdd", "kapaciteti", "capacity"].includes(k)) {
    return "storage";
  }
  if (["procesori", "processor", "cpu"].includes(k)) return "cpu";
  if (["grafika", "graphics", "gpu", "vga"].includes(k)) return "gpu";
  if (["ekrani", "screen", "display"].includes(k)) return "screen";
  if (["rrotullime", "rpm"].includes(k)) return "rpm";
  if (["rezolucioni", "resolution"].includes(k)) return "resolution";
  if (["model", "modeli"].includes(k)) return "model";
  return k;
}

function cpuSku(cpu: string): string {
  const matches = [...cpu.matchAll(/(\d{3,5}[a-z]{0,2})/g)].map((m) => m[1]);
  return matches.sort((a, b) => b.length - a.length)[0] ?? "";
}

function cpuAgree(a: string, b: string): boolean {
  if (a === b) return true;
  const da = cpuSku(a);
  const db = cpuSku(b);
  if (da && db) return da === db;
  if (da || db) return false;
  return a === b;
}

function memoryAgree(a: string, b: string): boolean {
  const ga = a.match(/(\d+)(gb|tb)?/);
  const gb = b.match(/(\d+)(gb|tb)?/);
  if (!ga || !gb) return a === b;
  return toGb(parseInt(ga[1], 10), ga[2]) === toGb(parseInt(gb[1], 10), gb[2]);
}

/**
 * Returns false when both products declare overlapping identity specs
 * that disagree (e.g. 8GB vs 16GB RAM). Empty/missing specs never block.
 * Containment is not enough — "ryzen" must not match "ryzen57520u".
 */
export function specsCompatible(
  a: Record<string, unknown> | null | undefined,
  b: Record<string, unknown> | null | undefined,
): boolean {
  if (!a || !b) return true;
  const mapA = new Map<string, string>();
  const mapB = new Map<string, string>();

  for (const [k, v] of Object.entries(a)) {
    const nk = canonicalSpecKey(k);
    const nv = normalizeSpecValue(v);
    if (nv) mapA.set(nk, nv);
  }
  for (const [k, v] of Object.entries(b)) {
    const nk = canonicalSpecKey(k);
    const nv = normalizeSpecValue(v);
    if (nv) mapB.set(nk, nv);
  }

  for (const [k, va] of mapA) {
    const vb = mapB.get(k);
    if (vb == null || vb === "") continue;
    if (k === "cpu") {
      if (!cpuAgree(va, vb)) return false;
      continue;
    }
    if (k === "ram" || k === "storage") {
      if (!memoryAgree(va, vb)) return false;
      continue;
    }
    if (va === vb) continue;
    if (k === "model" && (va.startsWith(vb) || vb.startsWith(va))) {
      const longer = va.length > vb.length ? va : vb;
      const shorter = va.length > vb.length ? vb : va;
      if (![...longer.slice(shorter.length)].some((ch) => /\d/.test(ch))) continue;
    }
    return false;
  }
  return true;
}

/**
 * Build a stable fingerprint used to group the same product across retailers.
 * Biased toward under-matching (missed merges) rather than false merges.
 */
export function matchKey(name: string, brand: string | null = null): string {
  const text = cleanText(name, brand);
  let tokens = tokensOf(text);
  const brandTok = brandToken(tokens, brand);
  const identity = extractIdentitySpecs(name, brand);
  const codes = modelCodes(tokens);
  const caps = capacityTokens(tokens);
  const cpu = identity.Procesori ? fold(identity.Procesori).replace(/[^a-z0-9]/g, "") : "";
  const gpu = identity.Grafika ? fold(identity.Grafika).replace(/[^a-z0-9]/g, "") : "";

  // Strong path: OEM model code present (never treat a CPU SKU as the model)
  if (codes.length > 0) {
    const code = codes.sort((a, b) => b.length - a.length)[0];
    return [brandTok, code, ...caps, cpu, gpu].filter(Boolean).join(" ");
  }

  const hasSeries = tokens.some((t) => SERIES.has(t));

  // Medium path: phone / tablet / watch series — require storage when present in either naming
  if (hasSeries) {
    const series = tokens.filter((t) => SERIES.has(t) || VARIANT.has(t) || /^\d{1,2}(e|pro|max|plus)?$/i.test(t) || /^s\d{1,2}/i.test(t) || /^a\d{1,2}/i.test(t) || /^m[1-4]$/i.test(t));
    const digits = tokens.filter((t) => /\d/.test(t) && !/^\d+(gb|tb)$/.test(t));
    // Must have a series word + at least one model digit token; otherwise too weak
    const modelDigits = digits.filter((t) => !NOISE.has(t));
    if (modelDigits.length === 0 && caps.length === 0) {
      // Too weak to cross-match — keep a long unique-ish key from title tokens
      return ["weak", brandTok, ...tokens.slice(0, 8)].filter(Boolean).join(" ");
    }
    const keyParts = [...new Set([brandTok, ...series, ...modelDigits, ...caps])].filter(Boolean);
    return keyParts.sort().join(" ");
  }

  // Weak path (no OEM code, no phone series): keep more title signal so only near-identical titles collide
  tokens = tokens.filter((t) => !/^(32|40|43|48|50|55|58|65|70|75|77|83|85|98)$/.test(t));
  const modelish = tokens.filter((t) => /\d/.test(t)).sort();
  const words = tokens.filter((t) => !/\d/.test(t)).sort();
  // Prefix "weak" so these never accidentally equal a strong/medium key
  const key = ["weak", brandTok, ...modelish, ...words].filter(Boolean).join(" ");
  return key || `weak ${text}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
