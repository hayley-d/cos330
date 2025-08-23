import type { APPLICATION_DB as DB } from "../db/db";
import { ListRoleOption, RoleOption } from "../types/role.types";
import { Role, roleSchema } from "../schemas/roles.schema";
import { UUID } from "../types";

export async function getRoleById(db: DB, roleId: UUID): Promise<RoleOption> {
  const row: Role | undefined = await db.get<Role>(
    `SELECT * FROM roles WHERE role_id = ?`,
    [roleId],
  );

  if (!row) {
    console.error("[ROLE REPO]: Failed to find a role with id %s", roleId);
    return { ok: false, error: "Failed to find a role with id " };
  }

  const parsed = roleSchema.parse(row);

  return { ok: true, role: parsed };
}

export async function getRoleByName(
  db: DB,
  role_name: string,
): Promise<RoleOption> {
  const row: Role | undefined = await db.get<Role>(
    `SELECT * FROM roles WHERE role_name = ?`,
    [role_name],
  );

  if (!row) {
    console.error("No role found for role name", role_name);
    return { ok: false, error: "Failed to find role" };
  }

  const parsed = roleSchema.parse(row);

  return { ok: true, role: parsed };
}

export async function listRoles(db: DB): Promise<ListRoleOption> {
  const rows: Role[] | undefined = await db.all<Role>(
    `SELECT * FROM roles ORDER BY role_name ASC`,
  );

  if (!rows || rows.length < 1) {
    console.error("[ROLE REPO]: Failed to list roles.");
    return { ok: false, error: "Failed to list roles." };
  }

  return {
    ok: true,
    roles: rows,
  };
}

export async function roleHasPermission(
  db: DB,
  roleId: string,
  permission: string,
): Promise<boolean> {
  const row: Role | undefined = await db.get<Role>(
    "SELECT * FROM roles WHERE role_id = ?",
    [roleId.toString()],
  );

  if (!row) {
    return false;
  }

  try {
    const parsed = roleSchema.parse(row);

    const permissions = parsed.permissions as Record<string, string[]>;

    return Object.values(permissions).some((permArray) =>
      permArray.includes(permission),
    );
  } catch (err) {
    if (typeof err === "object") {
      const error = err as Error;
      console.error(`[ROLE REPO]: ${error.message}`);
    }
    return false;
  }
}
