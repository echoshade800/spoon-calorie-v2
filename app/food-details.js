/**
 * Food Details Screen - Detailed food entry with serving size and quantity adjustment
 * 
 * Purpose: Allow users to adjust serving size, number of servings, and meal before adding
 * Features: Serving size selector, quantity picker, meal selector, nutrition preview
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/stores/useAppStore';
import { getMealDisplayName } from '@/utils/helpers';
import { calculateNutrition } from '@/utils/database';

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

const COMMON_FRACTIONS = [
  { value: 0.125, label: '1/8' },
  { value: 0.25, label: '1/4' },
  { value: 0.33, label: '1/3' },
  { value: 0.5, label: '1/2' },
  { value: 0.67, label: '2/3' },
  { value: 0.75, label: '3/4' },
  { value: 1, label: '1' },
  { value: 1.5, label: '3/2' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
];

export default function FoodDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  const { 
    getFoodDetails, 
    addDiaryEntry, 
    selectedDate,
    searchResults,
    myFoods 
  } = useAppStore();

  const [food, setFood] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(params.meal || 'breakfast');
  const [selectedServing, setSelectedServing] = useState(null);
  const [numberOfServings, setNumberOfServings] = useState(1);
  const [showServingSelector, setShowServingSelector] = useState(false);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [showMealSelector, setShowMealSelector] = useState(false);
  const [quantityMode, setQuantityMode] = useState('DEC'); // DEC or FRAC
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFoodData();
  }, [params.foodId]);

  const loadFoodData = async () => {
    try {
      // First try to find in search results
      let foundFood = searchResults.find(f => f.id === params.foodId);
      
      // If not found, try my foods
      if (!foundFood) {
        foundFood = myFoods.find(f => f.id === params.foodId);
      }
      
      // If still not found, try to get from database
      if (!foundFood) {
        foundFood = await getFoodDetails(params.foodId);
      }

      if (foundFood) {
        setFood(foundFood);
        // Set default serving
        const defaultServing = getDefaultServing(foundFood);
        setSelectedServing(defaultServing);
      } else {
        Alert.alert('Error', 'Food not found');
        router.back();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load food details');
      router.back();
    }
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

  const getServingOptions = (food) => {
    const options = [];
    
    // Add common servings if available
    if (food.serving_label && food.grams_per_serving) {
      options.push({
        amount: 1,
        unit: 'serving',
        label: food.serving_label,
        grams: food.grams_per_serving
      });
    }
    
    // Always add gram options
    options.push(
      { amount: 100, unit: 'g', label: '100 g', grams: 100 },
      { amount: 1, unit: 'g', label: '1 g', grams: 1 }
    );
    
    return options;
  };

  const calculateCurrentNutrition = () => {
    if (!food || !selectedServing) return { kcal: 0, carbs: 0, protein: 0, fat: 0 };
    
    const totalGrams = selectedServing.grams * numberOfServings;
    return calculateNutrition(food, totalGrams, 'g');
  };

  const handleAdd = async () => {
    if (!food || !selectedServing) return;
    
    setIsLoading(true);
    
    try {
      const nutrition = calculateCurrentNutrition();
      
      // Check if we're in meal creation mode
      if (params.returnTo === 'add-items-to-meal') {
        const newItem = {
          id: Date.now().toString(),
          foodId: food.id,
          name: food.name,
          amount: selectedServing.grams * numberOfServings,
          unit: selectedServing.unit,
          calories: nutrition.kcal,
          carbs: nutrition.carbs,
          protein: nutrition.protein,
          fat: nutrition.fat,
        };
        
        // Parse existing items and add new one
        let existingItems = [];
        try {
          existingItems = params.existingItems ? JSON.parse(params.existingItems) : [];
        } catch (error) {
          console.log('Error parsing existing items:', error);
        }
        
        const updatedItems = [...existingItems, newItem];
        
        router.replace({
          pathname: '/add-items-to-meal',
          params: {
            meal: params.meal,
            mealName: params.mealName || '',
            existingItems: JSON.stringify(updatedItems),
            photo: params.photo || '',
            directions: params.directions || '',
          }
        });
        return;
      }
      
      const entry = {
        date: selectedDate,
        meal_type: selectedMeal,
        food_id: food.id,
        food_name: food.name,
        custom_name: null,
        amount: numberOfServings,
        unit: selectedServing.label,
        source: food.source || 'database',
        kcal: nutrition.kcal,
        carbs: nutrition.carbs,
        protein: nutrition.protein,
        fat: nutrition.fat,
      };
      
      addDiaryEntry(entry);
      
      // Show success toast
      Alert.alert(
        'Food Added',
        `Added ${numberOfServings} × ${selectedServing.label} ${food.name} to ${getMealDisplayName(selectedMeal)} · ${nutrition.kcal} kcal`,
        [
          { text: 'Undo', style: 'destructive', onPress: () => {/* TODO: Implement undo */} },
          { text: 'OK', style: 'default', onPress: () => router.replace('/add') }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add food. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderServingSelector = () => (
    <Modal visible={showServingSelector} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.servingSelectorModal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowServingSelector(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Unit</Text>
            <TouchableOpacity onPress={() => setShowServingSelector(false)}>
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.servingOptions}>
            {getServingOptions(food).map((serving, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.servingOption,
                  selectedServing?.label === serving.label && styles.selectedServingOption
                ]}
                onPress={() => {
                  setSelectedServing(serving);
                  setShowServingSelector(false);
                }}
              >
                <Text style={[
                  styles.servingOptionText,
                  selectedServing?.label === serving.label && styles.selectedServingOptionText
                ]}>
                  {serving.label}
                </Text>
                <Text style={styles.servingGrams}>({serving.grams} g)</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderQuantitySelector = () => (
    <Modal visible={showQuantitySelector} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.quantitySelectorModal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowQuantitySelector(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Number of Servings</Text>
            <TouchableOpacity onPress={() => setShowQuantitySelector(false)}>
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
          
          {/* Mode Selector */}
          <View style={styles.quantityModeSelector}>
            <TouchableOpacity
              style={[
                styles.quantityModeButton,
                quantityMode === 'DEC' && styles.activeQuantityModeButton
              ]}
              onPress={() => setQuantityMode('DEC')}
            >
              <Text style={[
                styles.quantityModeText,
                quantityMode === 'DEC' && styles.activeQuantityModeText
              ]}>
                DEC
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.quantityModeButton,
                quantityMode === 'FRAC' && styles.activeQuantityModeButton
              ]}
              onPress={() => setQuantityMode('FRAC')}
            >
              <Text style={[
                styles.quantityModeText,
                quantityMode === 'FRAC' && styles.activeQuantityModeText
              ]}>
                FRAC
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Quantity Options */}
          <ScrollView style={styles.quantityOptions}>
            {quantityMode === 'FRAC' ? (
              COMMON_FRACTIONS.map((fraction) => (
                <TouchableOpacity
                  key={fraction.value}
                  style={[
                    styles.quantityOption,
                    numberOfServings === fraction.value && styles.selectedQuantityOption
                  ]}
                  onPress={() => {
                    setNumberOfServings(fraction.value);
                    setShowQuantitySelector(false);
                  }}
                >
                  <Text style={[
                    styles.quantityOptionText,
                    numberOfServings === fraction.value && styles.selectedQuantityOptionText
                  ]}>
                    {fraction.label}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              // Decimal mode - generate 0.1 to 20.0 with 0.1 steps
              Array.from({ length: 200 }, (_, i) => (i + 1) * 0.1).map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.quantityOption,
                    numberOfServings === value && styles.selectedQuantityOption
                  ]}
                  onPress={() => {
                    setNumberOfServings(value);
                    setShowQuantitySelector(false);
                  }}
                >
                  <Text style={[
                    styles.quantityOptionText,
                    numberOfServings === value && styles.selectedQuantityOptionText
                  ]}>
                    {value.toFixed(1)}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderMealSelectorModal = () => (
    <Modal visible={showMealSelector} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.mealSelectorModal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowMealSelector(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Meal</Text>
            <TouchableOpacity onPress={() => setShowMealSelector(false)}>
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.mealOptions}>
            {MEAL_TYPES.map((meal) => (
              <TouchableOpacity
                key={meal.value}
                style={[
                  styles.mealOption,
                  selectedMeal === meal.value && styles.selectedMealOption
                ]}
                onPress={() => {
                  setSelectedMeal(meal.value);
                  setShowMealSelector(false);
                }}
              >
                <Text style={[
                  styles.mealOptionText,
                  selectedMeal === meal.value && styles.selectedMealOptionText
                ]}>
                  {meal.label}
                </Text>
                {selectedMeal === meal.value && (
                  <Ionicons name="checkmark" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  if (!food) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const nutrition = calculateCurrentNutrition();
  const totalCalories = nutrition.kcal;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.replace('/add')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Add Food</Text>
        
        <TouchableOpacity 
          style={[styles.addButton, isLoading && styles.addButtonDisabled]}
          onPress={handleAdd}
          disabled={isLoading}
        >
          <Ionicons name="checkmark" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Food Title */}
        <View style={styles.section}>
          <Text style={styles.foodTitle}>
            {food.name}
            {food.brand && <Text style={styles.foodBrand}> {food.brand}</Text>}
            }
          </Text>
          <Text style={styles.foodSubtitle}>per 100 g</Text>
        </View>

        {/* Serving Size */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Serving Size</Text>
          <TouchableOpacity 
            style={styles.fieldButton}
            onPress={() => setShowServingSelector(true)}
          >
            <Text style={styles.fieldValue}>
              {selectedServing?.label || '100 g'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Number of Servings */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Number of Servings</Text>
          <TouchableOpacity 
            style={styles.fieldButton}
            onPress={() => setShowQuantitySelector(true)}
          >
            <Text style={styles.fieldValue}>{numberOfServings}</Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Meal */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Meal</Text>
          <TouchableOpacity 
            style={styles.fieldButton}
            onPress={() => setShowMealSelector(true)}
          >
            <Text style={styles.fieldValue}>
              {getMealDisplayName(selectedMeal)}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Nutrition Preview */}
        <View style={styles.nutritionSection}>
          <Text style={styles.nutritionTitle}>Nutrition Preview</Text>
          
          <View style={styles.nutritionContent}>
            {/* Calories Circle */}
            <View style={styles.caloriesContainer}>
              <View style={styles.caloriesCircle}>
                <Text style={styles.caloriesNumber}>{totalCalories}</Text>
                <Text style={styles.caloriesLabel}>cal</Text>
              </View>
            </View>

            {/* Macros */}
            <View style={styles.macrosContainer}>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{Math.round(nutrition.carbs * 10) / 10}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{Math.round(nutrition.fat * 10) / 10}g</Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
              
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{Math.round(nutrition.protein * 10) / 10}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Add Button */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity 
          style={[styles.bottomAddButton, isLoading && styles.bottomAddButtonDisabled]}
          onPress={handleAdd}
          disabled={isLoading}
        >
          <Text style={[styles.bottomAddButtonText, isLoading && styles.bottomAddButtonTextDisabled]}>
            {isLoading ? 'Adding...' : `Add to ${getMealDisplayName(selectedMeal)}`}
          </Text>
        </TouchableOpacity>
      </View>

      {renderServingSelector()}
      {renderQuantitySelector()}
      {renderMealSelectorModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  addButton: {
    padding: 4,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  foodTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  foodBrand: {
    color: '#666',
    fontWeight: '400',
  },
  foodSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  fieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
  },
  fieldValue: {
    fontSize: 16,
    color: '#000',
  },
  nutritionSection: {
    backgroundColor: '#fff',
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  nutritionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 20,
  },
  nutritionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  caloriesContainer: {
    marginRight: 32,
  },
  caloriesCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caloriesNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  caloriesLabel: {
    fontSize: 14,
    color: '#666',
  },
  macrosContainer: {
    flex: 1,
    gap: 16,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 14,
    color: '#666',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  bottomAddButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  bottomAddButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  bottomAddButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  bottomAddButtonTextDisabled: {
    color: '#8E8E93',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  servingSelectorModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  quantitySelectorModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  mealSelectorModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
  modalDoneText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  servingOptions: {
    maxHeight: 300,
  },
  servingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedServingOption: {
    backgroundColor: '#F8FFF8',
  },
  servingOptionText: {
    fontSize: 16,
    color: '#000',
  },
  selectedServingOptionText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  servingGrams: {
    fontSize: 14,
    color: '#666',
  },
  quantityModeSelector: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    padding: 4,
    marginHorizontal: 20,
    marginVertical: 16,
  },
  quantityModeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeQuantityModeButton: {
    backgroundColor: '#fff',
  },
  quantityModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeQuantityModeText: {
    color: '#000',
    fontWeight: '600',
  },
  quantityOptions: {
    maxHeight: 300,
  },
  quantityOption: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  selectedQuantityOption: {
    backgroundColor: '#F8FFF8',
  },
  quantityOptionText: {
    fontSize: 16,
    color: '#000',
  },
  selectedQuantityOptionText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  mealOptions: {
    paddingVertical: 8,
  },
  mealOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedMealOption: {
    backgroundColor: '#F8FFF8',
  },
  mealOptionText: {
    fontSize: 16,
    color: '#000',
  },
  selectedMealOptionText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
});