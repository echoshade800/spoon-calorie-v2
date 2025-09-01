/**
 * Strength Exercise Selection Screen
 * 
 * Purpose: Browse and select strength training exercises
 * Features: Popular exercises, search, custom exercise creation
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const POPULAR_STRENGTH = [
  { id: 'barbell_squat', name: 'Barbell Squat', met: 6.0, category: 'strength' },
  { id: 'bench_press', name: 'Bench Press', met: 6.0, category: 'strength' },
  { id: 'deadlift', name: 'Deadlift', met: 6.0, category: 'strength' },
  { id: 'overhead_press', name: 'Overhead Press', met: 6.0, category: 'strength' },
  { id: 'barbell_row', name: 'Barbell Row', met: 6.0, category: 'strength' },
  { id: 'pull_ups', name: 'Pull-ups / Chin-ups', met: 8.0, category: 'strength' },
  { id: 'push_ups', name: 'Push-ups', met: 8.0, category: 'strength' },
  { id: 'dumbbell_curl', name: 'Dumbbell Curl', met: 3.5, category: 'strength' },
  { id: 'leg_press', name: 'Leg Press', met: 5.0, category: 'strength' },
];

const ALL_STRENGTH = [
  ...POPULAR_STRENGTH,
  { id: 'lat_pulldown', name: 'Lat Pulldown', met: 5.0, category: 'strength' },
  { id: 'shoulder_press', name: 'Shoulder Press', met: 6.0, category: 'strength' },
  { id: 'tricep_dips', name: 'Tricep Dips', met: 4.0, category: 'strength' },
  { id: 'lunges', name: 'Lunges', met: 4.0, category: 'strength' },
  { id: 'leg_extension', name: 'Leg Extension', met: 5.0, category: 'strength' },
  { id: 'leg_curl', name: 'Leg Curl', met: 5.0, category: 'strength' },
  { id: 'calf_raises', name: 'Calf Raises', met: 4.0, category: 'strength' },
  { id: 'planks', name: 'Planks', met: 4.0, category: 'strength' },
  { id: 'burpees', name: 'Burpees', met: 8.0, category: 'strength' },
  { id: 'mountain_climbers', name: 'Mountain Climbers', met: 8.0, category: 'strength' },
].sort((a, b) => a.name.localeCompare(b.name));

const FILTER_TABS = [
  { id: 'popular', label: 'Popular' },
  { id: 'all', label: 'All' },
  { id: 'my', label: 'My Exercises' },
];

export default function StrengthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('popular');
  const [myExercises] = useState([]); // TODO: Get from store

  const getFilteredExercises = () => {
    let exercises = [];
    
    switch (activeFilter) {
      case 'popular':
        exercises = POPULAR_STRENGTH;
        break;
      case 'all':
        exercises = ALL_STRENGTH;
        break;
      case 'my':
        exercises = myExercises;
        break;
      default:
        exercises = POPULAR_STRENGTH;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      exercises = exercises.filter(exercise =>
        exercise.name.toLowerCase().includes(query)
      );
    }

    return exercises;
  };

  const handleExerciseSelect = (exercise) => {
    router.push({
      pathname: '/exercise/details',
      params: {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        exerciseMet: exercise.met.toString(),
        exerciseCategory: exercise.category,
      }
    });
  };

  const filteredExercises = getFilteredExercises();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Strength</Text>
        
        <TouchableOpacity onPress={() => router.push('/exercise/custom?category=strength')}>
          <Ionicons name="add" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#4CAF50" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for an exercise"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.filterTab,
              activeFilter === tab.id && styles.activeFilterTab,
            ]}
            onPress={() => setActiveFilter(tab.id)}
          >
            <Text style={[
              styles.filterTabText,
              activeFilter === tab.id && styles.activeFilterTabText,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Exercise List */}
      <ScrollView style={styles.exerciseList} showsVerticalScrollIndicator={false}>
        {filteredExercises.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>
              {activeFilter === 'my' ? 'No custom exercises yet' : 'No exercises found'}
            </Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => router.push('/exercise/custom?category=strength')}
            >
              <Text style={styles.createButtonText}>Create a New Exercise</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredExercises.map((exercise) => (
            <TouchableOpacity
              key={exercise.id}
              style={styles.exerciseItem}
              onPress={() => handleExerciseSelect(exercise)}
            >
              <View style={styles.exerciseContent}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseMet}>MET: {exercise.met}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 20,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: '#fff',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeFilterTabText: {
    color: '#000',
    fontWeight: '600',
  },
  exerciseList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  exerciseMet: {
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});