const client = require("../config/cassandra");

async function createMessage(message) {
  const query = `
    INSERT INTO message_by_conversation (
      conversation_id,
      created_at,
      id,
      sender_id,
      content,
      message_type,
      attachment,
      status,
      is_deleted
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await client.execute(
    query,
    [
      message.conversation_id,
      message.created_at,
      message.id,
      message.sender_id,
      message.content,
      message.message_type,
      message.attachment,
      message.status,
      message.is_deleted,
    ],
    { prepare: true }
  );

  return message;
}

async function getMessagesByConversation(conversationId) {
  const result = await client.execute(
    `
      SELECT *
      FROM message_by_conversation
      WHERE conversation_id = ?
    `,
    [conversationId],
    { prepare: true }
  );

  return result.rows;
}

async function getMessagesBefore(conversationId, before) {
  const result = await client.execute(
    `
      SELECT *
      FROM message_by_conversation
      WHERE conversation_id = ?
        AND created_at < ?
    `,
    [conversationId, before],
    { prepare: true }
  );

  return result.rows;
}

async function deleteMessage(conversationId, createdAt, id) {
  await client.execute(
    `
      DELETE FROM message_by_conversation
      WHERE conversation_id = ?
        AND created_at = ?
        AND id = ?
    `,
    [conversationId, createdAt, id],
    { prepare: true }
  );
}

module.exports = {
  createMessage,
  getMessagesByConversation,
  getMessagesBefore,
  deleteMessage,
};