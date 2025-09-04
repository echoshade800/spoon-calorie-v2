import { executeQuery, executeTransaction } from '../config/database.js';

export class User {
  static async findByUid(uid) {
    try {
      const sql = 'SELECT * FROM users WHERE uid = ?';
      const users = await executeQuery(sql, [uid]);
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('查找用户失败:', error);
      throw error;
    }
  }

  static async create(userData) {
    try {
      const sql = `
        INSERT INTO users (
          uid, sex, age, height_cm, weight_kg, activity_level, goal_type, 
          rate_kcal_per_day, calorie_goal, macro_c, macro_p, macro_f, 
          bmr, tdee, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const params = [
        userData.uid,
        userData.sex,
        userData.age,
        userData.height_cm,
        userData.weight_kg,
        userData.activity_level,
        userData.goal_type,
        userData.rate_kcal_per_day,
        userData.calorie_goal,
        userData.macro_c,
        userData.macro_p,
        userData.macro_f,
        userData.bmr,
        userData.tdee
      ];
      
      const result = await executeQuery(sql, params);
      return { id: result.insertId, ...userData };
    } catch (error) {
      console.error('创建用户失败:', error);
      throw error;
    }
  }

  static async update(uid, updates) {
    try {
      const setClause = Object.keys(updates)
        .map(key => `${key} = ?`)
        .join(', ');
      
      const sql = `UPDATE users SET ${setClause}, updated_at = NOW() WHERE uid = ?`;
      const params = [...Object.values(updates), uid];
      
      await executeQuery(sql, params);
      return await User.findByUid(uid);
    } catch (error) {
      console.error('更新用户失败:', error);
      throw error;
    }
  }

  static async createOrUpdate(userData) {
    try {
      const existingUser = await User.findByUid(userData.uid);
      
      if (!existingUser) {
        console.log('用户不存在，创建新用户:', userData.uid);
        return await User.create(userData);
      }
      
      // 检查是否需要更新
      const needsUpdate = [
        'sex', 'age', 'height_cm', 'weight_kg', 'activity_level', 
        'goal_type', 'rate_kcal_per_day', 'calorie_goal', 
        'macro_c', 'macro_p', 'macro_f', 'bmr', 'tdee'
      ].some(field => existingUser[field] !== userData[field]);
      
      if (needsUpdate) {
        console.log('用户信息需要更新:', userData.uid);
        const updates = {};
        [
          'sex', 'age', 'height_cm', 'weight_kg', 'activity_level', 
          'goal_type', 'rate_kcal_per_day', 'calorie_goal', 
          'macro_c', 'macro_p', 'macro_f', 'bmr', 'tdee'
        ].forEach(field => {
          if (existingUser[field] !== userData[field]) {
            updates[field] = userData[field];
          }
        });
        
        return await User.update(userData.uid, updates);
      }
      
      console.log('用户信息无需更新:', userData.uid);
      return existingUser;
    } catch (error) {
      console.error('创建或更新用户失败:', error);
      throw error;
    }
  }
}