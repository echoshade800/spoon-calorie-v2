/**
 * Review Meal Drawer - Bottom sheet for final meal review
 * 
 * Purpose: Final review of selected items before logging to diary
 * Features: Item list, remove items, total calories, log meal, save as template
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMealDisplayName } from '@/utils/helpers';

export default function ReviewMealDrawer({ 
  visible, 
  onClose, 
  items, 
  meal, 
  onRemoveItem, 
  onLogMeal, 
  onSaveAsMeal 
}) {
  const insets = useSafeAreaInsets();

  const getTotalCalories = () => {
    return items.reduce((total, item) => {
      const multiplier = item.servings * (item.selectedUnit.grams / 100);
      return total + Math.round(item.calories * multiplier);
    }, 0);
  };

  const getTotalMacros = () => {
    return items.reduce((totals, item) => {
      const multiplier = item.servings * (item.selectedUnit.grams / 100);
      return {
        carbs: totals.carbs + (item.macros.carbs * multiplier),
        protein: totals.protein + (item.macros.protein * multiplier),
        fat: totals.fat + (item.macros.fat * multiplier),
      };
    }, { carbs: 0, protein: 0, fat: 0 });
  };

  const totalCalories = getTotalCalories();
  const totalMacros = getTotalMacros();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.drawerContainer, { paddingBottom: insets.bottom + 20 }]}>
          {/* Handle */}
          <View style={styles.handle} />
          
          {/* Header */}
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Your meal</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Nutrition Summary */}
          <View style={styles.nutritionSummary}>
            <View style={styles.caloriesContainer}>
              <Text style={styles.totalCalories}>{totalCalories}</Text>
              <Text style={styles.caloriesLabel}>calories</Text>
            </View>
            
            <View style={styles.macrosContainer}>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{Math.round(totalMacros.carbs)}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{Math.round(totalMacros.protein)}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{Math.round(totalMacros.fat)}g</Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
            </View>
          </View>

          {/* Items List */}
          <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
            {items.map((item) => {
              const multiplier = item.servings * (item.selectedUnit.grams / 100);
              const adjustedCalories = Math.round(item.calories * multiplier);
              
              return (
                <View key={item.id} style={styles.reviewItem}>
                  <View style={styles.reviewItemContent}>
                    <Text style={styles.reviewItemName}>{item.name}</Text>
                    <Text style={styles.reviewItemDetails}>
                      {adjustedCalories} cal, {item.servings} × {item.selectedUnit.label}
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => onRemoveItem(item.id)}
                  >
                    <Ionicons name="close" size={18} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.saveAsMealButton}
              onPress={onSaveAsMeal}
            >
              <Text style={styles.saveAsMealButtonText}>Save as My Meal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.logMealButton}
              onPress={onLogMeal}
            >
              <Text style={styles.logMealButtonText}>
                Log Meal
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: 8,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#C7C7CC',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  nutritionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#F8FFF8',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
  },
  caloriesContainer: {
    alignItems: 'center',
    marginRight: 32,
  },
  totalCalories: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4CAF50',
  },
  caloriesLabel: {
    fontSize: 14,
    color: '#666',
  },
  macrosContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
  },
  itemsList: {
    flex: 1,
    paddingHorizontal: 20,
    maxHeight: 300,
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reviewItemContent: {
    flex: 1,
  },
  reviewItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  reviewItemDetails: {
    fontSize: 14,
    color: '#666',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  saveAsMealButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 12,
    alignItems: 'center',
  },
  saveAsMealButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  logMealButton: {
    flex: 2,
    paddingVertical: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    alignItems: 'center',
  },
  logMealButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});