import {Role} from "../schemas/roles.schema";

export type RoleOption = {
    ok: boolean;
    error?: string;
    role?: Role;
}