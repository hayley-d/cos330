import type { Request, Response, NextFunction } from "express";
import {UUID} from "node:crypto";
import {randomUUID} from "crypto";

import type { APPLICATION_DB as DB } from "../db/db";

export function makeRequestLogger(db: DB) {
    return function requestLogger(req: Request, res: Response, next: NextFunction) {
        const requestId: UUID = randomUUID();
        const endpoint: string = req.originalUrl.split("?")[0]?.slice(0, 50) ?? "";
        const originIp: string = req.ip || req.socket.remoteAddress || "unknown";

        const userId = (req as any).user?.user_id ?? "00000000-0000-4000-8000-000000000000";

        res.on("finish", () => {
            const success = res.statusCode >= 200 && res.statusCode < 400 ? 1 : 0;

            db.run(
                `INSERT INTO request_log (request_id, endpoint, origin_ip, user_id, success)
         VALUES (?, ?, ?, ?, ?)`, [requestId, endpoint, originIp, userId, success]);
        });

        console.log(`[REQUEST LOG]\t${requestId}\t${endpoint}\t${originIp}\t${userId}`);

        next();
    };
}
