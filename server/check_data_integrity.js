const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = mysql.createPool(process.env.DATABASE_URL);

async function checkData() {
    try {
        const [users] = await pool.promise().query('SELECT COUNT(*) as count FROM users');
        const [products] = await pool.promise().query('SELECT COUNT(*) as count FROM inventory_products');
        const [stockIn] = await pool.promise().query('SELECT COUNT(*) as count FROM stock_in');
        const [stockOut] = await pool.promise().query('SELECT COUNT(*) as count FROM stock_out');

        console.log('--- Row Counts ---');
        console.log(`Users: ${users[0].count}`);
        console.log(`Products: ${products[0].count}`);
        console.log(`Stock In: ${stockIn[0].count}`);
        console.log(`Stock Out: ${stockOut[0].count}`);

        console.log('\n--- Data Integrity Check ---');
        // Check for orphaned Stock In
        const [orphanedIn] = await pool.promise().query(`
            SELECT count(*) as count 
            FROM stock_in si 
            LEFT JOIN inventory_products p ON si.product_id = p.id 
            WHERE p.id IS NULL
        `);
        console.log(`Orphaned Stock In (Invalid Product ID): ${orphanedIn[0].count}`);

        if (orphanedIn[0].count > 0) {
            const [sample] = await pool.promise().query(`
                SELECT si.id, si.product_id 
                FROM stock_in si 
                LEFT JOIN inventory_products p ON si.product_id = p.id 
                WHERE p.id IS NULL
                LIMIT 5
            `);
            console.log('Sample Orphans (Stock In):', sample);
        }

        // Check for orphaned Stock Out
        const [orphanedOut] = await pool.promise().query(`
            SELECT count(*) as count 
            FROM stock_out so 
            LEFT JOIN inventory_products p ON so.product_id = p.id 
            WHERE p.id IS NULL
        `);
        console.log(`Orphaned Stock Out (Invalid Product ID): ${orphanedOut[0].count}`);

        // Check Product IDs
        const [prodIds] = await pool.promise().query('SELECT id, name FROM inventory_products LIMIT 5');
        console.log('\n--- Sample Products ---');
        console.table(prodIds);

        // Check API Query Logic Manual
        const [apiResult] = await pool.promise().query(`
            SELECT si.id, p.name 
            FROM stock_in si
            JOIN inventory_products p ON si.product_id = p.id
            LIMIT 5
        `);
        console.log(`\nAPI Query Limit 5 (Stock In): ${apiResult.length} rows found.`);
        if (apiResult.length > 0) console.log(apiResult);

    } catch (err) {
        console.error(err);
    }
    process.exit();
}

checkData();
