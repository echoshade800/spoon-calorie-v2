/**
 * Mock data for foods, diary entries, and sample calculations
 */

export const mockFoods = [
  {
    id: '1',
    name: 'Banana',
    brand: null,
    kcal_per_100g: 89,
    carbs: 23,
    protein: 1.1,
    fat: 0.3,
    default_unit: 'piece',
    is_builtin: true,
  },
  {
    id: '2',
    name: 'Chicken Breast',
    brand: null,
    kcal_per_100g: 165,
    carbs: 0,
    protein: 31,
    fat: 3.6,
    default_unit: 'g',
    is_builtin: true,
  },
  {
    id: '3',
    name: 'Greek Yogurt',
    brand: 'Fage',
    kcal_per_100g: 97,
    carbs: 4,
    protein: 10,
    fat: 5,
    default_unit: 'cup',
    is_builtin: true,
  },
  {
    id: '4',
    name: 'Almonds',
    brand: null,
    kcal_per_100g: 579,
    carbs: 22,
    protein: 21,
    fat: 50,
    default_unit: 'oz',
    is_builtin: true,
  },
  {
    id: '5',
    name: 'Brown Rice',
    brand: null,
    kcal_per_100g: 111,
    carbs: 23,
    protein: 2.6,
    fat: 0.9,
    default_unit: 'cup',
    is_builtin: true,
  },
  {
    id: '6',
    name: 'Avocado',
    brand: null,
    kcal_per_100g: 160,
    carbs: 9,
    protein: 2,
    fat: 15,
    default_unit: 'piece',
    is_builtin: true,
  },
  {
    id: '7',
    name: 'Oatmeal',
    brand: 'Quaker',
    kcal_per_100g: 389,
    carbs: 66,
    protein: 17,
    fat: 7,
    default_unit: 'cup',
    is_builtin: true,
  },
  {
    id: '8',
    name: 'Salmon',
    brand: null,
    kcal_per_100g: 208,
    carbs: 0,
    protein: 20,
    fat: 13,
    default_unit: 'g',
    is_builtin: true,
  },
];

export const mockDiaryEntries = [
  {
    id: '1',
    date: new Date().toISOString().split('T')[0],
    meal_type: 'breakfast',
    food_id: '7',
    custom_name: null,
    amount: 1,
    unit: 'cup',
    kcal: 389,
    carbs: 66,
    protein: 17,
    fat: 7,
    source: 'library',
  },
  {
    id: '2',
    date: new Date().toISOString().split('T')[0],
    meal_type: 'lunch',
    food_id: '2',
    custom_name: null,
    amount: 150,
    unit: 'g',
    kcal: 248,
    carbs: 0,
    protein: 47,
    fat: 5,
    source: 'library',
  },
];

// BMR/TDEE calculation utilities
export const calculateBMR = (profile) => {
  const { sex, age, height_cm, weight_kg } = profile;
  
  if (sex === 'male') {
    return 88.362 + (13.397 * weight_kg) + (4.799 * height_cm) - (5.677 * age);
  } else {
    return 447.593 + (9.247 * weight_kg) + (3.098 * height_cm) - (4.330 * age);
  }
};

export const calculateTDEE = (bmr, activityLevel) => {
  const multipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extra_active: 1.9,
  };
  
  return bmr * multipliers[activityLevel];
};

export const calculateDailyGoal = (tdee, goalType, rateKcalPerDay) => {
  switch (goalType) {
    case 'lose':
      return Math.round((tdee - rateKcalPerDay) / 10) * 10;
    case 'gain':
      return Math.round((tdee + rateKcalPerDay) / 10) * 10;
    case 'maintain':
    default:
      return Math.round(tdee / 10) * 10;
  }
};