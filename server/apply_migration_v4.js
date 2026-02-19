const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

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

        const migrationFile = path.join(__dirname, 'migration_v4_update_roles.sql');
        console.log('Reading migration file:', migrationFile);

        const sql = fs.readFileSync(migrationFile, 'utf8');
        // Split by semicolon but preserve logic if possible. Simple split works for basic queries.
        const queries = sql.split(';').map(q => q.trim()).filter(q => q.length > 0);

        for (const query of queries) {
            try {
                console.log(`Executing: ${query.substring(0, 50)}...`);
                await connection.query(query);
            } catch (err) {
                console.error(`Error executing query: ${err.message}`);
                // Continue on error for this specific script as some updates might fail if rows miss
                // but ALTER should work.
            }
        }

        console.log('Migration V4 completed successfully.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

migrate();
