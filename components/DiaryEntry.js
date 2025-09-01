/**
 * Individual diary entry component
 * Shows food name, quantity, and calories with edit/delete actions
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCalories } from '@/utils/helpers';
import { useAppStore } from '@/stores/useAppStore';

export default function DiaryEntry({ entry, onPress }) {
  const deleteDiaryEntry = useAppStore((state) => state.deleteDiaryEntry);
  
  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteDiaryEntry(entry.id)
        },
      ]
    );
  };

  const displayName = entry.custom_name || entry.food_name || 'Unknown Food';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.calories}>{formatCalories(entry.kcal)} kcal</Text>
        </View>
        <Text style={styles.details}>
          {entry.amount} {entry.unit} • C:{Math.round(entry.carbs)}g P:{Math.round(entry.protein)}g F:{Math.round(entry.fat)}g
        </Text>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={18} color="#ff4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  calories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  details: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});