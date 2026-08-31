import { execute } from "../config/cassandra.js";
import { parseUuid, randomUuid } from "../utils/ids.js";
import {
    serializeMessage,
    toAttachmentUdt,
} from "../utils/serialize.js";

const insertMessageRows = async (message) => {
    const params = [
        message.conversation_id,
        message.created_at,
        message.message_id,
        message.sender_id,
        message.content,
        message.message_type,
        message.attachment,
        message.status,
        message.is_deleted,
        message.updated_at,
    ];

    await execute(
        `INSERT INTO messages_by_conversation (
            conversation_id,
            created_at,
            message_id,
            sender_id,
            content,
            message_type,
            attachment,
            status,
            is_deleted,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params
    );

    await execute(
        `INSERT INTO messages_by_id (
            message_id,
            conversation_id,
            created_at,
            sender_id,
            content,
            message_type,
            attachment,
            status,
            is_deleted,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            message.message_id,
            message.conversation_id,
            message.created_at,
            message.sender_id,
            message.content,
            message.message_type,
            message.attachment,
            message.status,
            message.is_deleted,
            message.updated_at,
        ]
    );
};

export const createMessage = async ({
    conversationId,
    senderId,
    content = "",
    messageType = "text",
    attachment = null,
    status = "sent",
}) => {
    const now = new Date();
    const message = {
        message_id: randomUuid(),
        conversation_id: parseUuid(conversationId),
        sender_id: senderId,
        content: content || "",
        message_type: messageType || "text",
        attachment: toAttachmentUdt(attachment),
        status: status || "sent",
        is_deleted: false,
        created_at: now,
        updated_at: now,
    };

    await insertMessageRows(message);

    return serializeMessage(message);
};

export const findMessagesByConversation = async ({
    conversationId,
    before,
    limit,
}) => {
    const conversationUuid = parseUuid(conversationId);

    const result = before
        ? await execute(
              `SELECT *
               FROM messages_by_conversation
               WHERE conversation_id = ?
                 AND created_at < ?
               LIMIT ?`,
              [conversationUuid, before, limit]
          )
        : await execute(
              `SELECT *
               FROM messages_by_conversation
               WHERE conversation_id = ?
               LIMIT ?`,
              [conversationUuid, limit]
          );

    return result.rows.map(serializeMessage);
};

export const findLatestMessageByConversation = async (
    conversationId
) => {
    const result = await execute(
        `SELECT *
         FROM messages_by_conversation
         WHERE conversation_id = ?
         LIMIT 1`,
        [parseUuid(conversationId)]
    );

    if (!result.rowLength) {
        return null;
    }

    return serializeMessage(result.first());
};

export const findMessageById = async (messageId) => {
    const result = await execute(
        `SELECT *
         FROM messages_by_id
         WHERE message_id = ?`,
        [parseUuid(messageId)]
    );

    if (!result.rowLength) {
        return null;
    }

    return {
        row: result.first(),
        message: serializeMessage(result.first()),
    };
};

export const updateMessageContent = async ({
    messageId,
    senderId,
    content,
}) => {
    const found = await findMessageById(messageId);

    if (!found || found.message.senderId !== senderId) {
        return null;
    }

    const now = new Date();
    const { row } = found;

    await execute(
        `UPDATE messages_by_id
         SET content = ?, updated_at = ?
         WHERE message_id = ?`,
        [content, now, row.message_id]
    );

    await execute(
        `UPDATE messages_by_conversation
         SET content = ?, updated_at = ?
         WHERE conversation_id = ?
           AND created_at = ?
           AND message_id = ?`,
        [content, now, row.conversation_id, row.created_at, row.message_id]
    );

    return {
        ...found.message,
        content,
        updatedAt: now,
    };
};

export const softDeleteMessage = async ({ messageId, senderId }) => {
    const found = await findMessageById(messageId);

    if (!found || found.message.senderId !== senderId) {
        return null;
    }

    const now = new Date();
    const { row } = found;

    await execute(
        `UPDATE messages_by_id
         SET is_deleted = ?, updated_at = ?
         WHERE message_id = ?`,
        [true, now, row.message_id]
    );

    await execute(
        `UPDATE messages_by_conversation
         SET is_deleted = ?, updated_at = ?
         WHERE conversation_id = ?
           AND created_at = ?
           AND message_id = ?`,
        [true, now, row.conversation_id, row.created_at, row.message_id]
    );

    return {
        ...found.message,
        isDeleted: true,
        updatedAt: now,
    };
};
