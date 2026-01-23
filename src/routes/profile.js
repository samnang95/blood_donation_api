const express = require("express");
const {
  createProfile,
  getProfiles,
  getProfileById,
  getMyProfile,
  updateProfile,
  deleteProfile,
} = require("../controllers/profile.js");
const { authenticateToken } = require("../controllers/auth.js");

const router = express.Router();

router.post("/", authenticateToken, createProfile);
router.get("/", getProfiles);
router.get("/me", authenticateToken, getMyProfile);
router.get("/:id", getProfileById);
router.put("/:id", authenticateToken, updateProfile);
router.delete("/:id", authenticateToken, deleteProfile);

module.exports = router;
