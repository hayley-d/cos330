import { z } from "zod";

const uuidV4Regex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sanitizeString(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

export const ReadAssetSchema = z.object({
  asset_id: z.string().regex(uuidV4Regex, "asset_id must be a valid UUID v4"),
  user_id: z.string().regex(uuidV4Regex, "user_id must be a valid UUID v4"),
});

export const ListAssetItemSchema = z.object({
  asset_id: z.string().regex(uuidV4Regex, "asset_id must be a valid UUID v4"),
  file_name: z.string().max(255).optional(),
  description: z.string().optional(),
});

export const DeleteAssetSchema = z.object({
  asset_id: z.string().regex(uuidV4Regex, "asset_id must be a valid UUID v4"),
  deleted_by: z
    .string()
    .regex(uuidV4Regex, "deleted_by must be a valid UUID v4"),
});

export const confPatchSchema = z.object({
  asset_id: z.string().regex(uuidV4Regex, "asset_id must be a valid UUID v4"),
  updated_by: z
    .string()
    .regex(uuidV4Regex, "updated_by must be a valid UUID v4"),
  content: z
    .string()
    .transform((val) => Buffer.from(val, "utf-8"))
    .optional(),
  file_name: z.string().max(255).transform(sanitizeString).optional(),
  description: z.string().transform(sanitizeString).optional(),
});

export const AssetPatchSchema = z.object({
  asset_id: z.string().regex(uuidV4Regex, "asset_id must be a valid UUID v4"),
  updated_by: z
    .string()
    .regex(uuidV4Regex, "updated_by must be a valid UUID v4"),
  content: z.instanceof(Buffer).optional(),
  file_name: z.string().max(255).transform(sanitizeString).optional(),
  description: z.string().transform(sanitizeString).optional(),
  mime_type: z.string().max(100),
  asset_type: z.enum(["image", "document"]),
});

export const assetSchema = z
  .object({
    asset_id: z.string().regex(uuidV4Regex, "asset_id must be a valid UUID v4"),

    description: z.string().transform(sanitizeString).nullable().optional(),

    asset_type: z.enum(["image", "document", "confidential"]),

    file_name: z
      .string()
      .max(255)
      .transform(sanitizeString)
      .nullable()
      .optional(),
    mime_type: z.string().max(100),

    size_bytes: z.number().int().nonnegative(),

    sha256: z
      .string()
      .length(64)
      .regex(/^[0-9a-f]+$/, "sha256 must be a valid hex string"),

    content: z.instanceof(Buffer).nullable().optional(),

    payload_ciphertext: z.instanceof(Buffer).nullable().optional(),
    payload_nonce: z.instanceof(Buffer).nullable().optional(),
    payload_tag: z.instanceof(Buffer).nullable().optional(),

    key_id: z.string().max(20).default("v1"),

    created_at: z.number().int(),
    updated_at: z.number().int().nullable().optional(),
    deleted_at: z.number().int().nullable().optional(),

    created_by: z.string().regex(uuidV4Regex),
    deleted_by: z.string().regex(uuidV4Regex).nullable().optional(),
    updated_by: z.string().regex(uuidV4Regex).nullable().optional(),
  })
  .refine(
    (data) =>
      data.asset_type === "confidential"
        ? data.content == null &&
          data.payload_ciphertext != null &&
          data.payload_nonce != null &&
          data.payload_tag != null
        : data.content != null &&
          data.payload_ciphertext == null &&
          data.payload_nonce == null &&
          data.payload_tag == null,
    {
      message:
        "For confidential assets, use ciphertext/nonce/tag and no content. For others, use content and no ciphertext/nonce/tag.",
      path: ["asset_type"],
    },
  );

export const createAssetSchema = z.object({
  file_name: z.string().max(50).transform(sanitizeString),
  mime_type: z.string().max(100),
  content: z.string().transform((val, ctx) => {
    try {
      return Buffer.from(val, "base64");
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "content must be valid base64",
      });
      return z.NEVER;
    }
  }),
  created_by: z.string().regex(uuidV4Regex, "asset_id must be a valid UUID v4"),
  description: z.string().max(255).transform(sanitizeString),
  asset_type: z.enum(["image", "document", "confidential"]),
  key_id: z.string().max(100).optional().default("v1"),
});

export const createDocumentSchema = z.object({
  file_name: z.string().max(50).transform(sanitizeString),
  mime_type: z.string().max(100),

  content: z
    .array(z.number().int().min(0).max(255))
    .transform((arr) => Buffer.from(arr)),

  created_by: z.string().regex(uuidV4Regex, "asset_id must be a valid UUID v4"),
  description: z.string().max(255).transform(sanitizeString),
  asset_type: z.enum(["image", "document", "confidential"]),
  key_id: z.string().max(100).optional().default("v1"),
});

export const createConfidentialSchema = z.object({
  file_name: z.string().max(50).transform(sanitizeString),
  mime_type: z.string().max(100).default("text/plain"),
  content: z.string().transform((val) => Buffer.from(val, "utf-8")),
  created_by: z
    .string()
    .regex(uuidV4Regex, "created_by must be a valid UUID v4"),
  description: z.string().max(255).transform(sanitizeString),
  asset_type: z.literal("confidential"), // enforce only confidential here
  key_id: z.string().max(100).optional().default("v1"),
});

export type createConfidentialDto = z.infer<typeof createConfidentialSchema>;
export type DeleteAssetDto = z.infer<typeof DeleteAssetSchema>;
export type Asset = z.infer<typeof assetSchema>;
export type CreateAssetDto = z.infer<typeof createAssetSchema>;
export type UpdateConfidentialAsset = z.infer<typeof confPatchSchema>;
export type ReadAssetDto = z.infer<typeof ReadAssetSchema>;
export type ListAssetItem = z.infer<typeof ListAssetItemSchema>;
export type PatchAssetDto = z.infer<typeof AssetPatchSchema>;
export type createDocumentDto = z.infer<typeof createDocumentSchema>;
