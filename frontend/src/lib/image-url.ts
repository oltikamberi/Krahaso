/**
 * Retailer scrapers often store catalog thumbnails. Upscale known URL patterns
 * so product pages don't stretch a 190px image across a large stage.
 */
export function upgradeImageUrl(
  url: string | null | undefined,
  size: "card" | "detail" = "card",
): string | null {
  if (!url) return null;

  let out = url;

  // Gjirafa CDN — listing pages scrape ?width=190
  if (/gjirafamall\.tech|gjirafa50\.com/i.test(out)) {
    const target = size === "detail" ? 1200 : 800;
    if (/([?&])width=\d+/i.test(out)) {
      out = out.replace(/([?&])width=\d+/i, `$1width=${target}`);
    } else {
      out += (out.includes("?") ? "&" : "?") + `width=${target}`;
    }
  }

  // Buton / 75Mall — grid uses /thumbnails/177/177/detailed/...
  if (/butonks\.com|75mall\.com/i.test(out) && /\/thumbnails\//i.test(out)) {
    out = out.replace(/\/thumbnails\/\d+\/\d+(?:\/detailed)?\//i, "/detailed/");
  }

  // Aztech — prefer large over medium/small cache
  if (/aztechonline\.com/i.test(out)) {
    out = out
      .replace("/cache/small/", "/cache/large/")
      .replace("/cache/medium/", size === "detail" ? "/cache/original/" : "/cache/large/");
  }

  return out;
}
