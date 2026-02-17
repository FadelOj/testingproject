import Link from "next/link";
import { TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="relative isolate overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(217,119,6,0.15),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.8),transparent)] dark:bg-none" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 py-20 lg:flex-row lg:items-center lg:justify-between lg:py-32">
        
        {/* Hero Text */}
        <div className="max-w-xl space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Live Market Tracking
          </div>
          
          <h1 className="font-display text-5xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-7xl">
            Profit clarity for <br />
            <span className="text-gradient-gold">gold traders.</span>
          </h1>
          
          <p className="max-w-md text-lg text-muted-foreground leading-relaxed">
            Stop guessing with spreadsheets. Log trades in USD, convert to local currency instantly, and track your true ROI with FX-aware insights.
          </p>
          
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground shadow-lg shadow-amber-500/20 transition-transform hover:scale-105 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              Go to Dashboard
            </Link>
            <Link
              href="#"
              className="inline-flex h-12 items-center justify-center rounded-full border border-input bg-transparent px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              How it works
            </Link>
          </div>
        </div>

        {/* Hero Visual / Bento Grid */}
        <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
            <div className="absolute -inset-0.5 rounded-[2rem] bg-gradient-to-br from-amber-500/30 to-purple-600/30 opacity-40 blur-2xl dark:opacity-20" />
            
            <div className="relative rounded-[2rem] border border-border/50 bg-background/60 backdrop-blur-xl p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                   <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Net Profit</div>
                   <div className="text-4xl font-display font-bold mt-1 text-foreground">$12,450.00</div>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Realized ROI", value: "+18.2%", color: "text-emerald-600" },
                  { label: "Open Positions", value: "3", color: "text-foreground" },
                  { label: "Avg FX Rate", value: "3.75 SAR", color: "text-muted-foreground" },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border/40">
                    <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                    <span className={`font-mono font-semibold ${stat.color}`}>{stat.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-border/40">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex -space-x-2">
                        <div className="h-8 w-8 rounded-full border-2 border-background bg-gray-200" />
                        <div className="h-8 w-8 rounded-full border-2 border-background bg-gray-300" />
                        <div className="h-8 w-8 rounded-full border-2 border-background bg-gray-400" />
                    </div>
                    <p>Trusted by serious traders</p>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}

