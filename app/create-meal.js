/**
 * Create Meal Screen - Full-featured meal creation interface
 * 
 * Purpose: Create custom meals with photo, nutrition tracking, and item management
 * Features: Photo upload, nutrition calculator, meal items, directions, sharing
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  StatusBar,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import Constants from 'expo-constants';
import { useAppStore } from '@/stores/useAppStore';
import { getMealDisplayName } from '@/utils/helpers';

const Platform = Constants.platform;
export default function CreateMealScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addMyMeal, addDiaryEntry, selectedDate, foods } = useAppStore();
  
  const [mealData, setMealData] = useState({
    name: '',
    photo: null,
    totalCalories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
    items: [],
    directions: '',
  });
  
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [mealName, setMealName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize directions from params if coming back from edit
  useEffect(() => {
    if (params.updatedDirections) {
      setMealData(prev => ({
        ...prev,
        directions: params.updatedDirections
      }));
    }
    
    // Restore meal data from params if returning from directions editor
    if (params.mealName) {
      setMealName(params.mealName);
    }
    if (params.totalCalories) {
      // Don't override calculated totals, let them be recalculated from items
    }
    if (params.items) {
      try {
        const items = JSON.parse(params.items);
        setMealData(prev => ({
          ...prev,
          items: items
        }));
      } catch (error) {
        console.log('Error parsing items:', error);
      }
    }
    if (params.photo) {
      setMealData(prev => ({
        ...prev,
        photo: params.photo
      }));
    }
  }, [params.updatedDirections]);

  // Calculate totals from items
  useEffect(() => {
    const totals = mealData.items.reduce((acc, item) => ({
      calories: acc.calories + item.calories,
      carbs: acc.carbs + item.carbs,
      protein: acc.protein + item.protein,
      fat: acc.fat + item.fat,
    }), { calories: 0, carbs: 0, protein: 0, fat: 0 });

    setMealData(prev => ({
      ...prev,
      totalCalories: totals.calories,
      carbs: totals.carbs,
      protein: totals.protein,
      fat: totals.fat,
    }));
  }, [mealData.items]);

  const addFoodItem = (food, amount = 1, unit = 'serving') => {
    // Calculate nutrition based on the food's per 100g values
    const gramsAmount = unit === 'serving' && food.grams_per_serving ? 
      amount * food.grams_per_serving : 
      amount;
    const multiplier = gramsAmount / 100;
    
    const newItem = {
      id: Date.now().toString(),
      foodId: food.id,
      name: food.name,
      amount: gramsAmount,
      unit: unit,
      calories: Math.round((food.kcal_per_100g || 0) * multiplier),
      carbs: Math.round((food.carbs_per_100g || food.carbs || 0) * multiplier * 10) / 10,
      protein: Math.round((food.protein_per_100g || food.protein || 0) * multiplier * 10) / 10,
      fat: Math.round((food.fat_per_100g || food.fat || 0) * multiplier * 10) / 10,
    };

    setMealData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setShowFoodSearch(false);
  };

  const removeFoodItem = (itemId) => {
    setMealData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const getFilteredFoods = () => {
    if (!searchQuery.trim()) return foods.slice(0, 10); // Show first 10 foods
    
    const query = searchQuery.toLowerCase();
    return foods.filter(food => 
      food.name.toLowerCase().includes(query) ||
      (food.brand && food.brand.toLowerCase().includes(query))
    );
  };

  const handleSaveMeal = () => {
    if (!mealName.trim()) {
      Alert.alert('Error', 'Please enter a meal name');
      return;
    }

    const newMeal = {
      id: Date.now().toString(),
      name: mealName.trim(),
      photo: mealData.photo,
      totalKcal: mealData.totalCalories,
      totalCarbs: mealData.carbs,
      totalProtein: mealData.protein,
      totalFat: mealData.fat,
      items: mealData.items,
      directions: mealData.directions,
      createdAt: new Date().toISOString(),
    };

    addMyMeal(newMeal);
    
    Alert.alert(
      'Meal Created!',
      `"${mealName}" has been saved to My Meals`,
      [{ 
        text: 'OK', 
        onPress: () => {
          // Return to the appropriate tab based on where user came from
          if (params.returnTo === 'my-meals') {
            router.replace('/(tabs)/add?tab=meals');
          } else {
            router.replace('/(tabs)/add?tab=meals');
          }
        }
      }]
    );
  };

  const handleAddToMeal = () => {
    if (!mealName.trim()) {
      Alert.alert('Error', 'Please enter a meal name');
      return;
    }

    const selectedMeal = params.meal || 'breakfast';
    
    const entry = {
      date: selectedDate,
      meal_type: selectedMeal,
      food_id: Date.now().toString(),
      food_name: mealName.trim(),
      custom_name: null,
      amount: 1,
      unit: 'serving',
      source: 'my_meal',
      kcal: mealData.totalCalories,
      carbs: mealData.carbs,
      protein: mealData.protein,
      fat: mealData.fat,
    };

    addDiaryEntry(entry);
    
    Alert.alert(
      'Added to Meal!',
      `"${mealName}" added to ${getMealDisplayName(selectedMeal)}`,
      [{ 
        text: 'OK', 
        onPress: () => {
          // Return to the appropriate tab based on where user came from
          if (params.returnTo === 'my-meals') {
            router.replace('/(tabs)/add?tab=meals');
          } else {
            router.replace('/(tabs)/add?tab=meals');
          }
        }
      }]
    );
  };

  const calculateMacroPercentage = (macro) => {
    if (mealData.totalCalories === 0) return 0;
    const macroCalories = macro * (macro === mealData.fat ? 9 : 4); // Fat = 9 cal/g, others = 4 cal/g
    return Math.round((macroCalories / mealData.totalCalories) * 100);
  };

  // Number formatting utilities
  const formatNumber = (value) => {
    const num = Number(value) || 0;
    if (num >= 1000) {
      return new Intl.NumberFormat('en-US').format(Math.round(num));
    }
    return Math.round(num).toString();
  };

  const formatPercentage = (value) => {
    return Math.round(Number(value) || 0);
  };

  const formatGrams = (value) => {
    const num = Number(value) || 0;
    if (num >= 1000) {
      return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(num);
    }
    // Remove unnecessary .0 from whole numbers
    const formatted = num.toFixed(1);
    return formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted;
  };

  const requestCameraPermissions = async () => {
    if (Platform.OS === 'web') {
      return true; // Web doesn't need explicit permissions
    }

    try {
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      return cameraPermission.status === 'granted' && mediaLibraryPermission.status === 'granted';
    } catch (error) {
      console.log('Permission error:', error);
      return false;
    }
  };

  const handleAddPhoto = async () => {
    // Request permissions first
    const hasPermissions = await requestCameraPermissions();
    
    if (!hasPermissions) {
      Alert.alert(
        'Camera Permission Required',
        'Please allow camera and photo library access to add photos to your meals.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Choose from Library', onPress: () => pickFromLibrary() },
        ]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
        presentationStyle: 'fullScreen',
      });

      if (!result.canceled && result.assets[0]) {
        setMealData(prev => ({ ...prev, photo: result.assets[0].uri }));
      }
    } catch (error) {
      console.log('Camera error:', error);
      Alert.alert(
        'Camera Not Available',
        'Unable to open camera. Would you like to choose a photo from your library?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Choose Photo', onPress: () => pickFromLibrary() },
        ]
      );
    }
  };

  const pickFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setMealData(prev => ({ ...prev, photo: result.assets[0].uri }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  const renderShareOptions = () => (
    <Modal visible={showShareOptions} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.shareModal}>
          <Text style={styles.shareModalTitle}>Share with</Text>
          {['Public', 'Friends', 'Private'].map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.shareOption}
              onPress={() => {
                setMealData(prev => ({ ...prev, shareWith: option }));
                setShowShareOptions(false);
              }}
            >
              <Text style={styles.shareOptionText}>{option}</Text>
              {mealData.shareWith === option && (
                <Ionicons name="checkmark" size={20} color="#4CAF50" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  const renderFoodSearchModal = () => (
    <Modal visible={showFoodSearch} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.foodSearchContainer}>
          <View style={styles.foodSearchHeader}>
            <TouchableOpacity onPress={() => setShowFoodSearch(false)}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.foodSearchTitle}>Add Food Items</Text>
            <View style={styles.headerSpacer} />
          </View>
          
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
          
          <ScrollView style={styles.foodList}>
            {getFilteredFoods().map((food) => (
              <TouchableOpacity
                key={food.id}
                style={styles.foodItem}
                onPress={() => addFoodItem(food, 100, 'g')}
              >
                <View style={styles.foodItemContent}>
                  <Text style={styles.foodItemName}>{food.name}</Text>
                  {food.brand && (
                    <Text style={styles.foodItemBrand}>{food.brand}</Text>
                  )}
                  <Text style={styles.foodItemNutrition}>
                    {food.kcal_per_100g} cal/100g • C:{food.carbs}g P:{food.protein}g F:{food.fat}g
                  </Text>
                </View>
                <View style={styles.addFoodButton}>
                  <Ionicons name="add" size={20} color="#4CAF50" />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Create a Meal</Text>
        
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveMeal}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Photo Section */}
      <View style={styles.photoSection}>
        {mealData.photo ? (
          <View style={styles.photoContainer}>
            <Image source={{ uri: mealData.photo }} style={styles.mealPhoto} />
            <TouchableOpacity 
              style={styles.editPhotoButton}
              onPress={() => {
                Alert.alert(
                  'Change Photo',
                  'How would you like to update your meal photo?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Take Photo', onPress: handleAddPhoto },
                    { text: 'Choose from Library', onPress: pickFromLibrary },
                  ]
                );
              }}
            >
              <Ionicons name="create-outline" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addPhotoButton} onPress={() => {
            Alert.alert(
              'Add Photo',
              'How would you like to add a photo to your meal?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Take Photo', onPress: handleAddPhoto },
                { text: 'Choose from Library', onPress: pickFromLibrary },
              ]
            );
          }}>
            <View style={styles.photoIcon}>
              <Ionicons name="camera-outline" size={32} color="#4CAF50" />
            </View>
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Name Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Name Your Meal</Text>
          <TextInput
            style={styles.nameInput}
            value={mealName}
            onChangeText={setMealName}
            placeholder="Enter meal name"
            placeholderTextColor="#999"
          />
        </View>


        {/* Nutrition Overview */}
        <View style={styles.section}>
          <View style={styles.nutritionOverview}>
            {/* Calories Circle - Fixed Size */}
            <View style={styles.caloriesContainer}>
              <View style={styles.caloriesCircle}>
                <Text style={styles.caloriesNumber}>{formatNumber(mealData.totalCalories)}</Text>
                <Text style={styles.caloriesLabel}>cal</Text>
              </View>
            </View>
            
            {/* Macros Grid - Equal Width */}
            <View style={styles.macrosGrid}>
              <View style={styles.macroItem}>
                <Text style={[styles.macroPercentage, { color: '#4CAF50' }]} numberOfLines={1}>
                  {formatPercentage(calculateMacroPercentage(mealData.carbs))}%
                </Text>
                <Text style={styles.macroAmount} numberOfLines={1}>
                  {formatGrams(mealData.carbs)} g
                </Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              
              <View style={styles.macroItem}>
                <Text style={[styles.macroPercentage, { color: '#9C27B0' }]} numberOfLines={1}>
                  {formatPercentage(calculateMacroPercentage(mealData.fat))}%
                </Text>
                <Text style={styles.macroAmount} numberOfLines={1}>
                  {formatGrams(mealData.fat)} g
                </Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
              
              <View style={styles.macroItem}>
                <Text style={[styles.macroPercentage, { color: '#FF9500' }]}>
                  {formatPercentage(calculateMacroPercentage(mealData.protein))}%
                </Text>
                <Text style={styles.macroAmount} numberOfLines={1}>
                  {formatGrams(mealData.protein)} g
                </Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Meal Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meal Items</Text>
          
          {mealData.items.length === 0 ? (
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={() => {
                router.push({
                  pathname: '/add-items-to-meal',
                  params: {
                    meal: params.meal || 'breakfast',
                    mealName: mealName,
                    existingItems: JSON.stringify(mealData.items),
                    photo: mealData.photo || '',
                    directions: mealData.directions || '',
                  }
                });
              }}
            >
              <Text style={styles.emptyStateText}>Add items to this meal</Text>
            </TouchableOpacity>
          ) : (
            <View>
              {mealData.items.map((item, index) => (
                <View key={index} style={styles.mealItem}>
                  <View style={styles.itemCheckbox} />
                  <View style={styles.itemContent}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemAmount}>{item.amount} {item.unit}</Text>
                  </View>
                  <Text style={styles.itemCalories}>{item.calories}</Text>
                  <TouchableOpacity 
                    style={styles.removeItemButton}
                    onPress={() => removeFoodItem(item.id)}
                  >
                    <Ionicons name="close" size={16} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              ))}
              
              <TouchableOpacity 
                style={styles.addMoreItemsButton}
                onPress={() => {
                  router.push({
                    pathname: '/add-items-to-meal',
                    params: {
                      meal: params.meal || 'breakfast',
                      mealName: mealName,
                      existingItems: JSON.stringify(mealData.items),
                      photo: mealData.photo || '',
                      directions: mealData.directions || '',
                    }
                  });
                }}
              >
                <Ionicons name="add" size={20} color="#4CAF50" />
                <Text style={styles.addMoreItemsText}>Add more items</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Directions Section */}
        <View style={styles.section}>
          <View style={styles.directionsHeader}>
            <Text style={styles.sectionTitle}>Directions</Text>
            <TouchableOpacity onPress={() => {
              router.push({
                pathname: '/add/create-meal/directions',
                params: {
                  directions: mealData.directions || '',
                  meal: params.meal || 'breakfast',
                  // Pass current meal data to preserve state
                  mealName: mealName,
                  totalCalories: mealData.totalCalories.toString(),
                  items: JSON.stringify(mealData.items),
                  photo: mealData.photo || '',
                }
              });
            }}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          {mealData.directions ? (
            <Text style={styles.directionsText}>{mealData.directions}</Text>
          ) : (
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={() => {
                router.push({
                  pathname: '/add/create-meal/directions',
                  params: {
                    directions: mealData.directions || '',
                    meal: params.meal || 'breakfast',
                    // Pass current meal data to preserve state
                    mealName: mealName,
                    totalCalories: mealData.totalCalories.toString(),
                    items: JSON.stringify(mealData.items),
                    photo: mealData.photo || '',
                  }
                });
              }}
            >
              <Text style={styles.emptyStateText}>Add instructions for making this meal</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {renderFoodSearchModal()}
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#4CAF50',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  saveButton: {
    padding: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  photoSection: {
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    height: 220,
    justifyContent: 'center',
  },
  addPhotoButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  photoIcon: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  addPhotoText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  photoContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
  },
  mealPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  nameInput: {
    fontSize: 16,
    color: '#000',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  shareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareLabel: {
    fontSize: 16,
    color: '#000',
  },
  shareSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shareValue: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  nutritionOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 96,
  },
  caloriesContainer: {
    flexShrink: 0,
  },
  caloriesCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caloriesNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    lineHeight: 32,
    minWidth: 0,
  },
  caloriesLabel: {
    fontSize: 12,
    color: '#666',
    lineHeight: 14,
    textAlign: 'center',
  },
  macrosGrid: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 96,
    paddingVertical: 8,
  },
  macroPercentage: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'center',
    minWidth: 0,
    marginBottom: 6,
  },
  macroAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    lineHeight: 20,
    textAlign: 'center',
    minWidth: 0,
    marginBottom: 6,
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
    lineHeight: 14,
    textAlign: 'center',
    minWidth: 0,
  },
  emptyStateButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#4CAF50',
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  itemCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  itemAmount: {
    fontSize: 14,
    color: '#666',
  },
  itemCalories: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginRight: 12,
  },
  removeItemButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffebee',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  addMoreItemsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  addMoreItemsText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  directionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editButton: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  directionsText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    minWidth: 200,
  },
  shareModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  shareOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  shareOptionText: {
    fontSize: 16,
    color: '#000',
  },
  foodSearchContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  foodSearchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#F2F2F7',
  },
  foodSearchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
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
  foodList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  foodItemContent: {
    flex: 1,
  },
  foodItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  foodItemBrand: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  foodItemNutrition: {
    fontSize: 12,
    color: '#999',
  },
  addFoodButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  headerSpacer: {
    width: 32,
  },
});