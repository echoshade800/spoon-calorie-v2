/**
 * Vision API utilities for food detection
 * Handles image processing and food recognition using OpenAI Vision
 */

/**
 * Mock food detection for development
 * In production, this would call the server endpoint
 */
export const detectFoodsInImage = async (imageUri) => {
  try {
    console.log('Starting food detection for image:', imageUri);
    
    // For now, return mock data to avoid server dependency
    // TODO: Implement real API call when server is ready
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
    
    const mockDetectedFoods = [
      {
        id: 'vision_1',
        name: 'Grilled Chicken Breast',
        confidence: 0.85,
        calories: 165,
        servingText: '1 medium piece (150g)',
        units: [
          { label: '1 medium piece (150g)', grams: 150 },
          { label: '100 g', grams: 100 },
          { label: '1 g', grams: 1 },
        ],
        macros: {
          carbs: 0,
          protein: 31,
          fat: 4,
        },
        selectedUnit: { label: '1 medium piece (150g)', grams: 150 },
        servings: 1,
        source: 'vision',
      },
      {
        id: 'vision_2',
        name: 'Steamed Broccoli',
        confidence: 0.75,
        calories: 34,
        servingText: '1 cup (91g)',
        units: [
          { label: '1 cup (91g)', grams: 91 },
          { label: '100 g', grams: 100 },
          { label: '1 g', grams: 1 },
        ],
        macros: {
          carbs: 7,
          protein: 3,
          fat: 0.4,
        },
        selectedUnit: { label: '1 cup (91g)', grams: 91 },
        servings: 1,
        source: 'vision',
      }
    ];
    
    console.log(`Mock detection completed: ${mockDetectedFoods.length} food items`);
    return mockDetectedFoods;
    
  } catch (error) {
    console.error('Food detection error:', error);
    
    // Return empty array on error
    console.log('Detection failed, returning empty array');
    return [];
  }
};

/**
 * Real food detection API using server endpoint
 * Call this when server is running
 */
export const detectFoodsInImageWithServer = async (imageUri) => {
  try {
    console.log('Starting food detection for image:', imageUri);
    
    // Create FormData for the API call
    const formData = new FormData();
    
    // Convert image URI to blob for upload
    const response = await fetch(imageUri);
    const blob = await response.blob();
    formData.append('image', blob, 'meal.jpg');
    
    console.log('Sending image to server for analysis...');
    
    // Call the server endpoint
    const apiResponse = await fetch('http://localhost:3001/api/detect-food', {
      method: 'POST',
      body: formData,
    });
    
    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(errorData.details || 'Food detection failed');
    }
    
    const result = await apiResponse.json();
    console.log('Server response:', result);
    
    if (!result.success || !result.foods) {
      throw new Error('Invalid response from food detection service');
    }
    
    console.log(`Successfully detected ${result.foods.length} food items`);
    return result.foods;
    
  } catch (error) {
    console.error('Food detection error:', error);
    
    // Fallback to mock data if API fails
    const mockFallback = [
      {
        id: 'vision_fallback_1',
        name: 'Detected Food Item',
        confidence: 0.5,
        calories: 200,
        servingText: '1 serving (100g)',
        units: [
          { label: '1 serving (100g)', grams: 100 },
          { label: '100 g', grams: 100 },
        ],
        macros: { carbs: 20, protein: 15, fat: 8 },
        selectedUnit: { label: '1 serving (100g)', grams: 100 },
        servings: 1,
        source: 'vision_fallback',
      }
    ];
    
    return mockFallback;
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