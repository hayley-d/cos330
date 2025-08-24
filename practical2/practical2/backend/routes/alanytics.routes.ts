import { Router, Request, Response } from "express";
import type { APPLICATION_DB as DB } from "../db/db";
import { authMiddleware } from "../middleware/auth.middleware";
import {
    getEndpointHeatmap,
    getUnauthorizedAttempts,
    getUserIpHistory,
    getActivitySpikes,
    getPrivilegeEscalationAttempts,
    detectSessionHijacking,
    detectImpossibleTravel,
    detectImpossibleTravelAllUsers,
    detectSessionHijackingAllUsers,
} from "../repositories/analytics.repo";
import {UUID} from "../types";

export function analyticsRoutes(db: DB) {
    const router = Router();

    // Endpoint heatmap
    router.get("/analytics/heatmap", authMiddleware, async (_req: Request, res: Response) => {
        try {
            const data = await getEndpointHeatmap(db);
            res.status(200).json({ ok: true, data });
        } catch (err) {
            console.error("[Analytics] heatmap error:", err);
            res.status(500).json({ ok: false, error: "Failed to compute endpoint heatmap" });
        }
    });

    // Unauthorized access attempts
    router.get("/analytics/unauthorized", authMiddleware, async (_req: Request, res: Response) => {
        try {
            const data = await getUnauthorizedAttempts(db);
            res.status(200).json({ ok: true, data });
        } catch (err) {
            console.error("[Analytics] unauthorized error:", err);
            res.status(500).json({ ok: false, error: "Failed to compute unauthorized attempts" });
        }
    });

    // Activity spikes
    router.get("/analytics/spikes", authMiddleware, async (_req: Request, res: Response) => {
        try {
            const data = await getActivitySpikes(db);
            res.status(200).json({ ok: true, data });
        } catch (err) {
            console.error("[Analytics] spikes error:", err);
            res.status(500).json({ ok: false, error: "Failed to compute activity spikes" });
        }
    });

    // Privilege escalation attempts
    router.get("/analytics/privilege-escalations", authMiddleware, async (_req: Request, res: Response) => {
        try {
            const data = await getPrivilegeEscalationAttempts(db);
            res.status(200).json({ ok: true, data });
        } catch (err) {
            console.error("[Analytics] privilege escalation error:", err);
            res.status(500).json({ ok: false, error: "Failed to compute privilege escalation attempts" });
        }
    });

    // User IP history (for impossible travel detection)
    router.get("/analytics/ip-history/:user_id", authMiddleware, async (req: Request, res: Response) => {
        try {
            const { user_id } = req.params;
            const data = await getUserIpHistory(db, user_id! as UUID);
            res.status(200).json({ ok: true, data });
        } catch (err) {
            console.error("[Analytics] ip history error:", err);
            res.status(500).json({ ok: false, error: "Failed to fetch IP history" });
        }
    });

    router.get("/analytics/impossible-travel", authMiddleware, async (req, res) => {
        try {
            const { user_id } = req.params;
            const anomalies = await detectImpossibleTravelAllUsers(db);
            res.status(200).json({ ok: true, anomalies });
        } catch (err) {
            console.error("[Analytics] impossible travel error:", err);
            res.status(500).json({ ok: false, error: "Failed to detect impossible travel" });
        }
    });

    router.get("/analytics/session-hijacking", authMiddleware, async (req, res) => {
        try {
            const { user_id } = req.params;
            const anomalies = await detectSessionHijackingAllUsers(db);
            res.status(200).json({ ok: true, anomalies });
        } catch (err) {
            res.status(500).json({ ok: false, error: "Failed to detect session hijacking" });
        }
    });

    return router;
}
