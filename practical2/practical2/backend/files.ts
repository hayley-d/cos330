import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import type { UUID } from "node:crypto";

import { encConfidential, decConfidential } from "./crypto.js";
import { my_database } from "./db/db";
import type { Kind, FileRow } from "./types";

const ROOT = path.resolve("data");

const DIRS = {
  image: path.join(ROOT, "images"),
  document: path.join(ROOT, "documents"),
  confidential: path.join(ROOT, "confidential"),
};

for (const d of Object.values(DIRS)) fs.mkdirSync(d, { recursive: true });

export function saveBinary(
  kind: Kind,
  userId: UUID,
  originalName: string,
  bodyBuf: Buffer,
): UUID {
  const id: UUID = randomUUID();
  const stored = path.join(DIRS[kind], id);

  fs.writeFileSync(stored, bodyBuf);

  const now = Date.now();

  my_database
    .prepare(
      `INSERT INTO files(id,kind,owner_user_id,original_name,stored_path,size,is_confidential,created_at,updated_at)
              VALUES(?,?,?,?,?,?,?,?,?)`,
    )
    .run(id, kind, userId, originalName, stored, bodyBuf.length, 0, now, now);

  return id;
}

export function readBinary(
  fileId: UUID,
): { metadata: FileRow; buffer: Buffer } | null {
  const file: FileRow = my_database
    .prepare(`SELECT * FROM files WHERE id=?`)
    .get(fileId);

  if (!file || file.is_confidential) return null;

  const buf = fs.readFileSync(file.stored_path);

  return { metadata: file, buffer: buf };
}

export function createConfidential(
  userId: UUID,
  name: string,
  contentBuf: Buffer,
): UUID {
  const id: UUID = randomUUID();

  const { salt, nonce, tag, ciphertext } = encConfidential(id, contentBuf);

  const stored: string = path.join(DIRS.confidential, id);

  fs.writeFileSync(stored, ciphertext);

  const now: Date = new Date();

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO files(id,kind,owner_user_id,original_name,stored_path,size,is_confidential,created_at,updated_at)
                VALUES(?,?,?,?,?,?,?,?,?)`,
    ).run(
      id,
      "confidential",
      userId,
      name,
      stored,
      ciphertext.length,
      1,
      now,
      now,
    );

    db.prepare(
      `INSERT INTO confidential_meta(file_id,hkdf_salt,nonce,auth_tag)
                VALUES(?,?,?,?)`,
    ).run(id, salt, nonce, tag);
  });

  tx();
  return id;
}

export function readConfidential(
  fileId: UUID,
): { metadata: FileRow; buffer: Buffer } | null {
  const file: FileRow = db
    .prepare(`SELECT * FROM files WHERE id=?`)
    .get(fileId);

  if (!file || !file.is_confidential) return null;

  const metadata = db
    .prepare(
      `SELECT hkdf_salt,nonce,auth_tag FROM confidential_meta WHERE file_id=?`,
    )
    .get(fileId);

  const ct: Buffer = fs.readFileSync(f.stored_path);
  const pt = decConfidential(
    fileId,
    metadata.hkdf_salt,
    metadata.nonce,
    metadata.auth_tag,
    ct,
  );

  return { metadata: file, buffer: pt };
}

export function writeConfidential(fileId: UUID, newContentBuf: Buffer) {
  const file = db.prepare(`SELECT * FROM files WHERE id=?`).get(fileId);

  if (!file || !file.is_confidential) return false;

  const { salt, nonce, tag, ciphertext } = encConfidential(
    fileId,
    newContentBuf,
  );

  fs.writeFileSync(file.stored_path, ciphertext);

  const now = Date.now();

  const tx = db.transaction(() => {
    db.prepare(`UPDATE files SET size=?, updated_at=? WHERE id=?`).run(
      ciphertext.length,
      now,
      fileId,
    );
    db.prepare(
      `UPDATE confidential_meta SET hkdf_salt=?, nonce=?, auth_tag=? WHERE file_id=?`,
    ).run(salt, nonce, tag, fileId);
  });

  tx();
  return true;
}
