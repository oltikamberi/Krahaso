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
            className="min-h-11 px-4 text-sm font-bold underline underline-offset-4 transition-opacity hover:opacity-70 active:opacity-60 sm:min-h-0 sm:px-0"
            style={{ color: "var(--foreground)" }}
          >
            Më shumë produkte
          </button>
        </div>
      )}
    </div>
  );
}
