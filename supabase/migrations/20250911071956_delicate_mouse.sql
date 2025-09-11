/*
  # 新手引导数据存储扩展

  1. 新增表
    - `user_onboarding_data` - 存储新手引导过程中的详细数据
    - 包含目标、障碍、健康习惯、餐食计划等字段

  2. 数据结构
    - 使用 JSON 字段存储数组数据（goals, barriers, healthy_habits）
    - 保持与现有 users 表的关联
    - 支持后续扩展更多新手引导字段

  3. 索引优化
    - 为 user_uid 添加索引以提高查询性能
*/

-- 创建新手引导数据表
CREATE TABLE IF NOT EXISTS user_onboarding_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_uid VARCHAR(255) UNIQUE NOT NULL,
  goals JSON,
  barriers JSON,
  healthy_habits JSON,
  meal_planning ENUM('never', 'rarely', 'occasionally', 'frequently', 'always'),
  meal_plan_opt_in ENUM('yes', 'open', 'no'),
  weekly_goal DECIMAL(3,1),
  goal_weight_kg DECIMAL(5,2),
  height_unit ENUM('cm', 'ft') DEFAULT 'cm',
  weight_unit ENUM('kg', 'lb', 'st') DEFAULT 'kg',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE,
  INDEX idx_user_uid (user_uid)
);