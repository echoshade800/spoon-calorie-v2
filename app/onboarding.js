/**
 * Onboarding Screen - Collects user info to calculate daily calorie goal
 * 
 * Purpose: Multi-step form to gather BMR/TDEE calculation inputs
 * Extends: Add validation, more activity levels, imperial units support
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
import { calculateBMR, calculateTDEE, calculateDailyGoal } from '@/data/mockData';
import { validateProfileData } from '@/utils/helpers';

const STEPS = [
  { title: 'Your Goal', key: 'goal' },
  { title: 'About You', key: 'details' },
  { title: 'Activity Level', key: 'activity' },
  { title: 'Your Plan', key: 'plan' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setProfile = useAppStore((state) => state.setProfile);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    goal_type: 'maintain',
    rate_kcal_per_day: 500,
    sex: 'male',
    age: '',
    height_cm: '',
    weight_kg: '',
    activity: 'moderately_active',
  });

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      const validation = validateProfileData(formData);
      if (!validation.isValid) {
        Alert.alert('Invalid Input', Object.values(validation.errors)[0]);
        return;
      }
    }
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    try {
      // Calculate BMR, TDEE, and daily goal
      const bmr = calculateBMR(formData);
      const tdee = calculateTDEE(bmr, formData.activity);
      const dailyGoal = calculateDailyGoal(tdee, formData.goal_type, formData.rate_kcal_per_day);

      // Create complete profile
      const completeProfile = {
        ...formData,
        age: parseInt(formData.age),
        height_cm: parseFloat(formData.height_cm),
        weight_kg: parseFloat(formData.weight_kg),
        calorie_goal: dailyGoal,
        macro_c: 45, // Default macro percentages
        macro_p: 25,
        macro_f: 30,
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
      };

      // Save profile and mark onboarding complete
      setProfile(completeProfile);
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    }
  };

  const handleEditTarget = (targetType, currentValue) => {
    Alert.prompt(
      `Edit ${targetType === 'calories' ? 'Calorie Goal' : targetType.charAt(0).toUpperCase() + targetType.slice(1) + ' Target'}`,
      `Enter new ${targetType === 'calories' ? 'daily calorie goal' : targetType + ' target (grams)'}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save', 
          onPress: (value) => {
            const numValue = parseFloat(value);
            if (isNaN(numValue) || numValue <= 0) {
              Alert.alert('Invalid Input', 'Please enter a valid positive number');
              return;
            }
            
            if (targetType === 'calories') {
              if (numValue < 800 || numValue > 5000) {
                Alert.alert('Invalid Range', 'Calorie goal must be between 800 and 5000');
                return;
              }
              // Update calorie goal in form data
              setFormData(prev => ({ ...prev, calorie_goal_override: numValue }));
            } else {
              // For macros, we could implement macro target editing
              Alert.alert('Success', `${targetType.charAt(0).toUpperCase() + targetType.slice(1)} target updated to ${numValue}g`);
            }
          }
        },
      ],
      'plain-text',
      currentValue.toString()
    );
  };
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderGoalStep();
      case 1:
        return renderDetailsStep();
      case 2:
        return renderActivityStep();
      case 3:
        return renderPlanStep();
      default:
        return null;
    }
  };

  const renderGoalStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.question}>What's your goal?</Text>
      
      {[
        { value: 'lose', label: 'Lose Weight', icon: 'trending-down' },
        { value: 'maintain', label: 'Maintain Weight', icon: 'remove' },
        { value: 'gain', label: 'Gain Weight', icon: 'trending-up' },
      ].map((goal) => (
        <TouchableOpacity
          key={goal.value}
          style={[
            styles.option,
            formData.goal_type === goal.value && styles.selectedOption,
          ]}
          onPress={() => updateFormData('goal_type', goal.value)}
        >
          <Ionicons 
            name={goal.icon} 
            size={24} 
            color={formData.goal_type === goal.value ? '#4CAF50' : '#666'} 
          />
          <Text style={[
            styles.optionText,
            formData.goal_type === goal.value && styles.selectedOptionText,
          ]}>
            {goal.label}
          </Text>
        </TouchableOpacity>
      ))}

      {formData.goal_type !== 'maintain' && (
        <View style={styles.rateSection}>
          <Text style={styles.rateLabel}>
            Weekly Rate ({formData.goal_type === 'lose' ? 'Loss' : 'Gain'})
          </Text>
          {[
            { value: 250, label: '0.25 kg/week (250 kcal/day)' },
            { value: 500, label: '0.5 kg/week (500 kcal/day)' },
            { value: 750, label: '0.75 kg/week (750 kcal/day)' },
          ].map((rate) => (
            <TouchableOpacity
              key={rate.value}
              style={[
                styles.rateOption,
                formData.rate_kcal_per_day === rate.value && styles.selectedOption,
              ]}
              onPress={() => updateFormData('rate_kcal_per_day', rate.value)}
            >
              <Text style={[
                styles.rateText,
                formData.rate_kcal_per_day === rate.value && styles.selectedOptionText,
              ]}>
                {rate.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderDetailsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.question}>Tell us about yourself</Text>
      
      <View style={styles.sexSelection}>
        <Text style={styles.inputLabel}>Sex (for BMR calculation)</Text>
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

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Age (years)</Text>
        <TextInput
          style={styles.input}
          value={formData.age}
          onChangeText={(text) => updateFormData('age', text)}
          placeholder="Enter your age"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Height (cm)</Text>
        <TextInput
          style={styles.input}
          value={formData.height_cm}
          onChangeText={(text) => updateFormData('height_cm', text)}
          placeholder="Enter your height in cm"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          value={formData.weight_kg}
          onChangeText={(text) => updateFormData('weight_kg', text)}
          placeholder="Enter your weight in kg"
          keyboardType="numeric"
        />
      </View>
    </View>
  );

  const renderActivityStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.question}>What's your activity level?</Text>
      <Text style={styles.subtitle}>This helps calculate your daily calorie needs</Text>
      
      {[
        {
          value: 'sedentary',
          label: 'Sedentary',
          description: 'Little or no exercise',
        },
        {
          value: 'lightly_active',
          label: 'Lightly Active',
          description: 'Light exercise 1-3 days/week',
        },
        {
          value: 'moderately_active',
          label: 'Moderately Active',
          description: 'Moderate exercise 3-5 days/week',
        },
        {
          value: 'very_active',
          label: 'Very Active',
          description: 'Hard exercise 6-7 days/week',
        },
        {
          value: 'extra_active',
          label: 'Extra Active',
          description: 'Very hard exercise, physical job',
        },
      ].map((activity) => (
        <TouchableOpacity
          key={activity.value}
          style={[
            styles.activityOption,
            formData.activity === activity.value && styles.selectedOption,
          ]}
          onPress={() => updateFormData('activity', activity.value)}
        >
          <View>
            <Text style={[
              styles.activityLabel,
              formData.activity === activity.value && styles.selectedOptionText,
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

  const renderPlanStep = () => {
    const bmr = calculateBMR(formData);
    const tdee = calculateTDEE(bmr, formData.activity);
    const dailyGoal = calculateDailyGoal(tdee, formData.goal_type, formData.rate_kcal_per_day);

    // Calculate target date and weight
    const targetDate = new Date();
    let targetWeight = { value: 0, unit: 'kg' };
    
    if (formData.goal_type !== 'maintain') {
      targetDate.setMonth(targetDate.getMonth() + 3);
      targetWeight = {
        value: formData.goal_type === 'lose' ? 5 : 3,
        unit: 'kg'
      };
    }

    // Calculate macro targets
    const macroPercentages = { carbs: 45, protein: 25, fat: 30 };
    const dailyTargets = {
      calories: dailyGoal,
      carbs: Math.round((dailyGoal * macroPercentages.carbs / 100) / 4),
      protein: Math.round((dailyGoal * macroPercentages.protein / 100) / 4),
      fat: Math.round((dailyGoal * macroPercentages.fat / 100) / 9),
    };

    const getTargetText = () => {
      if (targetWeight.value === 0) {
        return "Target: Maintain current weight";
      }
      
      const action = formData.goal_type === 'lose' ? 'Lose' : 'Gain';
      const dateStr = targetDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      return `Target: ${action} ${targetWeight.value} ${targetWeight.unit} by ${dateStr}`;
    };

    return (
      <View style={styles.stepContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={48} color="#4CAF50" />
          </View>
          
          <Text style={styles.heroTitle}>Your personalized plan is ready!</Text>
          
          <Text style={styles.targetText}>{getTargetText()}</Text>
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
                <TouchableOpacity onPress={() => handleEditTarget('calories', dailyTargets.calories)}>
                  <Ionicons name="create-outline" size={16} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              <Text style={styles.tileValue}>{dailyTargets.calories}</Text>
              <Text style={styles.tileUnit}>kcal</Text>
            </View>
            
            <View style={styles.targetTile}>
              <View style={styles.tileHeader}>
                <Text style={styles.tileLabel}>Carbohydrates</Text>
                <TouchableOpacity onPress={() => handleEditTarget('carbs', dailyTargets.carbs)}>
                  <Ionicons name="create-outline" size={16} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              <Text style={styles.tileValue}>{dailyTargets.carbs}</Text>
              <Text style={styles.tileUnit}>g</Text>
            </View>
            
            <View style={styles.targetTile}>
              <View style={styles.tileHeader}>
                <Text style={styles.tileLabel}>Protein</Text>
                <TouchableOpacity onPress={() => handleEditTarget('protein', dailyTargets.protein)}>
                  <Ionicons name="create-outline" size={16} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              <Text style={styles.tileValue}>{dailyTargets.protein}</Text>
              <Text style={styles.tileUnit}>g</Text>
            </View>
            
            <View style={styles.targetTile}>
              <View style={styles.tileHeader}>
                <Text style={styles.tileLabel}>Fat</Text>
                <TouchableOpacity onPress={() => handleEditTarget('fat', dailyTargets.fat)}>
                  <Ionicons name="create-outline" size={16} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              <Text style={styles.tileValue}>{dailyTargets.fat}</Text>
              <Text style={styles.tileUnit}>g</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.defaultsNote}>
          <Text style={styles.defaultsNoteText}>
            We've set smart defaults. You can change them anytime.
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to QuickKcal</Text>
        <Text style={styles.subtitle}>
          Step {currentStep + 1} of {STEPS.length}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressBar,
            { width: `${((currentStep + 1) / STEPS.length) * 100}%` }
          ]} 
        />
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView}>
        {renderStepContent()}
      </ScrollView>

      {/* Navigation */}
      <View style={[styles.navigation, { paddingBottom: insets.bottom + 8 }]}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#666" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextText}>
            {currentStep === STEPS.length - 1 ? "Let's get started!" : 'Next'}
          </Text>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
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
  question: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8fff8',
  },
  optionText: {
    fontSize: 18,
    color: '#333',
    marginLeft: 12,
  },
  selectedOptionText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  rateSection: {
    marginTop: 20,
  },
  rateLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  rateOption: {
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rateText: {
    fontSize: 16,
    color: '#333',
  },
  sexSelection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  activityOption: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
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
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  goalRow: {
    borderBottomWidth: 0,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#4CAF50',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  goalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
  },
  goalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
  },
  privacyNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
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
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  
  // Hero Section (Step 4)
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
  
  // Daily Targets Card (Step 4)
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
  defaultsNote: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  defaultsNoteText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    lineHeight: 20,
  },
});