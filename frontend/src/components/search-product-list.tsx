"use client";

import { useState } from "react";
import { ProductCard } from "@/components/product-card";
import { productsPerPage } from "@/lib/product-grid";
import type { GroupedProduct } from "@/lib/types";

export function SearchProductList({ products }: { products: GroupedProduct[] }) {
  const pageSize = productsPerPage("home");
  const [visible, setVisible] = useState(pageSize);

  const shown = products.slice(0, visible);
  const hasMore = visible < products.length;

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {shown.map((product) => (
          <ProductCard key={product.matchKey} product={product} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center sm:mt-10">
          <button
            type="button"
            onClick={() => setVisible((n) => n + pageSize)}
            className="min-h-11 rounded-lg px-6 py-2.5 text-sm font-bold transition-colors sm:min-h-0"
            style={{
              backgroundColor: "var(--warm-tint)",
              color: "var(--warm)",
              border: "1px solid rgba(234,88,12,0.25)",
            }}
          >
            Më shumë produkte
          </button>
        </div>
      )}
    </div>
  );
}
