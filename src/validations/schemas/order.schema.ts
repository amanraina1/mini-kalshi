import * as z from "zod";


export const createOrderSchema = z.object({
    userId: z.string().uuid("Invalid user ID format"),
    marketId: z.string().uuid("Invalid market ID format"),
    side: z.enum(["buy", "sell"]),
    contract: z.enum(["yes", "no"]),
    price: z.number().int().min(1, "Price must be at least 1 cent").max(99, "Price cannot exceed 99 cents"),
    qty: z.number().int().positive("Quantity must be a positive integer")
});

export const cancelOrderSchema = z.object({
    userId: z.string().uuid("Invalid user ID format"),
    id: z.string().uuid("Invalid order ID format") // order id
});