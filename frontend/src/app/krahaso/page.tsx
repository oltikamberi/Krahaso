import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { compareProducts, formatPrice } from "@/lib/api";

interface PageProps {
  searchParams: Promise<{ ids?: string }>;
}

export default async function ComparePage({ searchParams }: PageProps) {
  const { ids } = await searchParams;
  const idList = (ids ?? "").split(",").filter(Boolean).slice(0, 4);

  if (idList.length < 2) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Krahaso produkte</h1>
        <p className="text-muted-foreground">
          Zgjidh të paktën 2 produkte për t&apos;i krahasuar.
        </p>
        <Button render={<Link href="/" />}>Shfleto produktet</Button>
      </div>
    );
  }

  const products = await compareProducts(idList);

  // Union of all spec keys so every product shows every row
  const specKeys = [
    ...new Set(products.flatMap((product) => Object.keys(product.specs))),
  ];

  const lowestPrice = Math.min(...products.map((product) => product.price));

  function differs(values: string[]): boolean {
    return new Set(values).size > 1;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Krahasimi i produkteve</h1>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40" />
              {products.map((product) => (
                <TableHead key={product.id} className="min-w-44">
                  <Link
                    href={`/produkti/${product.id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 text-xs font-normal text-muted-foreground">
                    {product.providerName}
                  </p>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium text-muted-foreground">
                Çmimi
              </TableCell>
              {products.map((product) => (
                <TableCell key={product.id}>
                  <span
                    className={
                      product.price === lowestPrice
                        ? "text-lg font-bold text-primary"
                        : "text-lg font-bold"
                    }
                  >
                    {formatPrice(product.price, product.currency)}
                  </span>
                  {product.price === lowestPrice && (
                    <Badge variant="secondary" className="ml-2 text-green-700">
                      Më i liri
                    </Badge>
                  )}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-muted-foreground">
                Disponueshmëria
              </TableCell>
              {products.map((product) => (
                <TableCell key={product.id}>
                  {product.inStock ? "Në stok" : "Jo në stok"}
                </TableCell>
              ))}
            </TableRow>
            {specKeys.map((key) => {
              const values = products.map((product) =>
                product.specs[key] != null ? String(product.specs[key]) : "—",
              );
              const highlight = differs(values);
              return (
                <TableRow key={key}>
                  <TableCell className="font-medium text-muted-foreground">
                    {key}
                  </TableCell>
                  {values.map((value, index) => (
                    <TableCell
                      key={index}
                      className={highlight ? "font-semibold" : ""}
                    >
                      {value}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
            <TableRow>
              <TableCell />
              {products.map((product) => (
                <TableCell key={product.id}>
                  <Button
                    size="sm"
                    render={
                      <a
                        href={product.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    Shko te dyqani
                  </Button>
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
