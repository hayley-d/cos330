import http, { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";
import { db, migrate } from "./db.js";
import { authorize } from "./rbac.js";
import { newSession, getSession, setCookieSid } from "./sessions.js";
import {
    saveBinary,
    readBinary,
    createConfidential,
    readConfidential,
    writeConfidential,
} from "./files.js";
import { hashPassword, verifyPassword, verifyTotp } from "./crypto.js";



/* ---------- Helpers ---------- */

function json(res: ServerResponse, code: number, data: unknown): void {
    res.writeHead(code, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
}

function getRole(userId: number): string {
    const row = db
        .prepare(
            `
    SELECT r.name AS role FROM roles r
    JOIN user_roles ur ON ur.role_id=r.id
    WHERE ur.user_id=?`
        )
        .get(userId) as { role?: string } | undefined;
    return row?.role ?? "Guest";
}

function parseBody(req: IncomingMessage): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on("data", (d) => chunks.push(d));
        req.on("end", () => resolve(Buffer.concat(chunks)));
        req.on("error", reject);
    });
}

function getCookie(req: IncomingMessage, name: string): string | null {
    const c = req.headers.cookie ?? "";
    for (const part of c.split(";")) {
        const [k, v] = part.trim().split("=");
        if (k === name) return v;
    }
    return null;
}

function header(req: IncomingMessage, key: string): string | undefined {
    const v = req.headers[key.toLowerCase()];
    if (Array.isArray(v)) return v[0];
    return v as string | undefined;
}

function notNull<T>(v: T | null): v is T {
    return v !== null;
}

/* ---------- Server ---------- */

migrate();

const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const host = req.headers.host ?? "localhost:8080";
    const url = new URL(req.url ?? "/", `http://${host}`);
    const ip = req.socket.remoteAddress || "";
    const ua = header(req, "user-agent") || "";

    // session lookup
    const sid = getCookie(req, "sid");
    const session: SessionRow | null = sid ? (getSession(sid, ip, ua) as SessionRow | null) : null;
    const userId: number | null = session?.user_id ?? null;
    const role = userId ? getRole(userId) : "Guest";

    // simple CORS for Vite dev if needed
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-CSRF, X-TOTP");
    if (req.method === "OPTIONS") return res.end();

    /* ---- AUTH (very abbreviated) ---- */
    if (req.method === "POST" && url.pathname === "/login") {
        const body = JSON.parse((await parseBody(req)).toString()) as {
            email: string;
            password: string;
        };

        const u = db
            .prepare(`SELECT * FROM users WHERE email=?`)
            .get(body.email) as UserRow | undefined;

        if (!u || !verifyPassword(body.password, u.password_salt, u.password_hash)) {
            return json(res, 401, { error: "invalid" });
        }
        if (!u.is_approved) return json(res, 403, { error: "not_approved" });

        // MFA challenge: expect client to call /verify with code
        return json(res, 200, { mfa_required: !!u.mfa_enabled });
    }

    if (req.method === "POST" && url.pathname === "/verify") {
        const body = JSON.parse((await parseBody(req)).toString()) as {
            email: string;
            code?: string;
        };

        const u = db
            .prepare(`SELECT * FROM users WHERE email=?`)
            .get(body.email) as UserRow | undefined;

        if (!u) return json(res, 401, { error: "invalid" });

        if (u.mfa_enabled) {
            const sec = db
                .prepare(`SELECT secret_base32 FROM mfa_secrets WHERE user_id=?`)
                .get(u.id) as MFASecretRow | undefined;
            if (!sec || !body.code || !verifyTotp(sec.secret_base32, body.code)) {
                return json(res, 401, { error: "bad_totp" });
            }
        }

        const { sid, csrf, expires } = newSession(u.id, ip, ua);
        setCookieSid(res, sid, expires);
        return json(res, 200, { ok: true, csrf });
    }

    /* ---- DOCUMENT/IMAGE UPLOAD ---- */
    if (req.method === "POST" && url.pathname === "/upload") {
        if (!userId) return json(res, 401, { error: "auth" });
        if ((header(req, "x-csrf") ?? "") !== session?.csrf) return json(res, 403, { error: "csrf" });

        const kind = url.searchParams.get("kind") as Kind | null; // 'image'|'document'
        const name = url.searchParams.get("name") ?? "file.bin";
        if (!kind || !["image", "document"].includes(kind)) {
            return json(res, 400, { error: "bad_kind" });
        }
        if (!authorize(role, kind, "create")) return json(res, 403, { error: "forbidden" });

        const buf = await parseBody(req);
        const id = saveBinary(kind, userId, name, buf);
        return json(res, 200, { id });
    }

    /* ---- DOCUMENT/IMAGE READ (stream back) ---- */
    if (req.method === "GET" && url.pathname === "/file") {
        const id = url.searchParams.get("id");
        if (!id) return json(res, 400, { error: "missing_id" });

        const rec = db
            .prepare(`SELECT * FROM files WHERE id=?`)
            .get(id) as FileRow | undefined;

        if (!rec || rec.is_confidential) return json(res, 404, { error: "not_found" });
        if (!authorize(role, rec.kind, "read")) return json(res, 403, { error: "forbidden" });

        const rb = readBinary(id);
        if (!rb) return json(res, 404, { error: "not_found" });

        res.writeHead(200, {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": `inline; filename="${rec.original_name}"`,
        });
        return res.end(rb.buf);
    }

    /* ---- CONFIDENTIAL READ (JSON) ---- */
    if (req.method === "GET" && url.pathname === "/confidential/read") {
        if (!userId) return json(res, 401, { error: "auth" });

        const id = url.searchParams.get("id");
        if (!id) return json(res, 400, { error: "missing_id" });

        const rec = db
            .prepare(`SELECT * FROM files WHERE id=?`)
            .get(id) as FileRow | undefined;

        if (!rec || !rec.is_confidential) return json(res, 404, { error: "not_found" });
        if (!authorize(role, "confidential", "read")) return json(res, 403, { error: "forbidden" });

        const r = readConfidential(id);
        if (!r) return json(res, 404, { error: "not_found" });

        return json(res, 200, {
            id,
            name: rec.original_name,
            content: r.buf.toString("utf8"),
        });
    }

    /* ---- CONFIDENTIAL WRITE (JSON + step-up MFA) ---- */
    if (req.method === "POST" && url.pathname === "/confidential/write") {
        if (!userId) return json(res, 401, { error: "auth" });
        if ((header(req, "x-csrf") ?? "") !== session?.csrf) return json(res, 403, { error: "csrf" });
        if (!authorize(role, "confidential", "write")) return json(res, 403, { error: "forbidden" });

        // bonus: step-up MFA
        const totp = header(req, "x-totp");
        const sec = db
            .prepare(`SELECT secret_base32 FROM mfa_secrets WHERE user_id=?`)
            .get(userId) as MFASecretRow | undefined;

        if (!sec || !totp) return json(res, 401, { error: "totp_required" });
        if (!verifyTotp(sec.secret_base32, String(totp))) return json(res, 401, { error: "bad_totp" });

        const body = JSON.parse((await parseBody(req)).toString()) as {
            id: string;
            content: string;
        };

        const ok = writeConfidential(body.id, Buffer.from(body.content, "utf8"));
        return json(res, ok ? 200 : 404, { ok });
    }

    /* ---- LISTING ---- */
    if (req.method === "GET" && url.pathname === "/files") {
        const kind = url.searchParams.get("kind") as Kind | null;
        if (!kind || !["image", "document", "confidential"].includes(kind)) {
            return json(res, 400, { error: "bad_kind" });
        }
        if (!authorize(role, kind, "list")) return json(res, 403, { error: "forbidden" });

        const rows = db
            .prepare(
                `SELECT id, original_name, size, created_at, updated_at
         FROM files WHERE kind=?`
            )
            .all(kind) as Array<{
            id: string;
            original_name: string;
            size: number;
            created_at: number;
            updated_at: number;
        }>;

        return json(res, 200, { items: rows });
    }

    json(res, 404, { error: "not_found" });
});

server.listen(8080, () => console.log("Server on :8080"));
