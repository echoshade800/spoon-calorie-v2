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
                  text: `请分析这张食物图片，识别出所有食物并估算营养信息。请以JSON格式返回，包含以下字段：
                  [
                    {
                      "name": "食物名称",
                      "confidence": 0.95,
                      "kcal_per_100g": 每100克卡路里,
                      "servingText": "份量描述",
                      "units": [
                        {"label": "1份", "grams": 100},
                        {"label": "100g", "grams": 100}
                      ],
                      "macros": {
                        "carbs": 碳水化合物克数,
                        "protein": 蛋白质克数,
                        "fat": 脂肪克数
                      },
                      "serving_label": "默认份量标签",
                      "grams_per_serving": 默认份量克数
                    }
                  ]
                  
                  请确保：
                  1. 只识别明确可见的食物
                  2. 提供合理的营养估算（每100克为基准）
                  3. 置信度反映识别的确定性
                  4. 返回纯JSON格式，不要其他文字
                  5. 如果无法识别任何食物，返回空数组 []`
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
        
        const foods = JSON.parse(cleanContent);
        return Array.isArray(foods) ? foods : [];
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