/**
 * Global app state using Zustand
 * Manages user profile, diary entries, and app settings
 */
import { create } from 'zustand';
import { searchFoods, getFoodById, addCustomFood as addCustomFoodToDB, initializeDatabase } from '@/utils/database';
import { StorageUtils } from '@/utils/StorageUtils';
import { API } from '@/utils/apiClient';

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
      
      // 初始化数据库连接
      await initializeDatabase();
      
      // 只加载本地用户数据，不同步到服务器
      await get().loadLocalUserData();
      
      set({ isDatabaseReady: true, isLoading: false });
    } catch (error) {
      console.error('应用初始化错误:', error);
      set({ error: '初始化失败', isLoading: false });
    }
  },
  
  // 加载本地用户数据（不同步服务器）
  loadLocalUserData: async () => {
    try {
      const localUserData = await StorageUtils.getUserData();
      
      if (!localUserData) {
        console.log('本地无用户数据');
        return;
      }
      
      // 如果没有 UID，生成一个
      if (!localUserData.uid) {
        localUserData.uid = StorageUtils.generateUID();
        await StorageUtils.setUserData(localUserData);
      }
      
      // 检查是否为完整的用户数据（已完成 onboarding）
      const isCompleteProfile = localUserData.sex && localUserData.age && 
                               localUserData.height_cm && localUserData.weight_kg && 
                               localUserData.activity_level && localUserData.goal_type && 
                               localUserData.calorie_goal && localUserData.bmr && 
                               localUserData.tdee;

      // 更新本地状态
      set({ profile: localUserData, isOnboarded: isCompleteProfile });
    } catch (error) {
      console.error('加载本地用户数据错误:', error);
    }
  },
  
  // 用户数据同步
  syncUserData: async () => {
    try {
      const localUserData = await StorageUtils.getUserData();
      
      if (!localUserData) {
        console.log('本地无用户数据');
        return;
      }
      
      // 如果没有 UID，生成一个
      if (!localUserData.uid) {
        localUserData.uid = StorageUtils.generateUID();
        await StorageUtils.setUserData(localUserData);
      }
      
      // 检查是否为完整的用户数据（已完成 onboarding）
      const isCompleteProfile = localUserData.sex && localUserData.age && 
                               localUserData.height_cm && localUserData.weight_kg && 
                               localUserData.activity_level && localUserData.goal_type && 
                               localUserData.calorie_goal && localUserData.bmr && 
                               localUserData.tdee;

      if (!isCompleteProfile) {
        console.log('用户资料不完整，跳过服务器同步');
        // 仍然更新本地状态
        set({ profile: localUserData, isOnboarded: !!localUserData.calorie_goal });
        return;
      }
      
      // 同步到服务器
      const response = await API.syncUser(localUserData);
      
      if (response.success) {
        console.log('用户数据同步成功');
        // 更新本地存储
        await StorageUtils.setUserData(response.user);
        // 更新应用状态
        set({ profile: response.user, isOnboarded: true });
      } else {
        console.log('服务器同步跳过:', response.message);
        // 使用本地数据
        set({ profile: localUserData, isOnboarded: true });
      }
    } catch (error) {
      console.error('用户数据同步错误:', error);
      // 同步失败不影响应用使用，继续使用本地数据
      const localUserData = await StorageUtils.getUserData();
      if (localUserData) {
        set({ profile: localUserData, isOnboarded: !!localUserData.calorie_goal });
      }
    }
  },
  
  // Food search
  searchFoodsInDatabase: async (query) => {
    try {
      set({ isSearching: true });
      const results = await searchFoods(query, 30);
      
      set({ searchResults: results, isSearching: false });
      return results;
    } catch (error) {
      console.error('搜索食物错误:', error);
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