const express = require('express');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Test Connection
app.get('/api/health', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT NOW() as now');
        res.json({ status: 'ok', time: rows[0].now });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Products Routes
app.get('/api/products', async (req, res) => {
    try {
        // Map database columns to frontend expectations
        // database: id, code, name, variant, stock, price, description
        // frontend: id, name, sku, category, price, cost, stock, minStock, status, image
        const [rows] = await db.query(`
            SELECT 
                id, 
                name, 
                sku, 
                category, 
                price, 
                0 as cost, 
                stock, 
                10 as minStock, 
                CASE WHEN stock > 0 THEN 'Active' ELSE 'Out of Stock' END as status,
                COALESCE(image_url, 'https://placehold.co/100') as image 
            FROM inventory_products 
            ORDER BY id ASC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Transactions Routes
// Transactions Routes (Unified from stock_in and stock_out)
app.get('/api/transactions', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                si.id, 
                si.date, 
                'IN' as type, 
                si.product_id as productId, 
                p.name as productName, 
                si.quantity, 
                (si.quantity * p.price) as totalValue, 
                'Completed' as status, 
                si.notes,
                si.supplier,
                NULL as channel
            FROM stock_in si
            JOIN inventory_products p ON si.product_id = p.id
            
            UNION ALL
            
            SELECT 
                so.id, 
                so.date, 
                'OUT' as type, 
                so.product_id as productId, 
                p.name as productName, 
                so.quantity, 
                (so.quantity * p.price) as totalValue, 
                'Completed' as status, 
                so.notes,
                NULL as supplier,
                so.customer as channel
            FROM stock_out so
            JOIN inventory_products p ON so.product_id = p.id
            
            ORDER BY date DESC 
            LIMIT 1000
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Transaction
app.post('/api/transactions', async (req, res) => {
    const conn = await db.promise().getConnection();
    try {
        await conn.beginTransaction();

        const { productId, type, quantity, date, notes, supplier, channel } = req.body;
        const typeLower = type.toLowerCase(); // 'in' or 'out'

        if (typeLower === 'in') {
            await conn.query(`
                INSERT INTO stock_in (product_id, quantity, date, notes, supplier)
                VALUES (?, ?, ?, ?, ?)
            `, [productId, quantity, date, notes, supplier]);

            // Update Stock (+)
            await conn.query(`UPDATE inventory_products SET stock = stock + ? WHERE id = ?`, [quantity, productId]);

        } else if (typeLower === 'out') {
            await conn.query(`
                INSERT INTO stock_out (product_id, quantity, date, notes, customer)
                VALUES (?, ?, ?, ?, ?)
            `, [productId, quantity, date, notes, channel]);

            // Update Stock (-)
            await conn.query(`UPDATE inventory_products SET stock = stock - ? WHERE id = ?`, [quantity, productId]);
        }

        await conn.commit();
        res.json({ success: true });

    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});


// Update Transaction
app.put('/api/transactions/:id', async (req, res) => {
    const conn = await db.promise().getConnection();
    try {
        await conn.beginTransaction();

        const { id } = req.params;
        const { type, productId, quantity, notes, supplier, channel, date } = req.body;
        const typeLower = type.toLowerCase(); // 'in' or 'out'

        // 1. Get Old Transaction Data to Revert Stock
        let oldTx = null;
        let table = '';
        if (typeLower === 'in') {
            table = 'stock_in';
        } else {
            table = 'stock_out';
        }

        const [rows] = await conn.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
        oldTx = rows[0];

        if (!oldTx) {
            throw new Error('Transaction not found');
        }

        // 2. Revert Old Stock Effect
        // If it was IN, we SUBTRACT old quantity from stock
        // If it was OUT, we ADD old quantity to stock
        // Note: Use oldTx.product_id incase product was changed (though UI might restrict this, backend should handle it)
        if (typeLower === 'in') {
            await conn.query('UPDATE inventory_products SET stock = stock - ? WHERE id = ?', [oldTx.quantity, oldTx.product_id]);
        } else {
            await conn.query('UPDATE inventory_products SET stock = stock + ? WHERE id = ?', [oldTx.quantity, oldTx.product_id]);
        }

        // 3. Update Transaction Record
        if (typeLower === 'in') {
            await conn.query(`
                UPDATE stock_in 
                SET product_id = ?, quantity = ?, date = ?, notes = ?, supplier = ?
                WHERE id = ?
            `, [productId, quantity, date, notes, supplier, id]);
        } else {
            await conn.query(`
                UPDATE stock_out 
                SET product_id = ?, quantity = ?, date = ?, notes = ?, customer = ?
                WHERE id = ?
            `, [productId, quantity, date, notes, channel, id]);
        }

        // 4. Apply New Stock Effect
        // If IN, ADD new quantity
        // If OUT, SUBTRACT new quantity
        if (typeLower === 'in') {
            await conn.query('UPDATE inventory_products SET stock = stock + ? WHERE id = ?', [quantity, productId]);
        } else {
            await conn.query('UPDATE inventory_products SET stock = stock - ? WHERE id = ?', [quantity, productId]);
        }

        await conn.commit();
        res.json({ success: true });

    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});// Sales Data Routes
app.get('/api/sales', async (req, res) => {
    try {
        // Aggregate sales data by month from inventory_movements
        // This simulates the previous mock data structure: name (Month), revenue, profit, orders
        const [rows] = await db.query(`
            SELECT 
                DATE_FORMAT(so.date, '%b') as name,
                SUM(so.quantity * p.price) as revenue,
                SUM(so.quantity * p.price * 0.3) as profit, -- Estimated 30% profit margin
                COUNT(so.id) as orders
            FROM stock_out so
            JOIN inventory_products p ON so.product_id = p.id
            GROUP BY DATE_FORMAT(so.date, '%Y-%m'), DATE_FORMAT(so.date, '%b')
            ORDER BY DATE_FORMAT(so.date, '%Y-%m') ASC
            LIMIT 12
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Users Routes
app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                id, 
                name, 
                email, 
                role, 
                'Active' as last_active, 
                'https://ui-avatars.com/api/?name=' || name || '&background=random' as avatar 
            FROM users 
            ORDER BY id ASC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = rows[0];

        // Verify password
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Don't send password hash back
        delete user.password_hash;

        res.json({ success: true, user });

    } catch (err) {
        console.error('Login Error:', err); // Added logging
        res.status(500).json({ error: err.message });
    }
});

// Create User
app.post('/api/users', async (req, res) => {
    try {
        const { name, email, role, password } = req.body;
        // Default password if not provided
        const plainPassword = password || 'admin123';
        const hash = await bcrypt.hash(plainPassword, 10);

        const [result] = await db.query(
            'INSERT INTO users (name, email, role, password_hash) VALUES (?, ?, ?, ?)',
            [name, email, role, hash]
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Update User
app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role, password } = req.body;

        if (password) {
            const hash = await bcrypt.hash(password, 10);
            await db.query(
                'UPDATE users SET name = ?, email = ?, role = ?, password_hash = ? WHERE id = ?',
                [name, email, role, hash, id]
            );
        } else {
            await db.query(
                'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
                [name, email, role, id]
            );
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete User
app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
