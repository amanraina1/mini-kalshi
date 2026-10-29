import z from "zod";

export const resolveSchema = z.object({
    marketId: z.string(),
    result: z.enum(["yes", "no"])
});