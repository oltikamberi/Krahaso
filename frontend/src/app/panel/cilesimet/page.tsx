import type { Metadata } from "next";
import { getSeller } from "@/lib/seller-api";

export const metadata: Metadata = {
  title: "Cilësimet — Paneli i shitësit",
};

export default async function PanelSettingsPage() {
  const seller = await getSeller();
  if (!seller) return null;

  const rows = [
    { label: "Emri i biznesit", value: seller.businessName },
    { label: "Numri fiskal / i regjistrimit", value: seller.taxId },
    { label: "Email kontakti", value: seller.contactEmail },
    { label: "Statusi", value: seller.verified ? "I verifikuar" : "Në pritje të verifikimit" },
  ];

  return (
    <div
      className="rounded-xl p-6"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <h2 className="mb-4 text-base font-bold" style={{ color: "var(--foreground)" }}>
        Të dhënat e llogarisë
      </h2>
      <dl className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 last:border-0 last:pb-0"
            style={{ borderColor: "var(--border)" }}
          >
            <dt className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {row.label}
            </dt>
            <dd className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
