import { z } from "zod";

const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const roleSchema = z.object({
    role_id: z
        .string()
        .regex(uuidV4Regex, "role_id must be a valid UUID v4"),

    role_name: z
        .string()
        .min(1, "role_name is required")
        .max(50, "role_name must be at most 50 characters"),

    role_description: z
        .string()
        .max(255, "role_description must be at most 255 characters")
        .optional()
        .nullable(),

    permissions: z
        .string()
        .refine((val) => {
            try {
                JSON.parse(val);
                return true;
            } catch {
                return false;
            }
        }, "permissions must be valid JSON"),
});

export type Role = z.infer<typeof roleSchema>;