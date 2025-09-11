import { executeQuery } from '../config/database.js';
import { fatSecretService } from '../services/fatSecretService.js';

export class Food {
  static async search(query, limit = 20) {
    try {
      if (!query || query.trim().length === 0) {
        // 无搜索词时返回本地热门食物
        const sql = `SELECT * FROM foods WHERE source IN ('USDA', 'OFF') ORDER BY name ASC LIMIT ${limit}`;
        console.log('执行 SQL (默认):', sql);
        
        const foods = await executeQuery(sql);
        console.log('查询结果数量:', foods?.length || 0);
        return foods || [];
      } else {
        // 有搜索词时优先使用 FatSecret API
        try {
          console.log('使用 FatSecret 搜索食物...');
          const fatSecretFoods = await fatSecretService.searchFoods(query, limit);
          
          if (fatSecretFoods && fatSecretFoods.length > 0) {
            console.log(`FatSecret 返回 ${fatSecretFoods.length} 条结果`);
            return fatSecretFoods;
          }
        } catch (fatSecretError) {
          console.warn('FatSecret 搜索失败，回退到本地数据库:', fatSecretError.message);
        }
        
        // FatSecret 失败时回退到本地数据库搜索
        const searchTerm = query.toLowerCase().replace(/'/g, "''");
        const sql = `
          SELECT * FROM foods 
          WHERE (LOWER(name) LIKE '%${searchTerm}%' OR LOWER(brand) LIKE '%${searchTerm}%' OR barcode = '${searchTerm}')
          ORDER BY 
            CASE 
              WHEN LOWER(name) = '${searchTerm}' THEN 1
              WHEN LOWER(name) LIKE '${searchTerm}%' THEN 2
              WHEN LOWER(brand) LIKE '%${searchTerm}%' THEN 3
              ELSE 4
            END,
            name ASC
          LIMIT ${limit}
        `;
        
        console.log('执行 SQL (本地搜索):', sql);
        const foods = await executeQuery(sql);
        console.log('本地查询结果数量:', foods?.length || 0);
        return foods || [];
      }
    } catch (error) {
      console.error('搜索食物失败:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      // 检查是否为 FatSecret 食物
      if (id.startsWith('fatsecret_')) {
        const fatSecretId = id.replace('fatsecret_', '');
        try {
          const fatSecretFood = await fatSecretService.getFoodById(fatSecretId);
          if (fatSecretFood) {
            return fatSecretFood;
          }
        } catch (fatSecretError) {
          console.warn('FatSecret 获取食物详情失败:', fatSecretError.message);
        }
      }
      
      // 本地数据库查找
      // 转义 ID 中的单引号
      const escapedId = id.replace(/'/g, "''");
      const sql = `SELECT * FROM foods WHERE id = '${escapedId}'`;
      console.log('执行 SQL (查找):', sql);
      
      const foods = await executeQuery(sql);
      return foods.length > 0 ? foods[0] : null;
    } catch (error) {
      console.error('查找食物失败:', error);
      throw error;
    }
  }

  static async create(foodData) {
    try {
      // 转义所有字符串字段
      const escapedData = {
        id: foodData.id.replace(/'/g, "''"),
        name: foodData.name.replace(/'/g, "''"),
        brand: foodData.brand ? foodData.brand.replace(/'/g, "''") : null,
        kcal_per_100g: foodData.kcal_per_100g,
        carbs_per_100g: foodData.carbs_per_100g || 0,
        protein_per_100g: foodData.protein_per_100g || 0,
        fat_per_100g: foodData.fat_per_100g || 0,
        fiber_per_100g: foodData.fiber_per_100g || 0,
        sugar_per_100g: foodData.sugar_per_100g || 0,
        sodium_per_100g: foodData.sodium_per_100g || 0,
        serving_label: foodData.serving_label ? foodData.serving_label.replace(/'/g, "''") : null,
        grams_per_serving: foodData.grams_per_serving || null,
        source: foodData.source.replace(/'/g, "''"),
        barcode: foodData.barcode ? foodData.barcode.replace(/'/g, "''") : null,
        category: foodData.category ? foodData.category.replace(/'/g, "''") : null
      };
      
      const sql = `
        INSERT INTO foods (
          id, name, brand, kcal_per_100g, carbs_per_100g, protein_per_100g, 
          fat_per_100g, fiber_per_100g, sugar_per_100g, sodium_per_100g,
          serving_label, grams_per_serving, source, barcode, category,
          created_at, updated_at
        ) VALUES (
          '${escapedData.id}', 
          '${escapedData.name}', 
          ${escapedData.brand ? `'${escapedData.brand}'` : 'NULL'}, 
          ${escapedData.kcal_per_100g}, 
          ${escapedData.carbs_per_100g}, 
          ${escapedData.protein_per_100g}, 
          ${escapedData.fat_per_100g}, 
          ${escapedData.fiber_per_100g}, 
          ${escapedData.sugar_per_100g}, 
          ${escapedData.sodium_per_100g},
          ${escapedData.serving_label ? `'${escapedData.serving_label}'` : 'NULL'}, 
          ${escapedData.grams_per_serving || 'NULL'}, 
          '${escapedData.source}', 
          ${escapedData.barcode ? `'${escapedData.barcode}'` : 'NULL'}, 
          ${escapedData.category ? `'${escapedData.category}'` : 'NULL'},
          NOW(), 
          NOW()
        )
      `;
      
      console.log('执行 SQL (创建):', sql);
      
      await executeQuery(sql);
      return { ...foodData };
    } catch (error) {
      console.error('创建食物失败:', error);
      throw error;
    }
  }
}