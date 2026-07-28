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

function modelCodes(tokens: string[]): string[] {
  return tokens.filter((t) => /[a-z]/.test(t) && /\d/.test(t) && t.length >= 6);
}

function capacityTokens(tokens: string[]): string[] {
  return tokens.filter((t) => /^\d+(gb|tb)$/.test(t)).sort();
}

/** CPU-ish tokens: i5-1334u, r7-7730u, ryzen, m3, m4, etc. */
function cpuTokens(tokens: string[]): string[] {
  return tokens
    .filter(
      (t) =>
        /^i[3579]\d{3,5}[a-z]*$/i.test(t) ||
        /^r[3579]\d{3,5}[a-z]*$/i.test(t) ||
        /^ryzen\d*/i.test(t) ||
        /^m[1-4]$/i.test(t) ||
        /^ultra\d/i.test(t),
    )
    .sort();
}

/**
 * Pull identity specs from the product title so the merge gate has
 * something to compare even when retailers don't publish a specs JSON.
 */
export function extractIdentitySpecs(
  name: string,
  brand: string | null = null,
): Record<string, string> {
  const text = cleanText(name, brand);
  const tokens = tokensOf(text);
  const specs: Record<string, string> = {};

  const caps = capacityTokens(tokens);
  // Heuristic: largest GB/TB is usually storage; if two, smaller often RAM on laptops
  if (caps.length === 1) {
    specs.Memorja = caps[0].toUpperCase().replace("GB", " GB").replace("TB", " TB");
  } else if (caps.length >= 2) {
    const nums = caps.map((c) => ({
      raw: c,
      n: parseInt(c, 10) * (c.endsWith("tb") ? 1024 : 1),
    }));
    nums.sort((a, b) => a.n - b.n);
    specs.RAM = nums[0].raw.toUpperCase().replace("GB", " GB").replace("TB", " TB");
    specs.Disku =
      nums[nums.length - 1].raw.toUpperCase().replace("GB", " GB").replace("TB", " TB") + " SSD";
  }

  const cpus = cpuTokens(tokens);
  if (cpus.length > 0) {
    specs.Procesori = cpus.join(" ").toUpperCase();
  }

  const model = modelCodes(tokens).sort((a, b) => b.length - a.length)[0];
  if (model) {
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
  if (["memorja", "memory", "storage", "disku", "disk", "ssd", "hdd"].includes(k)) return "storage";
  if (["procesori", "processor", "cpu"].includes(k)) return "cpu";
  if (["ekrani", "screen", "display"].includes(k)) return "screen";
  if (["kapaciteti", "capacity"].includes(k)) return "capacity";
  if (["rrotullime", "rpm"].includes(k)) return "rpm";
  if (["rezolucioni", "resolution"].includes(k)) return "resolution";
  if (["model", "modeli"].includes(k)) return "model";
  return k;
}

/**
 * Returns false when both products declare overlapping identity specs
 * that disagree (e.g. 8GB vs 16GB RAM). Empty/missing specs never block.
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
    // Allow containment (e.g. "512gb" vs "512gbssd")
    if (va === vb || va.includes(vb) || vb.includes(va)) continue;
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
  const codes = modelCodes(tokens);
  const caps = capacityTokens(tokens);
  const cpus = cpuTokens(tokens);

  // Strong path: OEM model code present
  if (codes.length > 0) {
    const code = codes.sort((a, b) => b.length - a.length)[0];
    return [brandTok, code, ...caps, ...cpus].filter(Boolean).join(" ");
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
