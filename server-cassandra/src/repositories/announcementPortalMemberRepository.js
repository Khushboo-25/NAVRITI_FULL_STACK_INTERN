import { execute } from "../config/cassandra.js";
import { parseUuid, randomUuid } from "../utils/ids.js";
import { serializeMember } from "../utils/serialize.js";

const insertMemberRows = async (member) => {
    await execute(
        `INSERT INTO portal_members_by_portal (
            portal_id,
            user_id,
            member_id,
            role,
            added_by,
            created_at,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            member.portal_id,
            member.user_id,
            member.member_id,
            member.role,
            member.added_by,
            member.created_at,
            member.updated_at,
        ]
    );

    await execute(
        `INSERT INTO portal_memberships_by_user (
            user_id,
            portal_id,
            member_id,
            role,
            added_by,
            created_at,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            member.user_id,
            member.portal_id,
            member.member_id,
            member.role,
            member.added_by,
            member.created_at,
            member.updated_at,
        ]
    );
};

export const createMember = async ({
    portalId,
    userId,
    role,
    addedBy,
}) => {
    const now = new Date();
    const member = {
        member_id: randomUuid(),
        portal_id: parseUuid(portalId),
        user_id: userId,
        role,
        added_by: addedBy,
        created_at: now,
        updated_at: now,
    };

    await insertMemberRows(member);

    return serializeMember(member);
};

export const createMembers = async (members) => {
    const created = [];

    for (const member of members) {
        created.push(await createMember(member));
    }

    return created;
};

export const findMember = async (portalId, userId) => {
    const result = await execute(
        `SELECT *
         FROM portal_members_by_portal
         WHERE portal_id = ?
           AND user_id = ?`,
        [parseUuid(portalId), userId]
    );

    if (!result.rowLength) {
        return null;
    }

    return serializeMember(result.first());
};

export const findMembersByPortalId = async (portalId) => {
    const result = await execute(
        `SELECT *
         FROM portal_members_by_portal
         WHERE portal_id = ?`,
        [parseUuid(portalId)]
    );

    return result.rows.map(serializeMember);
};

export const findMembersByUserId = async (userId) => {
    const result = await execute(
        `SELECT *
         FROM portal_memberships_by_user
         WHERE user_id = ?`,
        [userId]
    );

    return result.rows.map(serializeMember);
};

export const findMembersByPortalAndUserIds = async (
    portalId,
    userIds
) => {
    const members = await findMembersByPortalId(portalId);
    const userIdSet = new Set(userIds);

    return members.filter((member) => userIdSet.has(member.userId));
};

export const deleteMember = async (portalId, userId) => {
    const portalUuid = parseUuid(portalId);

    await execute(
        `DELETE FROM portal_members_by_portal
         WHERE portal_id = ?
           AND user_id = ?`,
        [portalUuid, userId]
    );

    await execute(
        `DELETE FROM portal_memberships_by_user
         WHERE user_id = ?
           AND portal_id = ?`,
        [userId, portalUuid]
    );
};

export const deleteMembersByPortalId = async (portalId) => {
    const members = await findMembersByPortalId(portalId);

    for (const member of members) {
        await deleteMember(portalId, member.userId);
    }

    return members;
};

export const updateMemberRole = async (portalId, userId, role) => {
    const member = await findMember(portalId, userId);

    if (!member) {
        return null;
    }

    const now = new Date();
    const portalUuid = parseUuid(portalId);

    await execute(
        `UPDATE portal_members_by_portal
         SET role = ?, updated_at = ?
         WHERE portal_id = ?
           AND user_id = ?`,
        [role, now, portalUuid, userId]
    );

    await execute(
        `UPDATE portal_memberships_by_user
         SET role = ?, updated_at = ?
         WHERE user_id = ?
           AND portal_id = ?`,
        [role, now, userId, portalUuid]
    );

    return {
        ...member,
        role,
        updatedAt: now,
    };
};
