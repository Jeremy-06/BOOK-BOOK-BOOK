const path = require("path");
const db = require("../models");
const { Op } = require("sequelize");
const { sendEmail } = require("../utils/sendEmail");
const generatePDF = require("../utils/generatePDF");
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

    const completedOrder = await Order.findOne({
      where: { id: order.id },
      include: [
        {
          model: db.User,
          attributes: ["id", "first_name", "last_name", "email"],
          include: [{ model: Customer, attributes: ["address", "phone"] }],
        },
        {
          model: OrderLine,
          include: [{ model: db.Book, attributes: ["title", "price"] }],
        },
      ],
    });

    try {
      const pdfBuffer = await generatePDF(completedOrder);
      const pathToLogo = path.join(__dirname, "..", "images", "logo.jpg");
      const html = `
        <div style="font-family: Arial, Helvetica, sans-serif; background: #f3f4f6; padding: 24px;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #111827, #4f46e5); padding: 28px 24px; text-align: center;">
              <img src="cid:shoplogo" alt="BOOK BOOK BOOK" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; display: block; margin: 0 auto;" />
              <h1 style="margin: 12px 0 6px; color: #ffffff; font-size: 26px; font-weight: 700;">BOOK BOOK BOOK</h1>
              <p style="margin: 0; color: #e5e7eb; font-size: 14px;">Thank you for your order</p>
            </div>
            <div style="padding: 28px 24px 16px; text-align: center; color: #374151;">
              <p style="margin: 0 0 10px; font-size: 16px;">Hello ${completedOrder.User.first_name || "Customer"},</p>
              <p style="margin: 0 0 14px; font-size: 15px; line-height: 1.6;">Your order has been confirmed and your official receipt is attached below.</p>
              <div style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 12px 18px; border-radius: 999px; font-weight: 700; margin: 8px 0 16px;">Order #${completedOrder.id}</div>
              <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 10px; padding: 14px 16px; margin: 16px 0 20px; color: #4338ca; font-weight: 600;">
                ⬇️ Please download your official PDF receipt attached at the bottom of this email.
              </div>
              <p style="margin: 0; font-size: 13px; color: #6b7280;">Direct attachment download links are blocked by many email clients for security reasons, so the PDF is attached for you to open directly.</p>
            </div>
            <div style="padding: 0 24px 24px; text-align: center; color: #9ca3af; font-size: 13px;">BOOK BOOK BOOK • Premium reading experience</div>
          </div>
        </div>
      `;

      await sendEmail({
        to: completedOrder.User.email,
        subject: `Order Confirmation - Order #${completedOrder.id}`,
        html,
        attachments: [
          {
            filename: `Order-${completedOrder.id}-Receipt.pdf`,
            content: pdfBuffer,
          },
          { filename: "logo.jpg", path: pathToLogo, cid: "shoplogo" },
        ],
      });
    } catch (emailError) {
      console.error("Receipt email failed", emailError);
    }

    return res.status(201).json({
      success: true,
      order_id: order.id,
      message: "Transaction complete. Order is being processed.",
      cart,
    });
  } catch (error) {
    console.log("createOrder catch block", error);
    if (t && !t.finished) {
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

    const fullOrder = await Order.findByPk(id, {
      include: [
        {
          model: db.User,
          include: [{ model: Customer }],
        },
        {
          model: OrderLine,
          include: [{ model: db.Book }],
        },
      ],
    });

    try {
      const pdfBuffer = await generatePDF(fullOrder);
      const pathToLogo = path.join(__dirname, "..", "images", "logo.jpg");
      const html = `
        <div style="font-family: Arial, Helvetica, sans-serif; background: #f3f4f6; padding: 24px;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #111827, #4f46e5); padding: 28px 24px; text-align: center;">
              <img src="cid:shoplogo" alt="BOOK BOOK BOOK" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; display: block; margin: 0 auto;" />
              <h1 style="margin: 12px 0 6px; color: #ffffff; font-size: 26px; font-weight: 700;">BOOK BOOK BOOK</h1>
              <p style="margin: 0; color: #e5e7eb; font-size: 14px;">Order update</p>
            </div>
            <div style="padding: 28px 24px 16px; text-align: center; color: #374151;">
              <p style="margin: 0 0 10px; font-size: 16px;">Hello ${fullOrder.User.first_name || "Customer"},</p>
              <p style="margin: 0 0 14px; font-size: 15px; line-height: 1.6;">Your order status has been updated to <strong>${status}</strong>.</p>
              <div style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 12px 18px; border-radius: 999px; font-weight: 700; margin: 8px 0 16px;">Order #${fullOrder.id}</div>
              <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 10px; padding: 14px 16px; margin: 16px 0 20px; color: #4338ca; font-weight: 600;">
                ⬇ Please download your official PDF receipt attached at the bottom of this email.
              </div>
              <p style="margin: 0; font-size: 13px; color: #6b7280;">Direct attachment download links are blocked by many email clients for security reasons, so the PDF is attached for you to open directly.</p>
            </div>
            <div style="padding: 0 24px 24px; text-align: center; color: #9ca3af; font-size: 13px;">BOOK BOOK BOOK • Premium reading experience</div>
          </div>
        </div>
      `;

      await sendEmail({
        to: fullOrder.User.email,
        subject: `Order Update - #${fullOrder.id}`,
        html,
        attachments: [
          { filename: `Order-${fullOrder.id}-Receipt.pdf`, content: pdfBuffer },
          { filename: "logo.jpg", path: pathToLogo, cid: "shoplogo" },
        ],
      });
    } catch (emailError) {
      console.error("Status email failed", emailError);
    }

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
