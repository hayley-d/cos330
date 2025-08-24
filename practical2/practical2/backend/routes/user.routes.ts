import jwt from "jsonwebtoken";
import { Router } from "express";
import type { Request } from "express";

import { authMiddleware } from "../middleware/auth.middleware";
import type { APPLICATION_DB as DB } from "../db/db";
import {
  createUser,
  login,
  validateUserOtp,
  approveUser,
  validateMfa,
  getUserList,
} from "../repositories/user.repo";
import type {
  MfaResponse,
  CreateUserDTO,
  RequestUserOption,
  ValidateOtpDto,
  ApproveUserDto,
  UpdateUserRoleDto,
} from "../types/user.types";
import {
  ApproveUserSchema,
  CreateUserDTOSchema,
  UpdateUserRoleSchema,
  UserLoginDto,
  UserLoginSchema,
  validateMfaDto,
  ValidateMfaSchema,
  ValidateOtpSchema,
} from "../schemas/user.schema";

const router = Router();

export default function userRoutes(db: DB) {
  router.get("/list", async (req, res) => {
    const list = await getUserList(db);

    if (!list || !list.ok) {
      return res.status(404).send("Not Found");
    }

    return res.status(200).json(list.items);
  });

  router.post("/register", async (req: Request<{}, {}, CreateUserDTO>, res) => {
    try {
      const parsed = CreateUserDTOSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ error: "Invlid payload" });
      }

      const result: MfaResponse = await createUser(db, req.body);

      if (!result.ok) {
        console.error("Failed to create new user");
        return res.status(400).json({ error: "Failed to create user" });
      }

      console.log("USER EMAIL", result.user_email);

      return res
        .status(201)
        .json({ user_email: result.user_email, url: result.url });
    } catch (err) {
      console.error("Some other issue");
      return res
        .status(500)
        .json({ ok: false, error: "Internal server error" });
    }
  });

  router.post(
    "/two_factor",
    async (req: Request<{}, {}, validateMfaDto>, res) => {
      try {
        const parsed = ValidateMfaSchema.safeParse(req.body);

        if (!parsed.success) {
          console.error("Failed to verity payload");
          console.error(parsed.error.flatten);
          return res.status(400).json({ error: parsed.error.flatten });
        }

        const result = await validateMfa(db, parsed.data);

        if (!result.ok) {
          console.error("Failed to verity MFA");
          return res.status(400).json({ error: result.error });
        }

        const token = jwt.sign(
          {
            user_id: result.user?.user_id,
            user_email: result.user?.email,
            role_id: result.user?.role_id,
          },
          process.env.JWT_SECRET!,
          { expiresIn: "1h" },
        );

        return res.status(200).json({
          ok: true,
          token,
        });
      } catch (err) {
        return res
          .status(500)
          .json({ ok: false, error: "Internal server error" });
      }
    },
  );

  router.post("/login", async (req: Request<{}, {}, UserLoginDto>, res) => {
    console.log("[REQ BODY]: ", req.body);
    const parsed = UserLoginSchema.safeParse(req.body);

    if (!parsed.success) {
      console.error("[LOGIN]: Failed to parse payload");
      return res.status(400).json({ error: parsed.error.flatten });
    }

    const result: RequestUserOption = await login(db, parsed.data);

    if (!result.ok) {
      console.error("[LOGIN]: Failed to login user.");
      return res.status(400).json(result);
    }

    return res.status(201).json({
      mfa_required: true,
      user_id: result.user?.user_id,
      user_email: result.user?.email,
    });
  });

  router.post("/verify", async (req: Request<{}, {}, ValidateOtpDto>, res) => {
    const parsed = ValidateOtpSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten });
    }

    const result = await validateUserOtp(db, req.body);

    if (!result.ok) {
      console.error("[LOGIN]: Failed to verify token");
      return res.status(400).json(result);
    }

    const token = jwt.sign(
      {
        user_id: result.user?.user_id,
        user_email: result.user?.email,
        role_id: result.user?.role_id,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" },
    );

    return res.json({
      ok: true,
      user: result.user,
      token,
    });
  });

  router.patch(
    "/approve",
    authMiddleware,
    async (req: Request<{}, {}, ApproveUserDto>, res) => {
      const parsed = ApproveUserSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten });
      }

      const result = await approveUser(db, req.body);

      if (!result.ok) {
        return res.status(404).json(result.error);
      }

      return res.status(200);
    },
  );

  router.patch(
    "/role",
    authMiddleware,
    async (req: Request<{}, {}, UpdateUserRoleDto>, res) => {
      const parsed = UpdateUserRoleSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten });
      }

      const result = await approveUser(db, req.body);

      if (!result.ok) {
        return res.status(404).json(result.error);
      }

      return res.status(200);
    },
  );

  return router;
}
