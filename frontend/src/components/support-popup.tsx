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

/**
 * Public PayPal.Me link. Prefer NEXT_PUBLIC_PAYPAL_ME_URL in .env.local;
 * the default is the live tip link (not a secret).
 */
const PAYPAL_BASE =
  process.env.NEXT_PUBLIC_PAYPAL_ME_URL?.trim() ||
  "https://paypal.me/MbeshtetKrs";

const AMOUNTS = [5, 10, 15, 20] as const;

type Step = "message" | "methods";
type Amount = (typeof AMOUNTS)[number] | "other";

function paypalHref(amount: Amount): string {
  const base = PAYPAL_BASE.replace(/\/$/, "");
  if (amount === "other") return base;
  return `${base}/${amount}EUR`;
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

  useEffect(() => {
    function onToggle() {
      setOpen((prev) => {
        const next = !prev;
        if (next) {
          setStep("message");
          setAmount(5);
        }
        return next;
      });
    }
    window.addEventListener(SUPPORT_POPUP_EVENT, onToggle);
    return () => window.removeEventListener(SUPPORT_POPUP_EVENT, onToggle);
  }, []);

  useEffect(() => {
    if (!shouldAutoShow()) return;
    const timer = window.setTimeout(() => {
      setStep("message");
      setAmount(5);
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
    setStep("message");
    setAmount(5);
    if (persist) rememberDismiss();
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
                        onClick={() => setAmount(value)}
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
                <button
                  type="button"
                  onClick={() => setAmount("other")}
                  aria-pressed={amount === "other"}
                  className="mt-2 flex min-h-10 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor:
                      amount === "other" ? "var(--brand)" : "var(--background)",
                    color: amount === "other" ? "#ffffff" : "var(--foreground)",
                    border:
                      amount === "other"
                        ? "1px solid var(--brand)"
                        : "1px solid var(--border)",
                  }}
                >
                  Shumë tjetër
                </button>
              </fieldset>

              <fieldset className="mb-6">
                <legend
                  className="mb-2.5 font-mono text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Metoda e pagesës
                </legend>
                <div
                  className="flex items-center justify-between gap-3 rounded-lg px-3.5 py-3"
                  style={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--brand)",
                  }}
                  role="radio"
                  aria-checked="true"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                      style={{ border: "2px solid var(--brand)" }}
                      aria-hidden
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: "var(--brand)" }}
                      />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">PayPal</p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Pagesë e sigurt përmes PayPal
                      </p>
                    </div>
                  </div>
                  <span
                    className="font-mono text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Aktiv
                  </span>
                </div>
              </fieldset>

              <a
                href={paypalHref(amount)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => close(true)}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg px-4 text-sm font-bold transition-opacity hover:opacity-95"
                style={{
                  backgroundColor: "var(--action)",
                  color: "var(--action-foreground)",
                }}
              >
                {amount === "other"
                  ? "Vazhdo te PayPal"
                  : `Vazhdo me €${amount}`}
              </a>

              <p
                className="mt-3 text-center text-[11px] leading-relaxed"
                style={{ color: "var(--muted-foreground)" }}
              >
                Do të hapet faqja e PayPal. Kartë ose llogari PayPal.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
