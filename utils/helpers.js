/**
 * Utility functions for calculations, formatting, and validation
 */

export const formatCalories = (kcal) => {
  return Math.round(kcal).toLocaleString();
};

export const formatMacro = (macro) => {
  return Math.round(macro * 10) / 10;
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (dateString === today.toISOString().split('T')[0]) {
    return 'Today';
  } else if (dateString === yesterday.toISOString().split('T')[0]) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }
};

export const getMealDisplayName = (mealType) => {
  const names = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snacks',
  };
  return names[mealType] || 'Meal';
};

export const validateProfileData = (data) => {
  const errors = {};
  
  if (!data.age || data.age < 13 || data.age > 120) {
    errors.age = 'Age must be between 13 and 120';
  }
  
  if (!data.height_cm || data.height_cm < 100 || data.height_cm > 250) {
    errors.height_cm = 'Height must be between 100 and 250 cm';
  }
  
  if (!data.weight_kg || data.weight_kg < 30 || data.weight_kg > 300) {
    errors.weight_kg = 'Weight must be between 30 and 300 kg';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const searchFoods = (foods, query) => {
  if (!query.trim()) return foods;
  
  const lowercaseQuery = query.toLowerCase();
  return foods.filter(food => 
    food.name.toLowerCase().includes(lowercaseQuery) ||
    (food.brand && food.brand.toLowerCase().includes(lowercaseQuery))
  );
};

export const convertWeight = (amount, fromUnit, toUnit, food) => {
  // Simple unit conversion - in a real app, this would be more sophisticated
  const conversions = {
    'piece': food.kcal_per_100g, // Assume 1 piece = 100g for simplicity
    'cup': food.kcal_per_100g * 2.4, // Assume 1 cup = 240g
    'oz': food.kcal_per_100g * 0.28, // 1 oz = 28g
    'g': food.kcal_per_100g / 100,
  };
  
  return amount * (conversions[fromUnit] || 1);
};