/**
 * Normalize retailer image URLs to a sharper size before saving to the DB.
 */
export function upgradeScrapedImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  let out = url;

  if (/gjirafamall\.tech|gjirafa50\.com/i.test(out)) {
    if (/([?&])width=\d+/i.test(out)) {
      out = out.replace(/([?&])width=\d+/i, "$1width=800");
    } else {
      out += (out.includes("?") ? "&" : "?") + "width=800";
    }
  }

  if (/butonks\.com|75mall\.com/i.test(out) && /\/thumbnails\//i.test(out)) {
    out = out.replace(/\/thumbnails\/\d+\/\d+(?:\/detailed)?\//i, "/detailed/");
  }

  if (/aztechonline\.com/i.test(out)) {
    out = out
      .replace("/cache/small/", "/cache/large/")
      .replace("/cache/medium/", "/cache/large/");
  }

  return out;
}
