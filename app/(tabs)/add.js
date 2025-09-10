/**
 * Add/Record Meal Screen - Primary feature for logging food
 * 
 * Purpose: Quick food logging with meal scan and custom food creation
 * Features: Meal scan, search, custom foods, my meals, save combinations
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Image,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import Constants from 'expo-constants';
import { useAppStore } from '@/stores/useAppStore';
import { getMealDisplayName } from '@/utils/helpers';
import { calculateNutrition } from '@/utils/database';
import SwipeableRow from '@/components/SwipeableRow';

const Platform = Constants.platform;
const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'meals', label: 'My Meals' },
  { id: 'foods', label: 'My Foods' },
];

export default function AddScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const { 
    searchResults,
    searchFoodsInDatabase,
    isSearching,
    addDiaryEntry, 
    selectedDate, 
    addScreenScrollPositions, // Import new state
    setAddScreenScrollPosition, // Import new action
    myMeals = [],
    myFoods = [],
    addMyMeal,
    addMyFood,
    deleteMyMeal,
  } = useAppStore();

  // Form state
  const [selectedMeal, setSelectedMeal] = useState(params.meal || 'breakfast');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showMealSelector, setShowMealSelector] = useState(false);
  const scrollViewRef = useRef(null); // Ref for the ScrollView

  // Update selectedMeal when params.meal changes
  useEffect(() => {
    if (params.meal) {
      setSelectedMeal(String(params.meal));
    }
  }, [params.meal]);

  // Search foods when query changes
  useEffect(() => {
    if (activeFilter === 'all') {
      const timeoutId = setTimeout(() => {
        searchFoodsInDatabase(searchQuery);
      }, 300); // Debounce search
      
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, activeFilter]);

  // Initial search for popular foods
  useEffect(() => {
    if (activeFilter === 'all') {
      searchFoodsInDatabase('');
    }
  }, [activeFilter]);

  // Handle tab parameter from navigation
  useEffect(() => {
    if (params.tab === 'meals') {
      setActiveFilter('meals');
    }
    
    // Handle return from create-meal flow
    if (params.returnTo === 'create-meal' && params.existingItems) {
      // This indicates we're adding foods to a meal being created
      console.log('Adding foods to meal creation flow');
    }
  }, [params.tab]);

  // Restore scroll position when activeFilter changes or component mounts
  useEffect(() => {
    const storedPosition = addScreenScrollPositions[activeFilter] || 0;
    if (scrollViewRef.current && storedPosition > 0) {
      // Use a timeout to ensure the ScrollView has rendered and measured its content
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: storedPosition, animated: false });
      }, 100);
    }
  }
  )

  const handleQuickAdd = (food) => {
    // Get default serving
    const defaultServing = getDefaultServing(food);
    
    // Calculate nutrition
    const nutrition = calculateNutrition(food, defaultServing.grams, 'g');
    
    const entry = {
      date: selectedDate,
      meal_type: selectedMeal,
      food_id: food.id,
      food_name: food.name,
      custom_name: null,
      amount: defaultServing.amount,
      unit: defaultServing.unit,
      source: food.source || 'database',
      kcal: nutrition.kcal,
      carbs: nutrition.carbs,
      protein: nutrition.protein,
      fat: nutrition.fat,
    };
    
    addDiaryEntry(entry);
    
    // Show toast with undo option
    Alert.alert(
      'Food Added',
      `Added ${defaultServing.amount} × ${defaultServing.label} ${food.name} to ${getMealDisplayName(selectedMeal)} · ${nutrition.kcal} kcal`,
      [
        { text: 'Undo', style: 'destructive', onPress: () => {/* TODO: Implement undo */} },
        { text: 'OK', style: 'default' }
      ]
    );
  };

  const handleFoodDetails = (food) => {
    // Check if we're in meal creation mode
    if (params.returnTo === 'create-meal') {
      // Navigate to food details but with create-meal context
      router.push({
        pathname: '/food-details',
        params: {
          foodId: food.id,
          meal: selectedMeal,
          returnTo: 'create-meal',
          mealName: params.mealName || '',
          existingItems: params.existingItems || '[]',
          photo: params.photo || '',
          directions: params.directions || '',
        }
      });
      return;
    }
    
    // Navigate to food details page for adjustment
    router.push({
      pathname: '/food-details',
      params: {
        foodId: food.id,
        meal: selectedMeal,
        returnTo: 'add'
      }
    });
  };

  const getDefaultServing = (food) => {
    // Try to get default serving from food data
    if (food.serving_label && food.grams_per_serving) {
      return {
        amount: 1,
        unit: 'serving',
        label: food.serving_label,
        grams: food.grams_per_serving
      };
    }
    
    // Fallback to 100g
    return {
      amount: 100,
      unit: 'g',
      label: '100 g',
      grams: 100
    };
  };

  const handleFoodAction = (food, action) => {
    switch (action) {
      case 'add':
        handleQuickAdd(food);
        break;
      case 'edit':
        Alert.alert('Edit Food', 'Edit functionality coming soon');
        break;
      case 'delete':
        handleDeleteFood(food);
        break;
    }
  };

  const handleDeleteFood = (food) => {
    Alert.alert(
      'Delete Food',
      `Are you sure you want to delete "${food.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            deleteMyFood(food.id);
            Alert.alert('Deleted', 'Food deleted successfully');
          }
        },
      ]
    );
  };

  const handleMealScan = async () => {
    // Navigate to meal scan flow
    router.push(`/scan?meal=${selectedMeal}`);
  };

  const pickFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        // Mock meal scan results
        const mockResults = [
          { id: '1', name: 'Pasta with Tomato Sauce', calories: 220, amount: 1, unit: 'serving', carbs: 43, protein: 8, fat: 2 },
          { id: '2', name: 'Parmesan Cheese', calories: 110, amount: 2, unit: 'tbsp', carbs: 1, protein: 10, fat: 7 },
        ];
        Alert.alert('Scan Complete', `Found ${mockResults.length} items in your meal`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const requestCameraPermissions = async () => {
    if (Platform.OS !== 'web') {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      const mediaLibraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus.status !== 'granted' || mediaLibraryStatus.status !== 'granted') {
        return false;
      }
    }
    return true;
  };

  const renderMealTabs = () => (
    <View style={styles.mealTabsContainer}>
      {MEAL_TYPES.map((mealTab) => (
        <TouchableOpacity
          key={`meal-tab-${mealTab.value}`}
          style={[
            styles.mealTabButton,
            selectedMeal === mealTab.value && styles.activeMealTabButton,
          ]}
          onPress={() => setSelectedMeal(mealTab.value)}
        >
          <Text style={[
            styles.mealTabText,
            selectedMeal === mealTab.value && styles.activeMealTabText,
          ]}>
            {mealTab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSearchTab = () => (
    <View style={styles.tabContent}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#4CAF50" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search foods..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results */}
      <ScrollView 
        ref={scrollViewRef} // Assign ref
        style={styles.resultsList}
        onScroll={(event) => setAddScreenScrollPosition(activeFilter, event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16} // Important for performance
      >
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : (
          searchResults.map((food) => (
            <View key={`search-food-${food.id}`} style={styles.foodItem}>
              <TouchableOpacity
                style={styles.foodContent}
                onPress={() => handleFoodDetails(food)}
              >
                <Text style={styles.foodName}>{food.name}</Text>
                {food.brand && (
                  <Text style={styles.foodBrand}>{food.brand}</Text>
                )}
                <Text style={styles.foodNutrition}>
                  {Math.round(food.kcal_per_100g)} kcal/100g • C:{Math.round(food.carbs_per_100g || 0)}g P:{Math.round(food.protein_per_100g || 0)}g F:{Math.round(food.fat_per_100g || 0)}g
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickAddButton}
                onPress={() => handleQuickAdd(food)}
              >
                <Ionicons name="add" size={20} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );

  const renderMyFoodsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.myFoodsHeader}>
        <Text style={styles.myFoodsTitle}>My Foods</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => router.push('/create-food?returnTo=my-foods')}
        >
          <Ionicons name="add" size={20} color="#4CAF50" />
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        ref={scrollViewRef} // Assign ref
        style={styles.resultsList}
        onScroll={(event) => setAddScreenScrollPosition(activeFilter, event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        {myFoods.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No custom foods yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Create your own foods with custom nutrition info
            </Text>
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={() => router.push('/create-food?returnTo=my-foods')}
            >
              <Text style={styles.emptyStateButtonText}>Create Your First Food</Text>
            </TouchableOpacity>
          </View>
        ) : (
          myFoods.map((food) => (
            <SwipeableRow
              key={`my-food-${food.id}`}
              onDelete={() => handleFoodAction(food, 'delete')}
              itemName={food.name}
            >
              <View style={styles.foodItem}>
                <TouchableOpacity
                  style={styles.foodContent}
                  onPress={() => handleFoodDetails(food)}
                >
                  <Text style={styles.foodName}>{food.name}</Text>
                  {food.brand && (
                    <Text style={styles.foodBrand}>{food.brand}</Text>
                  )}
                  <Text style={styles.foodNutrition}>
                    {food.kcal_per_100g} kcal/100g • Custom Food
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickAddButton}
                  onPress={() => handleQuickAdd(food)}
                >
                  <Ionicons name="add" size={20} color="#4CAF50" />
                </TouchableOpacity>
              </View>
            </SwipeableRow>
          ))
        )}
      </ScrollView>
    </View>
  );

  const renderMyMealsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.myMealsHeader}>
        <Text style={styles.myMealsTitle}>My Meals</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => router.push(`/create-meal?meal=${selectedMeal}&returnTo=my-meals`)}
        >
          <Ionicons name="add" size={20} color="#4CAF50" />
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        ref={scrollViewRef} // Assign ref
        style={styles.resultsList}
        onScroll={(event) => setAddScreenScrollPosition(activeFilter, event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        {myMeals.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No saved meals yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Create custom meals with multiple ingredients
            </Text>
            <View style={styles.emptyStateActions}>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => router.push(`/create-meal?meal=${selectedMeal}&returnTo=my-meals`)}
              >
                <Text style={styles.emptyStateButtonText}>Create Meal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.emptyStateScanButton}
                onPress={() => router.push(`/scan?meal=${selectedMeal}&returnTo=my-meals`)}
              >
                <Ionicons name="camera" size={16} color="#4CAF50" />
                <Text style={styles.emptyStateScanButtonText}>Scan Meal</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          myMeals.map((meal) => (
            <SwipeableRow
              key={`my-meal-${meal.id}`}
              onDelete={() => {
                Alert.alert(
                  'Delete Meal',
                  `Are you sure you want to delete "${meal.name}"?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Delete', 
                      style: 'destructive', 
                      onPress: () => deleteMyMeal(meal.id)
                    },
                  ]
                );
              }}
              itemName={meal.name}
            >
              <View style={styles.mealItem}>
                <View style={styles.mealImageContainer}>
                  {meal.photo ? (
                    <Image source={{ uri: meal.photo }} style={styles.mealImage} />
                  ) : (
                    <View style={styles.mealImagePlaceholder}>
                      <Ionicons name="restaurant" size={20} color="#8E8E93" />
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.foodContent}
                  onPress={() => {
                    // Navigate to meal details for adjustment
                    router.push({
                      pathname: '/meal-details',
                      params: {
                        mealId: meal.id,
                        meal: selectedMeal,
                        returnTo: 'add'
                      }
                    });
                  }}
                >
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealNutrition}>
                    {meal.totalKcal} kcal • {meal.items?.length || 0} items
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickAddButton}
                  onPress={() => {
                    const entry = {
                      date: selectedDate,
                      meal_type: selectedMeal,
                      food_id: meal.id,
                      food_name: meal.name,
                      custom_name: null,
                      amount: 1,
                      unit: 'serving',
                      source: 'my_meal',
                      kcal: meal.totalKcal,
                      carbs: meal.totalCarbs,
                      protein: meal.totalProtein,
                      fat: meal.totalFat,
                    };
                    
                    addDiaryEntry(entry);
                    Alert.alert(
                      'Meal Added',
                      `Added 1 × serving ${meal.name} to ${getMealDisplayName(selectedMeal)} · ${meal.totalKcal} kcal`,
                      [
                        { text: 'Undo', style: 'destructive', onPress: () => {/* TODO: Implement undo */} },
                        { text: 'OK', style: 'default' }
                      ]
                    );
                  }}
                >
                  <Ionicons name="add" size={20} color="#4CAF50" />
                </TouchableOpacity>
              </View>
            </SwipeableRow>
          ))
        )}
      </ScrollView>
    </View>
  );

  const renderTabContent = () => {
    switch (activeFilter) {
      case 'all':
        return renderSearchTab();
      case 'foods':
        return renderMyFoodsTab();
      case 'meals':
        return renderMyMealsTab();
      default:
        return renderSearchTab();
    }
  };

  return (
    <View style={styles.container}>
      {/* Meal Selection Tabs */}
      {renderMealTabs()}

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.filterTab,
              activeFilter === tab.id && styles.activeFilterTab,
            ]}
            onPress={() => setActiveFilter(tab.id)}
          >
            <Text style={[
              styles.filterTabText,
              activeFilter === tab.id && styles.activeFilterTabText,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => router.push(`/quick-add?meal=${selectedMeal}`)}
        >
          <Ionicons name="flash" size={20} color="#4CAF50" />
          <Text style={styles.quickActionText}>Quick Add</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={handleMealScan}
        >
          <Ionicons name="camera" size={20} color="#4CAF50" />
          <Text style={styles.quickActionText}>Scan Meal</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => router.push(`/barcode?meal=${selectedMeal}`)}
        >
          <Ionicons name="scan-outline" size={20} color="#4CAF50" />
          <Text style={styles.quickActionText}>Barcode Scan</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {renderTabContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  
  // Meal tabs styles
  mealTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 20,
    padding: 4,
    marginHorizontal: 20,
    marginTop: 60,
    marginBottom: 16,
  },
  mealTabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  activeMealTabButton: {
    backgroundColor: '#fff',
  },
  mealTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeMealTabText: {
    color: '#000',
    fontWeight: '600',
  },

  // Filter tabs
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 20,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: '#fff',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeFilterTabText: {
    color: '#000',
    fontWeight: '600',
  },

  // Quick actions
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4CAF50',
  },

  // Tab content
  tabContent: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },

  // Food items
  resultsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  foodContent: {
    flex: 1,
    padding: 16,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  foodBrand: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  foodNutrition: {
    fontSize: 12,
    color: '#999',
  },
  quickAddButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  // My Foods/Meals
  myFoodsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  myFoodsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  myMealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  myMealsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
  },

  // Meal items
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mealImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginLeft: 16,
    marginRight: 0,
    overflow: 'hidden',
  },
  mealImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mealImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
  },
  mealContent: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  mealNutrition: {
    fontSize: 12,
    color: '#999',
  },

  // Empty states
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  emptyStateActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  emptyStateButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyStateScanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  emptyStateScanButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});