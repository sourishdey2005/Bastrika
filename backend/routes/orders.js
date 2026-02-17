const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');

// Create Order (Protected)
router.post('/', authenticateToken, async (req, res) => {
    const { address_id, cart_items, total_price } = req.body;
    const user_id = req.user.id;

    if (!cart_items || cart_items.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
    }

    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        // 1. Create Order
        const orderResult = await client.query(
            'INSERT INTO orders (user_id, address_id, total_price, payment_status, order_status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [user_id, address_id, total_price, 'Paid', 'Pending']
        );
        const order_id = orderResult.rows[0].id;

        // 2. Insert Order Items & Update Stock
        for (const item of cart_items) {
            // Check stock and update
            const productResult = await client.query(
                'UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING price',
                [item.quantity, item.product_id]
            );

            if (productResult.rows.length === 0) {
                throw new Error(`Insufficient stock for product ID: ${item.product_id}`);
            }

            await client.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [order_id, item.product_id, item.quantity, item.price]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Order placed successfully', order_id });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Order failed', error: err.message });
    } finally {
        client.release();
    }
});

const isAdmin = require('../middleware/admin');

// Get All Orders (Admin)
router.get('/all', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT o.*, u.name as user_name, u.email as user_email, 
            (SELECT json_agg(oi) FROM order_items oi WHERE oi.order_id = o.id) as items 
            FROM orders o 
            JOIN users u ON o.user_id = u.id 
            ORDER BY o.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Update Order Status (Admin)
router.put('/:id/status', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const result = await db.query(
            'UPDATE orders SET order_status = $1 WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get User Orders (Protected)
router.get('/my-orders', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT o.*, (SELECT json_agg(oi) FROM order_items oi WHERE oi.order_id = o.id) as items FROM orders o WHERE o.user_id = $1 ORDER BY o.created_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
