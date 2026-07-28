const mysql = require('mysql2');
const path = require('path');

// Load environment variables from server/.env or root .env
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const isRemote = process.env.DB_HOST && process.env.DB_HOST !== 'localhost';

const dbConfig = process.env.DATABASE_URL ? {
    uri: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
} : {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'inventory_aspal',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    ssl: isRemote ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);
const promisePool = pool.promise();

module.exports = {
    query: (sql, params) => promisePool.query(sql, params),
    pool: promisePool
};
