module.exports = (sequelize, DataTypes) => {
    const Stock = sequelize.define('Stock', {
        stock_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        book_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    }, {
        tableName: 'stock',
        timestamps: true,
        underscored: true
    });
    return Stock;
};