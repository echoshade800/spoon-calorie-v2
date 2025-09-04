/**
 * MySQL Database utilities for food data management
 * Handles food database, user profiles, diary entries, and exercise data
 */
import mysql from 'mysql2/promise';

const DB_CONFIG = {
  host: 'vsa-db-dev.cb462qmg6ec1.us-east-1.rds.amazonaws.com',
  port: 3306,
  user: 'miniapp1',
  password: 'miniapp@20251',
  database: 'calorie',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
};

let pool = null;

/**
 * Initialize MySQL connection pool and create tables
 */
export const initializeDatabase = async () => {
  try {
    console.log('Initializing MySQL database connection...');
    
    // Create connection pool
    pool = mysql.createPool(DB_CONFIG);
    
    // Test connection
    const connection = await pool.getConnection();
    console.log('MySQL connection established successfully');
    connection.release();
    
    // Create tables
    await createTables();
    
    // Insert sample data if needed
    await insertSampleDataIfNeeded();
    
    console.log('Database initialized successfully');
    return pool;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

/**
 * Create all necessary tables
 */
const createTables = async () => {
  try {
    console.log('Creating database tables...');
    
    // Foods table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS foods (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
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
        source VARCHAR(50) NOT NULL,
        barcode VARCHAR(255),
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_foods_name (name),
        INDEX idx_foods_brand (brand),
        INDEX idx_foods_barcode (barcode),
        INDEX idx_foods_source (source)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // User profiles table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id VARCHAR(255) PRIMARY KEY,
        sex ENUM('male', 'female') NOT NULL,
        age INT NOT NULL,
        height_cm DECIMAL(5,2) NOT NULL,
        weight_kg DECIMAL(5,2) NOT NULL,
        activity_level VARCHAR(50) NOT NULL,
        goal_type VARCHAR(50) NOT NULL,
        rate_kcal_per_day INT DEFAULT 0,
        calorie_goal INT NOT NULL,
        macro_c INT DEFAULT 45,
        macro_p INT DEFAULT 25,
        macro_f INT DEFAULT 30,
        bmr INT,
        tdee INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Diary entries table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS diary_entries (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) DEFAULT 'default_user',
        date DATE NOT NULL,
        meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
        food_id VARCHAR(255),
        food_name VARCHAR(500) NOT NULL,
        custom_name VARCHAR(500),
        amount DECIMAL(8,2) NOT NULL,
        unit VARCHAR(100) NOT NULL,
        source VARCHAR(50) NOT NULL,
        kcal DECIMAL(8,2) NOT NULL,
        carbs DECIMAL(8,2) DEFAULT 0,
        protein DECIMAL(8,2) DEFAULT 0,
        fat DECIMAL(8,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_diary_user_date (user_id, date),
        INDEX idx_diary_meal_type (meal_type),
        FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Exercise entries table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS exercise_entries (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) DEFAULT 'default_user',
        date DATE NOT NULL,
        time TIME,
        category ENUM('cardio', 'strength') NOT NULL,
        name VARCHAR(255) NOT NULL,
        duration_min INT NOT NULL,
        calories INT NOT NULL,
        distance DECIMAL(8,2),
        sets INT,
        reps INT,
        weight DECIMAL(8,2),
        notes TEXT,
        met_value DECIMAL(4,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_exercise_user_date (user_id, date),
        INDEX idx_exercise_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // My meals table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS my_meals (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) DEFAULT 'default_user',
        name VARCHAR(255) NOT NULL,
        photo_url TEXT,
        total_kcal INT NOT NULL,
        total_carbs DECIMAL(8,2) DEFAULT 0,
        total_protein DECIMAL(8,2) DEFAULT 0,
        total_fat DECIMAL(8,2) DEFAULT 0,
        directions TEXT,
        source VARCHAR(50) DEFAULT 'custom',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_my_meals_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // My meal items table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS my_meal_items (
        id VARCHAR(255) PRIMARY KEY,
        meal_id VARCHAR(255) NOT NULL,
        food_id VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        amount DECIMAL(8,2) NOT NULL,
        unit VARCHAR(100) NOT NULL,
        calories INT NOT NULL,
        carbs DECIMAL(8,2) DEFAULT 0,
        protein DECIMAL(8,2) DEFAULT 0,
        fat DECIMAL(8,2) DEFAULT 0,
        sort_order INT DEFAULT 0,
        FOREIGN KEY (meal_id) REFERENCES my_meals(id) ON DELETE CASCADE,
        FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE SET NULL,
        INDEX idx_meal_items_meal (meal_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('All database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

/**
 * Insert sample data if tables are empty
 */
const insertSampleDataIfNeeded = async () => {
  try {
    // Check if foods table has data
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM foods');
    if (rows[0].count === 0) {
      console.log('Inserting sample foods...');
      await insertSampleFoods();
    }
  } catch (error) {
    console.error('Error checking/inserting sample data:', error);
  }
};

/**
 * Insert sample foods from OFF and USDA sources
 */
const insertSampleFoods = async () => {
  const sampleFoods = [
    // USDA Foods
    {
      id: 'usda_01001',
      name: 'Butter, salted',
      brand: null,
      kcal_per_100g: 717,
      carbs_per_100g: 0.06,
      protein_per_100g: 0.85,
      fat_per_100g: 81.11,
      serving_label: '1 tbsp',
      grams_per_serving: 14.2,
      source: 'USDA',
      category: 'Dairy'
    },
    {
      id: 'usda_11124',
      name: 'Carrots, raw',
      brand: null,
      kcal_per_100g: 41,
      carbs_per_100g: 9.58,
      protein_per_100g: 0.93,
      fat_per_100g: 0.24,
      fiber_per_100g: 2.8,
      sugar_per_100g: 4.74,
      serving_label: '1 medium',
      grams_per_serving: 61,
      source: 'USDA',
      category: 'Vegetables'
    },
    {
      id: 'usda_05062',
      name: 'Chicken, broilers or fryers, breast, meat only, cooked, roasted',
      brand: null,
      kcal_per_100g: 165,
      carbs_per_100g: 0,
      protein_per_100g: 31.02,
      fat_per_100g: 3.57,
      serving_label: '1 breast',
      grams_per_serving: 172,
      source: 'USDA',
      category: 'Poultry'
    },
    {
      id: 'usda_09040',
      name: 'Bananas, raw',
      brand: null,
      kcal_per_100g: 89,
      carbs_per_100g: 22.84,
      protein_per_100g: 1.09,
      fat_per_100g: 0.33,
      fiber_per_100g: 2.6,
      sugar_per_100g: 12.23,
      serving_label: '1 medium',
      grams_per_serving: 118,
      source: 'USDA',
      category: 'Fruits'
    },
    {
      id: 'usda_20081',
      name: 'Wheat flour, white, all-purpose, enriched, bleached',
      brand: null,
      kcal_per_100g: 364,
      carbs_per_100g: 76.31,
      protein_per_100g: 10.33,
      fat_per_100g: 0.98,
      serving_label: '1 cup',
      grams_per_serving: 125,
      source: 'USDA',
      category: 'Grains'
    },
    
    // Open Food Facts Foods
    {
      id: 'off_3017620422003',
      name: 'Nutella',
      brand: 'Ferrero',
      kcal_per_100g: 539,
      carbs_per_100g: 57.5,
      protein_per_100g: 6.3,
      fat_per_100g: 30.9,
      sugar_per_100g: 56.3,
      serving_label: '1 tbsp',
      grams_per_serving: 20,
      source: 'OFF',
      barcode: '3017620422003',
      category: 'Spreads'
    },
    {
      id: 'off_7622210951965',
      name: 'KitKat',
      brand: 'Nestlé',
      kcal_per_100g: 518,
      carbs_per_100g: 59.2,
      protein_per_100g: 7.3,
      fat_per_100g: 27.6,
      sugar_per_100g: 47.8,
      serving_label: '1 bar',
      grams_per_serving: 41.5,
      source: 'OFF',
      barcode: '7622210951965',
      category: 'Snacks'
    },
    {
      id: 'off_8901030865507',
      name: 'Coca-Cola',
      brand: 'The Coca-Cola Company',
      kcal_per_100g: 42,
      carbs_per_100g: 10.6,
      protein_per_100g: 0,
      fat_per_100g: 0,
      sugar_per_100g: 10.6,
      serving_label: '1 can',
      grams_per_serving: 330,
      source: 'OFF',
      barcode: '8901030865507',
      category: 'Beverages'
    },
    {
      id: 'off_3228857000906',
      name: 'Greek Yogurt, Plain',
      brand: 'Fage',
      kcal_per_100g: 97,
      carbs_per_100g: 4.0,
      protein_per_100g: 10.0,
      fat_per_100g: 5.0,
      serving_label: '1 container',
      grams_per_serving: 170,
      source: 'OFF',
      barcode: '3228857000906',
      category: 'Dairy'
    },
    {
      id: 'off_4901777317789',
      name: 'Instant Ramen Noodles',
      brand: 'Nissin',
      kcal_per_100g: 448,
      carbs_per_100g: 58.6,
      protein_per_100g: 9.4,
      fat_per_100g: 19.8,
      sodium_per_100g: 1820,
      serving_label: '1 package',
      grams_per_serving: 85,
      source: 'OFF',
      barcode: '4901777317789',
      category: 'Prepared Foods'
    },
    
    // More diverse foods
    {
      id: 'usda_01077',
      name: 'Milk, reduced fat, fluid, 2% milkfat',
      brand: null,
      kcal_per_100g: 50,
      carbs_per_100g: 4.80,
      protein_per_100g: 3.28,
      fat_per_100g: 1.98,
      serving_label: '1 cup',
      grams_per_serving: 244,
      source: 'USDA',
      category: 'Dairy'
    },
    {
      id: 'usda_11233',
      name: 'Kale, raw',
      brand: null,
      kcal_per_100g: 35,
      carbs_per_100g: 4.42,
      protein_per_100g: 2.92,
      fat_per_100g: 1.49,
      fiber_per_100g: 4.1,
      serving_label: '1 cup chopped',
      grams_per_serving: 67,
      source: 'USDA',
      category: 'Vegetables'
    },
    {
      id: 'usda_15076',
      name: 'Salmon, Atlantic, farmed, cooked, dry heat',
      brand: null,
      kcal_per_100g: 206,
      carbs_per_100g: 0,
      protein_per_100g: 25.44,
      fat_per_100g: 10.85,
      serving_label: '1 fillet',
      grams_per_serving: 154,
      source: 'USDA',
      category: 'Seafood'
    },
    {
      id: 'off_3560070462414',
      name: 'Quinoa, cooked',
      brand: 'Carrefour Bio',
      kcal_per_100g: 120,
      carbs_per_100g: 21.3,
      protein_per_100g: 4.4,
      fat_per_100g: 1.9,
      fiber_per_100g: 2.8,
      serving_label: '1 cup',
      grams_per_serving: 185,
      source: 'OFF',
      barcode: '3560070462414',
      category: 'Grains'
    },
    {
      id: 'usda_12061',
      name: 'Nuts, almonds',
      brand: null,
      kcal_per_100g: 579,
      carbs_per_100g: 21.55,
      protein_per_100g: 21.15,
      fat_per_100g: 49.93,
      fiber_per_100g: 12.5,
      serving_label: '1 oz',
      grams_per_serving: 28.35,
      source: 'USDA',
      category: 'Nuts'
    }
  ];

  try {
    for (const food of sampleFoods) {
      await pool.execute(
        `INSERT IGNORE INTO foods (
          id, name, brand, kcal_per_100g, carbs_per_100g, protein_per_100g, 
          fat_per_100g, fiber_per_100g, sugar_per_100g, sodium_per_100g,
          serving_label, grams_per_serving, source, barcode, category
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          food.id,
          food.name,
          food.brand,
          food.kcal_per_100g,
          food.carbs_per_100g,
          food.protein_per_100g,
          food.fat_per_100g,
          food.fiber_per_100g || 0,
          food.sugar_per_100g || 0,
          food.sodium_per_100g || 0,
          food.serving_label,
          food.grams_per_serving,
          food.source,
          food.barcode,
          food.category
        ]
      );
    }
    console.log('Sample foods inserted successfully');
  } catch (error) {
    console.error('Error inserting sample foods:', error);
  }
};

/**
 * Search foods in the database
 */
export const searchFoods = async (query, limit = 20) => {
  if (!pool) {
    await initializeDatabase();
  }

  try {
    if (!query || query.trim().length === 0) {
      // Return popular/common foods when no query
      const [rows] = await pool.execute(
        `SELECT * FROM foods 
         WHERE source IN ('USDA', 'OFF') 
         ORDER BY 
           CASE 
             WHEN name IN ('Bananas, raw', 'Chicken, broilers or fryers, breast, meat only, cooked, roasted', 'Milk, reduced fat, fluid, 2% milkfat', 'Nuts, almonds') THEN 1
             ELSE 2
           END,
           name ASC
         LIMIT ?`,
        [limit]
      );
      return rows || [];
    }

    const searchTerm = `%${query.toLowerCase()}%`;
    const [rows] = await pool.execute(
      `SELECT * FROM foods 
       WHERE (LOWER(name) LIKE ? OR LOWER(brand) LIKE ? OR barcode = ?)
       ORDER BY 
         CASE 
           WHEN LOWER(name) = LOWER(?) THEN 1
           WHEN LOWER(name) LIKE ? THEN 2
           WHEN LOWER(brand) LIKE ? THEN 3
           ELSE 4
         END,
         name ASC
       LIMIT ?`,
      [searchTerm, searchTerm, query, query, `${query.toLowerCase()}%`, searchTerm, limit]
    );
    
    return rows || [];
  } catch (error) {
    console.error('Search foods error:', error);
    return [];
  }
};

/**
 * Get food by ID
 */
export const getFoodById = async (id) => {
  if (!pool) {
    await initializeDatabase();
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM foods WHERE id = ?', [id]);
    return rows[0] || null;
  } catch (error) {
    console.error('Get food by ID error:', error);
    return null;
  }
};

/**
 * Add custom food to database
 */
export const addCustomFood = async (foodData) => {
  if (!pool) {
    await initializeDatabase();
  }

  try {
    const id = `custom_${Date.now()}`;
    
    await pool.execute(
      `INSERT INTO foods (
        id, name, brand, kcal_per_100g, carbs_per_100g, protein_per_100g, 
        fat_per_100g, serving_label, grams_per_serving, source, category
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        foodData.name,
        foodData.brand || null,
        foodData.kcal_per_100g,
        foodData.carbs_per_100g || 0,
        foodData.protein_per_100g || 0,
        foodData.fat_per_100g || 0,
        foodData.serving_label || null,
        foodData.grams_per_serving || null,
        'CUSTOM',
        foodData.category || 'Custom'
      ]
    );
    
    return {
      ...foodData, 
      id,
      source: 'CUSTOM',
      category: foodData.category || 'Custom'
    };
  } catch (error) {
    console.error('Add custom food error:', error);
    throw error;
  }
};

/**
 * User Profile Operations
 */
export const saveUserProfile = async (profileData) => {
  if (!pool) {
    await initializeDatabase();
  }

  try {
    const userId = 'default_user'; // For single user app
    
    await pool.execute(
      `INSERT INTO user_profiles (
        id, sex, age, height_cm, weight_kg, activity_level, goal_type,
        rate_kcal_per_day, calorie_goal, macro_c, macro_p, macro_f, bmr, tdee
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        sex = VALUES(sex),
        age = VALUES(age),
        height_cm = VALUES(height_cm),
        weight_kg = VALUES(weight_kg),
        activity_level = VALUES(activity_level),
        goal_type = VALUES(goal_type),
        rate_kcal_per_day = VALUES(rate_kcal_per_day),
        calorie_goal = VALUES(calorie_goal),
        macro_c = VALUES(macro_c),
        macro_p = VALUES(macro_p),
        macro_f = VALUES(macro_f),
        bmr = VALUES(bmr),
        tdee = VALUES(tdee),
        updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        profileData.sex,
        profileData.age,
        profileData.height_cm,
        profileData.weight_kg,
        profileData.activity || 'moderately_active',
        profileData.goal_type || 'maintain',
        profileData.rate_kcal_per_day || 0,
        profileData.calorie_goal,
        profileData.macro_c || 45,
        profileData.macro_p || 25,
        profileData.macro_f || 30,
        profileData.bmr || 0,
        profileData.tdee || 0
      ]
    );
    
    return profileData;
  } catch (error) {
    console.error('Save user profile error:', error);
    throw error;
  }
};

export const getUserProfile = async () => {
  if (!pool) {
    await initializeDatabase();
  }

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM user_profiles WHERE id = ?',
      ['default_user']
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Get user profile error:', error);
    return null;
  }
};

/**
 * Diary Entry Operations
 */
export const saveDiaryEntry = async (entryData) => {
  if (!pool) {
    await initializeDatabase();
  }

  try {
    const id = entryData.id || `entry_${Date.now()}`;
    
    await pool.execute(
      `INSERT INTO diary_entries (
        id, user_id, date, meal_type, food_id, food_name, custom_name,
        amount, unit, source, kcal, carbs, protein, fat
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        'default_user',
        entryData.date,
        entryData.meal_type,
        entryData.food_id,
        entryData.food_name,
        entryData.custom_name,
        entryData.amount,
        entryData.unit,
        entryData.source,
        entryData.kcal,
        entryData.carbs || 0,
        entryData.protein || 0,
        entryData.fat || 0
      ]
    );
    
    return { ...entryData, id };
  } catch (error) {
    console.error('Save diary entry error:', error);
    throw error;
  }
};

export const getDiaryEntries = async (date = null) => {
  if (!pool) {
    await initializeDatabase();
  }

  try {
    let query = 'SELECT * FROM diary_entries WHERE user_id = ?';
    let params = ['default_user'];
    
    if (date) {
      query += ' AND date = ?';
      params.push(date);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.execute(query, params);
    return rows || [];
  } catch (error) {
    console.error('Get diary entries error:', error);
    return [];
  }
};

export const updateDiaryEntry = async (id, updates) => {
  if (!pool) {
    await initializeDatabase();
  }

  try {
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    
    await pool.execute(
      `UPDATE diary_entries SET ${setClause} WHERE id = ?`,
      values
    );
    
    return true;
  } catch (error) {
    console.error('Update diary entry error:', error);
    throw error;
  }
};

export const deleteDiaryEntry = async (id) => {
  if (!pool) {
    await initializeDatabase();
  }

  try {
    await pool.execute('DELETE FROM diary_entries WHERE id = ?', [id]);
    return true;
  } catch (error) {
    console.error('Delete diary entry error:', error);
    throw error;
  }
};

/**
 * Exercise Entry Operations
 */
export const saveExerciseEntry = async (entryData) => {
  if (!pool) {
    await initializeDatabase();
  }

  try {
    const id = entryData.id || `exercise_${Date.now()}`;
    
    await pool.execute(
      `INSERT INTO exercise_entries (
        id, user_id, date, time, category, name, duration_min, calories,
        distance, sets, reps, weight, notes, met_value
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        'default_user',
        entryData.date,
        entryData.time,
        entryData.category,
        entryData.name,
        entryData.durationMin,
        entryData.calories,
        entryData.distance,
        entryData.sets,
        entryData.reps,
        entryData.weight,
        entryData.notes,
        entryData.met
      ]
    );
    
    return { ...entryData, id };
  } catch (error) {
    console.error('Save exercise entry error:', error);
    throw error;
  }
};

export const getExerciseEntries = async (date = null) => {
  if (!pool) {
    await initializeDatabase();
  }

  try {
    let query = 'SELECT * FROM exercise_entries WHERE user_id = ?';
    let params = ['default_user'];
    
    if (date) {
      query += ' AND date = ?';
      params.push(date);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.execute(query, params);
    return rows || [];
  } catch (error) {
    console.error('Get exercise entries error:', error);
    return [];
  }
};

export const deleteExerciseEntry = async (id) => {
  if (!pool) {
    await initializeDatabase();
  }

  try {
    await pool.execute('DELETE FROM exercise_entries WHERE id = ?', [id]);
    return true;
  } catch (error) {
    console.error('Delete exercise entry error:', error);
    throw error;
  }
};

/**
 * My Meals Operations
 */
export const saveMyMeal = async (mealData) => {
  if (!pool) {
    await initializeDatabase();
  }

  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const mealId = mealData.id || `meal_${Date.now()}`;
    
    // Insert meal
    await connection.execute(
      `INSERT INTO my_meals (
        id, user_id, name, photo_url, total_kcal, total_carbs, 
        total_protein, total_fat, directions, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        mealId,
        'default_user',
        mealData.name,
        mealData.photo,
        mealData.totalKcal,
        mealData.totalCarbs || 0,
        mealData.totalProtein || 0,
        mealData.totalFat || 0,
        mealData.directions,
        mealData.source || 'custom'
      ]
    );
    
    // Insert meal items
    if (mealData.items && mealData.items.length > 0) {
      for (let i = 0; i < mealData.items.length; i++) {
        const item = mealData.items[i];
        await connection.execute(
          `INSERT INTO my_meal_items (
            id, meal_id, food_id, name, amount, unit, calories,
            carbs, protein, fat, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `item_${Date.now()}_${i}`,
            mealId,
            item.foodId,
            item.name,
            item.amount,
            item.unit,
            item.calories,
            item.carbs || 0,
            item.protein || 0,
            item.fat || 0,
            i
          ]
        );
      }
    }
    
    await connection.commit();
    return { ...mealData, id: mealId };
  } catch (error) {
    await connection.rollback();
    console.error('Save my meal error:', error);
    throw error;
  } finally {
    connection.release();
  }
};

export const getMyMeals = async () => {
  if (!pool) {
    await initializeDatabase();
  }

  try {
    const [meals] = await pool.execute(
      `SELECT m.*, 
       GROUP_CONCAT(
         CONCAT(mi.name, '|', mi.amount, '|', mi.unit, '|', mi.calories)
         ORDER BY mi.sort_order SEPARATOR ';'
       ) as items_data
       FROM my_meals m
       LEFT JOIN my_meal_items mi ON m.id = mi.meal_id
       WHERE m.user_id = ?
       GROUP BY m.id
       ORDER BY m.created_at DESC`,
      ['default_user']
    );
    
    return meals.map(meal => ({
      ...meal,
      items: meal.items_data ? meal.items_data.split(';').map(itemStr => {
        const [name, amount, unit, calories] = itemStr.split('|');
        return { name, amount: parseFloat(amount), unit, calories: parseInt(calories) };
      }) : []
    }));
  } catch (error) {
    console.error('Get my meals error:', error);
    return [];
  }
};

export const deleteMyMeal = async (mealId) => {
  if (!pool) {
    await initializeDatabase();
  }

  try {
    // Items will be deleted automatically due to CASCADE
    await pool.execute('DELETE FROM my_meals WHERE id = ?', [mealId]);
    return true;
  } catch (error) {
    console.error('Delete my meal error:', error);
    throw error;
  }
};

/**
 * Calculate nutrition for specific amount
 */
export const calculateNutrition = (food, amount, unit) => {
  let totalGrams = amount;
  
  // Convert to grams based on unit
  if (unit === 'serving' && food.grams_per_serving) {
    totalGrams = amount * food.grams_per_serving;
  } else if (unit === 'oz') {
    totalGrams = amount * 28.35;
  } else if (unit === 'lb') {
    totalGrams = amount * 453.592;
  } else if (unit === 'cup') {
    totalGrams = amount * (food.grams_per_serving || 240);
  } else if (unit === 'g') {
    totalGrams = amount;
  }
  
  const multiplier = totalGrams / 100;
  
  return {
    kcal: Math.round(food.kcal_per_100g * multiplier),
    carbs: Math.round((food.carbs_per_100g || 0) * multiplier * 10) / 10,
    protein: Math.round((food.protein_per_100g || 0) * multiplier * 10) / 10,
    fat: Math.round((food.fat_per_100g || 0) * multiplier * 10) / 10,
    fiber: Math.round((food.fiber_per_100g || 0) * multiplier * 10) / 10,
    sugar: Math.round((food.sugar_per_100g || 0) * multiplier * 10) / 10,
    sodium: Math.round((food.sodium_per_100g || 0) * multiplier * 10) / 10,
  };
};

/**
 * Get database statistics
 */
export const getDatabaseStats = async () => {
  if (!pool) {
    await initializeDatabase();
  }

  try {
    const [totalCount] = await pool.execute('SELECT COUNT(*) as count FROM foods');
    const [usdaCount] = await pool.execute('SELECT COUNT(*) as count FROM foods WHERE source = "USDA"');
    const [offCount] = await pool.execute('SELECT COUNT(*) as count FROM foods WHERE source = "OFF"');
    const [customCount] = await pool.execute('SELECT COUNT(*) as count FROM foods WHERE source = "CUSTOM"');
    
    return {
      total: totalCount[0].count,
      usda: usdaCount[0].count,
      off: offCount[0].count,
      custom: customCount[0].count,
    };
  } catch (error) {
    console.error('Get database stats error:', error);
    return { total: 0, usda: 0, off: 0, custom: 0 };
  }
};

/**
 * Close database connection
 */
export const closeDatabase = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};