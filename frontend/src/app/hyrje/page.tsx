import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LogIn } from "lucide-react";
import { SellerLoginForm } from "@/components/seller-login-form";
import { getSeller } from "@/lib/seller-api";

export const metadata: Metadata = {
  title: "Hyrje për shitës — Krahaso Cmimin",
  description: "Hyr në panelin e shitësit në Krahaso Cmimin.",
};

export default async function LoginPage() {
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
          <LogIn className="h-5 w-5" style={{ color: "var(--brand-soft)" }} />
        </div>
        <h1
          className="text-2xl font-extrabold tracking-tight"
          style={{ color: "var(--foreground)" }}
        >
          Hyrje për shitës
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
          Vazhdo te paneli i dyqanit tënd.
        </p>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <Suspense>
          <SellerLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
