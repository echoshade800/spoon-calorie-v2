/**
 * Complete Onboarding Flow - 13-step questionnaire for calorie tracking setup
 * 
 * Purpose: Comprehensive user profiling and goal setting with BMR/TDEE calculations
 * Features: Multi-step form, validation, progress tracking, personalized recommendations
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/stores/useAppStore';
import { StorageUtils } from '@/utils/StorageUtils';

const TOTAL_STEPS = 13;

const GOAL_OPTIONS = [
  { id: 'lose_weight', label: 'Lose Weight', icon: 'trending-down' },
  { id: 'maintain_weight', label: 'Maintain Weight', icon: 'remove' },
  { id: 'gain_weight', label: 'Gain Weight', icon: 'trending-up' },
  { id: 'gain_muscle', label: 'Gain Muscle', icon: 'fitness' },
  { id: 'modify_diet', label: 'Modify My Diet', icon: 'restaurant' },
  { id: 'plan_meals', label: 'Plan Meals', icon: 'calendar' },
  { id: 'manage_stress', label: 'Manage Stress', icon: 'heart' },
  { id: 'stay_active', label: 'Stay Active', icon: 'walk' },
];

const BARRIER_OPTIONS = [
  { id: 'lack_time', label: 'Lack of time' },
  { id: 'too_hard', label: 'The regimen was too hard to follow' },
  { id: 'not_enjoy_food', label: 'Did not enjoy the food' },
  { id: 'difficult_choices', label: 'Difficult to make food choices' },
  { id: 'social_eating', label: 'Social eating and events' },
  { id: 'food_cravings', label: 'Food cravings' },
  { id: 'lack_progress', label: 'Lack of progress' },
  { id: 'taste_bad', label: 'Healthy food doesn\'t taste good' },
  { id: 'too_expensive', label: 'Healthy food is too expensive' },
  { id: 'cooking_hard', label: 'Cooking was too hard or time-consuming' },
  { id: 'no_barriers', label: 'I did not experience barriers', exclusive: true },
];

const HEALTHY_HABITS = [
  'Eat more protein', 'Plan more meals', 'Meal prep and cook', 'Eat more fiber',
  'Move more', 'Workout more', 'Track nutrients', 'Track calories',
  'Track macros', 'Eat mindfully', 'Eat a balanced diet', 'Eat whole foods',
  'Eat more vegetables', 'Eat more fruit', 'Drink more water', 'Prioritize sleep',
  'Something else', 'I\'m not sure'
];

const MEAL_PLANNING_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'rarely', label: 'Rarely' },
  { value: 'occasionally', label: 'Occasionally' },
  { value: 'frequently', label: 'Frequently' },
  { value: 'always', label: 'Always' },
];

const ACTIVITY_LEVELS = [
  {
    value: 'sedentary',
    label: 'Not Very Active',
    description: 'Spend most of day sitting (e.g., desk job)',
    factor: 1.40
  },
  {
    value: 'lightly_active',
    label: 'Lightly Active',
    description: 'Spend a good part of day on your feet (e.g., teacher, salesperson)',
    factor: 1.60
  },
  {
    value: 'active',
    label: 'Active',
    description: 'Spend a good part of day doing physical activity (e.g., waiter, nurse)',
    factor: 1.80
  },
  {
    value: 'very_active',
    label: 'Very Active',
    description: 'Spend most of day doing heavy physical activity (e.g., construction worker)',
    factor: 2.00
  },
];

const WEEKLY_GOALS = [
  { value: 0.25, label: 'Lose 0.5 lb per week', sublabel: '(Recommended)', kcalDelta: -250 },
  { value: 0.5, label: 'Lose 1.0 lb per week', sublabel: '', kcalDelta: -500 },
  { value: 0.75, label: 'Lose 1.5 lb per week', sublabel: '', kcalDelta: -750 },
  { value: 1.0, label: 'Lose 2.0 lb per week', sublabel: '', kcalDelta: -1000 },
];

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 
  'France', 'Spain', 'Italy', 'Netherlands', 'Sweden', 'Other'
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setProfile = useAppStore((state) => state.setProfile);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1
    goals: [],
    // Step 3
    barriers: [],
    // Step 5
    healthyHabits: [],
    // Step 7
    mealPlanning: '',
    // Step 9
    mealPlanOptIn: '',
    // Step 10
    activityLevel: '',
    // Step 11
    sex: '',
    age: '',
    country: '',
    // Step 12
    weeklyGoal: 0.25,
    // Additional fields for calculation
    height_cm: '',
    weight_kg: '',
  });

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key, item, exclusive = false) => {
    setFormData(prev => {
      const currentArray = prev[key] || [];
      
      if (exclusive) {
        // If this is an exclusive option, clear all others
        return { ...prev, [key]: [item] };
      }
      
      // Check if this item is exclusive
      const isExclusive = BARRIER_OPTIONS.find(opt => opt.id === item)?.exclusive;
      if (isExclusive) {
        return { ...prev, [key]: [item] };
      }
      
      // Remove exclusive items if adding non-exclusive
      const filteredArray = currentArray.filter(existingItem => {
        const existingOption = BARRIER_OPTIONS.find(opt => opt.id === existingItem);
        return !existingOption?.exclusive;
      });
      
      if (filteredArray.includes(item)) {
        return { ...prev, [key]: filteredArray.filter(i => i !== item) };
      } else {
        return { ...prev, [key]: [...filteredArray, item] };
      }
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.goals.length >= 1 && formData.goals.length <= 3;
      case 3:
        return formData.barriers.length >= 1;
      case 5:
        return formData.healthyHabits.length >= 1;
      case 7:
        return formData.mealPlanning !== '';
      case 9:
        return formData.mealPlanOptIn !== '';
      case 10:
        return formData.activityLevel !== '';
      case 11:
        return formData.sex !== '' && formData.age !== '' && formData.country !== '';
      case 12:
        return formData.weeklyGoal !== null && formData.height_cm !== '' && formData.weight_kg !== '';
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep === 11) {
      // Validate age
      const age = parseInt(formData.age);
      if (isNaN(age) || age < 13 || age > 120) {
        Alert.alert('Invalid Age', 'Please enter an age between 13 and 120');
        return;
      }
    }
    
    if (currentStep === 12) {
      // Validate height and weight
      const height = parseFloat(formData.height_cm);
      const weight = parseFloat(formData.weight_kg);
      
      if (isNaN(height) || height < 100 || height > 250) {
        Alert.alert('Invalid Height', 'Please enter a height between 100 and 250 cm');
        return;
      }
      
      if (isNaN(weight) || weight < 30 || weight > 300) {
        Alert.alert('Invalid Weight', 'Please enter a weight between 30 and 300 kg');
        return;
      }
    }
    
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateBMR = (sex, weight, height, age) => {
    // Mifflin-St Jeor formula
    if (sex === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  };

  const calculateTDEE = (bmr, activityLevel) => {
    const activityData = ACTIVITY_LEVELS.find(level => level.value === activityLevel);
    return bmr * (activityData?.factor || 1.40);
  };

  const calculateDailyGoal = (tdee, weeklyGoal) => {
    const goalData = WEEKLY_GOALS.find(goal => goal.value === weeklyGoal);
    const dailyGoal = tdee + (goalData?.kcalDelta || 0);
    return Math.round(dailyGoal / 10) * 10; // Round to nearest 10
  };

  const getTargetDate = () => {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 3); // 3 months from now
    return targetDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleComplete = () => {
    try {
      const weight = parseFloat(formData.weight_kg);
      const height = parseFloat(formData.height_cm);
      const age = parseInt(formData.age);
      
      // Calculate BMR, TDEE, and daily goal
      const bmr = calculateBMR(formData.sex, weight, height, age);
      const tdee = calculateTDEE(bmr, formData.activityLevel);
      const dailyGoal = calculateDailyGoal(tdee, formData.weeklyGoal);

      // Create complete profile
      const completeProfile = {
        uid: StorageUtils.generateUID(),
        sex: formData.sex,
        age: age,
        height_cm: height,
        weight_kg: weight,
        activity_level: formData.activityLevel,
        goal_type: formData.goals.includes('lose_weight') ? 'lose' : 
                  formData.goals.includes('gain_weight') ? 'gain' : 'maintain',
        rate_kcal_per_day: Math.abs(WEEKLY_GOALS.find(g => g.value === formData.weeklyGoal)?.kcalDelta || 250),
        calorie_goal: dailyGoal,
        macro_c: 45, // Default macro percentages
        macro_p: 25,
        macro_f: 30,
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        // Additional onboarding data
        goals: formData.goals,
        barriers: formData.barriers,
        healthyHabits: formData.healthyHabits,
        mealPlanning: formData.mealPlanning,
        mealPlanOptIn: formData.mealPlanOptIn,
        country: formData.country,
        weeklyGoal: formData.weeklyGoal,
      };

      // Save profile and mark onboarding complete
      setProfile(completeProfile);
      
      // Async sync to server (don't block user)
      setTimeout(async () => {
        try {
          const { syncUserData } = useAppStore.getState();
          await syncUserData();
          console.log('User data synced to server');
        } catch (error) {
          console.error('Background sync failed:', error);
        }
      }, 1000);
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderGoalsStep();
      case 2: return renderMotivationStep();
      case 3: return renderBarriersStep();
      case 4: return renderEmpathyStep();
      case 5: return renderHealthyHabitsStep();
      case 6: return renderHabitsMotivationStep();
      case 7: return renderMealPlanningStep();
      case 8: return renderPlannerFeedbackStep();
      case 9: return renderMealPlanOptInStep();
      case 10: return renderActivityLevelStep();
      case 11: return renderPersonalInfoStep();
      case 12: return renderWeeklyGoalStep();
      case 13: return renderPlanReadyStep();
      default: return null;
    }
  };

  const renderGoalsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.question}>Select up to three that are most important to you.</Text>
      
      <View style={styles.optionsGrid}>
        {GOAL_OPTIONS.map((goal) => {
          const isSelected = formData.goals.includes(goal.id);
          const isDisabled = !isSelected && formData.goals.length >= 3;
          
          return (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.goalOption,
                isSelected && styles.selectedOption,
                isDisabled && styles.disabledOption,
              ]}
              onPress={() => {
                if (!isDisabled) {
                  toggleArrayItem('goals', goal.id);
                }
              }}
              disabled={isDisabled}
            >
              <Ionicons 
                name={goal.icon} 
                size={24} 
                color={isSelected ? '#4CAF50' : isDisabled ? '#ccc' : '#666'} 
              />
              <Text style={[
                styles.goalOptionText,
                isSelected && styles.selectedOptionText,
                isDisabled && styles.disabledOptionText,
              ]}>
                {goal.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      
      <Text style={styles.selectionHint}>
        {formData.goals.length}/3 selected
      </Text>
    </View>
  );

  const renderMotivationStep = () => (
    <View style={[styles.stepContent, styles.motivationStep]}>
      <Text style={styles.motivationTitle}>OK, real talk:</Text>
      <Text style={styles.motivationBody}>
        Losing weight isn't always easy. But we'll motivate you through the ups and downs—so you can hit that goal!
      </Text>
    </View>
  );

  const renderBarriersStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.question}>In the past, what were barriers to achieving weight loss?</Text>
      <Text style={styles.instruction}>Select all that apply.</Text>
      
      <View style={styles.barriersList}>
        {BARRIER_OPTIONS.map((barrier) => {
          const isSelected = formData.barriers.includes(barrier.id);
          
          return (
            <TouchableOpacity
              key={barrier.id}
              style={[
                styles.barrierOption,
                isSelected && styles.selectedBarrierOption,
              ]}
              onPress={() => toggleArrayItem('barriers', barrier.id, barrier.exclusive)}
            >
              <View style={[
                styles.checkbox,
                isSelected && styles.selectedCheckbox,
              ]}>
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={[
                styles.barrierText,
                isSelected && styles.selectedBarrierText,
              ]}>
                {barrier.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderEmpathyStep = () => {
    const hasTimeBarrier = formData.barriers.includes('lack_time');
    const hasHardBarrier = formData.barriers.includes('too_hard');
    
    let empathyText = "We understand that everyone's journey is unique.";
    
    if (hasTimeBarrier) {
      empathyText = "We get it. A busy lifestyle can easily get in the way of reaching your goals.";
    } else if (hasHardBarrier) {
      empathyText = "We understand. Finding the right approach that works for you is key to success.";
    }
    
    return (
      <View style={[styles.stepContent, styles.motivationStep]}>
        <Text style={styles.empathyBody}>{empathyText}</Text>
      </View>
    );
  };

  const renderHealthyHabitsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.question}>Which healthy habits are most important to you?</Text>
      <Text style={styles.instruction}>Select all that apply.</Text>
      
      <View style={styles.habitsGrid}>
        {HEALTHY_HABITS.map((habit) => {
          const isSelected = formData.healthyHabits.includes(habit);
          
          return (
            <TouchableOpacity
              key={habit}
              style={[
                styles.habitChip,
                isSelected && styles.selectedHabitChip,
              ]}
              onPress={() => toggleArrayItem('healthyHabits', habit)}
            >
              <Text style={[
                styles.habitChipText,
                isSelected && styles.selectedHabitChipText,
              ]}>
                {habit}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderHabitsMotivationStep = () => (
    <View style={[styles.stepContent, styles.motivationStep]}>
      <Text style={styles.motivationTitle}>Small habits = mighty change.</Text>
      <Text style={styles.motivationBody}>
        We'll help you bank small wins (and mighty celebrations) on the way to your goals.
      </Text>
    </View>
  );

  const renderMealPlanningStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.question}>How often do you plan your meals in advance?</Text>
      
      {MEAL_PLANNING_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.singleOption,
            formData.mealPlanning === option.value && styles.selectedOption,
          ]}
          onPress={() => updateFormData('mealPlanning', option.value)}
        >
          <Text style={[
            styles.singleOptionText,
            formData.mealPlanning === option.value && styles.selectedOptionText,
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPlannerFeedbackStep = () => {
    let feedbackText = "Thanks for sharing!";
    
    switch (formData.mealPlanning) {
      case 'never':
        feedbackText = "No worries! We'll help you get started with meal planning.";
        break;
      case 'rarely':
        feedbackText = "That's okay! Small steps toward planning can make a big difference.";
        break;
      case 'occasionally':
        feedbackText = "You're on the right track! We can help you plan more consistently.";
        break;
      case 'frequently':
        feedbackText = "You're a steady planner.";
        break;
      case 'always':
        feedbackText = "Wow! You're a meal planning pro.";
        break;
    }
    
    return (
      <View style={[styles.stepContent, styles.motivationStep]}>
        <Text style={styles.feedbackText}>{feedbackText}</Text>
      </View>
    );
  };

  const renderMealPlanOptInStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.question}>Do you want us to help you build weekly meal plans?</Text>
      
      {[
        { value: 'yes', label: 'Yes, definitely' },
        { value: 'open', label: 'Open to trying' },
        { value: 'no', label: 'No thanks' },
      ].map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.singleOption,
            formData.mealPlanOptIn === option.value && styles.selectedOption,
          ]}
          onPress={() => updateFormData('mealPlanOptIn', option.value)}
        >
          <Text style={[
            styles.singleOptionText,
            formData.mealPlanOptIn === option.value && styles.selectedOptionText,
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderActivityLevelStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.question}>What is your baseline activity level?</Text>
      <Text style={styles.instruction}>(not including workouts)</Text>
      
      {ACTIVITY_LEVELS.map((activity) => (
        <TouchableOpacity
          key={activity.value}
          style={[
            styles.activityOption,
            formData.activityLevel === activity.value && styles.selectedOption,
          ]}
          onPress={() => updateFormData('activityLevel', activity.value)}
        >
          <View style={styles.activityContent}>
            <Text style={[
              styles.activityLabel,
              formData.activityLevel === activity.value && styles.selectedOptionText,
            ]}>
              {activity.label}
            </Text>
            <Text style={styles.activityDescription}>
              {activity.description}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPersonalInfoStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.question}>Tell us a little bit about yourself</Text>
      
      {/* Sex Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Sex at birth</Text>
        <View style={styles.sexButtons}>
          {[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
          ].map((sex) => (
            <TouchableOpacity
              key={sex.value}
              style={[
                styles.sexButton,
                formData.sex === sex.value && styles.selectedSexButton,
              ]}
              onPress={() => updateFormData('sex', sex.value)}
            >
              <Text style={[
                styles.sexButtonText,
                formData.sex === sex.value && styles.selectedSexButtonText,
              ]}>
                {sex.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Age */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Age</Text>
        <TextInput
          style={styles.input}
          value={formData.age}
          onChangeText={(text) => updateFormData('age', text)}
          placeholder="Enter your age"
          keyboardType="numeric"
          maxLength={3}
        />
      </View>

      {/* Country */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Where do you live?</Text>
        <ScrollView style={styles.countryList} showsVerticalScrollIndicator={false}>
          {COUNTRIES.map((country) => (
            <TouchableOpacity
              key={country}
              style={[
                styles.countryOption,
                formData.country === country && styles.selectedCountryOption,
              ]}
              onPress={() => updateFormData('country', country)}
            >
              <Text style={[
                styles.countryText,
                formData.country === country && styles.selectedCountryText,
              ]}>
                {country}
              </Text>
              {formData.country === country && (
                <Ionicons name="checkmark" size={20} color="#4CAF50" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderWeeklyGoalStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.question}>What is your weekly goal?</Text>
      
      {/* Height and Weight inputs first */}
      <View style={styles.physicalInputs}>
        <View style={styles.physicalInputGroup}>
          <Text style={styles.inputLabel}>Height (cm)</Text>
          <TextInput
            style={styles.input}
            value={formData.height_cm}
            onChangeText={(text) => updateFormData('height_cm', text)}
            placeholder="170"
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.physicalInputGroup}>
          <Text style={styles.inputLabel}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            value={formData.weight_kg}
            onChangeText={(text) => updateFormData('weight_kg', text)}
            placeholder="70"
            keyboardType="numeric"
          />
        </View>
      </View>
      
      {/* Weekly goal options */}
      <Text style={styles.goalSectionTitle}>Weekly Goal</Text>
      {WEEKLY_GOALS.map((goal) => (
        <TouchableOpacity
          key={goal.value}
          style={[
            styles.weeklyGoalOption,
            formData.weeklyGoal === goal.value && styles.selectedOption,
          ]}
          onPress={() => updateFormData('weeklyGoal', goal.value)}
        >
          <View style={styles.weeklyGoalContent}>
            <Text style={[
              styles.weeklyGoalLabel,
              formData.weeklyGoal === goal.value && styles.selectedOptionText,
            ]}>
              {goal.label}
            </Text>
            {goal.sublabel && (
              <Text style={styles.weeklyGoalSublabel}>{goal.sublabel}</Text>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPlanReadyStep = () => {
    const weight = parseFloat(formData.weight_kg) || 70;
    const height = parseFloat(formData.height_cm) || 170;
    const age = parseInt(formData.age) || 25;
    
    const bmr = calculateBMR(formData.sex, weight, height, age);
    const tdee = calculateTDEE(bmr, formData.activityLevel);
    const dailyGoal = calculateDailyGoal(tdee, formData.weeklyGoal);
    
    // Calculate macro targets
    const dailyTargets = {
      calories: dailyGoal,
      carbs: Math.round((dailyGoal * 45 / 100) / 4),
      protein: Math.round((dailyGoal * 25 / 100) / 4),
      fat: Math.round((dailyGoal * 30 / 100) / 9),
    };

    const targetWeight = formData.weeklyGoal * 12; // 3 months
    const targetDate = getTargetDate();

    return (
      <View style={styles.stepContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={48} color="#4CAF50" />
          </View>
          
          <Text style={styles.heroTitle}>Your personalized plan is ready!</Text>
          
          <Text style={styles.targetText}>
            Target: Lose {targetWeight.toFixed(1)} kg by {targetDate}
          </Text>
        </View>

        {/* Daily Targets Card */}
        <View style={styles.targetsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Daily targets</Text>
            <Text style={styles.cardCaption}>You can edit these anytime</Text>
          </View>
          
          <View style={styles.targetsGrid}>
            <View style={styles.targetTile}>
              <View style={styles.tileHeader}>
                <Text style={styles.tileLabel}>Calories</Text>
                <TouchableOpacity>
                  <Ionicons name="create-outline" size={16} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              <Text style={styles.tileValue}>{dailyTargets.calories}</Text>
              <Text style={styles.tileUnit}>kcal</Text>
            </View>
            
            <View style={styles.targetTile}>
              <View style={styles.tileHeader}>
                <Text style={styles.tileLabel}>Carbs</Text>
                <TouchableOpacity>
                  <Ionicons name="create-outline" size={16} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              <Text style={styles.tileValue}>{dailyTargets.carbs}</Text>
              <Text style={styles.tileUnit}>g</Text>
            </View>
            
            <View style={styles.targetTile}>
              <View style={styles.tileHeader}>
                <Text style={styles.tileLabel}>Protein</Text>
                <TouchableOpacity>
                  <Ionicons name="create-outline" size={16} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              <Text style={styles.tileValue}>{dailyTargets.protein}</Text>
              <Text style={styles.tileUnit}>g</Text>
            </View>
            
            <View style={styles.targetTile}>
              <View style={styles.tileHeader}>
                <Text style={styles.tileLabel}>Fat</Text>
                <TouchableOpacity>
                  <Ionicons name="create-outline" size={16} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              <Text style={styles.tileValue}>{dailyTargets.fat}</Text>
              <Text style={styles.tileUnit}>g</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const getStepTitle = () => {
    const titles = {
      1: 'Goals',
      2: 'Motivation',
      3: 'Barriers',
      4: 'Understanding',
      5: 'Healthy Habits',
      6: 'Motivation',
      7: 'Meal Planning',
      8: 'Feedback',
      9: 'Meal Plans',
      10: 'Activity Level',
      11: 'Personal Info',
      12: 'Weekly Goal',
      13: 'Plan Ready',
    };
    return titles[currentStep] || 'Setup';
  };

  const isMotivationStep = () => {
    return [2, 4, 6, 8].includes(currentStep);
  };

  return (
    <KeyboardAvoidingView 
      style={[
        styles.container,
        isMotivationStep() && styles.motivationContainer
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[
        styles.header,
        isMotivationStep() && styles.motivationHeader
      ]}>
        <Text style={[
          styles.title,
          isMotivationStep() && styles.motivationHeaderText
        ]}>
          {getStepTitle()}
        </Text>
        <Text style={[
          styles.subtitle,
          isMotivationStep() && styles.motivationHeaderText
        ]}>
          Step {currentStep} of {TOTAL_STEPS}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressBar,
            { width: `${(currentStep / TOTAL_STEPS) * 100}%` }
          ]} 
        />
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      {/* Navigation */}
      <View style={[
        styles.navigation, 
        { paddingBottom: insets.bottom + 8 },
        isMotivationStep() && styles.motivationNavigation
      ]}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons 
              name="chevron-back" 
              size={24} 
              color={isMotivationStep() ? "#fff" : "#666"} 
            />
            <Text style={[
              styles.backText,
              isMotivationStep() && styles.motivationNavText
            ]}>
              Back
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[
            styles.nextButton,
            !canProceed() && styles.nextButtonDisabled,
            isMotivationStep() && styles.motivationNextButton
          ]} 
          onPress={handleNext}
          disabled={!canProceed()}
        >
          <Text style={[
            styles.nextText,
            !canProceed() && styles.nextTextDisabled
          ]}>
            {currentStep === TOTAL_STEPS ? "Let's get started!" : 'Next'}
          </Text>
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={!canProceed() ? "#ccc" : "#fff"} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  motivationContainer: {
    backgroundColor: '#007AFF',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  motivationHeader: {
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  motivationHeaderText: {
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 20,
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  motivationStep: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  question: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 30,
  },
  instruction: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  
  // Goals Step
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  goalOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 60,
  },
  goalOptionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  selectedOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8fff8',
  },
  selectedOptionText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  disabledOption: {
    opacity: 0.5,
  },
  disabledOptionText: {
    color: '#ccc',
  },
  selectionHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  
  // Motivation Steps
  motivationTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 38,
  },
  motivationBody: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 26,
    opacity: 0.9,
  },
  empathyBody: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 28,
    opacity: 0.9,
  },
  feedbackText: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 32,
    fontWeight: '600',
  },
  
  // Barriers Step
  barriersList: {
    gap: 12,
  },
  barrierOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedBarrierOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8fff8',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedCheckbox: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  barrierText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectedBarrierText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  
  // Healthy Habits Step
  habitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  habitChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  selectedHabitChip: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  habitChipText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedHabitChipText: {
    color: '#fff',
  },
  
  // Single Select Options
  singleOption: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  singleOptionText: {
    fontSize: 18,
    color: '#333',
  },
  
  // Activity Level
  activityOption: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activityContent: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
  },
  
  // Personal Info
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  sexButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  sexButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  selectedSexButton: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8fff8',
  },
  sexButtonText: {
    fontSize: 16,
    color: '#333',
  },
  selectedSexButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  countryList: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedCountryOption: {
    backgroundColor: '#f8fff8',
  },
  countryText: {
    fontSize: 16,
    color: '#333',
  },
  selectedCountryText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  
  // Weekly Goal Step
  physicalInputs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  physicalInputGroup: {
    flex: 1,
  },
  goalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  weeklyGoalOption: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  weeklyGoalContent: {
    flex: 1,
  },
  weeklyGoalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  weeklyGoalSublabel: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 2,
  },
  
  // Plan Ready Step
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  targetText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  targetsCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 24,
    marginTop: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  cardCaption: {
    fontSize: 14,
    color: '#8E8E93',
  },
  targetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  targetTile: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  tileLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  tileValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  tileUnit: {
    fontSize: 12,
    color: '#8E8E93',
  },
  
  // Navigation
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  motivationNavigation: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  backText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  motivationNavText: {
    color: '#fff',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#ccc',
  },
  motivationNextButton: {
    backgroundColor: '#fff',
  },
  nextText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  nextTextDisabled: {
    color: '#999',
  },
});