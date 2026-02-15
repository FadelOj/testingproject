import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  trades: defineTable({
    userId: v.string(),
    tradeDate: v.string(),
    quantity: v.number(),
    unit: v.union(v.literal("g"), v.literal("oz"), v.literal("kg")),
    buyPriceUsd: v.number(),
    sellPriceUsd: v.number(),
    buyFxRate: v.number(),
    sellFxRate: v.number(),
    feeLocal: v.number(),
    notes: v.optional(v.string()),
  }).index("by_user_date", ["userId", "tradeDate"]),
  userSettings: defineTable({
    userId: v.string(),
    baseCurrency: v.union(
      v.literal("USD"),
      v.literal("EUR"),
      v.literal("GBP"),
      v.literal("CAD"),
      v.literal("AUD"),
      v.literal("AED"),
      v.literal("SAR"),
      v.literal("INR"),
      v.literal("JPY"),
      v.literal("CNY"),
    ),
    defaultUnit: v.union(v.literal("g"), v.literal("oz"), v.literal("kg")),
  }).index("by_user", ["userId"]),
});
