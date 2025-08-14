export type UUID = string & { readonly __brand: "uuid-v4" };
export type Email = string & { readonly __brand: "email" };
export type IPAddr = string & { readonly __brand: "ip" };
export type UnixTime = number & { readonly __brand: "unix-seconds" };

export type Resource = "image" | "document" | "confidential";

export type ImagePermission =
    | "create_image"
    | "view_image"
    | "update_image"
    | "delete_image";

export type DocumentPermission =
    | "create_doc"
    | "view_doc"
    | "update_doc"
    | "delete_doc";

export type ConfidentialPermission =
    | "create_conf"
    | "view_conf"
    | "update_conf"
    | "delete_conf";

export type Permission =
    | ImagePermission
    | DocumentPermission
    | ConfidentialPermission;

export type Permissions = {
    image?: ImagePermission[];
    document?: DocumentPermission[];
    confidential?: ConfidentialPermission[];
};

export type OtpPurpose = "login" | "2fa" | "email_change";

export interface RolesRow {
    role_id: UUID;
    role_name: string;
    role_description: string | null;
    permissions: string; // JSON string (validated with json_valid in DB)
}

/** users table
 * NOTE: Your latest DDL *in this message* doesn’t include mfa_enabled,
 * but your inserts do. If you add the column, keep both here.
 */
export interface UsersRow {
    user_id: UUID;
    first_name: string;
    last_name: string;
    email: Email;
    password_hash: string;
    created_at: UnixTime;
    last_login: UnixTime | null;

    is_approved: number; // 0/1
    sign_in_count: number;
    failed_login_attempts: number;

    current_sign_in_ip: IPAddr | null;
    last_sign_in_ip: IPAddr | null;

    role_id: UUID;
    mfa_totp_secret: string | null;
}

export interface UserMfaBackupCodesRow {
    user_id: UUID;
    code_hash: string;
    used_at: UnixTime | null;
}

export interface UserOtpChallengesRow {
    user_id: UUID;
    purpose: string;
    code_hash: string;
    expires_at: UnixTime;
    attempt_count: number;
    created_at: UnixTime;
}

export interface AssetRow {
    asset_id: UUID;
    description: string | null;
    asset_type: string;

    created_at: UnixTime;
    updated_at: UnixTime | null;
    deleted_at: UnixTime | null;

    created_by: UUID;
    deleted_by: UUID | null;
    updated_by: UUID | null;
}

export interface Role {
    roleId: UUID;
    name: string;
    description: string | null;
    permissions: Permissions;
}

export interface User {
    userId: UUID;
    firstName: string;
    lastName: string;
    email: Email;
    passwordHash: string;

    createdAt: UnixTime;
    lastLogin: UnixTime | null;

    isApproved: boolean;
    signInCount: number;
    failedLoginAttempts: number;

    currentSignInIp: IPAddr | null;
    lastSignInIp: IPAddr | null;

    roleId: UUID | null;

    mfaEnabled: boolean;
    mfaTotpSecret: string | null;
}

export interface UserMfaBackupCode {
    userId: UUID;
    codeHash: string;
    usedAt: UnixTime | null;
}

export interface UserOtpChallenge {
    userId: UUID;
    purpose: OtpPurpose;
    codeHash: string;
    expiresAt: UnixTime;
    attemptCount: number;
    createdAt: UnixTime;
}

export interface Asset {
    assetId: UUID;
    description: string | null;
    assetType: string;

    createdAt: UnixTime;
    updatedAt: UnixTime | null;
    deletedAt: UnixTime | null;

    createdBy: UUID;
    deletedBy: UUID | null;
    updatedBy: UUID | null;
}

export function parsePermissions(json: string): Permissions {
    try {
        const obj = JSON.parse(json);

        for (const key of Object.keys(obj)) {
            const arr = obj[key];
            if (!Array.isArray(arr) || !arr.every((x: unknown) => typeof x === "string")) {
                throw new Error(`permissions.${key} must be string[]`);
            }
        }
        return obj as Permissions;
    } catch (e) {
        throw new Error(`Invalid permissions JSON: ${(e as Error).message}`);
    }
}

export function serializePermissions(p: Permissions): string {
    return JSON.stringify(p);
}

export function userFromRow(row: UsersRow): User {
    return {
        userId: row.user_id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        passwordHash: row.password_hash,
        createdAt: row.created_at,
        lastLogin: row.last_login,
        isApproved: row.is_approved === 1,
        signInCount: row.sign_in_count,
        failedLoginAttempts: row.failed_login_attempts,
        currentSignInIp: row.current_sign_in_ip,
        lastSignInIp: row.last_sign_in_ip,
        roleId: row.role_id,
        mfaTotpSecret: row.mfa_totp_secret,
    };
}

/** Convert a RolesRow from DB into a domain Role (parses JSON) */
export function roleFromRow(row: RolesRow): Role {
    return {
        roleId: row.role_id,
        name: row.role_name,
        description: row.role_description,
        permissions: parsePermissions(row.permissions),
    };
}

/** If you prefer JS Date objects in your app, helpers below: */
export const toDate = (t: UnixTime | null): Date | null =>
    t == null ? null : new Date(t * 1000);

export const fromDate = (d: Date | null): UnixTime | null =>
    d == null ? null : (Math.floor(d.getTime() / 1000) as UnixTime);

export interface CreateUserDTO {
    userId: UUID;
    firstName: string;
    lastName: string;
    email: Email;
    passwordHash: string;
    roleId: UUID;
    isApproved?: boolean;
    mfaTotpSecret?: string;
}

export interface UpdateUserDTO {
    firstName?: string;
    lastName?: string;
    email?: Email;
    passwordHash?: string;
    roleId?: UUID;
    isApproved?: boolean;
    mfaTotpSecret?: string | null;
    currentSignInIp?: IPAddr | null;
    lastSignInIp?: IPAddr | null;
    lastLogin?: UnixTime | null;
}

export interface CreateRoleDTO {
    roleId: UUID;
    name: string;
    description?: string | null;
    permissions: Permissions;
}

export interface CreateOtpChallengeDTO {
    userId: UUID;
    purpose: OtpPurpose;
    codeHash: string;
    expiresAt: UnixTime;
}

export interface CreateBackupCodeDTO {
    userId: UUID;
    codeHash: string;
}