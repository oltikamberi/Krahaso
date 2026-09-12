import type { Metadata } from "next";
import { Package } from "lucide-react";

export const metadata: Metadata = {
  title: "Produktet — Paneli i shitësit",
};

export default function PanelProductsPage() {
  return (
    <div
      className="rounded-xl px-6 py-12 text-center"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div
        className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ backgroundColor: "var(--secondary)" }}
      >
        <Package className="h-5 w-5" style={{ color: "var(--brand-soft)" }} />
      </div>
      <p className="mb-1 text-lg font-semibold" style={{ color: "var(--foreground)" }}>
        Nuk ka produkte
      </p>
      <p className="mx-auto max-w-sm text-sm" style={{ color: "var(--muted-foreground)" }}>
        Produktet shfaqen këtu pasi të lidhet një integrim.
      </p>
    </div>
  );
}
