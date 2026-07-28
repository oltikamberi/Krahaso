import { CategoryNavBar } from "@/components/category-nav-bar";
import { SearchProductList } from "@/components/search-product-list";
import { searchProducts } from "@/lib/api";
import { Search } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  let products: Awaited<ReturnType<typeof searchProducts>> = [];

  try {
    products = query ? await searchProducts(query) : [];
  } catch {
    products = [];
  }

  return (
    <div>
      <CategoryNavBar className="md:hidden" />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--foreground)" }}>
            Rezultatet e kërkimit
          </h1>
          <p className="mt-1 font-mono text-sm" style={{ color: "var(--muted-foreground)" }}>
            {query ? (
              <>
                &quot;{query}&quot; —{" "}
                <span className="font-semibold" style={{ color: "var(--foreground)" }}>
                  {products.length}
                </span>{" "}
                produkte gjenden
              </>
            ) : (
              "Shkruaj diçka për të kërkuar"
            )}
          </p>
        </div>

        {products.length === 0 && query ? (
          <div className="py-24 text-center">
            <Search
              className="mx-auto mb-4 h-12 w-12"
              style={{ color: "var(--muted-foreground)", opacity: 0.3 }}
            />
            <p className="mb-1 text-lg font-semibold" style={{ color: "var(--foreground)" }}>
              Nuk u gjet asnjë produkt
            </p>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Provo me fjalë kyçe të tjera ose pastro filtrat.
            </p>
          </div>
        ) : products.length > 0 ? (
          <SearchProductList products={products} />
        ) : null}
      </div>
    </div>
  );
}
