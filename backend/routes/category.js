const express = require("express");
const router = express.Router();

const {
  getAllCategories,
  getSingleCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/category");
const { isAuthenticatedUser, isAdminUser } = require("../middlewares/auth");

router.get("/", getAllCategories);
router.get("/:id", getSingleCategory);
router.post("/", isAuthenticatedUser, isAdminUser, createCategory);
router.put("/:id", isAuthenticatedUser, isAdminUser, updateCategory);
router.delete("/:id", isAuthenticatedUser, isAdminUser, deleteCategory);

module.exports = router;
