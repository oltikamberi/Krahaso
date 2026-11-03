import type { ReactNode } from "react";
import { LEGAL_UPDATED, SITE_NAME } from "@/lib/site";

export function InfoPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <p
        className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em]"
        style={{ color: "var(--muted-foreground)" }}
      >
        {SITE_NAME}
      </p>
      <h1
        className="text-3xl font-extrabold tracking-tight sm:text-4xl"
        style={{ color: "var(--heading)" }}
      >
        {title}
      </h1>
      {intro ? (
        <p
          className="mt-4 text-[15px] leading-relaxed sm:text-base"
          style={{ color: "var(--muted-foreground)" }}
        >
          {intro}
        </p>
      ) : null}
      <p
        className="mt-3 font-mono text-[11px]"
        style={{ color: "var(--muted-foreground)" }}
      >
        Përditësuar më {LEGAL_UPDATED}
      </p>
      <div
        className="prose-legal mt-8 space-y-6 text-[15px] leading-relaxed"
        style={{ color: "var(--foreground)" }}
      >
        {children}
      </div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2
        className="mb-2 text-lg font-bold tracking-tight"
        style={{ color: "var(--heading)" }}
      >
        {title}
      </h2>
      <div className="space-y-3" style={{ color: "var(--foreground)" }}>
        {children}
      </div>
    </section>
  );
}
