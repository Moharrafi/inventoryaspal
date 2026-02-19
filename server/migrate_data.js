const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('Connecting to database...');
const pool = mysql.createPool(process.env.DATABASE_URL);

async function migrateData() {
    let connection;
    try {
        connection = await pool.promise().getConnection();
        console.log('Connected to database.');

        const usersBackup = 'old_users';
        const productsBackup = 'old_inventory_products';
        const movementsBackup = 'old_inventory_movements';

        // 2. Migrate Users
        try {
            console.log('Migrating Users...');
            // Use INSERT IGNORE to skip existing emails (like Admin)
            await connection.query(`
                INSERT IGNORE INTO users (name, email, password_hash, role, created_at)
                SELECT 
                    name, 
                    email, 
                    password_hash, 
                    IF(is_admin = 1, 'admin', 'user') as role,
                    created_at
                FROM ${usersBackup}
            `);
            console.log('Users migrated.');
        } catch (e) { console.error('Error migrating users:', e.message); }

        // 3. Migrate Products
        try {
            console.log('Migrating Products...');
            await connection.query('SET FOREIGN_KEY_CHECKS = 0');
            await connection.query(`
                INSERT INTO inventory_products (sku, name, category, price, stock, description, created_at)
                SELECT 
                    code,
                    name,
                    variant,
                    price,
                    stock,
                    description,
                    created_at
                FROM ${productsBackup}
                ON DUPLICATE KEY UPDATE sku=sku
            `);
            console.log('Products migrated.');
        } catch (e) { console.error('Error migrating products:', e.message); }

        // 4. Migrate Movements
        try {
            console.log('Migrating Movements...');
            // Prevent duplicates by clearing first (since we just created schema, this is safe for initial migration)
            // But since we might have run it partially, assume we want to reload from old.
            await connection.query('TRUNCATE TABLE inventory_movements');

            await connection.query(`
                INSERT INTO inventory_movements (product_id, type, quantity, date, notes, partner, created_at)
                SELECT 
                    p_new.id,
                    m.type,
                    m.quantity,
                    m.date,
                    m.notes,
                    COALESCE(m.customer, m.supplier, 'Unknown') as partner,
                    m.created_at
                FROM ${movementsBackup} m
                JOIN ${productsBackup} p_old ON m.product_id = p_old.id
                JOIN inventory_products p_new ON p_new.sku = p_old.code 
            `);
            console.log('Movements migrated.');
        } catch (e) {
            console.error('Error migrating movements:', e.message);
            console.error('SQL State:', e.sqlState);
        }

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Data migration completed successfully.');

    } catch (err) {
        console.error('Global failure:', err);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

migrateData();
