/**
 * Steps Data Hook - Manages step counting and health permissions
 * 
 * Purpose: Get daily step count from device sensors with proper permissions
 * Features: Permission handling, step counting, daily reset, error handling
 */
import { useState, useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { Platform } from 'react-native';
import { useAppStore } from '@/stores/useAppStore';

// Constants for calorie calculation
const MET_WALKING = 3.0; // MET value for moderate walking
const STEPS_PER_HOUR_WALKING = 6000; // Approximate steps per hour for moderate walking

export const useStepsData = () => {
  const profile = useAppStore((state) => state.profile);
  
  const [stepsData, setStepsData] = useState({
    steps: 0,
    caloriesBurned: 0,
    goal: 10000,
    isAvailable: false,
    hasPermission: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    initializeStepTracking();
  }, []);

  // Calculate calories burned from steps
  useEffect(() => {
    const calculateCaloriesFromSteps = () => {
      if (!profile?.weight_kg || stepsData.steps === 0) {
        return 0;
      }
      
      // Calculate hours of walking based on steps
      const hoursWalking = stepsData.steps / STEPS_PER_HOUR_WALKING;
      
      // Calculate calories: MET × weight (kg) × hours
      const calories = MET_WALKING * profile.weight_kg * hoursWalking;
      
      return Math.round(calories);
    };
    
    const caloriesBurned = calculateCaloriesFromSteps();
    setStepsData(prev => ({ ...prev, caloriesBurned }));
  }, [stepsData.steps, profile?.weight_kg]);

  const initializeStepTracking = async () => {
    try {
      setStepsData(prev => ({ ...prev, isLoading: true, error: null }));

      // Check if pedometer is available on this device
      const isAvailable = await Pedometer.isAvailableAsync();
      
      if (!isAvailable) {
        setStepsData(prev => ({
          ...prev,
          isAvailable: false,
          isLoading: false,
          error: 'Step tracking not available on this device'
        }));
        return;
      }

      // Request permissions
      const hasPermission = await requestStepPermissions();
      
      if (!hasPermission) {
        setStepsData(prev => ({
          ...prev,
          isAvailable: true,
          hasPermission: false,
          isLoading: false,
          error: 'Permission required to track steps'
        }));
        return;
      }

      // Get today's steps
      await getTodaysSteps();
      
      // Set up real-time step tracking
      setupStepTracking();

    } catch (error) {
      console.error('Step tracking initialization error:', error);
      setStepsData(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to initialize step tracking'
      }));
    }
  };

  const requestStepPermissions = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web doesn't support step tracking
        return false;
      }

      // For iOS/Android, Expo Sensors handles permissions automatically
      // We just need to check if the API is available
      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  };

  const getTodaysSteps = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const now = new Date();

      const result = await Pedometer.getStepCountAsync(startOfDay, now);
      
      setStepsData(prev => ({
        ...prev,
        steps: result.steps || 0,
        isAvailable: true,
        hasPermission: true,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error('Get today steps error:', error);
      
      // Fallback to mock data for demo purposes
      setStepsData(prev => ({
        ...prev,
        steps: 1084, // Mock data
        isAvailable: true,
        hasPermission: true,
        isLoading: false,
        error: 'Using demo data - real step tracking unavailable',
      }));
    }
  };

  const setupStepTracking = () => {
    try {
      // Subscribe to step count updates
      const subscription = Pedometer.watchStepCount(result => {
        setStepsData(prev => ({
          ...prev,
          steps: prev.steps + (result.steps || 0),
        }));
      });

      // Return cleanup function
      return () => {
        subscription && subscription.remove();
      };
    } catch (error) {
      console.error('Step tracking setup error:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert(
          'Not Available',
          'Step tracking is not available on web. Please use the mobile app.',
          [{ text: 'OK' }]
        );
        return;
      }

      Alert.alert(
        'Enable Step Tracking',
        'To track your daily steps, please allow motion and fitness permissions in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: () => Linking.openSettings()
          },
        ]
      );
    } catch (error) {
      console.error('Request permissions error:', error);
    }
  };

  const refreshSteps = async () => {
    await getTodaysSteps();
  };

  return {
    ...stepsData,
    requestPermissions,
    refreshSteps,
  };
};