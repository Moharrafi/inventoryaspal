const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = mysql.createPool(process.env.DATABASE_URL);

async function checkColumns() {
    try {
        const [stockInParams] = await pool.promise().query('DESCRIBE stock_in');
        console.log('--- stock_in columns ---');
        stockInParams.forEach(row => {
            console.log(`${row.Field} (${row.Type})`);
        });

        const [stockOutParams] = await pool.promise().query('DESCRIBE stock_out');
        console.log('\n--- stock_out columns ---');
        stockOutParams.forEach(row => {
            console.log(`${row.Field} (${row.Type})`);
        });

    } catch (err) {
        console.error(err);
    }
    process.exit();
}

checkColumns();
