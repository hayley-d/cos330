import { Router } from "express";
import type { Request } from "express";

import { authMiddleware } from "../middleware/auth.middleware";
import type { APPLICATION_DB as DB } from "../db/db";
import {
    createUser,
    login,
    approveUser,
    validateMfa,
} from "../repositories/user.repo";
import type {
    MfaResponse,
    CreateUserDTO,
    ValidateMfaDto,
    UserLoginDto,
    RequestUserOption,
    ApproveUserDto,
} from "../types/user.types";
import {
    ApproveUserSchema,
    CreateUserDTOSchema,
    UserLoginSchema,
    ValidateMfaSchema,
} from "../schemas/user.schema";
import {
    Asset,
    confPatchSchema, CreateAssetDto, createAssetSchema,
    DeleteAssetDto,
    DeleteAssetSchema, ReadAssetDto, ReadAssetSchema,
    UpdateConfidentialAsset
} from "../schemas/asset.schema";
import {createAsset, deleteAsset, getAssetByID, updateConfidentialAsset} from "../services/asset.service";
import {getAsset} from "node:sea";
import {RequestAssetOption} from "../types/asset.types";
import {getAssetBytes, getAssetList} from "../repositories/asset.repo";
import {UUID} from "../types";

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
        "/",
        async (req: Request<{}, {}, CreateAssetDto>, res) => {
            const parsed = createAssetSchema.safeParse(req.body);

            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.flatten });
            }

            const result = await createAsset(db, parsed.data);

            if (!result.ok) {
                return res.status(400).json(result);
            }

            return res.status(201);
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

    router.delete(
        "/",
        authMiddleware,
        async (req: Request<{}, {}, DeleteAssetDto>, res) => {
            const parsed = DeleteAssetSchema.safeParse(req.body);

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
        "/",
        async (req: Request<{}, {}, CreateAssetDto>, res) => {
            const parsed = createAssetSchema.safeParse(req.body);

            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.flatten });
            }

            const result = await createAsset(db, parsed.data);

            if (!result.ok) {
                return res.status(400).json(result);
            }

            return res.status(201);
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

    router.delete(
        "/",
        authMiddleware,
        async (req: Request<{}, {}, DeleteAssetDto>, res) => {
            const parsed = DeleteAssetSchema.safeParse(req.body);

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

export function confidentialRoutes(db: DB) {
    router.get(
        "/list",
        async (req: Request<{}, {}, ValidateMfaDto>, res) => {
            try {
                const result = await getAssetList(db, "confidential");

                if (!result.ok) {
                    return res.status(400).json({ error: result.error });
                }

                return res.status(200).json(result.items);
            } catch (err) {
                return res.status(500).json({ ok: false, error: "Internal server error" });
            }
        },
    );

    router.get("/:user_id/:asset_id", async (req, res) => {
        const { asset_id, user_id } = req.params;

        const parsed = ReadAssetSchema.safeParse({ asset_id, user_id });

        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten });
        }

        const result: RequestAssetOption = await getAssetByID(db, parsed.data);

        if (!result.ok || !result.asset) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result.asset);
    });

    router.post(
        "/",
        async (req: Request<{}, {}, CreateAssetDto>, res) => {
            const parsed = createAssetSchema.safeParse(req.body);

            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.flatten });
            }

            const result = await createAsset(db, parsed.data);

            if (!result.ok) {
                return res.status(400).json(result);
            }

            return res.status(201);
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
        async (req: Request<{}, {}, DeleteAssetDto>, res) => {
            const parsed = DeleteAssetSchema.safeParse(req.body);

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
