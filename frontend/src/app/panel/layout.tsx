import { redirect } from "next/navigation";
import { BadgeCheck, Clock } from "lucide-react";
import { SellerNav } from "@/components/seller-nav";
import { SellerLogoutButton } from "@/components/seller-logout-button";
import { getSeller } from "@/lib/seller-api";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const seller = await getSeller();
  if (!seller) {
    redirect("/hyrje?next=/panel");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p
            className="font-mono text-[11px] uppercase tracking-wider"
            style={{ color: "var(--muted-foreground)" }}
          >
            Paneli i shitësit
          </p>
          <h1
            className="text-2xl font-extrabold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            {seller.businessName}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {seller.verified ? (
            <span
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
              style={{ backgroundColor: "var(--savings-bg)", color: "var(--savings)" }}
            >
              <BadgeCheck className="h-3.5 w-3.5" />
              I verifikuar
            </span>
          ) : (
            <span
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
              style={{ backgroundColor: "var(--cheapest-bg)", color: "var(--deal-foreground)" }}
            >
              <Clock className="h-3.5 w-3.5" />
              Në pritje të verifikimit
            </span>
          )}
          <SellerLogoutButton />
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-56 lg:shrink-0">
          <SellerNav />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
