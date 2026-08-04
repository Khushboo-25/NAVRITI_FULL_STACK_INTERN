import express from "express";
import { createOrGetSession,
    getUserConversations,createGroup
 } from "../controllers/conversationController.js";

const router = express.Router();

router.post("/session", createOrGetSession);
router.get("/user/:userId", getUserConversations);
router.post("/group", createGroup);
export default router;