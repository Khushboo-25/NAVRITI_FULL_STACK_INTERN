import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    portalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AnnouncementPortal",
      required: true,
      index: true,
    },

    senderId: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    attachments: [
      {
        url: String,
        fileName: String,
        fileType: String,
        fileSize: Number,
      },
    ],

    targetAudience: {
    type: String,
    enum: ["all", "selected"],
    default: "all",
    },

    targetUserIds: [
    {
        type: String,
    },
    ],

    publishedAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

announcementSchema.index({
  portalId: 1,
  publishedAt: -1,
});

const Announcement = mongoose.model(
  "Announcement",
  announcementSchema
);

export default Announcement;