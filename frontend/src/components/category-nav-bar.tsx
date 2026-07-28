import { CategoryNav } from "@/components/category-nav";
import { getCategories } from "@/lib/api";
import type { Category } from "@/lib/types";

const FALLBACK_CATEGORIES: Category[] = [
  { id: 1, slug: "telefona", name: "Telefona", icon: "smartphone" },
  { id: 2, slug: "laptope", name: "Laptopë", icon: "laptop" },
  { id: 5, slug: "gaming", name: "Gaming", icon: "gamepad" },
  { id: 3, slug: "televizore", name: "Televizorë", icon: "tv" },
  { id: 4, slug: "pajisje-shtepiake", name: "Pajisje Shtëpiake", icon: "washing-machine" },
];

/** Site-wide category strip. Pass className to control desktop/mobile placement. */
export async function CategoryNavBar({ className }: { className?: string }) {
  let categories = FALLBACK_CATEGORIES;
  try {
    const fromApi = await getCategories();
    if (fromApi.length > 0) categories = fromApi;
  } catch {
    /* API offline — use fallback */
  }
  return (
    <div className={className}>
      <CategoryNav categories={categories} />
    </div>
  );
}
