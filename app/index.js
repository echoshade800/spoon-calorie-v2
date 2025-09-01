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
  const { isOnboarded, setSelectedDate, initializeApp, isDatabaseReady } = useAppStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize database first
    initializeApp();
    
    // Set today's date
    setSelectedDate(new Date().toISOString().split('T')[0]);
    
    // Mark as ready after a short delay to ensure component is mounted
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady || !isDatabaseReady) return;

    // Navigate based on onboarding status
    if (isOnboarded) {
      router.replace('/(tabs)');
    } else {
      router.replace('/onboarding');
    }
  }, [isOnboarded, isReady, isDatabaseReady]);

  // Loading state - in a real app might show splash screen
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
});