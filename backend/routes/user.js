const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");

const {
  registerUser,
  loginUser,
  updateUser,
  getProfile,
  updateProfile,
  deactivateUser,
  reactivateUser,
  getUserProfile,
  getAllUsers,
  updateUserRole,
} = require("../controllers/user");
const { isAuthenticatedUser } = require("../middlewares/auth");

// Register user
router.post("/register", registerUser);
// Login user
router.post("/login", loginUser);
// Update profile
router.post("/update-profile", upload.single("image"), updateUser);
// Get profile
router.get("/profile", isAuthenticatedUser, getProfile);
// Update profile
router.put("/profile", isAuthenticatedUser, updateProfile);
// Deactivate user
router.delete("/deactivate", deactivateUser);
// Reactivate user
router.put("/reactivate", reactivateUser);
// User profile
router.get("/profile/:id", getUserProfile);
// List users
router.get("/", getAllUsers);
// Update role
router.put("/:id/role", updateUserRole);

module.exports = router;
