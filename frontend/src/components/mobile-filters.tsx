"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FiltersForm } from "@/components/filters-form";

export function MobileFilters() {
  return (
    <Sheet>
      <SheetTrigger
        render={<Button variant="outline" size="sm" className="lg:hidden" />}
      >
        <SlidersHorizontal className="mr-1.5 h-4 w-4" />
        Filtrat
      </SheetTrigger>
      <SheetContent side="bottom" className="px-4 pb-8">
        <SheetHeader className="px-0">
          <SheetTitle>Filtrat</SheetTitle>
        </SheetHeader>
        <FiltersForm />
      </SheetContent>
    </Sheet>
  );
}
