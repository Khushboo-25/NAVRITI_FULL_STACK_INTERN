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
        
    },
);
participantSchema.index(
    {
        conversationId: 1,
        userId: 1,
    },
);

participantSchema.index({
    userId: 1,
});
export default mongoose.model("Participant", participantSchema);