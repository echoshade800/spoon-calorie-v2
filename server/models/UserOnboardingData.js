import { executeQuery } from '../config/database.js';

export class UserOnboardingData {
  static async findByUserUid(userUid) {
    try {
      const escapedUid = userUid.replace(/'/g, "''");
      const sql = `SELECT * FROM user_onboarding_data WHERE user_uid = '${escapedUid}'`;
      console.log('执行 SQL (查找新手引导数据):', sql);
      
      const results = await executeQuery(sql);
      if (results.length > 0) {
        const data = results[0];
        // 解析 JSON 字段
        return {
          ...data,
          goals: data.goals ? JSON.parse(data.goals) : [],
          barriers: data.barriers ? JSON.parse(data.barriers) : [],
          healthy_habits: data.healthy_habits ? JSON.parse(data.healthy_habits) : [],
        };
      }
      return null;
    } catch (error) {
      console.error('查找新手引导数据失败:', error);
      throw error;
    }
  }

  static async create(userUid, onboardingData) {
    try {
      const escapedUid = userUid.replace(/'/g, "''");
      
      // 转义和序列化 JSON 字段
      const goalsJson = onboardingData.goals ? JSON.stringify(onboardingData.goals).replace(/'/g, "''") : 'NULL';
      const barriersJson = onboardingData.barriers ? JSON.stringify(onboardingData.barriers).replace(/'/g, "''") : 'NULL';
      const healthyHabitsJson = onboardingData.healthyHabits ? JSON.stringify(onboardingData.healthyHabits).replace(/'/g, "''") : 'NULL';
      
      const sql = `
        INSERT INTO user_onboarding_data (
          user_uid, goals, barriers, healthy_habits, meal_planning, 
          meal_plan_opt_in, weekly_goal, goal_weight_kg, height_unit, weight_unit,
          created_at, updated_at
        ) VALUES (
          '${escapedUid}',
          ${goalsJson !== 'NULL' ? `'${goalsJson}'` : 'NULL'},
          ${barriersJson !== 'NULL' ? `'${barriersJson}'` : 'NULL'},
          ${healthyHabitsJson !== 'NULL' ? `'${healthyHabitsJson}'` : 'NULL'},
          ${onboardingData.mealPlanning ? `'${onboardingData.mealPlanning}'` : 'NULL'},
          ${onboardingData.mealPlanOptIn ? `'${onboardingData.mealPlanOptIn}'` : 'NULL'},
          ${onboardingData.weeklyGoal || 'NULL'},
          ${onboardingData.goal_weight_kg || 'NULL'},
          ${onboardingData.heightUnit ? `'${onboardingData.heightUnit}'` : "'cm'"},
          ${onboardingData.weightUnit ? `'${onboardingData.weightUnit}'` : "'kg'"},
          NOW(),
          NOW()
        )
      `;
      
      console.log('执行 SQL (创建新手引导数据):', sql);
      await executeQuery(sql);
      
      return { user_uid: userUid, ...onboardingData };
    } catch (error) {
      console.error('创建新手引导数据失败:', error);
      throw error;
    }
  }

  static async update(userUid, updates) {
    try {
      const escapedUid = userUid.replace(/'/g, "''");
      
      const setClause = [];
      
      if (updates.goals !== undefined) {
        const goalsJson = JSON.stringify(updates.goals).replace(/'/g, "''");
        setClause.push(`goals = '${goalsJson}'`);
      }
      
      if (updates.barriers !== undefined) {
        const barriersJson = JSON.stringify(updates.barriers).replace(/'/g, "''");
        setClause.push(`barriers = '${barriersJson}'`);
      }
      
      if (updates.healthyHabits !== undefined) {
        const healthyHabitsJson = JSON.stringify(updates.healthyHabits).replace(/'/g, "''");
        setClause.push(`healthy_habits = '${healthyHabitsJson}'`);
      }
      
      if (updates.mealPlanning !== undefined) {
        setClause.push(`meal_planning = '${updates.mealPlanning}'`);
      }
      
      if (updates.mealPlanOptIn !== undefined) {
        setClause.push(`meal_plan_opt_in = '${updates.mealPlanOptIn}'`);
      }
      
      if (updates.weeklyGoal !== undefined) {
        setClause.push(`weekly_goal = ${updates.weeklyGoal}`);
      }
      
      if (updates.goal_weight_kg !== undefined) {
        setClause.push(`goal_weight_kg = ${updates.goal_weight_kg}`);
      }
      
      if (updates.heightUnit !== undefined) {
        setClause.push(`height_unit = '${updates.heightUnit}'`);
      }
      
      if (updates.weightUnit !== undefined) {
        setClause.push(`weight_unit = '${updates.weightUnit}'`);
      }
      
      if (setClause.length === 0) {
        return await UserOnboardingData.findByUserUid(userUid);
      }
      
      const sql = `
        UPDATE user_onboarding_data 
        SET ${setClause.join(', ')}, updated_at = NOW() 
        WHERE user_uid = '${escapedUid}'
      `;
      
      console.log('执行 SQL (更新新手引导数据):', sql);
      await executeQuery(sql);
      
      return await UserOnboardingData.findByUserUid(userUid);
    } catch (error) {
      console.error('更新新手引导数据失败:', error);
      throw error;
    }
  }

  static async createOrUpdate(userUid, onboardingData) {
    try {
      const existing = await UserOnboardingData.findByUserUid(userUid);
      
      if (existing) {
        console.log('更新现有新手引导数据:', userUid);
        return await UserOnboardingData.update(userUid, onboardingData);
      } else {
        console.log('创建新的新手引导数据:', userUid);
        return await UserOnboardingData.create(userUid, onboardingData);
      }
    } catch (error) {
      console.error('创建或更新新手引导数据失败:', error);
      throw error;
    }
  }
}