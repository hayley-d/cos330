// assets.repo.ts
import type { DB } from "./db";
import type { AssetRow, Asset, UUID, Resource } from "./types";
import { assetFromRow } from "./types";
import crypto from "crypto";

function sha256Hex(buf: Buffer): string {
    return crypto.createHash("sha256").update(buf).digest("hex");
}

function hkdf32(masterKey: Buffer, keyId: string, assetId: string): Buffer {
    return crypto.hkdfSync("sha256", masterKey, Buffer.from(assetId, "utf8"),
        Buffer.from(`asset-data:${keyId}`, "utf8"), 32);
}

export async function getAsset(db: DB, assetId: UUID): Promise<Asset | null> {
    const row = await db.get<AssetRow>(`SELECT * FROM asset WHERE asset_id = ?`, [assetId]);
    return row ? assetFromRow(row) : null;
}

export async function listAssets(
    db: DB,
    opts: { type?: Resource; limit?: number; offset?: number } = {}
): Promise<Asset[]> {
    const { type, limit = 50, offset = 0 } = opts;
    const rows = await db.all<AssetRow>(
        `SELECT * FROM asset
       ${type ? "WHERE asset_type = ?" : ""}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
        type ? [type, limit, offset] : [limit, offset]
    );
    return rows.map(assetFromRow);
}

// Public/plain asset (stored in content BLOB)
export async function createPublicAsset(db: DB, p: {
    assetId: UUID;
    fileName?: string | null;
    mimeType: string;
    bytes: Buffer;
    createdBy: UUID;
    description?: string | null;
    assetType: Exclude<Resource, "confidential">; // "image" | "document"
}): Promise<void> {
    const sha = sha256Hex(p.bytes);
    await db.run(
        `INSERT INTO asset (
       asset_id, description, asset_type,
       file_name, mime_type, size_bytes, sha256,
       content, created_at, created_by
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), ?)`,
        [
            p.assetId, p.description ?? null, p.assetType,
            p.fileName ?? null, p.mimeType, p.bytes.length, sha,
            p.bytes, p.createdBy
        ]
    );
}

// Confidential asset (stored encrypted)
export async function createConfidentialAsset(db: DB, p: {
    assetId: UUID;
    fileName?: string | null;
    mimeType: string;
    bytes: Buffer;
    createdBy: UUID;
    description?: string | null;
    keyId?: string;          // default 'v1'
    masterKeyHex: string;    // 64 hex chars (32-byte key)
}): Promise<void> {
    const keyId = p.keyId ?? "v1";
    const masterKey = Buffer.from(p.masterKeyHex, "hex");
    const dataKey = hkdf32(masterKey, keyId, p.assetId);

    const nonce = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", dataKey, nonce);
    const aad = Buffer.from(`${p.assetId}|confidential|${p.mimeType}`, "utf8");
    cipher.setAAD(aad);
    const ciphertext = Buffer.concat([cipher.update(p.bytes), cipher.final()]);
    const tag = cipher.getAuthTag();

    const sha = sha256Hex(p.bytes);

    await db.run(
        `INSERT INTO asset (
       asset_id, description, asset_type,
       file_name, mime_type, size_bytes, sha256,
       payload_ciphertext, payload_nonce, payload_tag, key_id,
       created_at, created_by
     ) VALUES (?, ?, 'confidential', ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), ?)`,
        [
            p.assetId, p.description ?? null,
            p.fileName ?? null, p.mimeType, p.bytes.length, sha,
            ciphertext, nonce, tag, keyId,
            p.createdBy
        ]
    );
}

// Read bytes (auto-decrypt if confidential)
export async function getAssetBytes(
    db: DB,
    assetId: UUID,
    masterKeyHex?: string
): Promise<{ mimeType: string; bytes: Buffer } | null> {
    const row = await db.get<AssetRow>(
        `SELECT mime_type, asset_type, content,
            payload_ciphertext, payload_nonce, payload_tag, key_id
     FROM asset WHERE asset_id = ?`,
        [assetId]
    );
    if (!row) return null;

    if (row.asset_type !== "confidential") {
        return { mimeType: row.mime_type, bytes: row.content! };
    }

    if (!masterKeyHex) throw new Error("master key required");
    const masterKey = Buffer.from(masterKeyHex, "hex");
    const dataKey = hkdf32(masterKey, row.key_id!, assetId);
    const decipher = crypto.createDecipheriv("aes-256-gcm", dataKey, row.payload_nonce!);
    const aad = Buffer.from(`${assetId}|confidential|${row.mime_type}`, "utf8");
    decipher.setAAD(aad);
    decipher.setAuthTag(row.payload_tag!);
    const bytes = Buffer.concat([decipher.update(row.payload_ciphertext!), decipher.final()]);
    return { mimeType: row.mime_type, bytes };
}

export async function softDeleteAsset(db: DB, assetId: UUID): Promise<void> {
    await db.run(`UPDATE asset SET deleted_at = unixepoch() WHERE asset_id = ?`, [assetId]);
}

export async function updateAssetMeta(db: DB, assetId: UUID, patch: {
    description?: string | null;
    fileName?: string | null;
}): Promise<void> {
    const sets: string[] = [];
    const vals: any[] = [];
    const push = (c: string, v: any) => { sets.push(`${c} = ?`); vals.push(v); };

    if (patch.description !== undefined) push("description", patch.description);
    if (patch.fileName    !== undefined) push("file_name",  patch.fileName);

    if (sets.length === 0) return;
    vals.push(assetId);
    await db.run(`UPDATE asset SET ${sets.join(", ")}, updated_at = unixepoch() WHERE asset_id = ?`, vals);
}
