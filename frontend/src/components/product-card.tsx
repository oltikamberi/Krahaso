"use client";

import Link from "next/link";
import { ImageOff, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useCompare } from "@/components/compare-context";
import { formatPrice } from "@/lib/api";
import type { ProductSummary } from "@/lib/types";

export function ProductCard({ product }: { product: ProductSummary }) {
  const { toggle, isSelected } = useCompare();
  const selected = isSelected(product.id);

  return (
    <Card className="flex h-full flex-col gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
      <Link
        href={`/produkti/${product.id}`}
        className="flex h-36 items-center justify-center bg-muted/40"
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-contain p-3"
          />
        ) : (
          <ImageOff className="h-8 w-8 text-muted-foreground/40" aria-hidden />
        )}
      </Link>
      <CardContent className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-xs text-muted-foreground">{product.providerName}</p>
        <Link
          href={`/produkti/${product.id}`}
          className="line-clamp-2 text-sm font-medium leading-snug hover:underline"
        >
          {product.name}
        </Link>
        <div className="mt-auto flex items-center gap-2 pt-2">
          <span className="text-lg font-bold">
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
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          variant={selected ? "default" : "outline"}
          size="sm"
          className="w-full"
          onClick={() => toggle(product)}
        >
          <Scale className="mr-1.5 h-4 w-4" />
          {selected ? "Në krahasim" : "Krahaso"}
        </Button>
      </CardFooter>
    </Card>
  );
}
