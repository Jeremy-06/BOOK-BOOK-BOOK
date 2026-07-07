const sequelize = require("../config/database");
const Book = require("./book");
const Category = require("./category");
const Stock = require("./stock");
const BookImage = require("./bookimage");

const db = {};
db.Book = Book(sequelize, require("sequelize").DataTypes);
db.Category = Category(sequelize, require("sequelize").DataTypes);
db.Stock = Stock(sequelize, require("sequelize").DataTypes);
db.BookImage = BookImage(sequelize, require("sequelize").DataTypes);

// Define associations
db.Book.hasOne(db.Stock, {
  foreignKey: "book_id",
  onDelete: "CASCADE",
});
db.Stock.belongsTo(db.Book, {
  foreignKey: "book_id",
});

db.Book.hasMany(db.BookImage, {
  foreignKey: "book_id",
  onDelete: "CASCADE",
});
db.BookImage.belongsTo(db.Book, {
  foreignKey: "book_id",
});

db.Category.hasMany(db.Book, {
  foreignKey: "category_id",
});
db.Book.belongsTo(db.Category, {
  foreignKey: "category_id",
});

db.sequelize = sequelize;
db.Sequelize = require("sequelize");

const User = require("./user");
const Customer = require("./customer");

db.User = User(sequelize, require("sequelize").DataTypes);
db.Customer = Customer(sequelize, require("sequelize").DataTypes);

db.User.hasOne(db.Customer, { foreignKey: "user_id", onDelete: "CASCADE" });
db.Customer.belongsTo(db.User, { foreignKey: "user_id" });

const Order = require("./order");
const OrderLine = require("./orderline");

db.Order = Order(sequelize, require("sequelize").DataTypes);
db.OrderLine = OrderLine(sequelize, require("sequelize").DataTypes);

db.User.hasMany(db.Order, { foreignKey: "user_id" });
db.Order.belongsTo(db.User, { foreignKey: "user_id" });

db.Order.hasMany(db.OrderLine, { foreignKey: "order_id" });
db.OrderLine.belongsTo(db.Order, { foreignKey: "order_id" });

db.Book.hasMany(db.OrderLine, { foreignKey: "book_id" });
db.OrderLine.belongsTo(db.Book, { foreignKey: "book_id" });

module.exports = db;
