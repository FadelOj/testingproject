export const CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "AED",
  "SAR",
  "INR",
  "JPY",
  "CNY",
] as const;

export const UNITS = ["g", "oz", "kg"] as const;

export const UNIT_LABELS: Record<(typeof UNITS)[number], string> = {
  g: "g",
  oz: "oz (troy)",
  kg: "kg",
};
