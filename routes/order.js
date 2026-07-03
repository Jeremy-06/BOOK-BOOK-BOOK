const express = require("express");
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  myOrders,
  updateOrderStatus,
} = require("../controllers/order");
const { isAuthenticatedUser } = require("../middlewares/auth");

router.post("/checkout", isAuthenticatedUser, createOrder);

router.get("/me", isAuthenticatedUser, myOrders);
router.get("/", isAuthenticatedUser, getAllOrders);
router.put("/:id/status", isAuthenticatedUser, updateOrderStatus);

module.exports = router;
