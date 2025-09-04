/**
 * Vision API utilities for food detection
 * Handles image processing and food recognition
 */

/**
 * Mock food detection API - simulates AI food recognition
 * In production, this would call a real computer vision service
 */
export const detectFoodsInImage = async (imageUri) => {
  try {
    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    // Mock detection results based on common meal scenarios
    const mockScenarios = [
      // Healthy meal
      [
        {
          id: 'vision_tmp_1',
          name: 'Grilled Chicken Breast',
          confidence: 0.92,
          calories: 231,
          servingText: '1 piece (150g)',
          units: [
            { label: '1 piece (150g)', grams: 150 },
            { label: '100 g', grams: 100 },
            { label: '1 oz', grams: 28.35 },
          ],
          macros: { carbs: 0, protein: 43, fat: 5 },
        },
        {
          id: 'vision_tmp_2',
          name: 'Steamed Broccoli',
          confidence: 0.78,
          calories: 34,
          servingText: '1 cup (91g)',
          units: [
            { label: '1 cup (91g)', grams: 91 },
            { label: '100 g', grams: 100 },
            { label: '1 spear', grams: 31 },
          ],
          macros: { carbs: 7, protein: 3, fat: 0 },
        },
        {
          id: 'vision_tmp_3',
          name: 'Brown Rice',
          confidence: 0.65,
          calories: 216,
          servingText: '1 cup (195g)',
          units: [
            { label: '1 cup (195g)', grams: 195 },
            { label: '100 g', grams: 100 },
            { label: '1/2 cup', grams: 97.5 },
          ],
          macros: { carbs: 45, protein: 5, fat: 2 },
        },
      ],
      
      // Breakfast scenario
      [
        {
          id: 'vision_tmp_4',
          name: 'Scrambled Eggs',
          confidence: 0.88,
          calories: 155,
          servingText: '2 large eggs',
          units: [
            { label: '2 large eggs', grams: 100 },
            { label: '1 large egg', grams: 50 },
            { label: '100 g', grams: 100 },
          ],
          macros: { carbs: 1, protein: 13, fat: 11 },
        },
        {
          id: 'vision_tmp_5',
          name: 'Whole Wheat Toast',
          confidence: 0.82,
          calories: 69,
          servingText: '1 slice',
          units: [
            { label: '1 slice', grams: 28 },
            { label: '100 g', grams: 100 },
          ],
          macros: { carbs: 12, protein: 4, fat: 1 },
        },
        {
          id: 'vision_tmp_6',
          name: 'Butter',
          confidence: 0.45,
          calories: 102,
          servingText: '1 tbsp',
          units: [
            { label: '1 tbsp', grams: 14.2 },
            { label: '1 tsp', grams: 4.7 },
            { label: '100 g', grams: 100 },
          ],
          macros: { carbs: 0, protein: 0, fat: 12 },
        },
      ],
      
      // Fast food scenario
      [
        {
          id: 'vision_tmp_7',
          name: 'Hamburger',
          confidence: 0.94,
          calories: 540,
          servingText: '1 burger',
          units: [
            { label: '1 burger', grams: 150 },
            { label: '100 g', grams: 100 },
          ],
          macros: { carbs: 40, protein: 25, fat: 31 },
        },
        {
          id: 'vision_tmp_8',
          name: 'French Fries',
          confidence: 0.89,
          calories: 365,
          servingText: '1 medium serving',
          units: [
            { label: '1 medium serving', grams: 115 },
            { label: '1 small serving', grams: 75 },
            { label: '100 g', grams: 100 },
          ],
          macros: { carbs: 48, protein: 4, fat: 17 },
        },
      ],
    ];
    
    // Randomly select a scenario
    const selectedScenario = mockScenarios[Math.floor(Math.random() * mockScenarios.length)];
    
    // Add default values to each item
    return selectedScenario.map(item => ({
      ...item,
      selectedUnit: item.units[0], // Default to first unit
      servings: 1,
      source: 'vision',
    }));
    
  } catch (error) {
    console.error('Food detection error:', error);
    throw new Error('Failed to detect foods in image');
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