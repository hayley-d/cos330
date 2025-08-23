import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";

import type { APPLICATION_DB as DB } from "../db/db";

interface AuthTokenPayload extends jwt.JwtPayload {
  user_id: string;
  user_email: string;
  role_id: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        user_id: string;
        user_email: string;
        role_id: string;
      };
    }
  }
}

export function makeRequestLogger(db: DB) {
  return function requestLogger(
      req: Request,
      res: Response,
      next: NextFunction,
  ) {
    const requestId: string = randomUUID();
    console.log(req.originalUrl)
    const endpoint: string = req.originalUrl.split("?")[0]?.slice(0, 50) ?? "";
    const originIp: string = req.ip || req.socket.remoteAddress || "unknown";

    // Default to anonymous user
    req.user = {
      user_id: "00000000-0000-4000-8000-000000000000",
      user_email: "anonymous@system.local",
      role_id: "anonymous",
    };

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!);
          if (typeof decoded === "object" && decoded) {
            const payload = decoded as AuthTokenPayload;
            req.user = {
              user_id: payload.user_id,
              user_email: payload.user_email,
              role_id: payload.role_id,
            };
          }
        } catch {
        }
      }
    }

    const userId = req.user?.user_id ?? "00000000-0000-4000-8000-000000000000";

    res.on("finish", () => {
      const success = res.statusCode >= 200 && res.statusCode < 400 ? 1 : 0;

      db.run(
          `INSERT INTO request_log (request_id, endpoint, origin_ip, user_id, success)
           VALUES (?, ?, ?, ?, ?)`,
          [requestId, endpoint, originIp, userId, success],
      );
    });

    console.log(
        `[REQUEST LOG]\t${requestId}\t${endpoint}\t${originIp}\t${userId}`,
    );
    next();
  };
}
