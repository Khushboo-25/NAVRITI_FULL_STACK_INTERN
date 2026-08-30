const client = require("../config/cassandra");

async function createConversation(conversation) {
  const conversationQuery = `
    INSERT INTO conversation (
      id,
      type,
      display_name,
      participant_key,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const participantQuery = `
    INSERT INTO conversation_by_participant (
      participant_key,
      conversation_id
    )
    VALUES (?, ?)
  `;

  await Promise.all([
    client.execute(
      conversationQuery,
      [
        conversation.id,
        conversation.type,
        conversation.display_name,
        conversation.participant_key,
        conversation.created_at,
        conversation.updated_at,
      ],
      { prepare: true }
    ),

    client.execute(
      participantQuery,
      [
        conversation.participant_key,
        conversation.id,
      ],
      { prepare: true }
    ),
  ]);

  return conversation;
}

async function getConversationById(id) {
  const result = await client.execute(
    `
      SELECT *
      FROM conversation
      WHERE id = ?
    `,
    [id],
    { prepare: true }
  );

  return result.rows[0] || null;
}

async function getConversationByParticipant(participantKey) {
  const result = await client.execute(
    `
      SELECT conversation_id
      FROM conversation_by_participant
      WHERE participant_key = ?
    `,
    [participantKey],
    { prepare: true }
  );

  if (!result.rows[0]) {
    return null;
  }

  return getConversationById(result.rows[0].conversation_id);
}

module.exports = {
  createConversation,
  getConversationById,
  getConversationByParticipant,
};