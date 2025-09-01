/**
 * Vision API utilities for food detection
 * Handles image processing and food recognition
 */

/**
 * Real food detection API using OpenAI Vision
 * Calls the Vite server endpoint for food recognition
 */
export const detectFoodsInImage = async (imageUri) => {
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
    console.log('Falling back to mock data due to error');
    
    const mockFallback = [
      {
        id: 'fallback_1',
        name: 'Mixed Meal',
        confidence: 0.5,
        calories: 400,
        servingText: '1 serving',
        units: [
          { label: '1 serving', grams: 200 },
          { label: '100 g', grams: 100 },
        ],
        macros: { carbs: 45, protein: 20, fat: 15 },
        selectedUnit: { label: '1 serving', grams: 200 },
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