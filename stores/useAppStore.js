/**
 * Global app state using Zustand with MySQL backend
 * Manages user profile, diary entries, and app settings
 */
import { create } from 'zustand';
import { 
  searchFoods, 
  getFoodById, 
  addCustomFood as addCustomFoodToDB, 
  initializeDatabase,
  saveUserProfile,
  getUserProfile,
  saveDiaryEntry,
  getDiaryEntries,
  updateDiaryEntry as updateDiaryEntryInDB,
  deleteDiaryEntry as deleteDiaryEntryFromDB,
  saveExerciseEntry,
  getExerciseEntries,
  deleteExerciseEntry as deleteExerciseEntryFromDB,
  saveMyMeal,
  getMyMeals,
  deleteMyMeal as deleteMyMealFromDB
} from '@/utils/database';
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
  addScreenScrollPositions: {},
  isDatabaseReady: false,
  error: null,

  // Actions
  setProfile: async (profile) => {
    try {
      await saveUserProfile(profile);
      set({ profile, isOnboarded: true });
    } catch (error) {
      console.error('Set profile error:', error);
      throw error;
    }
  },
  
  updateProfile: async (updates) => {
    try {
      const currentProfile = get().profile;
      const updatedProfile = { ...currentProfile, ...updates };
      await saveUserProfile(updatedProfile);
      set({ profile: updatedProfile });
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },
  
  // Database initialization
  initializeApp: async () => {
    try {
      set({ isLoading: true });
      await initializeDatabase();
      
      // Load user profile
      const profile = await getUserProfile();
      if (profile) {
        set({ profile, isOnboarded: true });
      }
      
      // Load diary entries for current date
      const selectedDate = get().selectedDate;
      const entries = await getDiaryEntries(selectedDate);
      const exercises = await getExerciseEntries(selectedDate);
      const meals = await getMyMeals();
      
      set({ 
        diaryEntries: entries,
        exerciseEntries: exercises,
        myMeals: meals,
        isDatabaseReady: true, 
        isLoading: false 
      });
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
  
  setSelectedDate: async (date) => {
    try {
      set({ selectedDate: date });
      
      // Load entries for new date
      const entries = await getDiaryEntries(date);
      const exercises = await getExerciseEntries(date);
      
      set({ 
        diaryEntries: entries,
        exerciseEntries: exercises
      });
    } catch (error) {
      console.error('Set selected date error:', error);
    }
  },
  
  addDiaryEntry: async (entry) => {
    try {
      const savedEntry = await saveDiaryEntry(entry);
      set((state) => ({
        diaryEntries: [...state.diaryEntries, savedEntry]
      }));
      return savedEntry;
    } catch (error) {
      console.error('Add diary entry error:', error);
      throw error;
    }
  },
  
  updateDiaryEntry: async (id, updates) => {
    try {
      await updateDiaryEntryInDB(id, updates);
      set((state) => ({
        diaryEntries: state.diaryEntries.map(entry => 
          entry.id === id ? { ...entry, ...updates } : entry
        )
      }));
    } catch (error) {
      console.error('Update diary entry error:', error);
      throw error;
    }
  },
  
  deleteDiaryEntry: async (id) => {
    try {
      await deleteDiaryEntryFromDB(id);
      set((state) => ({
        diaryEntries: state.diaryEntries.filter(entry => entry.id !== id)
      }));
    } catch (error) {
      console.error('Delete diary entry error:', error);
      throw error;
    }
  },
  
  addExerciseEntry: async (entry) => {
    try {
      const savedEntry = await saveExerciseEntry(entry);
      set((state) => ({
        exerciseEntries: [...state.exerciseEntries, savedEntry]
      }));
      return savedEntry;
    } catch (error) {
      console.error('Add exercise entry error:', error);
      throw error;
    }
  },
  
  updateExerciseEntry: async (id, updates) => {
    try {
      // TODO: Implement updateExerciseEntry in database.js
      set((state) => ({
        exerciseEntries: state.exerciseEntries.map(entry => 
          entry.id === id ? { ...entry, ...updates } : entry
        )
      }));
    } catch (error) {
      console.error('Update exercise entry error:', error);
      throw error;
    }
  },
  
  deleteExerciseEntry: async (id) => {
    try {
      await deleteExerciseEntryFromDB(id);
      set((state) => ({
        exerciseEntries: state.exerciseEntries.filter(entry => entry.id !== id)
      }));
    } catch (error) {
      console.error('Delete exercise entry error:', error);
      throw error;
    }
  },
  
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
  
  addMyMeal: async (meal) => {
    try {
      const savedMeal = await saveMyMeal(meal);
      set((state) => ({
        myMeals: [...state.myMeals, savedMeal]
      }));
      return savedMeal;
    } catch (error) {
      console.error('Add my meal error:', error);
      throw error;
    }
  },
  
  deleteMyMeal: async (mealId) => {
    try {
      await deleteMyMealFromDB(mealId);
      set((state) => ({
        myMeals: state.myMeals.filter(meal => meal.id !== mealId)
      }));
    } catch (error) {
      console.error('Delete my meal error:', error);
      throw error;
    }
  },
  
  addMyFood: async (food) => {
    try {
      const newFood = await addCustomFoodToDB(food);
      set((state) => ({
        myFoods: [...state.myFoods, newFood]
      }));
      return newFood;
    } catch (error) {
      console.error('Add my food error:', error);
      throw error;
    }
  },
  
  deleteMyFood: async (foodId) => {
    try {
      // TODO: Implement deleteCustomFood in database.js
      set((state) => ({
        myFoods: state.myFoods.filter(food => food.id !== foodId)
      }));
    } catch (error) {
      console.error('Delete my food error:', error);
      throw error;
    }
  },
  
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