/**
 * Quick Add Screen - Fast calorie logging with optional macros
 * 
 * Purpose: Extremely fast recording of free-input calories (optionally with macros) 
 * directly into today's Diary for specified meal
 * Features: Meal selection, calorie input, optional macros, soft validation
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  StatusBar,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { useAppStore } from '@/stores/useAppStore';
import { getMealDisplayName } from '@/utils/helpers';

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

export default function QuickAddScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { addDiaryEntry, selectedDate } = useAppStore();
  
  // Form state
  const [formData, setFormData] = useState({
    meal: params.meal || 'breakfast',
    calories: '',
    carbs: '',
    protein: '',
    fat: '',
  });
  
  const [initialFormData] = useState({
    meal: params.meal || 'breakfast',
    calories: '',
    carbs: '',
    protein: '',
    fat: '',
  });
  
  const [hasChanges, setHasChanges] = useState(false);
  const [showMealSelector, setShowMealSelector] = useState(false);
  
  // Refs for input focus
  const caloriesInputRef = useRef(null);
  const carbsInputRef = useRef(null);
  const proteinInputRef = useRef(null);
  const fatInputRef = useRef(null);

  // Check for changes
  useEffect(() => {
    const hasFormChanges = Object.keys(formData).some(key => 
      formData[key] !== initialFormData[key]
    );
    setHasChanges(hasFormChanges);
  }, [formData]);

  // Auto-focus calories input
  useEffect(() => {
    const timer = setTimeout(() => {
      caloriesInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard changes?',
        '',
        [
          { text: 'Keep editing', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => router.back()
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const validateForm = () => {
    const errors = [];
    
    // Required fields
    if (!formData.calories.trim()) {
      errors.push('Calories is required');
    } else {
      const calories = parseFloat(formData.calories);
      if (isNaN(calories) || calories < 0) {
        errors.push('Calories must be 0 or greater');
      }
    }
    
    // Optional field validation
    if (formData.carbs && (isNaN(parseFloat(formData.carbs)) || parseFloat(formData.carbs) < 0)) {
      errors.push('Carbs must be 0 or greater');
    }
    if (formData.protein && (isNaN(parseFloat(formData.protein)) || parseFloat(formData.protein) < 0)) {
      errors.push('Protein must be 0 or greater');
    }
    if (formData.fat && (isNaN(parseFloat(formData.fat)) || parseFloat(formData.fat) < 0)) {
      errors.push('Fat must be 0 or greater');
    }
    
    return errors;
  };

  const checkMacroCalorieMatch = () => {
    const calories = parseFloat(formData.calories) || 0;
    const carbs = parseFloat(formData.carbs) || 0;
    const protein = parseFloat(formData.protein) || 0;
    const fat = parseFloat(formData.fat) || 0;
    
    // Only check if macros are provided
    if (carbs === 0 && protein === 0 && fat === 0) {
      return { matches: true };
    }
    
    const calculatedCalories = (carbs * 4) + (protein * 4) + (fat * 9);
    const difference = Math.abs(calories - calculatedCalories);
    const percentageDiff = calories > 0 ? (difference / calories) * 100 : 0;
    
    return {
      matches: percentageDiff <= 15,
      difference: Math.round(difference),
      calculatedCalories: Math.round(calculatedCalories),
    };
  };

  const handleSave = () => {
    const validationErrors = validateForm();
    
    if (validationErrors.length > 0) {
      Alert.alert('Validation Error', validationErrors[0]);
      return;
    }

    // Check macro-calorie match
    const macroCheck = checkMacroCalorieMatch();
    
    if (!macroCheck.matches) {
      Alert.alert(
        'Calories don\'t match macros',
        `Entered calories differ from macro-based calories by ~${macroCheck.difference} kcal.`,
        [
          { text: 'Edit', style: 'cancel' },
          { text: 'Keep anyway', onPress: () => saveEntry() },
        ]
      );
      return;
    }
    
    saveEntry();
  };

  const saveEntry = () => {
    try {
      const entry = {
        id: Date.now().toString(),
        date: selectedDate,
        meal_type: formData.meal,
        food_id: null,
        food_name: 'Quick Add Entry',
        custom_name: null,
        amount: 1,
        unit: 'serving',
        source: 'quick_add',
        kcal: parseFloat(formData.calories),
        carbs: formData.carbs ? parseFloat(formData.carbs) : 0,
        protein: formData.protein ? parseFloat(formData.protein) : 0,
        fat: formData.fat ? parseFloat(formData.fat) : 0,
        created_at: new Date().toISOString(),
      };

      addDiaryEntry(entry);
      
      // Success feedback
      Alert.alert(
        'Success',
        `Added to ${getMealDisplayName(formData.meal)}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Save failed, please try again.');
    }
  };

  const renderMealSelector = () => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Meal</Text>
      <TouchableOpacity 
        style={styles.mealSelector}
        onPress={() => setShowMealSelector(true)}
      >
        <Text style={styles.mealSelectorText}>
          {getMealDisplayName(formData.meal)}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#666" />
      </TouchableOpacity>
    </View>
  );

  const renderMealSelectorModal = () => (
    <Modal visible={showMealSelector} transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.mealSelectorModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Meal</Text>
            <TouchableOpacity onPress={() => setShowMealSelector(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          {MEAL_TYPES.map((meal) => (
            <TouchableOpacity
              key={meal.value}
              style={styles.mealOption}
              onPress={() => {
                updateFormData('meal', meal.value);
                setShowMealSelector(false);
              }}
            >
              <Text style={styles.mealOptionText}>{meal.label}</Text>
              {formData.meal === meal.value && (
                <Ionicons name="checkmark" size={20} color="#4CAF50" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Quick Add</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {/* Meal Selection */}
        {renderMealSelector()}
        
        {/* Calories Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Calories (kcal) *</Text>
          <TextInput
            ref={caloriesInputRef}
            style={styles.textInput}
            value={formData.calories}
            onChangeText={(text) => updateFormData('calories', text)}
            placeholder="Enter calorie amount"
            placeholderTextColor="#999"
            keyboardType="numeric"
            returnKeyType="next"
            onSubmitEditing={() => carbsInputRef.current?.focus()}
          />
        </View>
        
        {/* Macros Section */}
        <View style={styles.macrosContainer}>
          <Text style={styles.inputLabel}>Macros (optional)</Text>
          
          <View style={styles.macroInputs}>
            <View style={styles.macroInput}>
              <Text style={styles.macroLabel}>Carbs (g)</Text>
              <TextInput
                ref={carbsInputRef}
                style={styles.textInput}
                value={formData.carbs}
                onChangeText={(text) => updateFormData('carbs', text)}
                placeholder="e.g., 25"
                placeholderTextColor="#999"
                keyboardType="numeric"
                returnKeyType="next"
                onSubmitEditing={() => proteinInputRef.current?.focus()}
              />
            </View>
            
            <View style={styles.macroInput}>
              <Text style={styles.macroLabel}>Protein (g)</Text>
              <TextInput
                ref={proteinInputRef}
                style={styles.textInput}
                value={formData.protein}
                onChangeText={(text) => updateFormData('protein', text)}
                placeholder="e.g., 25"
                placeholderTextColor="#999"
                keyboardType="numeric"
                returnKeyType="next"
                onSubmitEditing={() => fatInputRef.current?.focus()}
              />
            </View>
            
            <View style={styles.macroInput}>
              <Text style={styles.macroLabel}>Fat (g)</Text>
              <TextInput
                ref={fatInputRef}
                style={styles.textInput}
                value={formData.fat}
                onChangeText={(text) => updateFormData('fat', text)}
                placeholder="e.g., 25"
                placeholderTextColor="#999"
                keyboardType="numeric"
                returnKeyType="done"
              />
            </View>
          </View>
          
          <Text style={styles.macroHint}>
            We'll compare kcal ≈ 4C + 4P + 9F
          </Text>
        </View>
      </View>

      {/* Bottom Save Button */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity 
          style={[
            styles.saveButton,
            !formData.calories.trim() && styles.saveButtonDisabled
          ]}
          onPress={handleSave}
          disabled={!formData.calories.trim()}
        >
          <Text style={[
            styles.saveButtonText,
            !formData.calories.trim() && styles.saveButtonTextDisabled
          ]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      {renderMealSelectorModal()}
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
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
  },
  mealSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
  },
  mealSelectorText: {
    fontSize: 16,
    color: '#000',
  },
  macrosContainer: {
    marginTop: 8,
  },
  macroInputs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  macroInput: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 6,
  },
  macroHint: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  saveButton: {
    backgroundColor: '#22C55E',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealSelectorModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 0,
    width: '80%',
    maxWidth: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  mealOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mealOptionText: {
    fontSize: 16,
    color: '#000',
  },
});