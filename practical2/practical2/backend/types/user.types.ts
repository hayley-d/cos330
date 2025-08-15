import type { Email, IPAddr, UnixTime, UUID } from "../types";
import type { User } from "../db/types";

export interface CreateUserDTO {
  first_name: string;
  last_name: string;
  email: Email;
  password: string;
}

export type UpdateUserSignInDto = {
  user_id: UUID;
  current_ip: IPAddr;
};

export type UpdateFailedUserSignInDto = {
  user_id: UUID;
};

export type ApproveUserDto = {
  user_id: UUID;
};

export type UpdateUserRoleDto = {
  user_id: UUID;
  role_id: UUID;
};

export type ValidateEmailOption = {
  ok: boolean;
  email?: string;
  error?: string;
};

export type ValidatePasswordOption = {
  ok: boolean;
  errors?: string[];
};

export type OtpSecret = {
  secret: string;
  url: string;
};

export type RequestOption = {
  ok: boolean;
  error?: string;
};

export type RequestUserOption = {
  ok: boolean;
  user?: User;
  error?: string;
};

export type UserLoginDto = {
  user_email: Email;
  password: string;
};

export type ValidateOtpDto = {
  user_email: Email;
  current_ip: IPAddr;
  otp: string;
};

export type ValidateMfaDto = {
  user_email: Email;
  token: string;
};

export type MfaResponse = {
  ok: boolean;
  user_email?: Email;
  url?: string;
  error?: string;
};
