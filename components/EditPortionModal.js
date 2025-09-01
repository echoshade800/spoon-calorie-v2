/**
 * Edit Portion Modal - Adjust serving size and quantity for detected items
 * 
 * Purpose: Allow users to modify portion sizes for scanned food items
 * Features: Unit selection, quantity picker (DEC/FRAC), real-time nutrition updates
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMealDisplayName } from '@/utils/helpers';

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

const COMMON_FRACTIONS = [
  { value: 0.125, label: '1/8' },
  { value: 0.25, label: '1/4' },
  { value: 0.33, label: '1/3' },
  { value: 0.5, label: '1/2' },
  { value: 0.67, label: '2/3' },
  { value: 0.75, label: '3/4' },
  { value: 1, label: '1' },
  { value: 1.5, label: '3/2' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
];

export default function EditPortionModal({ 
  visible, 
  item, 
  meal, 
  onClose, 
  onSave 
}) {
  const [selectedUnit, setSelectedUnit] = useState(item?.selectedUnit || null);
  const [servings, setServings] = useState(item?.servings || 1);
  const [selectedMeal, setSelectedMeal] = useState(meal);
  const [showUnitSelector, setShowUnitSelector] = useState(false);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [showMealSelector, setShowMealSelector] = useState(false);
  const [quantityMode, setQuantityMode] = useState('DEC');

  useEffect(() => {
    if (item) {
      setSelectedUnit(item.selectedUnit);
      setServings(item.servings);
      setSelectedMeal(meal);
    }
  }, [item, meal]);

  if (!item) return null;

  const calculateNutrition = () => {
    const multiplier = servings * (selectedUnit.grams / 100);
    return {
      calories: Math.round(item.calories * multiplier),
      carbs: Math.round(item.macros.carbs * multiplier * 10) / 10,
      protein: Math.round(item.macros.protein * multiplier * 10) / 10,
      fat: Math.round(item.macros.fat * multiplier * 10) / 10,
    };
  };

  const handleSave = () => {
    const updates = {
      selectedUnit,
      servings,
      meal: selectedMeal,
    };
    onSave(updates);
  };

  const nutrition = calculateNutrition();

  const renderUnitSelector = () => (
    <Modal visible={showUnitSelector} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.selectorModal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowUnitSelector(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Unit</Text>
            <TouchableOpacity onPress={() => setShowUnitSelector(false)}>
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.selectorOptions}>
            {item.units.map((unit, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.selectorOption,
                  selectedUnit?.label === unit.label && styles.selectedSelectorOption
                ]}
                onPress={() => {
                  setSelectedUnit(unit);
                  setShowUnitSelector(false);
                }}
              >
                <Text style={[
                  styles.selectorOptionText,
                  selectedUnit?.label === unit.label && styles.selectedSelectorOptionText
                ]}>
                  {unit.label}
                </Text>
                <Text style={styles.selectorOptionGrams}>({unit.grams} g)</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderQuantitySelector = () => (
    <Modal visible={showQuantitySelector} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.selectorModal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowQuantitySelector(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Number of Servings</Text>
            <TouchableOpacity onPress={() => setShowQuantitySelector(false)}>
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
          
          {/* Mode Selector */}
          <View style={styles.quantityModeSelector}>
            <TouchableOpacity
              style={[
                styles.quantityModeButton,
                quantityMode === 'DEC' && styles.activeQuantityModeButton
              ]}
              onPress={() => setQuantityMode('DEC')}
            >
              <Text style={[
                styles.quantityModeText,
                quantityMode === 'DEC' && styles.activeQuantityModeText
              ]}>
                DEC
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.quantityModeButton,
                quantityMode === 'FRAC' && styles.activeQuantityModeButton
              ]}
              onPress={() => setQuantityMode('FRAC')}
            >
              <Text style={[
                styles.quantityModeText,
                quantityMode === 'FRAC' && styles.activeQuantityModeText
              ]}>
                FRAC
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.selectorOptions}>
            {quantityMode === 'FRAC' ? (
              COMMON_FRACTIONS.map((fraction) => (
                <TouchableOpacity
                  key={fraction.value}
                  style={[
                    styles.selectorOption,
                    servings === fraction.value && styles.selectedSelectorOption
                  ]}
                  onPress={() => {
                    setServings(fraction.value);
                    setShowQuantitySelector(false);
                  }}
                >
                  <Text style={[
                    styles.selectorOptionText,
                    servings === fraction.value && styles.selectedSelectorOptionText
                  ]}>
                    {fraction.label}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              Array.from({ length: 200 }, (_, i) => (i + 1) * 0.1).map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.selectorOption,
                    servings === value && styles.selectedSelectorOption
                  ]}
                  onPress={() => {
                    setServings(value);
                    setShowQuantitySelector(false);
                  }}
                >
                  <Text style={[
                    styles.selectorOptionText,
                    servings === value && styles.selectedSelectorOptionText
                  ]}>
                    {value.toFixed(1)}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderMealSelector = () => (
    <Modal visible={showMealSelector} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.selectorModal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowMealSelector(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Meal</Text>
            <TouchableOpacity onPress={() => setShowMealSelector(false)}>
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.mealOptions}>
            {MEAL_TYPES.map((mealType) => (
              <TouchableOpacity
                key={mealType.value}
                style={[
                  styles.selectorOption,
                  selectedMeal === mealType.value && styles.selectedSelectorOption
                ]}
                onPress={() => {
                  setSelectedMeal(mealType.value);
                  setShowMealSelector(false);
                }}
              >
                <Text style={[
                  styles.selectorOptionText,
                  selectedMeal === mealType.value && styles.selectedSelectorOptionText
                ]}>
                  {mealType.label}
                </Text>
                {selectedMeal === mealType.value && (
                  <Ionicons name="checkmark" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Edit Portion</Text>
          
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Food Info */}
          <View style={styles.section}>
            <Text style={styles.foodTitle}>{item.name}</Text>
            {item.brand && (
              <Text style={styles.foodBrand}>{item.brand}</Text>
            )}
          </View>

          {/* Serving Size */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Serving Size</Text>
            <TouchableOpacity 
              style={styles.fieldButton}
              onPress={() => setShowUnitSelector(true)}
            >
              <Text style={styles.fieldValue}>{selectedUnit?.label}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Number of Servings */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Number of Servings</Text>
            <TouchableOpacity 
              style={styles.fieldButton}
              onPress={() => setShowQuantitySelector(true)}
            >
              <Text style={styles.fieldValue}>{servings}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Meal */}
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Meal</Text>
            <TouchableOpacity 
              style={styles.fieldButton}
              onPress={() => setShowMealSelector(true)}
            >
              <Text style={styles.fieldValue}>{getMealDisplayName(selectedMeal)}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Nutrition Preview */}
          <View style={styles.nutritionSection}>
            <Text style={styles.nutritionTitle}>Nutrition Preview</Text>
            
            <View style={styles.nutritionSummary}>
              <Text style={styles.nutritionCalories}>
                {nutrition.calories} cal • C {nutrition.carbs}g • P {nutrition.protein}g • F {nutrition.fat}g
              </Text>
            </View>
          </View>
        </ScrollView>

        {renderUnitSelector()}
        {renderQuantitySelector()}
        {renderMealSelector()}
      </View>
    </Modal>
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  saveButton: {
    padding: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  foodTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  foodBrand: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  fieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
  },
  fieldValue: {
    fontSize: 16,
    color: '#000',
  },
  nutritionSection: {
    backgroundColor: '#fff',
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  nutritionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  nutritionSummary: {
    backgroundColor: '#F8FFF8',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  nutritionCalories: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4CAF50',
    textAlign: 'center',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  selectorModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
  modalDoneText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  selectorOptions: {
    maxHeight: 300,
  },
  selectorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedSelectorOption: {
    backgroundColor: '#F8FFF8',
  },
  selectorOptionText: {
    fontSize: 16,
    color: '#000',
  },
  selectedSelectorOptionText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  selectorOptionGrams: {
    fontSize: 14,
    color: '#666',
  },
  quantityModeSelector: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    padding: 4,
    marginHorizontal: 20,
    marginVertical: 16,
  },
  quantityModeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeQuantityModeButton: {
    backgroundColor: '#fff',
  },
  quantityModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeQuantityModeText: {
    color: '#000',
    fontWeight: '600',
  },
  mealOptions: {
    paddingVertical: 8,
  },
});