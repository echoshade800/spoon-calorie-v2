import fatsecret from 'fatsecret';

const CONSUMER_KEY = "1f9ca294fbab490b9372dc9da5c09be3";
const CONSUMER_SECRET = "1f62fc57ebf643a19fd5319cda587617";

const fatAPI = new fatsecret(CONSUMER_KEY, CONSUMER_SECRET);

export class FatSecretService {
  /**
   * 搜索食品并解析营养信息
   */
  static async searchFoods(query, maxResults = 10) {
    try {
      console.log(`FatSecret搜索: ${query}`);
      
      const results = await fatAPI.method('foods.search', {
        search_expression: query,
        max_results: maxResults
      });
      
      if (!results?.foods?.food) {
        console.log('FatSecret未找到食品');
        return [];
      }
      
      // 确保返回数组格式
      const foods = Array.isArray(results.foods.food) ? results.foods.food : [results.foods.food];
      
      console.log(`FatSecret找到 ${foods.length} 个食品`);
      
      // 转换为标准格式
      const convertedFoods = foods.map(food => this.convertFatSecretFood(food));
      
      return convertedFoods;
    } catch (error) {
      console.error('FatSecret搜索失败:', error);
      throw new Error('FatSecret API调用失败');
    }
  }
  
  /**
   * 将FatSecret食品数据转换为标准格式
   */
  static convertFatSecretFood(fatSecretFood) {
    try {
      // 解析food_description中的营养信息
      // 格式: "Per 100g - Calories: 89kcal | Fat: 0.33g | Carbs: 22.84g | Protein: 1.09g"
      const nutrition = this.parseNutritionDescription(fatSecretFood.food_description);
      
      return {
        id: `fatsecret_${fatSecretFood.food_id}`,
        name: fatSecretFood.food_name,
        brand: null, // FatSecret Generic foods通常没有品牌
        kcal_per_100g: nutrition.calories,
        carbs_per_100g: nutrition.carbs,
        protein_per_100g: nutrition.protein,
        fat_per_100g: nutrition.fat,
        fiber_per_100g: 0, // FatSecret基础数据不包含纤维
        sugar_per_100g: 0, // FatSecret基础数据不包含糖分
        sodium_per_100g: 0, // FatSecret基础数据不包含钠
        serving_label: null, // 基础搜索不包含份量信息
        grams_per_serving: null,
        source: 'FATSECRET',
        barcode: null,
        category: 'FatSecret',
        // 保留原始数据用于调试
        original_food_id: fatSecretFood.food_id,
        original_description: fatSecretFood.food_description,
        food_url: fatSecretFood.food_url
      };
    } catch (error) {
      console.error('转换FatSecret食品数据失败:', error);
      throw error;
    }
  }
  
  /**
   * 解析营养描述文本
   * 输入: "Per 100g - Calories: 89kcal | Fat: 0.33g | Carbs: 22.84g | Protein: 1.09g"
   * 输出: { calories: 89, fat: 0.33, carbs: 22.84, protein: 1.09 }
   */
  static parseNutritionDescription(description) {
    try {
      const nutrition = {
        calories: 0,
        carbs: 0,
        protein: 0,
        fat: 0
      };
      
      // 使用正则表达式提取营养信息
      const caloriesMatch = description.match(/Calories:\s*(\d+(?:\.\d+)?)kcal/i);
      const fatMatch = description.match(/Fat:\s*(\d+(?:\.\d+)?)g/i);
      const carbsMatch = description.match(/Carbs:\s*(\d+(?:\.\d+)?)g/i);
      const proteinMatch = description.match(/Protein:\s*(\d+(?:\.\d+)?)g/i);
      
      if (caloriesMatch) nutrition.calories = parseFloat(caloriesMatch[1]);
      if (fatMatch) nutrition.fat = parseFloat(fatMatch[1]);
      if (carbsMatch) nutrition.carbs = parseFloat(carbsMatch[1]);
      if (proteinMatch) nutrition.protein = parseFloat(proteinMatch[1]);
      
      console.log('解析营养信息:', nutrition);
      return nutrition;
    } catch (error) {
      console.error('解析营养描述失败:', error);
      return { calories: 0, carbs: 0, protein: 0, fat: 0 };
    }
  }
  
  /**
   * 获取食品详细信息（如果需要更多营养数据）
   */
  static async getFoodDetails(foodId) {
    try {
      const result = await fatAPI.method('food.get', {
        food_id: foodId
      });
      
      return result;
    } catch (error) {
      console.error('获取FatSecret食品详情失败:', error);
      throw error;
    }
  }
}