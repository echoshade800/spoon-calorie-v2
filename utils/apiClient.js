import axios from 'axios';
import Constants from 'expo-constants';

// API 基础配置
const API_BASE_URL = Constants.platform?.OS === 'web' 
  ? 'http://localhost:3001/api'
  : 'http://10.0.2.2:3001/api'; // Android 模拟器使用 10.0.2.2

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 增加超时时间到30秒
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API 请求: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API 请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.warn('API 响应错误:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.warn('服务器连接被拒绝，可能服务器未启动');
      throw new Error('服务器暂时不可用');
    }
    
    if (error.response) {
      throw new Error(error.response.data?.error || '服务器错误');
    }
    
    throw new Error('网络连接失败');
  }
);

// API 方法
export const API = {
  // 用户相关
  async syncUser(userData) {
    return await apiClient.post('/users/sync', userData);
  },

  async getUser(uid) {
    return await apiClient.get(`/users/${uid}`);
  },

  // 食物相关
  async searchFoods(query, limit = 20) {
    return await apiClient.get('/foods/search', {
      params: { q: query, limit }
    });
  },

  async getFood(id) {
    return await apiClient.get(`/foods/${id}`);
  },

  async createFood(foodData) {
    return await apiClient.post('/foods', foodData);
  },

  // 餐食相关
  async getUserMeals(uid) {
    return await apiClient.get(`/meals/${uid}`);
  },

  async createMeal(userUid, mealData) {
    return await apiClient.post('/meals', { userUid, mealData });
  },

  async deleteMeal(uid, mealId) {
    return await apiClient.delete(`/meals/${uid}/${mealId}`);
  },

  // 日记条目相关
  async getUserDiaryEntries(uid, date) {
    return await apiClient.get(`/diary/${uid}/${date}`);
  },

  async createDiaryEntry(entryData) {
    return await apiClient.post('/diary', entryData);
  },

  async deleteDiaryEntry(uid, entryId) {
    return await apiClient.delete(`/diary/${uid}/${entryId}`);
  },

  // 运动条目相关
  async getUserExerciseEntries(uid, date) {
    return await apiClient.get(`/exercise/${uid}/${date}`);
  },

  async createExerciseEntry(entryData) {
    return await apiClient.post('/exercise', entryData);
  },

  async deleteExerciseEntry(uid, entryId) {
    return await apiClient.delete(`/exercise/${uid}/${entryId}`);
  },

  // 图片识别
  async analyzeFoodImage(imageUri) {
    try {
      const formData = new FormData();
      
      // 处理图片文件
      if (Constants.platform?.OS === 'web') {
        // Web 平台处理
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('image', blob, 'meal.jpg');
      } else {
        // 移动平台处理
        formData.append('image', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'meal.jpg',
        });
      }

      const response = await apiClient.post('/analyze-food-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30秒超时
      });

      return response;
    } catch (error) {
      console.error('图片分析 API 错误:', error);
      throw error;
    }
  },
};

export default apiClient;