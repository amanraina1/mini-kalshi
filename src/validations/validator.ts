import * as z from "zod";

export function validate(schema, body) {
    const result = schema.safeParse(body);
    if(!result.success) {
        return { success: false, errors: z.flattenError(result.error).fieldErrors}
    }
    return result;
}