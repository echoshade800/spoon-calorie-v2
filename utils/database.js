/**
 * SQLite Database utilities for food data management
 * Handles Open Food Facts and USDA FoodData Central integration
 */
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';

const DATABASE_NAME = 'foods.db';
const DATABASE_VERSION = 1;

let db = null;

/**
 * Initialize and open the SQLite database
 */
export const initializeDatabase = async () => {
  try {
    console.log('Initializing database...');
    // Open or create database
    db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    console.log('Database opened successfully');
    
    // Create foods table if it doesn't exist
    console.log('Creating foods table...');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS foods (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        brand TEXT,
        kcal_per_100g REAL NOT NULL,
        carbs_per_100g REAL DEFAULT 0,
        protein_per_100g REAL DEFAULT 0,
        fat_per_100g REAL DEFAULT 0,
        fiber_per_100g REAL DEFAULT 0,
        sugar_per_100g REAL DEFAULT 0,
        sodium_per_100g REAL DEFAULT 0,
        serving_label TEXT,
        grams_per_serving REAL,
        source TEXT NOT NULL,
        barcode TEXT,
        category TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Foods table created/verified');

    // Create indexes for faster searching
    console.log('Creating database indexes...');
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);
      CREATE INDEX IF NOT EXISTS idx_foods_brand ON foods(brand);
      CREATE INDEX IF NOT EXISTS idx_foods_barcode ON foods(barcode);
      CREATE INDEX IF NOT EXISTS idx_foods_source ON foods(source);
    `);
    console.log('Database indexes created');

    // Insert sample data if table is empty
    console.log('Checking if sample data needs to be inserted...');
    const result = await db.getFirstAsync('SELECT COUNT(*) as count FROM foods');
    console.log('Current food count in database:', result.count);
    if (result.count === 0) {
      console.log('Inserting sample foods...');
      await insertSampleFoods();
      console.log('Sample foods inserted');
    }

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Database initialization error - Full details:', {
      error: error.message,
      stack: error.stack,
      databaseName: DATABASE_NAME
    });
    throw error;
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
      await db.runAsync(
        `INSERT OR REPLACE INTO foods (
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
  if (!db) {
    await initializeDatabase();
  }

  try {
    if (!query || query.trim().length === 0) {
      // Return popular/common foods when no query
      const result = await db.getAllAsync(
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
      return result || [];
    }

    const searchTerm = `%${query.toLowerCase()}%`;
    const result = await db.getAllAsync(
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
    
    return result || [];
  } catch (error) {
    console.error('Search foods error:', error);
    return [];
  }
};

/**
 * Get food by ID
 */
export const getFoodById = async (id) => {
  if (!db) {
    await initializeDatabase();
  }

  try {
    const result = await db.getFirstAsync('SELECT * FROM foods WHERE id = ?', [id]);
    return result;
  } catch (error) {
    console.error('Get food by ID error:', error);
    return null;
  }
};

/**
 * Get foods by category
 */
export const getFoodsByCategory = async (category, limit = 50) => {
  if (!db) {
    await initializeDatabase();
  }

  try {
    const result = await db.getAllAsync(
      'SELECT * FROM foods WHERE category = ? ORDER BY name ASC LIMIT ?',
      [category, limit]
    );
    return result || [];
  } catch (error) {
    console.error('Get foods by category error:', error);
    return [];
  }
};

/**
 * Add custom food to database
 */
export const addCustomFood = async (foodData) => {
  if (!db) {
    console.log('Database not initialized, initializing now...');
    await initializeDatabase();
  }

  try {
    console.log('Adding custom food with data:', foodData);
    const id = `custom_${Date.now()}`;
    console.log('Generated ID:', id);
    
    // Validate required fields
    if (!foodData.name || !foodData.kcal_per_100g) {
      throw new Error('Missing required fields: name and kcal_per_100g are required');
    }
    
    console.log('Executing SQL insert...');
    await db.runAsync(
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
    
    console.log('SQL insert completed successfully');
    
    const savedFood = {
      ...foodData, 
      id,
      source: 'CUSTOM',
      category: foodData.category || 'Custom'
    };
    
    console.log('Returning saved food:', savedFood);
    return savedFood;
  } catch (error) {
    console.error('Add custom food error - Full details:', {
      error: error.message,
      stack: error.stack,
      foodData: foodData,
      databaseState: db ? 'initialized' : 'not initialized'
    });
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
    // Default cup conversion (varies by food type)
    totalGrams = amount * (food.grams_per_serving || 240);
  } else if (unit === 'g') {
    // Amount is already in grams
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
  if (!db) {
    await initializeDatabase();
  }

  try {
    const totalCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM foods');
    const usdaCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM foods WHERE source = "USDA"');
    const offCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM foods WHERE source = "OFF"');
    const customCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM foods WHERE source = "CUSTOM"');
    
    return {
      total: totalCount.count,
      usda: usdaCount.count,
      off: offCount.count,
      custom: customCount.count,
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
  if (db) {
    await db.closeAsync();
    db = null;
  }
};