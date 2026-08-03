import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
    {
        type:{
            type: String,
            enum:["direct","group"],
            default:"direct",
        },
        
    },
    {
        timestamps: true,
    }
);
export default mongoose.model("Conversation", conversationSchema);