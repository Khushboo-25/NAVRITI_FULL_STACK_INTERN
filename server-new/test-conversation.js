const cassandra = require("./config/cassandra");
const { randomUUID } = require("crypto");

const {
  createConversation,
  getConversationById,
  getConversationByParticipant,
} = require("./repositories/conversationRepository");

const conversationId = randomUUID();
const participantKey = "user-1:user-2";

async function test() {
  try {
    await cassandra.connect();

    const conversation = {
      id: conversationId,
      type: "direct",
      display_name: "Test Conversation",
      participant_key: participantKey,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await createConversation(conversation);
    console.log("✅ Conversation created");

    const byId = await getConversationById(conversationId);
    console.log("✅ By ID:", byId);

    const byParticipant =
      await getConversationByParticipant(participantKey);

    console.log("✅ By participant:", byParticipant);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await cassandra.shutdown();
  }
}

test();