import type { APPLICATION_DB as DB } from "../db/db";
import type { Resource, UUID } from "../types";
import {randomUUID} from "crypto";
import {
    createConfidentialAsset,
    createPublicAsset,
    getAssetBytes,
    listAssets as repoListAsset, softDeleteAsset,
    updateAssetMeta,
    updateConfidentialAsset as updateConfidentialAssetRepo
} from "../repositories/asset.repo";

import {
    AssetListOptions,
    CreateAssetRequest, DeleteAssetProps,
    PatchAssetRequest, PatchConfAssetRequest,
    RequestAssetOption,
    RequestOption
} from "../types/asset.types";
import {Asset, User} from "../db/types";
import {DeleteConfidentialDto, UpdateConfidentialAsset} from "../schemas/asset.schema";
import {getUserById} from "../repositories/user.repo";
import {getRoleByName} from "../repositories/role.repo";

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
    patch: PatchAssetRequest,
): Promise<RequestOption> {
    return updateAssetMeta(db, patch);
}

export async function updateConfidentialAsset(
    db: DB,
    asset: UpdateConfidentialAsset
) : Promise<RequestOption> {
    const user: User | null = await getUserById(db, asset.updated_by as UUID)

    if (!user) {
        console.error("[DELETE ASSET]: Failed to find the user that requested the delete operation.")
        return { ok: false, error: "Failed to find user that requested delete operation." };
    }

    const admin_response = await getRoleByName(db, "Admin")
    const manager_response = await getRoleByName(db, "Manager")

    if (!admin_response.ok || !admin_response.role || !manager_response || !manager_response.role) {
        console.error("[DELETE ASSET: Failed to find role with the name Admin/Manager");
        return { ok: false, error: "Failed to find admin/manager role." };
    }

    if(user.roleId !== admin_response.role.role_id || user.roleId !== manager_response.role.role_id)
    {
        console.error("[DELETE ASSET]: User does not have permission to perform this operation.")
        return { ok: false, error: "User does not have permission to perform this operation." };
    }

    return updateConfidentialAssetRepo(db, asset);
}

export async function deleteAsset(db: DB, props: DeleteConfidentialDto) : Promise<RequestOption> {
    const user: User | null = await getUserById(db, props.deleted_by as UUID)

    if (!user) {
        console.error("[DELETE ASSET]: Failed to find the user that requested the delete operation.")
        return { ok: false, error: "Failed to find user that requested delete operation." };
    }

    const response = await getRoleByName(db, "Admin")

    if (!response.ok || !response.role) {
        console.error("[DELETE ASSET: Failed to find role with the name Admin");
        return { ok: false, error: "Failed to find admin role." };
    }

    if(user.roleId !== response.role.role_id)
    {
        console.error("[DELETE ASSET]: User does not have permission to perform this operation.")
        return { ok: false, error: "User does not have permission to perform this operation." };
    }

    return softDeleteAsset(db, props);
}
