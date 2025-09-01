/**
 * Individual food item component for search results
 * Displays food name, brand, and nutritional info
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FoodSearchItem({ food, onPress }) {
  const getDisplayCalories = () => {
    if (food.kcal_per_100g) {
      return `${Math.round(food.kcal_per_100g)} kcal/100g`;
    }
    return `${food.kcal_per_100g || 0} kcal/100g`;
  };
  
  const getDisplayMacros = () => {
    if (food.carbs_per_100g !== undefined) {
      return `C:${Math.round(food.carbs_per_100g)}g • P:${Math.round(food.protein_per_100g)}g • F:${Math.round(food.fat_per_100g)}g`;
    }
    return `C:${Math.round(food.carbs)}g • P:${Math.round(food.protein)}g • F:${Math.round(food.fat)}g`;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{food.name}</Text>
          {food.brand && <Text style={styles.brand}>{food.brand}</Text>}
          }
          {food.source && (
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceText}>{food.source}</Text>
            </View>
          )}
        </View>
        <View style={styles.nutrition}>
          <Text style={styles.calories}>{getDisplayCalories()}</Text>
          <Text style={styles.macros}>
            {getDisplayMacros()}
          </Text>
          {food.serving_label && (
            <Text style={styles.serving}>Serving: {food.serving_label}</Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
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
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  brand: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  nutrition: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calories: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
    marginRight: 12,
  },
  macros: {
    fontSize: 12,
    color: '#999',
  },
  sourceBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: 8,
  },
  sourceText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '500',
  },
  serving: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
});