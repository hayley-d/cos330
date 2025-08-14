import type {Permission, Resource, Permissions, UnixTime} from "../types";

const RESOURCES = new Set<Resource>(["image", "document", "confidential"]);

const IMAGE_PERMISSIONS = new Set<Permission>(["create_image", "view_image", "update_image", "delete_image"] as const);

const DOCUMENT_PERMISSIONS = new Set<Permission>(["create_doc", "view_doc", "update_doc", "delete_doc"] as const);

const CONFIDENTIAL_PERMISSIONS = new Set<Permission>(["create_conf", "view_conf", "update_conf", "delete_conf"] as const);

function isPlainObject(x: unknown): x is Record<string, unknown> {
    return typeof x === "object" && x !== null && !Array.isArray(x);
}

function allowedSetFor(resource: Resource): Set<Permission> {
    switch (resource) {
        case "image": return IMAGE_PERMISSIONS;
        case "document": return DOCUMENT_PERMISSIONS;
        case "confidential": return CONFIDENTIAL_PERMISSIONS;
    }
}

/**
 * Parses db string into JSON Permissions object.
 * @param json
 */
export function parsePermissions(json: string): Permissions {
    let obj: unknown;
    try {
        obj = JSON.parse(json);
    } catch (e) {
        throw new Error(`Invalid JSON: ${(e as Error).message}`);
    }

    if (!isPlainObject(obj)) {
        throw new Error("Permissions must be a JSON object");
    }

    const result: Permissions = {};

    for (const key of Object.keys(obj)) {
        if (!RESOURCES.has(key as Resource)) {
            throw new Error(`Unknown resource key: ${key}`);
        }
        const arr = (obj as Record<string, unknown>)[key];
        if (!Array.isArray(arr)) {
            throw new Error(`permissions.${key} must be an array`);
        }

        const allowed = allowedSetFor(key as Resource);
        const clean: Permission[] = [];
        for (const v of arr) {
            if (typeof v !== "string") {
                throw new Error(`permissions.${key} must contain only strings`);
            }
            if (!allowed.has(v as Permission)) {
                throw new Error(`permissions.${key} contains invalid permission: ${v}`);
            }
            clean.push(v as Permission);
        }

        if (clean.length > 0) {
            (result as any)[key] = clean;
        }
    }

    return result;
}

export function serializePermissions(permissions: Permissions): string {
    const out: Record<string, string[]> = {};
    const keys = Object.keys(permissions).sort();
    for (const k of keys) {
        const arr = (permissions as Record<string, string[]>)[k] ?? [];
        out[k] = [...arr].sort();
    }
    return JSON.stringify(out);
}

export const toDate = (t: UnixTime | null): Date | null =>
    t == null ? null : new Date(t * 1000);

export const fromDate = (d: Date | null): UnixTime | null =>
    d == null ? null : (Math.floor(d.getTime() / 1000) as UnixTime);
