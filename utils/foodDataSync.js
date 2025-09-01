/**
 * Food Data Synchronization utilities
 * Handles syncing with Open Food Facts and USDA FoodData Central APIs
 */

/**
 * Open Food Facts API integration
 */
export const searchOpenFoodFacts = async (query, limit = 20) => {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}&fields=code,product_name,brands,nutriments,serving_size`
    );
    
    const data = await response.json();
    
    if (!data.products) {
      return [];
    }
    
    return data.products
      .filter(product => 
        product.nutriments && 
        product.nutriments['energy-kcal_100g'] &&
        product.product_name
      )
      .map(product => ({
        id: `off_${product.code}`,
        name: product.product_name,
        brand: product.brands ? product.brands.split(',')[0].trim() : null,
        kcal_per_100g: product.nutriments['energy-kcal_100g'] || 0,
        carbs_per_100g: product.nutriments['carbohydrates_100g'] || 0,
        protein_per_100g: product.nutriments['proteins_100g'] || 0,
        fat_per_100g: product.nutriments['fat_100g'] || 0,
        fiber_per_100g: product.nutriments['fiber_100g'] || 0,
        sugar_per_100g: product.nutriments['sugars_100g'] || 0,
        sodium_per_100g: product.nutriments['sodium_100g'] || 0,
        serving_label: product.serving_size || null,
        grams_per_serving: parseServingSize(product.serving_size),
        source: 'OFF',
        barcode: product.code,
        category: 'Packaged Foods'
      }));
  } catch (error) {
    console.error('Open Food Facts API error:', error);
    return [];
  }
};

/**
 * USDA FoodData Central API integration
 */
export const searchUSDAFoodData = async (query, limit = 20) => {
  // Note: USDA API requires an API key for production use
  // For demo purposes, we'll return mock data that represents USDA structure
  
  try {
    // In production, you would use:
    // const API_KEY = 'your_usda_api_key';
    // const response = await fetch(
    //   `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=${limit}&api_key=${API_KEY}`
    // );
    
    // Mock USDA response for demonstration
    const mockUSDAFoods = [
      {
        fdcId: 170567,
        description: 'Chicken, broilers or fryers, breast, meat only, cooked, roasted',
        foodNutrients: [
          { nutrientId: 1008, value: 165 }, // Energy (kcal)
          { nutrientId: 1005, value: 31.02 }, // Protein
          { nutrientId: 1004, value: 3.57 }, // Fat
          { nutrientId: 1050, value: 0 }, // Carbs
        ]
      }
    ];
    
    return mockUSDAFoods
      .filter(food => 
        food.description.toLowerCase().includes(query.toLowerCase())
      )
      .map(food => {
        const nutrients = {};
        food.foodNutrients.forEach(nutrient => {
          switch (nutrient.nutrientId) {
            case 1008: nutrients.kcal = nutrient.value; break;
            case 1005: nutrients.protein = nutrient.value; break;
            case 1004: nutrients.fat = nutrient.value; break;
            case 1050: nutrients.carbs = nutrient.value; break;
          }
        });
        
        return {
          id: `usda_${food.fdcId}`,
          name: food.description,
          brand: null,
          kcal_per_100g: nutrients.kcal || 0,
          carbs_per_100g: nutrients.carbs || 0,
          protein_per_100g: nutrients.protein || 0,
          fat_per_100g: nutrients.fat || 0,
          source: 'USDA',
          category: 'Whole Foods'
        };
      });
  } catch (error) {
    console.error('USDA FoodData Central API error:', error);
    return [];
  }
};

/**
 * Combined search across both data sources
 */
export const searchAllDataSources = async (query, limit = 20) => {
  try {
    const [offResults, usdaResults] = await Promise.all([
      searchOpenFoodFacts(query, Math.ceil(limit / 2)),
      searchUSDAFoodData(query, Math.ceil(limit / 2))
    ]);
    
    // Combine and sort results by relevance
    const allResults = [...offResults, ...usdaResults];
    
    // Sort by name similarity to query
    allResults.sort((a, b) => {
      const aScore = calculateRelevanceScore(a.name, query);
      const bScore = calculateRelevanceScore(b.name, query);
      return bScore - aScore;
    });
    
    return allResults.slice(0, limit);
  } catch (error) {
    console.error('Combined search error:', error);
    return [];
  }
};

/**
 * Calculate relevance score for search results
 */
const calculateRelevanceScore = (name, query) => {
  const nameLower = name.toLowerCase();
  const queryLower = query.toLowerCase();
  
  if (nameLower === queryLower) return 100;
  if (nameLower.startsWith(queryLower)) return 80;
  if (nameLower.includes(queryLower)) return 60;
  
  // Word matching
  const nameWords = nameLower.split(' ');
  const queryWords = queryLower.split(' ');
  let wordMatches = 0;
  
  queryWords.forEach(queryWord => {
    if (nameWords.some(nameWord => nameWord.includes(queryWord))) {
      wordMatches++;
    }
  });
  
  return (wordMatches / queryWords.length) * 40;
};

/**
 * Parse serving size string to grams
 */
const parseServingSize = (servingSize) => {
  if (!servingSize) return null;
  
  // Common serving size conversions
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
  
  const sizeStr = servingSize.toLowerCase();
  
  // Extract number and unit
  const match = sizeStr.match(/(\d+(?:\.\d+)?)\s*(\w+)/);
  if (match) {
    const amount = parseFloat(match[1]);
    const unit = match[2];
    
    if (conversions[unit]) {
      return amount * conversions[unit];
    }
  }
  
  // Look for direct gram mentions
  const gramMatch = sizeStr.match(/(\d+(?:\.\d+)?)\s*g/);
  if (gramMatch) {
    return parseFloat(gramMatch[1]);
  }
  
  return null;
};

/**
 * Sync foods from external APIs to local database
 */
export const syncFoodsToDatabase = async (queries = ['chicken', 'banana', 'milk', 'bread', 'apple']) => {
  try {
    console.log('Starting food data sync...');
    
    for (const query of queries) {
      const foods = await searchAllDataSources(query, 10);
      
      // In a real implementation, you would insert these into SQLite
      console.log(`Found ${foods.length} foods for query: ${query}`);
    }
    
    console.log('Food data sync completed');
  } catch (error) {
    console.error('Food sync error:', error);
  }
};