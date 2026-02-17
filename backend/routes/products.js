const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');
const isAdmin = require('../middleware/admin');

// Get all products (Public)
router.get('/', async (req, res) => {
    try {
        const { cat } = req.query;
        let query = 'SELECT * FROM products';
        let params = [];

        if (cat) {
            query += ' WHERE category = $1';
            params.push(cat);
        }

        query += ' ORDER BY created_at DESC';
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get single product (Public)
router.get('/:id', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Create product (Admin)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, description, price, stock, image_url, category } = req.body;
        const result = await db.query(
            'INSERT INTO products (name, description, price, stock, image_url, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, description, price, stock, image_url, category]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Update product (Admin)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, description, price, stock, image_url, category } = req.body;
        const result = await db.query(
            'UPDATE products SET name = $1, description = $2, price = $3, stock = $4, image_url = $5, category = $6 WHERE id = $7 RETURNING *',
            [name, description, price, stock, image_url, category, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Delete product (Admin)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
