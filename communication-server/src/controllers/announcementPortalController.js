import AnnouncementPortal from "../models/AnnouncementPortal.js";
import AnnouncementPortalMember from "../models/AnnouncementPortalMember.js";
import Announcement from "../models/Announcement.js";
 const createAnnouncementPortal = async (req, res) => {
  try {
    const {
      userId,
      role,
      name,
      description,
    } = req.body;

    if (role !== "admin") {
      return res.status(403).json({
        message: "Only admins can create announcement portals",
      });
    }

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Portal name is required",
      });
    }

    const portal = await AnnouncementPortal.create({
      name: name.trim(),
      description: description?.trim() || "",
      createdBy: userId,
    });

    await AnnouncementPortalMember.create({
      portalId: portal._id,
      userId,
      role: "host",
      addedBy: userId,
    });

    return res.status(201).json({
      message: "Announcement portal created successfully",
      portal,
    });
  } catch (error) {
    console.error("Create announcement portal error:", error);

    return res.status(500).json({
      message: "Failed to create announcement portal",
      error: error.message,
    });
  }
};

const addPortalMembers = async (req, res) => {
  try {
    const { portalId } = req.params;
    const { hostUserId, members } = req.body;

    if (!hostUserId) {
      return res.status(400).json({
        message: "hostUserId is required",
      });
    }

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({
        message: "members array is required",
      });
    }

    const host = await AnnouncementPortalMember.findOne({
      portalId,
      userId: hostUserId,
      role: "host",
    });

    if (!host) {
      return res.status(403).json({
        message: "Only the host can add members",
      });
    }

    const newMembers = members.map((member) => ({
      portalId,
      userId: member.userId,
      role: member.role,
      addedBy: hostUserId,
    }));

    const createdMembers =
      await AnnouncementPortalMember.insertMany(newMembers);

    return res.status(201).json({
      message: "Members added successfully",
      members: createdMembers,
    });
  } catch (error) {
    console.error("Add portal members error:", error);

    return res.status(500).json({
      message: "Failed to add members",
      error: error.message,
    });
  }
};


const createAnnouncement = async (req, res) => {
  try {
    const { portalId } = req.params;

    const {
      senderId,
      title,
      content,
      targetAudience,
      expiresAt,
    } = req.body;

    if (!senderId) {
      return res.status(400).json({
        message: "senderId is required",
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Announcement title is required",
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        message: "Announcement content is required",
      });
    }

    const member = await AnnouncementPortalMember.findOne({
      portalId,
      userId: senderId,
    });

    if (!member) {
      return res.status(403).json({
        message: "User is not a member of this announcement portal",
      });
    }

    if (
      member.role !== "host" &&
      member.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Only host or admin can create announcements",
      });
    }

    const announcement = await Announcement.create({
      portalId,
      senderId,
      title: title.trim(),
      content: content.trim(),
      targetAudience: targetAudience || "all",
      expiresAt: expiresAt || null,
    });

    return res.status(201).json({
      message: "Announcement created successfully",
      announcement,
    });
  } catch (error) {
    console.error("Create announcement error:", error);

    return res.status(500).json({
      message: "Failed to create announcement",
      error: error.message,
    });
  }
};


const getAnnouncements = async (req, res) => {
  try {
    const { portalId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    // Check whether user belongs to this portal
    const member = await AnnouncementPortalMember.findOne({
      portalId,
      userId,
    });

    if (!member) {
      return res.status(403).json({
        message: "User is not a member of this announcement portal",
      });
    }

    const announcements = await Announcement.find({
      portalId,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
    }).sort({
      publishedAt: -1,
    });

    return res.status(200).json({
      message: "Announcements fetched successfully",
      announcements,
    });
  } catch (error) {
    console.error("Get announcements error:", error);

    return res.status(500).json({
      message: "Failed to fetch announcements",
      error: error.message,
    });
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const { portalId, announcementId } = req.params;

    const {
      userId,
      title,
      content,
      targetAudience,
      expiresAt,
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    const member = await AnnouncementPortalMember.findOne({
      portalId,
      userId,
    });

    if (!member) {
      return res.status(403).json({
        message: "User is not a member of this announcement portal",
      });
    }

    if (
      member.role !== "host" &&
      member.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Only host or admin can update announcements",
      });
    }

    const announcement = await Announcement.findOne({
      _id: announcementId,
      portalId,
    });

    if (!announcement) {
      return res.status(404).json({
        message: "Announcement not found",
      });
    }

    if (title !== undefined) {
      announcement.title = title.trim();
    }

    if (content !== undefined) {
      announcement.content = content.trim();
    }

    if (targetAudience !== undefined) {
      announcement.targetAudience = targetAudience;
    }

    if (expiresAt !== undefined) {
      announcement.expiresAt = expiresAt || null;
    }

    await announcement.save();

    return res.status(200).json({
      message: "Announcement updated successfully",
      announcement,
    });
  } catch (error) {
    console.error("Update announcement error:", error);

    return res.status(500).json({
      message: "Failed to update announcement",
      error: error.message,
    });
  }
};


const deleteAnnouncement = async (req, res) => {
  try {
    const { portalId, announcementId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    const member = await AnnouncementPortalMember.findOne({
      portalId,
      userId,
    });

    if (!member) {
      return res.status(403).json({
        message: "User is not a member of this announcement portal",
      });
    }

    if (
      member.role !== "host" &&
      member.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Only host or admin can delete announcements",
      });
    }

    const announcement =
      await Announcement.findOneAndDelete({
        _id: announcementId,
        portalId,
      });

    if (!announcement) {
      return res.status(404).json({
        message: "Announcement not found",
      });
    }

    return res.status(200).json({
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    console.error("Delete announcement error:", error);

    return res.status(500).json({
      message: "Failed to delete announcement",
      error: error.message,
    });
  }
};

const getAnnouncement = async (req, res) => {
  try {
    const { portalId, announcementId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    // Check portal membership
    const member = await AnnouncementPortalMember.findOne({
      portalId,
      userId,
    });

    if (!member) {
      return res.status(403).json({
        message: "User is not a member of this announcement portal",
      });
    }

    const announcement = await Announcement.findOne({
      _id: announcementId,
      portalId,
    });

    if (!announcement) {
      return res.status(404).json({
        message: "Announcement not found",
      });
    }

    return res.status(200).json({
      message: "Announcement fetched successfully",
      announcement,
    });
  } catch (error) {
    console.error("Get announcement error:", error);

    return res.status(500).json({
      message: "Failed to fetch announcement",
      error: error.message,
    });
  }
};

export {
  // your existing exports...
  createAnnouncementPortal,
  addPortalMembers,
  createAnnouncement,
  getAnnouncements,
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};