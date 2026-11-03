import type {
  CatalogStats,
  Category,
  GroupedProduct,
  PageResponse,
  ProductDetail,
  ProductFilters,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/**
 * Render's free plan can take ~30–60s to wake. Keep this long enough that a
 * cold start still returns catalog data, but short enough a truly down API
 * cannot stall a Vercel build forever.
 */
const FETCH_TIMEOUT_MS = 45_000;

async function get<T>(path: string, revalidateSeconds = 60): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate: revalidateSeconds },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  return readJson(res, path);
}

/**
 * Search and the product page. These stay uncached: a webhook writes the new
 * price straight away, and the next load of the public page has to show it.
 * Listing pages keep the short revalidate in {@link get}.
 */
async function getFresh<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  return readJson(res, path);
}

async function readJson<T>(res: Response, path: string): Promise<T> {
  if (!res.ok) {
    throw new Error(`API error ${res.status} for ${path}`);
  }
  return res.json() as Promise<T>;
}

export function getCategories(): Promise<Category[]> {
  return get<Category[]>("/api/categories", 300);
}

export function getCatalogStats(): Promise<CatalogStats> {
  return get<CatalogStats>("/api/products/stats", 120);
}

export function getProducts(
  filters: ProductFilters,
): Promise<PageResponse<GroupedProduct>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  return get<PageResponse<GroupedProduct>>(`/api/products?${params}`, 30);
}

export function searchProducts(query: string): Promise<GroupedProduct[]> {
  return getFresh<GroupedProduct[]>(
    `/api/products/search?q=${encodeURIComponent(query)}`,
  );
}

export function getProduct(id: number | string): Promise<ProductDetail> {
  return getFresh<ProductDetail>(`/api/products/${id}`);
}

export function compareProducts(ids: string[]): Promise<ProductDetail[]> {
  return get<ProductDetail[]>(
    `/api/products/compare?ids=${ids.join(",")}`,
    60,
  );
}

export function formatPrice(price: number, currency = "EUR"): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(price);
}
