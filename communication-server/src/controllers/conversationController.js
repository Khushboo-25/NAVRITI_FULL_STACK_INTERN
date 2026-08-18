import Conversation from "../models/conversation.js";
import Participant from "../models/participant.js";
import Message from "../models/message.js";


// direct chat between two users
export const createOrGetDirect = async (req, res) => {
  try {
    
    const { currentUserId, targetUserId } = req.body;
    const participantKey = [currentUserId, targetUserId]
        .sort()
        .join(":");

    let conversation = await Conversation.findOne({
        participantKey,
    });

    if (!conversation) {
        try {
            conversation = await Conversation.create({
                type: "direct",
                participantKey,
            });

            await Participant.create([
                {
                    userId: currentUserId,
                    conversationId: conversation._id,
                },
                {
                    userId: targetUserId,
                    conversationId: conversation._id,
                },
            ]);

            return res.status(201).json({
                conversationId: conversation._id,
            });

        } catch (error) {
            // Another simultaneous request may have created it
            if (error.code === 11000) {
                conversation = await Conversation.findOne({
                    participantKey,
                });
            } else {
                throw error;
            }
        }
    }

    return res.status(200).json({
        conversationId: conversation._id,
    });


  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


export const getUserConversations = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find all participant records for this user
        const participants = await Participant.find({
            userId,
        });

        // Extract conversation IDs
        const conversationIds = participants.map(
            (participant) =>
                participant.conversationId
        );

        // Fetch conversations
        const conversations = await Conversation.find({
            _id: {
                $in: conversationIds,
            },
        }).sort({
            createdAt: -1,
        });

        const response = [];

        for (const conversation of conversations) {

            let displayName =
                conversation.displayName;

            // Get ALL participants of this conversation
            const conversationParticipants =
                await Participant.find({
                    conversationId:
                        conversation._id,
                });

            // Extract participant user IDs
            const participantIds =
                conversationParticipants.map(
                    (participant) =>
                        participant.userId
                );

            // Direct chat:
            // show the other participant
            if (
                conversation.type ===
                "direct"
            ) {
                const otherParticipant =
                    conversationParticipants.find(
                        (participant) =>
                            participant.userId !==
                            userId
                    );

                displayName =
                    otherParticipant
                        ? otherParticipant.userId
                        : "Unknown";
            }

            // Fetch latest message
            const lastMessage =
                await Message.findOne({
                    conversationId:
                        conversation._id,
                }).sort({
                    createdAt: -1,
                });
            
            response.push({
                conversationId:
                    conversation._id,

                type:
                    conversation.type,

                displayName,

                // ⭐ Important for mentions
                participants:
                    participantIds,

                lastMessage:
                    !lastMessage
                        ? ""
                        : lastMessage.isDeleted
                            ? "Message deleted"
                            : lastMessage.messageType === "file"
                                ? `📎 ${
                                    lastMessage.attachment?.originalName ||
                                    lastMessage.attachment?.fileName ||
                                    "File"
                                }`
                                : lastMessage.content || "",

                lastMessageTime:
                    lastMessage
                        ? lastMessage.createdAt
                        : null,
            });
        }


        // ⭐ Sort by latest message
        response.sort((a, b) => {
            const timeA = a.lastMessageTime
                ? new Date(a.lastMessageTime).getTime()
                : 0;

            const timeB = b.lastMessageTime
                ? new Date(b.lastMessageTime).getTime()
                : 0;

            return timeB - timeA;
        });


        res.status(200).json(response);

    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const createGroup = async (req, res) => {
    try {
        const {
            groupName,
            currentUserId,
            participants,
        } = req.body;


        // -----------------------------
        // Validate request
        // -----------------------------

        if (
            !groupName?.trim() ||
            !currentUserId ||
            !Array.isArray(participants) ||
            participants.length === 0
        ) {
            return res.status(400).json({
                message: "Invalid request",
            });
        }


        // -----------------------------
        // Remove duplicate users
        // -----------------------------

        const allParticipants = [
            ...new Set([
                currentUserId,
                ...participants,
            ]),
        ];


        // -----------------------------
        // Create conversation
        // -----------------------------

        const conversation =
            await Conversation.create({
                type: "group",
                displayName:
                    groupName.trim(),
            });


        // -----------------------------
        // Create participants
        // -----------------------------

        await Participant.insertMany(
            allParticipants.map(
                (userId) => ({
                    userId,
                    conversationId:
                        conversation._id,
                })
            )
        );


        // -----------------------------
        // Response
        // -----------------------------

        return res.status(201).json({
            conversationId:
                conversation._id,

            displayName:
                conversation.displayName,

            participants:
                allParticipants,
        });

    } catch (error) {

        console.error(
            "CREATE GROUP ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to create group",

            error:
                error.message,
        });
    }
};