import { executeQuery } from '../config/database.js';

export class DiaryEntry {
  static async findByUserAndDate(userUid, date) {
    try {
      const escapedUid = userUid.replace(/'/g, "''");
      const escapedDate = date.replace(/'/g, "''");
      
      const sql = `
        SELECT * FROM diary_entries 
        WHERE user_uid = '${escapedUid}' AND date = '${escapedDate}'
        ORDER BY created_at ASC
      `;
      
      console.log('执行 SQL (查找日记条目):', sql);
      
      const entries = await executeQuery(sql);
      return entries || [];
    } catch (error) {
      console.error('查找日记条目失败:', error);
      throw error;
    }
  }

  static async create(entryData) {
    try {
      const entryId = entryData.id || `entry_${Date.now()}`;
      const escapedUid = entryData.user_uid.replace(/'/g, "''");
      const escapedDate = entryData.date.replace(/'/g, "''");
      const escapedMealType = entryData.meal_type.replace(/'/g, "''");
      const escapedFoodId = entryData.food_id ? entryData.food_id.replace(/'/g, "''") : null;
      const escapedFoodName = entryData.food_name.replace(/'/g, "''");
      const escapedCustomName = entryData.custom_name ? entryData.custom_name.replace(/'/g, "''") : null;
      const escapedUnit = entryData.unit.replace(/'/g, "''");
      const escapedSource = entryData.source.replace(/'/g, "''");
      
      const sql = `
        INSERT INTO diary_entries (
          id, user_uid, date, meal_type, food_id, food_name, custom_name,
          amount, unit, source, kcal, carbs, protein, fat, created_at, updated_at
        ) VALUES (
          '${entryId}', 
          '${escapedUid}', 
          '${escapedDate}', 
          '${escapedMealType}', 
          ${escapedFoodId ? `'${escapedFoodId}'` : 'NULL'}, 
          '${escapedFoodName}', 
          ${escapedCustomName ? `'${escapedCustomName}'` : 'NULL'}, 
          ${entryData.amount || 0}, 
          '${escapedUnit}', 
          '${escapedSource}', 
          ${entryData.kcal || 0}, 
          ${entryData.carbs || 0}, 
          ${entryData.protein || 0}, 
          ${entryData.fat || 0}, 
          NOW(), 
          NOW()
        )
      `;
      
      console.log('执行 SQL (创建日记条目):', sql);
      await executeQuery(sql);
      
      return { id: entryId, ...entryData };
    } catch (error) {
      console.error('创建日记条目失败:', error);
      throw error;
    }
  }

  static async delete(userUid, entryId) {
    try {
      const escapedUid = userUid.replace(/'/g, "''");
      const escapedEntryId = entryId.replace(/'/g, "''");
      
      const sql = `DELETE FROM diary_entries WHERE id = '${escapedEntryId}' AND user_uid = '${escapedUid}'`;
      
      console.log('执行 SQL (删除日记条目):', sql);
      await executeQuery(sql);
      
      return true;
    } catch (error) {
      console.error('删除日记条目失败:', error);
      throw error;
    }
  }
}