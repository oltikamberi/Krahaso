import { CategoryNavBar } from "@/components/category-nav-bar";
import { HomeHero } from "@/components/home-hero";
import { ProductList } from "@/components/product-list";
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

export default async function HomePage() {
  let products = EMPTY_PAGE;
  const pageSize = productsPerPage("home");
  const listFilters = { sort: "best", size: String(pageSize) };

  try {
    products = await getProducts({ page: "0", ...listFilters });
  } catch {
    /* API offline */
  }

  return (
    <div>
      <HomeHero />
      {/* Phone: categories sit just above the stats/info strip */}
      <CategoryNavBar className="md:hidden" />
      <StatsStrip />

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
