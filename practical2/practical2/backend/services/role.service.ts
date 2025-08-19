import { parsePermissions } from "./db.service";
import type { APPLICATION_DB as DB } from "../db/db";
import type { UUID } from "../types";
import {Role} from "../schemas/roles.schema";


export async function getRoleById(db: DB, role_id: UUID): Promise<Role | null> {
  const row = await db.get<Role>(`SELECT * FROM roles WHERE role_id = ?`, [
    role_id,
  ]);
  if (!row) {
    return null;
  }

  return row ? row : null;
}
