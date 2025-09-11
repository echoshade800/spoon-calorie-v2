import fatsecret from 'fatsecret';

const CONSUMER_KEY = "1f9ca294fbab490b9372dc9da5c09be3";
const CONSUMER_SECRET = "1f62fc57ebf643a19fd5319cda587617";

export class FatSecretService {
  constructor() {
    this.fatAPI = new fatsecret(CONSUMER_KEY, CONSUMER_SECRET);
  }

  /**
   * 搜索食物
   * @param {string} query 搜索关键词
   * @param {number} limit 返回结果数量限制
   * @returns {Promise<Array>} 食物列表
   */
  async searchFoods(query, limit = 20) {
    try {
      console.log(`FatSecret 搜索: "${query}", 限制: ${limit}`);
      
      const results = await this.fatAPI.method('foods.search', {
        search_expression: query,
        max_results: Math.min(limit, 50) // FatSecret 最大支持50条
      });

      if (!results || !results.foods || !results.foods.food) {
        console.log('FatSecret 返回空结果');
        return [];
      }

      // 处理单个结果的情况（FatSecret 返回对象而不是数组）
      const foodsArray = Array.isArray(results.foods.food) 
        ? results.foods.food 
        : [results.foods.food];

      console.log(`FatSecret 返回 ${foodsArray.length} 条结果`);

      // 转换为应用标准格式
      const convertedFoods = foodsArray.map(food => this.convertFatSecretFood(food));
      
      return convertedFoods;
    } catch (error) {
      console.error('FatSecret 搜索失败:', error);
      throw error;
    }
  }

  /**
   * 获取食物详细信息
   * @param {string} foodId FatSecret食物ID
   * @returns {Promise<Object>} 食物详细信息
   */
  async getFoodById(foodId) {
    try {
      console.log(`FatSecret 获取食物详情: ${foodId}`);
      
      const result = await this.fatAPI.method('food.get', {
        food_id: foodId
      });

      if (!result || !result.food) {
        console.log('FatSecret 未找到食物详情');
        return null;
      }

      return this.convertFatSecretFood(result.food);
    } catch (error) {
      console.error('FatSecret 获取食物详情失败:', error);
      throw error;
    }
  }

  /**
   * 转换FatSecret食物数据为应用标准格式
   * @param {Object} fatSecretFood FatSecret原始食物数据
   * @returns {Object} 标准化的食物数据
   */
  convertFatSecretFood(fatSecretFood) {
    try {
      // 解析营养信息
      const nutrition = this.parseNutritionDescription(fatSecretFood.food_description);
      
      return {
        id: `fatsecret_${fatSecretFood.food_id}`,
        name: fatSecretFood.food_name,
        brand: fatSecretFood.brand_name || null,
        kcal_per_100g: nutrition.calories,
        carbs_per_100g: nutrition.carbs,
        protein_per_100g: nutrition.protein,
        fat_per_100g: nutrition.fat,
        fiber_per_100g: 0, // FatSecret基础搜索不包含纤维信息
        sugar_per_100g: 0,
        sodium_per_100g: 0,
        serving_label: null, // 基础搜索不包含份量信息
        grams_per_serving: null,
        source: 'FatSecret',
        category: fatSecretFood.food_type || 'Generic',
        food_url: fatSecretFood.food_url,
        original_id: fatSecretFood.food_id,
      };
    } catch (error) {
      console.error('转换FatSecret食物数据失败:', error);
      // 返回基础数据，避免完全失败
      return {
        id: `fatsecret_${fatSecretFood.food_id}`,
        name: fatSecretFood.food_name,
        brand: null,
        kcal_per_100g: 0,
        carbs_per_100g: 0,
        protein_per_100g: 0,
        fat_per_100g: 0,
        source: 'FatSecret',
        category: 'Generic',
      };
    }
  }

  /**
   * 解析FatSecret的营养描述字符串
   * 示例: "Per 100g - Calories: 89kcal | Fat: 0.33g | Carbs: 22.84g | Protein: 1.09g"
   * @param {string} description 营养描述
   * @returns {Object} 解析后的营养数据
   */
  parseNutritionDescription(description) {
    const defaultNutrition = { calories: 0, carbs: 0, protein: 0, fat: 0 };
    
    if (!description) {
      return defaultNutrition;
    }

    try {
      // 使用正则表达式提取营养信息
      const caloriesMatch = description.match(/Calories:\s*(\d+(?:\.\d+)?)kcal/i);
      const carbsMatch = description.match(/Carbs:\s*(\d+(?:\.\d+)?)g/i);
      const proteinMatch = description.match(/Protein:\s*(\d+(?:\.\d+)?)g/i);
      const fatMatch = description.match(/Fat:\s*(\d+(?:\.\d+)?)g/i);

      return {
        calories: caloriesMatch ? parseFloat(caloriesMatch[1]) : 0,
        carbs: carbsMatch ? parseFloat(carbsMatch[1]) : 0,
        protein: proteinMatch ? parseFloat(proteinMatch[1]) : 0,
        fat: fatMatch ? parseFloat(fatMatch[1]) : 0,
      };
    } catch (error) {
      console.error('解析营养描述失败:', error, '描述:', description);
      return defaultNutrition;
    }
  }
}

// 创建单例实例
export const fatSecretService = new FatSecretService();