-- QuickKcal 数据库初始化脚本

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid VARCHAR(255) UNIQUE NOT NULL,
  sex ENUM('male', 'female') NOT NULL,
  age INT NOT NULL,
  height_cm DECIMAL(5,2) NOT NULL,
  weight_kg DECIMAL(5,2) NOT NULL,
  activity_level ENUM('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active') NOT NULL,
  goal_type ENUM('lose', 'maintain', 'gain') NOT NULL,
  rate_kcal_per_day INT DEFAULT 0,
  calorie_goal INT NOT NULL,
  macro_c INT DEFAULT 45,
  macro_p INT DEFAULT 25,
  macro_f INT DEFAULT 30,
  bmr INT NOT NULL,
  tdee INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_uid (uid)
);

-- 创建食物表
CREATE TABLE IF NOT EXISTS foods (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255),
  kcal_per_100g DECIMAL(8,2) NOT NULL,
  carbs_per_100g DECIMAL(8,2) DEFAULT 0,
  protein_per_100g DECIMAL(8,2) DEFAULT 0,
  fat_per_100g DECIMAL(8,2) DEFAULT 0,
  fiber_per_100g DECIMAL(8,2) DEFAULT 0,
  sugar_per_100g DECIMAL(8,2) DEFAULT 0,
  sodium_per_100g DECIMAL(8,2) DEFAULT 0,
  serving_label VARCHAR(255),
  grams_per_serving DECIMAL(8,2),
  source ENUM('USDA', 'OFF', 'CUSTOM') NOT NULL,
  barcode VARCHAR(255),
  category VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_brand (brand),
  INDEX idx_barcode (barcode),
  INDEX idx_source (source)
);

-- 创建日记条目表
CREATE TABLE IF NOT EXISTS diary_entries (
  id VARCHAR(255) PRIMARY KEY,
  user_uid VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
  food_id VARCHAR(255),
  food_name VARCHAR(255) NOT NULL,
  custom_name VARCHAR(255),
  amount DECIMAL(8,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  source VARCHAR(50) NOT NULL,
  kcal DECIMAL(8,2) NOT NULL,
  carbs DECIMAL(8,2) DEFAULT 0,
  protein DECIMAL(8,2) DEFAULT 0,
  fat DECIMAL(8,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE,
  INDEX idx_user_date (user_uid, date),
  INDEX idx_meal_type (meal_type)
);

-- 创建运动条目表
CREATE TABLE IF NOT EXISTS exercise_entries (
  id VARCHAR(255) PRIMARY KEY,
  user_uid VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  time TIME,
  category ENUM('cardio', 'strength') NOT NULL,
  name VARCHAR(255) NOT NULL,
  duration_min INT NOT NULL,
  calories DECIMAL(8,2) NOT NULL,
  distance DECIMAL(8,2),
  sets INT,
  reps INT,
  weight DECIMAL(8,2),
  notes TEXT,
  met_value DECIMAL(4,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE,
  INDEX idx_user_date (user_uid, date),
  INDEX idx_category (category)
);

-- 插入示例食物数据
INSERT IGNORE INTO foods (id, name, brand, kcal_per_100g, carbs_per_100g, protein_per_100g, fat_per_100g, serving_label, grams_per_serving, source, category) VALUES
('usda_01001', 'Butter, salted', NULL, 717, 0.06, 0.85, 81.11, '1 tbsp', 14.2, 'USDA', 'Dairy'),
('usda_11124', 'Carrots, raw', NULL, 41, 9.58, 0.93, 0.24, '1 medium', 61, 'USDA', 'Vegetables'),
('usda_05062', 'Chicken, broilers or fryers, breast, meat only, cooked, roasted', NULL, 165, 0, 31.02, 3.57, '1 breast', 172, 'USDA', 'Poultry'),
('usda_09040', 'Bananas, raw', NULL, 89, 22.84, 1.09, 0.33, '1 medium', 118, 'USDA', 'Fruits'),
('usda_20081', 'Wheat flour, white, all-purpose, enriched, bleached', NULL, 364, 76.31, 10.33, 0.98, '1 cup', 125, 'USDA', 'Grains'),
('off_3017620422003', 'Nutella', 'Ferrero', 539, 57.5, 6.3, 30.9, '1 tbsp', 20, 'OFF', 'Spreads'),
('off_7622210951965', 'KitKat', 'Nestlé', 518, 59.2, 7.3, 27.6, '1 bar', 41.5, 'OFF', 'Snacks'),
('off_8901030865507', 'Coca-Cola', 'The Coca-Cola Company', 42, 10.6, 0, 0, '1 can', 330, 'OFF', 'Beverages'),
('off_3228857000906', 'Greek Yogurt, Plain', 'Fage', 97, 4.0, 10.0, 5.0, '1 container', 170, 'OFF', 'Dairy'),
('off_4901777317789', 'Instant Ramen Noodles', 'Nissin', 448, 58.6, 9.4, 19.8, '1 package', 85, 'OFF', 'Prepared Foods');