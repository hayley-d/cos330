// roles.repo.ts
import type { DB } from "./db";
import type { RolesRow, Role, CreateRoleDTO, UUID } from "./types";
import { roleFromRow, serializePermissions } from "./types";

export async function getRoleById(db: DB, roleId: UUID): Promise<Role | null> {
  const row = await db.get<RolesRow>(`SELECT * FROM roles WHERE role_id = ?`, [
    roleId,
  ]);
  return row ? roleFromRow(row) : null;
}

export async function getRoleByName(
  db: DB,
  name: string,
): Promise<Role | null> {
  const row = await db.get<RolesRow>(
    `SELECT * FROM roles WHERE role_name = ?`,
    [name],
  );
  return row ? roleFromRow(row) : null;
}

export async function listRoles(db: DB): Promise<Role[]> {
  const rows = await db.all<RolesRow>(
    `SELECT * FROM roles ORDER BY role_name ASC`,
  );
  return rows.map(roleFromRow);
}

export async function createRole(db: DB, dto: CreateRoleDTO): Promise<void> {
  await db.run(
    `INSERT INTO roles (role_id, role_name, role_description, permissions)
     VALUES (?, ?, ?, ?)`,
    [
      dto.roleId,
      dto.name,
      dto.description ?? null,
      serializePermissions(dto.permissions),
    ],
  );
}

export async function updateRole(
  db: DB,
  roleId: UUID,
  patch: {
    name?: string;
    description?: string | null;
    permissions?: CreateRoleDTO["permissions"];
  },
): Promise<void> {
  const sets: string[] = [];
  const vals: any[] = [];
  const push = (c: string, v: any) => {
    sets.push(`${c} = ?`);
    vals.push(v);
  };

  if (patch.name !== undefined) push("role_name", patch.name);
  if (patch.description !== undefined)
    push("role_description", patch.description);
  if (patch.permissions !== undefined)
    push("permissions", serializePermissions(patch.permissions));

  if (sets.length === 0) return;
  vals.push(roleId);

  await db.run(`UPDATE roles SET ${sets.join(", ")} WHERE role_id = ?`, vals);
}

export async function deleteRole(db: DB, roleId: UUID): Promise<void> {
  await db.run(`DELETE FROM roles WHERE role_id = ?`, [roleId]);
}
