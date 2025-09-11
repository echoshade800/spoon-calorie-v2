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
      
      // 只加载本地用户数据，完全跳过网络和数据库调用
      await get().loadLocalUserData();
      
      console.log('应用初始化完成，所有数据将按需加载');
      
      set({ isDatabaseReady: true, isLoading: false });
    } catch (error) {
      console.warn('应用初始化警告:', error.message);
      set({ isDatabaseReady: true, isLoading: false });
    }
  },
  
  // 加载本地用户数据（不同步服务器）
  loadLocalUserData: async () => {
    try {
      const localUserData = await StorageUtils.getUserData();
      
      if (!localUserData) {
        console.log('本地无用户数据');
        set({ isOnboarded: false });
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
          
          // 同时获取新手引导数据
          try {
            const onboardingResponse = await API.getUserOnboardingData(localUserData.uid);
            if (onboardingResponse.success && onboardingResponse.onboardingData) {
              console.log('获取到新手引导数据:', onboardingResponse.onboardingData);
              // 合并新手引导数据到用户数据
              Object.assign(serverUser, onboardingResponse.onboardingData);
            }
          } catch (onboardingError) {
            console.log('获取新手引导数据失败:', onboardingError.message);
          }
          
          // 保存到本地存储
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

      // 更新本地状态
      set({ profile: localUserData, isOnboarded: isCompleteProfile });
      console.log('本地用户数据加载完成，isOnboarded:', isCompleteProfile);
    } catch (error) {
      console.error('加载本地用户数据错误:', error);
      set({ isOnboarded: false });
    }
  },
  
  // 用户数据同步
  syncUserData: async () => {
    try {
      // 先尝试从本地存储获取 UID
      const localUserData = await StorageUtils.getUserData();
      const { profile } = get();
      
      // 优先使用本地存储的 UID，其次使用 profile 的 UID
      const userUid = localUserData?.uid || profile?.uid;
      
      if (!userUid || !profile) {
        console.log('用户 UID 或 profile 不存在，跳过同步');
        return;
      }
      
      // 确保有 UID
      let finalUid = userUid;
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
      
      console.log('准备同步的用户数据:', {
        uid: profileToSync.uid,
        hasGoals: !!profileToSync.goals,
        hasBarriers: !!profileToSync.barriers,
        hasHealthyHabits: !!profileToSync.healthyHabits,
        mealPlanning: profileToSync.mealPlanning,
        weeklyGoal: profileToSync.weeklyGoal
      });
      
      // 同步到服务器
      const response = await API.syncUser(profileToSync);
      
      if (response.success) {
        console.log('用户数据同步成功');
        // 保存到本地存储
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
  
  // 加载今天的运动条目
  loadTodaysExerciseEntries: async () => {
    try {
      const localUserData = await StorageUtils.getUserData();
      const { profile, selectedDate } = get();
      
      const userUid = localUserData?.uid || profile?.uid;
      
      if (!userUid) {
        console.log('用户 UID 不存在，跳过加载运动条目');
        return;
      }
      
      console.log('开始加载今天的运动条目:', userUid, selectedDate);
      const response = await API.getUserExerciseEntries(userUid, selectedDate);
      
      if (response.success && response.entries) {
        console.log(`成功加载 ${response.entries.length} 个运动条目`);
        // 转换数据格式以匹配前端期望的格式
        const formattedEntries = response.entries.map(entry => ({
          ...entry,
          // 确保数值类型正确
          calories: parseFloat(entry.calories) || 0,
          durationMin: parseInt(entry.duration_min) || 0,
          distance: entry.distance ? parseFloat(entry.distance) : null,
          sets: entry.sets ? parseInt(entry.sets) : null,
          reps: entry.reps ? parseInt(entry.reps) : null,
          weight: entry.weight ? parseFloat(entry.weight) : null,
          met: entry.met_value ? parseFloat(entry.met_value) : null,
          // 保持数据库原始日期格式（已经是 YYYY-MM-DD 格式）
          date: entry.date
        }));
        
        set({ exerciseEntries: formattedEntries });
      } else {
        console.log('服务器返回空运动条目');
        set({ exerciseEntries: [] });
      }
    } catch (error) {
      console.error('加载运动条目失败:', error);
      // 加载失败不影响应用使用，保持空数组
      set({ exerciseEntries: [] });
    }
  },
  
  // 加载今天的日记条目
  loadTodaysDiaryEntries: async () => {
    try {
      const localUserData = await StorageUtils.getUserData();
      const { profile, selectedDate } = get();
      
      const userUid = localUserData?.uid || profile?.uid;
      
      if (!userUid) {
        console.log('用户 UID 不存在，跳过加载日记条目');
        return;
      }
      
      console.log('开始加载今天的日记条目:', userUid, selectedDate);
      const response = await API.getUserDiaryEntries(userUid, selectedDate);
      
      if (response.success && response.entries) {
        console.log(`成功加载 ${response.entries.length} 个日记条目`);
        // 转换数据格式以匹配前端期望的格式
        const formattedEntries = response.entries.map(entry => ({
          ...entry,
          // 确保数值类型正确
          kcal: parseFloat(entry.kcal) || 0,
          carbs: parseFloat(entry.carbs) || 0,
          protein: parseFloat(entry.protein) || 0,
          fat: parseFloat(entry.fat) || 0,
          amount: parseFloat(entry.amount) || 0,
          // 保持数据库原始日期格式（已经是 YYYY-MM-DD 格式）
          date: entry.date
        }));
        
        set({ diaryEntries: formattedEntries });
      } else {
        console.log('服务器返回空日记条目');
        set({ diaryEntries: [] });
      }
    } catch (error) {
      console.error('加载日记条目失败:', error);
      // 加载失败不影响应用使用，保持空数组
      set({ diaryEntries: [] });
    }
  },
  
  // Food search
  searchFoodsInDatabase: async (query) => {
    try {
      set({ isSearching: true });
      
      // 尝试搜索，失败时返回空结果
      let results = [];
      try {
        results = await searchFoods(query, 30);
      } catch (searchError) {
        console.warn('搜索食物失败，返回空结果:', searchError);
        results = [];
      }
      
      set({ searchResults: results, isSearching: false });
      return results;
    } catch (error) {
      console.warn('搜索食物错误:', error);
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
  
  addDiaryEntry: async (entry) => {
    try {
      const localUserData = await StorageUtils.getUserData();
      const { profile } = get();
      
      const userUid = localUserData?.uid || profile?.uid;
      
      if (!userUid) {
        throw new Error('用户 UID 不存在，请重新登录');
      }
      
      // 添加用户 UID 到条目数据
      const entryWithUid = {
        ...entry,
        id: entry.id || `entry_${Date.now()}`,
        user_uid: userUid,
      };
      
      // 保存到服务器
      const response = await API.createDiaryEntry(entryWithUid);
      
      if (response.success) {
        // 格式化响应数据
        const formattedEntry = {
          ...response.entry,
          kcal: parseFloat(response.entry.kcal) || 0,
          carbs: parseFloat(response.entry.carbs) || 0,
          protein: parseFloat(response.entry.protein) || 0,
          fat: parseFloat(response.entry.fat) || 0,
          amount: parseFloat(response.entry.amount) || 0,
          date: response.entry.date instanceof Date ? 
                response.entry.date.toISOString().split('T')[0] : 
                typeof response.entry.date === 'string' ? 
                response.entry.date.split('T')[0] : response.entry.date
        };
        
        // 更新本地状态
        set((state) => ({
          diaryEntries: [...state.diaryEntries, formattedEntry]
        }));
        console.log('日记条目保存成功');
      }
    } catch (error) {
      console.error('保存日记条目失败:', error);
      // 即使服务器保存失败，也保存到本地状态
      set((state) => ({
        diaryEntries: [...state.diaryEntries, { ...entry, id: entry.id || Date.now().toString() }]
      }));
      throw error;
    }
  },
  
  updateDiaryEntry: (id, updates) => set((state) => ({
    diaryEntries: state.diaryEntries.map(entry => 
      entry.id === id ? { ...entry, ...updates } : entry
    )
  })),
  
  deleteDiaryEntry: async (id) => {
    try {
      const localUserData = await StorageUtils.getUserData();
      const { profile } = get();
      
      const userUid = localUserData?.uid || profile?.uid;
      
      if (!userUid) {
        throw new Error('用户 UID 不存在，请重新登录');
      }
      
      // 从服务器删除
      await API.deleteDiaryEntry(userUid, id);
      
      // 更新本地状态
      set((state) => ({
        diaryEntries: state.diaryEntries.filter(entry => entry.id !== id)
      }));
      
      console.log('日记条目删除成功');
    } catch (error) {
      console.error('删除日记条目失败:', error);
      // 即使服务器删除失败，也从本地状态删除
      set((state) => ({
        diaryEntries: state.diaryEntries.filter(entry => entry.id !== id)
      }));
      throw error;
    }
  },
  
  addExerciseEntry: async (entry) => {
    try {
      const localUserData = await StorageUtils.getUserData();
      const { profile } = get();
      
      const userUid = localUserData?.uid || profile?.uid;
      
      if (!userUid) {
        throw new Error('用户 UID 不存在，请重新登录');
      }
      
      // 添加用户 UID 到条目数据
      const entryWithUid = {
        ...entry,
        id: entry.id || `exercise_${Date.now()}`,
        user_uid: userUid,
      };
      
      // 保存到服务器
      const response = await API.createExerciseEntry(entryWithUid);
      
      if (response.success) {
        // 格式化响应数据
        const formattedEntry = {
          ...response.entry,
          calories: parseFloat(response.entry.calories) || 0,
          durationMin: parseInt(response.entry.duration_min) || 0,
          distance: response.entry.distance ? parseFloat(response.entry.distance) : null,
          sets: response.entry.sets ? parseInt(response.entry.sets) : null,
          reps: response.entry.reps ? parseInt(response.entry.reps) : null,
          weight: response.entry.weight ? parseFloat(response.entry.weight) : null,
          met: response.entry.met_value ? parseFloat(response.entry.met_value) : null,
          date: response.entry.date instanceof Date ? 
                response.entry.date.toISOString().split('T')[0] : 
                typeof response.entry.date === 'string' ? 
                response.entry.date.split('T')[0] : response.entry.date
        };
        
        // 更新本地状态
        set((state) => ({
          exerciseEntries: [...state.exerciseEntries, formattedEntry]
        }));
        console.log('运动条目保存成功');
      }
    } catch (error) {
      console.error('保存运动条目失败:', error);
      // 即使服务器保存失败，也保存到本地状态
      set((state) => ({
        exerciseEntries: [...state.exerciseEntries, { ...entry, id: entry.id || Date.now().toString() }]
      }));
      throw error;
    }
  },
  
  updateExerciseEntry: (id, updates) => set((state) => ({
    exerciseEntries: state.exerciseEntries.map(entry => 
      entry.id === id ? { ...entry, ...updates } : entry
    )
  })),
  
  deleteExerciseEntry: async (id) => {
    try {
      const localUserData = await StorageUtils.getUserData();
      const { profile } = get();
      
      const userUid = localUserData?.uid || profile?.uid;
      
      if (!userUid) {
        throw new Error('用户 UID 不存在，请重新登录');
      }
      
      // 从服务器删除
      await API.deleteExerciseEntry(userUid, id);
      
      // 更新本地状态
      set((state) => ({
        exerciseEntries: state.exerciseEntries.filter(entry => entry.id !== id)
      }));
      
      console.log('运动条目删除成功');
    } catch (error) {
      console.error('删除运动条目失败:', error);
      // 即使服务器删除失败，也从本地状态删除
      set((state) => ({
        exerciseEntries: state.exerciseEntries.filter(entry => entry.id !== id)
      }));
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