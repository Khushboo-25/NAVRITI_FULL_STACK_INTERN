import cloudinary from "../config/cloudinary.js";

import {
    createMessage,
    findMessageById,
    updateMessageContent,
    softDeleteMessage,
    getLatestMessage,
} from "../repositories/messageRepository.js";

import {
    getByConversationId,
} from "../repositories/participantRepository.js";


/*
 * =========================================================
 * Notify every participant of a conversation
 *
 * Every user has a personal socket room:
 *
 * user:${userId}
 *
 * This allows conversation list updates even when the
 * conversation itself is not currently open.
 * =========================================================
 */

const notifyConversationParticipants = async (
    io,
    conversationId,
    latestMessage
) => {
    if (!conversationId) {
        return;
    }

    try {
        const participants =
            await getByConversationId(
                conversationId
            );

        console.log(
            "REALTIME CONVERSATION UPDATE:",
            {
                conversationId,
                latestMessageId:
                    latestMessage?._id,
                participants,
            }
        );

        participants.forEach(
            (participant) => {

                console.log(
                    "EMITTING conversationUpdated TO:",
                    `user:${participant.user_id}`
                );

                io.to(
                    `user:${participant.user_id}`
                ).emit(
                    "conversationUpdated",
                    {
                        conversationId,
                        latestMessage,
                    }
                );
            }
        );

    } catch (error) {
        console.error(
            "Failed to notify conversation participants:",
            error.message
        );
    }
};


const socketHandler = (io) => {

    io.on(
        "connection",
        (socket) => {

            console.log(
                `user connected: ${socket.id}`
            );


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
                ({
                    portalId,
                    userId,
                    offer,
                }) => {

                    if (
                        !portalId ||
                        !userId ||
                        !offer
                    ) {
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
                ({
                    portalId,
                    userId,
                    answer,
                }) => {

                    if (
                        !portalId ||
                        !userId ||
                        !answer
                    ) {
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
                ({
                    portalId,
                    userId,
                    candidate,
                }) => {

                    if (
                        !portalId ||
                        !userId ||
                        !candidate
                    ) {
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


            // =========================================================
            // One-to-one screen sharing WebRTC signaling
            // =========================================================

            socket.on(
                "screenShare:offer",
                ({ conversationId, userId, offer }) => {

                    console.log(
                        "SCREEN SHARE OFFER:",
                        {
                            socketId: socket.id,
                            conversationId,
                            userId,
                        }
                    );

                    if (!conversationId || !userId || !offer) {
                        console.log(
                            "SCREEN SHARE OFFER INVALID"
                        );
                        return;
                    }

                    socket.to(conversationId).emit(
                        "screenShare:offer",
                        {
                            userId,
                            offer,
                        }
                    );
                }
            );


            socket.on(
                "screenShare:answer",
                ({ conversationId, userId, answer }) => {

                    console.log(
                        "SCREEN SHARE ANSWER:",
                        {
                            socketId: socket.id,
                            conversationId,
                            userId,
                        }
                    );

                    if (!conversationId || !userId || !answer) {
                        return;
                    }

                    socket.to(conversationId).emit(
                        "screenShare:answer",
                        {
                            userId,
                            answer,
                        }
                    );
                }
            );


            socket.on(
                "screenShare:ice-candidate",
                ({ conversationId, userId, candidate }) => {

                    console.log(
                        "SCREEN SHARE ICE:",
                        {
                            socketId: socket.id,
                            conversationId,
                            userId,
                        }
                    );

                    if (
                        !conversationId ||
                        !userId ||
                        !candidate
                    ) {
                        return;
                    }

                    socket.to(conversationId).emit(
                        "screenShare:ice-candidate",
                        {
                            userId,
                            candidate,
                        }
                    );
                }
            );


            socket.on(
                "screenShare:started",
                ({ conversationId, userId }) => {

                    console.log(
                        "SCREEN SHARE STARTED:",
                        {
                            socketId: socket.id,
                            conversationId,
                            userId,
                        }
                    );

                    if (!conversationId || !userId) {
                        return;
                    }

                    socket.to(conversationId).emit(
                        "screenShare:started",
                        {
                            userId,
                        }
                    );
                }
            );


            socket.on(
                "screenShare:stopped",
                ({ conversationId, userId }) => {

                    console.log(
                        "SCREEN SHARE STOPPED:",
                        {
                            socketId: socket.id,
                            conversationId,
                            userId,
                        }
                    );

                    if (!conversationId || !userId) {
                        return;
                    }

                    socket.to(conversationId).emit(
                        "screenShare:stopped",
                        {
                            userId,
                        }
                    );
                }
            );


            // =========================================================
            // Personal user room
            //
            // Frontend joins:
            // user:${userId}
            //
            // This room is used for conversation list updates.
            // =========================================================

            socket.on(
                "joinUser",
                (userId) => {

                    if (!userId) {
                        return;
                    }

                    socket.join(
                        `user:${userId}`
                    );

                    console.log(
                        `User ${userId} joined personal room`
                    );

                }
            );


            // =========================================================
            // Join conversation
            // =========================================================

            socket.on(
                "joinConversation",
                (conversationId) => {

                    if (!conversationId) {
                        return;
                    }

                    socket.join(
                        conversationId
                    );

                    console.log(
                        `user ${socket.id} joined conversation: ${conversationId}`
                    );

                }
            );


            // =========================================================
            // Send message
            // =========================================================

            socket.on(
                "sendMessage",
                async (
                    data,
                    acknowledge
                ) => {

                    try {

                        if (
                            !data?.conversationId ||
                            !data?.senderId
                        ) {

                            acknowledge?.({
                                ok: false,
                                message:
                                    "conversationId and senderId are required",
                            });

                            return;
                        }


                        const message =
                            await createMessage({
                                conversationId:
                                    data.conversationId,

                                senderId:
                                    data.senderId,

                                content:
                                    data.content || "",

                                messageType:
                                    data.messageType ||
                                    "text",

                                attachment:
                                    data.attachment ||
                                    null,

                                status:
                                    "sent",
                            });


                        /*
                         * -----------------------------------------
                         * Send message to everyone currently
                         * inside the conversation.
                         * -----------------------------------------
                         */

                        io.to(
                            data.conversationId
                        ).emit(
                            "newMessage",
                            message
                        );


                        /*
                         * -----------------------------------------
                         * IMPORTANT:
                         *
                         * Notify every participant through their
                         * personal room.
                         *
                         * This works even if the receiver has NOT
                         * opened this conversation.
                         *
                         * latestMessage is included so frontend
                         * does not need another REST request.
                         * -----------------------------------------
                         */

                        await notifyConversationParticipants(
                            io,
                            data.conversationId,
                            message
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


            // =========================================================
            // Edit message
            // =========================================================

            socket.on(
                "editMessage",
                async (data) => {

                    try {

                        if (
                            !data?.messageId ||
                            !data?.senderId
                        ) {
                            return;
                        }


                        const message =
                            await updateMessageContent({
                                messageId:
                                    data.messageId,

                                senderId:
                                    data.senderId,

                                content:
                                    data.content,
                            });


                        if (!message) {

                            console.error(
                                "Message not found or user cannot edit it"
                            );

                            return;
                        }


                        /*
                         * -----------------------------------------
                         * Update currently opened conversation.
                         * -----------------------------------------
                         */

                        io.to(
                            message.conversationId
                        ).emit(
                            "messageUpdated",
                            message
                        );


                        /*
                         * -----------------------------------------
                         * Find the actual latest message.
                         *
                         * Important:
                         * Edited message may NOT be the latest
                         * message.
                         * -----------------------------------------
                         */

                        const latestMessage =
                            await getLatestMessage(
                                message.conversationId
                            );


                        /*
                         * -----------------------------------------
                         * Update sidebar for EVERY participant.
                         * -----------------------------------------
                         */

                        await notifyConversationParticipants(
                            io,
                            message.conversationId,
                            latestMessage
                        );


                        console.log(
                            "Message Edited:",
                            message._id
                        );

                    } catch (error) {

                        console.error(
                            "Error editing message:",
                            error.message
                        );

                    }

                }
            );


            // =========================================================
            // Delete message
            // =========================================================

            socket.on(
                "deleteMessage",
                async (data) => {

                    try {

                        if (
                            !data?.messageId ||
                            !data?.senderId
                        ) {
                            return;
                        }


                        /*
                         * -----------------------------------------
                         * Find original message.
                         * -----------------------------------------
                         */

                        const message =
                            await findMessageById(
                                data.messageId
                            );


                        if (!message) {

                            console.error(
                                "Message not found"
                            );

                            return;
                        }


                        /*
                         * -----------------------------------------
                         * Only sender can delete.
                         * -----------------------------------------
                         */

                        if (
                            message.senderId !==
                            data.senderId
                        ) {

                            console.error(
                                "User cannot delete this message"
                            );

                            return;
                        }


                        /*
                         * -----------------------------------------
                         * Delete file from Cloudinary.
                         * -----------------------------------------
                         */

                        if (
                            message.messageType ===
                                "file" &&
                            message.attachment?.publicId
                        ) {

                            try {

                                await cloudinary
                                    .uploader
                                    .destroy(
                                        message
                                            .attachment
                                            .publicId,
                                        {
                                            resource_type:
                                                message
                                                    .attachment
                                                    .resourceType ||
                                                "image",
                                        }
                                    );


                                console.log(
                                    "Cloudinary file deleted:",
                                    message
                                        .attachment
                                        .publicId
                                );

                            } catch (
                                cloudinaryError
                            ) {

                                console.error(
                                    "Cloudinary delete failed:",
                                    cloudinaryError.message
                                );

                                return;
                            }

                        }


                        /*
                         * -----------------------------------------
                         * Soft delete in Cassandra.
                         * -----------------------------------------
                         */

                        const deletedMessage =
                            await softDeleteMessage({
                                messageId:
                                    data.messageId,

                                senderId:
                                    data.senderId,
                            });


                        if (!deletedMessage) {

                            console.error(
                                "Message could not be deleted"
                            );

                            return;
                        }


                        /*
                         * -----------------------------------------
                         * Update open conversation.
                         * -----------------------------------------
                         */

                        io.to(
                            deletedMessage
                                .conversationId
                        ).emit(
                            "messageDeleted",
                            deletedMessage
                        );


                        /*
                         * -----------------------------------------
                         * Find actual latest message after deletion.
                         *
                         * This is important when the deleted
                         * message was the last message.
                         * -----------------------------------------
                         */

                        const latestMessage =
                            await getLatestMessage(
                                deletedMessage
                                    .conversationId
                            );


                        /*
                         * -----------------------------------------
                         * Update conversation sidebar for EVERY
                         * participant.
                         * -----------------------------------------
                         */

                        await notifyConversationParticipants(
                            io,
                            deletedMessage
                                .conversationId,
                            latestMessage
                        );


                        console.log(
                            "Message Deleted:",
                            deletedMessage._id
                        );

                    } catch (error) {

                        console.error(
                            "Error deleting message:",
                            error.message
                        );

                    }

                }
            );


            // =========================================================
            // Leave conversation
            // =========================================================

            socket.on(
                "leaveConversation",
                (conversationId) => {

                    if (!conversationId) {
                        return;
                    }

                    socket.leave(
                        conversationId
                    );

                    console.log(
                        `user ${socket.id} left conversation: ${conversationId}`
                    );

                }
            );


            // =========================================================
            // Disconnect
            // =========================================================

            socket.on(
                "disconnect",
                () => {

                    console.log(
                        `user disconnected: ${socket.id}`
                    );

                }
            );

        }
    );

};



export default socketHandler;