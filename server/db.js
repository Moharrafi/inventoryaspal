const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool(process.env.DATABASE_URL);
const promisePool = pool.promise();

module.exports = {
    query: (sql, params) => promisePool.query(sql, params),
    pool: promisePool
};
