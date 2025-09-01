/**
 * Log Meal Screen - Final review and logging of scanned meal
 * 
 * Purpose: Final confirmation before logging all items to diary
 * Features: Item review, total calories, log to diary, save as custom meal
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/stores/useAppStore';
import { getMealDisplayName } from '@/utils/helpers';

export default function LogMealScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  const { addDiaryEntry, selectedDate } = useAppStore();
  
  const [isLogging, setIsLogging] = useState(false);
  
  const selectedMeal = params.meal || 'breakfast';
  const items = params.items ? JSON.parse(params.items) : [];

  const getTotalCalories = () => {
    return items.reduce((total, item) => {
      const multiplier = item.servings * (item.selectedUnit.grams / 100);
      return total + Math.round(item.calories * multiplier);
    }, 0);
  };

  const getTotalMacros = () => {
    return items.reduce((totals, item) => {
      const multiplier = item.servings * (item.selectedUnit.grams / 100);
      return {
        carbs: totals.carbs + (item.macros.carbs * multiplier),
        protein: totals.protein + (item.macros.protein * multiplier),
        fat: totals.fat + (item.macros.fat * multiplier),
      };
    }, { carbs: 0, protein: 0, fat: 0 });
  };

  const handleLogMeal = async () => {
    if (items.length === 0) {
      Alert.alert('No Items', 'Please add at least one food item to log.');
      return;
    }

    setIsLogging(true);

    try {
      // Add each item as a separate diary entry
      for (const item of items) {
        const multiplier = item.servings * (item.selectedUnit.grams / 100);
        const adjustedCalories = Math.round(item.calories * multiplier);
        const adjustedMacros = {
          carbs: Math.round(item.macros.carbs * multiplier * 10) / 10,
          protein: Math.round(item.macros.protein * multiplier * 10) / 10,
          fat: Math.round(item.macros.fat * multiplier * 10) / 10,
        };

        const entry = {
          date: selectedDate,
          meal_type: selectedMeal,
          food_id: item.id,
          food_name: item.name,
          custom_name: null,
          amount: item.servings,
          unit: item.selectedUnit.label,
          source: item.source || 'scan',
          kcal: adjustedCalories,
          carbs: adjustedMacros.carbs,
          protein: adjustedMacros.protein,
          fat: adjustedMacros.fat,
        };

        addDiaryEntry(entry);
      }

      // Success feedback
      Alert.alert(
        'Meal Logged!',
        `${items.length} items added to ${getMealDisplayName(selectedMeal)} · ${getTotalCalories()} kcal`,
        [
          { 
            text: 'View Diary', 
            onPress: () => router.replace('/diary')
          },
          { 
            text: 'Add More', 
            onPress: () => router.replace('/add')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to log meal. Please try again.');
    } finally {
      setIsLogging(false);
    }
  };

  const handleSaveAsMeal = () => {
    router.push({
      pathname: '/scan/save-meal',
      params: {
        meal: selectedMeal,
        items: JSON.stringify(items),
      }
    });
  };

  const removeItem = (itemId) => {
    const updatedItems = items.filter(item => item.id !== itemId);
    
    if (updatedItems.length === 0) {
      router.back();
      return;
    }

    // Update params and re-render
    router.setParams({
      items: JSON.stringify(updatedItems)
    });
  };

  const totalCalories = getTotalCalories();
  const totalMacros = getTotalMacros();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Review Meal</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* Meal Summary */}
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>
          {getMealDisplayName(selectedMeal)} • {items.length} items
        </Text>
        
        <View style={styles.nutritionSummary}>
          <View style={styles.caloriesContainer}>
            <Text style={styles.totalCalories}>{totalCalories}</Text>
            <Text style={styles.caloriesLabel}>calories</Text>
          </View>
          
          <View style={styles.macrosContainer}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{Math.round(totalMacros.carbs)}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{Math.round(totalMacros.protein)}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{Math.round(totalMacros.fat)}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Items List */}
      <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
        {items.map((item) => {
          const multiplier = item.servings * (item.selectedUnit.grams / 100);
          const adjustedCalories = Math.round(item.calories * multiplier);
          
          return (
            <View key={item.id} style={styles.reviewItem}>
              <View style={styles.reviewItemContent}>
                <Text style={styles.reviewItemName}>{item.name}</Text>
                <Text style={styles.reviewItemDetails}>
                  {adjustedCalories} cal, {item.servings} × {item.selectedUnit.label}
                  {item.confidence < 0.7 && ' • detected'}
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.removeItemButton}
                onPress={() => removeItem(item.id)}
              >
                <Ionicons name="close" size={18} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity 
          style={styles.saveAsMealButton}
          onPress={handleSaveAsMeal}
        >
          <Text style={styles.saveAsMealButtonText}>Save as My Meal</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.logButton, isLogging && styles.logButtonDisabled]}
          onPress={handleLogMeal}
          disabled={isLogging}
        >
          <Text style={[styles.logButtonText, isLogging && styles.logButtonTextDisabled]}>
            {isLogging ? 'Logging...' : 'Log Meal'}
          </Text>
        </TouchableOpacity>
      </View>
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
  headerSpacer: {
    width: 32,
  },
  summarySection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  nutritionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  caloriesContainer: {
    alignItems: 'center',
    marginRight: 32,
  },
  totalCalories: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4CAF50',
  },
  caloriesLabel: {
    fontSize: 14,
    color: '#666',
  },
  macrosContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    fontSize: 12,
    color: '#666',
  },
  itemsList: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reviewItemContent: {
    flex: 1,
  },
  reviewItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  reviewItemDetails: {
    fontSize: 14,
    color: '#666',
  },
  removeItemButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 12,
  },
  saveAsMealButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveAsMealButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    textAlign: 'center',
  },
  logButton: {
    flex: 2,
    paddingVertical: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  logButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  logButtonTextDisabled: {
    color: '#8E8E93',
  },
});