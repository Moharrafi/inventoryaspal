const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = mysql.createPool(process.env.DATABASE_URL);

async function verify() {
    let connection;
    try {
        connection = await pool.promise().getConnection();
        console.log('Connected to database.');

        const testUser = {
            name: 'Test Manager',
            email: 'testmanager@example.com',
            role: 'Manager',
            password_hash: '$2y$10$9gYNq6EGm6pRydVrZQB1/OpbElcZUkeV.w4R..QQuqI7OFaj5eL/i' // dummy hash
        };

        // Check if user exists first to avoid duplicate errors if run multiple times
        const [existing] = await connection.query('SELECT * FROM users WHERE email = ?', [testUser.email]);
        if (existing.length > 0) {
            await connection.query('DELETE FROM users WHERE email = ?', [testUser.email]);
        }

        console.log('Attempting to insert user with role:', testUser.role);
        await connection.query('INSERT INTO users SET ?', testUser);
        console.log('Successfully inserted user with Manager role.');

        const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', [testUser.email]);
        console.log('Retrieved user:', rows[0]);

        if (rows[0].role === 'Manager') {
            console.log('VERIFICATION SUCCESS: Role is correctly saved as Manager.');
        } else {
            console.error('VERIFICATION FAILED: Role mismatch.');
        }

        // Clean up
        await connection.query('DELETE FROM users WHERE email = ?', [testUser.email]);

    } catch (err) {
        console.error('Verification failed:', err);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

verify();
