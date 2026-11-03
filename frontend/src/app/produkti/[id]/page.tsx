import Link from "next/link";
import { ExternalLink, ImageOff } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryNavBar } from "@/components/category-nav-bar";
import { formatPrice, getProduct } from "@/lib/api";
import { upgradeImageUrl } from "@/lib/image-url";
import { PriceComparisonStack } from "@/components/price-comparison-stack";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);
  const history = [...product.priceHistory].reverse();

  const offers = (
    product.offers && product.offers.length > 0
      ? product.offers
      : product.inStock
        ? [
            {
              id: product.id,
              providerName: product.providerName,
              providerSlug: product.providerSlug,
              price: product.price,
              currency: product.currency,
              inStock: product.inStock,
              productUrl: product.productUrl,
            },
          ]
        : []
  )
    .filter((o) => o.inStock)
    .sort((a, b) => a.price - b.price);
  const cheapest = offers[0];
  const savings =
    offers.length > 1 ? offers[offers.length - 1].price - cheapest.price : 0;
  const imageUrl = upgradeImageUrl(product.imageUrl, "detail");

  return (
    <div>
      <CategoryNavBar className="md:hidden" />
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8">
      <div className="font-mono text-sm" style={{ color: "var(--muted-foreground)" }}>
        <Link href="/" className="hover:underline" style={{ color: "var(--brand-soft)" }}>
          Kryefaqja
        </Link>
        {" / "}
        <Link
          href={`/kategoria/${product.categorySlug}`}
          className="hover:underline"
          style={{ color: "var(--brand-soft)" }}
        >
          {product.categoryName}
        </Link>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-2">
        <div
          className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-white"
          style={{ border: "1px solid var(--border)" }}
        >
          {/* Soft stage wash so white product photos still have depth */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(0,59,113,0.04) 0%, transparent 65%)",
            }}
          />
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="relative z-[1] h-full w-full object-contain p-8 md:p-12 lg:p-14"
            />
          ) : (
            <ImageOff
              className="relative z-[1] h-14 w-14 opacity-30"
              style={{ color: "var(--muted-foreground)" }}
              aria-hidden
            />
          )}
        </div>

        <div className="flex flex-col gap-4">
          {product.brand && (
            <p
              className="font-mono text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--brand-soft)" }}
            >
              {product.brand}
            </p>
          )}
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--foreground)" }}>
            {product.name}
          </h1>

          {cheapest ? (
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                  {offers.length > 1
                    ? `Nga ${offers.length} dyqane · më i liri`
                    : `1 dyqan`}
                </p>
                <span className="font-mono text-3xl font-extrabold" style={{ color: "var(--price-highlight)" }}>
                  {formatPrice(cheapest.price, product.currency)}
                </span>
              </div>
              {savings > 5 ? (
                <span className="mb-1 text-lg font-bold" style={{ color: "var(--savings)" }}>
                  Kurseni deri {formatPrice(savings, product.currency)}
                </span>
              ) : offers.length > 1 && savings > 0 && savings <= 5 ? (
                <span
                  className="mb-1 inline-flex items-baseline gap-1.5 rounded-md px-2.5 py-1 text-sm font-bold"
                  style={{
                    backgroundColor: "var(--cheapest-bg)",
                    color: "var(--deal-foreground)",
                    border: "1px solid var(--cheapest-border)",
                  }}
                >
                  Diferencë shumë e vogël
                  <span className="font-mono tabular-nums">
                    {formatPrice(savings, product.currency)}
                  </span>
                </span>
              ) : offers.length > 1 && savings === 0 ? (
                <span
                  className="mb-1 rounded-md px-2.5 py-1 text-sm font-bold"
                  style={{
                    backgroundColor: "var(--cheapest-bg)",
                    color: "var(--deal-foreground)",
                    border: "1px solid var(--cheapest-border)",
                  }}
                >
                  Çmime të njejta
                </span>
              ) : null}
              <span
                className="mb-1.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: "var(--savings)" }}
              >
                Në stok
              </span>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Ky produkt nuk është aktualisht në stok te asnjë dyqan.
            </p>
          )}

          {cheapest && (
            <a
              href={cheapest.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded px-5 py-2.5 text-sm font-bold transition-colors"
              style={{
                backgroundColor: "var(--action)",
                color: "var(--action-foreground)",
              }}
            >
              Shko te {cheapest.providerName}
              <ExternalLink className="h-4 w-4" />
            </a>
          )}

          <Separator className="my-1" />

          <PriceComparisonStack offers={offers} currency={product.currency} />

          <Separator className="my-1" />

          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider" style={{ color: "var(--foreground)" }}>
              Specifikat
            </h2>
            {Object.keys(product.specs).length === 0 ? (
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Specifikat do të shtohen së shpejti.
              </p>
            ) : (
              <dl className="grid grid-cols-1 gap-y-2 text-sm sm:grid-cols-2">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <dt style={{ color: "var(--muted-foreground)" }}>{key}:</dt>
                    <dd className="font-medium" style={{ color: "var(--foreground)" }}>
                      {String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </div>

      <div
        className="overflow-hidden rounded-lg"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--foreground)" }}>
            Historia e çmimit
          </h2>
        </div>
        <div className="p-2">
          {history.length === 0 ? (
            <p className="px-3 py-6 text-sm" style={{ color: "var(--muted-foreground)" }}>
              Nuk ka ende histori çmimi për këtë listim.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Çmimi</TableHead>
                  <TableHead>Disponueshmëria</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((point, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {new Date(point.scrapedAt).toLocaleDateString("sq-AL", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="font-mono font-semibold" style={{ color: "var(--price-highlight)" }}>
                      {formatPrice(point.price, product.currency)}
                    </TableCell>
                    <TableCell>{point.inStock ? "Në stok" : "Jo në stok"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
