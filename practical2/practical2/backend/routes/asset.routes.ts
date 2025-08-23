import { Router } from "express";
import type { Request } from "express";

import { authMiddleware } from "../middleware/auth.middleware";
import type { APPLICATION_DB as DB } from "../db/db";

import type { ValidateMfaDto } from "../types/user.types";
import {
    AssetPatchSchema,
    confPatchSchema,
    CreateAssetDto,
    createAssetSchema, createConfidentialDto, createConfidentialSchema, createDocumentDto, createDocumentSchema,
    DeleteAssetDto,
    DeleteAssetSchema,
    PatchAssetDto,
    ReadAssetSchema,
    UpdateConfidentialAsset,
} from "../schemas/asset.schema";
import {
    createAsset, createConfidentialAssetService,
    deleteAsset,
    getAssetByID,
    updateAsset,
    updateConfidentialAsset,
} from "../services/asset.service";
import {GetAssetOption, RequestAssetOption} from "../types/asset.types";
import { getAssetList } from "../repositories/asset.repo";

const router = Router();



export function documentRoutes(db: DB) {
    router.get("/documents/list", authMiddleware, async (req, res) => {
        try {
            const result = await getAssetList(db, "document");

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

  router.get("/documents/:asset_id", authMiddleware,  async (req, res) => {
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

  router.post("/documents/", authMiddleware, async (req: Request<{}, {}, createDocumentDto>, res) => {
      console.log("Making it here")
    const parsed = createDocumentSchema.safeParse(req.body);


    if (!parsed.success) {
        console.log("error parsing payload", parsed.error);
      return res.status(400).json({ error: parsed.error.flatten });
    }

    const result = await createAsset(db, parsed.data);

    if (!result.ok) {
        console.log("Error creating asset")
      return res.status(400).json(result);
    }

    return res.status(201).send();
  });

  router.patch(
    "/documents/",
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
    "/documents/",
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
  router.get("/confidential/list", async (req: Request<{}, {}, ValidateMfaDto>, res) => {
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
  });

  router.get("/confidential/:asset_id", authMiddleware,  async (req, res) => {
    const { asset_id,  } = req.params;
    // @ts-ignore
      const { user_id } = req.user.user_id;

    const parsed = ReadAssetSchema.safeParse({ asset_id, user_id });

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten });
    }

    const result: GetAssetOption = await getAssetByID(db, parsed.data);

    if (!result.ok) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  });

  router.post("/confidential", async (req: Request<{}, {},createConfidentialDto >, res) => {
    const parsed = createConfidentialSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten });
    }

    const result = await createConfidentialAssetService(db, parsed.data);

    if (!result.ok) {
      return res.status(400).json(result);
    }

    return res.status(201).send();
  });

  router.patch(
    "/confidential",
    authMiddleware,
    async (req: Request<{}, {}, UpdateConfidentialAsset>, res) => {
      const parsed = confPatchSchema.safeParse(req.body);

      if (!parsed.success) {
        console.error("[PATCH confidential/]: Request body invalid format.");
        return res.status(400).json({ error: parsed.error.flatten });
      }

      const result = await updateConfidentialAsset(db, req.body);

      if (!result.ok) {
        console.error(
          "[PATCH confidential/]: Update confidential asset failed.",
        );
        return res.status(404).json(result.error);
      }

      return res.status(200).send();
    },
  );

  router.delete(
    "/confidential",
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

      return res.status(200).send();
    },
  );

  return router;
}
