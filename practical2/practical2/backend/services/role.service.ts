import type { Role, RolesRow } from "../db/types";
import { parsePermissions } from "./db.service";
import type { DB } from "../db/db";
import type { UUID } from "../types";

export function roleFromRow(row: RolesRow): Role {
  return {
    roleId: row.role_id,
    name: row.role_name,
    description: row.role_description,
    permissions: parsePermissions(row.permissions),
  };
}

export async function getRoleById(db: DB, role_id: UUID): Promise<Role | null> {
  const row = await db.get<RolesRow>(`SELECT * FROM roles WHERE role_id = ?`, [
    role_id,
  ]);
  if (!row) {
    return null;
  }

  return row ? roleFromRow(row) : null;
}
