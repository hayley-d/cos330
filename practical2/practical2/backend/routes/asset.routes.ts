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
} from "../repositories/user.repo";
import type {
    MfaResponse,
    CreateUserDTO,
    ValidateMfaDto,
    UserLoginDto,
    RequestUserOption,
    ValidateOtpDto,
    ApproveUserDto,
    UpdateUserRoleDto,
} from "../types/user.types";
import {
    ApproveUserSchema,
    CreateUserDTOSchema,
    UpdateUserRoleSchema,
    UserLoginSchema,
    ValidateMfaSchema,
    ValidateOtpSchema,
} from "../schemas/user.schema";
import {
    confPatchSchema,
    DeleteConfidentialDto,
    DeleteConfidentialSchema,
    UpdateConfidentialAsset
} from "../schemas/asset.schema";
import {deleteAsset, updateConfidentialAsset} from "../services/asset.service";

const router = Router();

export function imageRoutes(db: DB) {
    router.post("/", async (req: Request<{}, {}, CreateUserDTO>, res) => {
        try {
            const parsed = CreateUserDTOSchema.safeParse(req.body);

            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.flatten });
            }

            const result: MfaResponse = await createUser(db, req.body);

            if (!result.ok) {
                return res.status(400).json({ error: result.error });
            }

            return res.status(201).json({ user_email: result.user_email, url: result.url });
        } catch (err) {
            return res.status(500).json({ ok: false, error: "Internal server error" });
        }
    });

    router.post(
        "/validate",
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
                return res.status(500).json({ ok: false, error: "Internal server error" });
            }
        },
    );

    router.post("/login", async (req: Request<{}, {}, UserLoginDto>, res) => {
        const parsed = UserLoginSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten });
        }

        const result: RequestUserOption = await login(db, req.body);

        if (!result.ok) {
            return res.status(400).json(result);
        }

        return res
            .status(200)
            .json({
                mfa_required: true,
                user_id: result.user?.userId,
                user_email: result.user?.email,
            });
    });

    router.post(
        "/validate-otp",
        async (req: Request<{}, {}, ValidateOtpDto>, res) => {
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
                    user_id: result.user?.userId,
                    user_email: result.user?.email,
                    role_id: result.user?.roleId,
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" },
            );

            return res.json({
                ok: true,
                user: result.user,
                token,
            });
        },
    );

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


export function documentRoutes(db: DB) {
    router.post("/", async (req: Request<{}, {}, CreateUserDTO>, res) => {
        try {
            const parsed = CreateUserDTOSchema.safeParse(req.body);

            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.flatten });
            }

            const result: MfaResponse = await createUser(db, req.body);

            if (!result.ok) {
                return res.status(400).json({ error: result.error });
            }

            return res.status(201).json({ user_email: result.user_email, url: result.url });
        } catch (err) {
            return res.status(500).json({ ok: false, error: "Internal server error" });
        }
    });

    router.post(
        "/validate",
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
                return res.status(500).json({ ok: false, error: "Internal server error" });
            }
        },
    );

    router.post("/login", async (req: Request<{}, {}, UserLoginDto>, res) => {
        const parsed = UserLoginSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten });
        }

        const result: RequestUserOption = await login(db, req.body);

        if (!result.ok) {
            return res.status(400).json(result);
        }

        return res
            .status(200)
            .json({
                mfa_required: true,
                user_id: result.user?.userId,
                user_email: result.user?.email,
            });
    });

    router.post(
        "/validate-otp",
        async (req: Request<{}, {}, ValidateOtpDto>, res) => {
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
                    user_id: result.user?.userId,
                    user_email: result.user?.email,
                    role_id: result.user?.roleId,
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" },
            );

            return res.json({
                ok: true,
                user: result.user,
                token,
            });
        },
    );

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

// TODO: SANITIZE ALL USER INPUT

export function confidentialRoutes(db: DB) {
    router.get(
        "/",
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
                return res.status(500).json({ ok: false, error: "Internal server error" });
            }
        },
    );

    router.post("/read", async (req: Request<{}, {}, UserLoginDto>, res) => {
        const parsed = UserLoginSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten });
        }

        const result: RequestUserOption = await login(db, req.body);

        if (!result.ok) {
            return res.status(400).json(result);
        }

        return res
            .status(200)
            .json({
                mfa_required: true,
                user_id: result.user?.userId,
                user_email: result.user?.email,
            });
    });

    /*
    Create a new confidential document type.
     */
    router.post(
        "/",
        async (req: Request<{}, {}, ValidateOtpDto>, res) => {
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
                    user_id: result.user?.userId,
                    user_email: result.user?.email,
                    role_id: result.user?.roleId,
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" },
            );

            return res.json({
                ok: true,
                user: result.user,
                token,
            });
        },
    );

    router.patch(
        "/",
        authMiddleware,
        async (req: Request<{}, {}, UpdateConfidentialAsset>, res) => {
            const parsed = confPatchSchema.safeParse(req.body);

            if (!parsed.success) {
                console.error("[PATCH confidential/]: Request body invalid format.")
                return res.status(400).json({ error: parsed.error.flatten });
            }

            const result = await updateConfidentialAsset(db, req.body);

            if (!result.ok) {
                console.error("[PATCH confidential/]: Update confidential asset failed.")
                return res.status(404).json(result.error);
            }

            return res.status(200);
        },
    );

    router.delete(
        "/",
        authMiddleware,
        async (req: Request<{}, {}, DeleteConfidentialDto>, res) => {
            const parsed = DeleteConfidentialSchema.safeParse(req.body);

            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.flatten });
            }

            const result = await deleteAsset(db, req.body);

            if (!result.ok) {
                return res.status(404).json(result.error);
            }

            return res.status(200);
        },
    );

    return router;
}
