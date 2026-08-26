import Message from "../models/message.js";
import cloudinary from "../config/cloudinary.js";
import Participant from "../models/participant.js";


const socketHandler = (io) => {
    io.on('connection', (socket) => 
        {

        console.log(`user connected:', ${socket.id}`);
        // =========================================================
        // Announcement WebRTC / Socket signaling
        // =========================================================

        socket.on(
            "joinAnnouncementRTC",
            ({ portalId, userId }) => {

                if (!portalId || !userId) {
                    return;
                }

                socket.join(
                    `announcement:${portalId}`
                );

                console.log(
                    `User ${userId} joined announcement RTC room: ${portalId}`
                );

                socket.to(
                    `announcement:${portalId}`
                ).emit(
                    "announcement:userJoined",
                    {
                        userId,
                    }
                );
            }
        );


        socket.on(
            "leaveAnnouncementRTC",
            ({ portalId, userId }) => {

                if (!portalId || !userId) {
                    return;
                }

                socket.leave(
                    `announcement:${portalId}`
                );

                socket.to(
                    `announcement:${portalId}`
                ).emit(
                    "announcement:userLeft",
                    {
                        userId,
                    }
                );

                console.log(
                    `User ${userId} left announcement RTC room: ${portalId}`
                );
            }
        );
        // =========================================================
        // Announcement WebRTC signaling
        // =========================================================

        socket.on(
            "announcement:offer",
            ({ portalId, userId, offer }) => {

                if (!portalId || !userId || !offer) {
                    return;
                }

                socket.to(
                    `announcement:${portalId}`
                ).emit(
                    "announcement:offer",
                    {
                        userId,
                        offer,
                    }
                );
            }
        );


        socket.on(
            "announcement:answer",
            ({ portalId, userId, answer }) => {

                if (!portalId || !userId || !answer) {
                    return;
                }

                socket.to(
                    `announcement:${portalId}`
                ).emit(
                    "announcement:answer",
                    {
                        userId,
                        answer,
                    }
                );
            }
        );


        socket.on(
            "announcement:ice-candidate",
            ({ portalId, userId, candidate }) => {

                if (!portalId || !userId || !candidate) {
                    return;
                }

                socket.to(
                    `announcement:${portalId}`
                ).emit(
                    "announcement:ice-candidate",
                    {
                        userId,
                        candidate,
                    }
                );
            }
        );
       
       
       
        // Join personal user room

        socket.on("joinUser", (userId) => {
            socket.join(`user:${userId}`);

            console.log(
                `User ${userId} joined personal room`
            );
        });


        




        // Handle joining a existing conversation
        socket.on("joinConversation", (conversationId) => {
            socket.join(conversationId);
            console.log(`user ${socket.id} joined conversation: ${conversationId}`);
        });

        // Handle sending messages
        socket.on(
            "sendMessage",
            async (data, acknowledge) => {
                try {
                    const message =
                        await Message.create({
                            conversationId:
                                data.conversationId,
                            senderId:
                                data.senderId,
                            content:
                                data.content,
                            messageType:
                                data.messageType || "text",
                            attachment:
                                data.attachment || null,
                            status: "sent",
                        });


                    /*
                    * Send to users already inside
                    * the conversation room.
                    */

                    io.to(
                        data.conversationId
                    ).emit(
                        "newMessage",
                        message
                    );


                    /*
                    * Notify participants through their
                    * personal rooms.
                    *
                    * Frontend can use this event to refresh
                    * the conversation list when needed.
                    */

                    const participants =
                        await Participant.find({
                            conversationId:
                                data.conversationId,
                        });

                    participants.forEach(
                        (participant) => {
                            io.to(
                                `user:${participant.userId}`
                            ).emit(
                                "conversationUpdated",
                                {
                                    conversationId:
                                        data.conversationId,
                                }
                            );
                        }
                    );


                    acknowledge?.({
                        ok: true,
                        message,
                    });

                    console.log(
                        "Message Sent:",
                        message._id
                    );

                } catch (error) {

                    console.error(
                        "Error sending message:",
                        error.message
                    );

                    acknowledge?.({
                        ok: false,
                        message:
                            error.message,
                    });
                }
            }
        );

        //Handle editing messages
        socket.on("editMessage", async (data) => {
            try {
                const message = await Message.findOneAndUpdate(
                    {
                        _id: data.messageId,
                        senderId: data.senderId
                    },
                    {
                        $set: {
                            content: data.content
                        }
                    },
                    {
                        new: true
                    }
                );

                if (!message) {
                    console.error(
                        "Message not found or user cannot edit it"
                    );
                    return;
                }

                // Notify everyone in the conversation
                io.to(message.conversationId.toString()).emit(
                    "messageUpdated",
                    message
                );

                console.log("Message Edited:", message._id);
            } catch (error) {
                console.error(
                "Error editing message:",
                error.message
                );
            }
        });


        //Delete the message
        socket.on("deleteMessage", async (data) => {
            try {
                const message = await Message.findOne({
                    _id: data.messageId,
                    senderId: data.senderId,
                });

                if (!message) {
                    console.error("Message not found");
                    return;
                }

                /*
                * Delete file from Cloudinary
                */
                if (
                    message.messageType === "file" &&
                    message.attachment?.publicId
                ) {
                    try {
                        await cloudinary.uploader.destroy(
                            message.attachment.publicId,
                            {
                                resource_type: message.attachment.resourceType,
                            }
                        );

                        console.log(
                            "Cloudinary file deleted:",
                            message.attachment.publicId
                        );

                    } catch (cloudinaryError) {
                        console.error(
                            "Cloudinary delete failed:",
                            cloudinaryError.message
                        );

                        return;
                    }
                }

                /*
                * Soft delete message
                */
                message.isDeleted = true;

                await message.save();

                io.to(
                    message.conversationId.toString()
                ).emit(
                    "messageDeleted",
                    message
                );

                console.log(
                    "Message Deleted:",
                    message._id
                );

            } catch (error) {
                console.error(
                    "Error deleting message:",
                    error.message
                );
            }
        });
        
        socket.on("leaveConversation", (conversationId) => {
            socket.leave(conversationId);

            console.log(
                `user ${socket.id} left conversation: ${conversationId}`
            );
        });
        

        socket.on('disconnect', () => {
            console.log(`user disconnected: ${socket.id}`);
        });

        

    });


    
    
};





export default socketHandler;