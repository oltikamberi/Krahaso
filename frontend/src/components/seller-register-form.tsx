"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SellerRegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");

    if (password.length < 8) {
      setError("Fjalëkalimi duhet të ketë së paku 8 karaktere");
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: String(form.get("businessName") ?? "").trim(),
        taxId: String(form.get("taxId") ?? "").trim(),
        contactEmail: String(form.get("contactEmail") ?? "").trim(),
        password,
      }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      setError(body.message ?? "Regjistrimi dështoi. Provo përsëri.");
      setSubmitting(false);
      return;
    }

    router.push("/panel");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="businessName">Emri i biznesit</Label>
        <Input id="businessName" name="businessName" required className="h-10" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="taxId">Numri fiskal / i regjistrimit</Label>
        <Input id="taxId" name="taxId" required className="h-10" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contactEmail">Email kontakti</Label>
        <Input id="contactEmail" name="contactEmail" type="email" required className="h-10" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Fjalëkalimi</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="h-10"
        />
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          Së paku 8 karaktere.
        </p>
      </div>

      {error && (
        <p
          className="rounded-lg px-3 py-2 text-sm"
          style={{ backgroundColor: "rgba(255,107,74,0.12)", color: "var(--action)" }}
          role="alert"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-60"
        style={{ backgroundColor: "var(--action)", color: "var(--action-foreground)" }}
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Krijo llogari
      </button>

      <p className="text-center text-xs" style={{ color: "var(--muted-foreground)" }}>
        Ke llogari?{" "}
        <Link href="/hyrje" className="font-semibold" style={{ color: "var(--brand-soft)" }}>
          Hyr në panel
        </Link>
      </p>
    </form>
  );
}
