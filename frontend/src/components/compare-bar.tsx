"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompare } from "@/components/compare-context";

export function CompareBar() {
  const { items, remove, clear } = useCompare();

  if (items.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background shadow-lg">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <span className="text-sm font-medium">
          Krahaso ({items.length}/4)
        </span>
        <div className="flex flex-1 flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item.id}
              className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"
            >
              <span className="max-w-32 truncate">{item.name}</span>
              <button
                onClick={() => remove(item.id)}
                aria-label={`Hiq ${item.name}`}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={clear}>
          Pastro
        </Button>
        {items.length >= 2 ? (
          <Button
            size="sm"
            render={
              <Link
                href={`/krahaso?ids=${items.map((item) => item.id).join(",")}`}
              />
            }
          >
            Krahaso tani
          </Button>
        ) : (
          <Button size="sm" disabled>
            Krahaso tani
          </Button>
        )}
      </div>
    </div>
  );
}
