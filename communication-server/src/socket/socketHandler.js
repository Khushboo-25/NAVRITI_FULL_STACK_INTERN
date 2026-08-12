import Message from "../models/message.js";

const socketHandler = (io) => {
    io.on('connection', (socket) => 
        {
        console.log(`user connected:', ${socket.id}`);
        
        // Handle joining a conversation
        socket.on("joinConversation", (conversationId) => {
            socket.join(conversationId);
            console.log(`user ${socket.id} joined conversation: ${conversationId}`);
        });

        // Handle sending messages
        socket.on("sendMessage",async(data)=>{
            try {
                const message=await Message.create({
                    conversationId:data.conversationId,
                    senderId:data.senderId,
                    content:data.content,
                    messageType:data.messageType||"text",
                    status:"sent",
                });
                io.to(data.conversationId).emit("newMessage",message);
                console.log("Message Sent:",message._id);
            }catch (error) {
                console.error("Error sending message:",error.message);
            }
        });

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
                const message = await Message.findOneAndUpdate(
                    {
                        _id: data.messageId,
                        senderId: data.senderId
                    },
                    {
                        $set: {
                            isDeleted: true
                        }
                    },
                    {
                        new: true
                    }
                );

                if (!message) {
                    console.error("Message not found");
                    return;
                }

                io.to(message.conversationId.toString()).emit(
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