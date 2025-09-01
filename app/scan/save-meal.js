/**
 * Save as My Meal Screen - Save scanned meal as reusable template
 * 
 * Purpose: Allow users to save detected meal combinations for future quick logging
 * Features: Meal naming, photo attachment, save to My Meals collection
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/stores/useAppStore';
import { getMealDisplayName } from '@/utils/helpers';

export default function SaveMealScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const nameInputRef = useRef(null);
  
  const { addMyMeal } = useAppStore();
  
  const [mealName, setMealName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const selectedMeal = params.meal || 'breakfast';
  const items = params.items ? JSON.parse(params.items) : [];

  useEffect(() => {
    // Auto-focus name input
    const timer = setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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

  const handleSave = async () => {
    if (!mealName.trim()) {
      Alert.alert('Meal Name Required', 'Please enter a name for this meal.');
      return;
    }

    setIsSaving(true);

    try {
      const totalMacros = getTotalMacros();
      
      const newMeal = {
        id: Date.now().toString(),
        name: mealName.trim(),
        photo: params.photoUri || null,
        totalKcal: getTotalCalories(),
        totalCarbs: Math.round(totalMacros.carbs * 10) / 10,
        totalProtein: Math.round(totalMacros.protein * 10) / 10,
        totalFat: Math.round(totalMacros.fat * 10) / 10,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          amount: item.servings,
          unit: item.selectedUnit.label,
          calories: Math.round(item.calories * item.servings * (item.selectedUnit.grams / 100)),
          carbs: Math.round(item.macros.carbs * item.servings * (item.selectedUnit.grams / 100) * 10) / 10,
          protein: Math.round(item.macros.protein * item.servings * (item.selectedUnit.grams / 100) * 10) / 10,
          fat: Math.round(item.macros.fat * item.servings * (item.selectedUnit.grams / 100) * 10) / 10,
        })),
        source: 'meal_scan',
        createdAt: new Date().toISOString(),
      };

      addMyMeal(newMeal);
      
      Alert.alert(
        'Meal Saved!',
        `"${mealName}" has been saved to My Meals`,
        [
          { 
            text: 'View My Meals', 
            onPress: () => router.replace('/(tabs)/add?tab=meals')
          },
          { 
            text: 'Continue Logging', 
            onPress: () => router.push({
              pathname: '/scan/log',
              params: {
                meal: selectedMeal,
                items: JSON.stringify(items),
              }
            })
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save meal. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const totalCalories = getTotalCalories();
  const totalMacros = getTotalMacros();

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Save as My Meal</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Meal Name Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meal Name</Text>
          <TextInput
            ref={nameInputRef}
            style={styles.nameInput}
            value={mealName}
            onChangeText={setMealName}
            placeholder="Enter a name for this meal"
            placeholderTextColor="#999"
            maxLength={100}
          />
        </View>

        {/* Nutrition Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition Summary</Text>
          
          <View style={styles.nutritionCard}>
            <View style={styles.caloriesDisplay}>
              <Text style={styles.caloriesNumber}>{totalCalories}</Text>
              <Text style={styles.caloriesUnit}>calories</Text>
            </View>
            
            <View style={styles.macrosDisplay}>
              <View style={styles.macroDisplayItem}>
                <Text style={styles.macroDisplayValue}>{Math.round(totalMacros.carbs)}g</Text>
                <Text style={styles.macroDisplayLabel}>Carbs</Text>
              </View>
              
              <View style={styles.macroDisplayItem}>
                <Text style={styles.macroDisplayValue}>{Math.round(totalMacros.protein)}g</Text>
                <Text style={styles.macroDisplayLabel}>Protein</Text>
              </View>
              
              <View style={styles.macroDisplayItem}>
                <Text style={styles.macroDisplayValue}>{Math.round(totalMacros.fat)}g</Text>
                <Text style={styles.macroDisplayLabel}>Fat</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Items Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items ({items.length})</Text>
          
          {items.map((item) => {
            const multiplier = item.servings * (item.selectedUnit.grams / 100);
            const adjustedCalories = Math.round(item.calories * multiplier);
            
            return (
              <View key={item.id} style={styles.previewItem}>
                <Text style={styles.previewItemName}>{item.name}</Text>
                <Text style={styles.previewItemDetails}>
                  {adjustedCalories} cal • {item.servings} × {item.selectedUnit.label}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Save Button */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity 
          style={[
            styles.saveButton,
            (!mealName.trim() || isSaving) && styles.saveButtonDisabled
          ]}
          onPress={handleSave}
          disabled={!mealName.trim() || isSaving}
        >
          <Text style={[
            styles.saveButtonText,
            (!mealName.trim() || isSaving) && styles.saveButtonTextDisabled
          ]}>
            {isSaving ? 'Saving...' : 'Save Meal'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  nameInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
  },
  nutritionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FFF8',
    borderRadius: 12,
    padding: 20,
  },
  caloriesDisplay: {
    alignItems: 'center',
    marginRight: 32,
  },
  caloriesNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4CAF50',
  },
  caloriesUnit: {
    fontSize: 14,
    color: '#666',
  },
  macrosDisplay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroDisplayItem: {
    alignItems: 'center',
  },
  macroDisplayValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  macroDisplayLabel: {
    fontSize: 12,
    color: '#666',
  },
  previewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  previewItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  previewItemDetails: {
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
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  saveButtonTextDisabled: {
    color: '#8E8E93',
  },
});