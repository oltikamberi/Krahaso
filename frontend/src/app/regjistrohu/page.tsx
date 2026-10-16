import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Store } from "lucide-react";
import { SellerRegisterForm } from "@/components/seller-register-form";
import { getSeller } from "@/lib/seller-api";

export const metadata: Metadata = {
  title: "Regjistro biznesin tënd  — Krahaso Cmimin",
  description: "Regjistro dyqanin tënd dhe listo produktet në Krahaso Cmimin.",
};

export default async function RegisterPage() {
  if (await getSeller()) {
    redirect("/panel");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="mb-8 text-center">
        <div
          className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: "var(--secondary)" }}
        >
          <Store className="h-5 w-5" style={{ color: "var(--brand-soft)" }} />
        </div>
        <h1
          className="text-2xl font-extrabold tracking-tight"
          style={{ color: "var(--foreground)" }}
        >
          Regjistro biznesin tënd   <br />
          Listo produktet e tua  <br />
          dhe arrij blerësit në Kosovë <br />
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
        Mos e lëshoni këtë mundësi të reklamoni dhe shitni produktet tuaja
        </p>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <SellerRegisterForm />
      </div>

      <p className="mt-4 text-center text-xs" style={{ color: "var(--muted-foreground)" }}>
        Llogaria kalon në verifikim manual para se ofertat të publikohen.
      </p>
    </div>
  );
}
