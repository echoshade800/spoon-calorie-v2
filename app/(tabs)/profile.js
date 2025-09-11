/**
 * Profile Screen - User settings, goals, and account management
 * 
 * Purpose: Display and edit user profile, daily goals, and app preferences
 * Features: Goal editing, profile management, app settings, data export
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
import { formatCalories } from '@/utils/helpers';
import CalorieMacroGoalsModal from '@/components/CalorieMacroGoalsModal';

const ACTIVITY_LEVEL_LABELS = {
  sedentary: 'Not Very Active',
  lightly_active: 'Lightly Active',
  moderately_active: 'Active', 
  very_active: 'Very Active',
  extra_active: 'Extremely Active',
};

const ACTIVITY_LEVEL_FACTORS = {
  sedentary: 1.40,
  lightly_active: 1.60,
  moderately_active: 1.80,
  very_active: 2.00,
  extra_active: 2.20,
};

const GOAL_TYPE_LABELS = {
  lose: 'Lose Weight',
  maintain: 'Maintain Weight',
  gain: 'Gain Weight',
};

const WEEKLY_GOAL_OPTIONS = [
  { value: -1.0, label: 'Lose 1.0 lb per week', delta: -500 },
  { value: -0.75, label: 'Lose 0.75 lb per week', delta: -375 },
  { value: -0.5, label: 'Lose 0.5 lb per week', delta: -250 },
  { value: 0, label: 'Maintain current weight', delta: 0 },
  { value: 0.5, label: 'Gain 0.5 lb per week', delta: 250 },
  { value: 1.0, label: 'Gain 1.0 lb per week', delta: 500 },
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { 
    profile, 
    updateProfile, 
    syncUserData,
    loadLocalUserData,
    isLoading 
  } = useAppStore();

  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  // 加载用户数据
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsRefreshing(true);
      
      // 重新加载本地用户数据
      await loadLocalUserData();
      
      // 尝试从服务器同步最新数据
      await syncUserData();
      
      console.log('Profile数据加载完成');
    } catch (error) {
      console.error('加载Profile数据失败:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefreshData = async () => {
    await loadProfileData();
    Alert.alert('Success', 'Profile data refreshed');
  };

  // BMR计算 (Mifflin-St Jeor公式)
  const calculateBMR = (sex, weight, height, age) => {
    const W = parseFloat(weight);
    const H = parseFloat(height);
    const A = parseInt(age);
    const C = sex === 'male' ? 5 : -161;
    
    return 10 * W + 6.25 * H - 5 * A + C;
  };

  // TDEE计算
  const calculateTDEE = (bmr, activityLevel) => {
    const factor = ACTIVITY_LEVEL_FACTORS[activityLevel] || 1.40;
    return bmr * factor;
  };

  // Daily Goal计算
  const calculateDailyGoal = (tdee, weeklyGoal) => {
    const weeklyGoalOption = WEEKLY_GOAL_OPTIONS.find(option => option.value === weeklyGoal);
    const delta = weeklyGoalOption?.delta || 0;
    const dailyGoal = tdee + delta;
    return Math.round(dailyGoal / 10) * 10; // 四舍五入到最接近10
  };

  // 重新计算所有目标
  const recalculateGoals = (updatedProfile) => {
    const { sex, age, height_cm, weight_kg, activity_level, weeklyGoal } = updatedProfile;
    
    if (!sex || !age || !height_cm || !weight_kg || !activity_level) {
      return updatedProfile; // 缺少必要数据，不重新计算
    }

    const bmr = calculateBMR(sex, weight_kg, height_cm, age);
    const tdee = calculateTDEE(bmr, activity_level);
    const dailyGoal = calculateDailyGoal(tdee, weeklyGoal || 0);

    return {
      ...updatedProfile,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      calorie_goal: dailyGoal,
    };
  };

  const handleFieldEdit = (fieldName, fieldLabel, currentValue) => {
    Alert.alert(
      `Edit ${fieldLabel}`,
      `You're about to edit ${fieldLabel}. This will recalculate your daily calorie goal. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Edit', 
          onPress: () => {
            setEditingField(fieldName);
            setEditValue(currentValue?.toString() || '');
            setShowEditModal(true);
          }
        },
      ]
    );
  };

  const handleSaveEdit = async () => {
    if (!editingField || !editValue.trim()) {
      Alert.alert('Error', 'Please enter a valid value');
      return;
    }

    try {
      let processedValue = editValue.trim();
      
      // 根据字段类型处理值
      if (['age', 'height_cm', 'weight_kg', 'goal_weight_kg'].includes(editingField)) {
        processedValue = parseFloat(processedValue);
        if (isNaN(processedValue) || processedValue <= 0) {
          Alert.alert('Error', 'Please enter a valid number');
          return;
        }
      }

      // 创建更新的profile
      const updatedProfile = {
        ...profile,
        [editingField]: processedValue
      };

      // 重新计算BMR、TDEE和Daily Goal
      const recalculatedProfile = recalculateGoals(updatedProfile);

      // 更新本地状态
      updateProfile(recalculatedProfile);

      // 同步到服务器
      await syncUserData();

      setShowEditModal(false);
      setEditingField(null);
      setEditValue('');

      Alert.alert('Success', `${getFieldLabel(editingField)} updated and goals recalculated`);
    } catch (error) {
      console.error('保存编辑失败:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    }
  };

  const handleWeeklyGoalEdit = () => {
    Alert.alert(
      'Edit Weekly Goal',
      'You\'re about to edit Weekly Goal. This will recalculate your daily calorie goal. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Edit', 
          onPress: () => {
            setEditingField('weeklyGoal');
            setShowEditModal(true);
          }
        },
      ]
    );
  };

  const handleActivityLevelEdit = () => {
    Alert.alert(
      'Edit Activity Level',
      'You\'re about to edit Activity Level. This will recalculate your daily calorie goal. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Edit', 
          onPress: () => {
            setEditingField('activity_level');
            setShowEditModal(true);
          }
        },
      ]
    );
  };

  const getFieldLabel = (fieldName) => {
    const labels = {
      sex: 'Sex',
      age: 'Age',
      height_cm: 'Height',
      weight_kg: 'Current Weight',
      goal_weight_kg: 'Goal Weight',
      weeklyGoal: 'Weekly Goal',
      activity_level: 'Activity Level',
    };
    return labels[fieldName] || fieldName;
  };

  const renderEditModal = () => {
    if (!editingField) return null;

    const fieldLabel = getFieldLabel(editingField);

    // 性别选择
    if (editingField === 'sex') {
      return (
        <Modal visible={showEditModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.editModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select {fieldLabel}</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              
              {['male', 'female'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.optionButton}
                  onPress={() => {
                    setEditValue(option);
                    setTimeout(handleSaveEdit, 100);
                  }}
                >
                  <Text style={styles.optionText}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                  {profile?.sex === option && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
      );
    }

    // 活动水平选择
    if (editingField === 'activity_level') {
      return (
        <Modal visible={showEditModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.editModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select {fieldLabel}</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              
              {Object.entries(ACTIVITY_LEVEL_LABELS).map(([value, label]) => (
                <TouchableOpacity
                  key={value}
                  style={styles.optionButton}
                  onPress={() => {
                    setEditValue(value);
                    setTimeout(handleSaveEdit, 100);
                  }}
                >
                  <Text style={styles.optionText}>{label}</Text>
                  {profile?.activity_level === value && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
      );
    }

    // 每周目标选择
    if (editingField === 'weeklyGoal') {
      return (
        <Modal visible={showEditModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.editModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select {fieldLabel}</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              
              {WEEKLY_GOAL_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.optionButton}
                  onPress={() => {
                    setEditValue(option.value);
                    setTimeout(handleSaveEdit, 100);
                  }}
                >
                  <Text style={styles.optionText}>{option.label}</Text>
                  {(profile?.weeklyGoal || profile?.weekly_goal) === option.value && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
      );
    }

    // 数字输入
    return (
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit {fieldLabel}</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.editInput}
                value={editValue}
                onChangeText={setEditValue}
                placeholder={`Enter ${fieldLabel.toLowerCase()}`}
                placeholderTextColor="#999"
                keyboardType="numeric"
                autoFocus
              />
              
              <View style={styles.inputActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const calculateBMI = () => {
    if (!profile?.height_cm || !profile?.weight_kg) return null;
    const heightM = parseFloat(profile.height_cm) / 100;
    const weight = parseFloat(profile.weight_kg);
    return (weight / (heightM * heightM)).toFixed(1);
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return '';
    const bmiValue = parseFloat(bmi);
    if (bmiValue < 18.5) return 'Underweight';
    if (bmiValue < 25) return 'Normal';
    if (bmiValue < 30) return 'Overweight';
    return 'Obese';
  };

  const getWeightProgress = () => {
    const currentWeight = parseFloat(profile?.weight_kg);
    const goalWeight = parseFloat(profile?.goal_weight_kg);
    
    if (!currentWeight || !goalWeight) return null;
    
    const difference = Math.abs(goalWeight - currentWeight);
    const direction = goalWeight > currentWeight ? 'gain' : 'lose';
    return { difference: difference.toFixed(1), direction };
  };

  const getFieldValue = (fieldName, fallback = 'Not set') => {
    const value = profile?.[fieldName];
    return value !== undefined && value !== null && value !== '' ? value : fallback;
  };

  const getActivityLevelDisplay = () => {
    const activityLevel = profile?.activity_level;
    return activityLevel ? ACTIVITY_LEVEL_LABELS[activityLevel] || activityLevel : 'Not set';
  };

  const getGoalTypeDisplay = () => {
    const goalType = profile?.goal_type;
    return goalType ? GOAL_TYPE_LABELS[goalType] || goalType : 'Not set';
  };

  const getWeeklyGoalDisplay = () => {
    const weeklyGoal = profile?.weeklyGoal || profile?.weekly_goal;
    if (weeklyGoal === undefined || weeklyGoal === null) return 'Not set';
    
    const option = WEEKLY_GOAL_OPTIONS.find(opt => opt.value === weeklyGoal);
    return option ? option.label : `${weeklyGoal > 0 ? 'Gain' : 'Lose'} ${Math.abs(weeklyGoal)} lb/week`;
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={loadProfileData}
          >
            <Text style={styles.refreshButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const bmi = calculateBMI();
  const weightProgress = getWeightProgress();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          onPress={handleRefreshData}
          disabled={isRefreshing}
        >
          <Ionicons 
            name="refresh" 
            size={24} 
            color={isRefreshing ? "#C7C7CC" : "#4CAF50"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Daily Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Goals</Text>
            <TouchableOpacity onPress={() => setShowGoalsModal(true)}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.goalsGrid}>
            <View style={styles.goalCard}>
              <Text style={styles.goalValue}>
                {getFieldValue('calorie_goal') !== 'Not set' ? formatCalories(profile.calorie_goal) : '-'}
              </Text>
              <Text style={styles.goalLabel}>Calories</Text>
            </View>
            
            <View style={styles.goalCard}>
              <Text style={styles.goalValue}>
                {getFieldValue('macro_c') !== 'Not set' ? `${profile.macro_c}%` : '-'}
              </Text>
              <Text style={styles.goalLabel}>Carbs</Text>
            </View>
            
            <View style={styles.goalCard}>
              <Text style={styles.goalValue}>
                {getFieldValue('macro_p') !== 'Not set' ? `${profile.macro_p}%` : '-'}
              </Text>
              <Text style={styles.goalLabel}>Protein</Text>
            </View>
            
            <View style={styles.goalCard}>
              <Text style={styles.goalValue}>
                {getFieldValue('macro_f') !== 'Not set' ? `${profile.macro_f}%` : '-'}
              </Text>
              <Text style={styles.goalLabel}>Fat</Text>
            </View>
          </View>
        </View>

        {/* Your Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Profile</Text>
          
          <View style={styles.profileRows}>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Goal</Text>
              <Text style={styles.profileValue}>
                {getGoalTypeDisplay()}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.profileRow}
              onPress={() => handleActivityLevelEdit()}
            >
              <Text style={styles.profileLabel}>Activity Level</Text>
              <View style={styles.profileValueContainer}>
                <Text style={styles.profileValue}>
                  {getActivityLevelDisplay()}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.profileRow}
              onPress={() => handleWeeklyGoalEdit()}
            >
              <Text style={styles.profileLabel}>Weekly Goal</Text>
              <View style={styles.profileValueContainer}>
                <Text style={styles.profileValue}>
                  {getWeeklyGoalDisplay()}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
              </View>
            </TouchableOpacity>
            
            {weightProgress && (
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Weight Progress</Text>
                <Text style={styles.profileValue}>
                  {weightProgress.difference} kg to {weightProgress.direction}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Your Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Info</Text>
          
          <View style={styles.infoRows}>
            <TouchableOpacity 
              style={styles.infoRow}
              onPress={() => handleFieldEdit('sex', 'Sex', profile?.sex)}
            >
              <Text style={styles.infoLabel}>Sex</Text>
              <View style={styles.infoValueContainer}>
                <Text style={styles.infoValue}>
                  {getFieldValue('sex') !== 'Not set' ? profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1) : 'Not set'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.infoRow}
              onPress={() => handleFieldEdit('age', 'Age', profile?.age)}
            >
              <Text style={styles.infoLabel}>Age</Text>
              <View style={styles.infoValueContainer}>
                <Text style={styles.infoValue}>
                  {getFieldValue('age') !== 'Not set' ? `${profile.age} years` : 'Not set'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.infoRow}
              onPress={() => handleFieldEdit('height_cm', 'Height', profile?.height_cm)}
            >
              <Text style={styles.infoLabel}>Height</Text>
              <View style={styles.infoValueContainer}>
                <Text style={styles.infoValue}>
                  {getFieldValue('height_cm') !== 'Not set' ? `${profile.height_cm} cm` : 'Not set'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.infoRow}
              onPress={() => handleFieldEdit('weight_kg', 'Current Weight', profile?.weight_kg)}
            >
              <Text style={styles.infoLabel}>Current Weight</Text>
              <View style={styles.infoValueContainer}>
                <Text style={styles.infoValue}>
                  {getFieldValue('weight_kg') !== 'Not set' ? `${profile.weight_kg} kg` : 'Not set'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.infoRow}
              onPress={() => handleFieldEdit('goal_weight_kg', 'Goal Weight', profile?.goal_weight_kg)}
            >
              <Text style={styles.infoLabel}>Goal Weight</Text>
              <View style={styles.infoValueContainer}>
                <Text style={styles.infoValue}>
                  {getFieldValue('goal_weight_kg') !== 'Not set' ? `${profile.goal_weight_kg} kg` : 'Not set'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
              </View>
            </TouchableOpacity>
            
            {bmi && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>BMI</Text>
                <Text style={styles.infoValue}>
                  {bmi} ({getBMICategory(bmi)})
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Metabolism Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metabolism</Text>
          
          <View style={styles.metabolismRows}>
            <View style={styles.metabolismRow}>
              <Text style={styles.metabolismLabel}>BMR (Base Metabolic Rate)</Text>
              <Text style={styles.metabolismValue}>
                {getFieldValue('bmr') !== 'Not set' ? `${formatCalories(profile.bmr)} kcal/day` : 'Not calculated'}
              </Text>
              <Text style={styles.metabolismDescription}>
                Calories burned at rest
              </Text>
            </View>
            
            <View style={styles.metabolismRow}>
              <Text style={styles.metabolismLabel}>TDEE (Total Daily Energy Expenditure)</Text>
              <Text style={styles.metabolismValue}>
                {getFieldValue('tdee') !== 'Not set' ? `${formatCalories(profile.tdee)} kcal/day` : 'Not calculated'}
              </Text>
              <Text style={styles.metabolismDescription}>
                BMR + activity level
              </Text>
            </View>
          </View>
        </View>

        {/* Onboarding Data Section */}
        {(profile?.goals || profile?.barriers || profile?.healthyHabits || profile?.healthy_habits) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Preferences</Text>
            
            {(profile?.goals) && (profile?.goals?.length > 0) && (
              <View style={styles.preferenceRow}>
                <Text style={styles.preferenceLabel}>Goals</Text>
                <Text style={styles.preferenceValue}>
                  {Array.isArray(profile.goals) ? profile.goals.join(', ') : 'Not set'}
                </Text>
              </View>
            )}
            
            {(profile?.barriers) && (profile?.barriers?.length > 0) && (
              <View style={styles.preferenceRow}>
                <Text style={styles.preferenceLabel}>Past Barriers</Text>
                <Text style={styles.preferenceValue}>
                  {Array.isArray(profile.barriers) ? profile.barriers.join(', ') : 'Not set'}
                </Text>
              </View>
            )}
            
            {(profile?.healthyHabits || profile?.healthy_habits) && ((profile?.healthyHabits?.length > 0) || (profile?.healthy_habits?.length > 0)) && (
              <View style={styles.preferenceRow}>
                <Text style={styles.preferenceLabel}>Healthy Habits</Text>
                <Text style={styles.preferenceValue}>
                  {(() => {
                    const habits = profile.healthyHabits || profile.healthy_habits || [];
                    if (!Array.isArray(habits) || habits.length === 0) return 'Not set';
                    const displayHabits = habits.slice(0, 3).join(', ');
                    const moreCount = habits.length > 3 ? ` +${habits.length - 3} more` : '';
                    return displayHabits + moreCount;
                  })()}
                </Text>
              </View>
            )}
            
            {(profile?.mealPlanning || profile?.meal_planning) && (
              <View style={styles.preferenceRow}>
                <Text style={styles.preferenceLabel}>Meal Planning</Text>
                <Text style={styles.preferenceValue}>
                  {(() => {
                    const mealPlanning = profile.mealPlanning || profile.meal_planning;
                    return mealPlanning ? mealPlanning.charAt(0).toUpperCase() + mealPlanning.slice(1) : 'Not set';
                  })()}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* App Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => router.push('/reminders')}
          >
            <View style={styles.settingContent}>
              <Ionicons name="notifications-outline" size={24} color="#4CAF50" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Reminders & Notifications</Text>
                <Text style={styles.settingDescription}>Meal reminders and alerts</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingContent}>
              <Ionicons name="shield-outline" size={24} color="#4CAF50" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Privacy & Data</Text>
                <Text style={styles.settingDescription}>Data export and privacy settings</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => router.push('/about')}
          >
            <View style={styles.settingContent}>
              <Ionicons name="information-circle-outline" size={24} color="#4CAF50" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>About & Help</Text>
                <Text style={styles.settingDescription}>App info, support, and FAQ</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Goals Modal */}
      <CalorieMacroGoalsModal
        visible={showGoalsModal}
        onClose={() => setShowGoalsModal(false)}
        currentGoals={profile}
        onSave={async (newGoals) => {
          const updatedProfile = { ...profile, ...newGoals };
          updateProfile(updatedProfile);
          await syncUserData();
        }}
      />

      {/* Edit Modal */}
      {renderEditModal()}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#F2F2F7',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  editButton: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  
  // Daily Goals
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  goalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  goalLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  
  // Profile Rows
  profileRows: {
    gap: 0,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  profileLabel: {
    fontSize: 16,
    color: '#000',
    flex: 0,
  },
  profileValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    textAlign: 'right',
    flex: 0,
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },
  profileValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  // Info Rows
  infoRows: {
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#000',
    flex: 0,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    textAlign: 'right',
    numberOfLines: 1,
    ellipsizeMode: 'tail',
    flex: 0,
  },
  infoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  // Metabolism Section
  metabolismRows: {
    gap: 16,
  },
  metabolismRow: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  metabolismLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  metabolismValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  metabolismDescription: {
    fontSize: 14,
    color: '#666',
  },
  
  // Preferences Section
  preferenceRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  preferenceValue: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  
  // Settings Section
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Edit Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 0,
    width: '85%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionText: {
    fontSize: 16,
    color: '#000',
  },
  inputContainer: {
    padding: 20,
  },
  editInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    marginBottom: 16,
  },
  inputActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});