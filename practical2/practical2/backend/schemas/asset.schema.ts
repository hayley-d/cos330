import { z } from "zod";

const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const DeleteConfidentialSchema = z.object({
    asset_id: z
        .string()
        .regex(uuidV4Regex, "asset_id must be a valid UUID v4"),
    deleted_by: z
        .string()
        .regex(uuidV4Regex, "deleted_by must be a valid UUID v4"),
});

export const confPatchSchema = z.object({
    asset_id: z
        .string()
        .regex(uuidV4Regex, "asset_id must be a valid UUID v4"),
    updated_by: z
        .string()
        .regex(uuidV4Regex, "updated_by must be a valid UUID v4"),
    content: z.instanceof(Buffer).optional(),
    file_name: z.string().max(255).optional(),
    description: z.string().optional()
});


export const assetSchema = z.object({
        asset_id: z
            .string()
            .regex(uuidV4Regex, "asset_id must be a valid UUID v4"),

        description: z.string().nullable().optional(),

        asset_type: z
            .string()
            .min(1)
            .max(50),

        file_name: z.string().max(255).nullable().optional(),
        mime_type: z.string().max(100),

        size_bytes: z
            .number()
            .int()
            .nonnegative(),

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
        }
    );


export type DeleteConfidentialDto = z.infer<typeof DeleteConfidentialSchema>;
export type Asset = z.infer<typeof assetSchema>;
export type UpdateConfidentialAsset = z.infer<typeof confPatchSchema>;