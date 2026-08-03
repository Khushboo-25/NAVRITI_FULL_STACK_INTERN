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

        
        socket.on('disconnect', () => {
            console.log(`user disconnected: ${socket.id}`);
        });
    });

    
    
};





export default socketHandler;