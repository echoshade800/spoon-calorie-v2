/**
 * Create Custom Exercise Screen
 * 
 * Purpose: Allow users to create custom exercises with custom MET values
 * Features: Name input, category selection, MET configuration, validation
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
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CATEGORIES = [
  { value: 'cardio', label: 'Cardio', defaultMet: 7.0 },
  { value: 'strength', label: 'Strength', defaultMet: 6.0 },
];

export default function CustomExerciseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  const [formData, setFormData] = useState({
    name: '',
    category: params.category || 'cardio',
    met: params.category === 'strength' ? '6.0' : '7.0',
    notes: '',
  });
  
  const [initialFormData] = useState({
    name: '',
    category: params.category || 'cardio',
    met: params.category === 'strength' ? '6.0' : '7.0',
    notes: '',
  });
  
  const [hasChanges, setHasChanges] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  
  const nameInputRef = useRef(null);

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

  // Update MET when category changes
  useEffect(() => {
    const category = CATEGORIES.find(c => c.value === formData.category);
    if (category) {
      setFormData(prev => ({ ...prev, met: category.defaultMet.toString() }));
    }
  }, [formData.category]);

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes that will be lost.',
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
    
    if (!formData.name.trim()) {
      errors.push('Exercise name is required');
    } else if (formData.name.length > 100) {
      errors.push('Exercise name must be 100 characters or less');
    }
    
    const met = parseFloat(formData.met);
    if (isNaN(met) || met < 1 || met > 20) {
      errors.push('MET value must be between 1 and 20');
    }
    
    return errors;
  };

  const handleSave = () => {
    const validationErrors = validateForm();
    
    if (validationErrors.length > 0) {
      Alert.alert('Validation Error', validationErrors[0]);
      return;
    }

    // Navigate to exercise details with custom exercise data
    router.replace({
      pathname: '/exercise/details',
      params: {
        exerciseId: `custom_${Date.now()}`,
        exerciseName: formData.name.trim(),
        exerciseMet: formData.met,
        exerciseCategory: formData.category,
        isCustom: 'true',
      }
    });
  };

  const renderCategorySelector = () => (
    <Modal visible={showCategorySelector} transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.categoryModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity onPress={() => setShowCategorySelector(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.value}
              style={styles.categoryOption}
              onPress={() => {
                updateFormData('category', category.value);
                setShowCategorySelector(false);
              }}
            >
              <Text style={styles.categoryOptionText}>{category.label}</Text>
              <Text style={styles.categoryDefaultMet}>Default MET: {category.defaultMet}</Text>
              {formData.category === category.value && (
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
        
        <Text style={styles.headerTitle}>Create Exercise</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {/* Exercise Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Exercise Name *</Text>
          <TextInput
            ref={nameInputRef}
            style={styles.textInput}
            value={formData.name}
            onChangeText={(text) => updateFormData('name', text)}
            placeholder="e.g., Mountain Biking"
            placeholderTextColor="#999"
            maxLength={100}
          />
        </View>
        
        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Category</Text>
          <TouchableOpacity 
            style={styles.categorySelector}
            onPress={() => setShowCategorySelector(true)}
          >
            <Text style={styles.categorySelectorText}>
              {CATEGORIES.find(c => c.value === formData.category)?.label}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* MET Value */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>MET Value (optional)</Text>
          <TextInput
            style={styles.textInput}
            value={formData.met}
            onChangeText={(text) => updateFormData('met', text)}
            placeholder="6.0"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
          <Text style={styles.metHint}>
            Metabolic Equivalent of Task. Higher values = more calories burned.
            {'\n'}Cardio default: 7.0 • Strength default: 6.0
          </Text>
        </View>

        {/* Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Notes (optional)</Text>
          <TextInput
            style={[styles.textInput, styles.notesInput]}
            value={formData.notes}
            onChangeText={(text) => updateFormData('notes', text)}
            placeholder="Add any notes about this exercise..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      {/* Bottom Save Button */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity 
          style={[
            styles.saveButton,
            !formData.name.trim() && styles.saveButtonDisabled
          ]}
          onPress={handleSave}
          disabled={!formData.name.trim()}
        >
          <Text style={[
            styles.saveButtonText,
            !formData.name.trim() && styles.saveButtonTextDisabled
          ]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>

      {renderCategorySelector()}
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
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
  },
  categorySelectorText: {
    fontSize: 16,
    color: '#000',
  },
  metHint: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryModal: {
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
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  categoryDefaultMet: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
});