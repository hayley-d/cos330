import { Router } from "express";
import type { Request } from "express";

import { authMiddleware } from "../middleware/auth.middleware";
import type { APPLICATION_DB as DB } from "../db/db";

import type { ValidateMfaDto } from "../types/user.types";
import {
  confPatchSchema,
  createConfidentialDto,
  createConfidentialSchema,
  createDocumentDto,
  createDocumentSchema,
  DeleteAssetDto,
  DeleteAssetSchema,
  ReadAssetSchema,
  UpdateConfidentialAsset,
} from "../schemas/asset.schema";
import {
  createConfidentialAssetService,
  deleteAsset,
  getAssetByID,
  updateConfidentialAsset,
} from "../services/asset.service";
import { GetAssetOption } from "../types/asset.types";
import { getAssetList } from "../repositories/asset.repo";

const router = Router();

export function confidentialRoutes(db: DB) {
  router.get(
    "/confidential/list",
    async (req: Request<{}, {}, ValidateMfaDto>, res) => {
      try {
        const result = await getAssetList(db, "confidential");

        if (!result.ok) {
          return res.status(400).json({ error: result.error });
        }

        return res.status(200).json(result.items);
      } catch (err) {
        return res
          .status(500)
          .json({ ok: false, error: "Internal server error" });
      }
    },
  );

  router.get("/confidential/:asset_id", authMiddleware, async (req, res) => {
    const { asset_id } = req.params;
    // @ts-ignore
    const user_id = req.user.user_id;

    const result: GetAssetOption = await getAssetByID(db, {
      asset_id: asset_id!,
      user_id: user_id,
    });

    if (!result.ok) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  });

  router.post(
    "/confidential",
    async (req: Request<{}, {}, createConfidentialDto>, res) => {
      const parsed = createConfidentialSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten });
      }

      const result = await createConfidentialAssetService(db, parsed.data);

      if (!result.ok) {
        return res.status(400).json(result);
      }

      return res.status(201).send();
    },
  );

  router.patch(
    "/confidential",
    authMiddleware,
    async (req: Request<{}, {}, UpdateConfidentialAsset>, res) => {
      const parsed = confPatchSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten });
      }

      const result = await updateConfidentialAsset(db, req.body);

      if (!result.ok) {
        return res.status(404).json(result.error);
      }

      return res.status(200).send();
    },
  );

  router.delete("/confidential/:asset_id", authMiddleware, async (req, res) => {
    const { asset_id } = req.params;
    // @ts-ignore
    const user_id: string = req.user.user_id;

    const result = await deleteAsset(db, {
      asset_id: asset_id!,
      deleted_by: user_id,
    });

    if (!result.ok) {
      return res.status(404).json("Failed to delete asset");
    }

    return res.status(200).send();
  });

  return router;
}
