const db = require('../models');
const Order = db.Order;
const OrderLine = db.OrderLine;
const Stock = db.Stock;
const Customer = db.Customer;
const sequelize = db.sequelize;

const createOrder = async (req, res) => {
    console.log('createOrder controller entered');
    let t;

    try {
        const { cart, payment_method } = req.body || {};
        const userId = req.user && req.user.id;

        if (!userId) {
            return res.status(401).json({ error: 'Login first to access this resource' });
        }

        if (!cart || cart.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        const customer = await Customer.findOne({
            where: { user_id: userId }
        });

        if (
            !customer ||
            !String(customer.phone || '').trim() ||
            !String(customer.address || '').trim()
        ) {
            return res.status(403).json({
                error: 'IncompleteProfile',
                message: 'Please update your profile address and phone number before placing an order.'
            });
        }

        console.log('createOrder before transaction');

        // Umpisa ng Database Transaction
        t = await sequelize.transaction();

        // 1. Gumawa ng Order Record
        const order = await Order.create({
            user_id: userId,
            shipping_fee: 100,
            payment_method: payment_method || 'Cash on Delivery'
        }, { transaction: t });

        // 2. I-loop ang Cart, I-save ang bawat OrderLine, at Bawasan ang Stock
        for (let i = 0; i < cart.length; i++) {
            const item = cart[i];

            // I-save ang item sa orderline
            await OrderLine.create({
                order_id: order.id,
                book_id: item.item_id,
                quantity: item.quantity,
                price: item.price
            }, { transaction: t });

            // Hanapin ang stock ng libro at bawasan
            const stock = await Stock.findOne({ 
                where: { book_id: item.item_id }, 
                transaction: t 
            });

            if (!stock || stock.quantity < item.quantity) {
                throw new Error(`Not enough stock for book ID: ${item.item_id}`);
            }

            await stock.decrement('quantity', { by: item.quantity, transaction: t });
        }

        // 3. I-commit ang Transaction kung walang error
        await t.commit();
        console.log('createOrder after transaction commit');

        return res.status(201).json({
            success: true,
            order_id: order.id,
            message: 'Transaction complete. Order is being processed.',
            cart
        });

    } catch (error) {
        console.log('createOrder catch block', error);
        // 4. I-rollback kung nagka-error (ibabalik lahat sa dati)
        if (t) {
            await t.rollback();
        }
        return res.status(500).json({ error: 'Transaction failed', details: error.message });
    }
};

const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [
                { model: db.User, attributes: ['id', 'first_name', 'last_name', 'email'] },
                { 
                    model: db.OrderLine, 
                    include: [{ model: db.Book, attributes: ['title', 'price'] }] 
                }
            ],
            order: [['date_placed', 'DESC']] // Pinakabago sa itaas
        });
        return res.status(200).json({ rows: orders });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
};

const myOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { user_id: req.user.id },
            include: [
                { 
                    model: db.OrderLine, 
                    include: [{ model: db.Book, attributes: ['title', 'price'] }] 
                }
            ],
            order: [['date_placed', 'DESC']]
        });
        return res.status(200).json({ rows: orders });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        await Order.update({ status }, { where: { id } });
        return res.status(200).json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

module.exports = { createOrder, getAllOrders, myOrders, updateOrderStatus };
