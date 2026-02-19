-- Disable foreign key checks to allow renaming/dropping
SET FOREIGN_KEY_CHECKS = 0;

-- Rename existing tables to backup
RENAME TABLE IF EXISTS users TO users_backup_v2;
RENAME TABLE IF EXISTS inventory_products TO inventory_products_backup_v2;
RENAME TABLE IF EXISTS inventory_movements TO inventory_movements_backup_v2;
RENAME TABLE IF EXISTS login_attempts TO login_attempts_backup_v2;

-- Create Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150),
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Inventory Products Table
CREATE TABLE inventory_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(50),
  description TEXT,
  price DECIMAL(15, 2) DEFAULT 0,
  stock INT DEFAULT 0,
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Inventory Movements Table
-- 'in' for inbound (purchases, returns), 'out' for outbound (sales, damages)
CREATE TABLE inventory_movements (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  type ENUM('in', 'out') NOT NULL,
  quantity INT NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  partner VARCHAR(150), -- Customer for 'out', Supplier for 'in'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES inventory_products(id) ON DELETE CASCADE
);

-- Create Login Attempts Table (keep for security)
CREATE TABLE login_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150),
  ip VARCHAR(45),
  success TINYINT(1) DEFAULT 0,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_time (email, attempted_at)
);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Seed Default Admin User (Password: admin123 - hash it later or use a known hash)
-- Using a placeholder hash for now. 
INSERT INTO users (name, email, password_hash, role) VALUES 
('Admin', 'admin@aspalpro.com', '$2y$10$9gYNq6EGm6pRydVrZQB1/OpbElcZUkeV.w4R..QQuqI7OFaj5eL/i', 'admin');
