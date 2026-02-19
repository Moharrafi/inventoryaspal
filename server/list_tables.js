const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = mysql.createPool(process.env.DATABASE_URL);

async function listTables() {
    try {
        const [rows] = await pool.promise().query('SHOW TABLES');
        console.log('Tables in database:');
        rows.forEach(row => {
            console.log(Object.values(row)[0]);
        });
    } catch (err) {
        console.error(err);
    } // Exit
    process.exit();
}

listTables();
