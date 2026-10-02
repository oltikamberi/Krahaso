export function StatsStrip() {
  return (
    <div className="border-b bg-card" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto max-w-7xl px-4 py-4 text-center sm:py-5">
        <p
          className="text-sm font-semibold leading-snug tracking-tight sm:text-base"
          style={{ color: "var(--foreground)" }}
        >
          Platforma numër 1 në Kosovë për krahasimin e çmimeve
        </p>
        <p
          className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] sm:text-xs"
          style={{ color: "var(--brand)" }}
        >
          Shiko · Krahaso · Kurse · Fito
        </p>
      </div>
    </div>
  );
}
