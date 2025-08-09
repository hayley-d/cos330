import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { db } from './db.js';
import { encConfidential, decConfidential } from './crypto.js';

const ROOT = path.resolve('data');
const DIRS = {
    image: path.join(ROOT, 'images'),
    document: path.join(ROOT, 'documents'),
    confidential: path.join(ROOT, 'confidential'),
};
for (const d of Object.values(DIRS)) fs.mkdirSync(d, { recursive: true });

export function saveBinary(kind, userId, originalName, bodyBuf) {
    const id : UUID = randomUUID();
    const stored = path.join(DIRS[kind], id);
    fs.writeFileSync(stored, bodyBuf);
    const now = Date.now();
    db.prepare(`INSERT INTO files(id,kind,owner_user_id,original_name,stored_path,size,is_confidential,created_at,updated_at)
              VALUES(?,?,?,?,?,?,?,?,?)`)
        .run(id, kind, userId, originalName, stored, bodyBuf.length, 0, now, now);
    return id;
}

export function readBinary(fileId) {
    const f = db.prepare(`SELECT * FROM files WHERE id=?`).get(fileId);
    if (!f || f.is_confidential) return null;
    const buf = fs.readFileSync(f.stored_path);
    return { meta:f, buf };
}

// confidential: store encrypted on disk
export function createConfidential(userId, name, contentBuf) {
    const id = randomUUID();
    const { salt, nonce, tag, ciphertext } = encConfidential(id, contentBuf);
    const stored = path.join(DIRS.confidential, id);
    fs.writeFileSync(stored, ciphertext);
    const now = Date.now();
    const tx = db.transaction(() => {
        db.prepare(`INSERT INTO files(id,kind,owner_user_id,original_name,stored_path,size,is_confidential,created_at,updated_at)
                VALUES(?,?,?,?,?,?,?,?,?)`)
            .run(id, 'confidential', userId, name, stored, ciphertext.length, 1, now, now);
        db.prepare(`INSERT INTO confidential_meta(file_id,hkdf_salt,nonce,auth_tag)
                VALUES(?,?,?,?)`).run(id, salt, nonce, tag);
    });
    tx();
    return id;
}

export function readConfidential(fileId) {
    const f = db.prepare(`SELECT * FROM files WHERE id=?`).get(fileId);
    if (!f || !f.is_confidential) return null;
    const meta = db.prepare(`SELECT hkdf_salt,nonce,auth_tag FROM confidential_meta WHERE file_id=?`).get(fileId);
    const ct = fs.readFileSync(f.stored_path);
    const pt = decConfidential(fileId, meta.hkdf_salt, meta.nonce, meta.auth_tag, ct);
    return { meta:f, buf:pt };
}

export function writeConfidential(fileId, newContentBuf) {
    const f = db.prepare(`SELECT * FROM files WHERE id=?`).get(fileId);
    if (!f || !f.is_confidential) return false;
    const { salt, nonce, tag, ciphertext } = encConfidential(fileId, newContentBuf);
    fs.writeFileSync(f.stored_path, ciphertext);
    const now = Date.now();
    const tx = db.transaction(() => {
        db.prepare(`UPDATE files SET size=?, updated_at=? WHERE id=?`).run(ciphertext.length, now, fileId);
        db.prepare(`UPDATE confidential_meta SET hkdf_salt=?, nonce=?, auth_tag=? WHERE file_id=?`)
            .run(salt, nonce, tag, fileId);
    });
    tx();
    return true;
}
