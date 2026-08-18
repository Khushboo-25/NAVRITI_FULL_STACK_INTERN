import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },
        senderId: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            default: "",
        },
        messageType:{
            type: String,
            enum:["text","image","file","voice"],
            default:"text",
        },
        attachment: {
            fileName: {
                type: String,
            },
            fileUrl: {
                type: String,
            },
            fileType: {
                type: String,
            },
            fileSize: {
                type: Number,
            },
            publicId:{
                type: String,
            },
            resourceType: {
                type: String,
            },
        },

        status:{
            type: String,
            enum:["sent","delivered","read"],
            default:"sent",
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        
    },
    {
        timestamps: true,
    }
);

messageSchema.index({
    conversationId: 1,
    createdAt: 1
});
export default mongoose.model("Message", messageSchema);