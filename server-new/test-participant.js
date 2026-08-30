const cassandra = require("./config/cassandra");
const { randomUUID } = require("crypto");

const {
  addParticipant,
  getParticipantsByConversation,
  getConversationsByUser,
  removeParticipant,
} = require("./repositories/participantRepository");

const conversationId = randomUUID();
const userId = "test-user-1";

async function test() {
  try {
    await cassandra.connect();

    const participant = {
      conversation_id: conversationId,
      user_id: userId,
      joined_at: new Date(),
    };

    await addParticipant(participant);
    console.log("✅ Participant added");

    const participants =
      await getParticipantsByConversation(conversationId);

    console.log("✅ Participants:", participants);

    const conversations =
      await getConversationsByUser(userId);

    console.log("✅ User conversations:", conversations);

    await removeParticipant(conversationId, userId);
    console.log("✅ Participant removed");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await cassandra.shutdown();
  }
}

test();