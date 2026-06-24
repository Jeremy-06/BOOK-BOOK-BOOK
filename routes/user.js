const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");

const {
  registerUser,
  loginUser,
  updateUser,
  deactivateUser,
  reactivateUser,
  getAllUsers,
  updateUserRole,
} = require("../controllers/user");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/update-profile", upload.single("image"), updateUser);
router.delete("/deactivate", deactivateUser);
router.put("/reactivate", reactivateUser);
router.get("/", getAllUsers);
router.put("/:id/role", updateUserRole);

module.exports = router;
