import type {
  Category,
  PageResponse,
  ProductDetail,
  ProductFilters,
  ProductSummary,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function get<T>(path: string, revalidateSeconds = 60): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate: revalidateSeconds },
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status} for ${path}`);
  }
  return res.json() as Promise<T>;
}

export function getCategories(): Promise<Category[]> {
  return get<Category[]>("/api/categories", 300);
}

export function getProducts(
  filters: ProductFilters,
): Promise<PageResponse<ProductSummary>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  return get<PageResponse<ProductSummary>>(`/api/products?${params}`, 60);
}

export function searchProducts(query: string): Promise<ProductSummary[]> {
  return get<ProductSummary[]>(
    `/api/products/search?q=${encodeURIComponent(query)}`,
    30,
  );
}

export function getProduct(id: number | string): Promise<ProductDetail> {
  return get<ProductDetail>(`/api/products/${id}`, 60);
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
