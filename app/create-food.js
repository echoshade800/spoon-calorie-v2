/**
 * Create Food Screen - Custom food creation with validation
 * 
 * Purpose: 10-second custom food template creation with minimal required fields
 * Features: Name + calories required, optional macros/serving info, validation
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
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/stores/useAppStore';

export default function CreateFoodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { addMyFood } = useAppStore();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    calories: '',
    carbs: '',
    protein: '',
    fat: '',
    servingLabel: '',
    gramsPerServing: '',
    brand: '',
  });
  
  const [initialFormData] = useState({
    name: '',
    calories: '',
    carbs: '',
    protein: '',
    fat: '',
    servingLabel: '',
    gramsPerServing: '',
    brand: '',
  });
  
  // UI state
  const [showServingSection, setShowServingSection] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Refs for input focus
  const nameInputRef = useRef(null);
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

  // Auto-focus name input
  useEffect(() => {
    const timer = setTimeout(() => {
      nameInputRef.current?.focus();
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
    if (!formData.name.trim()) {
      errors.push('Food name is required');
    } else if (formData.name.length > 120) {
      errors.push('Food name must be 120 characters or less');
    }
    
    if (!formData.calories.trim()) {
      errors.push('Calories per serving is required');
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
    if (formData.gramsPerServing && (isNaN(parseFloat(formData.gramsPerServing)) || parseFloat(formData.gramsPerServing) < 0)) {
      errors.push('Grams per serving must be 0 or greater');
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
          { text: 'Keep anyway', onPress: () => saveFood() },
        ]
      );
      return;
    }
    
    saveFood();
  };

  const saveFood = async () => {
    try {
      console.log('Starting to save food...');
      console.log('Form data being saved:', formData);
      
      const foodData = {
        name: formData.name.trim(),
        brand: formData.brand.trim() || null,
        kcal_per_100g: parseFloat(formData.calories),
        carbs_per_100g: formData.carbs ? parseFloat(formData.carbs) : 0,
        protein_per_100g: formData.protein ? parseFloat(formData.protein) : 0,
        fat_per_100g: formData.fat ? parseFloat(formData.fat) : 0,
        serving_label: formData.servingLabel.trim() || undefined,
        grams_per_serving: formData.gramsPerServing ? parseFloat(formData.gramsPerServing) : undefined,
        category: 'Custom',
      };

      console.log('Food data to save:', foodData);
      
      // Validate data before sending to store
      if (!foodData.name) {
        throw new Error('Food name is required');
      }
      if (isNaN(foodData.kcal_per_100g) || foodData.kcal_per_100g < 0) {
        throw new Error('Valid calories per 100g is required');
      }
      
      console.log('Data validation passed, calling addMyFood...');
      await addMyFood(foodData);
      console.log('Food saved successfully');
      
      // Success feedback
      Alert.alert(
        'Success',
        'Saved to My Foods',
        [{ 
          text: 'OK', 
          onPress: () => {
            // Return to the appropriate tab based on where user came from
            if (params.returnTo === 'my-foods') {
              router.replace('/(tabs)/add?tab=foods');
            } else {
              router.replace('/(tabs)/add?tab=foods');
            }
          }
        }]
      );
    } catch (error) {
      console.error('Save food error - Full details:', {
        error: error.message,
        stack: error.stack,
        formData: formData
      });
      
      // Show more specific error message
      const errorMessage = error.message || 'Save failed, please try again.';
      Alert.alert('Error', `Save failed: ${errorMessage}`);
    }
  };

  const getCalculatedCalories = () => {
    const carbs = parseFloat(formData.carbs) || 0;
    const protein = parseFloat(formData.protein) || 0;
    const fat = parseFloat(formData.fat) || 0;
    return Math.round((carbs * 4) + (protein * 4) + (fat * 9));
  };

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
        
        <Text style={styles.headerTitle}>Create a Food</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Info</Text>
          
          {/* Food Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Food name *</Text>
            <TextInput
              ref={nameInputRef}
              style={styles.textInput}
              value={formData.name}
              onChangeText={(text) => updateFormData('name', text)}
              placeholder="e.g., Chicken soup"
              placeholderTextColor="#999"
              maxLength={120}
              returnKeyType="next"
              onSubmitEditing={() => caloriesInputRef.current?.focus()}
            />
          </View>
          
          {/* Calories */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Calories (kcal) per serving *</Text>
            <TextInput
              ref={caloriesInputRef}
              style={styles.textInput}
              value={formData.calories}
              onChangeText={(text) => updateFormData('calories', text)}
              placeholder="e.g., 200"
              placeholderTextColor="#999"
              keyboardType="numeric"
              returnKeyType="next"
              onSubmitEditing={() => carbsInputRef.current?.focus()}
            />
          </View>
          
          {/* Macros */}
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
                  placeholder="0"
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
                  placeholder="0"
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
                  placeholder="0"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  returnKeyType="done"
                />
              </View>
            </View>
            
            <Text style={styles.macroHint}>
              We'll compare kcal ≈ 4C + 4P + 9F
              {(formData.carbs || formData.protein || formData.fat) && (
                <Text style={styles.calculatedCalories}>
                  {' '}(≈ {getCalculatedCalories()} kcal)
                </Text>
              )}
            </Text>
          </View>
        </View>

        {/* Serving Section (Collapsible) */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.collapsibleHeader}
            onPress={() => setShowServingSection(!showServingSection)}
          >
            <Text style={styles.sectionTitle}>Serving (optional)</Text>
            <Ionicons 
              name={showServingSection ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
          
          {showServingSection && (
            <View style={styles.collapsibleContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Serving label</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.servingLabel}
                  onChangeText={(text) => updateFormData('servingLabel', text)}
                  placeholder="e.g., 1 cup"
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Grams per serving (g)</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.gramsPerServing}
                  onChangeText={(text) => updateFormData('gramsPerServing', text)}
                  placeholder="e.g., 240"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
              
              <Text style={styles.servingHint}>
                Used as the default unit when adding this food later.
              </Text>
            </View>
          )}
        </View>

        {/* More Options Section (Collapsible) */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.collapsibleHeader}
            onPress={() => setShowMoreOptions(!showMoreOptions)}
          >
            <Text style={styles.sectionTitle}>More options</Text>
            <Ionicons 
              name={showMoreOptions ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
          
          {showMoreOptions && (
            <View style={styles.collapsibleContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Brand (optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.brand}
                  onChangeText={(text) => updateFormData('brand', text)}
                  placeholder="e.g., Campbell's"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          )}
        </View>

        {/* Bottom padding for keyboard */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Save Button */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity 
          style={[
            styles.saveButton,
            (!formData.name.trim() || !formData.calories.trim()) && styles.saveButtonDisabled
          ]}
          onPress={handleSave}
          disabled={!formData.name.trim() || !formData.calories.trim()}
        >
          <Text style={[
            styles.saveButtonText,
            (!formData.name.trim() || !formData.calories.trim()) && styles.saveButtonTextDisabled
          ]}>
            Save
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
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  collapsibleContent: {
    marginTop: 0,
  },
  inputGroup: {
    marginBottom: 16,
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
  calculatedCalories: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  servingHint: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 8,
  },
  bottomPadding: {
    height: 100,
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
  barcodeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  barcodeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  barcodeBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  barcodeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
});