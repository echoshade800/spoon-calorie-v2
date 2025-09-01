/**
 * Add Items to Meal Screen - Dedicated screen for adding foods to a meal being created
 * 
 * Purpose: Search and add foods specifically to a meal in creation mode
 * Features: Food search, quick add to meal, return to create meal with selected items
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/stores/useAppStore';
import { calculateNutrition } from '@/utils/database';

export default function AddItemsToMealScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  const { 
    searchResults,
    searchFoodsInDatabase,
    isSearching,
    myFoods = [],
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

  // Parse existing meal data from params
  const mealName = params.mealName || '';
  const existingItems = params.existingItems ? JSON.parse(params.existingItems) : [];
  const photo = params.photo || '';
  const directions = params.directions || '';

  // Search foods when query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchFoodsInDatabase(searchQuery);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Initial search for popular foods
  useEffect(() => {
    searchFoodsInDatabase('');
  }, []);

  const getDefaultServing = (food) => {
    if (food.serving_label && food.grams_per_serving) {
      return {
        amount: 1,
        unit: 'serving',
        label: food.serving_label,
        grams: food.grams_per_serving
      };
    }
    
    return {
      amount: 100,
      unit: 'g',
      label: '100 g',
      grams: 100
    };
  };

  const handleAddFood = (food) => {
    const defaultServing = getDefaultServing(food);
    const nutrition = calculateNutrition(food, defaultServing.grams, 'g');
    
    const newItem = {
      id: Date.now().toString(),
      foodId: food.id,
      name: food.name,
      brand: food.brand,
      amount: defaultServing.grams,
      unit: defaultServing.unit,
      calories: nutrition.kcal,
      carbs: nutrition.carbs,
      protein: nutrition.protein,
      fat: nutrition.fat,
    };

    setSelectedItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (itemId) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleDone = () => {
    // Combine existing items with newly selected items
    const allItems = [...existingItems, ...selectedItems];
    
    // Navigate back to create meal with updated items
    router.replace({
      pathname: '/create-meal',
      params: {
        meal: params.meal,
        mealName: mealName,
        items: JSON.stringify(allItems),
        photo: photo,
        directions: directions,
      }
    });
  };

  const getAllFoods = () => {
    // Combine search results with my foods
    const allFoods = [...searchResults];
    
    // Add my foods that aren't already in search results
    myFoods.forEach(myFood => {
      if (!allFoods.find(f => f.id === myFood.id)) {
        allFoods.push(myFood);
      }
    });
    
    return allFoods;
  };

  const getFilteredFoods = () => {
    const allFoods = getAllFoods();
    
    if (!searchQuery.trim()) {
      return allFoods.slice(0, 20);
    }
    
    const query = searchQuery.toLowerCase();
    return allFoods.filter(food => 
      food.name.toLowerCase().includes(query) ||
      (food.brand && food.brand.toLowerCase().includes(query))
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Add Items to Meal</Text>
        
        <TouchableOpacity 
          style={styles.doneButton}
          onPress={handleDone}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Meal Context */}
      <View style={styles.contextBar}>
        <Text style={styles.contextText}>
          Adding to: {mealName || 'Untitled Meal'}
        </Text>
        {selectedItems.length > 0 && (
          <Text style={styles.selectedCount}>
            {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
          </Text>
        )}
      </View>

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

      {/* Selected Items Preview */}
      {selectedItems.length > 0 && (
        <View style={styles.selectedItemsSection}>
          <Text style={styles.selectedItemsTitle}>Selected Items</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.selectedItemsList}>
              {selectedItems.map((item) => (
                <View key={item.id} style={styles.selectedItem}>
                  <Text style={styles.selectedItemName}>{item.name}</Text>
                  <TouchableOpacity
                    style={styles.removeSelectedButton}
                    onPress={() => handleRemoveItem(item.id)}
                  >
                    <Ionicons name="close" size={16} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Food Search Results */}
      <ScrollView style={styles.foodList} showsVerticalScrollIndicator={false}>
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : (
          getFilteredFoods().map((food) => {
            const isSelected = selectedItems.some(item => item.foodId === food.id);
            
            return (
              <View key={food.id} style={styles.foodItem}>
                <TouchableOpacity
                  style={styles.foodContent}
                  onPress={() => {
                    // Navigate to food details for portion adjustment
                    router.push({
                      pathname: '/food-details',
                      params: {
                        foodId: food.id,
                        meal: params.meal,
                        returnTo: 'add-items-to-meal',
                        mealName: mealName,
                        existingItems: JSON.stringify([...existingItems, ...selectedItems]),
                        photo: photo,
                        directions: directions,
                      }
                    });
                  }}
                >
                  <Text style={styles.foodName}>{food.name}</Text>
                  {food.brand && (
                    <Text style={styles.foodBrand}>{food.brand}</Text>
                  )}
                  <Text style={styles.foodNutrition}>
                    {Math.round(food.kcal_per_100g || 0)} kcal/100g • C:{Math.round(food.carbs_per_100g || 0)}g P:{Math.round(food.protein_per_100g || 0)}g F:{Math.round(food.fat_per_100g || 0)}g
                    {food.source && ` • ${food.source}`}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.addButton,
                    isSelected && styles.addButtonSelected
                  ]}
                  onPress={() => {
                    if (isSelected) {
                      // Remove if already selected
                      const itemToRemove = selectedItems.find(item => item.foodId === food.id);
                      if (itemToRemove) {
                        handleRemoveItem(itemToRemove.id);
                      }
                    } else {
                      // Add with default serving
                      handleAddFood(food);
                    }
                  }}
                >
                  <Ionicons 
                    name={isSelected ? "checkmark" : "add"} 
                    size={20} 
                    color={isSelected ? "#fff" : "#4CAF50"} 
                  />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
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
  doneButton: {
    padding: 4,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  contextBar: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contextText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  selectedCount: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  selectedItemsSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  selectedItemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  selectedItemsList: {
    flexDirection: 'row',
    gap: 8,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  selectedItemName: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  removeSelectedButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodList: {
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  addButtonSelected: {
    backgroundColor: '#4CAF50',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});