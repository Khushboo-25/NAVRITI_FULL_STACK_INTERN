const { randomUUID } = require("crypto");

const {
  createConversation,
  getConversationById,
  getConversationByParticipant,
} = require("../repositories/conversationRepository");

async function create(req, res) {
  try {
    const now = new Date();

    const conversation = {
      id: randomUUID(),
      type: req.body.type,
      display_name: req.body.display_name || null,
      participant_key: req.body.participant_key || null,
      created_at: now,
      updated_at: now,
    };

    await createConversation(conversation);

    res.status(201).json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to create conversation",
    });
  }
}

async function getById(req, res) {
  try {
    const conversation = await getConversationById(
      req.params.id
    );

    if (!conversation) {
      return res.status(404).json({
        error: "Conversation not found",
      });
    }

    res.json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch conversation",
    });
  }
}

async function getByParticipant(req, res) {
  try {
    const conversation =
      await getConversationByParticipant(
        req.params.participantKey
      );

    if (!conversation) {
      return res.status(404).json({
        error: "Conversation not found",
      });
    }

    res.json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch conversation",
    });
  }
}

module.exports = {
  create,
  getById,
  getByParticipant,
};