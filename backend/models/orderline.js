module.exports = (sequelize, DataTypes) => {
    const OrderLine = sequelize.define('OrderLine', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        }
    }, {
        tableName: 'orderlines',
        timestamps: false
    });
    return OrderLine;
};