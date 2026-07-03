module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define('Order', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        shipping_fee: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 100.00
        },
        payment_method: {
            type: DataTypes.STRING(50),
            defaultValue: 'Cash on Delivery'
        },
        status: {
            type: DataTypes.STRING(50),
            defaultValue: 'Processing'
        }
    }, {
        tableName: 'orders',
        timestamps: true,
        createdAt: 'date_placed',
        updatedAt: 'date_shipped'
    });
    return Order;
};
