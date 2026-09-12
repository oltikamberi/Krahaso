"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, Check, Copy, KeyRound, Loader2 } from "lucide-react";
import type { ApiKeyCredentials, Feed } from "@/lib/seller-types";

export function FeedApiKeyCard({ feed }: { feed: Feed | undefined }) {
  const router = useRouter();
  const [credentials, setCredentials] = useState<ApiKeyCredentials | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmingRegenerate, setConfirmingRegenerate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasKey = Boolean(feed?.apiKeyPrefix);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/seller/feeds/api-key", { method: "POST" });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(payload.message ?? "Gjenerimi dështoi. Provo përsëri.");
      }
      setCredentials((await res.json()) as ApiKeyCredentials);
      setConfirmingRegenerate(false);
      router.refresh();
    } catch (failure) {
      setError((failure as Error).message);
    }
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      {credentials ? (
        <ShowOncePanel credentials={credentials} onDismiss={() => setCredentials(null)} />
      ) : (
        <>
          {hasKey ? (
            <div
              className="rounded-lg px-3 py-2.5"
              style={{ backgroundColor: "var(--secondary)" }}
            >
              <p
                className="font-mono text-[10px] uppercase tracking-wider"
                style={{ color: "var(--muted-foreground)" }}
              >
                API key aktiv
              </p>
              <p className="mt-0.5 font-mono text-sm" style={{ color: "var(--foreground)" }}>
                {feed?.apiKeyPrefix}
                <span style={{ color: "var(--muted-foreground)" }}>••••••••••••</span>
              </p>
            </div>
          ) : (
            <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              Gjenero një API key dhe dërgo çmime e stok direkt nga sistemi i tij. Çdo
              kërkesë nënshkruhet, kështu që edhe nëse key-i zbulohet, nuk mjafton.
            </p>
          )}

          {error && (
            <p
              className="rounded-lg px-3 py-2 text-sm"
              style={{ backgroundColor: "rgba(255,107,74,0.12)", color: "var(--action)" }}
              role="alert"
            >
              {error}
            </p>
          )}

          {hasKey && confirmingRegenerate ? (
            <div className="space-y-2">
              <p
                className="rounded-lg px-3 py-2 text-xs"
                style={{ backgroundColor: "rgba(255,107,74,0.12)", color: "var(--action)" }}
              >
                Key-i aktual do të ndalojë të punojë menjëherë.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void generate()}
                  className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50"
                  style={{ backgroundColor: "var(--action)", color: "var(--action-foreground)" }}
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Konfirmo rigjenerimin
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingRegenerate(false)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold"
                  style={{ backgroundColor: "var(--secondary)", color: "var(--foreground)" }}
                >
                  Anulo
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => (hasKey ? setConfirmingRegenerate(true) : void generate())}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50"
              style={{
                backgroundColor: hasKey ? "var(--secondary)" : "var(--action)",
                color: hasKey ? "var(--foreground)" : "var(--action-foreground)",
              }}
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <KeyRound className="h-3.5 w-3.5" />
              )}
              {hasKey ? "Rigjenero key-in" : "Gjenero API key"}
            </button>
          )}
        </>
      )}

      {hasKey && !credentials && <SigningHelp />}
    </div>
  );
}

/** Credentials are returned once and never again, so say so plainly. */
function ShowOncePanel({
  credentials,
  onDismiss,
}: {
  credentials: ApiKeyCredentials;
  onDismiss: () => void;
}) {
  return (
    <div
      className="rounded-lg p-3"
      style={{ backgroundColor: "rgba(255,107,74,0.08)", border: "1px solid var(--action)" }}
    >
      <p
        className="flex items-start gap-1.5 text-xs font-bold"
        style={{ color: "var(--action)" }}
      >
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Kopjoji tani — nuk do të shfaqen përsëri.
      </p>

      <div className="mt-3 space-y-2">
        <Secret label="API key" value={credentials.apiKey} />
        <Secret label="Signing secret" value={credentials.signingSecret} />
        <Secret label="Webhook URL" value={credentials.webhookUrl} />
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="mt-3 rounded-lg px-3 py-1.5 text-xs font-semibold"
        style={{ backgroundColor: "var(--secondary)", color: "var(--foreground)" }}
      >
        I kopjova
      </button>
    </div>
  );
}

function Secret({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <p
        className="font-mono text-[10px] uppercase tracking-wider"
        style={{ color: "var(--muted-foreground)" }}
      >
        {label}
      </p>
      <div className="mt-0.5 flex items-center gap-2">
        <code
          className="min-w-0 flex-1 truncate rounded px-2 py-1.5 font-mono text-xs"
          style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
          title={value}
        >
          {value}
        </code>
        <button
          type="button"
          onClick={() => void copy()}
          aria-label={`Kopjo ${label}`}
          className="shrink-0 rounded p-1.5"
          style={{ backgroundColor: "var(--secondary)" }}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" style={{ color: "var(--savings)" }} />
          ) : (
            <Copy className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
          )}
        </button>
      </div>
    </div>
  );
}

function SigningHelp() {
  return (
    <details className="text-xs">
      <summary className="cursor-pointer font-semibold" style={{ color: "var(--foreground)" }}>
        Si të nënshkruhet një kërkesë
      </summary>
      <div className="mt-2 space-y-2" style={{ color: "var(--muted-foreground)" }}>
        <p>Për çdo kërkesë dërgo tre header-a:</p>
        <pre
          className="overflow-x-auto rounded px-2 py-2 font-mono text-[10px] leading-relaxed"
          style={{ backgroundColor: "var(--secondary)", color: "var(--foreground)" }}
        >
          {`X-Krahaso-Key: <api key>
X-Krahaso-Timestamp: <unix seconds>
X-Krahaso-Signature: sha256=<hmac>

hmac = HMAC_SHA256(
  signing_secret,
  timestamp + "." + body
)`}
        </pre>
        <p>
          Trupi duhet të nënshkruhet ashtu si dërgohet, byte për byte. Çdo kërkesë
          duhet të ketë një <code>eventId</code> unik dhe një <code>sentAt</code>:
          përsëritjet me të njëjtin <code>eventId</code> injorohen, dhe një përditësim
          më i vjetër nuk mbishkruan një më të re.
        </p>
      </div>
    </details>
  );
}
