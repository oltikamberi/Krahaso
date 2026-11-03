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
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:py-6">
        <h2 className="text-center sm:text-left">
          <span
            className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] sm:text-[11px]"
            style={{
              backgroundColor: "var(--savings-bg)",
              color: "var(--savings)",
              border: "1px solid rgba(4,120,87,0.28)",
            }}
          >
            <Trophy className="h-3 w-3" strokeWidth={2.5} />
            Nr. 1 në Kosovë
          </span>
          <span
            className="mt-2 block text-[1.35rem] font-extrabold leading-[1.15] tracking-tight sm:text-2xl md:text-[1.7rem]"
            style={{ color: "var(--heading)" }}
          >
            Platforma{" "}
            <span style={{ color: "var(--warm)" }}>numër 1</span>
            {" "}për krahasimin e çmimeve në Kosovë
          </span>
        </h2>

        <ol className="grid grid-cols-4 gap-1 sm:flex sm:shrink-0 sm:gap-2">
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
