import { CategoryNavBar } from "@/components/category-nav-bar";
import { HomeHero } from "@/components/home-hero";
import { ProductList } from "@/components/product-list";
import { SponsoredSection } from "@/components/sponsored-section";
import { StatsStrip } from "@/components/stats-strip";
import { getProducts } from "@/lib/api";
import { productsPerPage } from "@/lib/product-grid";
import type { PageResponse, GroupedProduct } from "@/lib/types";

const EMPTY_PAGE: PageResponse<GroupedProduct> = {
  items: [],
  page: 0,
  totalPages: 0,
  totalItems: 0,
};

function savingsAmount(product: GroupedProduct): number {
  const offers = product.offers;
  if (offers.length < 2) return 0;
  return offers[offers.length - 1].price - offers[0].price;
}

/** Medium–high savings: skip weak deals and extreme top outliers. */
function pickHeroDeals(items: GroupedProduct[], limit = 8): GroupedProduct[] {
  const ranked = [...items]
    .map((product) => ({ product, savings: savingsAmount(product) }))
    .filter(({ savings }) => savings >= 15)
    .sort((a, b) => a.savings - b.savings);

  if (ranked.length === 0) return [];

  // Drop the cheapest ~30% and the most extreme ~15% at the top
  const dropLow = Math.floor(ranked.length * 0.3);
  const dropHigh = Math.max(1, Math.floor(ranked.length * 0.15));
  const band = ranked.slice(dropLow, Math.max(dropLow + 1, ranked.length - dropHigh));

  // Prefer the higher end of that band
  return band
    .slice(-limit)
    .reverse()
    .map(({ product }) => product);
}

/** Placeholder sponsored picks: in-stock-ish popular items, not overlapping hero deals. */
function pickSponsored(
  items: GroupedProduct[],
  excludeKeys: Set<string>,
  limit = 4,
): GroupedProduct[] {
  return items
    .filter(
      (p) =>
        !excludeKeys.has(p.matchKey) &&
        p.offerCount >= 2 &&
        Boolean(p.imageUrl || p.offers.some((o) => o.imageUrl)),
    )
    .slice(0, limit);
}

export default async function HomePage() {
  let products = EMPTY_PAGE;
  let deals: GroupedProduct[] = [];
  let sponsored: GroupedProduct[] = [];
  const pageSize = productsPerPage("home");
  const listFilters = { sort: "best", size: String(pageSize) };

  try {
    products = await getProducts({ page: "0", ...listFilters });
    deals = pickHeroDeals(products.items);
    sponsored = pickSponsored(
      products.items,
      new Set(deals.map((d) => d.matchKey)),
    );
  } catch {
    /* API offline */
  }

  return (
    <div>
      <HomeHero deals={deals} />
      {/* Phone: categories sit just above the stats/info strip */}
      <CategoryNavBar className="md:hidden" />
      <StatsStrip />
      <SponsoredSection products={sponsored} />

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-5 flex items-center gap-2">
          <span className="font-mono text-sm" style={{ color: "var(--muted-foreground)" }}>
            <span className="font-semibold" style={{ color: "var(--foreground)" }}>
              {products.totalItems || products.items.length}
            </span>{" "}
            produkte gjenden
          </span>
        </div>

        {products.items.length > 0 ? (
          <ProductList initial={products} filters={listFilters} variant="home" />
        ) : (
          <div className="py-24 text-center">
            <p className="mb-1 text-lg font-semibold" style={{ color: "var(--foreground)" }}>
              Nuk u gjet asnjë produkt
            </p>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Nis backend-in ose provo përsëri më vonë.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
