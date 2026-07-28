export interface Category {
  id: number;
  slug: string;
  name: string;
  icon: string | null;
}

export interface ProductOffer {
  id: number;
  providerName: string;
  providerSlug: string;
  price: number;
  currency: string;
  inStock: boolean;
  productUrl: string;
  imageUrl?: string | null;
}

/** One catalog card = one product across all retailers. */
export interface GroupedProduct {
  matchKey: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  categorySlug: string;
  lowestPrice: number;
  currency: string;
  offerCount: number;
  offers: ProductOffer[];
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
  matchKey?: string | null;
  categoryName: string;
  providerWebsiteUrl: string;
  specs: Record<string, string | number | boolean | null>;
  priceHistory: PricePoint[];
  offers?: ProductOffer[];
}

export interface CatalogStats {
  productCount: number;
  storeCount: number;
  comparableCount: number;
  avgSavings: number;
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
  size?: string;
}
