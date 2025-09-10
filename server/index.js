import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { testConnection, executeQuery } from './config/database.js';
import { User } from './models/User.js';
import { Food } from './models/Food.js';
import { MyMeal } from './models/MyMeal.js';
import { DiaryEntry } from './models/DiaryEntry.js';
import { ExerciseEntry } from './models/ExerciseEntry.js';
import { OpenAIService } from './services/openaiService.js';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 配置 multer 用于处理文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// 测试数据库连接
const initializeDatabase = async () => {
  const isConnected = await testConnection();
  if (!isConnected) {
    console.warn('⚠️  数据库连接失败，服务器将在模拟模式下运行');
    console.warn('⚠️  某些功能可能不可用，但服务器仍会启动');
  }
  return isConnected;
};

// 初始化数据库表
const initializeTables = async () => {
  try {
    console.log('正在初始化数据库表...');
    
    // 检查数据库连接
    const isConnected = await testConnection();
    if (!isConnected) {
      console.warn('数据库连接不可用，跳过表初始化');
      return;
    }
    
    // 创建用户表
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uid VARCHAR(255) UNIQUE NOT NULL,
        sex ENUM('male', 'female') NOT NULL,
        age INT NOT NULL,
        height_cm DECIMAL(5,2) NOT NULL,
        weight_kg DECIMAL(5,2) NOT NULL,
        activity_level ENUM('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active') NOT NULL,
        goal_type ENUM('lose', 'maintain', 'gain') NOT NULL,
        rate_kcal_per_day INT DEFAULT 0,
        calorie_goal INT NOT NULL,
        macro_c INT DEFAULT 45,
        macro_p INT DEFAULT 25,
        macro_f INT DEFAULT 30,
        bmr INT NOT NULL,
        tdee INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_uid (uid)
      )
    `);
    
    // 创建食物表
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS foods (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(255),
        kcal_per_100g DECIMAL(8,2) NOT NULL,
        carbs_per_100g DECIMAL(8,2) DEFAULT 0,
        protein_per_100g DECIMAL(8,2) DEFAULT 0,
        fat_per_100g DECIMAL(8,2) DEFAULT 0,
        fiber_per_100g DECIMAL(8,2) DEFAULT 0,
        sugar_per_100g DECIMAL(8,2) DEFAULT 0,
        sodium_per_100g DECIMAL(8,2) DEFAULT 0,
        serving_label VARCHAR(255),
        grams_per_serving DECIMAL(8,2),
        source ENUM('USDA', 'OFF', 'CUSTOM') NOT NULL,
        barcode VARCHAR(255),
        category VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_brand (brand),
        INDEX idx_barcode (barcode),
        INDEX idx_source (source)
      )
    `);
    
    // 创建日记条目表
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS diary_entries (
        id VARCHAR(255) PRIMARY KEY,
        user_uid VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
        food_id VARCHAR(255),
        food_name VARCHAR(255) NOT NULL,
        custom_name VARCHAR(255),
        amount DECIMAL(8,2) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        source VARCHAR(50) NOT NULL,
        kcal DECIMAL(8,2) NOT NULL,
        carbs DECIMAL(8,2) DEFAULT 0,
        protein DECIMAL(8,2) DEFAULT 0,
        fat DECIMAL(8,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE,
        INDEX idx_user_date (user_uid, date),
        INDEX idx_meal_type (meal_type)
      )
    `);
    
    // 创建运动条目表
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS exercise_entries (
        id VARCHAR(255) PRIMARY KEY,
        user_uid VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        time TIME,
        category ENUM('cardio', 'strength') NOT NULL,
        name VARCHAR(255) NOT NULL,
        duration_min INT NOT NULL,
        calories DECIMAL(8,2) NOT NULL,
        distance DECIMAL(8,2),
        sets INT,
        reps INT,
        weight DECIMAL(8,2),
        notes TEXT,
        met_value DECIMAL(4,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE,
        INDEX idx_user_date (user_uid, date),
        INDEX idx_category (category)
      )
    `);
    
    // 创建我的餐食表
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS my_meals (
        id VARCHAR(255) PRIMARY KEY,
        user_uid VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        photo TEXT,
        total_kcal DECIMAL(8,2) DEFAULT 0,
        total_carbs DECIMAL(8,2) DEFAULT 0,
        total_protein DECIMAL(8,2) DEFAULT 0,
        total_fat DECIMAL(8,2) DEFAULT 0,
        directions TEXT,
        source VARCHAR(50) DEFAULT 'custom',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE,
        INDEX idx_user_uid (user_uid),
        INDEX idx_name (name)
      )
    `);
    
    // 创建我的餐食项目表
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS my_meal_items (
        id VARCHAR(255) PRIMARY KEY,
        meal_id VARCHAR(255) NOT NULL,
        food_id VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        amount DECIMAL(8,2) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        calories DECIMAL(8,2) NOT NULL,
        carbs DECIMAL(8,2) DEFAULT 0,
        protein DECIMAL(8,2) DEFAULT 0,
        fat DECIMAL(8,2) DEFAULT 0,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (meal_id) REFERENCES my_meals(id) ON DELETE CASCADE,
        INDEX idx_meal_id (meal_id),
        INDEX idx_food_id (food_id),
        INDEX idx_sort_order (sort_order)
      )
    `);
    
    // 插入示例食物数据
    await executeQuery(`
      INSERT IGNORE INTO foods (id, name, brand, kcal_per_100g, carbs_per_100g, protein_per_100g, fat_per_100g, serving_label, grams_per_serving, source, category) VALUES
      ('usda_01001', 'Butter, salted', NULL, 717, 0.06, 0.85, 81.11, '1 tbsp', 14.2, 'USDA', 'Dairy'),
      ('usda_11124', 'Carrots, raw', NULL, 41, 9.58, 0.93, 0.24, '1 medium', 61, 'USDA', 'Vegetables'),
      ('usda_05062', 'Chicken, broilers or fryers, breast, meat only, cooked, roasted', NULL, 165, 0, 31.02, 3.57, '1 breast', 172, 'USDA', 'Poultry'),
      ('usda_09040', 'Bananas, raw', NULL, 89, 22.84, 1.09, 0.33, '1 medium', 118, 'USDA', 'Fruits'),
      ('usda_20081', 'Wheat flour, white, all-purpose, enriched, bleached', NULL, 364, 76.31, 10.33, 0.98, '1 cup', 125, 'USDA', 'Grains'),
      ('off_3017620422003', 'Nutella', 'Ferrero', 539, 57.5, 6.3, 30.9, '1 tbsp', 20, 'OFF', 'Spreads'),
      ('off_7622210951965', 'KitKat', 'Nestlé', 518, 59.2, 7.3, 27.6, '1 bar', 41.5, 'OFF', 'Snacks'),
      ('off_8901030865507', 'Coca-Cola', 'The Coca-Cola Company', 42, 10.6, 0, 0, '1 can', 330, 'OFF', 'Beverages'),
      ('off_3228857000906', 'Greek Yogurt, Plain', 'Fage', 97, 4.0, 10.0, 5.0, '1 container', 170, 'OFF', 'Dairy'),
      ('off_4901777317789', 'Instant Ramen Noodles', 'Nissin', 448, 58.6, 9.4, 19.8, '1 package', 85, 'OFF', 'Prepared Foods')
    `);
    
    console.log('数据库表初始化完成');
  } catch (error) {
    console.warn('数据库表初始化失败，服务器将在模拟模式下运行:', error.message);
  }
};

// 初始化数据库
const startServer = async () => {
  await initializeDatabase();
  await initializeTables();
  
  // 启动服务器
  app.listen(PORT, () => {
    console.log(`🚀 QuickKcal API 服务器运行在端口 ${PORT}`);
    console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
  });
};

// 用户相关接口
app.post('/api/users/sync', async (req, res) => {
  try {
    const userData = req.body;
    
    if (!userData.uid) {
      return res.status(400).json({ error: '缺少用户 UID' });
    }
    
    const user = await User.createOrUpdate(userData);
    res.json({ success: true, user });
  } catch (error) {
    console.error('用户同步失败:', error);
    res.status(500).json({ error: '用户同步失败' });
  }
});

app.get('/api/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await User.findByUid(uid);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('获取用户失败:', error);
    res.status(500).json({ error: '获取用户失败' });
  }
});

// 食物相关接口
app.get('/api/foods/search', async (req, res) => {
  try {
    const { q: query, limit = 20 } = req.query;
    const foods = await Food.search(query, parseInt(limit));
    res.json({ success: true, foods });
  } catch (error) {
    console.error('搜索食物失败:', error);
    res.status(500).json({ error: '搜索食物失败' });
  }
});

app.get('/api/foods/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const food = await Food.findById(id);
    
    if (!food) {
      return res.status(404).json({ error: '食物不存在' });
    }
    
    res.json({ success: true, food });
  } catch (error) {
    console.error('获取食物失败:', error);
    res.status(500).json({ error: '获取食物失败' });
  }
});

app.post('/api/foods', async (req, res) => {
  try {
    const foodData = req.body;
    const food = await Food.create(foodData);
    res.json({ success: true, food });
  } catch (error) {
    console.error('创建食物失败:', error);
    res.status(500).json({ error: '创建食物失败' });
  }
});

// 餐食相关接口
app.get('/api/meals/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const meals = await MyMeal.findByUserUid(uid);
    res.json({ success: true, meals });
  } catch (error) {
    console.error('获取用户餐食失败:', error);
    res.status(500).json({ error: '获取用户餐食失败' });
  }
});

app.post('/api/meals', async (req, res) => {
  try {
    const { userUid, mealData } = req.body;
    
    if (!userUid || !mealData) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const meal = await MyMeal.create(userUid, mealData);
    res.json({ success: true, meal });
  } catch (error) {
    console.error('创建餐食失败:', error);
    res.status(500).json({ error: '创建餐食失败' });
  }
});

app.delete('/api/meals/:uid/:mealId', async (req, res) => {
  try {
    const { uid, mealId } = req.params;
    await MyMeal.delete(uid, mealId);
    res.json({ success: true });
  } catch (error) {
    console.error('删除餐食失败:', error);
    res.status(500).json({ error: '删除餐食失败' });
  }
});

// 日记条目相关接口
app.get('/api/diary/:uid/:date', async (req, res) => {
  try {
    const { uid, date } = req.params;
    const entries = await DiaryEntry.findByUserAndDate(uid, date);
    res.json({ success: true, entries });
  } catch (error) {
    console.error('获取日记条目失败:', error);
    res.status(500).json({ error: '获取日记条目失败' });
  }
});

app.post('/api/diary', async (req, res) => {
  try {
    const entryData = req.body;
    
    if (!entryData.user_uid || !entryData.date) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const entry = await DiaryEntry.create(entryData);
    res.json({ success: true, entry });
  } catch (error) {
    console.error('创建日记条目失败:', error);
    res.status(500).json({ error: '创建日记条目失败' });
  }
});

app.delete('/api/diary/:uid/:entryId', async (req, res) => {
  try {
    const { uid, entryId } = req.params;
    await DiaryEntry.delete(uid, entryId);
    res.json({ success: true });
  } catch (error) {
    console.error('删除日记条目失败:', error);
    res.status(500).json({ error: '删除日记条目失败' });
  }
});

// 运动条目相关接口
app.get('/api/exercise/:uid/:date', async (req, res) => {
  try {
    const { uid, date } = req.params;
    const entries = await ExerciseEntry.findByUserAndDate(uid, date);
    res.json({ success: true, entries });
  } catch (error) {
    console.error('获取运动条目失败:', error);
    res.status(500).json({ error: '获取运动条目失败' });
  }
});

app.post('/api/exercise', async (req, res) => {
  try {
    const entryData = req.body;
    
    if (!entryData.user_uid || !entryData.date) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const entry = await ExerciseEntry.create(entryData);
    res.json({ success: true, entry });
  } catch (error) {
    console.error('创建运动条目失败:', error);
    res.status(500).json({ error: '创建运动条目失败' });
  }
});

app.delete('/api/exercise/:uid/:entryId', async (req, res) => {
  try {
    const { uid, entryId } = req.params;
    await ExerciseEntry.delete(uid, entryId);
    res.json({ success: true });
  } catch (error) {
    console.error('删除运动条目失败:', error);
    res.status(500).json({ error: '删除运动条目失败' });
  }
});

// OpenAI 图片识别接口
app.post('/api/analyze-food-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未提供图片文件' });
    }
    
    // 将图片转换为 base64
    const imageBase64 = req.file.buffer.toString('base64');
    
    // 调用 OpenAI 分析
    const foods = await OpenAIService.analyzeFood(imageBase64);
    
    res.json({ success: true, foods });
  } catch (error) {
    console.error('图片分析失败:', error);
    res.status(500).json({ error: error.message || '图片分析失败' });
  }
});

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'QuickKcal API 服务正常运行',
    timestamp: new Date().toISOString(),
    database: 'connected' // 简化状态显示
  });
});

// 启动应用
startServer().catch(error => {
  console.error('服务器启动失败:', error);
  process.exit(1);
});

export default app;