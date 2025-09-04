import { executeQuery } from '../config/database.js';

export class MyMeal {
  static async findByUserUid(userUid) {
    try {
      const escapedUid = userUid.replace(/'/g, "''");
      const sql = `
        SELECT m.*, 
               GROUP_CONCAT(
                 CONCAT(
                   '{"id":"', mi.id, '",',
                   '"foodId":"', IFNULL(mi.food_id, ''), '",',
                   '"name":"', REPLACE(mi.name, '"', '\\"'), '",',
                   '"amount":', mi.amount, ',',
                   '"unit":"', mi.unit, '",',
                   '"calories":', mi.calories, ',',
                   '"carbs":', mi.carbs, ',',
                   '"protein":', mi.protein, ',',
                   '"fat":', mi.fat, '}'
                 ) ORDER BY mi.sort_order SEPARATOR ','
               ) as items_json
        FROM my_meals m
        LEFT JOIN my_meal_items mi ON m.id = mi.meal_id
        WHERE m.user_uid = '${escapedUid}'
        GROUP BY m.id
        ORDER BY m.created_at DESC
      `;
      
      console.log('执行 SQL (查找用户餐食):', sql);
      
      const meals = await executeQuery(sql);
      
      // 解析 items JSON
      return meals.map(meal => ({
        ...meal,
        items: meal.items_json ? JSON.parse(`[${meal.items_json}]`) : []
      }));
    } catch (error) {
      console.error('查找用户餐食失败:', error);
      throw error;
    }
  }

  static async create(userUid, mealData) {
    try {
      const mealId = mealData.id || `meal_${Date.now()}`;
      const escapedUid = userUid.replace(/'/g, "''");
      const escapedName = mealData.name.replace(/'/g, "''");
      const escapedPhoto = mealData.photo ? mealData.photo.replace(/'/g, "''") : null;
      const escapedDirections = mealData.directions ? mealData.directions.replace(/'/g, "''") : null;
      const escapedSource = (mealData.source || 'custom').replace(/'/g, "''");
      
      // 插入餐食主记录
      const mealSql = `
        INSERT INTO my_meals (
          id, user_uid, name, photo, total_kcal, total_carbs, 
          total_protein, total_fat, directions, source, created_at, updated_at
        ) VALUES (
          '${mealId}', 
          '${escapedUid}', 
          '${escapedName}', 
          ${escapedPhoto ? `'${escapedPhoto}'` : 'NULL'}, 
          ${mealData.totalKcal || 0}, 
          ${mealData.totalCarbs || 0}, 
          ${mealData.totalProtein || 0}, 
          ${mealData.totalFat || 0}, 
          ${escapedDirections ? `'${escapedDirections}'` : 'NULL'}, 
          '${escapedSource}', 
          NOW(), 
          NOW()
        )
      `;
      
      console.log('执行 SQL (创建餐食):', mealSql);
      await executeQuery(mealSql);
      
      // 插入餐食项目
      if (mealData.items && mealData.items.length > 0) {
        for (let i = 0; i < mealData.items.length; i++) {
          const item = mealData.items[i];
          const itemId = `item_${Date.now()}_${i}`;
          const escapedItemName = item.name.replace(/'/g, "''");
          const escapedUnit = item.unit.replace(/'/g, "''");
          const escapedFoodId = item.foodId ? item.foodId.replace(/'/g, "''") : null;
          
          const itemSql = `
            INSERT INTO my_meal_items (
              id, meal_id, food_id, name, amount, unit, 
              calories, carbs, protein, fat, sort_order, created_at
            ) VALUES (
              '${itemId}', 
              '${mealId}', 
              ${escapedFoodId ? `'${escapedFoodId}'` : 'NULL'}, 
              '${escapedItemName}', 
              ${item.amount || 0}, 
              '${escapedUnit}', 
              ${item.calories || 0}, 
              ${item.carbs || 0}, 
              ${item.protein || 0}, 
              ${item.fat || 0}, 
              ${i}, 
              NOW()
            )
          `;
          
          console.log('执行 SQL (创建餐食项目):', itemSql);
          await executeQuery(itemSql);
        }
      }
      
      return { id: mealId, ...mealData };
    } catch (error) {
      console.error('创建餐食失败:', error);
      throw error;
    }
  }

  static async delete(userUid, mealId) {
    try {
      const escapedUid = userUid.replace(/'/g, "''");
      const escapedMealId = mealId.replace(/'/g, "''");
      
      // 删除餐食（级联删除会自动删除相关项目）
      const sql = `DELETE FROM my_meals WHERE id = '${escapedMealId}' AND user_uid = '${escapedUid}'`;
      
      console.log('执行 SQL (删除餐食):', sql);
      await executeQuery(sql);
      
      return true;
    } catch (error) {
      console.error('删除餐食失败:', error);
      throw error;
    }
  }
}