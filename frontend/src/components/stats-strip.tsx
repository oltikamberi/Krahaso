import { Eye, PiggyBank, Scale, Trophy, type LucideIcon } from "lucide-react";

/** The four-step promise, in the order the user reads the page. */
const STEPS: { icon: LucideIcon; label: string }[] = [
  { icon: Eye, label: "Shiko" },
  { icon: Scale, label: "Krahaso" },
  { icon: PiggyBank, label: "Kurse" },
  { icon: Trophy, label: "Përfito" },
];

export function StatsStrip() {
  return (
    <section
      aria-label="Si funksionon"
      className="border-b"
      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-5">
        <p
          className="text-[13px] font-semibold leading-snug tracking-tight sm:shrink-0 sm:text-base"
          style={{ color: "var(--foreground)" }}
        >
          Platforma numër 1 në Kosovë për krahasimin e çmimeve
        </p>

        <ol className="grid grid-cols-4 gap-1 sm:flex sm:gap-2">
          {STEPS.map(({ icon: Icon, label }, index) => (
            <li
              key={label}
              className="flex items-center gap-2 sm:gap-2.5"
            >
              <div className="flex flex-1 flex-col items-center gap-1.5 sm:flex-row sm:gap-2">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full sm:h-8 sm:w-8"
                  style={{
                    backgroundColor: "var(--savings-bg)",
                    border: "1px solid rgba(4,120,87,0.22)",
                    color: "var(--savings)",
                  }}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <span
                  className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] sm:text-xs"
                  style={{ color: "var(--heading)" }}
                >
                  {label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="hidden text-xs sm:inline"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  ·
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
