import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { user_id: string; user_email: string; role_id: string };
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET required");
    throw new Error("JWT_SECRET environment variable not set");
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("Missing authHeader");
    return res
      .status(401)
      .json({ error: "Authorization header missing or invalid" });
  }

  const token: string | null = authHeader.split(" ")[1] ?? null;

  if (token === null) {
    console.error("Missing token");
    return res.status(401).json({ error: "Token is required" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!,
    ) as jwt.JwtPayload & {
      user_id: string;
      user_email: string;
      role_id: string;
    };
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Invalid token");
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
