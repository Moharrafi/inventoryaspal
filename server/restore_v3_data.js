const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = mysql.createPool(process.env.DATABASE_URL);
const TIMESTAMP = '1771454477289';
const BACKUP_MOVEMENTS = `inventory_movements_backup_${TIMESTAMP}`;
const BACKUP_PRODUCTS = `inventory_products_backup_${TIMESTAMP}`;
const BACKUP_USERS = `users_backup_${TIMESTAMP}`;

async function restoreData() {
    let connection;
    try {
        connection = await pool.promise().getConnection();
        console.log('Restoring data...');

        // 0. Disable FK checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // 1. Restore Users (optional, safeguard against duplicate admin)
        // We use INSERT IGNORE to keep the seeded admin if it conflicts, or update.
        // Actually, seeded admin has ID 1. Backup might have ID 1.
        // Let's truncate users first if we want full restore, but that kills the new admin.
        // Better: INSERT IGNORE.
        console.log(`Restoring Users from ${BACKUP_USERS}...`);
        const [usersRes] = await connection.query(`
            INSERT IGNORE INTO users (id, name, email, password_hash, role, created_at)
            SELECT id, name, email, password_hash, role, created_at FROM ${BACKUP_USERS}
        `);
        console.log(`Restored users: ${usersRes.affectedRows}`);

        // 2. Restore Products
        console.log(`Restoring Products from ${BACKUP_PRODUCTS}...`);
        const [prodRes] = await connection.query(`
            INSERT IGNORE INTO inventory_products (id, sku, name, category, description, price, stock, image_url, created_at)
            SELECT id, sku, name, category, description, price, stock, image_url, created_at FROM ${BACKUP_PRODUCTS}
        `);
        console.log(`Restored products: ${prodRes.affectedRows}`);

        // 3. Restore IN
        console.log(`Restoring IN movements from ${BACKUP_MOVEMENTS}...`);
        const [inResult] = await connection.query(`
            INSERT INTO stock_in (product_id, quantity, date, notes, supplier, created_at)
            SELECT product_id, quantity, date, notes, partner, created_at
            FROM ${BACKUP_MOVEMENTS}
            WHERE type = 'in'
        `);
        console.log(`Restored IN records: ${inResult.affectedRows}`);

        // 4. Restore OUT
        console.log(`Restoring OUT movements from ${BACKUP_MOVEMENTS}...`);
        const [outResult] = await connection.query(`
            INSERT INTO stock_out (product_id, quantity, date, notes, customer, created_at)
            SELECT product_id, quantity, date, notes, partner, created_at
            FROM ${BACKUP_MOVEMENTS}
            WHERE type = 'out'
        `);
        console.log(`Restored OUT records: ${outResult.affectedRows}`);

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Restoration completed.');

    } catch (err) {
        console.error('Restoration failed:', err);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

restoreData();
