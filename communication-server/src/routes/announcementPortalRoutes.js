import express from "express";

const router = express.Router();

import {
    createAnnouncementPortal,
  addPortalMembers,
  createAnnouncement,
  getAnnouncements,
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcementPortalController.js";
router.post(
  "/",
  createAnnouncementPortal
);

router.post(
  "/:portalId/members",
  addPortalMembers
);

router.post(
  "/:portalId/announcements",
  createAnnouncement
);

router.get(
  "/:portalId/announcements",
  getAnnouncements
);

router.get(
  "/:portalId/announcements/:announcementId",
  getAnnouncement
);

router.patch(
  "/:portalId/announcements/:announcementId",
  updateAnnouncement
);

router.delete(
  "/:portalId/announcements/:announcementId",
  deleteAnnouncement
);
export default router;