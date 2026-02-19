const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = mysql.createPool(process.env.DATABASE_URL);
const BACKUP_TABLE = 'inventory_movements_backup_1771454477289';

async function checkBackup() {
    try {
        const [rows] = await pool.promise().query(`
            SELECT type, COUNT(*) as count 
            FROM ${BACKUP_TABLE} 
            GROUP BY type
        `);
        console.log('Backup Counts:', rows);
    } catch (err) {
        console.error(err);
    }
    process.exit();
}

checkBackup();
