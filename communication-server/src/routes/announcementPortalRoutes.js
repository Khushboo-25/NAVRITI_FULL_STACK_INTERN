import express from "express";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

import {
    createAnnouncementPortal,
  addPortalMembers,
  createAnnouncement,
  getAnnouncements,
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getUserAnnouncementPortals,
} from "../controllers/announcementPortalController.js";
router.post(
  "/",
  createAnnouncementPortal
);
router.get(
    "/",
    getUserAnnouncementPortals
);

router.post(
  "/:portalId/members",
  addPortalMembers
);

router.post(
  "/:portalId/announcements",
  upload.array("attachments", 10),
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