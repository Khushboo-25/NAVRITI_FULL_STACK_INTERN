const { randomUUID } = require("crypto");

const {
  createMessage,
  getMessagesByConversation,
  getMessagesBefore,
  deleteMessage,
} = require("../repositories/messageRepository");

async function create(req, res) {
  try {
    const message = {
      conversation_id: req.params.conversationId,
      created_at: new Date(),
      id: randomUUID(),
      sender_id: req.body.sender_id,
      content: req.body.content || null,
      message_type: req.body.message_type || "text",
      attachment: req.body.attachment || null,
      status: req.body.status || "sent",
      is_deleted: false,
    };

    await createMessage(message);

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to create message",
    });
  }
}

async function getByConversation(req, res) {
  try {
    const messages = await getMessagesByConversation(
      req.params.conversationId
    );

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch messages",
    });
  }
}

async function getBefore(req, res) {
  try {
    const before = req.query.before
      ? new Date(req.query.before)
      : new Date();

    const messages = await getMessagesBefore(
      req.params.conversationId,
      before
    );

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch older messages",
    });
  }
}

async function remove(req, res) {
  try {
    const { conversationId, id } = req.params;

    const messages = await getMessagesByConversation(
      conversationId
    );

    const message = messages.find(
      (item) => item.id.toString() === id
    );

    if (!message) {
      return res.status(404).json({
        error: "Message not found",
      });
    }

    await deleteMessage(
      conversationId,
      message.created_at,
      message.id
    );

    res.json({
      message: "Message deleted",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to delete message",
    });
  }
}

module.exports = {
  create,
  getByConversation,
  getBefore,
  remove,
};