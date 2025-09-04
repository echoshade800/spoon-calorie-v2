import { executeQuery } from '../config/database.js';

export class Food {
  static async search(query, limit = 20) {
    try {
      let sql, params;
      
      if (!query || query.trim().length === 0) {
        // 返回热门食物 - 简化查询
        sql = `
          SELECT * FROM foods 
          WHERE source IN (?, ?) 
          ORDER BY name ASC
          LIMIT ?
        `;
        params = ['USDA', 'OFF', limit];
      } else {
        const searchTerm = `%${query.toLowerCase()}%`;
        sql = `
          SELECT * FROM foods 
          WHERE (LOWER(name) LIKE ? OR LOWER(brand) LIKE ? OR barcode = ?)
          ORDER BY 
            CASE 
              WHEN LOWER(name) = LOWER(?) THEN 1
              WHEN LOWER(name) LIKE ? THEN 2
              WHEN LOWER(brand) LIKE ? THEN 3
              ELSE 4
            END,
            name ASC
          LIMIT ?
        `;
        params = [
          searchTerm,           // LOWER(name) LIKE ?
          searchTerm,           // LOWER(brand) LIKE ?
          query,                // barcode = ?
          query,                // LOWER(name) = LOWER(?)
          `${query.toLowerCase()}%`, // LOWER(name) LIKE ?
          searchTerm,           // LOWER(brand) LIKE ?
          limit                 // LIMIT ?
        ];
      }
      
      console.log('执行 SQL:', sql);
      console.log('参数:', params);
      
      const foods = await executeQuery(sql, params);
      return foods || [];
    } catch (error) {
      console.error('搜索食物失败:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const sql = 'SELECT * FROM foods WHERE id = ?';
      const foods = await executeQuery(sql, [id]);
      return foods.length > 0 ? foods[0] : null;
    } catch (error) {
      console.error('查找食物失败:', error);
      throw error;
    }
  }

  static async create(foodData) {
    try {
      const sql = `
        INSERT INTO foods (
          id, name, brand, kcal_per_100g, carbs_per_100g, protein_per_100g, 
          fat_per_100g, fiber_per_100g, sugar_per_100g, sodium_per_100g,
          serving_label, grams_per_serving, source, barcode, category,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const params = [
        foodData.id,
        foodData.name,
        foodData.brand,
        foodData.kcal_per_100g,
        foodData.carbs_per_100g || 0,
        foodData.protein_per_100g || 0,
        foodData.fat_per_100g || 0,
        foodData.fiber_per_100g || 0,
        foodData.sugar_per_100g || 0,
        foodData.sodium_per_100g || 0,
        foodData.serving_label,
        foodData.grams_per_serving,
        foodData.source,
        foodData.barcode,
        foodData.category
      ];
      
      await executeQuery(sql, params);
      return { ...foodData };
    } catch (error) {
      console.error('创建食物失败:', error);
      throw error;
    }
  }
}