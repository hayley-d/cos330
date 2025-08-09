export type UUID = string;

export type Kind = "image" | "document" | "confidential";
export type Action = "create" | "read" | "write" | "delete" | "list";

export type UserRow  = {
    id: UUID;
    name: string;
    surname: string;
    email: string;
    password_hash: Buffer;
    password_salt: Buffer;
    is_approved: boolean;
    mfa_enabled: boolean;
    last_login: Date,
    created_at: Date
}

export type FileRow  = {
    id: UUID;
    kind: Kind;
    owner_user_id: number;
    original_name: string;
    stored_path: string;
    size: number;
    is_confidential: boolean;
    created_at: Date;
    updated_at: Date;
}

export type MFASecretRow = {
    secret_base32: string;
}

export type SessionRow  = {
    sid: UUID;
    user_id: UUID;
    csrf: string;
    expires_at: Date;
}
