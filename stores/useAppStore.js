/**
 * Global app state using Zustand
 * Manages user profile, diary entries, and app settings
 */
import { create } from 'zustand';
import { searchFoods, getFoodById, addCustomFood as addCustomFoodToDB, initializeDatabase } from '@/utils/database';
import { searchAllDataSources } from '@/utils/foodDataSync';

export const useAppStore = create((set, get) => ({
  // User Profile & Goals
  profile: null,
  isOnboarded: false,
  
  // Diary Entries
  diaryEntries: [],
  exerciseEntries: [],
  selectedDate: new Date().toISOString().split('T')[0],
  
  // Food Database
  foods: [],
  searchResults: [],
  isSearching: false,
  
  // My Meals and My Foods
  myMeals: [],
  myFoods: [],
  
  // UI State
  isLoading: false,
  addScreenScrollPositions: {}, // New state to store scroll positions for AddScreen tabs
  isDatabaseReady: false,
  error: null,

  // Actions
  setProfile: (profile) => set({ profile, isOnboarded: true }),
  
  updateProfile: (updates) => set((state) => ({
    profile: { ...state.profile, ...updates }
  })),
  
  // Database initialization
  initializeApp: async () => {
    try {
      set({ isLoading: true });
      await initializeDatabase();
      set({ isDatabaseReady: true, isLoading: false });
    } catch (error) {
      console.error('App initialization error:', error);
      set({ error: 'Failed to initialize database', isLoading: false });
    }
  },
  
  // Food search
  searchFoodsInDatabase: async (query) => {
    try {
      set({ isSearching: true });
      
      // First try local database
      let results = await searchFoods(query, 30);
      
      // If local results are limited and we have a query, also search external APIs
      if (query && query.trim().length > 2 && results.length < 10) {
        const externalResults = await searchAllDataSources(query, 20);
        
        // Combine results, prioritizing local database
        const combinedResults = [
          ...results,
          ...externalResults.filter(external => 
            !results.some(local => local.name.toLowerCase() === external.name.toLowerCase())
          )
        ].slice(0, 50);
        
        results = combinedResults;
      }
      
      set({ searchResults: results, isSearching: false });
      return results;
    } catch (error) {
      console.error('Search foods error:', error);
      set({ searchResults: [], isSearching: false });
      return [];
    }
  },
  
  // Get food details
  getFoodDetails: async (id) => {
    try {
      const food = await getFoodById(id);
      return food;
    } catch (error) {
      console.error('Get food details error:', error);
      return null;
    }
  },
  
  setSelectedDate: (date) => set({ selectedDate: date }),
  
  addDiaryEntry: (entry) => set((state) => ({
    diaryEntries: [...state.diaryEntries, { ...entry, id: Date.now().toString() }]
  })),
  
  updateDiaryEntry: (id, updates) => set((state) => ({
    diaryEntries: state.diaryEntries.map(entry => 
      entry.id === id ? { ...entry, ...updates } : entry
    )
  })),
  
  deleteDiaryEntry: (id) => set((state) => ({
    diaryEntries: state.diaryEntries.filter(entry => entry.id !== id)
  })),
  
  addExerciseEntry: (entry) => set((state) => ({
    exerciseEntries: [...state.exerciseEntries, entry]
  })),
  
  updateExerciseEntry: (id, updates) => set((state) => ({
    exerciseEntries: state.exerciseEntries.map(entry => 
      entry.id === id ? { ...entry, ...updates } : entry
    )
  })),
  
  deleteExerciseEntry: (id) => set((state) => ({
    exerciseEntries: state.exerciseEntries.filter(entry => entry.id !== id)
  })),
  
  addCustomFood: async (food) => {
    try {
      const newFood = await addCustomFoodToDB(food);
      set((state) => ({
        myFoods: [...state.myFoods, newFood]
      }));
      return newFood;
    } catch (error) {
      console.error('Add custom food error:', error);
      throw error;
    }
  },
  
  addMyMeal: (meal) => set((state) => ({
    myMeals: [...state.myMeals, meal]
  })),
  
  deleteMyMeal: (mealId) => set((state) => ({
    myMeals: state.myMeals.filter(meal => meal.id !== mealId)
  })),
  
  addMyFood: async (food) => {
    try {
      console.log('Adding custom food:', food);
      
      // Ensure database is ready
      const state = get();
      if (!state.isDatabaseReady) {
        console.log('Database not ready, initializing...');
        await get().initializeApp();
      }
      
      const newFood = await addCustomFoodToDB(food);
      console.log('Food saved to database:', newFood);
      
      set((state) => ({
        myFoods: [...state.myFoods, newFood]
      }));
      
      console.log('Food added to myFoods state');
      console.log('Current myFoods count:', get().myFoods.length);
      return newFood;
    } catch (error) {
      console.error('Add my food error - Full details:', {
        error: error.message,
        stack: error.stack,
        foodData: food,
        isDatabaseReady: get().isDatabaseReady
      });
      throw error;
    }
  },
  
  deleteMyFood: (foodId) => set((state) => ({
    myFoods: state.myFoods.filter(food => food.id !== foodId)
  })),
  
  setAddScreenScrollPosition: (tabId, position) => set((state) => ({
    addScreenScrollPositions: { ...state.addScreenScrollPositions, [tabId]: position }
  })),


  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  // Computed values
  getTodaysEntries: () => {
    const { diaryEntries, selectedDate } = get();
    return diaryEntries.filter(entry => entry.date === selectedDate);
  },
  
  getTodaysExercises: () => {
    const { exerciseEntries, selectedDate } = get();
    return exerciseEntries.filter(entry => entry.date === selectedDate);
  },
  
  getTodaysStats: () => {
    const entries = get().getTodaysEntries();
    return entries.reduce((stats, entry) => ({
      kcal: stats.kcal + entry.kcal,
      carbs: stats.carbs + entry.carbs,
      protein: stats.protein + entry.protein,
      fat: stats.fat + entry.fat,
    }), { kcal: 0, carbs: 0, protein: 0, fat: 0 });
  },
}));