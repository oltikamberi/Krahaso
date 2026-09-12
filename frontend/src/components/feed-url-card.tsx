"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { DEFAULT_POLL_INTERVAL, POLL_INTERVALS, type Feed } from "@/lib/seller-types";

export function FeedUrlCard({ feed }: { feed: Feed | undefined }) {
  const router = useRouter();
  const [feedUrl, setFeedUrl] = useState(feed?.feedUrl ?? "");
  const [scheduleMinutes, setScheduleMinutes] = useState(
    feed?.scheduleMinutes ?? DEFAULT_POLL_INTERVAL,
  );
  const [busy, setBusy] = useState<"save" | "poll" | "remove" | null>(null);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(path: string, method: "POST" | "DELETE", body?: unknown) {
    const res = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { message?: string };
      throw new Error(payload.message ?? "Veprimi dështoi. Provo përsëri.");
    }
    return res.status === 200 ? ((await res.json().catch(() => null)) as Feed | null) : null;
  }

  /** Saving also checks the URL straight away so the seller gets an immediate answer. */
  async function save() {
    setBusy("save");
    setError(null);
    try {
      const saved = await call("/api/seller/feeds/url", "POST", {
        feedUrl: feedUrl.trim(),
        scheduleMinutes,
      });
      if (saved) {
        await check(saved.id);
      }
    } catch (failure) {
      setError((failure as Error).message);
      setBusy(null);
    }
  }

  async function check(feedId: number) {
    setBusy("poll");
    setError(null);
    try {
      const polled = await call(`/api/seller/feeds/${feedId}/poll`, "POST");
      // The first successful poll waits for a preview; later ones publish themselves
      if (polled?.pendingSyncId) {
        router.push(`/panel/integrimet/parapamje/${feedId}/${polled.pendingSyncId}`);
        return;
      }
      router.refresh();
    } catch (failure) {
      setError((failure as Error).message);
    }
    setBusy(null);
  }

  async function remove(feedId: number) {
    setBusy("remove");
    setError(null);
    try {
      await call(`/api/seller/feeds/${feedId}`, "DELETE");
      setFeedUrl("");
      setConfirmingRemoval(false);
      router.refresh();
    } catch (failure) {
      setError((failure as Error).message);
    }
    setBusy(null);
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span
          className="font-mono text-[10px] uppercase tracking-wider"
          style={{ color: "var(--muted-foreground)" }}
        >
          Adresa e feed-it
        </span>
        <input
          type="url"
          value={feedUrl}
          onChange={(event) => setFeedUrl(event.target.value)}
          placeholder="https://dyqani-im.com/feed.xml"
          className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            backgroundColor: "var(--background)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          }}
        />
      </label>

      <label className="block">
        <span
          className="font-mono text-[10px] uppercase tracking-wider"
          style={{ color: "var(--muted-foreground)" }}
        >
          Sa shpesh të kontrollohet
        </span>
        <select
          value={scheduleMinutes}
          onChange={(event) => setScheduleMinutes(Number(event.target.value))}
          className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            backgroundColor: "var(--background)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          }}
        >
          {POLL_INTERVALS.map((interval) => (
            <option key={interval.minutes} value={interval.minutes}>
              {interval.label}
            </option>
          ))}
        </select>
      </label>

      {error && (
        <p
          className="rounded-lg px-3 py-2 text-sm"
          style={{ backgroundColor: "rgba(255,107,74,0.12)", color: "var(--action)" }}
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy !== null || feedUrl.trim().length === 0}
          onClick={() => void save()}
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: "var(--action)", color: "var(--action-foreground)" }}
        >
          {busy === "save" || busy === "poll" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : null}
          {feed?.feedUrl ? "Ruaj dhe kontrollo" : "Lidh feed-in"}
        </button>

        {feed && (
          <>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void check(feed.id)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: "var(--secondary)", color: "var(--foreground)" }}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${busy === "poll" ? "animate-spin" : ""}`} />
              Kontrollo tani
            </button>

            {confirmingRemoval ? (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void remove(feed.id)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-50"
                style={{ backgroundColor: "rgba(255,107,74,0.12)", color: "var(--action)" }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Konfirmo heqjen
              </button>
            ) : (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => setConfirmingRemoval(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: "var(--secondary)", color: "var(--muted-foreground)" }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hiq
              </button>
            )}
          </>
        )}
      </div>

      <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
        Kontrollimi i parë ndalon në parapamje, që të verifikosh kolonat. Pas kësaj,
        përditësimet publikohen vetë.
      </p>
    </div>
  );
}
