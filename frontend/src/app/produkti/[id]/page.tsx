import Link from "next/link";
import { ExternalLink, ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice, getProduct } from "@/lib/api";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);
  const history = [...product.priceHistory].reverse();

  return (
    <div className="flex flex-col gap-8">
      <div className="text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">
          Kryefaqja
        </Link>
        {" / "}
        <Link href={`/kategoria/${product.categorySlug}`} className="hover:underline">
          {product.categoryName}
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex min-h-64 items-center justify-center rounded-lg border bg-muted/40">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="max-h-80 object-contain p-6"
            />
          ) : (
            <ImageOff className="h-12 w-12 text-muted-foreground/40" aria-hidden />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{product.brand}</p>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold">
              {formatPrice(product.price, product.currency)}
            </span>
            {product.inStock ? (
              <Badge variant="secondary" className="text-green-700">
                Në stok
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                S&apos;ka stok
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Ofruar nga <span className="font-medium text-foreground">{product.providerName}</span>
          </p>
          <Button
            className="w-fit"
            render={
              <a
                href={product.productUrl}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            Shko te dyqani
            <ExternalLink className="ml-1.5 h-4 w-4" />
          </Button>

          <Separator className="my-2" />

          <div>
            <h2 className="mb-3 font-semibold">Specifikat</h2>
            <dl className="grid grid-cols-1 gap-y-2 text-sm sm:grid-cols-2">
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <dt className="text-muted-foreground">{key}:</dt>
                  <dd className="font-medium">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historia e çmimit</CardTitle>
        </CardHeader>
        <CardContent>
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
                  <TableCell className="font-medium">
                    {formatPrice(point.price, product.currency)}
                  </TableCell>
                  <TableCell>
                    {point.inStock ? "Në stok" : "Jo në stok"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
