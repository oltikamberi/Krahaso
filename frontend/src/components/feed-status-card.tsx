import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import type { Feed } from "@/lib/seller-types";

function formatMoment(value: string | null, fallback: string) {
  if (!value) return fallback;
  return new Date(value).toLocaleString("sq-AL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_LABELS: Record<Feed["status"], string> = {
  draft: "Draft",
  pending_review: "Në pritje të konfirmimit",
  live: "Aktiv",
  disabled: "Joaktiv",
};

export function FeedStatusCard({ feed }: { feed: Feed }) {
  const failed = feed.lastRowsFailed > 0;

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
            {feed.label ?? "Integrim"}
          </p>
          <p
            className="mt-0.5 font-mono text-[10px] uppercase tracking-wider"
            style={{ color: "var(--muted-foreground)" }}
          >
            {STATUS_LABELS[feed.status]} · {feed.offerCount} oferta
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {feed.stale && (
            <span
              className="inline-flex items-center gap-1 rounded px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: "rgba(255,107,74,0.12)", color: "var(--action)" }}
              title={`Nuk është sinkronizuar brenda ${feed.staleAfterHours} orëve`}
            >
              <AlertTriangle className="h-3 w-3" />
              I vjetëruar
            </span>
          )}
          {feed.lastStatus === "ok" && (
            <span
              className="inline-flex items-center gap-1 rounded px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: "rgba(0,168,107,0.12)", color: "var(--savings)" }}
            >
              <CheckCircle2 className="h-3 w-3" />
              OK
            </span>
          )}
          {feed.lastStatus === "partial" && (
            <span
              className="inline-flex items-center gap-1 rounded px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: "rgba(245,158,11,0.14)", color: "#b45309" }}
            >
              <AlertTriangle className="h-3 w-3" />
              Me gabime
            </span>
          )}
          {feed.lastStatus === "failed" && (
            <span
              className="inline-flex items-center gap-1 rounded px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: "rgba(255,107,74,0.12)", color: "var(--action)" }}
            >
              <XCircle className="h-3 w-3" />
              Dështoi
            </span>
          )}
        </div>
      </div>

      {feed.type === "url" && feed.feedUrl && (
        <p
          className="mt-3 truncate font-mono text-xs"
          style={{ color: "var(--muted-foreground)" }}
          title={feed.feedUrl}
        >
          {feed.feedUrl}
        </p>
      )}

      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <dt
            className="font-mono text-[10px] uppercase tracking-wider"
            style={{ color: "var(--muted-foreground)" }}
          >
            Sinkronizimi i fundit
          </dt>
          <dd
            className="mt-0.5 flex items-center gap-1.5 text-sm"
            style={{ color: "var(--foreground)" }}
          >
            <Clock className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
            {formatMoment(feed.lastSyncedAt, "Nuk është sinkronizuar")}
          </dd>
        </div>
        <div>
          <dt
            className="font-mono text-[10px] uppercase tracking-wider"
            style={{ color: "var(--muted-foreground)" }}
          >
            Rreshta të pranuar
          </dt>
          <dd className="mt-0.5 font-mono text-sm font-bold" style={{ color: "var(--foreground)" }}>
            {feed.lastRowsProcessed}
          </dd>
        </div>
        <div>
          <dt
            className="font-mono text-[10px] uppercase tracking-wider"
            style={{ color: "var(--muted-foreground)" }}
          >
            Rreshta me gabim
          </dt>
          <dd
            className="mt-0.5 font-mono text-sm font-bold"
            style={{ color: failed ? "var(--action)" : "var(--foreground)" }}
          >
            {feed.lastRowsFailed}
          </dd>
        </div>
      </dl>

      {feed.type === "url" && (
        <p className="mt-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
          Kontrolli tjetër: {formatMoment(feed.nextPollAt, "sa më shpejt")}
          {feed.consecutiveFailures > 0 && (
            <span style={{ color: "var(--action)" }}>
              {" "}
              · {feed.consecutiveFailures} dështime radhazi
            </span>
          )}
        </p>
      )}

      {feed.lastErrorSummary && (
        <p
          className="mt-3 rounded-lg px-3 py-2 text-xs"
          style={{ backgroundColor: "var(--secondary)", color: "var(--muted-foreground)" }}
        >
          {feed.lastErrorSummary}
        </p>
      )}

      {feed.pendingSyncId && (
        <Link
          href={`/panel/integrimet/parapamje/${feed.id}/${feed.pendingSyncId}`}
          className="mt-4 inline-flex items-center rounded-lg px-4 py-2 text-sm font-bold"
          style={{ backgroundColor: "var(--action)", color: "var(--action-foreground)" }}
        >
          Shiko parapamjen
        </Link>
      )}
    </div>
  );
}
