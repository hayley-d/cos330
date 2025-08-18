import {Resource, UUID} from "../types";
import {Asset} from "../schemas/asset.schema";

export type RequestOption = {
    ok: boolean;
    error?: string;
}

export type RequestAssetOption = {
    ok: boolean;
    error?: string;
    asset?: Asset;
};

export type CreateConfidentialAssetProps = {
    assetId: UUID;
    fileName: string;
    mimeType: string;
    bytes: Buffer;
    createdBy: UUID;
    description: string;
    keyId?: string;
}

export type GetAssetOption = {
    ok: boolean;
    error?: string;
    mimeType?: string;
    bytes?: Buffer;
}

export type DeleteAssetProps = {
    assetId: UUID;
    deletedBy: UUID;
}

export type CreateAssetProps = {
    assetId: UUID;
    fileName: string;
    mimeType: string;
    bytes: Buffer;
    createdBy: UUID;
    description: string;
    assetType: Exclude<Resource, "confidential">;
}

export type CreateAssetRequest = {
    fileName: string;
    mimeType: string;
    bytes: Buffer;
    createdBy: UUID;
    description: string;
    assetType: Resource;
}


export type PatchAssetRequest = {
    assetId: UUID;
    fileName?: string;
    mimeType: string;
    content?: Buffer;
    updatedBy: UUID;
    description?: string;
    assetType: Exclude<Resource, "confidential">;
}

export type AssetListOptions = {
    type?: Resource;
    limit?: number;
    offset?: number;
}

export type PatchConfAssetRequest = {
    updatedBy: UUID;
    assetId: UUID;
    content?: string;
    fileName?: string;
    description?: string;
}

export function assetFromRow(row: AssetRow): Asset {
    return {
        assetId: row.asset_id,
        description: row.description,
        assetType: row.asset_type,
        file_name: row.file_name,
        mimeType: row.mime_type,
        content: row.content ?? null,
        payload_ciphertext: row.payload_ciphertext,
        payload_nonce: row.payload_nonce,
        payload_tag: row.payload_tag,
        key_id: row.key_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        deletedBy: row.deleted_by,
    };
}
