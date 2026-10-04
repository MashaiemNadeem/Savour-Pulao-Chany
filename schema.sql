-- ============================================================================
-- RESTAURANT MANAGEMENT SYSTEM & POS WITH DUAL ORDERING PATHWAYS
-- Database: MySQL 8.0+
-- Schema & Production Seed Data
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `restaurant_pos_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `restaurant_pos_db`;

-- Drop existing tables if re-initializing
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `expenses`;
DROP TABLE IF EXISTS `store_settings`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. USERS TABLE
-- Holds customers, cashiers, and store administrators with secure bcrypt password hashes
CREATE TABLE `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `first_name` VARCHAR(60) NOT NULL,
  `last_name` VARCHAR(60) NOT NULL,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `phone` VARCHAR(25) NOT NULL,
  `cnic` VARCHAR(20) NOT NULL UNIQUE COMMENT 'National Identity Card (e.g., 35201-1234567-1)',
  `role` ENUM('customer', 'cashier', 'admin') NOT NULL DEFAULT 'customer',
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_cnic` (`cnic`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. CATEGORIES TABLE
CREATE TABLE `categories` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(80) NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. PRODUCTS TABLE
CREATE TABLE `products` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `image_url` VARCHAR(500) NULL,
  `status` ENUM('available', 'out_of_stock') NOT NULL DEFAULT 'available',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_products_category` (`category_id`),
  INDEX `idx_products_status` (`status`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. ORDERS TABLE
-- Supports dual ordering pathways (delivery, pickup, pos)
CREATE TABLE `orders` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NULL COMMENT 'Null for walk-in / guest POS customers',
  `order_type` ENUM('delivery', 'pickup', 'pos') NOT NULL DEFAULT 'delivery',
  `customer_name` VARCHAR(120) NOT NULL,
  `customer_phone` VARCHAR(30) NOT NULL,
  `delivery_address` TEXT NULL,
  `lat_long` VARCHAR(100) NULL COMMENT 'Format: latitude,longitude from Geolocation API',
  `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `tax` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `tip` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `delivery_fee` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `cash_given` DECIMAL(10,2) NULL COMMENT 'Used for POS in-store cash calculation',
  `change_returned` DECIMAL(10,2) NULL COMMENT 'Cash returned to walk-in customer',
  `payment_status` ENUM('pending', 'paid', 'cash_on_delivery') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_orders_user` (`user_id`),
  INDEX `idx_orders_type` (`order_type`),
  INDEX `idx_orders_created` (`created_at`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. ORDER_ITEMS TABLE
-- Captures selected quantities, dynamic add-ons in JSON, and snapshot prices
CREATE TABLE `order_items` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NULL COMMENT 'Null for custom off-menu POS items',
  `custom_item_name` VARCHAR(150) NULL,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `add_ons_json` JSON NULL COMMENT 'JSON array of selected extras e.g. [{"name":"Cold Drink","price":120}]',
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  INDEX `idx_order_items_order` (`order_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. EXPENSES TABLE
-- Tracks daily operational expenditures for dual-track financial accounting
CREATE TABLE `expenses` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(150) NOT NULL,
  `category` VARCHAR(80) NOT NULL DEFAULT 'Operations',
  `amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_expenses_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. STORE_SETTINGS TABLE
-- Stores key-value runtime configuration (shop open/closed, flat delivery fees, tax rate, etc.)
CREATE TABLE `store_settings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(60) NOT NULL UNIQUE,
  `value` TEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- SEED DATA
-- Default Passwords: "Password123!" (hashed using PHP password_hash PASSWORD_BCRYPT)
-- ============================================================================

-- Seed Store Settings
INSERT INTO `store_settings` (`key`, `value`) VALUES
('is_open', '1'),
('flat_delivery_fee', '150.00'),
('tax_rate', '0.05'),
('opening_hours', '11:00 AM - 01:00 AM (Daily)'),
('announcement', 'Welcome to Zaffran Grill & Charcoal! Enjoy fresh coal-fired BBQ, Shinwari Handi, and artisanal tandoor.');

-- Seed Users
-- Passwords hash for 'Password123!'
INSERT INTO `users` (`first_name`, `last_name`, `email`, `phone`, `cnic`, `role`, `password_hash`) VALUES
('Hamza', 'Malik', 'admin@zaffran.com', '+92 300 8472910', '35201-1234567-1', 'admin', '$2y$10$eA09M8I8z3a4.vV6uYQjCOmY8lC2G7i3/jN0j4qU4X5ZtC891Wbfa'),
('Bilal', 'Tariq', 'cashier@zaffran.com', '+92 321 9876543', '35202-7654321-2', 'cashier', '$2y$10$eA09M8I8z3a4.vV6uYQjCOmY8lC2G7i3/jN0j4qU4X5ZtC891Wbfa'),
('Ayesha', 'Khan', 'customer@gmail.com', '+92 333 4567890', '35201-9988776-5', 'customer', '$2y$10$eA09M8I8z3a4.vV6uYQjCOmY8lC2G7i3/jN0j4qU4X5ZtC891Wbfa');

-- Seed Categories
INSERT INTO `categories` (`id`, `name`) VALUES
(1, 'Karahi & Handi Specials'),
(2, 'Charcoal BBQ & Grills'),
(3, 'Biryani & Rice'),
(4, 'Fast Food & Burgers'),
(5, 'Artisanal Naan & Tandoor'),
(6, 'Cold Drinks & Desserts');

-- Seed Products
INSERT INTO `products` (`id`, `category_id`, `title`, `description`, `price`, `image_url`, `status`) VALUES
(1, 1, 'Mutton Shinwari Karahi (Half KG)', 'Tender mountain mutton cooked in traditional animal fat with green chillies, black pepper, and fresh tomatoes.', 1650.00, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80', 'available'),
(2, 1, 'Chicken White Makhni Handi', 'Boneless chicken cubes simmered in fresh dairy cream, butter, roasted cashews, and aromatic spices.', 1350.00, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80', 'available'),
(3, 2, 'Reshmi Kabab Platter (4 Pcs)', 'Melt-in-mouth chicken mince skewers infused with saffron, ginger cream, and crushed coriander.', 850.00, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80', 'available'),
(4, 2, 'Charcoal Mutton Chops (Half Dozen)', 'Succulent mutton ribs marinated for 24 hours in raw papaya, mustard oil, and house garam masala.', 1890.00, 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', 'available'),
(5, 3, 'Special Dum Mutton Biryani', 'Aged long-grain basmati layered with slow-cooked spiced mutton, saffron milk, and fried onions.', 780.00, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80', 'available'),
(6, 4, 'Smoky Angus Beef Smash Burger', 'Double smashed beef patties with melted cheddar, caramelized onions, and house truffle mayo on a brioche bun.', 890.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', 'available'),
(7, 5, 'Roghani Sesame Naan', 'Fluffy leavened tandoor bread brushed with pure desi ghee and sprinkled with toasted sesame seeds.', 90.00, 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80', 'available'),
(8, 5, 'Garlic & Cheese Stuffed Naan', 'Filled with mozzarella and cheddar, finished with roasted garlic butter and fresh coriander.', 220.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', 'available'),
(9, 6, 'Gourmet Gulab Jamun (2 Pcs)', 'Warm milk-solid dumplings soaked in rose-cardamom sugar syrup and topped with pistachios.', 240.00, 'https://images.unsplash.com/photo-1667084583489-322ecfcf17b3?auto=format&fit=crop&w=800&q=80', 'available'),
(10, 6, 'Mint Margarita & Cold Drink 500ml', 'Chilled sparkling lime and fresh crushed garden mint cooler with soda.', 190.00, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80', 'available');

-- Seed Sample Expenses for Dual-Track Accounting
INSERT INTO `expenses` (`title`, `category`, `amount`, `date`) VALUES
('Farm Fresh Poultry & Meat Supply', 'Raw Materials', 14500.00, CURDATE() - INTERVAL 2 DAY),
('Weekly Dairy (Fresh Cream, Desi Ghee, Butter)', 'Raw Materials', 8200.00, CURDATE() - INTERVAL 2 DAY),
('Kitchen Natural Gas & Cylinder Refill', 'Utilities', 4500.00, CURDATE() - INTERVAL 1 DAY),
('Food Packaging, Boxes & Thermal Paper Rolls', 'Packaging', 3200.00, CURDATE() - INTERVAL 1 DAY),
('Vegetables, Fresh Mint, Green Chillies & Onions', 'Raw Materials', 2800.00, CURDATE());

-- Seed Sample Orders (Online vs In-Store POS)
INSERT INTO `orders` (`id`, `user_id`, `order_type`, `customer_name`, `customer_phone`, `delivery_address`, `lat_long`, `subtotal`, `tax`, `tip`, `delivery_fee`, `total`, `cash_given`, `change_returned`, `payment_status`, `created_at`) VALUES
(101, 3, 'delivery', 'Ayesha Khan', '+92 333 4567890', 'House 42, Street 8, Phase 5 DHA, Lahore', '31.4721,74.3812', 3000.00, 150.00, 150.00, 150.00, 3450.00, NULL, NULL, 'paid', CURDATE() - INTERVAL 2 DAY),
(102, NULL, 'pos', 'Walk-in Table 4 (Zubair)', '+92 322 1122334', 'In-Store Dining', NULL, 2540.00, 127.00, 100.00, 0.00, 2767.00, 3000.00, 233.00, 'paid', CURDATE() - INTERVAL 1 DAY),
(103, 3, 'pickup', 'Ayesha Khan', '+92 333 4567890', 'Customer Pickup Counter', NULL, 1650.00, 82.50, 50.00, 0.00, 1782.50, NULL, NULL, 'paid', CURDATE() - INTERVAL 1 DAY),
(104, NULL, 'pos', 'Mr. Aslam (Takeaway)', '+92 301 7766554', 'In-Store Counter', NULL, 1890.00, 94.50, 0.00, 0.00, 1984.50, 2000.00, 15.50, 'paid', CURDATE());

-- Seed Sample Order Items
INSERT INTO `order_items` (`order_id`, `product_id`, `custom_item_name`, `quantity`, `add_ons_json`, `price`) VALUES
(101, 1, NULL, 1, '[{"name": "Mint Raita", "price": 70}, {"name": "Roghani Naan", "price": 90}]', 1650.00),
(101, 2, NULL, 1, '[{"name": "Cold Drink 500ml", "price": 120}]', 1350.00),
(102, 3, NULL, 2, '[{"name": "Extra Spicy Chutney", "price": 40}]', 850.00),
(102, 7, NULL, 4, '[]', 90.00),
(103, 1, NULL, 1, '[{"name": "Roghani Naan", "price": 90}]', 1650.00),
(104, 4, NULL, 1, '[]', 1890.00);
