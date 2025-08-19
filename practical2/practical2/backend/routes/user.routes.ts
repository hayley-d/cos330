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
  getUserByEmail,
  getUserList,
} from "../repositories/user.repo";
import type {
  MfaResponse,
  CreateUserDTO,
  ValidateMfaDto,
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
        return res.status(400).json({ error: parsed.error.flatten });
      }

      const result: MfaResponse = await createUser(db, req.body);

      if (!result.ok) {
        return res.status(400).json({ error: result.error });
      }

      // REMOVE
      if (result.user_email) {
        const user = await getUserByEmail(db, result.user_email);
        if (!user) {
          return res.status(400).json({ error: result.error });
        }
        const token = jwt.sign(
          {
            user_id: user.user_id,
            user_email: user.email,
            role_id: user.role_id,
          },
          process.env.JWT_SECRET!,
          { expiresIn: "1h" },
        );

        return res.status(201).json({
          user_email: result.user_email,
          url: result.url,
          user: user,
          token,
        });
      }

      return res
        .status(201)
        .json({ user_email: result.user_email, url: result.url });
    } catch (err) {
      return res
        .status(500)
        .json({ ok: false, error: "Internal server error" });
    }
  });

  router.post(
    "/two_factor",
    async (req: Request<{}, {}, ValidateMfaDto>, res) => {
      try {
        const parsed = ValidateMfaSchema.safeParse(req.body);

        if (!parsed.success) {
          return res.status(400).json({ error: parsed.error.flatten });
        }

        const result = await validateMfa(db, req.body);

        if (!result.ok) {
          return res.status(400).json({ error: result.error });
        }

        return res.status(200);
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

    if (result.user && result.user.email) {
      const token = jwt.sign(
        {
          user_id: result.user.user_id,
          user_email: result.user.email,
          role_id: result.user.role_id,
        },
        process.env.JWT_SECRET!,
        { expiresIn: "1h" },
      );

      return res
        .status(201)
        .json({ user_email: result.user.email, user: result.user, token });
    }

    return res.status(200).json({
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
