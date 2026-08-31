import { execute } from "../config/cassandra.js";
import { parseUuid, randomUuid } from "../utils/ids.js";
import {
    serializeAnnouncement,
    toAnnouncementAttachmentUdt,
} from "../utils/serialize.js";

const toTargetSet = (targetUserIds) => {
    if (!targetUserIds || targetUserIds.length === 0) {
        return [];
    }

    return Array.from(new Set(targetUserIds));
};

const insertAnnouncementRows = async (announcement) => {
    await execute(
        `INSERT INTO announcements_by_id (
            announcement_id,
            portal_id,
            published_at,
            sender_id,
            title,
            content,
            attachments,
            target_audience,
            target_user_ids,
            expires_at,
            created_at,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            announcement.announcement_id,
            announcement.portal_id,
            announcement.published_at,
            announcement.sender_id,
            announcement.title,
            announcement.content,
            announcement.attachments,
            announcement.target_audience,
            announcement.target_user_ids,
            announcement.expires_at,
            announcement.created_at,
            announcement.updated_at,
        ]
    );

    await execute(
        `INSERT INTO announcements_by_portal (
            portal_id,
            published_at,
            announcement_id,
            sender_id,
            title,
            content,
            attachments,
            target_audience,
            target_user_ids,
            expires_at,
            created_at,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            announcement.portal_id,
            announcement.published_at,
            announcement.announcement_id,
            announcement.sender_id,
            announcement.title,
            announcement.content,
            announcement.attachments,
            announcement.target_audience,
            announcement.target_user_ids,
            announcement.expires_at,
            announcement.created_at,
            announcement.updated_at,
        ]
    );
};

export const createAnnouncementRecord = async ({
    portalId,
    senderId,
    title,
    content,
    attachments = [],
    targetAudience = "all",
    targetUserIds = [],
    expiresAt = null,
}) => {
    const now = new Date();
    const announcement = {
        announcement_id: randomUuid(),
        portal_id: parseUuid(portalId),
        published_at: now,
        sender_id: senderId,
        title,
        content,
        attachments: attachments.map(toAnnouncementAttachmentUdt),
        target_audience: targetAudience,
        target_user_ids: toTargetSet(targetUserIds),
        expires_at: expiresAt ? new Date(expiresAt) : null,
        created_at: now,
        updated_at: now,
    };

    await insertAnnouncementRows(announcement);

    return serializeAnnouncement(announcement);
};

export const findAnnouncementsByPortalId = async (portalId) => {
    const result = await execute(
        `SELECT *
         FROM announcements_by_portal
         WHERE portal_id = ?`,
        [parseUuid(portalId)]
    );

    return result.rows.map(serializeAnnouncement);
};

export const findAnnouncementById = async (announcementId) => {
    const result = await execute(
        `SELECT *
         FROM announcements_by_id
         WHERE announcement_id = ?`,
        [parseUuid(announcementId)]
    );

    if (!result.rowLength) {
        return null;
    }

    return {
        row: result.first(),
        announcement: serializeAnnouncement(result.first()),
    };
};

export const updateAnnouncementRecord = async ({
    announcementId,
    title,
    content,
    targetAudience,
    expiresAt,
}) => {
    const found = await findAnnouncementById(announcementId);

    if (!found) {
        return null;
    }

    const now = new Date();
    const next = {
        ...found.row,
        title: title !== undefined ? title : found.row.title,
        content: content !== undefined ? content : found.row.content,
        target_audience:
            targetAudience !== undefined
                ? targetAudience
                : found.row.target_audience,
        expires_at:
            expiresAt !== undefined
                ? expiresAt
                    ? new Date(expiresAt)
                    : null
                : found.row.expires_at,
        updated_at: now,
    };

    await execute(
        `UPDATE announcements_by_id
         SET title = ?, content = ?, target_audience = ?,
             expires_at = ?, updated_at = ?
         WHERE announcement_id = ?`,
        [
            next.title,
            next.content,
            next.target_audience,
            next.expires_at,
            now,
            found.row.announcement_id,
        ]
    );

    await execute(
        `UPDATE announcements_by_portal
         SET title = ?, content = ?, target_audience = ?,
             expires_at = ?, updated_at = ?
         WHERE portal_id = ?
           AND published_at = ?
           AND announcement_id = ?`,
        [
            next.title,
            next.content,
            next.target_audience,
            next.expires_at,
            now,
            found.row.portal_id,
            found.row.published_at,
            found.row.announcement_id,
        ]
    );

    return serializeAnnouncement(next);
};

export const deleteAnnouncementRecord = async (announcementId) => {
    const found = await findAnnouncementById(announcementId);

    if (!found) {
        return null;
    }

    await execute(
        `DELETE FROM announcements_by_id
         WHERE announcement_id = ?`,
        [found.row.announcement_id]
    );

    await execute(
        `DELETE FROM announcements_by_portal
         WHERE portal_id = ?
           AND published_at = ?
           AND announcement_id = ?`,
        [
            found.row.portal_id,
            found.row.published_at,
            found.row.announcement_id,
        ]
    );

    return found.announcement;
};
