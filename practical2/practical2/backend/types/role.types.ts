import { Role } from "../schemas/roles.schema";

export type RoleOption = {
  ok: boolean;
  error?: string;
  role?: Role;
};

export type ListRoleOption = {
  ok: boolean;
  error?: string;
  roles?: Role[];
};
