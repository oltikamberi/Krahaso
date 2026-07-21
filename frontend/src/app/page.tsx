import Link from "next/link";
import { CategoryIcon } from "@/components/category-icon";
import { Card, CardContent } from "@/components/ui/card";
import { HomeSearch } from "@/components/home-search";
import { getCategories } from "@/lib/api";

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <div className="flex flex-col items-center gap-12 py-8">
      <div className="flex max-w-2xl flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Gjej çmimin më të mirë në Kosovë
        </h1>
        <p className="text-lg text-muted-foreground">
          Krahaso çmimet e produkteve elektronike nga dyqanet online në Kosovë —
          shpejt, thjesht dhe falas.
        </p>
        <HomeSearch />
      </div>

      <div className="w-full">
        <h2 className="mb-4 text-lg font-semibold">Kategoritë</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categories.map((category) => (
            <Link key={category.id} href={`/kategoria/${category.slug}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col items-center gap-3 py-6">
                  <CategoryIcon
                    icon={category.icon}
                    className="h-8 w-8 text-primary"
                  />
                  <span className="text-sm font-medium">{category.name}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
