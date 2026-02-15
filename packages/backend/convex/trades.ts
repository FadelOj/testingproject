import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

const requireUserId = async (ctx: { auth: { getUserIdentity: () => Promise<any> } }) => {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new Error("Not authenticated");
  }
  return identity.subject as string;
};

const assertPositive = (value: number, label: string) => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be greater than 0`);
  }
};

const assertNonNegative = (value: number, label: string) => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be 0 or greater`);
  }
};

export const listByUser = query({
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("trades")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    tradeDate: v.string(),
    quantity: v.number(),
    unit: v.union(v.literal("g"), v.literal("oz"), v.literal("kg")),
    buyPriceUsd: v.number(),
    sellPriceUsd: v.number(),
    buyFxRate: v.number(),
    sellFxRate: v.number(),
    feeLocal: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    if (!args.tradeDate.trim()) {
      throw new Error("Trade date is required");
    }
    assertPositive(args.quantity, "Quantity");
    assertPositive(args.buyPriceUsd, "Buy price");
    assertPositive(args.sellPriceUsd, "Sell price");
    assertPositive(args.buyFxRate, "Buy FX rate");
    assertPositive(args.sellFxRate, "Sell FX rate");
    assertNonNegative(args.feeLocal, "Fee");

    return await ctx.db.insert("trades", {
      userId,
      tradeDate: args.tradeDate,
      quantity: args.quantity,
      unit: args.unit,
      buyPriceUsd: args.buyPriceUsd,
      sellPriceUsd: args.sellPriceUsd,
      buyFxRate: args.buyFxRate,
      sellFxRate: args.sellFxRate,
      feeLocal: args.feeLocal,
      notes: args.notes?.trim() ? args.notes.trim() : undefined,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("trades"),
    tradeDate: v.string(),
    quantity: v.number(),
    unit: v.union(v.literal("g"), v.literal("oz"), v.literal("kg")),
    buyPriceUsd: v.number(),
    sellPriceUsd: v.number(),
    buyFxRate: v.number(),
    sellFxRate: v.number(),
    feeLocal: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Trade not found");
    }
    if (existing.userId !== userId) {
      throw new Error("Not authorized");
    }
    if (!args.tradeDate.trim()) {
      throw new Error("Trade date is required");
    }
    assertPositive(args.quantity, "Quantity");
    assertPositive(args.buyPriceUsd, "Buy price");
    assertPositive(args.sellPriceUsd, "Sell price");
    assertPositive(args.buyFxRate, "Buy FX rate");
    assertPositive(args.sellFxRate, "Sell FX rate");
    assertNonNegative(args.feeLocal, "Fee");

    await ctx.db.patch(args.id, {
      tradeDate: args.tradeDate,
      quantity: args.quantity,
      unit: args.unit,
      buyPriceUsd: args.buyPriceUsd,
      sellPriceUsd: args.sellPriceUsd,
      buyFxRate: args.buyFxRate,
      sellFxRate: args.sellFxRate,
      feeLocal: args.feeLocal,
      notes: args.notes?.trim() ? args.notes.trim() : undefined,
    });
    return { success: true };
  },
});

export const remove = mutation({
  args: {
    id: v.id("trades"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Trade not found");
    }
    if (existing.userId !== userId) {
      throw new Error("Not authorized");
    }
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
