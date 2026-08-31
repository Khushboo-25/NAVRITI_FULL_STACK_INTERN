import { findMessagesByConversation } from "../repositories/messageRepository.js";

const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { limit = 100, before } = req.query;

        let beforeDate = null;

        // Load messages older than the given timestamp
        if (before) {
            beforeDate = new Date(before);

            if (isNaN(beforeDate.getTime())) {
                return res.status(400).json({
                    message: "Invalid before timestamp",
                });
            }
        }

        const messages = await findMessagesByConversation({
            conversationId,
            before: beforeDate,
            limit: parseInt(limit, 10),
        });

        // Return oldest → newest to the frontend
        messages.reverse();

        res.status(200).json(messages);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch messages",
            error: error.message,
        });
    }
};

export default getMessages;
