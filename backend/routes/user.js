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

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/update-profile", upload.single("image"), updateUser);
router.get("/profile", isAuthenticatedUser, getProfile);
router.put("/profile", isAuthenticatedUser, updateProfile);
router.delete("/deactivate", deactivateUser);
router.put("/reactivate", reactivateUser);
router.get("/profile/:id", getUserProfile);
router.get("/", getAllUsers);
router.put("/:id/role", updateUserRole);

module.exports = router;
