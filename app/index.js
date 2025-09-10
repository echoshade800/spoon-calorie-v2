/**
 * App Entry Point - Handles initial routing based on onboarding status
 * 
 * Purpose: Route users to onboarding or main app based on setup completion
 * Extends: Add splash screen, app updates, maintenance mode
 */
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/stores/useAppStore';

export default function IndexScreen() {
  const router = useRouter();
  const { isOnboarded, setSelectedDate, initializeApp, isDatabaseReady, profile } = useAppStore();
  const [isReady, setIsReady] = useState(false);
  const mounted = React.useRef(true);

  useEffect(() => {
    mounted.current = true;
    
    // Defer state updates to next event loop cycle to ensure component is mounted
    setTimeout(() => {
      if (mounted.current) {
        // Initialize database first
        initializeApp();
        
        // Set today's date
        setSelectedDate(new Date().toISOString().split('T')[0]);
        
        // Mark as ready after a short delay to ensure component is mounted
        const timer = setTimeout(() => {
          if (mounted.current) {
            setIsReady(true);
          }
        }, 100);
      }
    }, 0);
    
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady || !isDatabaseReady) return;

    // Add small delay to ensure state is properly set
    const timer = setTimeout(() => {
      // Navigate based on onboarding status
      console.log('检查导航条件:', { 
        isOnboarded, 
        profile: !!profile,
        profileData: profile ? {
          sex: profile.sex,
          age: profile.age,
          calorie_goal: profile.calorie_goal
        } : null
      });
      
      if (isOnboarded && profile) {
        console.log('导航到主应用');
        router.replace('/(tabs)');
      } else {
        console.log('导航到新手引导');
        router.replace('/onboarding');
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [isOnboarded, isReady, isDatabaseReady, profile, router]);

  // Loading state - in a real app might show splash screen
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
});