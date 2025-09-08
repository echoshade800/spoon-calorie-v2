import { executeQuery } from '../config/database.js';

export class ExerciseEntry {
  static async findByUserAndDate(userUid, date) {
    try {
      const escapedUid = userUid.replace(/'/g, "''");
      const escapedDate = date.replace(/'/g, "''");
      
      const sql = `
        SELECT id, user_uid, DATE_FORMAT(date, '%Y-%m-%d') as date, time, category, name, duration_min,
               calories, distance, sets, reps, weight, notes, met_value, created_at, updated_at
        FROM exercise_entries 
        WHERE user_uid = '${escapedUid}' AND date = '${escapedDate}'
        ORDER BY created_at ASC
      `;
      
      console.log('执行 SQL (查找运动条目):', sql);
      
      const entries = await executeQuery(sql);
      return entries || [];
    } catch (error) {
      console.error('查找运动条目失败:', error);
      throw error;
    }
  }

  static async create(entryData) {
    try {
      const entryId = entryData.id || `exercise_${Date.now()}`;
      const escapedUid = entryData.user_uid.replace(/'/g, "''");
      const escapedDate = entryData.date.replace(/'/g, "''");
      const escapedCategory = entryData.category.replace(/'/g, "''");
      const escapedName = entryData.name.replace(/'/g, "''");
      const escapedTime = entryData.time ? entryData.time.replace(/'/g, "''") : null;
      const escapedNotes = entryData.notes ? entryData.notes.replace(/'/g, "''") : null;
      
      const sql = `
        INSERT INTO exercise_entries (
          id, user_uid, date, time, category, name, duration_min,
          calories, distance, sets, reps, weight, notes, met_value, created_at, updated_at
        ) VALUES (
          '${entryId}', 
          '${escapedUid}', 
          '${escapedDate}', 
          ${escapedTime ? `'${escapedTime}'` : 'NULL'}, 
          '${escapedCategory}', 
          '${escapedName}', 
          ${entryData.durationMin || 0}, 
          ${entryData.calories || 0}, 
          ${entryData.distance || 'NULL'}, 
          ${entryData.sets || 'NULL'}, 
          ${entryData.reps || 'NULL'}, 
          ${entryData.weight || 'NULL'}, 
          ${escapedNotes ? `'${escapedNotes}'` : 'NULL'}, 
          ${entryData.met || 'NULL'}, 
          NOW(), 
          NOW()
        )
      `;
      
      console.log('执行 SQL (创建运动条目):', sql);
      await executeQuery(sql);
      
      return { id: entryId, ...entryData };
    } catch (error) {
      console.error('创建运动条目失败:', error);
      throw error;
    }
  }

  static async delete(userUid, entryId) {
    try {
      const escapedUid = userUid.replace(/'/g, "''");
      const escapedEntryId = entryId.replace(/'/g, "''");
      
      const sql = `DELETE FROM exercise_entries WHERE id = '${escapedEntryId}' AND user_uid = '${escapedUid}'`;
      
      console.log('执行 SQL (删除运动条目):', sql);
      await executeQuery(sql);
      
      return true;
    } catch (error) {
      console.error('删除运动条目失败:', error);
      throw error;
    }
  }
}