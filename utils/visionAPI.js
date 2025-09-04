/**
 * Vision API utilities for food detection
 * Now uses OpenAI GPT-4o for real food recognition
 */
import { API } from './apiClient';

/**
 * Real food detection using OpenAI GPT-4o
 */
export const detectFoodsInImage = async (imageUri) => {
  try {
    console.log('开始 OpenAI 图片分析...');
    const response = await API.analyzeFoodImage(imageUri);
    
    if (!response.foods || response.foods.length === 0) {
      console.log('OpenAI 未识别到食物');
      return [];
    }
    
    // 转换 OpenAI 响应为应用格式
    const detectedFoods = response.foods.map((food, index) => ({
      id: `openai_${Date.now()}_${index}`,
      name: food.name,
      confidence: food.confidence || 0.8,
      calories: food.calories || 0,
      servingText: food.servingText || '100g',
      units: food.units || [
        { label: '100 g', grams: 100 },
        { label: '1 g', grams: 1 }
      ],
      macros: food.macros || { carbs: 0, protein: 0, fat: 0 },
      selectedUnit: food.units?.[0] || { label: '100 g', grams: 100 },
      servings: 1,
      source: 'openai',
    }));
    
    console.log(`OpenAI 识别到 ${detectedFoods.length} 种食物`);
    return detectedFoods;
    
  } catch (error) {
    console.error('OpenAI 食物识别错误:', error);
    throw new Error('图片识别失败，请重试');
  }
};

/**
 * Validate image for food detection
 */
export const validateImageForDetection = (imageUri) => {
  // Basic validation - in production would check file size, format, etc.
  if (!imageUri) {
    throw new Error('No image provided');
  }
  
  return true;
};

/**
 * Compress image for API upload
 */
export const compressImageForUpload = async (imageUri) => {
  // In production, would use expo-image-manipulator to compress
  // For now, return the original URI
  return imageUri;
};