const mysql = require('mysql2');
require('dotenv').config();

console.log('Connecting to:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@')); // Hide password

const pool = mysql.createPool(process.env.DATABASE_URL); // Use createPool as in db.js

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Connection failed:', err);
        return;
    }
    console.log('Connected to database.');

    connection.query('SHOW DATABASES;', (err, results) => {
        if (err) {
            console.error('Error listing databases:', err);
        } else {
            console.log('Databases:', results);
        }

        // Try to create a dummy database to check permissions
        connection.query('CREATE DATABASE IF NOT EXISTS test_creation_db;', (err, results) => {
            if (err) {
                console.error('Error creating database:', err);
                console.log('Likely do not have CREATE DATABASE permissions.');
            } else {
                console.log('Successfully created test database. You have permissions.');
                // Clean up
                connection.query('DROP DATABASE test_creation_db;', () => {
                    connection.release();
                    process.exit(0);
                });
            }
        });
    });
});
