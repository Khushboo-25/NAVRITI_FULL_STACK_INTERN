const express = require("express");

const {
  add,
  getByConversation,
  getByUser,
  remove,
} = require("../controllers/participantController");

const router = express.Router();

router.post(
  "/:conversationId/participants",
  add
);

router.get(
  "/:conversationId/participants",
  getByConversation
);

router.get(
  "/users/:userId/conversations",
  getByUser
);

router.delete(
  "/:conversationId/participants/:userId",
  remove
);


module.exports = router;