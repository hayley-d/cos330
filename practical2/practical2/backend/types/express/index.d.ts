import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      user_id: string;
      user_email: string;
      role_id: string;
    };
  }
}
