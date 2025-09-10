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
  { value: 'lightly_active', label: 'Lightly Active', description: 'On your feet good part of day', factor: 1.60 },
  { value: 'active', label: 'Active', description: 'Some physical activity most of day', factor: 1.80 },
  { value: 'very_active', label: 'Very Active', description: 'Heavy physical work most of day', factor: 2.00 },
];

const WEEKLY_GOALS = [
  { value: 'lose_2', label: 'Lose 2.0 lb per week', delta: -1000 },
  { value: 'lose_1_5', label: 'Lose 1.5 lb per week', delta: -750 },
  { value: 'lose_1', label: 'Lose 1.0 lb per week', delta: -500 },
  { value: 'lose_0_5', label: 'Lose 0.5 lb per week', delta: -250 },
  { value: 'maintain', label: 'Maintain weight', delta: 0 },
  { value: 'gain_0_5', label: 'Gain 0.5 lb per week', delta: 250 },
  { value: 'gain_1', label: 'Gain 1.0 lb per week', delta: 500 },
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useAppStore();
  
  // UI state
  const [heightUnit, setHeightUnit] = useState('cm');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [macroMode, setMacroMode] = useState('percent'); // 'percent' or 'grams'
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'saved'
  const [saveTimeout, setSaveTimeout] = useState(null);
  
  // Modal states
  const [editingField, setEditingField] = useState(null);
  const [showMacroEditor, setShowMacroEditor] = useState(false);
  
  // Form data for editing
  const [editFormData, setEditFormData] = useState({});

  // Auto-save with debounce
  useEffect(() => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    if (profile) {
      setSaveStatus('saving');
      const timeout = setTimeout(() => {
        handleAutoSave();
      }, 500);
      
      setSaveTimeout(timeout);
      
      return () => {
        if (timeout) clearTimeout(timeout);
      };
    }
  }, [profile]);

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
    
    return Math.max(14, Math.min(100, age));
  };

  const calculateBMR = () => {
    if (!profile?.weight_kg || !profile?.height_cm || !profile?.sex) return 0;
    
    const W = profile.weight_kg;
    const H = profile.height_cm;
    const A = calculateAge(profile.dateOfBirth);
    const C = profile.sex === 'male' ? 5 : -161;
    
    return 10 * W + 6.25 * H - 5 * A + C;
  };

  const calculateTDEE = () => {
    if (!profile?.activity_level) return 0;
    
    const bmr = calculateBMR();
    const activity = ACTIVITY_LEVELS.find(a => a.value === profile.activity_level);
    return bmr * (activity?.factor || 1.60);
  };

  const calculateDailyGoal = () => {
    if (!profile?.weeklyGoal) return 0;
    
    const tdee = calculateTDEE();
    const weeklyGoal = WEEKLY_GOALS.find(g => g.value === profile.weeklyGoal);
    const delta = weeklyGoal?.delta || 0;
    const goal = tdee + delta;
    
    // Round to nearest 10
    return Math.round(goal / 10) * 10;
  };

  const calculateMacroGrams = (percentage, macroType) => {
    const dailyCalories = calculateDailyGoal();
    const calories = dailyCalories * (percentage / 100);
    
    if (macroType === 'carbs' || macroType === 'protein') {
      return Math.round(calories / 4);
    } else if (macroType === 'fat') {
      return Math.round(calories / 9);
    }
    return 0;
  };

  const handleAutoSave = async () => {
    try {
      // Sync to backend if needed
      const { syncUserData } = useAppStore.getState();
      await syncUserData();
      
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

  const showEditConfirmation = (field) => {
    let title = 'Edit this field?';
    let body = 'Changing this will update your calorie target. Continue?';
    
    if (field === 'weeklyGoal' || field === 'activityLevel') {
      body = 'Updating this may change your calorie goal and reset any custom goals. Continue?';
    }
    
    Alert.alert(
      title,
      body,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => openFieldEditor(field)
        },
      ]
    );
  };

  const openFieldEditor = (field) => {
    // Initialize edit form data based on field
    let initialData = {};
    
    switch (field) {
      case 'height':
        initialData = {
          height_cm: profile?.height_cm || 170,
          heightUnit: 'cm'
        };
        break;
      case 'sex':
        initialData = { sex: profile?.sex || 'female' };
        break;
      case 'dateOfBirth':
        initialData = { dateOfBirth: profile?.dateOfBirth || '' };
        break;
      case 'startingWeight':
        initialData = { 
          startingWeight_kg: profile?.startingWeight_kg || profile?.weight_kg || 70,
          startingWeightDate: profile?.startingWeightDate || new Date().toISOString().split('T')[0],
          updateCurrentWeight: false
        };
        break;
      case 'currentWeight':
        initialData = { weight_kg: profile?.weight_kg || 70 };
        break;
      case 'goalWeight':
        initialData = { goal_weight_kg: profile?.goal_weight_kg || 65 };
        break;
      case 'weeklyGoal':
        initialData = { weeklyGoal: profile?.weeklyGoal || 'lose_0_5' };
        break;
      case 'activityLevel':
        initialData = { activity_level: profile?.activity_level || 'lightly_active' };
        break;
    }
    
    setEditFormData(initialData);
    setEditingField(field);
  };

  const saveFieldEdit = () => {
    if (!editingField) return;
    
    try {
      // Calculate derived values
      const age = editFormData.dateOfBirth ? calculateAge(editFormData.dateOfBirth) : profile?.age;
      
      // Update profile with new data
      const updates = { ...editFormData };
      
      // Add derived fields
      if (editFormData.dateOfBirth) {
        updates.age = age;
      }
      
      // Handle starting weight date update
      if (editingField === 'startingWeight') {
        if (editFormData.updateCurrentWeight) {
          updates.weight_kg = editFormData.startingWeight_kg;
        }
      }
      
      // Recalculate BMR, TDEE, and daily goal
      const newProfile = { ...profile, ...updates };
      const W = newProfile.weight_kg || 70;
      const H = newProfile.height_cm || 170;
      const A = newProfile.age || age || 25;
      const C = newProfile.sex === 'male' ? 5 : -161;
      const AF = ACTIVITY_LEVELS.find(a => a.value === newProfile.activity_level)?.factor || 1.60;
      const weeklyGoalData = WEEKLY_GOALS.find(g => g.value === newProfile.weeklyGoal);
      const delta = weeklyGoalData?.delta || 0;
      
      const bmr = 10 * W + 6.25 * H - 5 * A + C;
      const tdee = bmr * AF;
      const dailyGoal = Math.round((tdee + delta) / 10) * 10;
      
      updates.bmr = Math.round(bmr);
      updates.tdee = Math.round(tdee);
      updates.calorie_goal = dailyGoal;
      
      // Update goal type based on weekly goal
      if (delta > 0) {
        updates.goal_type = 'gain';
      } else if (delta < 0) {
        updates.goal_type = 'lose';
      } else {
        updates.goal_type = 'maintain';
      }
      
      updates.rate_kcal_per_day = Math.abs(delta);
      
      updateProfile(updates);
      setEditingField(null);
      
      Alert.alert('Saved', 'Goals updated.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    }
  };

  const getDisplayValue = (field) => {
    if (!profile) return '--';
    
    switch (field) {
      case 'height':
        if (heightUnit === 'cm') {
          return `${profile.height_cm || '--'} cm`;
        } else {
          const { feet, inches } = convertHeightFromCm(profile.height_cm || 170);
          return `${feet} ft ${inches} in`;
        }
      case 'sex':
        return profile.sex === 'male' ? 'Male' : 'Female';
      case 'dateOfBirth':
        return profile.dateOfBirth || '--';
      case 'startingWeight':
        const startingWeight = profile.startingWeight_kg || profile.weight_kg || 0;
        const startingDate = profile.startingWeightDate || '2025/01/01';
        const weightDisplay = weightUnit === 'kg' ? 
          `${startingWeight} kg` : 
          `${convertWeightFromKg(startingWeight)} lb`;
        return `${weightDisplay} on ${startingDate}`;
      case 'currentWeight':
        const currentWeight = profile.weight_kg || 0;
        return weightUnit === 'kg' ? 
          `${currentWeight} kg` : 
          `${convertWeightFromKg(currentWeight)} lb`;
      case 'goalWeight':
        const goalWeight = profile.goal_weight_kg || 0;
        return weightUnit === 'kg' ? 
          `${goalWeight} kg` : 
          `${convertWeightFromKg(goalWeight)} lb`;
      case 'weeklyGoal':
        const weeklyGoal = WEEKLY_GOALS.find(g => g.value === profile.weeklyGoal);
        return weeklyGoal?.label || '--';
      case 'activityLevel':
        const activity = ACTIVITY_LEVELS.find(a => a.value === profile.activity_level);
        return activity?.label || '--';
      default:
        return '--';
    }
  };

  const isProfileComplete = () => {
    return profile?.sex && profile?.dateOfBirth && profile?.height_cm && 
           profile?.weight_kg && profile?.activity_level && profile?.weeklyGoal;
  };

  const renderProfileHeader = () => {
    const age = profile?.age || calculateAge(profile?.dateOfBirth);
    const heightDisplay = heightUnit === 'cm' ? 
      `${profile?.height_cm || '--'}cm` : 
      (() => {
        if (!profile?.height_cm) return '--';
        const { feet, inches } = convertHeightFromCm(profile.height_cm);
        return `${feet}'${inches}"`;
      })();
    const weightDisplay = weightUnit === 'kg' ? 
      `${profile?.weight_kg || '--'}kg` : 
      `${profile?.weight_kg ? convertWeightFromKg(profile.weight_kg) : '--'}lb`;

    return (
      <View style={styles.profileHeader}>
        <View style={styles.profileInfo}>
          <Text style={styles.profileTitle}>Your Profile</Text>
          <View style={styles.profileSummary}>
            <Text style={styles.profileSummaryText}>
              {profile?.sex === 'male' ? 'Male' : 'Female'} • {age} years • {heightDisplay} • {weightDisplay}
            </Text>
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
    const dailyCalories = isProfileComplete() ? calculateDailyGoal() : 0;
    
    return (
      <View style={styles.dailyGoalsCard}>
        <Text style={styles.cardTitle}>Daily Goals</Text>
        <View style={styles.caloriesDisplay}>
          <Text style={styles.caloriesNumber}>
            {dailyCalories > 0 ? dailyCalories.toLocaleString() : '--'}
          </Text>
          <Text style={styles.caloriesLabel}>Daily Calories</Text>
        </View>
        <Text style={styles.caloriesSubtext}>
          {isProfileComplete() ? 'Auto-calculated from your info' : 'Complete your info to see your daily goal'}
        </Text>
      </View>
    );
  };

  const renderMacroTargetsCard = () => {
    const dailyCalories = isProfileComplete() ? calculateDailyGoal() : 0;
    const carbPct = profile?.macro_c || 45;
    const proteinPct = profile?.macro_p || 25;
    const fatPct = profile?.macro_f || 30;
    
    const carbGrams = dailyCalories > 0 ? calculateMacroGrams(carbPct, 'carbs') : 0;
    const proteinGrams = dailyCalories > 0 ? calculateMacroGrams(proteinPct, 'protein') : 0;
    const fatGrams = dailyCalories > 0 ? calculateMacroGrams(fatPct, 'fat') : 0;
    
    return (
      <View style={styles.macroTargetsContainer}>
        <Text style={styles.cardTitle}>Macro Targets</Text>
        <View style={styles.macroCards}>
          <TouchableOpacity 
            style={styles.macroCard}
            onPress={() => setShowMacroEditor(true)}
          >
            <Text style={styles.macroPercentage}>{carbPct}%</Text>
            <Text style={styles.macroGrams}>{carbGrams}g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.macroCard}
            onPress={() => setShowMacroEditor(true)}
          >
            <Text style={styles.macroPercentage}>{proteinPct}%</Text>
            <Text style={styles.macroGrams}>{proteinGrams}g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.macroCard}
            onPress={() => setShowMacroEditor(true)}
          >
            <Text style={styles.macroPercentage}>{fatPct}%</Text>
            <Text style={styles.macroGrams}>{fatGrams}g</Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderInfoRow = (label, field, value) => (
    <TouchableOpacity 
      key={field}
      style={styles.infoRow}
      onPress={() => showEditConfirmation(field)}
    >
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </TouchableOpacity>
  );

  const renderFieldEditor = () => {
    if (!editingField) return null;

    switch (editingField) {
      case 'height':
        return renderHeightEditor();
      case 'sex':
        return renderSexEditor();
      case 'dateOfBirth':
        return renderDateEditor();
      case 'startingWeight':
        return renderStartingWeightEditor();
      case 'currentWeight':
        return renderCurrentWeightEditor();
      case 'goalWeight':
        return renderGoalWeightEditor();
      case 'weeklyGoal':
        return renderWeeklyGoalEditor();
      case 'activityLevel':
        return renderActivityLevelEditor();
      default:
        return null;
    }
  };

  const renderHeightEditor = () => (
    <Modal visible={true} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.editorModal}>
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={() => setEditingField(null)}>
              <Text style={styles.editorCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editorTitle}>Height</Text>
            <TouchableOpacity onPress={saveFieldEdit}>
              <Text style={styles.editorSave}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.editorContent}>
            {/* Unit Toggle */}
            <View style={styles.unitToggleContainer}>
              <View style={styles.unitToggle}>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    (editFormData.heightUnit || 'cm') === 'cm' && styles.selectedUnitButton
                  ]}
                  onPress={() => setEditFormData(prev => ({ ...prev, heightUnit: 'cm' }))}
                >
                  <Text style={[
                    styles.unitButtonText,
                    (editFormData.heightUnit || 'cm') === 'cm' && styles.selectedUnitButtonText
                  ]}>
                    cm
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    editFormData.heightUnit === 'ft' && styles.selectedUnitButton
                  ]}
                  onPress={() => setEditFormData(prev => ({ ...prev, heightUnit: 'ft' }))}
                >
                  <Text style={[
                    styles.unitButtonText,
                    editFormData.heightUnit === 'ft' && styles.selectedUnitButtonText
                  ]}>
                    ft/in
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Height Input */}
            {(editFormData.heightUnit || 'cm') === 'cm' ? (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.numberInput}
                  value={editFormData.height_cm?.toString() || ''}
                  onChangeText={(text) => {
                    const value = parseFloat(text) || 0;
                    setEditFormData(prev => ({ 
                      ...prev, 
                      height_cm: Math.max(120, Math.min(230, value))
                    }));
                  }}
                  keyboardType="numeric"
                  placeholder="170"
                  autoFocus
                />
                <Text style={styles.inputUnit}>cm</Text>
              </View>
            ) : (
              <View style={styles.heightFtInContainer}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.numberInput}
                    value={convertHeightFromCm(editFormData.height_cm || 170).feet.toString()}
                    onChangeText={(text) => {
                      const feet = parseInt(text) || 0;
                      const { inches } = convertHeightFromCm(editFormData.height_cm || 170);
                      const newCm = convertHeightToCm(feet, inches);
                      setEditFormData(prev => ({ 
                        ...prev, 
                        height_cm: Math.max(120, Math.min(230, newCm))
                      }));
                    }}
                    keyboardType="numeric"
                    placeholder="5"
                  />
                  <Text style={styles.inputUnit}>ft</Text>
                </View>
                
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.numberInput}
                    value={convertHeightFromCm(editFormData.height_cm || 170).inches.toString()}
                    onChangeText={(text) => {
                      const inches = parseInt(text) || 0;
                      const { feet } = convertHeightFromCm(editFormData.height_cm || 170);
                      const newCm = convertHeightToCm(feet, inches);
                      setEditFormData(prev => ({ 
                        ...prev, 
                        height_cm: Math.max(120, Math.min(230, newCm))
                      }));
                    }}
                    keyboardType="numeric"
                    placeholder="8"
                  />
                  <Text style={styles.inputUnit}>in</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderSexEditor = () => (
    <Modal visible={true} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.editorModal}>
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={() => setEditingField(null)}>
              <Text style={styles.editorCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editorTitle}>Sex at Birth</Text>
            <TouchableOpacity onPress={saveFieldEdit}>
              <Text style={styles.editorSave}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.editorContent}>
            <View style={styles.radioGroup}>
              {[
                { value: 'female', label: 'Female' },
                { value: 'male', label: 'Male' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.radioOption,
                    editFormData.sex === option.value && styles.selectedRadioOption
                  ]}
                  onPress={() => setEditFormData(prev => ({ ...prev, sex: option.value }))}
                >
                  <Text style={[
                    styles.radioLabel,
                    editFormData.sex === option.value && styles.selectedRadioLabel
                  ]}>
                    {option.label}
                  </Text>
                  <View style={[
                    styles.radioButton,
                    editFormData.sex === option.value && styles.selectedRadioButton
                  ]}>
                    {editFormData.sex === option.value && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderDateEditor = () => (
    <Modal visible={true} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.editorModal}>
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={() => setEditingField(null)}>
              <Text style={styles.editorCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editorTitle}>Date of Birth</Text>
            <TouchableOpacity onPress={saveFieldEdit}>
              <Text style={styles.editorSave}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.editorContent}>
            <TextInput
              style={styles.dateInput}
              value={editFormData.dateOfBirth || ''}
              onChangeText={(text) => setEditFormData(prev => ({ ...prev, dateOfBirth: text }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
              autoFocus
            />
            <Text style={styles.dateHint}>
              Age: {calculateAge(editFormData.dateOfBirth)} years
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderStartingWeightEditor = () => (
    <Modal visible={true} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.editorModal}>
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={() => setEditingField(null)}>
              <Text style={styles.editorCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editorTitle}>Starting Weight</Text>
            <TouchableOpacity onPress={saveFieldEdit}>
              <Text style={styles.editorSave}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.editorContent}>
            {/* Weight Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.numberInput}
                value={weightUnit === 'kg' ? 
                  (editFormData.startingWeight_kg?.toString() || '') : 
                  (editFormData.startingWeight_kg ? convertWeightFromKg(editFormData.startingWeight_kg).toString() : '')
                }
                onChangeText={(text) => {
                  const value = parseFloat(text) || 0;
                  const kgValue = weightUnit === 'kg' ? value : convertWeightToKg(value);
                  setEditFormData(prev => ({ 
                    ...prev, 
                    startingWeight_kg: Math.max(30, Math.min(300, kgValue))
                  }));
                }}
                keyboardType="numeric"
                placeholder={weightUnit === 'kg' ? "70" : "154"}
                autoFocus
              />
              <Text style={styles.inputUnit}>{weightUnit}</Text>
            </View>
            
            {/* Date Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.dateInput}
                value={editFormData.startingWeightDate || ''}
                onChangeText={(text) => setEditFormData(prev => ({ ...prev, startingWeightDate: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            </View>
            
            {/* Update Current Weight Option */}
            <TouchableOpacity 
              style={styles.checkboxRow}
              onPress={() => setEditFormData(prev => ({ 
                ...prev, 
                updateCurrentWeight: !prev.updateCurrentWeight 
              }))}
            >
              <View style={[
                styles.checkbox,
                editFormData.updateCurrentWeight && styles.selectedCheckbox
              ]}>
                {editFormData.updateCurrentWeight && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Update Current Weight to match</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderCurrentWeightEditor = () => (
    <Modal visible={true} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.editorModal}>
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={() => setEditingField(null)}>
              <Text style={styles.editorCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editorTitle}>Current Weight</Text>
            <TouchableOpacity onPress={saveFieldEdit}>
              <Text style={styles.editorSave}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.editorContent}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.numberInput}
                value={weightUnit === 'kg' ? 
                  (editFormData.weight_kg?.toString() || '') : 
                  (editFormData.weight_kg ? convertWeightFromKg(editFormData.weight_kg).toString() : '')
                }
                onChangeText={(text) => {
                  const value = parseFloat(text) || 0;
                  const kgValue = weightUnit === 'kg' ? value : convertWeightToKg(value);
                  setEditFormData(prev => ({ 
                    ...prev, 
                    weight_kg: Math.max(30, Math.min(300, kgValue))
                  }));
                }}
                keyboardType="numeric"
                placeholder={weightUnit === 'kg' ? "70" : "154"}
                autoFocus
              />
              <Text style={styles.inputUnit}>{weightUnit}</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderGoalWeightEditor = () => (
    <Modal visible={true} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.editorModal}>
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={() => setEditingField(null)}>
              <Text style={styles.editorCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editorTitle}>Goal Weight</Text>
            <TouchableOpacity onPress={saveFieldEdit}>
              <Text style={styles.editorSave}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.editorContent}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.numberInput}
                value={weightUnit === 'kg' ? 
                  (editFormData.goal_weight_kg?.toString() || '') : 
                  (editFormData.goal_weight_kg ? convertWeightFromKg(editFormData.goal_weight_kg).toString() : '')
                }
                onChangeText={(text) => {
                  const value = parseFloat(text) || 0;
                  const kgValue = weightUnit === 'kg' ? value : convertWeightToKg(value);
                  setEditFormData(prev => ({ 
                    ...prev, 
                    goal_weight_kg: Math.max(30, Math.min(300, kgValue))
                  }));
                }}
                keyboardType="numeric"
                placeholder={weightUnit === 'kg' ? "65" : "143"}
                autoFocus
              />
              <Text style={styles.inputUnit}>{weightUnit}</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderWeeklyGoalEditor = () => (
    <Modal visible={true} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.editorModal}>
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={() => setEditingField(null)}>
              <Text style={styles.editorCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editorTitle}>Weekly Goal</Text>
            <TouchableOpacity onPress={saveFieldEdit}>
              <Text style={styles.editorSave}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.editorContent}>
            <View style={styles.radioGroup}>
              {WEEKLY_GOALS.map((goal) => (
                <TouchableOpacity
                  key={goal.value}
                  style={[
                    styles.radioOption,
                    editFormData.weeklyGoal === goal.value && styles.selectedRadioOption
                  ]}
                  onPress={() => setEditFormData(prev => ({ ...prev, weeklyGoal: goal.value }))}
                >
                  <View style={styles.radioContent}>
                    <Text style={[
                      styles.radioLabel,
                      editFormData.weeklyGoal === goal.value && styles.selectedRadioLabel
                    ]}>
                      {goal.label}
                    </Text>
                    <Text style={styles.radioDescription}>
                      {goal.delta > 0 ? '+' : ''}{goal.delta} kcal/day
                    </Text>
                  </View>
                  <View style={[
                    styles.radioButton,
                    editFormData.weeklyGoal === goal.value && styles.selectedRadioButton
                  ]}>
                    {editFormData.weeklyGoal === goal.value && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderActivityLevelEditor = () => (
    <Modal visible={true} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.editorModal}>
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={() => setEditingField(null)}>
              <Text style={styles.editorCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editorTitle}>Activity Level</Text>
            <TouchableOpacity onPress={saveFieldEdit}>
              <Text style={styles.editorSave}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.editorContent}>
            <View style={styles.radioGroup}>
              {ACTIVITY_LEVELS.map((activity) => (
                <TouchableOpacity
                  key={activity.value}
                  style={[
                    styles.radioOption,
                    editFormData.activity_level === activity.value && styles.selectedRadioOption
                  ]}
                  onPress={() => setEditFormData(prev => ({ ...prev, activity_level: activity.value }))}
                >
                  <View style={styles.radioContent}>
                    <Text style={[
                      styles.radioLabel,
                      editFormData.activity_level === activity.value && styles.selectedRadioLabel
                    ]}>
                      {activity.label}
                    </Text>
                    <Text style={styles.radioDescription}>
                      {activity.description} (AF {activity.factor})
                    </Text>
                  </View>
                  <View style={[
                    styles.radioButton,
                    editFormData.activity_level === activity.value && styles.selectedRadioButton
                  ]}>
                    {editFormData.activity_level === activity.value && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderMacroEditor = () => {
    const [tempMacros, setTempMacros] = useState({
      carbPct: profile?.macro_c || 45,
      proteinPct: profile?.macro_p || 25,
      fatPct: profile?.macro_f || 30,
    });
    
    const dailyCalories = calculateDailyGoal();
    const totalPct = tempMacros.carbPct + tempMacros.proteinPct + tempMacros.fatPct;
    const remainingPct = 100 - totalPct;
    
    const adjustMacro = (macro, delta) => {
      const current = tempMacros[macro];
      const newValue = Math.max(0, Math.min(100, current + delta));
      setTempMacros(prev => ({ ...prev, [macro]: newValue }));
    };
    
    const resetToDefault = () => {
      setTempMacros({ carbPct: 45, proteinPct: 25, fatPct: 30 });
    };
    
    const balanceMacros = () => {
      if (totalPct === 100) return;
      
      const diff = 100 - totalPct;
      const adjustment = Math.round(diff / 3);
      
      setTempMacros(prev => ({
        carbPct: Math.max(0, Math.min(100, prev.carbPct + adjustment)),
        proteinPct: Math.max(0, Math.min(100, prev.proteinPct + adjustment)),
        fatPct: Math.max(0, Math.min(100, prev.fatPct + (diff - adjustment * 2))),
      }));
    };
    
    const saveMacros = () => {
      if (totalPct !== 100) {
        Alert.alert('Invalid Macros', 'Macro percentages must total 100%');
        return;
      }
      
      updateProfile({
        macro_c: tempMacros.carbPct,
        macro_p: tempMacros.proteinPct,
        macro_f: tempMacros.fatPct,
      });
      
      setShowMacroEditor(false);
      Alert.alert('Saved', 'Goals updated.');
    };
    
    return (
      <Modal visible={showMacroEditor} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.macroEditContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
          
          {/* Header */}
          <View style={[styles.macroEditHeader, { paddingTop: insets.top + 16 }]}>
            <TouchableOpacity onPress={() => setShowMacroEditor(false)}>
              <Text style={styles.macroEditCancel}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={styles.macroEditTitle}>Macro Targets</Text>
            
            <TouchableOpacity onPress={saveMacros}>
              <Text style={styles.macroEditSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.macroEditContent}>
            {/* Mode Toggle */}
            <View style={styles.macroModeSection}>
              <View style={styles.macroModeToggle}>
                <TouchableOpacity
                  style={[
                    styles.macroModeButton,
                    macroMode === 'percent' && styles.activeMacroModeButton
                  ]}
                  onPress={() => setMacroMode('percent')}
                >
                  <Text style={[
                    styles.macroModeText,
                    macroMode === 'percent' && styles.activeMacroModeText
                  ]}>
                    Percent
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.macroModeButton,
                    macroMode === 'grams' && styles.activeMacroModeButton
                  ]}
                  onPress={() => setMacroMode('grams')}
                >
                  <Text style={[
                    styles.macroModeText,
                    macroMode === 'grams' && styles.activeMacroModeText
                  ]}>
                    Grams
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Macro Controls */}
            <View style={styles.macroControlsSection}>
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
                    <Text style={styles.macroControlValue}>
                      {macroMode === 'percent' ? 
                        `${tempMacros.carbPct}%` : 
                        `${calculateMacroGrams(tempMacros.carbPct, 'carbs')}g`
                      }
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
                    <Text style={styles.macroControlValue}>
                      {macroMode === 'percent' ? 
                        `${tempMacros.proteinPct}%` : 
                        `${calculateMacroGrams(tempMacros.proteinPct, 'protein')}g`
                      }
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
                    <Text style={styles.macroControlValue}>
                      {macroMode === 'percent' ? 
                        `${tempMacros.fatPct}%` : 
                        `${calculateMacroGrams(tempMacros.fatPct, 'fat')}g`
                      }
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

              {/* Total & Actions */}
              <View style={styles.macroActionsRow}>
                <View style={styles.macroTotalDisplay}>
                  <Text style={[
                    styles.macroTotalText,
                    totalPct !== 100 && styles.macroTotalError
                  ]}>
                    Total: {totalPct}%
                    {remainingPct !== 0 && ` (${remainingPct > 0 ? '+' : ''}${remainingPct}%)`}
                  </Text>
                </View>
                
                <View style={styles.macroActionButtons}>
                  <TouchableOpacity 
                    style={styles.resetButton}
                    onPress={resetToDefault}
                  >
                    <Text style={styles.resetButtonText}>Reset to default (45/25/30)</Text>
                  </TouchableOpacity>
                  
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
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

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
        {/* Top Cards */}
        <View style={styles.topCards}>
          {renderDailyGoalsCard()}
          {renderMacroTargetsCard()}
        </View>

        {/* Your Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Your Info</Text>
          
          {renderInfoRow('Height', 'height', getDisplayValue('height'))}
          {renderInfoRow('Sex at Birth', 'sex', getDisplayValue('sex'))}
          {renderInfoRow('Date of Birth', 'dateOfBirth', getDisplayValue('dateOfBirth'))}
          {renderInfoRow('Starting Weight', 'startingWeight', getDisplayValue('startingWeight'))}
          {renderInfoRow('Current Weight', 'currentWeight', getDisplayValue('currentWeight'))}
          {renderInfoRow('Goal Weight', 'goalWeight', getDisplayValue('goalWeight'))}
          {renderInfoRow('Weekly Goal', 'weeklyGoal', getDisplayValue('weeklyGoal'))}
          {renderInfoRow('Activity Level', 'activityLevel', getDisplayValue('activityLevel'))}
        </View>
      </ScrollView>

      {renderFieldEditor()}
      {renderMacroEditor()}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginBottom: 8,
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
  caloriesSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
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
  infoSection: {
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    minHeight: 44,
  },
  infoLabel: {
    fontSize: 17,
    fontWeight: '400',
    color: '#000',
    flex: 1,
  },
  infoValue: {
    fontSize: 17,
    color: '#2EAD4A',
    fontWeight: '500',
    textAlign: 'right',
    maxWidth: '60%',
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
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  editorModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  editorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  editorCancel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  editorSave: {
    fontSize: 16,
    color: '#2EAD4A',
    fontWeight: '600',
  },
  editorContent: {
    padding: 20,
  },
  unitToggleContainer: {
    marginBottom: 20,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    padding: 2,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  numberInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  inputUnit: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  heightFtInContainer: {
    flexDirection: 'row',
    gap: 12,
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckbox: {
    backgroundColor: '#2EAD4A',
    borderColor: '#2EAD4A',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  radioGroup: {
    gap: 12,
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
  
  // Macro Editor
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
  macroEditSave: {
    fontSize: 16,
    color: '#2EAD4A',
    fontWeight: '600',
  },
  macroEditContent: {
    flex: 1,
  },
  macroModeSection: {
    backgroundColor: '#fff',
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  macroModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    padding: 2,
  },
  macroModeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeMacroModeButton: {
    backgroundColor: '#fff',
  },
  macroModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeMacroModeText: {
    color: '#000',
    fontWeight: '600',
  },
  macroControlsSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  macroControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  macroControlLabel: {
    fontSize: 17,
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
  macroActionsRow: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  macroTotalDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  macroTotalText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  macroTotalError: {
    color: '#FF3B30',
  },
  macroActionButtons: {
    gap: 12,
  },
  resetButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  balanceButton: {
    backgroundColor: '#2EAD4A',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  balanceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});