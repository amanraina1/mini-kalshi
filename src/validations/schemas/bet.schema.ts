import * as z from "zod";

export const createBetSchema = z.object({
    marketId: z.string(),
    amount: z.int().min(1)
});