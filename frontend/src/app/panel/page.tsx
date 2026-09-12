import type { Metadata } from "next";
import Link from "next/link";
import { Plug } from "lucide-react";
import { FeedStatusCard } from "@/components/feed-status-card";
import { getSeller } from "@/lib/seller-api";
import { getFeeds } from "@/lib/seller-feeds";

export const metadata: Metadata = {
  title: "Përmbledhje — Paneli i shitësit",
};

export default async function PanelOverviewPage() {
  const [seller, feeds] = await Promise.all([getSeller(), getFeeds()]);

  const offers = feeds.reduce((total, feed) => total + feed.offerCount, 0);
  const lastSyncedAt = feeds
    .map((feed) => feed.lastSyncedAt)
    .filter((value): value is string => value !== null)
    .sort()
    .at(-1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Produkte aktive", value: String(offers) },
          { label: "Integrime", value: String(feeds.length) },
          {
            label: "Sinkronizimi i fundit",
            value: lastSyncedAt
              ? new Date(lastSyncedAt).toLocaleDateString("sq-AL", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "—",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-4"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <p
              className="font-mono text-[10px] uppercase tracking-wider"
              style={{ color: "var(--muted-foreground)" }}
            >
              {stat.label}
            </p>
            <p
              className="mt-1 font-mono text-2xl font-extrabold"
              style={{ color: "var(--foreground)" }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {feeds.length === 0 ? (
        <div
          className="rounded-xl px-6 py-12 text-center"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div
            className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: "var(--secondary)" }}
          >
            <Plug className="h-5 w-5" style={{ color: "var(--brand-soft)" }} />
          </div>
          <p className="mb-1 text-lg font-semibold" style={{ color: "var(--foreground)" }}>
            Nuk ka të dhëna edhe
          </p>
          <p className="mx-auto mb-5 max-w-sm text-sm" style={{ color: "var(--muted-foreground)" }}>
            {seller?.verified
              ? "Lidh një integrim për të dërguar produktet dhe çmimet e tua."
              : "Mund të përgatisësh integrimet tani — ofertat publikohen pasi llogaria verifikohet."}
          </p>
          <Link
            href="/panel/integrimet"
            className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-bold"
            style={{ backgroundColor: "var(--action)", color: "var(--action-foreground)" }}
          >
            Shko te integrimet
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {feeds.map((feed) => (
            <FeedStatusCard key={feed.id} feed={feed} />
          ))}
        </div>
      )}
    </div>
  );
}
