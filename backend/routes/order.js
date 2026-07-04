const express = require("express");
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  myOrders,
  updateOrderStatus,
  cancelOrder,
} = require("../controllers/order");
const { isAuthenticatedUser } = require("../middlewares/auth");

// Checkout order
router.post("/checkout", isAuthenticatedUser, createOrder);
// My orders
router.get("/me", isAuthenticatedUser, myOrders);
// List orders
router.get("/", isAuthenticatedUser, getAllOrders);
// Cancel order
router.put("/:id/cancel", isAuthenticatedUser, cancelOrder);
// Update status
router.put("/:id/status", isAuthenticatedUser, updateOrderStatus);

module.exports = router;
