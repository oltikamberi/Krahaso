"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import type { FeedRow, FeedRowPage, FeedSync } from "@/lib/seller-types";

const PAGE_SIZE = 50;
const POLL_INTERVAL_MS = 1500;

export function FeedPreview({
  feedId,
  initialSync,
  initialRows,
}: {
  feedId: number;
  initialSync: FeedSync;
  initialRows: FeedRowPage | null;
}) {
  const router = useRouter();
  const [sync, setSync] = useState(initialSync);
  const [rows, setRows] = useState(initialRows);
  const [page, setPage] = useState(initialRows?.page ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRows = useCallback(
    async (nextPage: number) => {
      const res = await fetch(
        `/api/seller/feeds/${feedId}/syncs/${sync.id}/rows?page=${nextPage}&size=${PAGE_SIZE}`,
      );
      if (res.ok) {
        setRows((await res.json()) as FeedRowPage);
        setPage(nextPage);
      }
    },
    [feedId, sync.id],
  );

  // Parsing happens in the background; poll until it settles
  useEffect(() => {
    if (sync.state !== "parsing") return;

    const timer = setInterval(async () => {
      const res = await fetch(`/api/seller/feeds/${feedId}/syncs/${sync.id}`);
      if (!res.ok) return;

      const next = (await res.json()) as FeedSync;
      if (next.state !== "parsing") {
        setSync(next);
        void loadRows(0);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [feedId, sync.id, sync.state, loadRows]);

  async function act(path: string, method: "POST" | "DELETE") {
    setBusy(true);
    setError(null);

    const res = await fetch(path, { method });
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { message?: string };
      setError(payload.message ?? "Veprimi dështoi. Provo përsëri.");
      setBusy(false);
      return;
    }

    router.push("/panel/integrimet");
    router.refresh();
  }

  if (sync.state === "parsing") {
    return (
      <div
        className="rounded-xl px-6 py-12 text-center"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <Loader2
          className="mx-auto mb-3 h-6 w-6 animate-spin"
          style={{ color: "var(--brand-soft)" }}
        />
        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          Skedari po përpunohet...
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
          Kjo faqe përditësohet vetë sapo përfundon.
        </p>
      </div>
    );
  }

  const accepted = sync.rowsProcessed;
  const failed = sync.rowsFailed;
  const canPublish = sync.state === "parsed" && accepted > 0;

  return (
    <div className="space-y-5">
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
              Parapamja e feed-it
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
              {sync.state === "failed"
                ? "Asnjë rresht nuk mund të përdorej. Shiko gabimet më poshtë."
                : "Kontrollo rreshtat përpara publikimit. Ofertat aktuale zëvendësohen plotësisht."}
            </p>
          </div>

          <div className="flex gap-4">
            <Stat label="Të pranuar" value={accepted} tone="ok" />
            <Stat label="Me gabim" value={failed} tone={failed > 0 ? "error" : "muted"} />
          </div>
        </div>

        {sync.errorSummary && (
          <p
            className="mt-4 flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
            style={{ backgroundColor: "var(--secondary)", color: "var(--muted-foreground)" }}
          >
            <AlertTriangle
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              style={{ color: "var(--action)" }}
            />
            {sync.errorSummary}
          </p>
        )}

        {error && (
          <p
            className="mt-4 rounded-lg px-3 py-2 text-sm"
            style={{ backgroundColor: "rgba(255,107,74,0.12)", color: "var(--action)" }}
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!canPublish || busy}
            onClick={() => act(`/api/seller/feeds/${feedId}/syncs/${sync.id}/confirm`, "POST")}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: "var(--action)", color: "var(--action-foreground)" }}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Konfirmo dhe publiko {accepted} produkte
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => act(`/api/seller/feeds/${feedId}/syncs/${sync.id}`, "DELETE")}
            className="rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
            style={{ backgroundColor: "var(--secondary)", color: "var(--foreground)" }}
          >
            Anulo ngarkesën
          </button>
        </div>
      </div>

      <div
        className="overflow-hidden rounded-xl"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["#", "Produkti", "Marka", "Kategoria", "Çmimi", "Stok", "Statusi"].map((head) => (
                  <th
                    key={head}
                    className="px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows?.items.map((row) => <PreviewRow key={row.rowNumber} row={row} />)}
            </tbody>
          </table>
        </div>

        {rows && rows.totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Faqja {page + 1} nga {rows.totalPages} · {rows.totalItems} rreshta
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => void loadRows(page - 1)}
                className="rounded px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                style={{ backgroundColor: "var(--secondary)", color: "var(--foreground)" }}
              >
                Para
              </button>
              <button
                type="button"
                disabled={page + 1 >= rows.totalPages}
                onClick={() => void loadRows(page + 1)}
                className="rounded px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                style={{ backgroundColor: "var(--secondary)", color: "var(--foreground)" }}
              >
                Pas
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewRow({ row }: { row: FeedRow }) {
  const broken = row.error !== null;

  return (
    <tr style={{ borderBottom: "1px solid var(--border)" }}>
      <td
        className="px-3 py-2.5 font-mono text-xs"
        style={{ color: "var(--muted-foreground)" }}
      >
        {row.rowNumber}
      </td>
      <td className="px-3 py-2.5" style={{ color: "var(--foreground)" }}>
        <span className="font-medium">{row.name ?? "—"}</span>
        {row.sku && (
          <span className="ml-2 font-mono text-[10px]" style={{ color: "var(--muted-foreground)" }}>
            {row.sku}
          </span>
        )}
      </td>
      <td className="px-3 py-2.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
        {row.brand ?? "—"}
      </td>
      <td className="px-3 py-2.5 text-xs">
        {row.categorySlug ? (
          <span style={{ color: "var(--foreground)" }}>{row.categorySlug}</span>
        ) : (
          <span
            title={`Kategoria "${row.rawCategory ?? "—"}" nuk përputhet me kategoritë tona`}
            style={{ color: "var(--muted-foreground)" }}
          >
            {row.rawCategory ? `${row.rawCategory} (e papërputhur)` : "—"}
          </span>
        )}
      </td>
      <td className="px-3 py-2.5 font-mono text-xs font-bold" style={{ color: "var(--foreground)" }}>
        {row.price === null ? "—" : `${row.price.toFixed(2)} ${row.currency ?? ""}`}
      </td>
      <td className="px-3 py-2.5 text-xs">
        {row.inStock === null ? (
          <span style={{ color: "var(--muted-foreground)" }}>—</span>
        ) : row.inStock ? (
          <span style={{ color: "var(--savings)" }}>Në stok</span>
        ) : (
          <span style={{ color: "var(--muted-foreground)" }}>Jo në stok</span>
        )}
      </td>
      <td className="px-3 py-2.5 text-xs">
        {broken ? (
          <span className="flex items-center gap-1.5" style={{ color: "var(--action)" }}>
            <XCircle className="h-3.5 w-3.5 shrink-0" />
            {row.error}
          </span>
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "var(--savings)" }} />
        )}
      </td>
    </tr>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "error" | "muted";
}) {
  const color =
    tone === "error"
      ? "var(--action)"
      : tone === "ok"
        ? "var(--savings)"
        : "var(--muted-foreground)";

  return (
    <div>
      <p
        className="font-mono text-[10px] uppercase tracking-wider"
        style={{ color: "var(--muted-foreground)" }}
      >
        {label}
      </p>
      <p className="mt-0.5 font-mono text-xl font-extrabold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}
