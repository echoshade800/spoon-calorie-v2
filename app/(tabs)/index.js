/**
 * Home/Dashboard Screen - Main overview with calorie progress
 * 
 * Purpose: Display daily calorie progress, remaining calories, and quick actions
 * Extends: Add weekly trends, meal timing insights, streak tracking
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/stores/useAppStore';
import { formatCalories, formatDate } from '@/utils/helpers';
import ProgressRing from '@/components/ProgressRing';
import CalorieMacroGoalsModal from '@/components/CalorieMacroGoalsModal';
import { useStepsData } from '@/hooks/useStepsData';

export default function HomeScreen() {
  const router = useRouter();
  const { 
    profile, 
    isOnboarded, 
    selectedDate,
    getTodaysStats,
    getTodaysExercises
  } = useAppStore();

  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const stepsData = useStepsData();

  useEffect(() => {
    if (!isOnboarded) {
      router.replace('/onboarding');
    }
  }, [isOnboarded]);

  if (!isOnboarded || !profile) {
    return null;
  }

  const todaysStats = getTodaysStats();
  const todaysExercises = getTodaysExercises();
  const remaining = profile.calorie_goal - todaysStats.kcal;
  const exerciseFromWorkouts = todaysExercises.reduce((sum, ex) => sum + ex.calories, 0);
  const exercise = exerciseFromWorkouts + (stepsData.caloriesBurned || 0);
  const adjustedRemaining = remaining + exercise;
  const progress = Math.min((todaysStats.kcal / profile.calorie_goal) * 100, 100);
  
  const getProgressColor = () => {
    if (adjustedRemaining > 200) return '#007AFF'; // Blue like MyFitnessPal
    if (adjustedRemaining > 0) return '#FF9500'; // Orange - close
    return '#FF3B30'; // Red - over
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Today Section */}
      <View style={styles.todaySection}>
        <View style={styles.todayHeader}>
          <Text style={styles.todayTitle}>Today</Text>
          <TouchableOpacity onPress={() => setShowGoalsModal(true)}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Calories Card */}
        <View style={styles.caloriesCard}>
          <Text style={styles.caloriesTitle}>Calories</Text>
          <Text style={styles.caloriesSubtitle}>
            Remaining = Goal - Food + Exercise
          </Text>

          <View style={styles.progressContainer}>
            {/* Progress Ring */}
            <View style={styles.progressRingContainer}>
              <ProgressRing
                size={160}
                strokeWidth={8}
                progress={progress}
                color={getProgressColor()}
                backgroundColor="#E5E5EA"
              >
                <View style={styles.progressContent}>
                  <Text style={styles.remainingNumber}>
                    {formatCalories(Math.abs(adjustedRemaining))}
                  </Text>
                  <Text style={styles.remainingLabel}>Remaining</Text>
                </View>
              </ProgressRing>
            </View>

            {/* Side Metrics */}
            <View style={styles.sideMetrics}>
              <View style={styles.metricRow}>
                <View style={styles.metricIcon}>
                  <Ionicons name="flag" size={24} color="#8E8E93" />
                </View>
                <View style={styles.metricContent}>
                  <Text style={styles.metricLabel}>Base Goal</Text>
                  <Text style={styles.metricValue}>{formatCalories(profile.calorie_goal)}</Text>
                </View>
              </View>
              
              <View style={styles.metricRow}>
                <View style={styles.metricIcon}>
                  <Ionicons name="restaurant" size={24} color="#4CAF50" />
                </View>
                <View style={styles.metricContent}>
                  <Text style={styles.metricLabel}>Food</Text>
                  <Text style={styles.metricValue}>{formatCalories(todaysStats.kcal)}</Text>
                </View>
              </View>
              
              <View style={styles.metricRow}>
                <View style={styles.metricIcon}>
                  <Ionicons name="flame" size={24} color="#FF9500" />
                </View>
                <View style={styles.metricContent}>
                  <Text style={styles.metricLabel}>Exercise</Text>
                  <Text style={styles.metricValue}>{formatCalories(exercise)}</Text>
                </View>
              </View>
            </View>
          </View>

        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity 
          style={styles.primaryAction}
          onPress={() => router.push('/add')}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.primaryActionText}>Log Food</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Stats */}
      <View style={styles.bottomStats}>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => {
            if (!stepsData.hasPermission) {
              stepsData.requestPermissions();
            } else if (stepsData.error) {
              stepsData.refreshSteps();
            }
          }}
        >
          <View style={styles.statHeader}>
            <Text style={styles.statTitle}>Steps</Text>
            {stepsData.isLoading && (
              <Ionicons name="refresh" size={16} color="#8E8E93" />
            )}
            {!stepsData.hasPermission && (
              <Ionicons name="lock-closed" size={16} color="#FF3B30" />
            )}
          </View>
          <View style={styles.statContent}>
            <View style={styles.statIcon}>
              <Ionicons name="footsteps" size={20} color={stepsData.hasPermission ? "#4CAF50" : "#8E8E93"} />
            </View>
            <View>
              <Text style={[
                styles.statNumber,
                !stepsData.hasPermission && styles.statNumberDisabled
              ]}>
                {stepsData.isLoading ? '...' : stepsData.steps.toLocaleString()}
              </Text>
              <Text style={[
                styles.statGoal,
                !stepsData.hasPermission && styles.statGoalDisabled
              ]}>
                {stepsData.hasPermission ? `Goal: ${stepsData.goal.toLocaleString()} steps` : 'Tap to enable'}
              </Text>
              {stepsData.error && (
                <Text style={styles.statError}>{stepsData.error}</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statTitle}>Exercise</Text>
            <TouchableOpacity onPress={() => router.push('/exercise')}>
              <Ionicons name="add" size={20} color="#4CAF50" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.exerciseCardContent}
            onPress={() => router.push('/diary')}
          >
            <View style={styles.statContent}>
              <View style={styles.statIcon}>
                <Ionicons name="flame" size={20} color="#FF9500" />
              </View>
              <View>
                <Text style={styles.statNumber}>{formatCalories(exercise)} cal</Text>
              </View>
            </View>
            <View style={styles.statContent}>
              <View style={styles.statIcon}>
                <Ionicons name="time" size={20} color="#FF9500" />
              </View>
              <View>
                <Text style={styles.statTime}>
                  {Math.floor(todaysExercises.reduce((sum, ex) => sum + ex.durationMin, 0) / 60)}:
                  {String(todaysExercises.reduce((sum, ex) => sum + ex.durationMin, 0) % 60).padStart(2, '0')} hr
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Goals Modal */}
      <CalorieMacroGoalsModal
        visible={showGoalsModal}
        onClose={() => setShowGoalsModal(false)}
        currentGoals={profile}
        onSave={(newGoals) => {
          const { updateProfile } = useAppStore.getState();
          updateProfile(newGoals);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    paddingBottom: 20,
  },
  todaySection: {
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  todayTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  editButton: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  caloriesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  caloriesTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  caloriesSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  progressRingContainer: {
    alignItems: 'center',
    marginLeft: 8,
  },
  progressContent: {
    alignItems: 'center',
  },
  remainingNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
  },
  remainingLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  sideMetrics: {
    gap: 16,
    marginLeft: -12,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricContent: {
    alignItems: 'flex-start',
  },
  metricLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  primaryAction: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryActionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  bottomStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  statGoal: {
    fontSize: 12,
    color: '#8E8E93',
  },
  statTime: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statNumberDisabled: {
    color: '#8E8E93',
  },
  statGoalDisabled: {
    color: '#8E8E93',
  },
  statError: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 2,
  },
  statSubtext: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  exerciseCardContent: {
    flex: 1,
  },
});