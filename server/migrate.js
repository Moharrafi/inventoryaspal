const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('Script directory:', __dirname);
console.log('Loading .env from:', path.join(__dirname, '.env'));

if (!process.env.DATABASE_URL) {
    console.error('CRITICAL: DATABASE_URL is not defined.');
    process.exit(1);
}

const pool = mysql.createPool(process.env.DATABASE_URL);

async function migrate() {
    let connection;
    try {
        console.log('Attempting to get connection...');
        connection = await pool.promise().getConnection();
        console.log('Connected to database.');

        const migrationFile = path.join(__dirname, 'migration_v3.sql');
        console.log('Reading migration file:', migrationFile);

        const sql = fs.readFileSync(migrationFile, 'utf8');
        const queries = sql.split(';').map(q => q.trim()).filter(q => q.length > 0);

        // Disable FK checks for schema changes
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        for (const query of queries) {
            try {
                console.log(`Executing: ${query.substring(0, 50)}...`);
                await connection.query(query);
            } catch (err) {
                // Ignore "Table already exists" or "Unknown table" during drop if harmless
                console.error(`Error executing query: ${err.message}`);
                // We don't exit here, we try to continue or let the user know.
                // Ideally for this migration we want it to succeed.
                if (err.errno === 1050) { // Table already exists
                    console.log('Table already exists, continuing...');
                } else if (err.errno === 1051) { // Unknown table to drop
                    console.log('Table to drop does not exist, continuing...');
                } else {
                    throw err;
                }
            }
        }

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Migration V3 completed successfully.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

migrate();
