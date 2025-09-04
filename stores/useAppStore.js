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
      
      // 加载用户的餐食数据
      await get().loadUserMeals();
      
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
      
      // 先尝试从服务器获取完整的用户数据
      try {
        console.log('尝试从服务器获取用户数据:', localUserData.uid);
        const serverResponse = await API.getUser(localUserData.uid);
        
        if (serverResponse.success && serverResponse.user) {
          console.log('从服务器获取到完整用户数据');
          const serverUser = serverResponse.user;
          
          // 将服务器数据保存到本地
          await StorageUtils.setUserData(serverUser);
          
          // 更新应用状态
          set({ profile: serverUser, isOnboarded: true });
          return;
        }
      } catch (serverError) {
        console.log('服务器查询失败，使用本地数据:', serverError.message);
      }
      
      // 如果服务器没有数据，检查本地数据是否完整
      const isCompleteProfile = localUserData.calorie_goal && localUserData.bmr && localUserData.tdee;
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
      // 使用当前 store 中的 profile 数据，而不是从存储读取
      const { profile } = get();
      
      if (!profile) {
        console.log('本地无用户数据');
        return;
      }
      
      // 确保有 UID
      let finalUid = profile.uid;
      if (!finalUid) {
        finalUid = StorageUtils.generateUID();
        const updatedProfile = { ...profile, uid: finalUid };
        set({ profile: updatedProfile });
        await StorageUtils.setUserData(updatedProfile);
      }
      
      // 检查是否为完整的用户数据（已完成 onboarding）
      const isCompleteProfile = profile.calorie_goal && profile.bmr && profile.tdee;

      if (!isCompleteProfile) {
        console.log('用户资料不完整，跳过服务器同步');
        // 仍然更新本地状态
        set({ isOnboarded: !!profile.calorie_goal });
        return;
      }
      
      // 使用包含正确 UID 的 profile 数据进行同步
      const profileToSync = { ...profile, uid: finalUid };
      
      // 同步到服务器
      const response = await API.syncUser(profileToSync);
      
      if (response.success) {
        console.log('用户数据同步成功');
        // 更新本地存储
        await StorageUtils.setUserData(response.user);
        // 更新应用状态
        set({ profile: response.user, isOnboarded: true });
      } else {
        console.log('服务器同步跳过:', response.message);
        // 使用本地数据
        set({ isOnboarded: true });
      }
    } catch (error) {
      console.error('用户数据同步错误:', error);
      // 同步失败不影响应用使用，继续使用本地数据
      const { profile } = get();
      if (profile) {
        set({ isOnboarded: !!profile.calorie_goal });
      }
    }
  },
  
  // 加载用户餐食数据
  loadUserMeals: async () => {
    try {
      // 先尝试从本地存储获取 UID
      const localUserData = await StorageUtils.getUserData();
      const { profile } = get();
      
      // 优先使用本地存储的 UID，其次使用 profile 的 UID
      const userUid = localUserData?.uid || profile?.uid;
      
      if (!userUid) {
        console.log('用户 UID 不存在，跳过加载餐食数据');
        return;
      }
      
      console.log('开始加载用户餐食数据:', userUid);
      const response = await API.getUserMeals(userUid);
      
      if (response.success && response.meals) {
        console.log(`成功加载 ${response.meals.length} 个餐食`);
        set({ myMeals: response.meals });
      } else {
        console.log('服务器返回空餐食数据');
        set({ myMeals: [] });
      }
    } catch (error) {
      console.error('加载用户餐食数据失败:', error);
      // 加载失败不影响应用使用，保持空数组
      set({ myMeals: [] });
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

  addMyMeal: async (meal) => {
    try {
      // 先尝试从本地存储获取 UID
      const localUserData = await StorageUtils.getUserData();
      const { profile } = get();
      
      // 优先使用本地存储的 UID，其次使用 profile 的 UID
      const userUid = localUserData?.uid || profile?.uid;
      
      if (!userUid) {
        throw new Error('用户 UID 不存在，请重新登录');
      }
      
      // 保存到服务器
      const response = await API.createMeal(userUid, meal);
      
      if (response.success) {
        // 更新本地状态
        set((state) => ({
          myMeals: [...state.myMeals, response.meal]
        }));
        console.log('餐食保存成功');
        
        // 重新加载餐食数据以确保同步
        await get().loadUserMeals();
      }
    } catch (error) {
      console.error('保存餐食失败:', error);
      // 即使服务器保存失败，也保存到本地状态
      set((state) => ({
        myMeals: [...state.myMeals, meal]
      }));
      throw error;
    }
  },
  
  deleteMyMeal: (mealId) => set((state) => ({
    myMeals: state.myMeals.filter(meal => meal.id !== mealId)
  })),

  deleteMyMeal: async (mealId) => {
    try {
      // 先尝试从本地存储获取 UID
      const localUserData = await StorageUtils.getUserData();
      const { profile } = get();
      
      // 优先使用本地存储的 UID，其次使用 profile 的 UID
      const userUid = localUserData?.uid || profile?.uid;
      
      if (!userUid) {
        throw new Error('用户 UID 不存在，请重新登录');
      }
      
      // 从服务器删除
      await API.deleteMeal(userUid, mealId);
      
      // 更新本地状态
      set((state) => ({
        myMeals: state.myMeals.filter(meal => meal.id !== mealId)
      }));
      
      console.log('餐食删除成功');
      
      // 重新加载餐食数据以确保同步
      await get().loadUserMeals();
    } catch (error) {
      console.error('删除餐食失败:', error);
      // 即使服务器删除失败，也从本地状态删除
      set((state) => ({
        myMeals: state.myMeals.filter(meal => meal.id !== mealId)
      }));
      throw error;
    }
  },
  
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