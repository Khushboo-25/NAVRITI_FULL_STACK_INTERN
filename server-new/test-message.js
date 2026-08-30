const cassandra = require("./config/cassandra");
const { randomUUID } = require("crypto");

const {
  createMessage,
  getMessagesByConversation,
  getMessagesBefore,
  deleteMessage,
} = require("./repositories/messageRepository");

const conversationId = randomUUID();
const messageId = randomUUID();
const createdAt = new Date();

async function test() {
  try {
    await cassandra.connect();

    const message = {
      conversation_id: conversationId,
      created_at: createdAt,
      id: messageId,
      sender_id: "test-user-1",
      content: "Hello Cassandra!",
      message_type: "text",
      attachment: null,
      status: "sent",
      is_deleted: false,
    };

    await createMessage(message);
    console.log("✅ Message created");

    const messages =
      await getMessagesByConversation(conversationId);

    console.log("✅ Messages:", messages);

    const olderMessages =
      await getMessagesBefore(
        conversationId,
        new Date(Date.now() + 1000)
      );

    console.log("✅ Messages before:", olderMessages);

    await deleteMessage(
      conversationId,
      createdAt,
      messageId
    );

    console.log("✅ Message deleted");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await cassandra.shutdown();
  }
}

test();