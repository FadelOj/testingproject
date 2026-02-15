"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { api } from "@testingproject/backend/convex/_generated/api";
import type { Doc, Id } from "@testingproject/backend/convex/_generated/dataModel";
import { Authenticated, AuthLoading, Unauthenticated, useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CURRENCIES, UNITS, UNIT_LABELS } from "@/lib/constants";
import {
  calculateProfitLocal,
  convertUnit,
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

const today = () => new Date().toISOString().slice(0, 10);

const buildDraft = (
  settings: Doc<"userSettings"> | null | undefined,
  trade?: TradeDoc,
): TradeDraft => ({
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

const parseNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const toTradeLike = (draft: TradeDraft): TradeLike => ({
  tradeDate: draft.tradeDate,
  quantity: parseNumber(draft.quantity),
  unit: draft.unit,
  buyPriceUsd: parseNumber(draft.buyPriceUsd),
  sellPriceUsd: parseNumber(draft.sellPriceUsd),
  buyFxRate: parseNumber(draft.buyFxRate),
  sellFxRate: parseNumber(draft.sellFxRate),
  feeLocal: parseNumber(draft.feeLocal),
});

const validateDraft = (draft: TradeDraft) => {
  if (!draft.tradeDate.trim()) return "Trade date is required.";
  const values = toTradeLike(draft);
  if (!Number.isFinite(values.quantity) || values.quantity <= 0) return "Quantity must be > 0.";
  if (!Number.isFinite(values.buyPriceUsd) || values.buyPriceUsd <= 0)
    return "Buy price must be > 0.";
  if (!Number.isFinite(values.sellPriceUsd) || values.sellPriceUsd <= 0)
    return "Sell price must be > 0.";
  if (!Number.isFinite(values.buyFxRate) || values.buyFxRate <= 0)
    return "Buy FX rate must be > 0.";
  if (!Number.isFinite(values.sellFxRate) || values.sellFxRate <= 0)
    return "Sell FX rate must be > 0.";
  if (!Number.isFinite(values.feeLocal) || values.feeLocal < 0) return "Fee must be >= 0.";
  return null;
};

const buildProfitSeries = (trades: TradeDoc[]) => {
  const ordered = [...trades].sort((a, b) => a.tradeDate.localeCompare(b.tradeDate));
  let running = 0;
  return ordered.map((trade) => {
    const profit = calculateProfitLocal(trade);
    running += profit;
    return {
      id: trade._id,
      date: trade.tradeDate,
      profit,
      cumulative: running,
    };
  });
};

const Chart = ({ data, currency }: { data: ReturnType<typeof buildProfitSeries>; currency: string }) => {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-border/60 text-sm text-muted-foreground">
        Add trades to see the profit curve.
      </div>
    );
  }

  const width = 700;
  const height = 220;
  const padding = 30;
  const values = data.map((item) => item.cumulative);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data.map((item, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y = padding + (1 - (item.cumulative - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");

  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
      <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>Cumulative Profit</span>
        <span>
          {formatMoney(values.at(-1) ?? 0, currency)} | {data.length} points
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full">
        <defs>
          <linearGradient id="profitLine" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(245,158,11)" />
            <stop offset="100%" stopColor="rgb(16,185,129)" />
          </linearGradient>
        </defs>
        <rect
          x={padding}
          y={padding}
          width={width - padding * 2}
          height={height - padding * 2}
          rx="18"
          fill="rgba(15,23,42,0.02)"
        />
        <path d={path} stroke="url(#profitLine)" strokeWidth="4" fill="none" />
        {points.map((point, index) => (
          <circle key={`dot-${index}`} cx={point.x} cy={point.y} r="4" fill="rgb(245,158,11)" />
        ))}
      </svg>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatMoney(min, currency)}</span>
        <span>{formatMoney(max, currency)}</span>
      </div>
    </div>
  );
};

const TradesTable = ({
  trades,
  currency,
  onEdit,
  onDelete,
}: {
  trades: TradeDoc[];
  currency: string;
  onEdit: (trade: TradeDoc) => void;
  onDelete: (id: Id<"trades">) => void;
}) => {
  if (trades.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
        No trades yet. Add your first trade to see performance.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/80">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">Date</th>
            <th className="px-4 py-3 text-left">Qty</th>
            <th className="px-4 py-3 text-left">Buy USD</th>
            <th className="px-4 py-3 text-left">Sell USD</th>
            <th className="px-4 py-3 text-left">FX (Buy/Sell)</th>
            <th className="px-4 py-3 text-left">Fee</th>
            <th className="px-4 py-3 text-left">Profit</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => {
            const profit = calculateProfitLocal(trade);
            return (
              <tr key={trade._id} className="border-t border-border/40">
                <td className="px-4 py-3">{trade.tradeDate}</td>
                <td className="px-4 py-3">
                  {formatNumber(trade.quantity, 3)} {UNIT_LABELS[trade.unit]}
                </td>
                <td className="px-4 py-3">{formatNumber(trade.buyPriceUsd, 2)}</td>
                <td className="px-4 py-3">{formatNumber(trade.sellPriceUsd, 2)}</td>
                <td className="px-4 py-3">
                  {formatNumber(trade.buyFxRate, 3)} / {formatNumber(trade.sellFxRate, 3)}
                </td>
                <td className="px-4 py-3">{formatMoney(trade.feeLocal, currency)}</td>
                <td className={`px-4 py-3 font-medium ${profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {formatMoney(profit, currency)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(trade)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-600 hover:text-rose-700"
                      onClick={() => onDelete(trade._id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default function DashboardPage() {
  return (
    <>
      <Authenticated>
        <DashboardContent />
      </Authenticated>
      <Unauthenticated>
        <div className="flex h-[70vh] items-center justify-center">
          <SignInButton />
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="flex h-[70vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </AuthLoading>
    </>
  );
}

const DashboardContent = () => {
  const { user } = useUser();
  const settings = useQuery(api.userSettings.get);
  const trades = useQuery(api.trades.listByUser);
  const upsertSettings = useMutation(api.userSettings.upsert);
  const createTrade = useMutation(api.trades.create);
  const updateTrade = useMutation(api.trades.update);
  const removeTrade = useMutation(api.trades.remove);

  const [settingsDraft, setSettingsDraft] = useState<{
    baseCurrency: (typeof CURRENCIES)[number];
    defaultUnit: Unit;
  }>({
    baseCurrency: settings?.baseCurrency ?? CURRENCIES[0],
    defaultUnit: settings?.defaultUnit ?? "g",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<TradeDoc | null>(null);
  const [draft, setDraft] = useState<TradeDraft>(() => buildDraft(settings));
  const [formError, setFormError] = useState<string | null>(null);

  const baseCurrency = settings?.baseCurrency ?? settingsDraft.baseCurrency;

  const chartData = useMemo(() => (trades ? buildProfitSeries(trades) : []), [trades]);
  const totalProfit = useMemo(
    () => chartData.reduce((sum, item) => sum + item.profit, 0),
    [chartData],
  );
  const lastTrade = chartData.at(-1);

  const openCreate = () => {
    setEditingTrade(null);
    setDraft(buildDraft(settings));
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEdit = (trade: TradeDoc) => {
    setEditingTrade(trade);
    setDraft(buildDraft(settings, trade));
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitTrade = async () => {
    const error = validateDraft(draft);
    if (error) {
      setFormError(error);
      return;
    }
    const payload = {
      tradeDate: draft.tradeDate,
      quantity: parseNumber(draft.quantity),
      unit: draft.unit,
      buyPriceUsd: parseNumber(draft.buyPriceUsd),
      sellPriceUsd: parseNumber(draft.sellPriceUsd),
      buyFxRate: parseNumber(draft.buyFxRate),
      sellFxRate: parseNumber(draft.sellFxRate),
      feeLocal: parseNumber(draft.feeLocal),
      notes: draft.notes.trim() ? draft.notes.trim() : undefined,
    };

    if (editingTrade) {
      await updateTrade({ id: editingTrade._id, ...payload });
    } else {
      await createTrade(payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: Id<"trades">) => {
    await removeTrade({ id });
  };

  const preview = useMemo(() => {
    const error = validateDraft(draft);
    if (error) return null;
    return calculateProfitLocal(toTradeLike(draft));
  }, [draft]);

  const conversionPreview = useMemo(() => {
    const qty = parseNumber(draft.quantity);
    if (!Number.isFinite(qty) || qty <= 0) return null;
    return UNITS.filter((unit) => unit !== draft.unit).map((unit) => ({
      unit,
      value: convertUnit(qty, draft.unit, unit),
    }));
  }, [draft.quantity, draft.unit]);

  if (settings === undefined || trades === undefined) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (settings === null) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,206,115,0.25),_transparent_50%)] px-4 py-12">
        <div className="mx-auto max-w-xl">
          <Card className="border-border/60 bg-background/90">
            <CardHeader>
              <CardTitle className="font-display text-2xl">Set your trading baseline</CardTitle>
              <CardDescription>
                Choose a base currency and your default unit. You can change this later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Base currency</Label>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={settingsDraft.baseCurrency}
                  onChange={(event) =>
                    setSettingsDraft((prev) => ({
                      ...prev,
                      baseCurrency: event.target.value as (typeof CURRENCIES)[number],
                    }))
                  }
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Default unit</Label>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={settingsDraft.defaultUnit}
                  onChange={(event) =>
                    setSettingsDraft((prev) => ({
                      ...prev,
                      defaultUnit: event.target.value as Unit,
                    }))
                  }
                >
                  {UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {UNIT_LABELS[unit]}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                className="w-full"
                onClick={async () => {
                  await upsertSettings({
                    baseCurrency: settingsDraft.baseCurrency,
                    defaultUnit: settingsDraft.defaultUnit,
                  });
                }}
              >
                Save settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,206,115,0.25),_transparent_50%)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Dashboard
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ""}.
            </h1>
            <p className="text-sm text-muted-foreground">
              Base currency: {settings.baseCurrency} - Default unit:{" "}
              {UNIT_LABELS[settings.defaultUnit]}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={openCreate}>Add Trade</Button>
            <UserButton />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/60 bg-background/80">
            <CardHeader>
              <CardTitle>Total Profit</CardTitle>
              <CardDescription>All closed trades</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              <span className={totalProfit >= 0 ? "text-emerald-600" : "text-rose-600"}>
                {formatMoney(totalProfit, baseCurrency)}
              </span>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-background/80">
            <CardHeader>
              <CardTitle>Total Trades</CardTitle>
              <CardDescription>Count of closed positions</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{trades.length}</CardContent>
          </Card>
          <Card className="border-border/60 bg-background/80">
            <CardHeader>
              <CardTitle>Last Trade</CardTitle>
              <CardDescription>Most recent entry</CardDescription>
            </CardHeader>
            <CardContent className="text-base font-medium">
              {lastTrade ? (
                <div className="space-y-1">
                  <div>{lastTrade.date}</div>
                  <div className={lastTrade.profit >= 0 ? "text-emerald-600" : "text-rose-600"}>
                    {formatMoney(lastTrade.profit, baseCurrency)}
                  </div>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">No trades yet</span>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Chart data={chartData} currency={baseCurrency} />
          <Card className="border-border/60 bg-background/80">
            <CardHeader>
              <CardTitle>Quick Insights</CardTitle>
              <CardDescription>Profit and FX summary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span>Average profit per trade</span>
                <span className="font-medium">
                  {formatMoney(trades.length ? totalProfit / trades.length : 0, baseCurrency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Best trade</span>
                <span className="font-medium">
                  {formatMoney(
                    chartData.length ? Math.max(...chartData.map((item) => item.profit)) : 0,
                    baseCurrency,
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Worst trade</span>
                <span className="font-medium">
                  {formatMoney(
                    chartData.length ? Math.min(...chartData.map((item) => item.profit)) : 0,
                    baseCurrency,
                  )}
                </span>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                FX rates are entered as local currency per USD. Profit is shown in{" "}
                {settings.baseCurrency}.
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold">Transactions</h2>
            <Button variant="outline" onClick={openCreate}>
              Add Trade
            </Button>
          </div>
          <TradesTable
            trades={[...trades].sort((a, b) => b.tradeDate.localeCompare(a.tradeDate))}
            currency={baseCurrency}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        </section>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-2xl rounded-3xl border border-border/60 bg-background p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  {editingTrade ? "Edit trade" : "New trade"}
                </p>
                <h3 className="font-display text-2xl font-semibold">
                  {editingTrade ? "Update trade details" : "Add a gold trade"}
                </h3>
              </div>
              <Button variant="ghost" onClick={closeModal}>
                Close
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Trade date</Label>
                <Input
                  type="date"
                  value={draft.tradeDate}
                  onChange={(event) => setDraft((prev) => ({ ...prev, tradeDate: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={draft.quantity}
                  onChange={(event) => setDraft((prev) => ({ ...prev, quantity: event.target.value }))}
                  placeholder="0.0"
                />
              </div>
              <div className="grid gap-2">
                <Label>Unit</Label>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={draft.unit}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, unit: event.target.value as Unit }))
                  }
                >
                  {UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {UNIT_LABELS[unit]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Fee ({baseCurrency})</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={draft.feeLocal}
                  onChange={(event) => setDraft((prev) => ({ ...prev, feeLocal: event.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label>Buy price (USD per unit)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={draft.buyPriceUsd}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, buyPriceUsd: event.target.value }))
                  }
                  placeholder="0.0"
                />
              </div>
              <div className="grid gap-2">
                <Label>Sell price (USD per unit)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={draft.sellPriceUsd}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, sellPriceUsd: event.target.value }))
                  }
                  placeholder="0.0"
                />
              </div>
              <div className="grid gap-2">
                <Label>Buy FX rate (local per USD)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={draft.buyFxRate}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, buyFxRate: event.target.value }))
                  }
                  placeholder="0.0"
                />
              </div>
              <div className="grid gap-2">
                <Label>Sell FX rate (local per USD)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={draft.sellFxRate}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, sellFxRate: event.target.value }))
                  }
                  placeholder="0.0"
                />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label>Notes (optional)</Label>
                <Input
                  value={draft.notes}
                  onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Broker, marketplace, or context"
                />
              </div>
            </div>

            {conversionPreview ? (
              <div className="mt-4 rounded-2xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                Conversion preview:{" "}
                {conversionPreview
                  .map((item) => `${formatNumber(item.value, 4)} ${UNIT_LABELS[item.unit]}`)
                  .join(" | ")}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {preview !== null ? (
                  <span>
                    Estimated profit:{" "}
                    <span className={preview >= 0 ? "text-emerald-600" : "text-rose-600"}>
                      {formatMoney(preview, baseCurrency)}
                    </span>
                  </span>
                ) : (
                  <span>Enter all values to preview profit.</span>
                )}
                {formError ? <div className="mt-1 text-rose-600">{formError}</div> : null}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitTrade}>
                  {editingTrade ? "Save changes" : "Add trade"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
