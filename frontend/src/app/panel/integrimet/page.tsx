import type { Metadata } from "next";
import { KeyRound, Link2, Upload } from "lucide-react";
import { FeedStatusCard } from "@/components/feed-status-card";
import { FeedUploadCard } from "@/components/feed-upload-card";
import { getFeeds } from "@/lib/seller-feeds";

export const metadata: Metadata = {
  title: "Integrimet — Paneli i shitësit",
};

function DisabledIntegrationCard({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Link2;
  title: string;
  subtitle: string;
}) {
  return (
    <section
      className="relative rounded-xl p-5 opacity-60"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      aria-disabled="true"
    >
      <header className="mb-4 flex items-center gap-2.5">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: "var(--secondary)" }}
        >
          <Icon className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
        </div>
        <div>
          <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
            {title}
          </h3>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {subtitle}
          </p>
        </div>
      </header>
      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
        Jo e disponueshme për momentin.
      </p>
      <span
        className="absolute right-3 top-3 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider"
        style={{
          backgroundColor: "var(--secondary)",
          color: "var(--muted-foreground)",
          border: "1px solid var(--border)",
        }}
      >
        Së shpejti
      </span>
    </section>
  );
}

export default async function PanelIntegrationsPage() {
  const feeds = await getFeeds();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
          Integrimet
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
          Ngarko produktet me skedar. Feed URL dhe API do të aktivizohen së shpejti.
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

        <DisabledIntegrationCard
          icon={Link2}
          title="Feed URL"
          subtitle="Sinkronizim automatik"
        />

        <DisabledIntegrationCard
          icon={KeyRound}
          title="API Key"
          subtitle="Përditësime në kohë reale"
        />
      </div>
    </div>
  );
}
