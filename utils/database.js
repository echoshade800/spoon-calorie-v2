/**
 * Database utilities for food data management
 * Now uses MySQL through API calls instead of local SQLite
 */
import { API } from './apiClient';

/**
 * Initialize database connection (now handled by server)
 */
export const initializeDatabase = async () => {
  try {
    console.log('初始化数据库...');
    // 跳过 API 连接测试，避免阻塞应用启动
    console.log('数据库初始化完成（跳过连接测试）');
    return true;
  } catch (error) {
    console.warn('数据库初始化警告:', error);
    // 不抛出错误，允许应用继续运行
    return false;
  }
};

/**
 * Search foods in the database
 */
export const searchFoods = async (query, limit = 20) => {
  try {
    const response = await API.searchFoods(query, limit);
    return response.foods || [];
  } catch (error) {
    console.error('搜索食物错误:', error);
    return [];
  }
};

/**
 * Get food by ID
 */
export const getFoodById = async (id) => {
  try {
    const response = await API.getFood(id);
    return response.food;
  } catch (error) {
    console.error('获取食物详情错误:', error);
    return null;
  }
};

/**
 * Add custom food to database
 */
export const addCustomFood = async (foodData) => {
  try {
    console.log('添加自定义食物:', foodData);
    const id = `custom_${Date.now()}`;
    console.log('生成的 ID:', id);
    
    // Validate required fields
    if (!foodData.name || !foodData.kcal_per_100g) {
      throw new Error('Name and calories are required');
    }
    
    const response = await API.createFood({
      id,
      ...foodData,
      source: 'CUSTOM',
      category: foodData.category || 'Custom',
    });
    
    return response.food;
  } catch (error) {
    console.error('添加自定义食物错误:', error);
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