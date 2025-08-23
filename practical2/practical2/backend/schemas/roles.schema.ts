import { z } from "zod";

const uuidV4Regex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const roleSchema = z.object({
  role_id: z.string().regex(uuidV4Regex, "role_id must be a valid UUID v4"),

  role_name: z
    .string()
    .min(1, "role_name is required")
    .max(50, "role_name must be at most 50 characters"),

  role_description: z
    .string()
    .max(255, "role_description must be at most 255 characters")
    .optional()
    .nullable(),

  permissions: z.string().transform((val, ctx) => {
    try {
      return JSON.parse(val);
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "permissions must be valid JSON",
      });
      return z.NEVER;
    }
  }),
});

export const hasAccessSchema = z.object({
  permission: z.string().min(3, "Permission required")
})

export type Role = z.infer<typeof roleSchema>;
export type HasAccessDto = z.infer<typeof hasAccessSchema>;
