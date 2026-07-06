const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/admin");
const { isAuthenticatedUser, isAdminUser } = require("../middlewares/auth");

router.get(
  "/dashboard-stats",
  isAuthenticatedUser,
  isAdminUser,
  getDashboardStats,
);

module.exports = router;
