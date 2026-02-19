const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const seedData = async () => {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl || dbUrl.includes('placeholder') || dbUrl === 'postgres://user:password@host:port/dbname?sslmode=require') {
    process.exit(1);
  }

  let connection;
  try {
    console.log('Connecting to database...');

    connection = await mysql.createConnection({
      uri: dbUrl,
      multipleStatements: true,
      ssl: { rejectUnauthorized: false }
    });

    console.log('Reading SQL dump...');
    const dumpPath = path.join(__dirname, 'dump.sql');
    let sqlContent = fs.readFileSync(dumpPath, 'utf8');

    // Normalize newlines
    const content = sqlContent.replace(/\r\n/g, '\n');
    const lines = content.split('\n');

    // Extract INSERT statements (handling multi-line)
    const insertStatements = [];
    let currentStatement = '';
    let isCapturing = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('INSERT INTO')) {
        isCapturing = true;
        currentStatement = line;
      } else if (isCapturing) {
        currentStatement += '\n' + line;
      }

      if (isCapturing && trimmed.endsWith(';')) {
        insertStatements.push(currentStatement);
        currentStatement = '';
        isCapturing = false;
      }
    }

    console.log(`Found ${insertStatements.length} multi-line INSERT statements.`);

    console.log('Recreating tables with clean schema...');

    // Disable FK checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // Drop existing tables
    await connection.query('DROP TABLE IF EXISTS inventory_movements');
    await connection.query('DROP TABLE IF EXISTS inventory_products');
    await connection.query('DROP TABLE IF EXISTS login_attempts');
    await connection.query('DROP TABLE IF EXISTS users');

    // Manually define tables to avoid "Multiple primary key" errors from the dump DDL

    // 1. users
    await connection.query(`
      CREATE TABLE \`users\` (
        \`id\` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
        \`email\` varchar(150) NOT NULL,
        \`password_hash\` varchar(255) NOT NULL,
        \`name\` varchar(150) DEFAULT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        \`failed_attempts\` int(11) NOT NULL DEFAULT 0,
        \`lock_until\` datetime DEFAULT NULL,
        \`last_lock_at\` datetime DEFAULT NULL,
        \`is_blocked\` tinyint(1) NOT NULL DEFAULT 0,
        \`is_admin\` tinyint(1) NOT NULL DEFAULT 0,
        \`reset_token\` varchar(255) DEFAULT NULL,
        \`reset_expires\` datetime DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`users_email_unique\` (\`email\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. inventory_products
    await connection.query(`
      CREATE TABLE \`inventory_products\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`code\` varchar(50) NOT NULL,
        \`name\` varchar(150) NOT NULL,
        \`variant\` varchar(10) NOT NULL,
        \`stock\` int(11) NOT NULL DEFAULT 0,
        \`price\` bigint(20) NOT NULL DEFAULT 0,
        \`description\` text DEFAULT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`code\` (\`code\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    // 3. inventory_movements
    await connection.query(`
      CREATE TABLE \`inventory_movements\` (
        \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
        \`product_id\` int(11) NOT NULL,
        \`type\` enum('in','out') NOT NULL,
        \`quantity\` int(11) NOT NULL,
        \`date\` date NOT NULL,
        \`notes\` text DEFAULT NULL,
        \`customer\` varchar(150) DEFAULT NULL,
        \`supplier\` varchar(150) DEFAULT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (\`id\`),
        KEY \`fk_inventory_product\` (\`product_id\`),
        CONSTRAINT \`fk_inventory_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`inventory_products\` (\`id\`) ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    // 4. login_attempts
    await connection.query(`
      CREATE TABLE \`login_attempts\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`email\` varchar(150) DEFAULT NULL,
        \`ip\` varchar(45) DEFAULT NULL,
        \`success\` tinyint(1) NOT NULL DEFAULT 0,
        \`attempted_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (\`id\`),
        KEY \`idx_email_time\` (\`email\`,\`attempted_at\`),
        KEY \`idx_ip_time\` (\`ip\`,\`attempted_at\`),
        KEY \`idx_time\` (\`attempted_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    console.log('Inserting data...');
    // Execute inserts
    for (const insertSql of insertStatements) {
      // Ensure statement ends with semicolon if not present (dump usually has it)
      const sql = insertSql.trim().endsWith(';') ? insertSql : insertSql + ';';
      try {
        await connection.query(sql);
      } catch (err) {
        console.error('Error inserting data:', err.message);
        // Optional: throw err or continue
      }
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Final Error seeding database:', err);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
    process.exit(0);
  }
};

seedData();
