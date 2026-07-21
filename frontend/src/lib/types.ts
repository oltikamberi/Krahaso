export interface Category {
  id: number;
  slug: string;
  name: string;
  icon: string | null;
}

export interface ProductSummary {
  id: number;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  productUrl: string;
  price: number;
  currency: string;
  inStock: boolean;
  categorySlug: string;
  providerName: string;
  providerSlug: string;
}

export interface PricePoint {
  price: number;
  inStock: boolean;
  scrapedAt: string;
}

export interface ProductDetail extends ProductSummary {
  categoryName: string;
  providerWebsiteUrl: string;
  specs: Record<string, string | number | boolean | null>;
  priceHistory: PricePoint[];
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  totalPages: number;
  totalItems: number;
}

export interface ProductFilters {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: string;
  sort?: string;
  page?: string;
}
