/**
 * Exercise Category Picker - Choose between Cardio and Strength
 * 
 * Purpose: Main entry point for exercise logging
 * Features: Category selection with visual icons and descriptions
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ExerciseIndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Add Exercise</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* Category Selection */}
      <View style={styles.content}>
        <Text style={styles.subtitle}>Choose exercise type</Text>
        
        <View style={styles.categoryButtons}>
          <TouchableOpacity 
            style={styles.categoryButton}
            onPress={() => router.push('/exercise/cardio')}
          >
            <View style={styles.categoryIcon}>
              <Ionicons name="heart" size={32} color="#FF3B30" />
            </View>
            <Text style={styles.categoryTitle}>Cardio</Text>
            <Text style={styles.categoryDescription}>
              Running, cycling, swimming, and other aerobic activities
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.categoryButton}
            onPress={() => router.push('/exercise/strength')}
          >
            <View style={styles.categoryIcon}>
              <Ionicons name="barbell" size={32} color="#007AFF" />
            </View>
            <Text style={styles.categoryTitle}>Strength</Text>
            <Text style={styles.categoryDescription}>
              Weight lifting, bodyweight exercises, and resistance training
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
  },
  categoryButtons: {
    gap: 20,
  },
  categoryButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  categoryDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});