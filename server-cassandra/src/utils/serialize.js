import { uuidToString } from "./ids.js";

const toDate = (value) => {
    if (!value) {
        return null;
    }

    return value instanceof Date ? value : new Date(value);
};

export const serializeAttachment = (attachment) => {
    if (!attachment) {
        return undefined;
    }

    const fileName = attachment.file_name ?? attachment.fileName;
    const originalName =
        attachment.original_name ??
        attachment.originalName ??
        fileName;

    return {
        fileName,
        fileUrl: attachment.file_url ?? attachment.fileUrl,
        fileType: attachment.file_type ?? attachment.fileType,
        fileSize: Number(
            attachment.file_size ?? attachment.fileSize ?? 0
        ),
        publicId: attachment.public_id ?? attachment.publicId,
        resourceType: attachment.resource_type ?? attachment.resourceType,
        originalName,
    };
};

export const toAttachmentUdt = (attachment) => {
    if (!attachment) {
        return null;
    }

    return {
        file_name: attachment.fileName || null,
        file_url: attachment.fileUrl || null,
        file_type: attachment.fileType || null,
        file_size: attachment.fileSize ?? null,
        public_id: attachment.publicId || null,
        resource_type: attachment.resourceType || null,
        original_name:
            attachment.originalName || attachment.fileName || null,
    };
};

export const serializeAnnouncementAttachment = (attachment) => {
    if (!attachment) {
        return null;
    }

    return {
        url: attachment.url,
        fileName: attachment.file_name ?? attachment.fileName,
        fileType: attachment.file_type ?? attachment.fileType,
        fileSize: Number(
            attachment.file_size ?? attachment.fileSize ?? 0
        ),
        publicId: attachment.public_id ?? attachment.publicId,
        resourceType: attachment.resource_type ?? attachment.resourceType,
    };
};

export const toAnnouncementAttachmentUdt = (attachment) => ({
    url: attachment.url || null,
    file_name: attachment.fileName || null,
    file_type: attachment.fileType || null,
    file_size: attachment.fileSize ?? null,
    public_id: attachment.publicId || null,
    resource_type: attachment.resourceType || null,
});

export const serializeConversation = (row) => {
    if (!row) {
        return null;
    }

    return {
        _id: uuidToString(row.conversation_id),
        type: row.type,
        displayName: row.display_name ?? null,
        participantKey: row.participant_key ?? undefined,
        createdAt: toDate(row.created_at),
        updatedAt: toDate(row.updated_at),
    };
};

export const serializeMessage = (row) => {
    if (!row) {
        return null;
    }

    const attachment = serializeAttachment(row.attachment);

    return {
        _id: uuidToString(row.message_id),
        conversationId: uuidToString(row.conversation_id),
        senderId: row.sender_id,
        content: row.content ?? "",
        messageType: row.message_type || "text",
        attachment,
        status: row.status || "sent",
        isDeleted: Boolean(row.is_deleted),
        createdAt: toDate(row.created_at),
        updatedAt: toDate(row.updated_at),
    };
};

export const serializePortal = (row) => {
    if (!row) {
        return null;
    }

    return {
        _id: uuidToString(row.portal_id),
        name: row.name,
        description: row.description || "",
        createdBy: row.created_by,
        targetAudience: row.target_audience || "all",
        createdAt: toDate(row.created_at),
        updatedAt: toDate(row.updated_at),
    };
};

export const serializeMember = (row) => {
    if (!row) {
        return null;
    }

    return {
        _id: uuidToString(row.member_id),
        portalId: uuidToString(row.portal_id),
        userId: row.user_id,
        role: row.role,
        addedBy: row.added_by,
        createdAt: toDate(row.created_at),
        updatedAt: toDate(row.updated_at),
    };
};

export const serializeAnnouncement = (row) => {
    if (!row) {
        return null;
    }

    const attachments = (row.attachments || []).map(
        serializeAnnouncementAttachment
    );

    const targetUserIds = row.target_user_ids
        ? Array.from(row.target_user_ids)
        : [];

    return {
        _id: uuidToString(row.announcement_id),
        portalId: uuidToString(row.portal_id),
        senderId: row.sender_id,
        title: row.title,
        content: row.content,
        attachments,
        targetAudience: row.target_audience || "all",
        targetUserIds,
        publishedAt: toDate(row.published_at),
        expiresAt: toDate(row.expires_at),
        createdAt: toDate(row.created_at),
        updatedAt: toDate(row.updated_at),
    };
};

export const isAnnouncementVisibleToUser = (announcement, userId) => {
    const now = new Date();
    const expiresAt = announcement.expiresAt;

    const notExpired = !expiresAt || expiresAt > now;

    const isAudience =
        announcement.targetAudience === "all" ||
        (announcement.targetAudience === "selected" &&
            (announcement.targetUserIds || []).includes(userId));

    return notExpired && isAudience;
};
