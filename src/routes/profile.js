const express = require("express");
const {
  createProfile,
  getProfiles,
  getProfileById,
  updateProfile,
  deleteProfile,
} = require("../controllers/profile.js");
const { authenticateToken } = require("../controllers/auth.js");

const router = express.Router();

router.post("/", authenticateToken, createProfile);
router.get("/", getProfiles);
router.get("/:id", getProfileById);
router.put("/:id", updateProfile);
router.delete("/:id", deleteProfile);

module.exports = router;
