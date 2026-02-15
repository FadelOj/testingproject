import type { UNITS } from "./constants";

export type Unit = (typeof UNITS)[number];

const UNIT_TO_GRAMS: Record<Unit, number> = {
  g: 1,
  oz: 31.1035,
  kg: 1000,
};

export const convertUnit = (quantity: number, from: Unit, to: Unit) => {
  return (quantity * UNIT_TO_GRAMS[from]) / UNIT_TO_GRAMS[to];
};

export const formatMoney = (value: number, currency: string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatNumber = (value: number, decimals = 2) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
};

export type TradeLike = {
  tradeDate: string;
  quantity: number;
  unit: Unit;
  buyPriceUsd: number;
  sellPriceUsd: number;
  buyFxRate: number;
  sellFxRate: number;
  feeLocal: number;
};

export const calculateProfitLocal = (trade: TradeLike) => {
  const cost = trade.buyPriceUsd * trade.quantity * trade.buyFxRate + trade.feeLocal;
  const revenue = trade.sellPriceUsd * trade.quantity * trade.sellFxRate;
  return revenue - cost;
};

export const calculateRevenueLocal = (trade: TradeLike) => {
  return trade.sellPriceUsd * trade.quantity * trade.sellFxRate;
};

export const calculateCostLocal = (trade: TradeLike) => {
  return trade.buyPriceUsd * trade.quantity * trade.buyFxRate + trade.feeLocal;
};
