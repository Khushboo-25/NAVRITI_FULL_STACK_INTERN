const express = require("express");

const {
  create,
  getUserPortals,
  deletePortal,
} = require("../controllers/announcementPortalController");

const router = express.Router();

router.post("/", create);

router.get("/", getUserPortals);

router.delete("/:portalId", deletePortal);

module.exports = router;