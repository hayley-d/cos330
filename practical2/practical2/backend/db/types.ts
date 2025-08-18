import type {
  Email,
  IPAddr,
  OtpPurpose,
  Permissions,
  UnixTime,
  UUID,
} from "../types";

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
  mfa_totp_secret: string;
  mfa_enrolled_at: UnixTime | null;
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
  description: string;
  asset_type: string;
  mime_type: string;
  file_name: string;

  content: Buffer | null;

  payload_ciphertext: Buffer | null;
  payload_nonce: Buffer | null;
  payload_tag: Buffer | null;
  key_id: string;

  created_at: UnixTime;
  updated_at: UnixTime | null;
  deleted_at: UnixTime | null;

  created_by: UUID;
  deleted_by: UUID | null;
  updated_by: UUID | null;
}

export type User = {
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

  roleId: UUID;

  mfaTotpSecret: string;
  mfaEnrolledAt: UnixTime | null;
};

export type UserMfaBackupCode = {
  userId: UUID;
  codeHash: string;
  usedAt: UnixTime | null;
};

export type UserOtpChallenge = {
  userId: UUID;
  purpose: OtpPurpose;
  codeHash: string;
  expiresAt: UnixTime;
  attemptCount: number;
  createdAt: UnixTime;
};

export type Asset = {
  assetId: UUID;
  description: string;
  assetType: string;
  file_name: string;

  mimeType: string;
  content: Buffer | null;

  payload_ciphertext: Buffer | null;
  payload_nonce: Buffer | null;
  payload_tag: Buffer | null;
  key_id: string;

  createdAt: UnixTime;
  updatedAt: UnixTime | null;
  deletedAt: UnixTime | null;

  createdBy: UUID;
  deletedBy: UUID | null;
  updatedBy: UUID | null;
};
