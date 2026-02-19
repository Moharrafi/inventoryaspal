const mysql = require('mysql2/promise');
require('dotenv').config();

const checkDb = async () => {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('DATABASE_URL not set');
        process.exit(1);
    }

    let connection;
    try {
        connection = await mysql.createConnection({
            uri: dbUrl,
            ssl: { rejectUnauthorized: false }
        });

        console.log('Checking table counts...');

        // Check tables existence first
        const [tables] = await connection.query('SHOW TABLES');
        console.log('Tables in DB:', tables.map(t => Object.values(t)[0]));

        try {
            const [products] = await connection.query('SELECT COUNT(*) as count FROM inventory_products');
            console.log('inventory_products count:', products[0].count);
        } catch (e) { console.log('Error querying inventory_products:', e.message); }

        try {
            const [movements] = await connection.query('SELECT COUNT(*) as count FROM inventory_movements');
            console.log('inventory_movements count:', movements[0].count);
        } catch (e) { console.log('Error querying inventory_movements:', e.message); }

        try {
            const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
            console.log('users count:', users[0].count);
        } catch (e) { console.log('Error querying users:', e.message); }

    } catch (err) {
        console.error('Error connecting/querying:', err);
    } finally {
        if (connection) await connection.end();
    }
};

checkDb();
