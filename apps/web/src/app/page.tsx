import Link from "next/link";

export default function Home() {
  return (
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,215,115,0.25),_transparent_55%)]">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,_rgba(250,250,245,1)_0%,_rgba(248,246,235,1)_45%,_rgba(238,235,220,1)_100%)]" />
      <div className="absolute -left-24 top-24 -z-10 h-64 w-64 rounded-full bg-[radial-gradient(circle,_rgba(255,196,94,0.35),_transparent_70%)] blur-2xl" />
      <div className="absolute -right-20 bottom-0 -z-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(82,140,129,0.25),_transparent_70%)] blur-3xl" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-16 lg:flex-row lg:items-center lg:justify-between lg:py-24">
        <div className="max-w-xl space-y-6">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Gold Profit Application
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            Track gold trades, see real profit, and trust the numbers.
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Log buy and sell prices in USD, enter your local FX rates, and get immediate
            profit/loss in your preferred currency. Simple, fast, and built for serious
            clarity.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:scale-[1.02]"
            >
              Open Dashboard
            </Link>
            <div className="rounded-full border border-border/70 bg-background/70 px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              FX-aware
            </div>
            <div className="rounded-full border border-border/70 bg-background/70 px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Unit conversion
            </div>
          </div>
        </div>

        <div className="w-full max-w-md rounded-3xl border border-border/60 bg-background/80 p-6 shadow-[0_30px_80px_-60px_rgba(26,27,31,0.6)]">
          <div className="space-y-5">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Snapshot</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                Live Preview
              </span>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-semibold tracking-tight">$2,840.50</div>
              <p className="text-sm text-muted-foreground">Total profit (local)</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Trades", value: "18" },
                { label: "Avg. ROI", value: "6.2%" },
                { label: "Best Trade", value: "$620" },
                { label: "Last FX", value: "3.75" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border/60 bg-muted/40 px-4 py-3"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="text-lg font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-border/60 bg-gradient-to-r from-amber-100/70 via-amber-50/70 to-transparent p-4 text-sm">
              Cumulative profit chart, FX-aware pricing, and unit conversion in one view.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
