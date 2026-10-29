import * as z from "zod";

export const createMarketSchema = z.object({
    title: z.string().min(3).max(500),
    initialWager: z.int().min(0).nullable(),
    bet: z.enum(["yes", "no"])
})