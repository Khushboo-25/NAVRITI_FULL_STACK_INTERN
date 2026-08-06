import Conversation from "../models/conversation.js";
import Participant from "../models/participant.js";
import Message from "../models/message.js";



// direct chat between two users
export const createOrGetDirect = async (req, res) => {
  try {
    const { currentUserId, targetUserId } = req.body;

    if (!currentUserId || !targetUserId) {
      return res.status(400).json({
        message: "currentUserId and targetUserId are required.",
      });
    }

    // Find all direct conversations of current user
    const currentUserParticipants = await Participant.find({
      userId: currentUserId,
    });

    for (const participant of currentUserParticipants) {

      const conversation = await Conversation.findById(
        participant.conversationId
      );

      // Skip if not found or not a direct chat
      if (!conversation || conversation.type !== "direct") {
        continue;
      }

      // Get all participants of this conversation
      const conversationParticipants = await Participant.find({
        conversationId: conversation._id,
      });

      // Direct chat must contain exactly two users
      if (conversationParticipants.length !== 2) {
        continue;
      }

      // Check if target user is the second participant
      const exists = conversationParticipants.some(
        (participant) => participant.userId === targetUserId
      );

      if (exists) {
        return res.status(200).json({
          conversationId: conversation._id,
        });
      }
    }

    // No conversation exists -> create one
    const conversation = await Conversation.create({
      type: "direct",
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
    return res.status(500).json({
      message: error.message,
    });
  }
};


export const getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find all participant records for this user
    const participants = await Participant.find({ userId });

    // Extract conversation IDs
    const conversationIds = participants.map(
      (participant) => participant.conversationId
    );

    // Fetch conversations
    const conversations = await Conversation.find({
      _id: { $in: conversationIds },
    }).sort({ createdAt: -1 });

    const response = [];

for (const conversation of conversations) {

    let displayName = conversation.displayName;
    
    // For direct chats, show the other participant
    if (conversation.type === "direct") {


        const conversationParticipants = await Participant.find({
            conversationId: conversation._id,
        });

        const otherParticipant = conversationParticipants.find(
            (participant) => participant.userId !== userId
        );

        displayName = otherParticipant
            ? otherParticipant.userId
            : "Unknown";
    }

    // Fetch latest message
    const lastMessage = await Message.findOne({
        conversationId: conversation._id,
    }).sort({ createdAt: -1 });

    response.push({
        conversationId: conversation._id,
        type: conversation.type,
        displayName,

        lastMessage: lastMessage
            ? lastMessage.content
            : "",

        lastMessageTime: lastMessage
            ? lastMessage.createdAt
            : null,
    });
}

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

    if (
      !groupName.trim() ||
      !currentUserId ||
      !participants || participants.length === 0
    ) {
      return res.status(400).json({
        message: "Invalid request",
      });
    }

    const conversation =
      await Conversation.create({
        type: "group",
        displayName: groupName,
      });

    const allParticipants = [
      currentUserId,
      ...participants,
    ];

    await Participant.insertMany(
      allParticipants.map((userId) => ({
        userId,
        conversationId: conversation._id,
      }))
    );

    res.status(201).json({
      conversationId: conversation._id,
      displayName: groupName,
      participants: allParticipants,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};