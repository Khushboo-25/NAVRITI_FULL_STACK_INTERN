import {
    createConversation,
    findConversationByParticipantKey,
    findConversationsByIds,
    insertParticipantKeyIfNotExists,
} from "../repositories/conversationRepository.js";
import {
    createParticipants,
    findParticipantsByConversationId,
    findParticipantsByUserId,
} from "../repositories/participantRepository.js";
import { findLatestMessageByConversation } from "../repositories/messageRepository.js";
import { randomUuid } from "../utils/ids.js";


// direct chat between two users
export const createOrGetDirect = async (req, res) => {
  try {
    
    const { currentUserId, targetUserId } = req.body;
    const participantKey = [currentUserId, targetUserId]
        .sort()
        .join(":");

    let conversation = await findConversationByParticipantKey(
        participantKey
    );

    if (!conversation) {
        try {
            const conversationId = randomUuid();
            const applied =
                await insertParticipantKeyIfNotExists(
                    participantKey,
                    conversationId
                );

            if (!applied) {
                conversation =
                    await findConversationByParticipantKey(
                        participantKey
                    );
            } else {
                conversation = await createConversation({
                    conversationId,
                    type: "direct",
                    participantKey,
                });

                await createParticipants([
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
            }

        } catch (error) {
            conversation = await findConversationByParticipantKey(
                participantKey
            );

            if (!conversation) {
                throw error;
            }
        }
    }

    if (!conversation) {
        return res.status(500).json({
            message: "Failed to create or get conversation",
        });
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
        const participants = await findParticipantsByUserId(
            userId
        );

        // Extract conversation IDs
        const conversationIds = participants.map(
            (participant) =>
                participant.conversationId
        );

        // Fetch conversations
        const conversations = (
            await findConversationsByIds(conversationIds)
        ).sort((a, b) => {
            const timeA = a.createdAt
                ? new Date(a.createdAt).getTime()
                : 0;
            const timeB = b.createdAt
                ? new Date(b.createdAt).getTime()
                : 0;
            return timeB - timeA;
        });

        const response = [];

        for (const conversation of conversations) {

            let displayName =
                conversation.displayName;

            // Get ALL participants of this conversation
            const conversationParticipants =
                await findParticipantsByConversationId(
                    conversation._id
                );

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
                await findLatestMessageByConversation(
                    conversation._id
                );
            
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
            await createConversation({
                type: "group",
                displayName:
                    groupName.trim(),
            });


        // -----------------------------
        // Create participants
        // -----------------------------

        await createParticipants(
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
