import { executeQuery } from '../config/database.js';
import { FatSecretService } from '../services/fatSecretService.js';

export class Food {
  static async search(query, limit = 20) {
    try {
      let sql;
      
      if (!query || query.trim().length === 0) {
        // 返回热门食物 - 使用直接字符串拼接
        sql = `SELECT * FROM foods WHERE source IN ('USDA', 'OFF') ORDER BY name ASC LIMIT ${limit}`;
        console.log('执行 SQL (默认):', sql);
        
        const foods = await executeQuery(sql);
        console.log('查询结果数量:', foods?.length || 0);
        return foods || [];
      } else {
        // 搜索查询 - 使用直接字符串拼接避免参数问题
        const searchTerm = query.toLowerCase().replace(/'/g, "''"); // 转义单引号
        sql = `
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
        
        console.log('执行 SQL (搜索):', sql);
        
        let foods = await executeQuery(sql);
        console.log('查询结果数量:', foods?.length || 0);
       
        // 如果本地数据库没有找到结果，尝试从FatSecret获取
        if (!foods || foods.length === 0) {
          console.log('本地数据库无结果，尝试FatSecret搜索...');
          
          try {
            const fatSecretFoods = await FatSecretService.searchFoods(query, Math.min(limit, 5));
            
            if (fatSecretFoods && fatSecretFoods.length > 0) {
              console.log(`FatSecret找到 ${fatSecretFoods.length} 个食品，准备存储到数据库`);
              
              // 将FatSecret食品存储到本地数据库
              const savedFoods = [];
              for (const food of fatSecretFoods) {
                try {
                  const savedFood = await Food.create(food);
                  savedFoods.push(savedFood);
                  console.log(`已保存FatSecret食品: ${food.name}`);
                } catch (saveError) {
                  console.error(`保存FatSecret食品失败: ${food.name}`, saveError);
                  // 即使保存失败，也返回食品数据供前端使用
                  savedFoods.push(food);
                }
              }
              
              // return savedFoods;
              foods=savedFoods
            }
          } catch (fatSecretError) {
            console.error('FatSecret搜索失败:', fatSecretError);
            // FatSecret失败时返回空数组，不影响用户体验
          }
        }
        return foods || [];
      }
    } catch (error) {
      console.error('搜索食物失败:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
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
        source: (foodData.source || 'CUSTOM').replace(/'/g, "''"),
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