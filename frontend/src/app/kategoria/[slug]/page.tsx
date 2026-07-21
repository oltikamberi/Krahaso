import { Suspense } from "react";
import { FiltersForm } from "@/components/filters-form";
import { MobileFilters } from "@/components/mobile-filters";
import { ProductCard } from "@/components/product-card";
import { getCategories, getProducts } from "@/lib/api";

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

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ category: slug, ...filters }),
  ]);
  const category = categories.find((entry) => entry.slug === slug);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{category?.name ?? slug}</h1>
          <p className="text-sm text-muted-foreground">
            {products.totalItems} produkte
          </p>
        </div>
        <Suspense>
          <MobileFilters />
        </Suspense>
      </div>

      <div className="flex gap-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <Suspense>
            <FiltersForm />
          </Suspense>
        </aside>

        <div className="flex-1">
          {products.items.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              Nuk u gjet asnjë produkt me këto filtra.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {products.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
