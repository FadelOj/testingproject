import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

const requireUserId = async (ctx: { auth: { getUserIdentity: () => Promise<any> } }) => {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new Error("Not authenticated");
  }
  return identity.subject as string;
};

export const get = query({
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return settings[0] ?? null;
  },
});

export const upsert = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (existing[0]) {
      await ctx.db.patch(existing[0]._id, {
        baseCurrency: args.baseCurrency,
        defaultUnit: args.defaultUnit,
      });
      return { success: true };
    }
    await ctx.db.insert("userSettings", {
      userId,
      baseCurrency: args.baseCurrency,
      defaultUnit: args.defaultUnit,
    });
    return { success: true };
  },
});
