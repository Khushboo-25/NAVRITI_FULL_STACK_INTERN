import { execute } from "../config/cassandra.js";
import { parseUuid, randomUuid } from "../utils/ids.js";
import { serializeConversation } from "../utils/serialize.js";

export const findConversationByParticipantKey = async (
    participantKey
) => {
    const result = await execute(
        `SELECT conversation_id
         FROM conversations_by_participant_key
         WHERE participant_key = ?`,
        [participantKey]
    );

    if (!result.rowLength) {
        return null;
    }

    return findConversationById(result.first().conversation_id);
};

export const findConversationById = async (conversationId) => {
    const result = await execute(
        `SELECT *
         FROM conversations
         WHERE conversation_id = ?`,
        [parseUuid(conversationId)]
    );

    if (!result.rowLength) {
        return null;
    }

    return serializeConversation(result.first());
};

export const findConversationsByIds = async (conversationIds) => {
    const conversations = await Promise.all(
        conversationIds.map((id) => findConversationById(id))
    );

    return conversations.filter(Boolean);
};

export const insertParticipantKeyIfNotExists = async (
    participantKey,
    conversationId
) => {
    const result = await execute(
        `INSERT INTO conversations_by_participant_key (
            participant_key,
            conversation_id
        ) VALUES (?, ?) IF NOT EXISTS`,
        [participantKey, parseUuid(conversationId)]
    );

    return result.wasApplied();
};

export const createConversation = async ({
    conversationId = randomUuid(),
    type,
    displayName = null,
    participantKey = null,
}) => {
    const id = parseUuid(conversationId);
    const now = new Date();

    await execute(
        `INSERT INTO conversations (
            conversation_id,
            type,
            display_name,
            participant_key,
            created_at,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
            id,
            type,
            displayName,
            participantKey,
            now,
            now,
        ]
    );

    return findConversationById(id);
};
