"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SellerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactEmail: String(form.get("contactEmail") ?? "").trim(),
        password: String(form.get("password") ?? ""),
      }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      setError(body.message ?? "Email ose fjalëkalim i pasaktë");
      setSubmitting(false);
      return;
    }

    const next = searchParams.get("next");
    router.push(next?.startsWith("/panel") ? next : "/panel");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="contactEmail">Email kontakti</Label>
        <Input id="contactEmail" name="contactEmail" type="email" required className="h-10" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Fjalëkalimi</Label>
        <Input id="password" name="password" type="password" required className="h-10" />
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
        Hyr
      </button>

      <p className="text-center text-xs" style={{ color: "var(--muted-foreground)" }}>
        Nuk ke llogari?{" "}
        <Link href="/regjistrohu" className="font-semibold" style={{ color: "var(--brand-soft)" }}>
          Regjistro biznesin
        </Link>
      </p>
    </form>
  );
}
