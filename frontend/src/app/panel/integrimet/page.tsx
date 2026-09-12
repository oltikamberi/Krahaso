import type { Metadata } from "next";
import { KeyRound, Link2, Upload } from "lucide-react";
import { FeedApiKeyCard } from "@/components/feed-api-key-card";
import { FeedStatusCard } from "@/components/feed-status-card";
import { FeedUploadCard } from "@/components/feed-upload-card";
import { FeedUrlCard } from "@/components/feed-url-card";
import { getFeeds } from "@/lib/seller-feeds";

export const metadata: Metadata = {
  title: "Integrimet — Paneli i shitësit",
};

export default async function PanelIntegrationsPage() {
  const feeds = await getFeeds();
  const urlFeed = feeds.find((feed) => feed.type === "url");
  const apiFeed = feeds.find((feed) => feed.type === "api");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
          Integrimet
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
          Zgjidh si dëshiron t&apos;i dërgosh produktet dhe çmimet e tua.
        </p>
      </div>

      {feeds.map((feed) => (
        <FeedStatusCard key={feed.id} feed={feed} />
      ))}

      <div className="grid gap-4 lg:grid-cols-3">
        <section
          className="rounded-xl p-5"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <header className="mb-4 flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: "var(--secondary)" }}
            >
              <Upload className="h-4 w-4" style={{ color: "var(--brand-soft)" }} />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                Ngarko skedar
              </h3>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                CSV ose XML
              </p>
            </div>
          </header>
          <FeedUploadCard />
        </section>

        <section
          className="rounded-xl p-5"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <header className="mb-4 flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: "var(--secondary)" }}
            >
              <Link2 className="h-4 w-4" style={{ color: "var(--brand-soft)" }} />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                Feed URL
              </h3>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Sinkronizim automatik
              </p>
            </div>
          </header>
          <FeedUrlCard feed={urlFeed} />
        </section>

        <section
          className="rounded-xl p-5"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <header className="mb-4 flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: "var(--secondary)" }}
            >
              <KeyRound className="h-4 w-4" style={{ color: "var(--brand-soft)" }} />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                API Key
              </h3>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Përditësime në kohë reale
              </p>
            </div>
          </header>
          <FeedApiKeyCard feed={apiFeed} />
        </section>
      </div>
    </div>
  );
}
