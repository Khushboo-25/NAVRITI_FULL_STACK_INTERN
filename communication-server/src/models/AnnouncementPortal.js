import mongoose from "mongoose";

const announcementPortalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const AnnouncementPortal = mongoose.model(
  "AnnouncementPortal",
  announcementPortalSchema
);

export default AnnouncementPortal;