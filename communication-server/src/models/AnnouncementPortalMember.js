import mongoose from "mongoose";

const announcementPortalMemberSchema = new mongoose.Schema(
  {
    portalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AnnouncementPortal",
      required: true,
      index: true,
    },

    userId: {
      type: String,
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["host", "admin", "participant"],
      required: true,
    },

    addedBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

announcementPortalMemberSchema.index(
  {
    portalId: 1,
    userId: 1,
  },
  {
    unique: true,
  }
);

const AnnouncementPortalMember = mongoose.model(
  "AnnouncementPortalMember",
  announcementPortalMemberSchema
);

export default AnnouncementPortalMember;