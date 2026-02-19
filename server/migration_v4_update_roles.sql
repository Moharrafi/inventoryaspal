-- Update users table to support more flexible roles
-- Changing ENUM('admin', 'user') to VARCHAR(50) to support 'Admin', 'Manager', 'Staff'

-- Disable foreign key checks just in case
SET FOREIGN_KEY_CHECKS = 0;

-- Modify the column
ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'Staff';

-- Update existing values to match new Capitalized convention if needed
-- 'admin' -> 'Admin'
-- 'user' -> 'Staff' (Assuming 'user' maps to 'Staff')

UPDATE users SET role = 'Admin' WHERE role = 'admin';
UPDATE users SET role = 'Staff' WHERE role = 'user';

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
