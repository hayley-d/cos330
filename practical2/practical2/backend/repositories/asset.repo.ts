import type { APPLICATION_DB as DB } from "../db/db";
import crypto from "crypto";
import {Resource, UUID} from "../types";
import {Asset, AssetRow} from "../db/types";
import {
    assetFromRow,
    AssetListOptions,
    CreateAssetProps,
    CreateConfidentialAssetProps, DeleteAssetProps,
    GetAssetOption, PatchAssetRequest, PatchConfAssetRequest,
    RequestAssetOption,
    RequestOption
} from "../types/asset.types";

const MASTER_KEY_HEX = process.env.MASTER_KEY;
if (!MASTER_KEY_HEX) {
    throw new Error("MASTER_KEY not set in .env");
}
export const MASTER_KEY = Buffer.from(MASTER_KEY_HEX, "hex");

/**
 * Utility function to compute the SHA-256 hash of a file/asset.
 * @param buf
 */
function sha256Hex(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

/**
 * HMAC-based Key Derivation Function.
 * It takes the master key, key id/version, and asset id to derive a unique 256-bit key per asset.
 * @param masterKey
 * @param keyId
 * @param assetId
 */
function hkdf32(masterKey: Buffer, keyId: string, assetId: string): Buffer {
    const arr = crypto.hkdfSync(
        "sha256",
        masterKey,
        Buffer.from(assetId, "utf8"),
        Buffer.from(`asset-data:${keyId}`, "utf8"),
        32,
    );
    return Buffer.from(arr);
}

export async function getAsset(db: DB, assetId: UUID): Promise<RequestAssetOption> {
  const row : AssetRow | undefined = await db.get<AssetRow>(`SELECT * FROM asset WHERE asset_id = ?`, [
    assetId,
  ]);

  if (!row) {
      return { ok: false, error: "Failed to find asset" }
  }

  const asset : Asset | undefined = assetFromRow(row);

  return asset ? { ok : true, asset: asset } : { ok: false, error: "Error fetching asset from the database" };
}

export async function listAssets(
  db: DB,
  opts: AssetListOptions = {},
): Promise<Asset[]> {
  const { type, limit = 10, offset = 0 } = opts;

  const rows = await db.all<AssetRow>(
    `SELECT * FROM asset
       ${type ? "WHERE asset_type = ?" : ""}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
    type ? [type, limit, offset] : [limit, offset],
  );

  return rows.map(row => assetFromRow(row));
}

/**
 * Created a public asset type being either a document or image.
 * @param db
 * @param asset
 */
export async function createPublicAsset(
  db: DB,
  asset: CreateAssetProps,
): Promise<RequestOption> {
  const sha = sha256Hex(asset.bytes);
  const result = await db.run(
    `INSERT INTO asset (
       asset_id, description, asset_type,
       file_name, mime_type, size_bytes, sha256,
       content, created_at, created_by
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), ?)`,
    [
      asset.assetId,
      asset.description,
      asset.assetType,
      asset.fileName,
      asset.mimeType,
      asset.bytes.length,
      sha,
      asset.bytes,
      asset.createdBy,
    ],
  );

  if (!result || result.changes === 0) {
      return { ok: false, error: "Failed to create public asset" };
  }

  return { ok: true };
}

/**
 * Adds a confidential asset to the database.
 * @param db
 * @param asset
 */
export async function createConfidentialAsset(
  db: DB,
  asset: CreateConfidentialAssetProps,
): Promise<RequestOption> {
  const keyId = asset.keyId ?? "v1";
  const dataKey = hkdf32(MASTER_KEY, keyId, asset.assetId);

  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", dataKey, nonce);
  const aad = Buffer.from(`${asset.assetId}|confidential|${asset.mimeType}`, "utf8");
  cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(asset.bytes), cipher.final()]);
  const tag = cipher.getAuthTag();

  const sha = sha256Hex(asset.bytes);

  const response = await db.run(
    `INSERT INTO asset (
       asset_id, description, asset_type,
       file_name, mime_type, size_bytes, sha256,
       payload_ciphertext, payload_nonce, payload_tag, key_id,
       created_at, created_by
     ) VALUES (?, ?, 'confidential', ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), ?)`,
    [
      asset.assetId,
      asset.description ?? null,
      asset.fileName ?? null,
      asset.mimeType,
      asset.bytes.length,
      sha,
      ciphertext,
      nonce,
      tag,
      keyId,
      asset.createdBy,
    ],
  );

   if(!response || response.changes === 0) {
       return { ok: false, error: "Failed to create confidential asset" };
   }

   return { ok: true };
}

/**
 * Fetches an asset from the database and decrypts it if of confidential type.
 * @param db
 * @param assetId
 */
export async function getAssetBytes(
  db: DB,
  assetId: UUID,
): Promise<GetAssetOption> {
  const row = await db.get<AssetRow>(
    `SELECT mime_type, asset_type, content,
            payload_ciphertext, payload_nonce, payload_tag, key_id
     FROM asset WHERE asset_id = ? AND deleted_at IS NULL`,
    [assetId],
  );

  if (!row) {
      return { ok: false, error: "Unable to find asset in the database"}
  }

  if (row.asset_type !== "confidential") {
      if (row.content) {
          return { ok:true, mimeType: row.mime_type, bytes: row.content! }
      } else{
          return { ok:false, error: "Asset content not found" }
      }
  }

  const dataKey = hkdf32(MASTER_KEY, row.key_id!, assetId);

  if (!row.payload_nonce) {
      return { ok:false, error: "Asset is missing decrypt metadata" }
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    dataKey,
    row.payload_nonce,
  );

  const aad = Buffer.from(`${assetId}|confidential|${row.mime_type}`, "utf8");

  decipher.setAAD(aad);

  if (!row.payload_tag) {
      return { ok:false, error: "Asset is missing decrypt metadata" }
  }

  decipher.setAuthTag(row.payload_tag);

  const bytes = Buffer.concat([
    decipher.update(row.payload_ciphertext!),
    decipher.final(),
  ]);

  return { ok: true, mimeType: row.mime_type, bytes };
}

/**
 * Soft deletes an asset from the database.
 * @param db
 * @param assetId
 */
export async function softDeleteAsset(db: DB, props: DeleteAssetProps): Promise<RequestOption> {
  const result = await db.run(`UPDATE asset SET deleted_by = ?, deleted_at = unixepoch() WHERE asset_id = ? AND deleted_at IS NULL`, [
    props.deletedBy,
    props.assetId,
  ]);

  if (!result) {
      return { ok: false, error: "Unable to find asset in the database" };
  }

  if (result.changes === 0) {
      return { ok: false, error: "Asset already deleted."}
  }

  return { ok: true };
}

/**
 * Updates an image or document asset.
 * @param db
 * @param patch
 */
export async function updateAssetMeta(
  db: DB,
  patch: PatchAssetRequest,
): Promise<RequestOption> {
  const sets: string[] = [];
  const vals: any[] = [];
  const push = (c: string, v: any) => {
    sets.push(`${c} = ?`);
    vals.push(v);
  };

  if (patch.description !== undefined) push("description", patch.description);
  if (patch.fileName !== undefined) push("file_name", patch.fileName);
  if (patch.content !== undefined) {
      const sha = sha256Hex(patch.content);
      push("content", patch.content);
      push("size_bytes",patch.content.length)
      push("sha256", sha)
  }
  push("mime_type", patch.mimeType);
  push("updated_by", patch.updatedBy);

  if (sets.length === 0) {
      return { ok: false, error: "Unable to update asset. No values provided to update." };
  }

  vals.push(patch.assetId);
  const result = await db.run(
    `UPDATE asset SET ${sets.join(", ")}, updated_at = unixepoch() WHERE asset_id = ?`,
    vals,
  );
  if (!result || result.changes === 0) {
      return { ok: false, error: "Unable to update asset." };
  }

  return { ok: true };
}

/**
 * Updates a confidential resource.
 * @param db
 * @param asset
 */
export async function updateConfidentialAsset(
    db: DB,
    asset: PatchConfAssetRequest
): Promise<RequestOption> {
    const sets: string[] = [];
    const vals: string[] = [];

    const push = (c: string, v: any) => {
        sets.push(`${c} = ?`);
        vals.push(v);
    };

    push("updated_by", asset.updatedBy);

    if (asset.description) {
        push("description", asset.description);
    }

    if (asset.fileName) {
        push("file_name", asset.fileName);
    }

    if (asset.content) {
        const keyId = "v1";
        const dataKey = hkdf32(MASTER_KEY, keyId, asset.assetId);
        const nonce = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv("aes-256-gcm", dataKey, nonce);
        const aad = Buffer.from(`${asset.assetId}|confidential|txt`, "utf8");
        cipher.setAAD(aad);
        const ciphertext = Buffer.concat([cipher.update(asset.content), cipher.final()]);
        const tag = cipher.getAuthTag();
        push("payload_ciphertext", ciphertext);
        push("payload_nonce", nonce);
        push("payload_tag", tag);
        push("key_id", keyId);
    }

    if (sets.length === 0) {
        return { ok: false, error: "Nothing to update." }
    }

    vals.push(asset.assetId);

    const result = await db.run(
        `UPDATE asset SET ${sets.join(", ")}, updated_at = unixepoch() WHERE asset_id = ?`,
        vals,
    );

    if (!result || result.changes === 0) {
        return { ok: false, error: "Failed to update asset." }
    }

    return { ok: true }
}
