import { Router } from "express";
import type { Request } from "express";

import { authMiddleware } from "../middleware/auth.middleware";
import type { APPLICATION_DB as DB } from "../db/db";

import type { ValidateMfaDto } from "../types/user.types";
import {
  AssetPatchSchema,
  confPatchSchema,
  CreateAssetDto,
  createAssetSchema,
  DeleteAssetDto,
  DeleteAssetSchema,
  PatchAssetDto,
  ReadAssetSchema,
  UpdateConfidentialAsset,
} from "../schemas/asset.schema";
import {
  createAsset,
  deleteAsset,
  getAssetByID,
  updateAsset,
  updateConfidentialAsset,
} from "../services/asset.service";
import { RequestAssetOption } from "../types/asset.types";
import { getAssetList } from "../repositories/asset.repo";

const router = Router();

export function imageRoutes(db: DB) {
  router.get("/list", async (req, res) => {
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

  router.post("/", async (req: Request<{}, {}, CreateAssetDto>, res) => {
    const parsed = createAssetSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten });
    }

    const result = await createAsset(db, parsed.data);

    if (!result.ok) {
      return res.status(400).json(result);
    }

    return res.status(201);
  });

  router.patch(
    "/",
    authMiddleware,
    async (req: Request<{}, {}, PatchAssetDto>, res) => {
      const parsed = AssetPatchSchema.safeParse(req.body);

      if (!parsed.success) {
        console.error("[PATCH Image/]: Request body invalid format.");
        return res.status(400).json({ error: parsed.error.flatten });
      }

      const result = await updateAsset(db, parsed.data);

      if (!result.ok) {
        console.error("[PATCH Image/]: Update image asset failed.");
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
  router.get("/list", async (req, res) => {
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

  router.post("/", async (req: Request<{}, {}, CreateAssetDto>, res) => {
    const parsed = createAssetSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten });
    }

    const result = await createAsset(db, parsed.data);

    if (!result.ok) {
      return res.status(400).json(result);
    }

    return res.status(201);
  });

  router.patch(
    "/",
    authMiddleware,
    async (req: Request<{}, {}, PatchAssetDto>, res) => {
      const parsed = AssetPatchSchema.safeParse(req.body);

      if (!parsed.success) {
        console.error("[PATCH Document/]: Request body invalid format.");
        return res.status(400).json({ error: parsed.error.flatten });
      }

      const result = await updateAsset(db, parsed.data);

      if (!result.ok) {
        console.error("[PATCH Document/]: Update confidential asset failed.");
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
  router.get("/list", async (req: Request<{}, {}, ValidateMfaDto>, res) => {
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

  router.post("/", async (req: Request<{}, {}, CreateAssetDto>, res) => {
    const parsed = createAssetSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten });
    }

    const result = await createAsset(db, parsed.data);

    if (!result.ok) {
      return res.status(400).json(result);
    }

    return res.status(201);
  });

  router.patch(
    "/",
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
