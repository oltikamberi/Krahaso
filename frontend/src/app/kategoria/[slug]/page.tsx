import { Suspense } from "react";
import { CategoryNavBar } from "@/components/category-nav-bar";
import { FiltersForm } from "@/components/filters-form";
import { MobileFilters } from "@/components/mobile-filters";
import { ProductList } from "@/components/product-list";
import { getCategories, getProducts } from "@/lib/api";
import { productsPerPage } from "@/lib/product-grid";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const filters = await searchParams;
  const pageSize = productsPerPage("category");
  const listFilters = {
    category: slug,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    inStock: filters.inStock,
    sort: filters.sort ?? "best",
    size: String(pageSize),
  };

  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let products: Awaited<ReturnType<typeof getProducts>> = {
    items: [],
    page: 0,
    totalPages: 0,
    totalItems: 0,
  };

  try {
    [categories, products] = await Promise.all([
      getCategories(),
      getProducts({ ...listFilters, page: "0" }),
    ]);
  } catch {
    // Backend offline
  }

  const category = categories.find((entry) => entry.slug === slug);

  return (
    <div>
      <CategoryNavBar className="md:hidden" />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--foreground)" }}>
              {category?.name ?? slug}
            </h1>
          </div>
          <Suspense>
            <MobileFilters />
          </Suspense>
        </div>

        <div className="flex gap-8">
          <aside className="hidden w-56 shrink-0 lg:block">
            <div
              className="rounded-lg p-4"
              style={{ backgroundColor: "var(--secondary)", border: "1px solid var(--border)" }}
            >
              <Suspense>
                <FiltersForm />
              </Suspense>
            </div>
          </aside>

          <div className="flex-1">
            {products.items.length === 0 ? (
              <div className="py-24 text-center">
                <p className="mb-1 text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                  Nuk u gjet asnjë produkt
                </p>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  Nuk u gjet asnjë produkt me këto filtra.
                </p>
              </div>
            ) : (
              <ProductList
                key={`${slug}-${filters.minPrice}-${filters.maxPrice}-${filters.inStock}-${filters.sort}`}
                initial={products}
                filters={listFilters}
                variant="category"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
