const {
  addMember,
  getMembersByPortal,
  getPortalsByUser,
  removeMember,
  updateMemberRole,
} = require("../repositories/announcementPortalMemberRepository");

const {
  getPortalById,
} = require("../repositories/announcementPortalRepository");


async function add(req, res) {
  try {
    const { portalId } = req.params;
    const { userId, role, addedBy } = req.body || {};

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    if (!addedBy) {
      return res.status(400).json({
        message: "addedBy is required",
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
      (member) => member.user_id === addedBy
    );

    if (!requester || requester.role !== "host") {
      return res.status(403).json({
        message: "Only portal hosts can add members",
      });
    }

    const existing = members.find(
      (member) => member.user_id === userId
    );

    if (existing) {
      return res.status(409).json({
        message: "User is already a member",
      });
    }

    const now = new Date();

    const member = {
      portal_id: portalId,
      user_id: userId,
      role: role || "participant",
      added_by: addedBy,
      created_at: now,
      updated_at: now,
    };

    await addMember(member);

    return res.status(201).json(member);
  } catch (error) {
    console.error("Add portal member error:", error);

    return res.status(500).json({
      message: "Failed to add portal member",
      error: error.message,
    });
  }
}


async function getByPortal(req, res) {
  try {
    const { portalId } = req.params;

    const portal = await getPortalById(portalId);

    if (!portal) {
      return res.status(404).json({
        message: "Announcement portal not found",
      });
    }

    const members = await getMembersByPortal(portalId);

    return res.status(200).json(members);
  } catch (error) {
    console.error("Get portal members error:", error);

    return res.status(500).json({
      message: "Failed to get portal members",
      error: error.message,
    });
  }
}


async function getByUser(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    const portals = await getPortalsByUser(userId);

    return res.status(200).json(portals);
  } catch (error) {
    console.error("Get user portals error:", error);

    return res.status(500).json({
      message: "Failed to get user portals",
      error: error.message,
    });
  }
}


async function remove(req, res) {
  try {
    const { portalId, userId } = req.params;
    const { requesterId } = req.body || {};

    if (!requesterId) {
      return res.status(400).json({
        message: "requesterId is required",
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
      (member) => member.user_id === requesterId
    );

    if (!requester || requester.role !== "host") {
      return res.status(403).json({
        message: "Only portal hosts can remove members",
      });
    }

    const target = members.find(
      (member) => member.user_id === userId
    );

    if (!target) {
      return res.status(404).json({
        message: "Member not found",
      });
    }

    if (target.role === "host") {
      return res.status(400).json({
        message: "Portal host cannot be removed",
      });
    }

    await removeMember(portalId, userId);

    return res.status(200).json({
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Remove portal member error:", error);

    return res.status(500).json({
      message: "Failed to remove portal member",
      error: error.message,
    });
  }
}


async function updateRole(req, res) {
  try {
    const { portalId, userId } = req.params;
    const { role, requesterId } = req.body || {};

    if (!requesterId) {
      return res.status(400).json({
        message: "requesterId is required",
      });
    }

    if (!["host", "participant"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
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
      (member) => member.user_id === requesterId
    );

    if (!requester || requester.role !== "host") {
      return res.status(403).json({
        message: "Only portal hosts can update member roles",
      });
    }

    const target = members.find(
      (member) => member.user_id === userId
    );

    if (!target) {
      return res.status(404).json({
        message: "Member not found",
      });
    }

    // Don't allow the only host to lose host role.
    if (
      target.role === "host" &&
      role !== "host"
    ) {
      const hostCount = members.filter(
        (member) => member.role === "host"
      ).length;

      if (hostCount <= 1) {
        return res.status(400).json({
          message: "Portal must have at least one host",
        });
      }
    }

    await updateMemberRole(
      portalId,
      userId,
      role,
      new Date()
    );

    return res.status(200).json({
      message: "Member role updated successfully",
    });
  } catch (error) {
    console.error("Update portal member role error:", error);

    return res.status(500).json({
      message: "Failed to update member role",
      error: error.message,
    });
  }
}


module.exports = {
  add,
  getByPortal,
  getByUser,
  remove,
  updateRole,
};