import type { APPLICATION_DB as DB } from "../db/db";
import type { Resource, UUID } from "../types";
import {randomUUID} from "crypto";
import {
    createConfidentialAsset,
    createPublicAsset,
    getAssetBytes,
    listAssets as repoListAsset, softDeleteAsset,
    updateAssetMeta
} from "../repositories/asset.repo";

import {AssetListOptions, CreateAssetRequest, RequestAssetOption, RequestOption} from "../types/asset.types";
import {Asset} from "../db/types";

export async function createAsset(
    db: DB,
    asset: CreateAssetRequest
) : Promise<RequestOption> {
    const assetId: UUID = randomUUID() as UUID;

    if (asset.assetType === "confidential") {

        return await createConfidentialAsset(db, {
            assetId,
            fileName: asset.fileName,
            mimeType: asset.mimeType,
            bytes: asset.bytes,
            createdBy:asset.createdBy,
            description: asset.description,
        });
    } else {
        return await createPublicAsset(db, {
            assetId,
            fileName: asset.fileName,
            mimeType: asset.mimeType,
            bytes: asset.bytes,
            createdBy: asset.createdBy,
            description: asset.description,
            assetType: asset.assetType,
        });
    }
}

export async function getAsset(db: DB, assetId: UUID) : Promise<RequestAssetOption> {
    return getAssetBytes(db, assetId);
}

export async function listAssets(
    db: DB,
    opts: AssetListOptions = {},
): Promise<Asset[]> {
    return await repoListAsset(db, opts);
}

export async function updateAsset(
    db: DB,
    assetId: UUID,
    patch: { description?: string | null; fileName?: string | null },
) {
    return updateAssetMeta(db, assetId, patch);
}

export async function deleteAsset(db: DB, assetId: UUID) : Promise<RequestOption> {
    return softDeleteAsset(db, assetId);
}
