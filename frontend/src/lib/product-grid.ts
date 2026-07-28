/** Largest breakpoint column count for each product grid variant. */
export const PRODUCT_GRID_COLUMNS = {
  home: 4,
  category: 4,
} as const;

export type ProductGridVariant = keyof typeof PRODUCT_GRID_COLUMNS;

/** Six rows × columns at the largest breakpoint. */
export function productsPerPage(variant: ProductGridVariant): number {
  return PRODUCT_GRID_COLUMNS[variant] * 6;
}
