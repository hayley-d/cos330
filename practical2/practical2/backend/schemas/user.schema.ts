import { z } from "zod";
import type { Email, IPAddr } from "../types";

export const CreateUserDTOSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export const ValidateMfaSchema = z.object({
  user_email: z.string().email(),
  token: z.string().nonempty(),
});

export const UserLoginSchema = z.object({
  user_email: z.string().email(),
  password: z.string().min(8),
});

export const ValidateOtpSchema = z.object({
  user_email: z.string().email(),
  current_ip: z.string().nonempty(),
  otp: z.string().nonempty(),
});

export const ApproveUserSchema = z.object({
  user_id: z.string().nonempty(),
});

export const UpdateUserRoleSchema = z.object({
  user_id: z.string().nonempty(),
  role_id: z.string().nonempty(),
});

export type CreateUserDTO = z.infer<typeof CreateUserDTOSchema>;
export type validateMfaDto = z.infer<typeof ValidateMfaSchema>;
export type UserLoginDto = z.infer<typeof UserLoginSchema>;
export type ApproveUserDto = z.infer<typeof ApproveUserSchema>;
