import * as z from "zod";

export const marketSchema = z.object({
    title: z.string().min(3)
})