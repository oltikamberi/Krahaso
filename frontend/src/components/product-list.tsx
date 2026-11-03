"use client";

import { useState, useTransition } from "react";
import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/api";
import {
  productsPerPage,
  type ProductGridVariant,
} from "@/lib/product-grid";
import type { GroupedProduct, PageResponse, ProductFilters } from "@/lib/types";

const GRID_CLASS: Record<ProductGridVariant, string> = {
  home: "grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4",
  category: "grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4",
};

export function ProductList({
  initial,
  filters = {},
  variant = "home",
}: {
  initial: PageResponse<GroupedProduct>;
  filters?: Omit<ProductFilters, "page" | "size">;
  variant?: ProductGridVariant;
}) {
  const pageSize = productsPerPage(variant);
  const [items, setItems] = useState(initial.items);
  const [page, setPage] = useState(initial.page);
  const [totalPages, setTotalPages] = useState(initial.totalPages);
  const [isPending, startTransition] = useTransition();

  const hasMore = page + 1 < totalPages;

  function loadMore() {
    if (!hasMore || isPending) return;

    startTransition(async () => {
      try {
        const next = await getProducts({
          ...filters,
          page: String(page + 1),
          size: String(pageSize),
        });
        setItems((prev) => {
          const seen = new Set(prev.map((p) => p.matchKey));
          return [...prev, ...next.items.filter((p) => !seen.has(p.matchKey))];
        });
        setPage(next.page);
        setTotalPages(next.totalPages);
      } catch {
        // Keep current list if the next page fails to load
      }
    });
  }

  return (
    <div>
      <div className={GRID_CLASS[variant]}>
        {items.map((product) => (
          <ProductCard key={product.matchKey} product={product} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center sm:mt-10">
          <button
            type="button"
            onClick={loadMore}
            disabled={isPending}
            className="min-h-11 rounded-lg px-6 py-2.5 text-sm font-bold transition-colors disabled:opacity-50 sm:min-h-0"
            style={{
              backgroundColor: "var(--warm-tint)",
              color: "var(--warm)",
              border: "1px solid rgba(234,88,12,0.25)",
            }}
          >
            {isPending ? "Duke ngarkuar…" : "Më shumë produkte"}
          </button>
        </div>
      )}
    </div>
  );
}
