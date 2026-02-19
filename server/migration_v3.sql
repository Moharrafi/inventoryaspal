-- Migration V3: Split inventory_movements into stock_in and stock_out

-- 1. Create stock_in table
CREATE TABLE IF NOT EXISTS stock_in (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    supplier VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES inventory_products(id) ON DELETE CASCADE
);

-- 2. Create stock_out table
CREATE TABLE IF NOT EXISTS stock_out (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    customer VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES inventory_products(id) ON DELETE CASCADE
);

-- 3. Copy existing IN data to stock_in
INSERT INTO stock_in (product_id, quantity, date, notes, supplier, created_at)
SELECT product_id, quantity, date, notes, partner, created_at
FROM inventory_movements
WHERE type = 'in';

-- 4. Copy existing OUT data to stock_out
INSERT INTO stock_out (product_id, quantity, date, notes, customer, created_at)
SELECT product_id, quantity, date, notes, partner, created_at
FROM inventory_movements
WHERE type = 'out';

-- 5. Drop old table
DROP TABLE inventory_movements;
