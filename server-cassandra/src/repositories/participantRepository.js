import { execute } from "../config/cassandra.js";
import { parseUuid } from "../utils/ids.js";

export const createParticipant = async ({
    userId,
    conversationId,
    joinedAt = new Date(),
}) => {
    const conversationUuid = parseUuid(conversationId);

    await execute(
        `INSERT INTO participants_by_conversation (
            conversation_id,
            user_id,
            joined_at
        ) VALUES (?, ?, ?)`,
        [conversationUuid, userId, joinedAt]
    );

    await execute(
        `INSERT INTO participants_by_user (
            user_id,
            conversation_id,
            joined_at
        ) VALUES (?, ?, ?)`,
        [userId, conversationUuid, joinedAt]
    );
};

export const createParticipants = async (participants) => {
    for (const participant of participants) {
        await createParticipant(participant);
    }
};

export const findParticipantsByUserId = async (userId) => {
    const result = await execute(
        `SELECT user_id, conversation_id, joined_at
         FROM participants_by_user
         WHERE user_id = ?`,
        [userId]
    );

    return result.rows.map((row) => ({
        userId: row.user_id,
        conversationId: String(row.conversation_id),
        joinedAt: row.joined_at,
    }));
};

export const findParticipantsByConversationId = async (
    conversationId
) => {
    const result = await execute(
        `SELECT user_id, conversation_id, joined_at
         FROM participants_by_conversation
         WHERE conversation_id = ?`,
        [parseUuid(conversationId)]
    );

    return result.rows.map((row) => ({
        userId: row.user_id,
        conversationId: String(row.conversation_id),
        joinedAt: row.joined_at,
    }));
};
