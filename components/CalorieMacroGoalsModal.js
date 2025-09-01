/**
 * Calorie & Macro Goals Modal - Quick edit for daily targets
 * 
 * Purpose: Allow users to quickly modify calorie goal and macro percentages
 * Features: Step buttons, real-time gram calculation, validation, presets
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MACRO_PRESETS = [
  { name: 'Balanced', carbs: 50, protein: 20, fat: 30 },
  { name: 'Lower Carb', carbs: 35, protein: 30, fat: 35 },
  { name: 'Higher Protein', carbs: 40, protein: 30, fat: 30 },
];

export default function CalorieMacroGoalsModal({ 
  visible, 
  onClose, 
  currentGoals, 
  onSave 
}) {
  const insets = useSafeAreaInsets();
  
  const [formData, setFormData] = useState({
    calories: currentGoals?.calorie_goal?.toString() || '2000',
    carbPct: currentGoals?.macro_c || 50,
    proteinPct: currentGoals?.macro_p || 20,
    fatPct: currentGoals?.macro_f || 30,
  });
  
  const [initialFormData] = useState({
    calories: currentGoals?.calorie_goal?.toString() || '2000',
    carbPct: currentGoals?.macro_c || 50,
    proteinPct: currentGoals?.macro_p || 20,
    fatPct: currentGoals?.macro_f || 30,
  });
  
  const [hasChanges, setHasChanges] = useState(false);

  // Check for changes
  useEffect(() => {
    const hasFormChanges = Object.keys(formData).some(key => 
      formData[key] !== initialFormData[key]
    );
    setHasChanges(hasFormChanges);
  }, [formData]);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setFormData({
        calories: currentGoals?.calorie_goal?.toString() || '2000',
        carbPct: currentGoals?.macro_c || 50,
        proteinPct: currentGoals?.macro_p || 20,
        fatPct: currentGoals?.macro_f || 30,
      });
    }
  }, [visible, currentGoals]);

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const adjustCalories = (delta) => {
    const current = parseInt(formData.calories) || 0;
    const newValue = Math.max(800, Math.min(5000, current + delta));
    updateFormData('calories', newValue.toString());
  };

  const adjustMacro = (macro, delta) => {
    const current = formData[macro];
    const newValue = Math.max(0, Math.min(100, current + delta));
    updateFormData(macro, newValue);
  };

  const calculateGrams = (macro) => {
    const calories = parseInt(formData.calories) || 0;
    const percentage = formData[macro] || 0;
    
    if (macro === 'fatPct') {
      return Math.round((calories * (percentage / 100)) / 9);
    } else {
      return Math.round((calories * (percentage / 100)) / 4);
    }
  };

  const getTotalPercentage = () => {
    return formData.carbPct + formData.proteinPct + formData.fatPct;
  };

  const getRemainingPercentage = () => {
    return 100 - getTotalPercentage();
  };

  const isValidCalories = () => {
    const calories = parseInt(formData.calories) || 0;
    return calories >= 800 && calories <= 5000;
  };

  const isValidMacros = () => {
    return getTotalPercentage() === 100;
  };

  const canSave = () => {
    return isValidCalories() && isValidMacros();
  };

  const handleClose = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes that will be lost.',
        [
          { text: 'Keep editing', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: onClose
          },
        ]
      );
    } else {
      onClose();
    }
  };

  const handleSave = () => {
    if (!canSave()) {
      if (!isValidCalories()) {
        Alert.alert('Invalid Calories', 'Please enter a calorie goal between 800 and 5000');
      } else if (!isValidMacros()) {
        Alert.alert('Invalid Macros', 'Macro percentages must total 100%');
      }
      return;
    }

    const newGoals = {
      calorie_goal: parseInt(formData.calories),
      macro_c: formData.carbPct,
      macro_p: formData.proteinPct,
      macro_f: formData.fatPct,
    };

    onSave(newGoals);
    onClose();
    
    Alert.alert('Success', 'Goals updated');
  };

  const applyPreset = (preset) => {
    setFormData(prev => ({
      ...prev,
      carbPct: preset.carbs,
      proteinPct: preset.protein,
      fatPct: preset.fat,
    }));
  };

  const renderCaloriesSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Calories</Text>
      
      <View style={styles.caloriesContainer}>
        <TouchableOpacity 
          style={styles.stepButton}
          onPress={() => adjustCalories(-50)}
        >
          <Ionicons name="remove" size={20} color="#666" />
        </TouchableOpacity>
        
        <View style={styles.caloriesInputContainer}>
          <TextInput
            style={styles.caloriesInput}
            value={formData.calories}
            onChangeText={(text) => updateFormData('calories', text)}
            placeholder="Enter daily kcal"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
          <Text style={styles.caloriesUnit}>kcal</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.stepButton}
          onPress={() => adjustCalories(50)}
        >
          <Ionicons name="add" size={20} color="#666" />
        </TouchableOpacity>
      </View>
      
      {!isValidCalories() && (
        <Text style={styles.errorText}>
          Calories must be between 800 and 5000
        </Text>
      )}
    </View>
  );

  const renderMacrosSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Macros</Text>
      
      {/* Quick Presets */}
      <View style={styles.presetsContainer}>
        <Text style={styles.presetsLabel}>Quick presets</Text>
        <View style={styles.presetButtons}>
          {MACRO_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.name}
              style={styles.presetButton}
              onPress={() => applyPreset(preset)}
            >
              <Text style={styles.presetButtonText}>{preset.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Macro Inputs */}
      <View style={styles.macroInputs}>
        {/* Carbs */}
        <View style={styles.macroRow}>
          <Text style={styles.macroLabel}>Carbs</Text>
          <View style={styles.macroControls}>
            <TouchableOpacity 
              style={styles.macroStepButton}
              onPress={() => adjustMacro('carbPct', -1)}
            >
              <Ionicons name="remove" size={16} color="#666" />
            </TouchableOpacity>
            
            <View style={styles.macroValueContainer}>
              <Text style={styles.macroPercentage}>{formData.carbPct}%</Text>
              <Text style={styles.macroGrams}>{calculateGrams('carbPct')}g</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.macroStepButton}
              onPress={() => adjustMacro('carbPct', 1)}
            >
              <Ionicons name="add" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Protein */}
        <View style={styles.macroRow}>
          <Text style={styles.macroLabel}>Protein</Text>
          <View style={styles.macroControls}>
            <TouchableOpacity 
              style={styles.macroStepButton}
              onPress={() => adjustMacro('proteinPct', -1)}
            >
              <Ionicons name="remove" size={16} color="#666" />
            </TouchableOpacity>
            
            <View style={styles.macroValueContainer}>
              <Text style={styles.macroPercentage}>{formData.proteinPct}%</Text>
              <Text style={styles.macroGrams}>{calculateGrams('proteinPct')}g</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.macroStepButton}
              onPress={() => adjustMacro('proteinPct', 1)}
            >
              <Ionicons name="add" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Fat */}
        <View style={styles.macroRow}>
          <Text style={styles.macroLabel}>Fat</Text>
          <View style={styles.macroControls}>
            <TouchableOpacity 
              style={styles.macroStepButton}
              onPress={() => adjustMacro('fatPct', -1)}
            >
              <Ionicons name="remove" size={16} color="#666" />
            </TouchableOpacity>
            
            <View style={styles.macroValueContainer}>
              <Text style={styles.macroPercentage}>{formData.fatPct}%</Text>
              <Text style={styles.macroGrams}>{calculateGrams('fatPct')}g</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.macroStepButton}
              onPress={() => adjustMacro('fatPct', 1)}
            >
              <Ionicons name="add" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Remaining Percentage */}
      <View style={styles.remainingContainer}>
        <Text style={[
          styles.remainingText,
          getRemainingPercentage() !== 0 && styles.remainingTextError
        ]}>
          Remaining %: {getRemainingPercentage()}%
        </Text>
        {getRemainingPercentage() !== 0 && (
          <Text style={styles.macroErrorText}>
            Please make the three items total 100%
          </Text>
        )}
      </View>
    </View>
  );

  const renderBottomActions = () => (
    <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
      <TouchableOpacity 
        style={styles.cancelButton}
        onPress={handleClose}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.saveButton,
          !canSave() && styles.saveButtonDisabled
        ]}
        onPress={handleSave}
        disabled={!canSave()}
      >
        <Text style={[
          styles.saveButtonText,
          !canSave() && styles.saveButtonTextDisabled
        ]}>
          Save
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Calorie & Macro Goals</Text>
          
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {renderCaloriesSection()}
          {renderMacrosSection()}
        </View>

        {renderBottomActions()}
      </KeyboardAvoidingView>
    </Modal>
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
  closeButton: {
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
  
  // Calories Section
  caloriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caloriesInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  caloriesInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  caloriesUnit: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Presets Section
  presetsContainer: {
    marginBottom: 20,
  },
  presetsLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 12,
  },
  presetButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
    textAlign: 'center',
  },
  
  // Macros Section
  macroInputs: {
    gap: 16,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  macroLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    width: 80,
  },
  macroControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  macroStepButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroValueContainer: {
    alignItems: 'center',
    minWidth: 80,
  },
  macroPercentage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  macroGrams: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  remainingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  remainingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  remainingTextError: {
    color: '#FF3B30',
  },
  macroErrorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Bottom Actions
  bottomContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  saveButtonTextDisabled: {
    color: '#8E8E93',
  },
});