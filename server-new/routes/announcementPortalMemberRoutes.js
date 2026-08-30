const express = require("express");

const {
  add,
  getByPortal,
  getByUser,
  remove,
  updateRole,
} = require("../controllers/announcementPortalMemberController");

const router = express.Router();

router.post("/:portalId/members", add);

router.get("/:portalId/members", getByPortal);

router.delete(
  "/:portalId/members/:userId",
  remove
);

router.patch(
  "/:portalId/members/:userId/role",
  updateRole
);

router.get(
  "/users/:userId/announcement-portals",
  getByUser
);

module.exports = router;