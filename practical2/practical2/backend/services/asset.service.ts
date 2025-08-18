import type { APPLICATION_DB as DB } from "../db/db";
import type { UUID } from "../types";
import {randomUUID} from "crypto";
import {
    createConfidentialAsset,
    createPublicAsset,
    getAssetBytes,
    softDeleteAsset,
    updateAssetMeta,
    updateConfidentialAsset as updateConfidentialAssetRepo
} from "../repositories/asset.repo";

import {
    PatchAssetRequest,
    RequestAssetOption,
    RequestOption
} from "../types/asset.types";
import { User } from "../db/types";
import {CreateAssetDto, DeleteAssetDto, UpdateConfidentialAsset} from "../schemas/asset.schema";
import { getUserById } from "../repositories/user.repo";
import { roleHasPermission } from "../repositories/role.repo";



export async function createAsset(
    db: DB,
    asset: CreateAssetDto
) : Promise<RequestOption> {
    const user: User | null = await getUserById(db, asset.created_by as UUID)

    if (!user) {
        return { ok: false, error: "Failed to find user that requested delete operation." };
    }

    const assetId: UUID = randomUUID() as UUID;

    if (asset.asset_type === "confidential") {
        const hasPermissions = await roleHasPermission(db, user.roleId, "create_conf")

        if (!hasPermissions) {
            return { ok: false, error: "Failed to create asset, the user does not have permission." };
        }

        return await createConfidentialAsset(db, assetId, asset);
    } else {
        const permission = asset.asset_type === "image" ? "create_image" : "create_doc";

        const hasPermissions = await roleHasPermission(db, user.roleId, permission)

        if (!hasPermissions) {
            return { ok: false, error: "Failed to create asset, the user does not have permission." };
        }

        return await createPublicAsset(db, assetId, asset);
    }
}

export async function getAsset(db: DB, assetId: UUID) : Promise<RequestAssetOption> {
    return getAssetBytes(db, assetId);
}

export async function updateAsset(
    db: DB,
    patch: PatchAssetRequest,
): Promise<RequestOption> {
    const user: User | null = await getUserById(db, patch.updatedBy as UUID)

    if (!user) {
        return { ok: false, error: "Failed to find user that requested delete operation." };
    }

    const permission = patch.assetType === "image" ? "update_image" : "update_doc";

    const hasPermissions = await roleHasPermission(db, user.roleId, permission)

    if (!hasPermissions) {
        return { ok: false, error: "Failed to update asset, the user does not have permission." };
    }

    return updateAssetMeta(db, patch);
}

export async function updateConfidentialAsset(
    db: DB,
    asset: UpdateConfidentialAsset
) : Promise<RequestOption> {
    const user: User | null = await getUserById(db, asset.updated_by as UUID)

    if (!user) {
        return { ok: false, error: "Failed to find user that requested delete operation." };
    }

    const hasPermissions = await roleHasPermission(db, user.roleId, "update_conf")

    if (!hasPermissions) {
        return { ok: false, error: "Failed to update asset, the user does not have permission." };
    }

    return updateConfidentialAssetRepo(db, asset);
}

/**
 * Checks if the user roles are correct then deletes the asset.
 * @param db
 * @param props
 */
export async function deleteAsset(db: DB, props: DeleteAssetDto) : Promise<RequestOption> {
    const user: User | null = await getUserById(db, props.deleted_by as UUID)
    const asset = await getAsset(db, props.asset_id as UUID)

    if(!asset) {
        return { ok: false, error: "Failed to find asset to delete." };
    }

    if (!user) {
        return { ok: false, error: "Failed to find user that requested delete operation." };
    }

    let permission = "";
    if (asset.asset && asset.asset.asset_type == "image") {
        permission = "delete_image";
    } else if (asset.asset && asset.asset.asset_type === "document") {
        permission = "delete_doc"
    }
    else {
        permission = "delete_conf"
    }

    const hasPermissions = await roleHasPermission(db, user.roleId, permission)

    if (!hasPermissions) {
        return { ok: false, error: "Failed to delete asset, the user does not have permission." };
    }

    return softDeleteAsset(db, props);
}
