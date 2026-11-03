"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, HeartHandshake, X } from "lucide-react";

const STORAGE_KEY = "krahaso_support_popup_at";
/** How long to wait after landing before the first auto-show. */
const AUTO_SHOW_DELAY_MS = 45_000;
/** Do not auto-show again for this many days after dismiss. */
const COOLDOWN_DAYS = 5;
/** Temporary preview hook — remove with the nav button later. */
export const SUPPORT_POPUP_EVENT = "krahaso:toggle-support-popup";

const AMOUNTS = [5, 10, 15, 20] as const;
const MIN_CUSTOM_EUR = 1;
const MAX_CUSTOM_EUR = 1500;

/**
 * Whop one-time checkout links for fixed tip amounts (public purchase_url values).
 * Set in frontend/.env.local — not secrets.
 */
const WHOP_CHECKOUT: Record<(typeof AMOUNTS)[number], string> = {
  5: process.env.NEXT_PUBLIC_WHOP_CHECKOUT_5?.trim() || "",
  10: process.env.NEXT_PUBLIC_WHOP_CHECKOUT_10?.trim() || "",
  15: process.env.NEXT_PUBLIC_WHOP_CHECKOUT_15?.trim() || "",
  20: process.env.NEXT_PUBLIC_WHOP_CHECKOUT_20?.trim() || "",
};

type Step = "message" | "methods";
type Amount = (typeof AMOUNTS)[number] | "other";

function whopHref(amount: (typeof AMOUNTS)[number]): string | null {
  const url = WHOP_CHECKOUT[amount];
  return url || null;
}

function parseCustomAmount(raw: string): number | null {
  const n = Number(raw.replace(",", ".").trim());
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n * 100) / 100;
  if (rounded < MIN_CUSTOM_EUR || rounded > MAX_CUSTOM_EUR) return null;
  return rounded;
}

function shouldAutoShow(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  if (
    path.startsWith("/panel") ||
    path.startsWith("/hyrje") ||
    path.startsWith("/regjistrohu")
  ) {
    return false;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return true;
    const last = Number(raw);
    if (!Number.isFinite(last)) return true;
    return Date.now() - last > COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function rememberDismiss() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // private mode — ignore
  }
}

export function SupportPopup() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("message");
  const [amount, setAmount] = useState<Amount>(5);
  const [customRaw, setCustomRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setStep("message");
    setAmount(5);
    setCustomRaw("");
    setLoading(false);
    setError(null);
  }

  useEffect(() => {
    function onToggle() {
      setOpen((prev) => {
        const next = !prev;
        if (next) resetForm();
        return next;
      });
    }
    window.addEventListener(SUPPORT_POPUP_EVENT, onToggle);
    return () => window.removeEventListener(SUPPORT_POPUP_EVENT, onToggle);
  }, []);

  useEffect(() => {
    if (!shouldAutoShow()) return;
    const timer = window.setTimeout(() => {
      resetForm();
      setOpen(true);
    }, AUTO_SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (step === "methods") setStep("message");
        else close(true);
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, step]);

  function close(persist: boolean) {
    setOpen(false);
    resetForm();
    if (persist) rememberDismiss();
  }

  const customAmount = amount === "other" ? parseCustomAmount(customRaw) : null;
  const presetUrl = amount === "other" ? null : whopHref(amount);
  const presetMissing = amount !== "other" && !presetUrl;

  const displayAmount =
    amount === "other" ? customAmount : amount;

  const canContinue =
    !loading &&
    !presetMissing &&
    (amount !== "other" ? Boolean(presetUrl) : customAmount !== null);

  const continueLabel =
    displayAmount != null ? `Vazhdo me €${displayAmount}` : "Vazhdo";

  async function startCustomCheckout() {
    if (customAmount === null) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/support/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountEur: customAmount }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        message?: string;
      };
      if (!res.ok || !data.url) {
        setError(data.message || "Nuk u hap pagesa. Provo përsëri.");
        setLoading(false);
        return;
      }
      close(true);
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      setError("Nuk u hap pagesa. Provo përsëri.");
      setLoading(false);
    }
  }

  function onContinuePreset() {
    if (!presetUrl) return;
    close(true);
    window.open(presetUrl, "_blank", "noopener,noreferrer");
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-popup-title"
    >
      <button
        type="button"
        aria-label="Mbyll"
        className="absolute inset-0 bg-black/40"
        onClick={() => close(true)}
      />

      <div
        className="relative w-full max-w-md overflow-hidden rounded-xl shadow-lg"
        style={{
          backgroundColor: "var(--popover)",
          border: "1px solid var(--border)",
          color: "var(--foreground)",
        }}
      >
        <button
          type="button"
          onClick={() => close(true)}
          aria-label="Mbyll"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded transition-opacity hover:opacity-70"
          style={{ color: "var(--muted-foreground)" }}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 pb-6 pt-7">
          {step === "message" ? (
            <>
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded"
                style={{ backgroundColor: "var(--secondary)" }}
              >
                <HeartHandshake className="h-5 w-5" style={{ color: "var(--brand-soft)" }} />
              </div>

              <p
                id="support-popup-title"
                className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "var(--muted-foreground)" }}
              >
                Mbështet Krahaso
              </p>

              <h2 className="mb-3 text-xl font-extrabold tracking-tight leading-snug">
                Ndihmo të vazhdojmë të kursejmë
              </h2>

              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--muted-foreground)" }}
              >
                Nëse keni kursyer një shumë të parave në produktet që keni blerë,
                atëherë ju lutem na mbështesni punën tonë me një shumë të vogël prej
                kursimit që keni bërë, në mënyrë që të vazhdojmë t&apos;ju kursejmë
                para.
              </p>

              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setStep("methods")}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg px-4 text-sm font-bold transition-opacity hover:opacity-95"
                  style={{
                    backgroundColor: "var(--action)",
                    color: "var(--action-foreground)",
                  }}
                >
                  Mbështet me një shumë të vogël
                </button>
                <button
                  type="button"
                  onClick={() => close(true)}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: "var(--secondary)",
                    color: "var(--foreground)",
                  }}
                >
                  Jo tani
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep("message")}
                className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: "var(--muted-foreground)" }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Kthehu
              </button>

              <h2
                id="support-popup-title"
                className="mb-5 text-lg font-extrabold tracking-tight"
              >
                Mbështetja
              </h2>

              <fieldset className="mb-5">
                <legend
                  className="mb-2.5 font-mono text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Shuma
                </legend>
                <div className="grid grid-cols-4 gap-2">
                  {AMOUNTS.map((value) => {
                    const selected = amount === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setAmount(value);
                          setCustomRaw("");
                          setError(null);
                        }}
                        aria-pressed={selected}
                        className="flex min-h-11 items-center justify-center rounded-lg font-mono text-sm font-bold tabular-nums transition-colors"
                        style={{
                          backgroundColor: selected
                            ? "var(--brand)"
                            : "var(--background)",
                          color: selected ? "#ffffff" : "var(--foreground)",
                          border: selected
                            ? "1px solid var(--brand)"
                            : "1px solid var(--border)",
                        }}
                      >
                        €{value}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2.5">
                  <label className="sr-only" htmlFor="support-custom-amount">
                    Shuma në euro
                  </label>
                  <div
                    className="flex min-h-11 items-center gap-2 rounded-lg px-3"
                    style={{
                      backgroundColor: "var(--background)",
                      border:
                        amount === "other"
                          ? "1px solid var(--brand)"
                          : "1px solid var(--border)",
                    }}
                  >
                    <span
                      className="font-mono text-sm font-bold"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      €
                    </span>
                    <input
                      id="support-custom-amount"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      placeholder="Shkruaj shumën"
                      value={customRaw}
                      onChange={(e) => {
                        setCustomRaw(e.target.value);
                        setAmount("other");
                        setError(null);
                      }}
                      onFocus={() => {
                        setAmount("other");
                        setError(null);
                      }}
                      className="w-full bg-transparent font-mono text-sm font-bold outline-none"
                      style={{ color: "var(--foreground)" }}
                    />
                  </div>
                </div>
              </fieldset>

              <div className="mb-6">
                <p
                  className="mb-2.5 font-mono text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Metodat e pagesës që mbështeten
                </p>
                <div
                  className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                  aria-label="Metodat e pagesës"
                >
                  {/* Card */}
                  <span
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-3"
                    style={{
                      backgroundColor: "#f3f4f6",
                      border: "1px solid #e5e7eb",
                      color: "var(--foreground)",
                    }}
                    aria-label="Card"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-[15px] w-[15px] shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      aria-hidden
                    >
                      <rect x="2.5" y="5.5" width="19" height="13" rx="2.25" />
                      <path d="M2.5 10h19" />
                      <path d="M6.5 15h3.5" />
                    </svg>
                    <span className="text-[12px] font-semibold tracking-tight">
                      Card
                    </span>
                  </span>

                  {/* Apple Pay */}
                  <span
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-white"
                    style={{
                      backgroundColor: "#0a0a0a",
                      border: "1px solid #0a0a0a",
                    }}
                    aria-label="Apple Pay"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 shrink-0"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    <span className="text-[12px] font-semibold tracking-tight">
                      Pay
                    </span>
                  </span>

                  {/* Google Pay */}
                  <span
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-3"
                    style={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                    aria-label="Google Pay"
                  >
                    <svg
                      viewBox="0 0 18 18"
                      className="h-3.5 w-3.5 shrink-0"
                      aria-hidden
                    >
                      <path
                        fill="#4285F4"
                        d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8c-.2 1.1-.8 2-1.8 2.6v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.4z"
                      />
                      <path
                        fill="#34A853"
                        d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.9.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3C2.4 15.9 5.5 18 9 18z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M3.9 10.7c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7V5H.9C.3 6.2 0 7.5 0 9s.3 2.8.9 4l3-2.3z"
                      />
                      <path
                        fill="#EA4335"
                        d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6C13.5.9 11.4 0 9 0 5.5 0 2.4 2.1.9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z"
                      />
                    </svg>
                    <span className="text-[12px] font-semibold tracking-tight">
                      Pay
                    </span>
                  </span>

                  {/* Crypto / Bitcoin */}
                  <span
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-3"
                    style={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                    aria-label="Crypto"
                  >
                    <span
                      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] text-[11px] font-bold leading-none text-white"
                      style={{ backgroundColor: "#F7931A" }}
                      aria-hidden
                    >
                      ₿
                    </span>
                    <span className="text-[12px] font-semibold tracking-tight">
                      Crypto
                    </span>
                  </span>
                </div>
              </div>

              {presetMissing ? (
                <p
                  className="mb-3 text-center text-[11px] leading-relaxed"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Whop nuk është konfiguruar ende për këtë shumë. Vendosni linkun
                  në .env.local.
                </p>
              ) : null}

              {error ? (
                <p
                  className="mb-3 text-center text-[11px] leading-relaxed"
                  style={{ color: "var(--destructive, #b91c1c)" }}
                >
                  {error}
                </p>
              ) : null}

              <button
                type="button"
                disabled={!canContinue}
                onClick={() => {
                  if (amount === "other") void startCustomCheckout();
                  else onContinuePreset();
                }}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg px-4 text-sm font-bold transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor: "var(--action)",
                  color: "var(--action-foreground)",
                }}
              >
                {loading ? "Duke hapur pagesën…" : continueLabel}
              </button>

              <p
                className="mt-3 text-center text-[11px] leading-relaxed"
                style={{ color: "var(--muted-foreground)" }}
              >
                Do të hapet faqja e pagesës. Kartë, Apple Pay ose Google Pay.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
