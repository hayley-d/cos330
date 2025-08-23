import type {APPLICATION_DB as DB} from "../db/db";
import {authMiddleware} from "../middleware/auth.middleware";
import {getAssetList} from "../repositories/asset.repo";
import {GetAssetOption} from "../types/asset.types";
import {createAsset, deleteAsset, getAssetByID, updateAsset} from "../services/asset.service";
import {Request, Router} from "express";
import {
    AssetPatchSchema,
    CreateAssetDto,
    createAssetSchema,
    DeleteAssetDto, DeleteAssetSchema,
    PatchAssetDto
} from "../schemas/asset.schema";

const router = Router();

export function imageRoutes(db: DB) {
    router.get("/images/list", authMiddleware, async (req, res) => {
        try {
            const result = await getAssetList(db, "image");

            if (!result.ok) {
                return res.status(400).json({ error: result.error });
            }

            return res.status(200).json(result.items);
        } catch (err) {
            return res
                .status(500)
                .json({ ok: false, error: "Internal server error" });
        }
    });

    router.get("/images/:asset_id", authMiddleware,  async (req, res) => {
        const { asset_id } = req.params;
        // @ts-ignore
        const user_id = req.user.user_id;

        if(!asset_id)  {
            return res.status(400).json({ error: "Unable to parse request payload." });
        }

        const result: GetAssetOption = await getAssetByID(db, { asset_id: asset_id, user_id: user_id });

        if (!result.ok) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    });

    router.post("/images/", authMiddleware, async (req: Request<{}, {}, CreateAssetDto>, res) => {
        const parsed = createAssetSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten });
        }

        const result = await createAsset(db, parsed.data);

        if (!result.ok) {
            return res.status(400).json(result);
        }

        return res.status(201).send();
    });

    router.patch(
        "/images/",
        authMiddleware,
        async (req: Request<{}, {}, PatchAssetDto>, res) => {
            const parsed = AssetPatchSchema.safeParse(req.body);

            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.flatten });
            }

            const result = await updateAsset(db, parsed.data);

            if (!result.ok) {
                return res.status(404).json(result.error);
            }

            return res.status(200).send();
        },
    );

    router.delete(
        "/images/:asset_id",
        authMiddleware,
        async (req, res) => {
            const { asset_id } = req.params;
            // @ts-ignore
            const user_id: string = req.user.user_id;

            const result = await deleteAsset(db, {asset_id: asset_id, deleted_by: user_id});

            if (!result.ok) {
                return res.status(404).json(result.error);
            }

            return res.status(200);
        },
    );

    return router;
}
