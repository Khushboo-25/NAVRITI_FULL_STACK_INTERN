import { execute } from "../config/cassandra.js";
import { parseUuid, randomUuid } from "../utils/ids.js";
import { serializePortal } from "../utils/serialize.js";

export const createPortal = async ({
    name,
    description = "",
    createdBy,
    targetAudience = "all",
}) => {
    const portalId = randomUuid();
    const now = new Date();

    await execute(
        `INSERT INTO announcement_portals (
            portal_id,
            name,
            description,
            created_by,
            target_audience,
            created_at,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            portalId,
            name,
            description,
            createdBy,
            targetAudience,
            now,
            now,
        ]
    );

    return findPortalById(portalId);
};

export const findPortalById = async (portalId) => {
    const result = await execute(
        `SELECT *
         FROM announcement_portals
         WHERE portal_id = ?`,
        [parseUuid(portalId)]
    );

    if (!result.rowLength) {
        return null;
    }

    return serializePortal(result.first());
};

export const findPortalsByIds = async (portalIds) => {
    const portals = await Promise.all(
        portalIds.map((id) => findPortalById(id))
    );

    return portals.filter(Boolean);
};

export const deletePortalById = async (portalId) => {
    await execute(
        `DELETE FROM announcement_portals
         WHERE portal_id = ?`,
        [parseUuid(portalId)]
    );
};
