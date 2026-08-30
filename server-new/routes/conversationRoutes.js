const express = require("express");

const {
  create,
  getById,
  getByParticipant,
} = require("../controllers/conversationController");

const router = express.Router();

router.post("/", create);

router.get(
  "/by-participant/:participantKey",
  getByParticipant
);

router.get("/:id", getById);


module.exports = router;