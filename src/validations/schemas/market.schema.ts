import * as z from "zod";

export const marketSchema = z.object({
    title: z.string().min(3)
});

export const splitPairsSchema = z.object({
    qty: z.number().positive().min(1),
    marketId: z.string()
});

export const maergePairsSchema = z.object({
    qty: z.number().positive().min(1),
    marketId: z.string()
});

export const resolveMarketSchema = z.object({
    marketId: z.string().uuid("Invalid market ID format"),
    adminId: z.string().uuid("Invalid admin ID format"),
    outcome: z.enum(["yes", "no"]),
});