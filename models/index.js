const sequelize = require('../config/database');
const Book = require('./book');
const Stock = require('./stock');

const db = {};
db.Book = Book(sequelize, require('sequelize').DataTypes);
db.Stock = Stock(sequelize, require('sequelize').DataTypes);

db.Book.hasOne(db.Stock, {
    foreignKey: 'book_id',
    onDelete: 'CASCADE'
});
db.Stock.belongsTo(db.Book, {
    foreignKey: 'book_id'
});

db.sequelize = sequelize;
db.Sequelize = require('sequelize');

const User = require('./user');
const Customer = require('./customer');

db.User = User(sequelize, require('sequelize').DataTypes);
db.Customer = Customer(sequelize, require('sequelize').DataTypes);

db.User.hasOne(db.Customer, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.Customer.belongsTo(db.User, { foreignKey: 'user_id' });

module.exports = db;