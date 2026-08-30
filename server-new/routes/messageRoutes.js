const express = require("express");

const {
  create,
  getByConversation,
  getBefore,
  remove,
} = require("../controllers/messageController");

const router = express.Router();

router.post("/:conversationId/messages", create);

router.get(
  "/:conversationId/messages/before",
  getBefore
);

router.get(
  "/:conversationId/messages",
  getByConversation
);

router.delete(
  "/:conversationId/messages/:id",
  remove
);

module.exports = router;