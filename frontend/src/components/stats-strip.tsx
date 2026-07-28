import { getCatalogStats } from "@/lib/api";
import { formatPrice } from "@/lib/api";

function formatCount(n: number): string {
  return new Intl.NumberFormat("de-DE").format(n);
}

export async function StatsStrip() {
  let productCount = 0;
  let storeCount = 0;
  let comparableCount = 0;
  let avgSavings = 0;

  try {
    const stats = await getCatalogStats();
    productCount = stats.productCount;
    storeCount = stats.storeCount;
    comparableCount = stats.comparableCount;
    avgSavings = stats.avgSavings;
  } catch {
    /* API offline — leave zeros */
  }

  const stats = [
    { label: "Produkte", value: productCount ? formatCount(productCount) : "—", highlight: false },
    { label: "Dyqane", value: storeCount ? formatCount(storeCount) : "—", highlight: false },
    {
      label: "Me krahasim",
      value: comparableCount ? formatCount(comparableCount) : "—",
      highlight: false,
    },
    {
      label: "Kursim mesatar",
      value: avgSavings ? formatPrice(avgSavings) : "—",
      highlight: true,
    },
  ];

  return (
    <div className="border-b bg-card" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 py-4 sm:grid-cols-4">
        {stats.map((stat, idx) => (
          <div
            key={stat.label}
            className="px-4 py-2 text-center"
            style={{
              borderRight: idx < 3 ? "1px solid var(--border)" : "none",
            }}
          >
            <div
              className="font-mono text-xl font-extrabold"
              style={{ color: stat.highlight ? "var(--savings)" : "var(--foreground)" }}
            >
              {stat.value}
            </div>
            <div className="mt-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
