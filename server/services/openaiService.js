import axios from 'axios';

const openaiConfig = {
  apiKey: '15bc0de172ab4260beb8db19f63f648a',
  baseURL: 'https://chatgpt-api-001.openai.azure.com/openai/deployments/gpt-4o',
  defaultQuery: { 'api-version': '2024-08-01-preview' },
  defaultHeaders: { 'api-key': '15bc0de172ab4260beb8db19f63f648a' }
};

export class OpenAIService {
  static async analyzeFood(imageBase64) {
    try {
      const response = await axios.post(
        `${openaiConfig.baseURL}/chat/completions?api-version=${openaiConfig.defaultQuery['api-version']}`,
        {
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `你需要分析输入的食物图片，并返回严格 JSON 格式，结构如下：
{
  "items": [
    {
      "name": "食物名称",
      "type": "packaged | unpackaged", 
      "confidence": 0.95,
      "servingText": "包装或食物上的份量描述，如 '500ml瓶装' 或 '一碗'",
      "units": [
        {"label": "1份", "grams": 克数},
        {"label": "100g", "grams": 100}
      ],
      "grams_per_serving": 默认份量克数（整数，若是液体需按密度≈1.03 g/ml换算），
      "kcal_per_100g": 每100克卡路里（整数，参考权威数据库如 USDA 或中国营养成分表），
      "macros": {
        "carbs": 每份碳水克数,
        "protein": 每份蛋白质克数,
        "fat": 每份脂肪克数,
        "cholesterol": 每份胆固醇毫克,
        "sodium": 每份钠毫克
      },
      "micros": {
        "calcium": 每份钙毫克, 
        "iron": 每份铁毫克, 
        "potassium": 每份钾毫克, 
        "vitaminC": 每份维生素C毫克
      }
    }
  ],
  "totals": {
    "grams": 所有食物重量总和,
    "kcal": 总卡路里,
    "carbs": 总碳水克数,
    "protein": 总蛋白质克数,
    "fat": 总脂肪克数,
    "cholesterol": 总胆固醇毫克,
    "sodium": 总钠毫克,
    "calcium": 总钙毫克,
    "iron": 总铁毫克,
    "potassium": 总钾毫克,
    "vitaminC": 总维生素C毫克
  }
}
⚠️ 规则：
1. 只识别图片中明确可见的食物，忽略餐具、装饰。
2. 包装食品优先使用包装上的重量/毫升信息，若为液体需按密度≈1.03 g/ml 转换为克。
3. 无包装食物需估算重量（如：米饭一碗≈150g）。
4. 营养数值计算方式：  
   - 每份营养 = grams_per_serving ÷ 100 × 每100g营养值  
   - totals = 所有 items 营养值的加和  
5. 营养值必须与常见数据库一致，不允许直接套用错误数据。若计算结果与已知食品常识差异过大（>10%），请自动校正。  
6. 严格输出 JSON，不能有额外文字或解释。`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
          temperature: 0.1
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': openaiConfig.apiKey,
            ...openaiConfig.defaultHeaders
          }
        }
      );

      const content = response.data.choices[0].message.content;
      
      // 尝试解析JSON响应
      try {
        // 清理 markdown 代码块标记
        let cleanContent = content.trim();
        
        // 移除可能的 markdown 代码块标记
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.replace(/^```json\s*/, '');
        }
        if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/^```\s*/, '');
        }
        if (cleanContent.endsWith('```')) {
          cleanContent = cleanContent.replace(/\s*```$/, '');
        }
        
        // 移除其他可能的格式标记
        cleanContent = cleanContent.replace(/^json\s*/, '');
        cleanContent = cleanContent.trim();
        
        console.log('清理后的内容:', cleanContent);
        
        const result = JSON.parse(cleanContent);
        
        // 验证返回格式是否符合新的结构
        if (result && result.items && Array.isArray(result.items)) {
          // 转换为前端期望的格式
          const convertedFoods = result.items.map((item, index) => ({
            id: `openai_${Date.now()}_${index}`,
            name: item.name,
            confidence: item.confidence || 0.8,
            calories: item.kcal_per_100g || 0,
            servingText: item.servingText || '100g',
            units: item.units || [
              { label: '100 g', grams: 100 },
              { label: '1 g', grams: 1 },
              ...(item.grams_per_serving ? [
                { label: '1份', grams: item.grams_per_serving }
              ] : [])
            ],
            macros: {
              carbs: item.macros?.carbs || 0,
              protein: item.macros?.protein || 0,
              fat: item.macros?.fat || 0,
            },
            selectedUnit: item.units?.[0] || { label: '100 g', grams: 100 },
            servings: 1,
            source: 'openai',
            // 新增字段
            type: item.type || 'unpackaged',
            grams_per_serving: item.grams_per_serving || 100,
            kcal_per_100g: item.kcal_per_100g || 0,
            micros: item.micros || {},
          }));
          
          console.log(`OpenAI 识别到 ${convertedFoods.length} 种食物，总计 ${result.totals?.kcal || 0} 卡路里`);
          return convertedFoods;
        }
        
        // 如果格式不匹配，返回空数组
        console.log('OpenAI 返回格式不匹配，返回空数组');
        return [];
      } catch (parseError) {
        console.error('解析OpenAI响应失败:', parseError);
        console.error('原始内容:', content);
        console.error('清理后内容:', cleanContent);
        // 如果解析失败，返回空数组
        return [];
      }
    } catch (error) {
      console.error('OpenAI 图片分析失败:', error);
      throw new Error('图片分析失败，请重试');
    }
  }
}