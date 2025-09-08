/**
 * Exercise Details Screen - Configure exercise parameters before saving
 * 
 * Purpose: Set duration, intensity, and other parameters for selected exercise
 * Features: Real-time calorie calculation, date/time selection, notes
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
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/stores/useAppStore';

const INTENSITY_VARIANTS = {
  'Walking, 3.0 mph': [
    { label: 'Walking, 2.0 mph', met: 2.3 },
    { label: 'Walking, 3.0 mph', met: 3.3 },
    { label: 'Walking, 4.0 mph', met: 4.3 },
  ],
  'Running, 6.0 mph': [
    { label: 'Running, 5.0 mph', met: 8.3 },
    { label: 'Running, 6.0 mph', met: 9.8 },
    { label: 'Running, 7.0 mph', met: 11.0 },
    { label: 'Running, 8.0 mph', met: 11.8 },
  ],
  'Cycling, moderate': [
    { label: 'Cycling, light effort', met: 5.8 },
    { label: 'Cycling, moderate', met: 7.5 },
    { label: 'Cycling, vigorous effort', met: 12.0 },
  ],
};

export default function ExerciseDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { profile, addExerciseEntry, selectedDate } = useAppStore();
  
  const [formData, setFormData] = useState({
    name: params.exerciseName || '',
    category: params.exerciseCategory || 'cardio',
    met: parseFloat(params.exerciseMet) || 6.0,
    date: selectedDate,
    time: '',
    duration: '',
    distance: '',
    sets: '',
    reps: '',
    weight: '',
    notes: '',
  });
  
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showIntensitySelector, setShowIntensitySelector] = useState(false);
  const [calculatedCalories, setCalculatedCalories] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const durationInputRef = useRef(null);

  // Auto-focus duration input
  useEffect(() => {
    const timer = setTimeout(() => {
      durationInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Calculate calories in real-time
  useEffect(() => {
    const duration = parseFloat(formData.duration) || 0;
    const userWeight = profile?.weight_kg || 70; // Default 70kg if not set
    const met = selectedVariant?.met || formData.met;
    
    if (duration > 0) {
      const calories = Math.round(met * userWeight * (duration / 60));
      setCalculatedCalories(calories);
    } else {
      setCalculatedCalories(0);
    }
  }, [formData.duration, formData.met, selectedVariant, profile?.weight_kg]);

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const getIntensityVariants = () => {
    return INTENSITY_VARIANTS[formData.name] || [];
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.duration.trim()) {
      errors.push('Duration is required');
    } else {
      const duration = parseFloat(formData.duration);
      if (isNaN(duration) || duration < 5 || duration > 300) {
        errors.push('Duration must be between 5 and 300 minutes');
      }
    }
    
    return errors;
  };

  const handleSave = async () => {
    const validationErrors = validateForm();
    
    if (validationErrors.length > 0) {
      Alert.alert('Validation Error', validationErrors[0]);
      return;
    }

    if (!profile?.weight_kg) {
      Alert.alert(
        'Weight Required',
        'We need your weight to calculate calories burned. Using default 70kg for now.',
        [
          { text: 'Use 70kg', onPress: () => saveExercise() },
          { text: 'Set Weight', onPress: () => router.push('/profile') },
        ]
      );
      return;
    }

    saveExercise();
  };

  const saveExercise = async () => {
    setIsLoading(true);
    
    try {
      const exerciseEntry = {
        id: Date.now().toString(),
        date: formData.date,
        time: formData.time || null,
        category: formData.category,
        name: selectedVariant?.label || formData.name,
        durationMin: parseInt(formData.duration),
        calories: calculatedCalories,
        distance: formData.distance ? parseFloat(formData.distance) : null,
        sets: formData.sets ? parseInt(formData.sets) : null,
        reps: formData.reps ? parseInt(formData.reps) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        notes: formData.notes.trim() || null,
        met: selectedVariant?.met || formData.met,
        createdAt: new Date().toISOString(),
      };

      addExerciseEntry(exerciseEntry);
      
      Alert.alert(
        'Exercise Added',
        `${exerciseEntry.name} · ${calculatedCalories} kcal burned`,
        [
          { text: 'Undo', style: 'destructive', onPress: () => {/* TODO: Implement undo */} },
          { text: 'OK', style: 'default', onPress: () => router.replace('/(tabs)') }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save exercise. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderIntensitySelector = () => {
    const variants = getIntensityVariants();
    if (variants.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.fieldLabel}>Intensity / Variant</Text>
        <TouchableOpacity 
          style={styles.fieldButton}
          onPress={() => setShowIntensitySelector(true)}
        >
          <Text style={styles.fieldValue}>
            {selectedVariant?.label || formData.name}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#666" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderIntensityModal = () => {
    const variants = getIntensityVariants();
    
    return (
      <Modal visible={showIntensitySelector} transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.intensityModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Intensity</Text>
              <TouchableOpacity onPress={() => setShowIntensitySelector(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            {variants.map((variant) => (
              <TouchableOpacity
                key={variant.label}
                style={styles.intensityOption}
                onPress={() => {
                  setSelectedVariant(variant);
                  setShowIntensitySelector(false);
                }}
              >
                <Text style={styles.intensityOptionText}>{variant.label}</Text>
                <Text style={styles.intensityMet}>MET: {variant.met}</Text>
                {selectedVariant?.label === variant.label && (
                  <Ionicons name="checkmark" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
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
        
        <Text style={styles.headerTitle}>Exercise Details</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Exercise Name */}
        <View style={styles.section}>
          <Text style={styles.exerciseTitle}>{formData.name}</Text>
          <Text style={styles.exerciseCategory}>
            {formData.category === 'cardio' ? 'Cardio' : 'Strength Training'}
          </Text>
        </View>

        {/* Intensity Selector (for exercises with variants) */}
        {renderIntensitySelector()}

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Duration (minutes) *</Text>
          <TextInput
            ref={durationInputRef}
            style={styles.textInput}
            value={formData.duration}
            onChangeText={(text) => updateFormData('duration', text)}
            placeholder="e.g., 30"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>

        {/* Cardio-specific fields */}
        {formData.category === 'cardio' && (
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Distance (km, optional)</Text>
            <TextInput
              style={styles.textInput}
              value={formData.distance}
              onChangeText={(text) => updateFormData('distance', text)}
              placeholder="e.g., 5.0"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
        )}

        {/* Strength-specific fields */}
        {formData.category === 'strength' && (
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Training Details (optional)</Text>
            
            <View style={styles.strengthInputs}>
              <View style={styles.strengthInput}>
                <Text style={styles.strengthLabel}>Sets</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.sets}
                  onChangeText={(text) => updateFormData('sets', text)}
                  placeholder="3"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.strengthInput}>
                <Text style={styles.strengthLabel}>Reps</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.reps}
                  onChangeText={(text) => updateFormData('reps', text)}
                  placeholder="10"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.strengthInput}>
                <Text style={styles.strengthLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.weight}
                  onChangeText={(text) => updateFormData('weight', text)}
                  placeholder="50"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        )}

        {/* Time (optional) */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Start Time (optional)</Text>
          <TextInput
            style={styles.textInput}
            value={formData.time}
            onChangeText={(text) => updateFormData('time', text)}
            placeholder="e.g., 14:30"
            placeholderTextColor="#999"
          />
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Notes (optional)</Text>
          <TextInput
            style={[styles.textInput, styles.notesInput]}
            value={formData.notes}
            onChangeText={(text) => updateFormData('notes', text)}
            placeholder="Add any notes about this workout..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Calorie Preview */}
        <View style={styles.caloriePreview}>
          <View style={styles.calorieCircle}>
            <Text style={styles.calorieNumber}>{calculatedCalories}</Text>
            <Text style={styles.calorieLabel}>kcal burned</Text>
          </View>
          
          <View style={styles.calculationInfo}>
            <Text style={styles.calculationText}>
              MET: {selectedVariant?.met || formData.met}
            </Text>
            <Text style={styles.calculationText}>
              Weight: {profile?.weight_kg || 70} kg
            </Text>
            <Text style={styles.calculationText}>
              Duration: {formData.duration || 0} min
            </Text>
            <Text style={styles.formulaText}>
              Calories = MET × Weight × Hours
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.saveButton,
            (!formData.duration.trim() || isLoading) && styles.saveButtonDisabled
          ]}
          onPress={handleSave}
          disabled={!formData.duration.trim() || isLoading}
        >
          <Text style={[
            styles.saveButtonText,
            (!formData.duration.trim() || isLoading) && styles.saveButtonTextDisabled
          ]}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {renderIntensityModal()}
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
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  exerciseTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  exerciseCategory: {
    fontSize: 16,
    color: '#8E8E93',
    textTransform: 'capitalize',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
  strengthInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  strengthInput: {
    flex: 1,
  },
  strengthLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 6,
  },
  caloriePreview: {
    backgroundColor: '#fff',
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  calorieCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FF9500',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
  },
  calorieNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  calorieLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  calculationInfo: {
    flex: 1,
  },
  calculationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  formulaText: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  intensityModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 0,
    width: '85%',
    maxWidth: 400,
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
  intensityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  intensityOptionText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  intensityMet: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
});