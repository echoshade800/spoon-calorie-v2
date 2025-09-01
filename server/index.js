import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Configure OpenAI
const openai = new OpenAI({
  apiKey: '15bc0de172ab4260beb8db19f63f648a',
  baseURL: 'https://chatgpt-api-001.openai.azure.com/openai/deployments/gpt-4o',
  defaultQuery: { 'api-version': '2024-08-01-preview' },
  defaultHeaders: { 'api-key': '15bc0de172ab4260beb8db19f63f648a' }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Food detection endpoint
app.post('/api/detect-food', upload.single('image'), async (req, res) => {
  try {
    console.log('Received food detection request');
    
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No image file provided',
        details: 'Please upload an image file'
      });
    }

    console.log('Processing image:', req.file.filename);
    
    // Read the uploaded image
    const imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = req.file.mimetype;

    console.log('Image converted to base64, calling OpenAI...');

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this food image and identify all visible food items. For each item, provide:
1. Food name (be specific, e.g., "Grilled chicken breast" not just "chicken")
2. Estimated portion size in common units (e.g., "1 medium piece", "1 cup", "100g")
3. Estimated calories for that portion
4. Estimated macros (carbs, protein, fat in grams)
5. Confidence level (0.0 to 1.0)

Return the response as a JSON array with this exact structure:
[
  {
    "name": "Food name",
    "portion": "1 medium piece (150g)",
    "calories": 165,
    "carbs": 0,
    "protein": 31,
    "fat": 4,
    "confidence": 0.85
  }
]

Be conservative with portion estimates. If you can't clearly identify a food item, don't include it. Focus on accuracy over completeness.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    });

    console.log('OpenAI response received');

    // Parse the response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    console.log('Raw OpenAI response:', content);

    // Extract JSON from the response
    let detectedFoods;
    try {
      // Try to parse as direct JSON
      detectedFoods = JSON.parse(content);
    } catch (parseError) {
      // If direct parsing fails, try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        detectedFoods = JSON.parse(jsonMatch[1]);
      } else {
        // Try to find JSON array in the text
        const arrayMatch = content.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          detectedFoods = JSON.parse(arrayMatch[0]);
        } else {
          throw new Error('Could not parse JSON from OpenAI response');
        }
      }
    }

    console.log('Parsed detected foods:', detectedFoods);

    // Validate and format the response
    if (!Array.isArray(detectedFoods)) {
      throw new Error('Response is not an array');
    }

    // Transform to match app's expected format
    const formattedFoods = detectedFoods.map((food, index) => ({
      id: `vision_${Date.now()}_${index}`,
      name: food.name || 'Unknown Food',
      confidence: food.confidence || 0.5,
      calories: food.calories || 0,
      servingText: food.portion || '1 serving',
      units: [
        { label: food.portion || '1 serving', grams: extractGramsFromPortion(food.portion) },
        { label: '100 g', grams: 100 },
        { label: '1 g', grams: 1 },
      ],
      macros: {
        carbs: food.carbs || 0,
        protein: food.protein || 0,
        fat: food.fat || 0,
      },
      selectedUnit: { 
        label: food.portion || '1 serving', 
        grams: extractGramsFromPortion(food.portion) 
      },
      servings: 1,
      source: 'vision',
    }));

    console.log('Formatted foods for app:', formattedFoods);

    // Clean up uploaded file
    fs.unlinkSync(imagePath);

    res.json({
      success: true,
      foods: formattedFoods,
      totalItems: formattedFoods.length,
      processingTime: Date.now() - req.startTime
    });

  } catch (error) {
    console.error('Food detection error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: 'Food detection failed',
      details: error.message,
      success: false
    });
  }
});

// Middleware to track request start time
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// Helper function to extract grams from portion text
function extractGramsFromPortion(portion) {
  if (!portion) return 100;
  
  // Look for explicit gram mentions
  const gramMatch = portion.match(/(\d+(?:\.\d+)?)\s*g/i);
  if (gramMatch) {
    return parseFloat(gramMatch[1]);
  }
  
  // Common portion conversions
  const conversions = {
    'cup': 240,
    'tbsp': 15,
    'tsp': 5,
    'oz': 28.35,
    'slice': 25,
    'piece': 100,
    'medium': 150,
    'large': 200,
    'small': 75,
  };
  
  for (const [unit, grams] of Object.entries(conversions)) {
    if (portion.toLowerCase().includes(unit)) {
      // Try to extract number before the unit
      const numberMatch = portion.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${unit}`, 'i'));
      if (numberMatch) {
        return parseFloat(numberMatch[1]) * grams;
      }
      return grams;
    }
  }
  
  // Default fallback
  return 100;
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    details: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Food detection server running on port ${PORT}`);
  console.log(`📸 Ready to analyze food images with OpenAI Vision`);
});