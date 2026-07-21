"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FiltersForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [inStock, setInStock] = useState(searchParams.get("inStock") === "true");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "newest");

  function apply(event?: React.FormEvent) {
    event?.preventDefault();
    const params = new URLSearchParams();
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (inStock) params.set("inStock", "true");
    if (sort && sort !== "newest") params.set("sort", sort);
    router.push(`${pathname}?${params}`);
  }

  return (
    <form onSubmit={apply} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label>Çmimi (€)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            placeholder="Nga"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            min="0"
            placeholder="Deri"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="inStock"
          checked={inStock}
          onCheckedChange={(checked) => setInStock(checked === true)}
        />
        <Label htmlFor="inStock">Vetëm në stok</Label>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Rendit sipas</Label>
        <Select
          value={sort}
          onValueChange={(value) => setSort(value ?? "newest")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Më të rejat</SelectItem>
            <SelectItem value="price_asc">Çmimi: nga më i ulëti</SelectItem>
            <SelectItem value="price_desc">Çmimi: nga më i larti</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit">Apliko filtrat</Button>
    </form>
  );
}
