import { executeQuery, executeTransaction } from '../config/database.js';

export class User {
  static async findByUid(uid) {
    try {
      const sql = `SELECT * FROM users WHERE uid = '${uid.replace(/'/g, "''")}'`;
      console.log('执行 SQL (查找用户):', sql);
      
      const users = await executeQuery(sql);
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('查找用户失败:', error);
      throw error;
    }
  }

  static async create(userData) {
    try {
      // 验证必需字段
      const requiredFields = ['uid', 'sex', 'age', 'height_cm', 'weight_kg', 'activity_level', 'goal_type', 'calorie_goal', 'bmr', 'tdee'];
      for (const field of requiredFields) {
        if (userData[field] === undefined || userData[field] === null) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // 转义字符串字段
      const escapedUid = userData.uid.replace(/'/g, "''");
      const escapedSex = userData.sex.replace(/'/g, "''");
      const escapedActivityLevel = userData.activity_level.replace(/'/g, "''");
      const escapedGoalType = userData.goal_type.replace(/'/g, "''");
      
      const sql = `
        INSERT INTO users (
          uid, sex, age, height_cm, weight_kg, activity_level, goal_type, 
          rate_kcal_per_day, calorie_goal, macro_c, macro_p, macro_f, 
          bmr, tdee, created_at, updated_at
        ) VALUES (
          '${escapedUid}', 
          '${escapedSex}', 
          ${userData.age}, 
          ${userData.height_cm}, 
          ${userData.weight_kg}, 
          '${escapedActivityLevel}', 
          '${escapedGoalType}', 
          ${userData.rate_kcal_per_day || 0}, 
          ${userData.calorie_goal}, 
          ${userData.macro_c || 45}, 
          ${userData.macro_p || 25}, 
          ${userData.macro_f || 30}, 
          ${userData.bmr}, 
          ${userData.tdee}, 
          NOW(), 
          NOW()
        )
      `;
      
      console.log('执行 SQL (创建用户):', sql);
      
      const result = await executeQuery(sql);
      const r={ id: result.insertId, ...userData };
      console.log("create user:",r)
      return r
    } catch (error) {
      console.error('创建用户失败:', error);
      throw error;
    }
  }

  static async update(uid, updates) {
    try {
      const setClause = Object.keys(updates)
        .map(key => {
          const value = updates[key];
          if (typeof value === 'string') {
            return `${key} = '${value.replace(/'/g, "''")}'`;
          } else {
            return `${key} = ${value}`;
          }
        })
        .join(', ');
      
      const sql = `UPDATE users SET ${setClause}, updated_at = NOW() WHERE uid = '${uid.replace(/'/g, "''")}'`;
      console.log('执行 SQL (更新用户):', sql);
      
      await executeQuery(sql);
      return await User.findByUid(uid);
    } catch (error) {
      console.error('更新用户失败:', error);
      throw error;
    }
  }

  static async createOrUpdate(userData) {
    try {
      // 验证用户数据完整性
      if (!userData.uid) {
        throw new Error('UID is required');
      }

      // 检查是否为完整的用户数据（已完成 onboarding）
      const isCompleteProfile = userData.sex && userData.age && userData.height_cm && 
                               userData.weight_kg && userData.activity_level && 
                               userData.goal_type && userData.calorie_goal && 
                               userData.bmr && userData.tdee;

      if (!isCompleteProfile) {
        console.log('用户数据不完整，跳过数据库同步:', userData.uid);
        return { success: false, message: 'Profile incomplete, skipping sync' };
      }

      const existingUser = await User.findByUid(userData.uid);
      
      if (!existingUser) {
        console.log('用户不存在，创建新用户:', userData.uid);
        const newUser = await User.create(userData);
        return newUser;
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
        
        const updatedUser = await User.update(userData.uid, updates);
        return  updatedUser ;
      }
      
      console.log('用户信息无需更新:', userData.uid);
      return { success: true, user: existingUser };
    } catch (error) {
      console.error('创建或更新用户失败:', error);
      throw error;
    }
  }
}