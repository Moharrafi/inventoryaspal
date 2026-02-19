const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = mysql.createPool(process.env.DATABASE_URL);

async function debugQuery() {
    try {
        const [rows] = await pool.promise().query(`
            SELECT 
                si.id, 
                si.date, 
                'IN' as type, 
                si.product_id as productId, 
                p.name as productName, 
                si.quantity, 
                (si.quantity * p.price) as totalValue, 
                'Completed' as status, 
                si.notes,
                si.supplier,
                NULL as channel
            FROM stock_in si
            JOIN inventory_products p ON si.product_id = p.id
            ORDER BY date DESC 
            LIMIT 5
        `);

        console.log(`Returned ${rows.length} rows.`);
        if (rows.length > 0) {
            console.log('First row:', rows[0]);
        }
    } catch (err) {
        console.error(err);
    }
    process.exit();
}

debugQuery();
