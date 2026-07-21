import { ProductCard } from "@/components/product-card";
import { searchProducts } from "@/lib/api";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const products = query ? await searchProducts(query) : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Rezultatet e kërkimit</h1>
        <p className="text-sm text-muted-foreground">
          {query ? `"${query}" — ${products.length} produkte` : "Shkruaj diçka për të kërkuar"}
        </p>
      </div>

      {products.length === 0 && query ? (
        <p className="py-12 text-center text-muted-foreground">
          Nuk u gjet asnjë produkt për &quot;{query}&quot;.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
