import {Router} from "express";
import type {APPLICATION_DB as DB} from "../db/db";

import type { Request } from "express";
import {authMiddleware} from "../middleware/auth.middleware";
import {HasAccessDto, hasAccessSchema} from "../schemas/roles.schema";
import {roleHasPermission} from "../repositories/role.repo";
import {getUserById} from "../repositories/user.repo";

const router = Router();


export default function rolesRoutes(db: DB) {
    router.post("/has_access", authMiddleware,  async (req: Request<{},{},HasAccessDto>, res) => {
        // @ts-ignore
        const { role_id } = req.user.role_id;
        // @ts-ignore
        const user = await getUserById(db, req.user.user_id);
        if (!user) {
            return res.status(404).json({error: "User not found."});
        }
        const parsed = hasAccessSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten });
        }

        const result = await roleHasPermission(db,user.role_id, parsed.data.permission);

        if (!result) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    });
    return router;
}
