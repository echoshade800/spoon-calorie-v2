import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { testConnection } from './config/database.js';
import { User } from './models/User.js';
import { Food } from './models/Food.js';
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
testConnection();

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
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 QuickKcal API 服务器运行在端口 ${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
});

export default app;