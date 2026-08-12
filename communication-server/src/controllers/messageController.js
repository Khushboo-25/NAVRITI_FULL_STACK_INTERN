import Message from "../models/message.js";

const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { limit = 100, before } = req.query;

        const query = {
            conversationId,
        };

        // Load messages older than the given timestamp
        if (before) {
            const beforeDate = new Date(before);

            if (isNaN(beforeDate.getTime())) {
                return res.status(400).json({
                    message: "Invalid before timestamp",
                });
            }

            query.createdAt = {
                $lt: beforeDate,
            };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit));

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