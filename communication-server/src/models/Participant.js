import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
        },
        conversationId: {
            type:mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true, 
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
    }
);
export default mongoose.model("Participant", participantSchema);