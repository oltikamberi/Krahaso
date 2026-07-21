/** Normalized product shape — every adapter must map its site's data into this. */
export interface ScrapedProduct {
  /** Slug of an existing category row (seeded by the backend migrations). */
  categorySlug: string;
  /** Stable id/url of the product on the provider's site. */
  externalId: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  productUrl: string;
  price: number;
  currency: string;
  inStock: boolean;
  specs: Record<string, string | number | boolean>;
}

/** One adapter per retailer site. Adding a new site = writing one new adapter. */
export interface SiteAdapter {
  /** Provider row in the database (created if missing). */
  provider: {
    slug: string;
    name: string;
    websiteUrl: string;
  };
  /** Fetch and normalize all products from the site. */
  fetchProducts(): Promise<ScrapedProduct[]>;
}
