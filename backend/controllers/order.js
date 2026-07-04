const db = require("../models");
const { Op } = require("sequelize");
const Order = db.Order;
const OrderLine = db.OrderLine;
const Stock = db.Stock;
const Customer = db.Customer;
const sequelize = db.sequelize;

// Parse number
const parsePositiveInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

// Sort order
const getSortOrder = (value) =>
  String(value || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";

// Sort orders
const getOrderSortColumn = (value) => {
  const sortColumns = {
    id: "id",
    date_placed: "date_placed",
    date_shipped: "date_shipped",
    status: "status",
    shipping_fee: "shipping_fee",
    payment_method: "payment_method",
  };

  return sortColumns[value] || sortColumns.id;
};

// Create order
const createOrder = async (req, res) => {
  console.log("createOrder controller entered");
  let t;

  try {
    const { cart, payment_method } = req.body || {};
    const userId = req.user && req.user.id;

    if (!userId) {
      return res
        .status(401)
        .json({ error: "Login first to access this resource" });
    }

    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const customer = await Customer.findOne({
      where: { user_id: userId },
    });

    if (
      !customer ||
      !String(customer.phone || "").trim() ||
      !String(customer.address || "").trim()
    ) {
      return res.status(403).json({
        error: "IncompleteProfile",
        message:
          "Please update your profile address and phone number before placing an order.",
      });
    }

    console.log("createOrder before transaction");
    t = await sequelize.transaction();

    const order = await Order.create(
      {
        user_id: userId,
        shipping_fee: 100,
        payment_method: payment_method || "Cash on Delivery",
      },
      { transaction: t },
    );

    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];

      // Reserve stock

      await OrderLine.create(
        {
          order_id: order.id,
          book_id: item.item_id,
          quantity: item.quantity,
          price: item.price,
        },
        { transaction: t },
      );

      const stock = await Stock.findOne({
        where: { book_id: item.item_id },
        transaction: t,
      });

      if (!stock || stock.quantity < item.quantity) {
        throw new Error(`Not enough stock for book ID: ${item.item_id}`);
      }

      await stock.decrement("quantity", { by: item.quantity, transaction: t });
    }

    await t.commit();
    console.log("createOrder after transaction commit");

    return res.status(201).json({
      success: true,
      order_id: order.id,
      message: "Transaction complete. Order is being processed.",
      cart,
    });
  } catch (error) {
    console.log("createOrder catch block", error);
    if (t) {
      await t.rollback();
    }
    return res
      .status(500)
      .json({ error: "Transaction failed", details: error.message });
  }
};

// List orders
const getAllOrders = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 0);
    const sortBy = getOrderSortColumn(req.query.sortBy || "id");
    const sortOrder = getSortOrder(req.query.sortOrder || "DESC");
    const search = String(req.query.search || "").trim();
    const queryOptions = {
      include: [
        {
          model: db.User,
          attributes: ["id", "first_name", "last_name", "email"],
        },
        {
          model: db.OrderLine,
          include: [{ model: db.Book, attributes: ["title", "price"] }],
        },
      ],
      order: [[sortBy, sortOrder]],
      distinct: true,
    };

    if (search) {
      const filters = [
        { status: { [Op.substring]: search } },
        { payment_method: { [Op.substring]: search } },
      ];

      const searchId = parseInt(search.replace(/^#/, ""), 10);
      if (Number.isInteger(searchId)) {
        filters.push({ id: searchId });
      }

      queryOptions.where = { [Op.or]: filters };
    }

    if (limit > 0) {
      queryOptions.limit = limit;
      queryOptions.offset = (page - 1) * limit;
    }

    const result = await Order.findAndCountAll(queryOptions);

    return res.status(200).json({
      rows: result.rows,
      count: result.count,
      page,
      limit: limit || result.count,
      hasMore: limit > 0 ? page * limit < result.count : false,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

// My orders
const myOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: db.OrderLine,
          include: [{ model: db.Book, attributes: ["title", "price"] }],
        },
      ],
      order: [["date_placed", "DESC"]],
    });
    return res.status(200).json({ rows: orders });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

// Update status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await Order.update({ status }, { where: { id } });
    return res
      .status(200)
      .json({ success: true, message: "Order status updated successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  let t;

  try {
    const { id } = req.params;
    const userId = req.user && req.user.id;

    if (!userId) {
      return res
        .status(401)
        .json({ error: "Login first to access this resource" });
    }

    t = await sequelize.transaction();

    const order = await Order.findOne({
      where: { id, user_id: userId },
      include: [{ model: OrderLine }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ error: "Order not found" });
    }

    const currentStatus = String(order.status || "").trim();
    const terminalStatuses = ["Shipped", "Delivered", "Cancelled"];
    const cancellableStatuses = ["Pending", "Processing"];

    if (terminalStatuses.includes(currentStatus)) {
      await t.rollback();
      return res.status(400).json({
        error: `Order cannot be cancelled because it is already ${currentStatus}.`,
      });
    }

    if (!cancellableStatuses.includes(currentStatus)) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: "Only pending orders can be cancelled." });
    }

    const orderLines = order.OrderLines || [];

    // Restore stock
    for (const item of orderLines) {
      const [stock] = await Stock.findOrCreate({
        where: { book_id: item.book_id },
        defaults: { quantity: 0 },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      await stock.increment("quantity", {
        by: item.quantity,
        transaction: t,
      });
    }

    await order.update({ status: "Cancelled" }, { transaction: t });
    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    if (t) {
      await t.rollback();
    }
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  myOrders,
  updateOrderStatus,
  cancelOrder,
};
