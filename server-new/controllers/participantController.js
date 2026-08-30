const {
  addParticipant,
  getParticipantsByConversation,
  getConversationsByUser,
  removeParticipant,
} = require("../repositories/participantRepository");

async function add(req, res) {
  try {
    const participant = {
      conversation_id: req.params.conversationId,
      user_id: req.body.user_id,
      joined_at: new Date(),
    };

    await addParticipant(participant);

    res.status(201).json(participant);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to add participant",
    });
  }
}

async function getByConversation(req, res) {
  try {
    const participants =
      await getParticipantsByConversation(
        req.params.conversationId
      );

    res.json(participants);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch participants",
    });
  }
}

async function getByUser(req, res) {
  try {
    const conversations =
      await getConversationsByUser(req.params.userId);

    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch conversations",
    });
  }
}

async function remove(req, res) {
  try {
    await removeParticipant(
      req.params.conversationId,
      req.params.userId
    );

    res.json({
      message: "Participant removed",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to remove participant",
    });
  }
}

module.exports = {
  add,
  getByConversation,
  getByUser,
  remove,
};