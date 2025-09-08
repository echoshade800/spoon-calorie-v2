/**
 * Profile & Settings Screen - User preferences and goals management
 * 
 * Purpose: Edit daily goals, macro ratios, preferences, and app settings
 * Extends: Add data export, backup/sync, nutrition insights, streak tracking
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/stores/useAppStore';
import { calculateBMR, calculateTDEE, calculateDailyGoal } from '@/data/mockData';
import { validateProfileData } from '@/utils/helpers';

const MACRO_PRESETS = [
  { name: 'Balanced', carbs: 45, protein: 25, fat: 30 },
  { name: 'High Protein', carbs: 35, protein: 35, fat: 30 },
  { name: 'Low Carb', carbs: 20, protein: 35, fat: 45 },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, setProfile, updateProfile } = useAppStore();
  
  const [editingGoals, setEditingGoals] = useState(false);
  const [editingMacros, setEditingMacros] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [tempGoal, setTempGoal] = useState(profile?.calorie_goal?.toString() || '');
  const [tempMacros, setTempMacros] = useState({
    carbs: profile?.macro_c || 45,
    protein: profile?.macro_p || 25,
    fat: profile?.macro_f || 30,
  });
  const [tempProfile, setTempProfile] = useState({
    sex: profile?.sex || 'male',
    age: profile?.age?.toString() || '',
    height_cm: profile?.height_cm?.toString() || '',
    weight_kg: profile?.weight_kg?.toString() || '',
  });
  

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

  const handleSaveGoal = () => {
    const newGoal = parseInt(tempGoal);
    if (isNaN(newGoal) || newGoal < 800 || newGoal > 5000) {
      Alert.alert('Invalid Goal', 'Please enter a calorie goal between 800 and 5000');
      return;
    }

    setProfile({ ...profile, calorie_goal: newGoal });
    setEditingGoals(false);
    Alert.alert('Success', 'Daily calorie goal updated!');
  };

  const handleSaveMacros = () => {
    const total = tempMacros.carbs + tempMacros.protein + tempMacros.fat;
    if (Math.abs(total - 100) > 1) {
      Alert.alert('Invalid Macros', 'Macro percentages must total 100%');
      return;
    }

    setProfile({ 
      ...profile, 
      macro_c: tempMacros.carbs,
      macro_p: tempMacros.protein,
      macro_f: tempMacros.fat,
    });
    setEditingMacros(false);
    Alert.alert('Success', 'Macro targets updated!');
  };

  const applyMacroPreset = (preset) => {
    setTempMacros({
      carbs: preset.carbs,
      protein: preset.protein,
      fat: preset.fat,
    });
  };

  const handleSaveProfile = () => {
    const validation = validateProfileData({
      age: parseInt(tempProfile.age),
      height_cm: parseFloat(tempProfile.height_cm),
      weight_kg: parseFloat(tempProfile.weight_kg),
    });

    if (!validation.isValid) {
      Alert.alert('Invalid Input', Object.values(validation.errors)[0]);
      return;
    }

    const updatedProfile = {
      ...profile,
      sex: tempProfile.sex,
      age: parseInt(tempProfile.age),
      height_cm: parseFloat(tempProfile.height_cm),
      weight_kg: parseFloat(tempProfile.weight_kg),
    };

    // Recalculate BMR, TDEE, and calorie goal
    const bmr = calculateBMR(updatedProfile);
    const tdee = calculateTDEE(bmr, updatedProfile.activity);
    const dailyGoal = calculateDailyGoal(tdee, updatedProfile.goal_type, updatedProfile.rate_kcal_per_day);

    const finalProfile = {
      ...updatedProfile,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      calorie_goal: dailyGoal,
    };

    setProfile(finalProfile);
    setEditingProfile(false);
    Alert.alert('Success', 'Profile updated! Your calorie goal has been recalculated.');
  };

  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={40} color="#4CAF50" />
      </View>
      
      <View style={styles.profileInfo}>
        <Text style={styles.profileName}>Your Profile</Text>
        {editingProfile ? (
          <View style={styles.profileEditContainer}>
            <View style={styles.sexSelection}>
              <Text style={styles.editLabel}>Sex</Text>
              <View style={styles.sexButtons}>
                {[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                ].map((sex) => (
                  <TouchableOpacity
                    key={sex.value}
                    style={[
                      styles.sexButton,
                      tempProfile.sex === sex.value && styles.selectedSexButton,
                    ]}
                    onPress={() => setTempProfile(prev => ({ ...prev, sex: sex.value }))}
                  >
                    <Text style={[
                      styles.sexButtonText,
                      tempProfile.sex === sex.value && styles.selectedSexButtonText,
                    ]}>
                      {sex.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.profileInputs}>
              <View style={styles.profileInputGroup}>
                <Text style={styles.editLabel}>Age</Text>
                <TextInput
                  style={styles.profileInput}
                  value={tempProfile.age}
                  onChangeText={(text) => setTempProfile(prev => ({ ...prev, age: text }))}
                  placeholder="Age"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.profileInputGroup}>
                <Text style={styles.editLabel}>Height (cm)</Text>
                <TextInput
                  style={styles.profileInput}
                  value={tempProfile.height_cm}
                  onChangeText={(text) => setTempProfile(prev => ({ ...prev, height_cm: text }))}
                  placeholder="Height"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.profileInputGroup}>
                <Text style={styles.editLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.profileInput}
                  value={tempProfile.weight_kg}
                  onChangeText={(text) => setTempProfile(prev => ({ ...prev, weight_kg: text }))}
                  placeholder="Weight"
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.profileEditActions}>
              <TouchableOpacity 
                style={styles.cancelProfileButton}
                onPress={() => {
                  setTempProfile({
                    sex: profile?.sex || 'male',
                    age: profile?.age?.toString() || '',
                    height_cm: profile?.height_cm?.toString() || '',
                    weight_kg: profile?.weight_kg?.toString() || '',
                  });
                  setEditingProfile(false);
                }}
              >
                <Text style={styles.cancelProfileButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveProfileButton}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveProfileButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={styles.profileDetails}>
            {profile.sex === 'male' ? 'Male' : 'Female'} • {profile.age} years • {profile.height_cm}cm • {profile.weight_kg}kg
          </Text>
        )}
      </View>

      <TouchableOpacity 
        style={styles.editProfileButton}
        onPress={() => {
          if (editingProfile) {
            setTempProfile({
              sex: profile?.sex || 'male',
              age: profile?.age?.toString() || '',
              height_cm: profile?.height_cm?.toString() || '',
              weight_kg: profile?.weight_kg?.toString() || '',
            });
            setEditingProfile(false);
          } else {
            setTempProfile({
              sex: profile?.sex || 'male',
              age: profile?.age?.toString() || '',
              height_cm: profile?.height_cm?.toString() || '',
              weight_kg: profile?.weight_kg?.toString() || '',
            });
            setEditingProfile(true);
          }
        }}
      >
        <Ionicons name="create-outline" size={20} color="#4CAF50" />
      </TouchableOpacity>
    </View>
  );

  const renderGoalsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Daily Goals</Text>
        <TouchableOpacity 
          onPress={() => setEditingGoals(!editingGoals)}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>
            {editingGoals ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      {editingGoals ? (
        <View style={styles.editContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Daily Calorie Goal</Text>
            <TextInput
              style={styles.textInput}
              value={tempGoal}
              onChangeText={setTempGoal}
              placeholder="Enter calorie goal"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.recommendations}>
            <Text style={styles.recTitle}>Recommendations based on your profile:</Text>
            <Text style={styles.recText}>BMR: {profile.bmr} kcal</Text>
            <Text style={styles.recText}>TDEE: {profile.tdee} kcal</Text>
            <Text style={styles.recText}>
              Maintenance: {calculateDailyGoal(profile.tdee, 'maintain', 0)} kcal
            </Text>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveGoal}>
            <Text style={styles.saveButtonText}>Save Goal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.goalDisplay}>
          <View style={styles.goalItem}>
            <Text style={styles.goalValue}>{profile.calorie_goal}</Text>
            <Text style={styles.goalLabel}>Daily Calories</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderMacrosSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Macro Targets</Text>
        <TouchableOpacity 
          onPress={() => setEditingMacros(!editingMacros)}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>
            {editingMacros ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      {editingMacros ? (
        <View style={styles.editContainer}>
          <View style={styles.presetButtons}>
            <Text style={styles.presetTitle}>Quick Presets:</Text>
            <View style={styles.presetRow}>
              {MACRO_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.name}
                  style={styles.presetButton}
                  onPress={() => applyMacroPreset(preset)}
                >
                  <Text style={styles.presetButtonText}>{preset.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.macroSliders}>
            <View style={styles.macroSlider}>
              <Text style={styles.macroSliderLabel}>
                Carbs: {tempMacros.carbs}%
              </Text>
              <View style={styles.sliderContainer}>
                <TouchableOpacity 
                  onPress={() => setTempMacros(prev => ({ 
                    ...prev, 
                    carbs: Math.max(10, prev.carbs - 5) 
                  }))}
                >
                  <Ionicons name="remove" size={20} color="#666" />
                </TouchableOpacity>
                <View style={[styles.sliderBar, { width: `${tempMacros.carbs}%` }]} />
                <TouchableOpacity 
                  onPress={() => setTempMacros(prev => ({ 
                    ...prev, 
                    carbs: Math.min(70, prev.carbs + 5) 
                  }))}
                >
                  <Ionicons name="add" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.macroSlider}>
              <Text style={styles.macroSliderLabel}>
                Protein: {tempMacros.protein}%
              </Text>
              <View style={styles.sliderContainer}>
                <TouchableOpacity 
                  onPress={() => setTempMacros(prev => ({ 
                    ...prev, 
                    protein: Math.max(10, prev.protein - 5) 
                  }))}
                >
                  <Ionicons name="remove" size={20} color="#666" />
                </TouchableOpacity>
                <View style={[styles.sliderBar, { width: `${tempMacros.protein}%`, backgroundColor: '#2196F3' }]} />
                <TouchableOpacity 
                  onPress={() => setTempMacros(prev => ({ 
                    ...prev, 
                    protein: Math.min(50, prev.protein + 5) 
                  }))}
                >
                  <Ionicons name="add" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.macroSlider}>
              <Text style={styles.macroSliderLabel}>
                Fat: {tempMacros.fat}%
              </Text>
              <View style={styles.sliderContainer}>
                <TouchableOpacity 
                  onPress={() => setTempMacros(prev => ({ 
                    ...prev, 
                    fat: Math.max(15, prev.fat - 5) 
                  }))}
                >
                  <Ionicons name="remove" size={20} color="#666" />
                </TouchableOpacity>
                <View style={[styles.sliderBar, { width: `${tempMacros.fat}%`, backgroundColor: '#FF9800' }]} />
                <TouchableOpacity 
                  onPress={() => setTempMacros(prev => ({ 
                    ...prev, 
                    fat: Math.min(60, prev.fat + 5) 
                  }))}
                >
                  <Ionicons name="add" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Text style={styles.macroTotal}>
            Total: {tempMacros.carbs + tempMacros.protein + tempMacros.fat}%
          </Text>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveMacros}>
            <Text style={styles.saveButtonText}>Save Macros</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.macroDisplay}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{profile.macro_c}%</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{profile.macro_p}%</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{profile.macro_f}%</Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderSettingsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Preferences</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.settingItem}
        onPress={() => router.push('/reminders')}
      >
        <View>
          <Text style={styles.settingLabel}>Reminders & Notifications</Text>
          <Text style={styles.settingDescription}>Meal reminders and notification settings</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );


  return (
    <ScrollView style={styles.container}>
      {renderProfileHeader()}
      {renderGoalsSection()}
      {renderMacrosSection()}
      {renderSettingsSection()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 32,
    marginBottom: 8,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8fff8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  profileDetails: {
    fontSize: 14,
    color: '#666',
  },
  editProfileButton: {
    padding: 8,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 8,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  editButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  editButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  editContainer: {
    paddingHorizontal: 20,
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
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  recommendations: {
    backgroundColor: '#f8fff8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  recTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 8,
  },
  recText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  goalDisplay: {
    paddingHorizontal: 20,
  },
  goalItem: {
    alignItems: 'center',
    backgroundColor: '#f8fff8',
    paddingVertical: 20,
    borderRadius: 12,
  },
  goalValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4CAF50',
  },
  goalLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  presetButtons: {
    marginBottom: 20,
  },
  presetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  presetButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  macroSliders: {
    marginBottom: 16,
  },
  macroSlider: {
    marginBottom: 16,
  },
  macroSliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderBar: {
    height: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    flex: 1,
  },
  macroTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  macroDisplay: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  macroItem: {
    width: '32%',
    alignItems: 'center',
    backgroundColor: '#f8fff8',
    paddingVertical: 16,
    borderRadius: 12,
  },
  macroValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
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
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  setupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  profileEditContainer: {
    flex: 1,
   marginTop: 8,
  },
  sexSelection: {
    marginBottom: 16,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sexButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sexButton: {
    flex: 1,
   paddingVertical: 10,
   paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
   borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  selectedSexButton: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8fff8',
  },
  sexButtonText: {
   fontSize: 15,
   fontWeight: '500',
    color: '#333',
  },
  selectedSexButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  profileInputs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
   alignItems: 'flex-end',
  },
  profileInputGroup: {
    flex: 1,
  },
  profileInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
   borderRadius: 8,
   paddingVertical: 12,
   paddingHorizontal: 10,
   fontSize: 15,
    textAlign: 'center',
   color: '#000',
  },
  profileEditActions: {
    flexDirection: 'row',
    gap: 8,
   marginTop: 4,
  },
  cancelProfileButton: {
    flex: 1,
   paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
   borderRadius: 8,
    alignItems: 'center',
   justifyContent: 'center',
  },
  cancelProfileButtonText: {
   fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  saveProfileButton: {
    flex: 1,
   paddingVertical: 10,
    backgroundColor: '#4CAF50',
   borderRadius: 8,
    alignItems: 'center',
   justifyContent: 'center',
  },
  saveProfileButtonText: {
   fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
});