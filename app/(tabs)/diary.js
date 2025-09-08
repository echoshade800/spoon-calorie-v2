/**
 * Diary Screen - 沿用 p1 布局与交互规范
 * 
 * 布局结构：
 * 1. 顶栏：标题 + 日期选择器
 * 2. Summary卡片：Calories Remaining 实时公式
 * 3. 餐次列表：Breakfast/Lunch/Dinner，每餐有ADD FOOD按钮
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SectionList,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/stores/useAppStore';
import { formatCalories, formatDate, getMealDisplayName } from '@/utils/helpers';
import ProgressRing from '@/components/ProgressRing';
import DatePickerModal from '@/components/DatePickerModal';
import { useStepsData } from '@/hooks/useStepsData';

// Add ref for scrolling to exercise section
const EXERCISE_SECTION_INDEX = 4; // Exercise is the 5th section (0-indexed)

const MEAL_SECTIONS = [
  { title: 'Breakfast', data: [], key: 'breakfast' },
  { title: 'Lunch', data: [], key: 'lunch' },
  { title: 'Dinner', data: [], key: 'dinner' },
  { title: 'Snacks', data: [], key: 'snack' },
  { title: 'Exercise', data: [], key: 'exercise' },
];

export default function DiaryScreen() {
  const router = useRouter();
  const sectionListRef = React.useRef(null);
  const stepsData = useStepsData();
  const {
    selectedDate,
    setSelectedDate,
    getTodaysEntries,
    exerciseEntries,
    getTodaysStats,
    profile,
    deleteDiaryEntry,
    deleteExerciseEntry,
    myMeals,
    loadUserMeals,
    loadTodaysDiaryEntries,
    loadTodaysExerciseEntries,
    getTodaysExercises
  } = useAppStore();

  const [showDatePicker, setShowDatePicker] = useState(false);

  // Handle navigation from home exercise card
  React.useEffect(() => {
    // 确保加载用户餐食数据
    loadUserMeals();
    // 加载今天的日记条目
    loadTodaysDiaryEntries();
    // 加载今天的运动条目
    loadTodaysExerciseEntries();
    
    // Check if we should scroll to exercise section
    const timer = setTimeout(() => {
      if (sectionListRef.current) {
        sectionListRef.current.scrollToLocation({
          sectionIndex: EXERCISE_SECTION_INDEX,
          itemIndex: 0,
          animated: true,
          viewPosition: 0.5, // Center the section on screen
        });
      }
    }, 300); // Small delay to ensure component is mounted

    return () => clearTimeout(timer);
  }, []);

  // 当选择的日期改变时，重新加载数据
  React.useEffect(() => {
    loadTodaysDiaryEntries();
    loadTodaysExerciseEntries();
  }, [selectedDate]);

  const todaysEntries = getTodaysEntries();
  const todaysExercises = getTodaysExercises();
  const todaysStats = getTodaysStats();

  // 计算剩余卡路里
  const goal = profile?.calorie_goal || 2000;
  const food = todaysStats.kcal;
  const exerciseFromWorkouts = todaysExercises.reduce((sum, ex) => sum + ex.calories, 0);
  const exercise = exerciseFromWorkouts + (stepsData.caloriesBurned || 0);
  const remaining = goal - food + exercise;

  // 进度计算
  const consumedProgress = Math.min((food / goal) * 100, 100);
  const isOverGoal = remaining < 0;

  // 准备餐次数据
  const sectionsData = MEAL_SECTIONS.map(section => {
    if (section.key === 'exercise') {
      return {
        ...section,
        title: section.title, // Ensure title is preserved
        data: todaysExercises,
      };
    }
    return {
      ...section,
      title: section.title, // Ensure title is preserved
      data: todaysEntries.filter(entry => entry.meal_type === section.key),
    };
  });

  const navigateDate = (direction) => {
    const currentDate = new Date(selectedDate);
    
    currentDate.setDate(currentDate.getDate() + direction);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const isToday = () => {
    const today = new Date().toISOString().split('T')[0];
    return selectedDate === today;
  };

  const handleDeleteEntry = (entryId) => {
    Alert.alert(
      'Delete this entry?',
      '',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteDiaryEntry(entryId)
        },
      ]
    );
  };

  const handleDeleteExercise = (exerciseId) => {
    Alert.alert(
      'Delete this exercise?',
      '',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteExerciseEntry(exerciseId)
        },
      ]
    );
  };
  const renderSummaryCard = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Calories Remaining</Text>
      <Text style={styles.formulaText}>Remaining = Goal − Food + Exercise</Text>
      
      <View style={styles.summaryContent}>
        {/* 左侧：剩余卡路里 */}
        <View style={styles.remainingSection}>
          <Text style={[
            styles.remainingNumber,
            { color: '#4CAF50' }
          ]}>
            {formatCalories(Math.abs(remaining))}
          </Text>
          <Text style={styles.remainingLabel}>Remaining</Text>
        </View>

        {/* 右侧：Goal/Food/Exercise */}
        <View style={styles.metricsSection}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{formatCalories(goal)}</Text>
            <Text style={styles.metricLabel}>Goal</Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{formatCalories(food)}</Text>
            <Text style={styles.metricLabel}>Food</Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{formatCalories(exercise)}</Text>
            <Text style={styles.metricLabel}>Exercise</Text>
          </View>
        </View>
      </View>

      {/* 可选：环形进度 */}
      <View style={styles.progressContainer}>
        <ProgressRing
          size={60}
          strokeWidth={4}
          progress={consumedProgress}
          color={isOverGoal ? '#FF3B30' : '#4CAF50'}
          backgroundColor="#E5E5EA"
        />
      </View>
    </View>
  );

  const renderSectionHeader = ({ section }) => {
    const sectionEntries = section.data;
    let sectionTotal = 0;
    
    if (section.key === 'exercise') {
      const workoutCalories = sectionEntries.reduce((sum, entry) => sum + entry.calories, 0);
      const stepsCalories = stepsData.caloriesBurned || 0;
      sectionTotal = workoutCalories + stepsCalories;
    } else {
      sectionTotal = sectionEntries.reduce((sum, entry) => sum + entry.kcal, 0);
    }
    
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={[
          styles.sectionCalories,
          { color: sectionTotal > 0 ? '#4CAF50' : '#8E8E93' }
        ]}>
          {sectionTotal > 0 ? `${formatCalories(sectionTotal)} ${section.key === 'exercise' ? 'kcal burned' : 'kcal'}` : ''}
        </Text>
      </View>
    );
  };

  const renderFoodEntry = ({ item, section }) => {
    if (section.key === 'exercise') {
      return (
        <View style={styles.foodEntry}>
          <View style={styles.foodContent}>
            <Text style={styles.foodName}>{item.name}</Text>
            <Text style={styles.foodDetails}>
              {item.durationMin} min • {item.category}
              {item.distance && ` • ${item.distance} km`}
              {item.notes && ` • ${item.notes}`}
            </Text>
          </View>
          
          <View style={styles.foodActions}>
            <Text style={styles.exerciseCalories}>-{formatCalories(item.calories)}</Text>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDeleteExercise(item.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.foodEntry}>
        <View style={styles.foodContent}>
          <Text style={styles.foodName}>
            {item.custom_name || item.food_name}
          </Text>
          <Text style={styles.foodDetails}>
            {item.amount} {item.unit}
            {(item.carbs > 0 || item.protein > 0 || item.fat > 0) && 
              ` • C:${Math.round(item.carbs)}g P:${Math.round(item.protein)}g F:${Math.round(item.fat)}g`
            }
          </Text>
        </View>
        
        <View style={styles.foodActions}>
          <Text style={styles.foodCalories}>{formatCalories(item.kcal)}</Text>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteEntry(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSectionFooter = ({ section }) => (
    <View style={styles.sectionFooter}>
      {section.key === 'exercise' ? (
        <View>
          {/* Steps Summary */}
          {stepsData.caloriesBurned > 0 && (
            <View style={styles.stepsEntry}>
              <View style={styles.foodContent}>
                <Text style={styles.foodName}>Daily Steps</Text>
                <Text style={styles.foodDetails}>
                  {stepsData.steps.toLocaleString()} steps • Walking activity
                </Text>
              </View>
              <View style={styles.foodActions}>
                <Text style={styles.exerciseCalories}>-{formatCalories(stepsData.caloriesBurned)}</Text>
              </View>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.addFoodButton}
            onPress={() => router.push('/exercise')}
          >
            <Text style={styles.addFoodText}>ADD EXERCISE</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity 
            style={styles.addFoodButton}
            onPress={() => router.push(`/add?meal=${section.key}`)}
          >
            <Text style={styles.addFoodText}>ADD FOOD</Text>
          </TouchableOpacity>
          
          {/* My Meals Quick Access */}
          {myMeals.length > 0 && (
            <TouchableOpacity 
              style={styles.myMealsHint}
              onPress={() => router.push(`/(tabs)/add?meal=${section.key}&tab=meals`)}
            >
              <Text style={styles.myMealsText}>
                Or choose from {myMeals.length} saved meal{myMeals.length !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          )}
          
          {section.data.length === 0 && (
            <TouchableOpacity 
              style={styles.mealScanHint}
              onPress={() => router.push(`/scan?meal=${section.key}`)}
            >
              <Text style={styles.mealScanText}>Try Meal Scan (photo) to add faster</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );

  const renderListHeader = () => (
    <View>
      {/* 日期选择器 */}
      <View style={styles.dateSelector}>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => navigateDate(-1)}
        >
          <Ionicons name="chevron-back" size={24} color="#4CAF50" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dateContainer}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            {isToday() ? 'Today' : formatDate(selectedDate)}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#8E8E93" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => navigateDate(1)}
        >
          <Ionicons name="chevron-forward" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Summary 卡片 */}
      {renderSummaryCard()}
    </View>
  );

  const renderDatePickerModal = () => (
    <DatePickerModal
      visible={showDatePicker}
      onClose={() => setShowDatePicker(false)}
      selectedDate={selectedDate}
      onDateSelect={(date) => {
        setSelectedDate(date);
        setShowDatePicker(false);
      }}
    />
  );

  return (
    <View style={styles.container}>
      {renderListHeader()}
      
      <SectionList
        ref={sectionListRef}
        sections={sectionsData}
        keyExtractor={(item) => item.id}
        renderItem={({ item, section }) => renderFoodEntry({ item, section })}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        style={styles.sectionList}
      />
      
      {renderDatePickerModal()}
    </View>
  );
}

const generateDateOptions = () => {
  const dates = [];
  const today = new Date();
  
  // Generate last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    let displayText;
    if (i === 0) {
      displayText = 'Today';
    } else if (i === 1) {
      displayText = 'Yesterday';
    } else {
      displayText = date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    dates.push({
      date: dateString,
      display: displayText,
      fullDate: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    });
  }
  
  return dates;
};

const handleDateSelect = (dateString, setSelectedDate, setShowDatePicker) => {
  setSelectedDate(dateString);
  setShowDatePicker(false);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  listContent: {
    paddingBottom: 100,
  },
  sectionList: {
    flex: 1,
  },
  
  // 日期选择器
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#F2F2F7',
  },
  dateButton: {
    padding: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 40,
    gap: 6,
  },
  dateText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },

  // Summary 卡片
  summaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  formulaText: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 16,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  remainingSection: {
    alignItems: 'flex-start',
  },
  remainingNumber: {
    fontSize: 36,
    fontWeight: '600',
    lineHeight: 40,
  },
  remainingLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  metricsSection: {
    flexDirection: 'row',
    gap: 24,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '400',
    color: '#000',
  },
  metricLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  progressContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
  },

  // 餐次区块
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
  },
  sectionCalories: {
    fontSize: 15,
    fontWeight: '600',
  },

  // 食物条目
  foodEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
    minHeight: 56,
  },
  foodContent: {
    flex: 1,
  },
  foodName: {
    fontSize: 17,
    fontWeight: '400',
    color: '#000',
    marginBottom: 2,
  },
  foodDetails: {
    fontSize: 13,
    color: '#8E8E93',
  },
  foodActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  foodCalories: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    textAlign: 'right',
    minWidth: 60,
  },
  deleteButton: {
    padding: 4,
  },

  // 餐次底部
  sectionFooter: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  addFoodButton: {
    paddingVertical: 12,
  },
  addFoodText: {
    fontSize: 17,
    color: '#4CAF50',
    fontWeight: '600',
  },
  exerciseCalories: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FF9500',
    textAlign: 'right',
    minWidth: 60,
  },
  mealScanHint: {
    paddingTop: 8,
  },
  mealScanText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  myMealsHint: {
    paddingTop: 8,
  },
  myMealsText: {
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: '500',
  },
  stepsEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
    minHeight: 56,
  },
});