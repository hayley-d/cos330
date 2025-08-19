import type { Role, RolesRow, User, UsersRow } from "./db/types";

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
    mfaEnrolledAt: row.mfa_enrolled_at,
  };
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
