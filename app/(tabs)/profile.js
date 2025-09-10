/**
 * Profile & Settings Screen - Complete profile management with inline editing
 * 
 * Purpose: Mirror all onboarding inputs with inline editing and real-time calorie calculation
 * Features: Instant BMR/TDEE/goal recalculation, unit conversions, macro editing
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/stores/useAppStore';

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', description: 'Desk job, little exercise', factor: 1.40 },
  { value: 'lightly_active', label: 'Lightly Active', description: 'Light exercise 1-3 days/week', factor: 1.60 },
  { value: 'active', label: 'Active', description: 'Moderate exercise 3-5 days/week', factor: 1.80 },
  { value: 'very_active', label: 'Very Active', description: 'Heavy exercise 6-7 days/week', factor: 2.00 },
];

const WEEKLY_GOALS = [
  { value: 'lose_2', label: 'Lose 2.0 lb/week', delta: -1000 },
  { value: 'lose_1_5', label: 'Lose 1.5 lb/week', delta: -750 },
  { value: 'lose_1', label: 'Lose 1.0 lb/week', delta: -500 },
  { value: 'lose_0_5', label: 'Lose 0.5 lb/week', delta: -250 },
  { value: 'maintain', label: 'Maintain', delta: 0 },
  { value: 'gain_0_5', label: 'Gain 0.5 lb/week', delta: 250 },
  { value: 'gain_1', label: 'Gain 1.0 lb/week', delta: 500 },
];

const MACRO_PRESETS = [
  { name: 'Balanced', carbs: 50, protein: 20, fat: 30 },
  { name: 'Lower Carb', carbs: 35, protein: 30, fat: 35 },
  { name: 'Higher Protein', carbs: 40, protein: 30, fat: 30 },
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useAppStore();
  
  // Form state - initialize from profile
  const [formData, setFormData] = useState({
    sex: profile?.sex || 'male',
    dateOfBirth: profile?.dateOfBirth || '',
    height_cm: profile?.height_cm || 170,
    startingWeight_kg: profile?.startingWeight_kg || profile?.weight_kg || 70,
    currentWeight_kg: profile?.weight_kg || 70,
    goalWeight_kg: profile?.goal_weight_kg || 65,
    activityLevel: profile?.activity_level || 'lightly_active',
    weeklyGoal: getWeeklyGoalFromDelta(profile?.rate_kcal_per_day || -250),
    carbPct: profile?.macro_c || 50,
    proteinPct: profile?.macro_p || 20,
    fatPct: profile?.macro_f || 30,
  });
  
  // UI state
  const [heightUnit, setHeightUnit] = useState('cm');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [editingMacros, setEditingMacros] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'saved'
  const [saveTimeout, setSaveTimeout] = useState(null);

  // Initialize date of birth from age if not set
  useEffect(() => {
    if (!formData.dateOfBirth && profile?.age) {
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - profile.age;
      setFormData(prev => ({ 
        ...prev, 
        dateOfBirth: `${birthYear}-01-01` 
      }));
    }
  }, [profile?.age]);

  // Auto-save with debounce
  useEffect(() => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    setSaveStatus('saving');
    const timeout = setTimeout(() => {
      handleAutoSave();
    }, 500);
    
    setSaveTimeout(timeout);
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [formData]);

  function getWeeklyGoalFromDelta(delta) {
    const goal = WEEKLY_GOALS.find(g => g.delta === delta);
    return goal?.value || 'lose_0_5';
  }

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 25;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    
    // Check if birthday hasn't occurred this year
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return Math.max(13, Math.min(100, age));
  };

  const calculateBMR = () => {
    const W = formData.currentWeight_kg;
    const H = formData.height_cm;
    const A = calculateAge(formData.dateOfBirth);
    const C = formData.sex === 'male' ? 5 : -161;
    
    return 10 * W + 6.25 * H - 5 * A + C;
  };

  const calculateTDEE = () => {
    const bmr = calculateBMR();
    const activity = ACTIVITY_LEVELS.find(a => a.value === formData.activityLevel);
    return bmr * (activity?.factor || 1.60);
  };

  const calculateDailyGoal = () => {
    const tdee = calculateTDEE();
    const weeklyGoal = WEEKLY_GOALS.find(g => g.value === formData.weeklyGoal);
    const delta = weeklyGoal?.delta || 0;
    const goal = tdee + delta;
    
    // Round to nearest 10
    return Math.round(goal / 10) * 10;
  };

  const calculateMacroGrams = (percentage, isCarb = false, isProtein = false) => {
    const dailyCalories = calculateDailyGoal();
    const calories = dailyCalories * (percentage / 100);
    
    if (isCarb || isProtein) {
      return Math.round(calories / 4);
    } else {
      return Math.round(calories / 9);
    }
  };

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleAutoSave = async () => {
    try {
      const age = calculateAge(formData.dateOfBirth);
      const bmr = Math.round(calculateBMR());
      const tdee = Math.round(calculateTDEE());
      const dailyGoal = calculateDailyGoal();
      const weeklyGoalData = WEEKLY_GOALS.find(g => g.value === formData.weeklyGoal);
      
      const updatedProfile = {
        ...profile,
        sex: formData.sex,
        age: age,
        dateOfBirth: formData.dateOfBirth,
        height_cm: formData.height_cm,
        weight_kg: formData.currentWeight_kg,
        startingWeight_kg: formData.startingWeight_kg,
        goal_weight_kg: formData.goalWeight_kg,
        activity_level: formData.activityLevel,
        rate_kcal_per_day: Math.abs(weeklyGoalData?.delta || 250),
        goal_type: weeklyGoalData?.delta > 0 ? 'gain' : weeklyGoalData?.delta < 0 ? 'lose' : 'maintain',
        calorie_goal: dailyGoal,
        macro_c: formData.carbPct,
        macro_p: formData.proteinPct,
        macro_f: formData.fatPct,
        bmr: bmr,
        tdee: tdee,
      };

      updateProfile(updatedProfile);
      setSaveStatus('saved');
      
      // Clear saved status after 2 seconds
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Auto-save error:', error);
      setSaveStatus('');
    }
  };

  const convertHeightToCm = (feet, inches) => {
    return Math.round((feet * 12 + inches) * 2.54);
  };

  const convertHeightFromCm = (cm) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet, inches };
  };

  const convertWeightToKg = (pounds) => {
    return Math.round(pounds * 0.453592 * 10) / 10;
  };

  const convertWeightFromKg = (kg) => {
    return Math.round(kg * 2.20462 * 10) / 10;
  };

  const applyMacroPreset = (preset) => {
    setFormData(prev => ({
      ...prev,
      carbPct: preset.carbs,
      proteinPct: preset.protein,
      fatPct: preset.fat,
    }));
  };

  const adjustMacro = (macro, delta) => {
    const current = formData[macro];
    const newValue = Math.max(0, Math.min(100, current + delta));
    setFormData(prev => ({ ...prev, [macro]: newValue }));
  };

  const balanceMacros = () => {
    const total = formData.carbPct + formData.proteinPct + formData.fatPct;
    if (total === 100) return;
    
    const diff = 100 - total;
    const adjustment = Math.round(diff / 3);
    
    setFormData(prev => ({
      ...prev,
      carbPct: Math.max(0, prev.carbPct + adjustment),
      proteinPct: Math.max(0, prev.proteinPct + adjustment),
      fatPct: Math.max(0, prev.fatPct + (diff - adjustment * 2)),
    }));
  };

  const renderProfileHeader = () => {
    const age = calculateAge(formData.dateOfBirth);
    const heightDisplay = heightUnit === 'cm' ? 
      `${formData.height_cm}cm` : 
      (() => {
        const { feet, inches } = convertHeightFromCm(formData.height_cm);
        return `${feet}'${inches}"`;
      })();
    const weightDisplay = weightUnit === 'kg' ? 
      `${formData.currentWeight_kg}kg` : 
      `${convertWeightFromKg(formData.currentWeight_kg)}lb`;

    return (
      <View style={styles.profileHeader}>
        <View style={styles.profileInfo}>
          <Text style={styles.profileTitle}>Your Profile</Text>
          <View style={styles.profileSummary}>
            <Text style={styles.profileSummaryText}>
              {formData.sex === 'male' ? 'Male' : 'Female'} • {age} years • {heightDisplay} • {weightDisplay}
            </Text>
            <Ionicons name="create-outline" size={16} color="#2EAD4A" />
          </View>
        </View>
        
        {/* Save Status */}
        {saveStatus && (
          <View style={styles.saveStatus}>
            {saveStatus === 'saving' ? (
              <Ionicons name="sync" size={16} color="#2EAD4A" />
            ) : (
              <Ionicons name="checkmark-circle" size={16} color="#2EAD4A" />
            )}
            <Text style={styles.saveStatusText}>
              {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderDailyGoalsCard = () => {
    const dailyCalories = calculateDailyGoal();
    
    return (
      <View style={styles.dailyGoalsCard}>
        <Text style={styles.cardTitle}>Daily Goals</Text>
        <View style={styles.caloriesDisplay}>
          <Text style={styles.caloriesNumber}>{dailyCalories.toLocaleString()}</Text>
          <Text style={styles.caloriesLabel}>Daily Calories</Text>
        </View>
      </View>
    );
  };

  const renderMacroTargetsCard = () => {
    const dailyCalories = calculateDailyGoal();
    const carbGrams = calculateMacroGrams(formData.carbPct, true);
    const proteinGrams = calculateMacroGrams(formData.proteinPct, false, true);
    const fatGrams = calculateMacroGrams(formData.fatPct);
    
    return (
      <View style={styles.macroTargetsContainer}>
        <Text style={styles.cardTitle}>Macro Targets</Text>
        <View style={styles.macroCards}>
          <TouchableOpacity 
            style={styles.macroCard}
            onPress={() => setEditingMacros(true)}
          >
            <Text style={styles.macroPercentage}>{formData.carbPct}%</Text>
            <Text style={styles.macroGrams}>{carbGrams}g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.macroCard}
            onPress={() => setEditingMacros(true)}
          >
            <Text style={styles.macroPercentage}>{formData.proteinPct}%</Text>
            <Text style={styles.macroGrams}>{proteinGrams}g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.macroCard}
            onPress={() => setEditingMacros(true)}
          >
            <Text style={styles.macroPercentage}>{formData.fatPct}%</Text>
            <Text style={styles.macroGrams}>{fatGrams}g</Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderMacroEditModal = () => {
    const totalPct = formData.carbPct + formData.proteinPct + formData.fatPct;
    const remainingPct = 100 - totalPct;
    
    return (
      <Modal visible={editingMacros} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.macroEditContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
          
          {/* Header */}
          <View style={[styles.macroEditHeader, { paddingTop: insets.top + 16 }]}>
            <TouchableOpacity onPress={() => setEditingMacros(false)}>
              <Text style={styles.macroEditCancel}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={styles.macroEditTitle}>Edit Macro Targets</Text>
            
            <TouchableOpacity onPress={() => setEditingMacros(false)}>
              <Text style={styles.macroEditDone}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.macroEditContent}>
            {/* Quick Presets */}
            <View style={styles.presetsSection}>
              <Text style={styles.presetsTitle}>Quick Presets</Text>
              <View style={styles.presetButtons}>
                {MACRO_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.name}
                    style={styles.presetButton}
                    onPress={() => applyMacroPreset(preset)}
                  >
                    <Text style={styles.presetButtonText}>{preset.name}</Text>
                    <Text style={styles.presetButtonSubtext}>
                      {preset.carbs}% • {preset.protein}% • {preset.fat}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Macro Controls */}
            <View style={styles.macroControlsSection}>
              <Text style={styles.macroControlsTitle}>Custom Percentages</Text>
              
              {/* Carbs */}
              <View style={styles.macroControlRow}>
                <Text style={styles.macroControlLabel}>Carbs</Text>
                <View style={styles.macroControlButtons}>
                  <TouchableOpacity 
                    style={styles.macroStepButton}
                    onPress={() => adjustMacro('carbPct', -1)}
                  >
                    <Ionicons name="remove" size={16} color="#666" />
                  </TouchableOpacity>
                  
                  <View style={styles.macroValueDisplay}>
                    <Text style={styles.macroControlValue}>{formData.carbPct}%</Text>
                    <Text style={styles.macroControlGrams}>
                      {calculateMacroGrams(formData.carbPct, true)}g
                    </Text>
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
              <View style={styles.macroControlRow}>
                <Text style={styles.macroControlLabel}>Protein</Text>
                <View style={styles.macroControlButtons}>
                  <TouchableOpacity 
                    style={styles.macroStepButton}
                    onPress={() => adjustMacro('proteinPct', -1)}
                  >
                    <Ionicons name="remove" size={16} color="#666" />
                  </TouchableOpacity>
                  
                  <View style={styles.macroValueDisplay}>
                    <Text style={styles.macroControlValue}>{formData.proteinPct}%</Text>
                    <Text style={styles.macroControlGrams}>
                      {calculateMacroGrams(formData.proteinPct, false, true)}g
                    </Text>
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
              <View style={styles.macroControlRow}>
                <Text style={styles.macroControlLabel}>Fat</Text>
                <View style={styles.macroControlButtons}>
                  <TouchableOpacity 
                    style={styles.macroStepButton}
                    onPress={() => adjustMacro('fatPct', -1)}
                  >
                    <Ionicons name="remove" size={16} color="#666" />
                  </TouchableOpacity>
                  
                  <View style={styles.macroValueDisplay}>
                    <Text style={styles.macroControlValue}>{formData.fatPct}%</Text>
                    <Text style={styles.macroControlGrams}>
                      {calculateMacroGrams(formData.fatPct)}g
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.macroStepButton}
                    onPress={() => adjustMacro('fatPct', 1)}
                  >
                    <Ionicons name="add" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Total Display */}
              <View style={styles.macroTotalRow}>
                <Text style={[
                  styles.macroTotalText,
                  totalPct !== 100 && styles.macroTotalError
                ]}>
                  Total: {totalPct}% {remainingPct !== 0 && `(${remainingPct > 0 ? '+' : ''}${remainingPct}%)`}
                </Text>
                
                {totalPct !== 100 && (
                  <TouchableOpacity 
                    style={styles.balanceButton}
                    onPress={balanceMacros}
                  >
                    <Text style={styles.balanceButtonText}>Balance</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const renderDatePickerModal = () => (
    <Modal visible={showDatePicker} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.datePickerModal}>
          <View style={styles.datePickerHeader}>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <Text style={styles.datePickerCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.datePickerTitle}>Date of Birth</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <Text style={styles.datePickerDone}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.datePickerContent}>
            <TextInput
              style={styles.dateInput}
              value={formData.dateOfBirth}
              onChangeText={(text) => updateFormData('dateOfBirth', text)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
            />
            <Text style={styles.dateHint}>
              Age: {calculateAge(formData.dateOfBirth)} years
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="person-circle-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No profile found</Text>
          <TouchableOpacity 
            style={styles.setupButton}
            onPress={() => router.push('/onboarding')}
          >
            <Text style={styles.setupButtonText}>Setup Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      
      {renderProfileHeader()}

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sticky Top Cards */}
        <View style={styles.topCards}>
          {renderDailyGoalsCard()}
          {renderMacroTargetsCard()}
        </View>

        {/* Profile Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Profile Details</Text>
          
          {/* Sex */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Sex</Text>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  formData.sex === 'male' && styles.selectedSegmentButton
                ]}
                onPress={() => updateFormData('sex', 'male')}
              >
                <Text style={[
                  styles.segmentText,
                  formData.sex === 'male' && styles.selectedSegmentText
                ]}>
                  Male
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  formData.sex === 'female' && styles.selectedSegmentButton
                ]}
                onPress={() => updateFormData('sex', 'female')}
              >
                <Text style={[
                  styles.segmentText,
                  formData.sex === 'female' && styles.selectedSegmentText
                ]}>
                  Female
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date of Birth */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Date of Birth</Text>
            <TouchableOpacity 
              style={styles.fieldButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.fieldValue}>
                {formData.dateOfBirth || 'Select date'}
              </Text>
              <Text style={styles.fieldSubvalue}>
                Age: {calculateAge(formData.dateOfBirth)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Height */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Height</Text>
            <View style={styles.unitFieldContainer}>
              <View style={styles.unitToggle}>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    heightUnit === 'cm' && styles.selectedUnitButton
                  ]}
                  onPress={() => setHeightUnit('cm')}
                >
                  <Text style={[
                    styles.unitButtonText,
                    heightUnit === 'cm' && styles.selectedUnitButtonText
                  ]}>
                    cm
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    heightUnit === 'ft' && styles.selectedUnitButton
                  ]}
                  onPress={() => setHeightUnit('ft')}
                >
                  <Text style={[
                    styles.unitButtonText,
                    heightUnit === 'ft' && styles.selectedUnitButtonText
                  ]}>
                    ft/in
                  </Text>
                </TouchableOpacity>
              </View>
              
              {heightUnit === 'cm' ? (
                <TextInput
                  style={styles.unitInput}
                  value={formData.height_cm.toString()}
                  onChangeText={(text) => {
                    const value = parseFloat(text) || 0;
                    updateFormData('height_cm', Math.max(120, Math.min(230, value)));
                  }}
                  keyboardType="numeric"
                  placeholder="170"
                />
              ) : (
                <View style={styles.heightFtInContainer}>
                  <TextInput
                    style={styles.heightFtInput}
                    value={convertHeightFromCm(formData.height_cm).feet.toString()}
                    onChangeText={(text) => {
                      const feet = parseInt(text) || 0;
                      const { inches } = convertHeightFromCm(formData.height_cm);
                      const newCm = convertHeightToCm(feet, inches);
                      updateFormData('height_cm', Math.max(120, Math.min(230, newCm)));
                    }}
                    keyboardType="numeric"
                    placeholder="5"
                  />
                  <Text style={styles.heightSeparator}>'</Text>
                  <TextInput
                    style={styles.heightInInput}
                    value={convertHeightFromCm(formData.height_cm).inches.toString()}
                    onChangeText={(text) => {
                      const inches = parseInt(text) || 0;
                      const { feet } = convertHeightFromCm(formData.height_cm);
                      const newCm = convertHeightToCm(feet, inches);
                      updateFormData('height_cm', Math.max(120, Math.min(230, newCm)));
                    }}
                    keyboardType="numeric"
                    placeholder="8"
                  />
                  <Text style={styles.heightSeparator}>"</Text>
                </View>
              )}
            </View>
          </View>

          {/* Starting Weight */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Starting Weight</Text>
            <View style={styles.unitFieldContainer}>
              <View style={styles.unitToggle}>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    weightUnit === 'kg' && styles.selectedUnitButton
                  ]}
                  onPress={() => setWeightUnit('kg')}
                >
                  <Text style={[
                    styles.unitButtonText,
                    weightUnit === 'kg' && styles.selectedUnitButtonText
                  ]}>
                    kg
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    weightUnit === 'lb' && styles.selectedUnitButton
                  ]}
                  onPress={() => setWeightUnit('lb')}
                >
                  <Text style={[
                    styles.unitButtonText,
                    weightUnit === 'lb' && styles.selectedUnitButtonText
                  ]}>
                    lb
                  </Text>
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.unitInput}
                value={weightUnit === 'kg' ? 
                  formData.startingWeight_kg.toString() : 
                  convertWeightFromKg(formData.startingWeight_kg).toString()
                }
                onChangeText={(text) => {
                  const value = parseFloat(text) || 0;
                  const kgValue = weightUnit === 'kg' ? value : convertWeightToKg(value);
                  updateFormData('startingWeight_kg', Math.max(30, Math.min(300, kgValue)));
                }}
                keyboardType="numeric"
                placeholder={weightUnit === 'kg' ? "70" : "154"}
              />
            </View>
          </View>

          {/* Current Weight */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Current Weight</Text>
            <View style={styles.unitFieldContainer}>
              <View style={styles.unitToggle}>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    weightUnit === 'kg' && styles.selectedUnitButton
                  ]}
                  onPress={() => setWeightUnit('kg')}
                >
                  <Text style={[
                    styles.unitButtonText,
                    weightUnit === 'kg' && styles.selectedUnitButtonText
                  ]}>
                    kg
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    weightUnit === 'lb' && styles.selectedUnitButton
                  ]}
                  onPress={() => setWeightUnit('lb')}
                >
                  <Text style={[
                    styles.unitButtonText,
                    weightUnit === 'lb' && styles.selectedUnitButtonText
                  ]}>
                    lb
                  </Text>
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.unitInput}
                value={weightUnit === 'kg' ? 
                  formData.currentWeight_kg.toString() : 
                  convertWeightFromKg(formData.currentWeight_kg).toString()
                }
                onChangeText={(text) => {
                  const value = parseFloat(text) || 0;
                  const kgValue = weightUnit === 'kg' ? value : convertWeightToKg(value);
                  updateFormData('currentWeight_kg', Math.max(30, Math.min(300, kgValue)));
                }}
                keyboardType="numeric"
                placeholder={weightUnit === 'kg' ? "70" : "154"}
              />
            </View>
          </View>

          {/* Goal Weight */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Goal Weight</Text>
            <View style={styles.unitFieldContainer}>
              <View style={styles.unitToggle}>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    weightUnit === 'kg' && styles.selectedUnitButton
                  ]}
                  onPress={() => setWeightUnit('kg')}
                >
                  <Text style={[
                    styles.unitButtonText,
                    weightUnit === 'kg' && styles.selectedUnitButtonText
                  ]}>
                    kg
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    weightUnit === 'lb' && styles.selectedUnitButton
                  ]}
                  onPress={() => setWeightUnit('lb')}
                >
                  <Text style={[
                    styles.unitButtonText,
                    weightUnit === 'lb' && styles.selectedUnitButtonText
                  ]}>
                    lb
                  </Text>
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.unitInput}
                value={weightUnit === 'kg' ? 
                  formData.goalWeight_kg.toString() : 
                  convertWeightFromKg(formData.goalWeight_kg).toString()
                }
                onChangeText={(text) => {
                  const value = parseFloat(text) || 0;
                  const kgValue = weightUnit === 'kg' ? value : convertWeightToKg(value);
                  updateFormData('goalWeight_kg', Math.max(30, Math.min(300, kgValue)));
                }}
                keyboardType="numeric"
                placeholder={weightUnit === 'kg' ? "65" : "143"}
              />
            </View>
          </View>

          {/* Activity Level */}
          <View style={styles.fieldColumn}>
            <Text style={styles.fieldLabel}>Activity Level</Text>
            <View style={styles.radioGroup}>
              {ACTIVITY_LEVELS.map((activity) => (
                <TouchableOpacity
                  key={activity.value}
                  style={[
                    styles.radioOption,
                    formData.activityLevel === activity.value && styles.selectedRadioOption
                  ]}
                  onPress={() => updateFormData('activityLevel', activity.value)}
                >
                  <View style={styles.radioContent}>
                    <Text style={[
                      styles.radioLabel,
                      formData.activityLevel === activity.value && styles.selectedRadioLabel
                    ]}>
                      {activity.label}
                    </Text>
                    <Text style={styles.radioDescription}>
                      {activity.description}
                    </Text>
                  </View>
                  <View style={[
                    styles.radioButton,
                    formData.activityLevel === activity.value && styles.selectedRadioButton
                  ]}>
                    {formData.activityLevel === activity.value && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Weekly Goal */}
          <View style={styles.fieldColumn}>
            <Text style={styles.fieldLabel}>Weekly Goal</Text>
            <View style={styles.radioGroup}>
              {WEEKLY_GOALS.map((goal) => (
                <TouchableOpacity
                  key={goal.value}
                  style={[
                    styles.radioOption,
                    formData.weeklyGoal === goal.value && styles.selectedRadioOption
                  ]}
                  onPress={() => updateFormData('weeklyGoal', goal.value)}
                >
                  <View style={styles.radioContent}>
                    <Text style={[
                      styles.radioLabel,
                      formData.weeklyGoal === goal.value && styles.selectedRadioLabel
                    ]}>
                      {goal.label}
                    </Text>
                    <Text style={styles.radioDescription}>
                      {goal.delta > 0 ? '+' : ''}{goal.delta} kcal/day
                    </Text>
                  </View>
                  <View style={[
                    styles.radioButton,
                    formData.weeklyGoal === goal.value && styles.selectedRadioButton
                  ]}>
                    {formData.weeklyGoal === goal.value && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.notificationsSection}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <TouchableOpacity 
            style={styles.notificationItem}
            onPress={() => router.push('/reminders')}
          >
            <View style={styles.notificationContent}>
              <Text style={styles.notificationLabel}>Reminders & Notifications</Text>
              <Text style={styles.notificationDescription}>
                Meal reminders and notification settings
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderMacroEditModal()}
      {renderDatePickerModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  profileHeader: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  profileInfo: {
    flex: 1,
  },
  profileTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileSummaryText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  saveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  saveStatusText: {
    fontSize: 14,
    color: '#2EAD4A',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  topCards: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  dailyGoalsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  caloriesDisplay: {
    alignItems: 'center',
  },
  caloriesNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#2EAD4A',
    lineHeight: 52,
  },
  caloriesLabel: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  macroTargetsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  macroCards: {
    flexDirection: 'row',
    gap: 12,
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 80,
  },
  macroPercentage: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  macroGrams: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  detailsSection: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 20,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  fieldColumn: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    flex: 1,
  },
  fieldButton: {
    alignItems: 'flex-end',
  },
  fieldValue: {
    fontSize: 16,
    color: '#2EAD4A',
    fontWeight: '500',
  },
  fieldSubvalue: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  unitFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    padding: 2,
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 44,
    alignItems: 'center',
  },
  selectedUnitButton: {
    backgroundColor: '#fff',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  selectedUnitButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  unitInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    minWidth: 80,
  },
  heightFtInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heightFtInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    width: 40,
  },
  heightInInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    width: 40,
  },
  heightSeparator: {
    fontSize: 16,
    color: '#8E8E93',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    padding: 2,
  },
  segmentButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  selectedSegmentButton: {
    backgroundColor: '#fff',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  selectedSegmentText: {
    color: '#000',
    fontWeight: '600',
  },
  radioGroup: {
    gap: 8,
    marginTop: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedRadioOption: {
    borderColor: '#2EAD4A',
    backgroundColor: '#F8FFF8',
  },
  radioContent: {
    flex: 1,
  },
  radioLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  selectedRadioLabel: {
    color: '#2EAD4A',
    fontWeight: '600',
  },
  radioDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioButton: {
    borderColor: '#2EAD4A',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2EAD4A',
  },
  notificationsSection: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  setupButton: {
    backgroundColor: '#2EAD4A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  setupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Macro Edit Modal
  macroEditContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  macroEditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  macroEditCancel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  macroEditTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  macroEditDone: {
    fontSize: 16,
    color: '#2EAD4A',
    fontWeight: '600',
  },
  macroEditContent: {
    flex: 1,
  },
  presetsSection: {
    backgroundColor: '#fff',
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  presetsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  presetButtons: {
    gap: 12,
  },
  presetButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  presetButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2EAD4A',
    marginBottom: 4,
  },
  presetButtonSubtext: {
    fontSize: 14,
    color: '#8E8E93',
  },
  macroControlsSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  macroControlsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 20,
  },
  macroControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  macroControlLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    width: 80,
  },
  macroControlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  macroStepButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroValueDisplay: {
    alignItems: 'center',
    minWidth: 80,
  },
  macroControlValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  macroControlGrams: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  macroTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  macroTotalText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  macroTotalError: {
    color: '#FF3B30',
  },
  balanceButton: {
    backgroundColor: '#2EAD4A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  balanceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Date Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 0,
    width: '85%',
    maxWidth: 400,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  datePickerCancel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  datePickerDone: {
    fontSize: 16,
    color: '#2EAD4A',
    fontWeight: '600',
  },
  datePickerContent: {
    padding: 20,
  },
  dateInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  dateHint: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});