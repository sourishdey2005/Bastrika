const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');
const isAdmin = require('../middleware/admin');

// Admin Stats
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        const totalOrders = await db.query('SELECT COUNT(*) FROM orders');
        const totalRevenue = await db.query('SELECT SUM(total_price) FROM orders');
        const totalProducts = await db.query('SELECT COUNT(*) FROM products');
        const pendingOrders = await db.query("SELECT COUNT(*) FROM orders WHERE order_status = 'Pending'");

        res.json({
            totalOrders: totalOrders.rows[0].count,
            totalRevenue: totalRevenue.rows[0].sum || 0,
            totalProducts: totalProducts.rows[0].count,
            pendingOrders: pendingOrders.rows[0].count
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Admin Product Management
router.post('/products', authenticateToken, isAdmin, async (req, res) => {
    const { name, description, price, stock, image_url } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO products (name, description, price, stock, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, description, price, stock, image_url]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

router.put('/products/:id', authenticateToken, isAdmin, async (req, res) => {
    const { name, description, price, stock, image_url } = req.body;
    try {
        const result = await db.query(
            'UPDATE products SET name=$1, description=$2, price=$3, stock=$4, image_url=$5 WHERE id=$6 RETURNING *',
            [name, description, price, stock, image_url, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Admin Order Management
router.get('/orders', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await db.query(`
      SELECT o.*, u.name as user_name, u.email as user_email, a.full_address 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      LEFT JOIN addresses a ON o.address_id = a.id 
      ORDER BY o.created_at DESC
    `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

router.patch('/orders/:id/status', authenticateToken, isAdmin, async (req, res) => {
    const { order_status } = req.body;
    try {
        const result = await db.query(
            'UPDATE orders SET order_status = $1 WHERE id = $2 RETURNING *',
            [order_status, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
