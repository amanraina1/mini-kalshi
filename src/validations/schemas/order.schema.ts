import * as z from "zod";

export const createOrderSchema = z.object({
    userId: z.string(),
    marketId: z.string(),
    side: z.enum(["buy", "sell"]),
    contract: z.enum(["yes", "no"]),
    price: z.number().positive(),
    qty: z.number().positive()
});

export const cancelOrderSchema = z.object({
    userId: z.string(),
    id: z.string()
});