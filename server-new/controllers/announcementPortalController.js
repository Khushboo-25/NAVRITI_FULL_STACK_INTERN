const { randomUUID } = require("crypto");

const {
  createPortal,
  getPortalById,
  deletePortal: deletePortalFromDb,
} = require("../repositories/announcementPortalRepository");

const {
  addMember,
  getMembersByPortal,
  getPortalsByUser,
  removeMember,
} = require("../repositories/announcementPortalMemberRepository");


// CREATE PORTAL
const create = async (req, res) => {
  try {
    const {
      userId,
      role,
      name,
      description,
      targetAudience = "all",
      members = [],
    } = req.body || {};

    console.log("CREATE PORTAL BODY:", req.body);

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

    if (role !== "admin") {
      return res.status(403).json({
        message: "Only admins can create announcement portals",
      });
    }

    if (!["all", "selected"].includes(targetAudience)) {
      return res.status(400).json({
        message: "Invalid targetAudience",
      });
    }

    if (
      targetAudience === "selected" &&
      (!Array.isArray(members) || members.length === 0)
    ) {
      return res.status(400).json({
        message:
          "At least one member is required for a selected portal",
      });
    }

    const now = new Date();

    const portal = {
      id: randomUUID(),
      name: name.trim(),
      description: description?.trim() || "",
      created_by: userId,
      target_audience: targetAudience,
      created_at: now,
      updated_at: now,
    };

    await createPortal(portal);

    // Creator is always host
    const hostMembership = {
      portal_id: portal.id,
      user_id: userId,
      role: "host",
      added_by: userId,
      created_at: now,
      updated_at: now,
    };

    await addMember(hostMembership);

    const participantMembers = Array.isArray(members)
      ? members
          .filter((member) => member?.userId)
          .filter((member) => member.userId !== userId)
          .map((member) => ({
            portal_id: portal.id,
            user_id: member.userId,
            role: "participant",
            added_by: userId,
            created_at: now,
            updated_at: now,
          }))
      : [];

    for (const member of participantMembers) {
      await addMember(member);
    }

    return res.status(201).json({
      message: "Announcement portal created successfully",
      portal,
      membership: hostMembership,
      members: participantMembers,
    });
  } catch (error) {
    console.error("Create announcement portal error:", error);

    return res.status(500).json({
      message: "Failed to create announcement portal",
      error: error.message,
    });
  }
};


// GET USER PORTALS
const getUserPortals = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    const memberships = await getPortalsByUser(userId);

    if (!memberships.length) {
      return res.status(200).json([]);
    }

    const result = [];

    for (const membership of memberships) {
      const portal = await getPortalById(
        membership.portal_id
      );

      if (!portal) {
        continue;
      }

      const members = await getMembersByPortal(
        membership.portal_id
      );

      result.push({
        ...portal,

        role: membership.role,

        members: members.map((member) => ({
          userId: member.user_id,
          role: member.role,
        })),
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Failed to get user announcement portals:",
      error
    );

    return res.status(500).json({
      message: "Failed to get announcement portals",
      error: error.message,
    });
  }
};


// DELETE PORTAL
const deletePortal = async (req, res) => {
  try {
    const { portalId } = req.params;
    const { userId } = req.body || {};

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    const portal = await getPortalById(portalId);

    if (!portal) {
      return res.status(404).json({
        message: "Announcement portal not found",
      });
    }

    const members = await getMembersByPortal(portalId);

    const requester = members.find(
      (member) => member.user_id === userId
    );

    if (!requester || requester.role !== "host") {
      return res.status(403).json({
        message: "Only portal hosts can delete the portal",
      });
    }

    // Remove all memberships from both Cassandra tables
    for (const member of members) {
      await removeMember(
        portalId,
        member.user_id
      );
    }

    // Delete portal itself
    await deletePortalFromDb(portalId);

    return res.status(200).json({
      message: "Announcement portal deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete announcement portal error:",
      error
    );

    return res.status(500).json({
      message: "Failed to delete announcement portal",
      error: error.message,
    });
  }
};


module.exports = {
  create,
  getUserPortals,
  deletePortal,
};