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
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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

const GOAL_TYPE_LABELS = {
  lose: 'Lose Weight',
  maintain: 'Maintain Weight',
  gain: 'Gain Weight',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { 
    profile, 
    updateProfile, 
    syncUserData,
    loadLocalUserData,
    isLoading 
  } = useAppStore();

  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

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
      
      // 获取当前profile数据用于调试
      const currentProfile = get().profile;
      setDebugInfo(currentProfile);
      console.log('当前Profile数据:', currentProfile);
      
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

  const handleEditGoals = () => {
    setShowGoalsModal(true);
  };

  const handleSaveGoals = async (newGoals) => {
    try {
      // 更新本地状态
      updateProfile(newGoals);
      
      // 同步到服务器
      await syncUserData();
      
      Alert.alert('Success', 'Goals updated successfully');
    } catch (error) {
      console.error('保存目标失败:', error);
      Alert.alert('Error', 'Failed to save goals. Please try again.');
    }
  };

  const calculateBMI = () => {
    if (!profile?.height_cm || !profile?.weight_kg) return null;
    const heightM = profile.height_cm / 100;
    return (profile.weight_kg / (heightM * heightM)).toFixed(1);
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
    // 检查多个可能的字段名
    const currentWeight = profile?.weight_kg;
    const goalWeight = profile?.goal_weight_kg;
    
    if (!currentWeight || !goalWeight) return null;
    
    const current = profile.weight_kg;
    const goal = profile.goal_weight_kg;
    const difference = Math.abs(goal - current);
    const direction = goal > current ? 'gain' : 'lose';
    return { difference: difference.toFixed(1), direction };
  };

  // 调试函数：获取实际的字段值
  const getFieldValue = (fieldName, fallback = 'Not set') => {
    const value = profile?.[fieldName];
    console.log(`字段 ${fieldName}:`, value);
    return value || fallback;
  };

  // 获取活动水平显示文本
  const getActivityLevelDisplay = () => {
    const activityLevel = profile?.activity_level;
    console.log('Activity level from profile:', activityLevel);
    return activityLevel ? ACTIVITY_LEVEL_LABELS[activityLevel] || activityLevel : 'Not set';
  };

  // 获取目标类型显示文本
  const getGoalTypeDisplay = () => {
    const goalType = profile?.goal_type;
    console.log('Goal type from profile:', goalType);
    return goalType ? GOAL_TYPE_LABELS[goalType] || goalType : 'Not set';
  };

  // 获取每周目标显示文本
  const getWeeklyGoalDisplay = () => {
    const weeklyGoal = profile?.weeklyGoal || profile?.weekly_goal;
    console.log('Weekly goal from profile:', weeklyGoal);
    if (!weeklyGoal) return 'Not set';
    
    const direction = weeklyGoal > 0 ? 'Gain' : 'Lose';
    return `${direction} ${Math.abs(weeklyGoal)} lb/week`;
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      
      {/* Header */}
      <View style={styles.header}>
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

      {/* Daily Goals Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Goals</Text>
          <TouchableOpacity onPress={handleEditGoals}>
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
          
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Activity Level</Text>
            <Text style={styles.profileValue}>
              {getActivityLevelDisplay()}
            </Text>
          </View>
          
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Weekly Goal</Text>
            <Text style={styles.profileValue}>
              {getWeeklyGoalDisplay()}
            </Text>
          </View>
          
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
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sex</Text>
            <Text style={styles.infoValue}>
              {getFieldValue('sex') !== 'Not set' ? profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1) : 'Not set'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Age</Text>
            <Text style={styles.infoValue}>
              {getFieldValue('age') !== 'Not set' ? `${profile.age} years` : 'Not set'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Height</Text>
            <Text style={styles.infoValue}>
              {getFieldValue('height_cm') !== 'Not set' ? `${profile.height_cm} cm` : 'Not set'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Current Weight</Text>
            <Text style={styles.infoValue}>
              {getFieldValue('weight_kg') !== 'Not set' ? `${profile.weight_kg} kg` : 'Not set'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Goal Weight</Text>
            <Text style={styles.infoValue}>
              {getFieldValue('goal_weight_kg') !== 'Not set' ? `${profile.goal_weight_kg} kg` : 'Not set'}
            </Text>
          </View>
          
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
          
          {(profile?.goals || profile?.goals) && (profile?.goals?.length > 0) && (
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

      {/* Debug Section (only show if profile has UID) */}
      {profile?.uid && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug Info</Text>
          
          <View style={styles.debugRows}>
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>User ID</Text>
              <Text style={styles.debugValue}>{profile.uid}</Text>
            </View>
            
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>Data Source</Text>
              <Text style={styles.debugValue}>
                {profile?.created_at ? 'Server' : 'Local'}
              </Text>
            </View>
            
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>Profile Keys</Text>
              <Text style={styles.debugValue}>
                {profile ? Object.keys(profile).length : 0} fields
              </Text>
            </View>
            
            {debugInfo && (
              <View style={styles.debugDataContainer}>
                <Text style={styles.debugDataTitle}>Raw Profile Data:</Text>
                <Text style={styles.debugDataText}>
                  {JSON.stringify(debugInfo, null, 2)}
                </Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.debugButton}
              onPress={handleRefreshData}
              disabled={isRefreshing}
            >
              <Text style={styles.debugButtonText}>
                {isRefreshing ? 'Refreshing...' : 'Refresh from Server'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Goals Modal */}
      <CalorieMacroGoalsModal
        visible={showGoalsModal}
        onClose={() => setShowGoalsModal(false)}
        currentGoals={profile}
        onSave={handleSaveGoals}
      />
    </ScrollView>
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
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#F2F2F7',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
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
    flex: 1,
  },
  profileValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    textAlign: 'right',
    flex: 1,
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
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    textAlign: 'right',
    flex: 1,
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
  
  // Debug Section
  debugRows: {
    gap: 12,
  },
  debugRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  debugLabel: {
    fontSize: 14,
    color: '#666',
  },
  debugValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    fontFamily: 'monospace',
  },
  debugButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  debugButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
  },
  debugDataContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  debugDataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  debugDataText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    lineHeight: 16,
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
});