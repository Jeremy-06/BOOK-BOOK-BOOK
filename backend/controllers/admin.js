const db = require("../models");
const { Op } = require("sequelize");

const Order = db.Order;
const OrderLine = db.OrderLine;
const Book = db.Book;
const orderDateField = Order.rawAttributes.createdAt
  ? "createdAt"
  : "date_placed";

// Parse date
function parseDateRange(startDate, endDate) {
  if (!startDate && !endDate) return null;

  const start = startDate ? new Date(startDate) : new Date(0);
  const end = endDate ? new Date(endDate) : new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return [start, end];
}

// Order lines
function getOrderLines(order) {
  return order.OrderLines || order.lines || [];
}

// Order date
function getOrderDate(order) {
  const dateValue = order.createdAt || order.date_placed;
  return new Date(dateValue).toISOString().slice(0, 10);
}

// Order total
function getOrderTotal(order) {
  if (order.total_price !== undefined && order.total_price !== null) {
    return Number(order.total_price) || 0;
  }

  return getOrderLines(order).reduce((sum, line) => {
    const quantity = Number(line.quantity) || 0;
    const price = Number(line.price) || Number(line.Book?.price) || 0;
    return sum + quantity * price;
  }, 0);
}

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateRange = parseDateRange(startDate, endDate);
    const orderWhere = {
      status: { [Op.ne]: "Cancelled" },
    };
    const statusWhere = {};

    if (dateRange) {
      orderWhere[orderDateField] = { [Op.between]: dateRange };
      statusWhere[orderDateField] = { [Op.between]: dateRange };
    }

    const orders = await Order.findAll({
      where: orderWhere,
      include: [
        {
          model: OrderLine,
          include: [Book],
        },
      ],
      order: [[orderDateField, "ASC"]],
    });

    const statusOrders = await Order.findAll({
      where: statusWhere,
      order: [[orderDateField, "ASC"]],
    });

    const revenueMap = {};
    const topBooksMap = {};
    const orderStatusMap = {};

    orders.forEach((orderInstance) => {
      const order = orderInstance.get({ plain: true });
      const orderDate = getOrderDate(order);
      revenueMap[orderDate] =
        (revenueMap[orderDate] || 0) + getOrderTotal(order);

      getOrderLines(order).forEach((line) => {
        const title = line.Book?.title || "Unknown Book";
        const quantity = Number(line.quantity) || 0;
        topBooksMap[title] = (topBooksMap[title] || 0) + quantity;
      });
    });

    statusOrders.forEach((orderInstance) => {
      const order = orderInstance.get({ plain: true });
      const status = order.status || "Unknown";
      orderStatusMap[status] = (orderStatusMap[status] || 0) + 1;
    });

    const revenueEntries = Object.entries(revenueMap).sort(([first], [second]) =>
      first.localeCompare(second),
    );
    const topBookEntries = Object.entries(topBooksMap)
      .sort((first, second) => second[1] - first[1])
      .slice(0, 5);
    const orderStatusEntries = Object.entries(orderStatusMap).sort(
      ([first], [second]) => first.localeCompare(second),
    );

    return res.status(200).json({
      revenue: {
        labels: revenueEntries.map(([label]) => label),
        data: revenueEntries.map(([, value]) => value),
      },
      topBooks: {
        labels: topBookEntries.map(([label]) => label),
        data: topBookEntries.map(([, value]) => value),
      },
      orderStatus: {
        labels: orderStatusEntries.map(([label]) => label),
        data: orderStatusEntries.map(([, value]) => value),
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error fetching dashboard stats" });
  }
};
