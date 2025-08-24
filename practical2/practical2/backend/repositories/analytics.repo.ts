import type { APPLICATION_DB as DB } from "../db/db";
import { UUID } from "../types";
import geoip from "geoip-lite";
import {getUserList} from "./user.repo";
import {getRoleById} from "./role.repo";

// Heatmap of endpoint usage per hour
export async function getEndpointHeatmap(db: DB) {
    return await db.all<{
        endpoint: string;
        hour: number;
        count: number;
    }>(
        `SELECT endpoint,
            strftime('%H', datetime(created_at, 'unixepoch')) AS hour,
            COUNT(*) as count
     FROM request_log
     GROUP BY endpoint, hour
     ORDER BY endpoint, hour;`
    );
}

// Unauthorized access attempts
export async function getUnauthorizedAttempts(db: DB) {
    return await db.all<{
        user_id: UUID;
        endpoint: string;
        attempts: number;
    }>(
        `SELECT user_id, endpoint, COUNT(*) as attempts
     FROM request_log
     WHERE success = 0
     GROUP BY user_id, endpoint
     HAVING attempts > 3
     ORDER BY attempts DESC;`
    );
}

// Impossible travel detection (requires IP → geo lookup in service layer)
export async function getUserIpHistory(db: DB, userId: UUID) {
    return await db.all<{
        user_id: UUID;
        origin_ip: string;
        created_at: number;
    }>(
        `SELECT user_id, origin_ip, created_at
     FROM request_log
     WHERE user_id = ?
     ORDER BY created_at ASC;`,
        [userId]
    );
}

// Activity spikes: compare last 1h vs average
export async function getActivitySpikes(db: DB) {
    return await db.all<{
        user_id: UUID;
        recent_requests: number;
        avg_requests: number;
    }>(
        `WITH recent AS (
        SELECT user_id, COUNT(*) AS recent_requests
        FROM request_log
        WHERE created_at >= unixepoch('now','-1 hour')
        GROUP BY user_id
     ),
     baseline AS (
        SELECT user_id, COUNT(*) * 1.0 / ( (MAX(created_at)-MIN(created_at))/3600.0 ) AS avg_requests
        FROM request_log
        GROUP BY user_id
     )
     SELECT r.user_id, r.recent_requests, b.avg_requests
     FROM recent r
     JOIN baseline b ON r.user_id = b.user_id
     WHERE r.recent_requests > (b.avg_requests * 3);`
    );
}

export async function getPrivilegeEscalationAttempts(db: DB) {
    return await db.all<{
        user_id: string;
        role_name: string;
        endpoint: string;
        attempts: number;
        success: number;
    }>(
        `SELECT u.user_id, r.role_name, rl.endpoint, rl.success, COUNT(*) as attempts
     FROM request_log rl
     JOIN users u ON rl.user_id = u.user_id
     JOIN roles r ON u.role_id = r.role_id
     WHERE (
        (r.role_name = 'Guest' AND rl.endpoint IN ('/confidential', '/roles', '/users')) OR
        (r.role_name = 'User' AND rl.endpoint IN ('/roles', '/users'))
     )
     GROUP BY u.user_id, r.role_name, rl.endpoint, rl.success
     ORDER BY attempts DESC;`
    );
}

/**
 * Compute circular distance between two latitudes and longitudes.
 * @param lat1
 * @param lon1
 * @param lat2
 * @param lon2
 */
export function haversineDistance([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]) {
    const toRadians = (x: number) => x * Math.PI / 180;
    const EARTH_RADIUS = 6371;

    const deltaLat = toRadians(lat2 - lat1);
    const deltaLon = toRadians(lon2 - lat2);

    const sinHalfDeltaLat = Math.sin(deltaLat / 2);
    const sinHalfDeltaLon = Math.sin(deltaLon / 2);

    const haversine =
        sinHalfDeltaLat * sinHalfDeltaLat +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        sinHalfDeltaLon * sinHalfDeltaLon;
    const centralAngle = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

    return EARTH_RADIUS * centralAngle;
}

export async function detectImpossibleTravel(db: DB, userId: UUID) {
    const history = await db.all<{
        origin_ip: string;
        created_at: number;
    }>('SELECT origin_ip, created_at FROM request_log WHERE user_id = ? ORDER BY created_at ASC;', [userId]);

    if (!history || history.length < 2) {
        return [];
    }

    const anomalies: {
        from_ip: string;
        to_ip: string;
        distance_km: number;
        time_diff_minutes: number;
        speed_kmh: number;
        at: number;
    }[] = [];

    for (let i = 0; i < history.length - 1; i++) {
        const a = history[i]!;
        const b = history[i + 1]!;

        const geoA = geoip.lookup(a.origin_ip);
        const geoB = geoip.lookup(b.origin_ip);

        if (!geoA || !geoB || !geoA.ll || !geoB.ll) continue;

        const coordsA = geoA.ll as [number, number];
        const coordsB = geoB.ll as [number, number];

        const distanceKm = haversineDistance(coordsA, coordsB);

        const timeDiffHours = (b.created_at - a.created_at) / 3600.0;
        if (timeDiffHours <= 0) continue;

        const speedKmh = distanceKm / timeDiffHours;

        if (speedKmh > 1000) {
            anomalies.push({
                from_ip: a.origin_ip,
                to_ip: b.origin_ip,
                distance_km: Math.round(distanceKm),
                time_diff_minutes: Math.round((b.created_at - a.created_at) / 60),
                speed_kmh: Math.round(speedKmh),
                at: b.created_at
            });
        }
    }

    return anomalies;
}

export async function detectSessionHijacking(db: DB, userId: UUID) {
    const history = await db.all<{ origin_ip: string; created_at: number }>(
        `SELECT origin_ip, created_at
     FROM request_log
     WHERE user_id = ?
     ORDER BY created_at ASC`,
        [userId]
    );

    const anomalies: { from_ip: string; to_ip: string; time_diff_seconds: number; at: number }[] = [];

    for (let i = 0; i < history.length - 1; i++) {
        const a = history[i]!;
        const b = history[i + 1]!;

        const timeDiffSeconds = b.created_at - a.created_at;

        // If IP changes in < 300 seconds → suspicious
        if (a.origin_ip !== b.origin_ip && timeDiffSeconds < 300) {
            anomalies.push({
                from_ip: a.origin_ip,
                to_ip: b.origin_ip,
                time_diff_seconds: timeDiffSeconds,
                at: b.created_at
            });
        }
    }

    return anomalies;
}

export async function detectImpossibleTravelAllUsers(db: DB) {
    const { items: users } = await getUserList(db);
    const allAnomalies: {
        user_id: string;
        email: string;
        role: string;
        anomalies: any[];
    }[] = [];


    for (const user of users) {
        const anomalies = await detectImpossibleTravel(db, user.user_id as UUID);
        if (anomalies.length > 0) {
            const role = await getRoleById(db, user.role_id as UUID);
            if (role.ok && role.role) {
                allAnomalies.push({
                    user_id: user.user_id,
                    email: user.email,
                    role: role.role.role_name || "Unknown",
                    anomalies,
                });
            }
        }
    }

    return allAnomalies;
}

export async function detectSessionHijackingAllUsers(db: DB) {
    const { items: users } = await getUserList(db);
    const allAnomalies: {
        user_id: string;
        email: string;
        role: string;
        anomalies: any[];
    }[] = [];

    for (const user of users) {
        const anomalies = await detectSessionHijacking(db, user.user_id as UUID);
        if (anomalies.length > 0) {
            const role = await getRoleById(db, user.role_id as UUID);
            if (role.ok && role.role) {
                allAnomalies.push({
                    user_id: user.user_id,
                    email: user.email,
                    role: role.role.role_name || "Unknown",
                    anomalies,
                });
            }
        }
    }

    return allAnomalies;
}


