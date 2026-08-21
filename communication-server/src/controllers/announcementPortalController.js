import AnnouncementPortal from "../models/AnnouncementPortal.js";
import AnnouncementPortalMember from "../models/AnnouncementPortalMember.js";
import Announcement from "../models/Announcement.js";
import cloudinary from "../config/cloudinary.js";
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

    
    const membership =
    await AnnouncementPortalMember.create({
        portalId: portal._id,
        userId,
        role: "host",
        addedBy: userId,
    });

  console.log("CREATED PORTAL:", portal);
  console.log("CREATED HOST MEMBERSHIP:", membership);

    return res.status(201).json({
      message: "Announcement portal created successfully",
      portal,
      membership,
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
      targetAudience = "all",
      targetUserIds = [],
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

    if (!["all", "selected"].includes(targetAudience)) {
      return res.status(400).json({
        message: "Invalid targetAudience",
      });
    }

    // Check sender membership
    const sender = await AnnouncementPortalMember.findOne({
      portalId,
      userId: senderId,
    });

    if (!sender) {
      return res.status(403).json({
        message: "User is not a member of this announcement portal",
      });
    }

    // Only host/admin can create announcements
    if (
      sender.role !== "host" &&
      sender.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Only host or admin can create announcements",
      });
    }

    // Validate selected audience
    if (targetAudience === "selected") {
      if (
        !Array.isArray(targetUserIds) ||
        targetUserIds.length === 0
      ) {
        return res.status(400).json({
          message:
            "targetUserIds is required when targetAudience is selected",
        });
      }

      // Check that all selected users belong to this portal
      const selectedMembers =
        await AnnouncementPortalMember.find({
          portalId,
          userId: { $in: targetUserIds },
        });

      const selectedParticipantIds = selectedMembers
        .filter((member) => member.role === "participant")
        .map((member) => member.userId);

      const invalidUserIds = targetUserIds.filter(
        (userId) => !selectedParticipantIds.includes(userId)
      );

      if (invalidUserIds.length > 0) {
        return res.status(400).json({
          message:
            "Some selected users are not participants of this portal",
          invalidUserIds,
        });
      }
    }
    const attachments = [];

    for (const file of req.files || []) {

        const uploadResult =
            await new Promise(
                (resolve, reject) => {

                    const uploadStream =
                        cloudinary.uploader.upload_stream(
                            {
                                resource_type: "auto",
                                folder:
                                    "communication-widget/announcements",
                            },
                            (error, result) => {

                                if (error) {
                                    reject(error);
                                } else {
                                    resolve(result);
                                }
                            }
                        );

                    uploadStream.end(
                        file.buffer
                    );
                }
            );

        attachments.push({
            url: uploadResult.secure_url,

            fileName:
                file.originalname,

            fileType:
                file.mimetype,

            fileSize:
                file.size,

            publicId:
                uploadResult.public_id,

            resourceType:
                uploadResult.resource_type,
        });
    }

    const announcement = await Announcement.create({
      portalId,
      senderId,
      title: title.trim(),
      content: content.trim(),
      attachments,
      targetAudience,
      targetUserIds:
        targetAudience === "selected"
          ? targetUserIds
          : [],
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
        { expiresAt: { $gt: new Date() } }
      ],
      $and: [
        {
          $or: [
            { targetAudience: "all" },
            { targetAudience: "selected", targetUserIds: userId }
          ]
        }
      ]
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


 const deleteAnnouncement = async (
    req,
    res
) => {
    try {
        const {
            portalId,
            announcementId,
        } = req.params;

        const {
            userId,
        } = req.query;

        if (!userId) {
            return res.status(400).json({
                message: "userId is required",
            });
        }

        /*
         * -----------------------------------------
         * Find announcement
         * -----------------------------------------
         */

        const announcement =
            await Announcement.findOne({
                _id: announcementId,
                portalId,
            });

        if (!announcement) {
            return res.status(404).json({
                message:
                    "Announcement not found",
            });
        }

        /*
         * -----------------------------------------
         * Check membership
         * -----------------------------------------
         */

        const membership =
            await AnnouncementPortalMember.findOne({
                portalId,
                userId,
            });

        if (!membership) {
            return res.status(403).json({
                message:
                    "You are not a member of this portal",
            });
        }

        /*
         * -----------------------------------------
         * Only host/admin can delete
         * -----------------------------------------
         */

        if (
            membership.role !== "host" &&
            membership.role !== "admin"
        ) {
            return res.status(403).json({
                message:
                    "Only host or admin can delete announcements",
            });
        }

        /*
         * -----------------------------------------
         * Delete Cloudinary attachments
         * -----------------------------------------
         */

        for (
            const attachment
            of announcement.attachments || []
        ) {

            if (
                !attachment.publicId
            ) {
                continue;
            }

            try {

                await cloudinary.uploader.destroy(
                    attachment.publicId,
                    {
                        resource_type:
                            attachment.resourceType ||
                            "image",
                    }
                );

                console.log(
                    "Cloudinary attachment deleted:",
                    attachment.publicId
                );

            } catch (cloudinaryError) {

                console.error(
                    "Cloudinary attachment deletion failed:",
                    cloudinaryError.message
                );

                /*
                 * Stop deletion so we don't end up
                 * deleting the announcement while
                 * its files remain in Cloudinary.
                 */

                return res.status(500).json({
                    message:
                        "Failed to delete announcement attachment",
                    error:
                        cloudinaryError.message,
                });
            }
        }

        /*
         * -----------------------------------------
         * Delete announcement
         * -----------------------------------------
         */

        await Announcement.deleteOne({
            _id: announcementId,
        });

        return res.status(200).json({
            message:
                "Announcement deleted successfully",
        });

    } catch (error) {

        console.error(
            "Failed to delete announcement:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to delete announcement",
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

const getUserAnnouncementPortals = async (
    req,
    res
) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                message: "userId is required",
            });
        }

        const memberships =
    await AnnouncementPortalMember.find({
        userId,
    }).lean();
        

        console.log(
            "CREATED HOST MEMBERSHIP:",
            memberships
        );

        if (memberships.length === 0) {
            return res.status(200).json([]);
        }

        const portalIds =
            memberships.map(
                (membership) =>
                    membership.portalId
            );

        const portals =
            await AnnouncementPortal.find({
                _id: {
                    $in: portalIds,
                },
            }).lean();
            console.log(
                "ANNOUNCEMENT PORTALS:",
                portals
            );
        const membershipMap =
            new Map(
                memberships.map(
                    (membership) => [
                        membership.portalId.toString(),
                        membership.role,
                    ]
                )
            );

        const result =
            portals.map((portal) => ({
                ...portal,

                role:
                    membershipMap.get(
                        portal._id.toString()
                    ),
            }));

        return res.status(200).json(
            result
        );

    } catch (error) {
        console.error(
            "Failed to get user announcement portals:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to get announcement portals",
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
  getUserAnnouncementPortals,
};