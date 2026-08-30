const client = require("../config/cassandra");

async function addParticipant(participant) {
  await Promise.all([
    client.execute(
      `
        INSERT INTO participant_by_conversation
        (conversation_id, user_id, joined_at)
        VALUES (?, ?, ?)
      `,
      [
        participant.conversation_id,
        participant.user_id,
        participant.joined_at,
      ],
      { prepare: true }
    ),

    client.execute(
      `
        INSERT INTO participant_by_user
        (user_id, conversation_id, joined_at)
        VALUES (?, ?, ?)
      `,
      [
        participant.user_id,
        participant.conversation_id,
        participant.joined_at,
      ],
      { prepare: true }
    ),
  ]);

  return participant;
}

async function getParticipantsByConversation(conversationId) {
  const result = await client.execute(
    `
      SELECT *
      FROM participant_by_conversation
      WHERE conversation_id = ?
    `,
    [conversationId],
    { prepare: true }
  );

  return result.rows;
}

async function getConversationsByUser(userId) {
  const result = await client.execute(
    `
      SELECT *
      FROM participant_by_user
      WHERE user_id = ?
    `,
    [userId],
    { prepare: true }
  );

  return result.rows;
}

async function removeParticipant(conversationId, userId) {
  await Promise.all([
    client.execute(
      `
        DELETE FROM participant_by_conversation
        WHERE conversation_id = ? AND user_id = ?
      `,
      [conversationId, userId],
      { prepare: true }
    ),

    client.execute(
      `
        DELETE FROM participant_by_user
        WHERE user_id = ? AND conversation_id = ?
      `,
      [userId, conversationId],
      { prepare: true }
    ),
  ]);
}

module.exports = {
  addParticipant,
  getParticipantsByConversation,
  getConversationsByUser,
  removeParticipant,
};