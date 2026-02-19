const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('Connecting to database...');
const pool = mysql.createPool(process.env.DATABASE_URL);

async function restoreDump() {
    let connection;
    try {
        connection = await pool.promise().getConnection();
        console.log('Connected to database.');

        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('SET UNIQUE_CHECKS = 0');

        console.log('Creating old tables...');

        // Re-create tables (same as before)
        await connection.query(`DROP TABLE IF EXISTS old_users`);
        await connection.query(`
            CREATE TABLE old_users (
              id int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
              email varchar(150) NOT NULL,
              password_hash varchar(255) NOT NULL,
              name varchar(150) DEFAULT NULL,
              created_at timestamp NOT NULL DEFAULT current_timestamp(),
              failed_attempts int(11) NOT NULL DEFAULT 0,
              lock_until datetime DEFAULT NULL,
              last_lock_at datetime DEFAULT NULL,
              is_blocked tinyint(1) NOT NULL DEFAULT 0,
              is_admin tinyint(1) NOT NULL DEFAULT 0,
              reset_token varchar(255) DEFAULT NULL,
              reset_expires datetime DEFAULT NULL,
              PRIMARY KEY (id),
              UNIQUE KEY users_email_unique (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        await connection.query(`DROP TABLE IF EXISTS old_inventory_products`);
        await connection.query(`
            CREATE TABLE old_inventory_products (
              id int(11) NOT NULL AUTO_INCREMENT,
              code varchar(50) NOT NULL,
              name varchar(150) NOT NULL,
              variant varchar(10) NOT NULL,
              stock int(11) NOT NULL DEFAULT 0,
              price bigint(20) NOT NULL DEFAULT 0,
              description text DEFAULT NULL,
              created_at timestamp NOT NULL DEFAULT current_timestamp(),
              updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
              PRIMARY KEY (id),
              UNIQUE KEY code (code)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        await connection.query(`DROP TABLE IF EXISTS old_inventory_movements`);
        await connection.query(`
            CREATE TABLE old_inventory_movements (
              id bigint(20) NOT NULL AUTO_INCREMENT,
              product_id int(11) NOT NULL,
              type enum('in','out') NOT NULL,
              quantity int(11) NOT NULL,
              date date NOT NULL,
              notes text DEFAULT NULL,
              customer varchar(150) DEFAULT NULL,
              supplier varchar(150) DEFAULT NULL,
              created_at timestamp NOT NULL DEFAULT current_timestamp(),
              PRIMARY KEY (id),
              KEY fk_inventory_product (product_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        await connection.query(`DROP TABLE IF EXISTS old_login_attempts`);
        await connection.query(`
            CREATE TABLE old_login_attempts (
              id int(11) NOT NULL AUTO_INCREMENT,
              email varchar(150) DEFAULT NULL,
              ip varchar(45) DEFAULT NULL,
              success tinyint(1) NOT NULL DEFAULT 0,
              attempted_at timestamp NOT NULL DEFAULT current_timestamp(),
              PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        console.log('Old tables created. Parsing inserts...');

        const dumpPath = path.join(__dirname, 'dump.sql');
        const sql = fs.readFileSync(dumpPath, 'utf8');

        const chunks = sql.split(';'); // Split by statement delimiter

        let insertCount = 0;
        for (const chunk of chunks) {
            let stmt = chunk.trim();
            // Robustly finding INSERT INTO `tablename`
            const match = stmt.match(/INSERT INTO `([a-z_]+)`/i);

            if (match) {
                const tableName = match[1];
                if (['users', 'inventory_products', 'inventory_movements', 'login_attempts'].includes(tableName)) {
                    // Replace table name with old_tableName
                    // We use regex with capture group to replace only the table name part
                    stmt = stmt.replace(/INSERT INTO `([a-z_]+)`/i, `INSERT INTO \`old_$1\``);
                    try {
                        await connection.query(stmt);
                        insertCount++;
                        console.log(`Inserted into old_${tableName}`);
                    } catch (err) {
                        console.error(`Error inserting into old_${tableName}:`, err.message);
                    }
                }
            }
        }

        console.log(`Restore completed. Executed ${insertCount} INSERT statements.`);

        // Verify
        const [users] = await connection.query('SELECT COUNT(*) as count FROM old_users');
        const [products] = await connection.query('SELECT COUNT(*) as count FROM old_inventory_products');
        console.log(`old_users count: ${users[0].count}`);
        console.log(`old_products count: ${products[0].count}`);

    } catch (err) {
        console.error('Restore failed:', err);
    } finally {
        if (connection) {
            await connection.query('SET FOREIGN_KEY_CHECKS = 1');
            await connection.query('SET UNIQUE_CHECKS = 1');
            connection.release();
        }
        process.exit();
    }
}

restoreDump();
