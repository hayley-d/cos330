import type { APPLICATION_DB as DB } from "../db/db";
import { UUID } from "../types";

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

