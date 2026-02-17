"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { api } from "@testingproject/backend/convex/_generated/api";
import type { Doc, Id } from "@testingproject/backend/convex/_generated/dataModel";
import { Authenticated, AuthLoading, Unauthenticated, useMutation, useQuery } from "convex/react";
import { ArrowUpRight, Loader2, Plus, Settings2, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CURRENCIES, UNITS, UNIT_LABELS } from "@/lib/constants";
import {
  calculateProfitLocal,
  formatMoney,
  formatNumber,
  type TradeLike,
  type Unit,
} from "@/lib/trade-utils";

type TradeDoc = Doc<"trades">;

type TradeDraft = {
  tradeDate: string;
  quantity: string;
  unit: Unit;
  buyPriceUsd: string;
  sellPriceUsd: string;
  buyFxRate: string;
  sellFxRate: string;
  feeLocal: string;
  notes: string;
};

// ... [Keep helper functions: today, buildDraft, parseNumber, toTradeLike, validateDraft, buildProfitSeries] ...
// Re-inserting helpers for completeness in context of copy-paste, condensed for brevity
const today = () => new Date().toISOString().slice(0, 10);
const buildDraft = (settings: Doc<"userSettings"> | null | undefined, trade?: TradeDoc): TradeDraft => ({
  tradeDate: trade?.tradeDate ?? today(),
  quantity: trade ? String(trade.quantity) : "",
  unit: trade?.unit ?? settings?.defaultUnit ?? "g",
  buyPriceUsd: trade ? String(trade.buyPriceUsd) : "",
  sellPriceUsd: trade ? String(trade.sellPriceUsd) : "",
  buyFxRate: trade ? String(trade.buyFxRate) : "",
  sellFxRate: trade ? String(trade.sellFxRate) : "",
  feeLocal: trade ? String(trade.feeLocal) : "0",
  notes: trade?.notes ?? "",
});
const parseNumber = (v: string) => { const p = Number(v); return Number.isFinite(p) ? p : NaN; };
const toTradeLike = (d: TradeDraft): TradeLike => ({
  tradeDate: d.tradeDate,
  quantity: parseNumber(d.quantity),
  unit: d.unit,
  buyPriceUsd: parseNumber(d.buyPriceUsd),
  sellPriceUsd: parseNumber(d.sellPriceUsd),
  buyFxRate: parseNumber(d.buyFxRate),
  sellFxRate: parseNumber(d.sellFxRate),
  feeLocal: parseNumber(d.feeLocal),
});
const validateDraft = (d: TradeDraft) => {
  if (!d.tradeDate) return "Date required";
  const v = toTradeLike(d);
  if (!Number.isFinite(v.quantity) || v.quantity <= 0) return "Quantity > 0";
  if (!Number.isFinite(v.buyPriceUsd) || v.buyPriceUsd <= 0) return "Buy Price > 0";
  if (!Number.isFinite(v.sellPriceUsd) || v.sellPriceUsd <= 0) return "Sell Price > 0";
  if (!Number.isFinite(v.buyFxRate) || v.buyFxRate <= 0) return "Buy FX > 0";
  if (!Number.isFinite(v.sellFxRate) || v.sellFxRate <= 0) return "Sell FX > 0";
  if (!Number.isFinite(v.feeLocal) || v.feeLocal < 0) return "Fee >= 0";
  return null;
};
const buildProfitSeries = (trades: TradeDoc[]) => {
  const ordered = [...trades].sort((a, b) => a.tradeDate.localeCompare(b.tradeDate));
  let running = 0;
  return ordered.map((trade) => {
    const profit = calculateProfitLocal(trade);
    running += profit;
    return { id: trade._id, date: trade.tradeDate, profit, cumulative: running };
  });
};

/* --- ENHANCED CHART COMPONENT --- */
const Chart = ({ data, currency }: { data: ReturnType<typeof buildProfitSeries>; currency: string }) => {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-border/50 bg-muted/20 text-sm text-muted-foreground">
        <TrendingUp className="mb-2 h-8 w-8 opacity-20" />
        <p>No trade data available yet.</p>
      </div>
    );
  }

  const width = 800;
  const height = 280;
  const padding = 20;
  const values = data.map((item) => item.cumulative);
  const min = Math.min(0, ...values); // Always include 0 line if possible
  const max = Math.max(...values);
  const range = max - min || 1;

  const getX = (i: number) => padding + (i / Math.max(data.length - 1, 1)) * (width - padding * 2);
  const getY = (v: number) => height - padding - ((v - min) / range) * (height - padding * 2);

  const points = data.map((item, index) => ({ x: getX(index), y: getY(item.cumulative) }));
  
  // Create area path (closed loop)
  const areaPath = `
    M ${points[0].x},${height} 
    L ${points[0].x},${points[0].y} 
    ${points.map(p => `L ${p.x},${p.y}`).join(" ")} 
    L ${points[points.length - 1].x},${height} 
    Z
  `;

  // Create stroke path
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");

  const zeroY = getY(0);

  return (
    <Card className="border-border/50 bg-background/60 backdrop-blur-sm shadow-sm transition-all hover:shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
           <div>
             <CardTitle className="font-display text-lg">Performance Curve</CardTitle>
             <CardDescription>Cumulative profit over time</CardDescription>
           </div>
           <div className="text-right">
             <div className="text-2xl font-display font-semibold text-foreground">
                {formatMoney(values.at(-1) ?? 0, currency)}
             </div>
             <div className={cn("text-xs font-medium", values.at(-1)! >= 0 ? "text-emerald-600" : "text-rose-600")}>
                Total Realized
             </div>
           </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-[280px] w-full overflow-hidden rounded-xl bg-gradient-to-b from-muted/50 to-transparent p-1 ring-1 ring-border/20">
          <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Zero Line */}
            {min < 0 && max > 0 && (
                <line x1={padding} y1={zeroY} x2={width - padding} y2={zeroY} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
            )}

            {/* Area Fill */}
            <path d={areaPath} fill="url(#chartFill)" />
            
            {/* Line Stroke */}
            <path d={linePath} stroke="var(--primary)" strokeWidth="3" fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            
            {/* Dots */}
            {points.map((point, index) => (
              <g key={index} className="group">
                <circle 
                    cx={point.x} 
                    cy={point.y} 
                    r="4" 
                    className="fill-background stroke-primary stroke-[3px] opacity-0 transition-opacity duration-200 group-hover:opacity-100" 
                />
                {/* Simple Tooltip via SVG (Basic) */}
                <title>{formatMoney(values[index], currency)}</title>
              </g>
            ))}
          </svg>
        </div>
        <div className="mt-4 flex justify-between text-xs text-muted-foreground font-mono">
            <span>{data[0]?.date}</span>
            <span>{data[data.length - 1]?.date}</span>
        </div>
      </CardContent>
    </Card>
  );
};

/* --- MODERN TABLE COMPONENT --- */
const TradesTable = ({
  trades,
  currency,
  onEdit,
  onDelete,
}: {
  trades: TradeDoc[];
  currency: string;
  onEdit: (trade: TradeDoc) => void;
  onDelete: (id: Id<"trades">) => void | Promise<void>;
}) => {
  if (trades.length === 0) return null;

  return (
    <Card className="overflow-hidden border-border/50 bg-background shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border/50">
            <tr>
              {[
                  "Date", "Qty", "Buy (USD)", "Sell (USD)", "FX Rates", "Fee", "Profit"
              ].map(h => (
                  <th key={h} className="px-6 py-4 text-left font-medium text-muted-foreground uppercase tracking-wider text-[11px]">{h}</th>
              ))}
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {trades.map((trade) => {
              const profit = calculateProfitLocal(trade);
              return (
                <tr key={trade._id} className="group transition-colors hover:bg-muted/30">
                  <td className="px-6 py-4 font-medium text-foreground">{trade.tradeDate}</td>
                  <td className="px-6 py-4 font-mono text-muted-foreground">
                    <span className="text-foreground">{formatNumber(trade.quantity, 3)}</span> <span className="text-xs">{UNIT_LABELS[trade.unit]}</span>
                  </td>
                  <td className="px-6 py-4 font-mono text-muted-foreground">${formatNumber(trade.buyPriceUsd, 2)}</td>
                  <td className="px-6 py-4 font-mono text-muted-foreground">${formatNumber(trade.sellPriceUsd, 2)}</td>
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                    <div>B: {formatNumber(trade.buyFxRate, 3)}</div>
                    <div>S: {formatNumber(trade.sellFxRate, 3)}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-muted-foreground">{formatMoney(trade.feeLocal, currency)}</td>
                  <td className="px-6 py-4">
                    <Badge variant={profit >= 0 ? "default" : "destructive"} className={cn("font-mono font-normal", profit >= 0 ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-400" : "bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 dark:text-rose-400")}>
                        {formatMoney(profit, currency)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(trade)}>
                         <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => onDelete(trade._id)}>
                        <div className="h-4 w-1 bg-current rotate-45 absolute" />
                        <div className="h-4 w-1 bg-current -rotate-45 absolute" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default function DashboardPage() {
  return (
    <div className="bg-muted/10 min-h-screen pb-20">
      <Authenticated>
        <DashboardContent />
      </Authenticated>
      <Unauthenticated>
         <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
            <h2 className="font-display text-2xl font-semibold">Sign in to track your gold</h2>
            <SignInButton mode="modal">
                <Button size="lg" className="rounded-full">Get Started</Button>
            </SignInButton>
         </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthLoading>
    </div>
  );
}

const DashboardContent = () => {
  const { user } = useUser();
  const [hasMounted, setHasMounted] = useState(false);
  const settings = useQuery(api.userSettings.get);
  const trades = useQuery(api.trades.listByUser);
  const upsertSettings = useMutation(api.userSettings.upsert);
  const createTrade = useMutation(api.trades.create);
  const updateTrade = useMutation(api.trades.update);
  const removeTrade = useMutation(api.trades.remove);

  useEffect(() => setHasMounted(true), []);

  const [settingsDraft, setSettingsDraft] = useState({
    baseCurrency: settings?.baseCurrency ?? CURRENCIES[0],
    defaultUnit: settings?.defaultUnit ?? "g",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<TradeDoc | null>(null);
  const [draft, setDraft] = useState<TradeDraft>(() => buildDraft(settings));
  const [formError, setFormError] = useState<string | null>(null);

  const baseCurrency = settings?.baseCurrency ?? settingsDraft.baseCurrency;
  const chartData = useMemo(() => (trades ? buildProfitSeries(trades) : []), [trades]);
  const totalProfit = useMemo(() => chartData.reduce((sum, item) => sum + item.profit, 0), [chartData]);

  const openCreate = () => { setEditingTrade(null); setDraft(buildDraft(settings)); setFormError(null); setIsModalOpen(true); };
  const openEdit = (trade: TradeDoc) => { setEditingTrade(trade); setDraft(buildDraft(settings, trade)); setFormError(null); setIsModalOpen(true); };
  const closeModal = () => setIsModalOpen(false);
  const handleDelete = async (id: Id<"trades">) => {
    await removeTrade({ id });
  };

  const handleSubmitTrade = async () => {
    const error = validateDraft(draft);
    if (error) { setFormError(error); return; }
    const payload = {
      tradeDate: draft.tradeDate,
      quantity: parseNumber(draft.quantity),
      unit: draft.unit,
      buyPriceUsd: parseNumber(draft.buyPriceUsd),
      sellPriceUsd: parseNumber(draft.sellPriceUsd),
      buyFxRate: parseNumber(draft.buyFxRate),
      sellFxRate: parseNumber(draft.sellFxRate),
      feeLocal: parseNumber(draft.feeLocal),
      notes: draft.notes.trim() || undefined,
    };
    if (editingTrade) await updateTrade({ id: editingTrade._id, ...payload });
    else await createTrade(payload);
    setIsModalOpen(false);
  };

  const preview = useMemo(() => {
      const e = validateDraft(draft);
      return e ? null : calculateProfitLocal(toTradeLike(draft));
  }, [draft]);

  if (!hasMounted || settings === undefined || trades === undefined) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // --- ONBOARDING VIEW ---
  if (settings === null) {
      return (
          <div className="flex min-h-[80vh] items-center justify-center p-4">
             <Card className="w-full max-w-lg border-border/60 shadow-xl">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Wallet className="h-6 w-6" />
                    </div>
                    <CardTitle className="font-display text-2xl">Setup your Portfolio</CardTitle>
                    <CardDescription>Choose your reporting currency.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <Label>Base Currency</Label>
                             <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
                                value={settingsDraft.baseCurrency} onChange={(e) => setSettingsDraft(p => ({...p, baseCurrency: e.target.value as (typeof CURRENCIES)[number]}))}>
                                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                        </div>
                        <div className="space-y-2">
                             <Label>Preferred Unit</Label>
                             <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
                                value={settingsDraft.defaultUnit} onChange={(e) => setSettingsDraft(p => ({...p, defaultUnit: e.target.value as Unit}))}>
                                {UNITS.map(u => <option key={u} value={u}>{UNIT_LABELS[u]}</option>)}
                             </select>
                        </div>
                    </div>
                    <Button className="w-full" size="lg" onClick={() => upsertSettings(settingsDraft)}>Complete Setup</Button>
                </CardContent>
             </Card>
          </div>
      )
  }

  // --- MAIN DASHBOARD VIEW ---
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
         <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
               Dashboard
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
               Welcome back, {user?.firstName}. Market snapshot in {settings.baseCurrency}.
            </p>
         </div>
         <div className="flex items-center gap-3">
             <Button onClick={openCreate} className="shadow-lg shadow-primary/20 hover:shadow-primary/30 rounded-full px-6">
                <Plus className="mr-2 h-4 w-4" /> New Trade
             </Button>
             <UserButton afterSignOutUrl="/" />
         </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
         <Card className="glass-card relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet className="h-16 w-16 -rotate-12" /></div>
             <CardHeader className="pb-2">
                 <CardDescription>Net Profit</CardDescription>
                 <CardTitle className="font-display text-3xl font-medium tracking-tight">
                    <span className={totalProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                        {formatMoney(totalProfit, baseCurrency)}
                    </span>
                 </CardTitle>
             </CardHeader>
             <CardContent>
                 <div className="text-xs text-muted-foreground">All time realized P&L</div>
             </CardContent>
         </Card>

         <Card className="glass-card">
             <CardHeader className="pb-2">
                 <CardDescription>Total Volume</CardDescription>
                 <CardTitle className="font-display text-3xl font-medium tracking-tight">
                    {trades.length} <span className="text-lg text-muted-foreground font-sans font-normal">trades</span>
                 </CardTitle>
             </CardHeader>
             <CardContent>
                 <div className="text-xs text-muted-foreground">Closed positions</div>
             </CardContent>
         </Card>
         
         <Card className="glass-card bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
             <CardHeader className="pb-2">
                 <CardDescription className="text-primary/80">Best Performance</CardDescription>
                 <CardTitle className="font-display text-3xl font-medium tracking-tight text-foreground">
                    {formatMoney(chartData.length ? Math.max(...chartData.map(i => i.profit)) : 0, baseCurrency)}
                 </CardTitle>
             </CardHeader>
             <CardContent>
                 <div className="text-xs text-primary/70 flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3" /> Single best trade
                 </div>
             </CardContent>
         </Card>
      </div>

      {/* Chart & Stats */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
         <Chart data={chartData} currency={baseCurrency} />
         
         <Card className="border-border/50 bg-background/60 backdrop-blur-sm h-full">
            <CardHeader>
                <CardTitle className="font-display text-lg">Trade Log</CardTitle>
                <CardDescription>Recent activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {trades.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic">No trades recorded.</div>
                ) : (
                    [...trades].sort((a,b) => b.tradeDate.localeCompare(a.tradeDate)).slice(0, 4).map(trade => (
                        <div key={trade._id} className="flex items-center justify-between border-b border-border/30 pb-3 last:border-0 last:pb-0">
                            <div className="grid gap-0.5">
                                <span className="font-medium text-sm">{trade.tradeDate}</span>
                                <span className="text-xs text-muted-foreground">{formatNumber(trade.quantity)} {trade.unit}</span>
                            </div>
                            <div className={`font-mono font-medium text-sm ${calculateProfitLocal(trade) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                {formatMoney(calculateProfitLocal(trade), baseCurrency)}
                            </div>
                        </div>
                    ))
                )}
                {trades.length > 4 && (
                    <Button variant="link" className="w-full text-xs text-muted-foreground h-auto p-0">View all history</Button>
                )}
            </CardContent>
         </Card>
      </div>

      {/* Main Table */}
      <div className="space-y-4">
         <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Transaction History</h2>
         </div>
         <TradesTable trades={[...trades].sort((a,b) => b.tradeDate.localeCompare(a.tradeDate))} currency={baseCurrency} onEdit={openEdit} onDelete={handleDelete} />
      </div>

      {/* MODAL - Updated Layout */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
           <div className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={closeModal} />
           <Card className="relative w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border-border/60">
               <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
                   <div className="flex items-center justify-between">
                       <CardTitle className="font-display text-xl">{editingTrade ? "Edit Position" : "Log New Trade"}</CardTitle>
                       <Button variant="ghost" size="sm" onClick={closeModal}>✕</Button>
                   </div>
                   <CardDescription>Enter USD prices and local FX rates to compute accurate profit.</CardDescription>
               </CardHeader>
               
               <CardContent className="grid gap-6 p-6 md:grid-cols-2">
                   {/* Left Column: Trade Details */}
                   <div className="space-y-4">
                       <h4 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Trade Details</h4>
                       <div className="grid gap-3">
                           <div className="grid gap-1.5">
                               <Label>Date</Label>
                               <Input type="date" value={draft.tradeDate} onChange={e => setDraft(p => ({...p, tradeDate: e.target.value}))} />
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-1.5">
                                    <Label>Quantity</Label>
                                    <Input type="number" placeholder="0.00" value={draft.quantity} onChange={e => setDraft(p => ({...p, quantity: e.target.value}))} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label>Unit</Label>
                                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={draft.unit} onChange={e => setDraft(p => ({...p, unit: e.target.value as Unit}))}>
                                        {UNITS.map(u => <option key={u} value={u}>{UNIT_LABELS[u]}</option>)}
                                    </select>
                                </div>
                           </div>
                           <div className="grid gap-1.5">
                               <Label>Notes</Label>
                               <Input placeholder="Strategy, broker..." value={draft.notes} onChange={e => setDraft(p => ({...p, notes: e.target.value}))} />
                           </div>
                       </div>
                   </div>

                   {/* Right Column: Financials */}
                   <div className="space-y-4">
                       <h4 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Financials (USD & FX)</h4>
                       <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-4">
                           {/* BUY SIDE */}
                           <div className="space-y-2">
                               <Label className="text-xs text-emerald-600 font-semibold uppercase">Buy Side</Label>
                               <div className="grid grid-cols-2 gap-2">
                                   <Input placeholder="Price USD" type="number" step="0.01" value={draft.buyPriceUsd} onChange={e => setDraft(p => ({...p, buyPriceUsd: e.target.value}))} />
                                   <Input placeholder="FX Rate" type="number" step="0.001" value={draft.buyFxRate} onChange={e => setDraft(p => ({...p, buyFxRate: e.target.value}))} />
                               </div>
                           </div>
                           <Separator className="bg-border/50" />
                           {/* SELL SIDE */}
                           <div className="space-y-2">
                               <Label className="text-xs text-rose-600 font-semibold uppercase">Sell Side</Label>
                               <div className="grid grid-cols-2 gap-2">
                                   <Input placeholder="Price USD" type="number" step="0.01" value={draft.sellPriceUsd} onChange={e => setDraft(p => ({...p, sellPriceUsd: e.target.value}))} />
                                   <Input placeholder="FX Rate" type="number" step="0.001" value={draft.sellFxRate} onChange={e => setDraft(p => ({...p, sellFxRate: e.target.value}))} />
                               </div>
                           </div>
                           <div className="grid gap-1.5 pt-2">
                               <Label>Fees ({baseCurrency})</Label>
                               <Input type="number" value={draft.feeLocal} onChange={e => setDraft(p => ({...p, feeLocal: e.target.value}))} />
                           </div>
                       </div>
                   </div>
               </CardContent>
               
               <div className="bg-muted/30 p-4 border-t border-border/40 flex items-center justify-between">
                   <div className="text-sm">
                       {preview !== null ? (
                           <div className="flex items-center gap-2">
                               <span className="text-muted-foreground">Est. Profit:</span>
                               <span className={cn("font-bold text-lg font-mono", preview >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                   {formatMoney(preview, baseCurrency)}
                               </span>
                           </div>
                       ) : <span className="text-muted-foreground italic">Enter details to preview</span>}
                       {formError && <span className="text-rose-600 text-xs block mt-1">{formError}</span>}
                   </div>
                   <div className="flex gap-2">
                       <Button variant="outline" onClick={closeModal}>Cancel</Button>
                       <Button onClick={handleSubmitTrade}>Save Trade</Button>
                   </div>
               </div>
           </Card>
        </div>
      )}
    </div>
  );
};
