/**
 * Details Screen - Individual food entry details with edit/delete actions
 * 
 * Purpose: Full item info display with modification and sharing capabilities
 * Extends: Add nutrition insights, portion size guidance, meal photo, sharing
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/stores/useAppStore';
import { formatCalories, formatMacro, formatDate, getMealDisplayName } from '@/utils/helpers';

export default function DetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const { 
    diaryEntries, 
    updateDiaryEntry, 
    deleteDiaryEntry,
    foods 
  } = useAppStore();

  const [isEditing, setIsEditing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editUnit, setEditUnit] = useState('');

  const entry = diaryEntries.find(e => e.id === id);
  const food = entry?.food_id ? foods.find(f => f.id === entry.food_id) : null;

  if (!entry) {
    return (
      <View style={styles.container}>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
          <Text style={styles.errorText}>Entry not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const displayName = entry.custom_name || food?.name || 'Unknown Food';

  const handleEdit = () => {
    setEditAmount(entry.amount.toString());
    setEditUnit(entry.unit);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const newAmount = parseFloat(editAmount);
    if (isNaN(newAmount) || newAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    // Recalculate nutrition based on new amount
    const multiplier = newAmount / entry.amount;
    const updates = {
      amount: newAmount,
      unit: editUnit,
      kcal: entry.kcal * multiplier,
      carbs: entry.carbs * multiplier,
      protein: entry.protein * multiplier,
      fat: entry.fat * multiplier,
    };

    updateDiaryEntry(entry.id, updates);
    setIsEditing(false);
    Alert.alert('Success', 'Entry updated successfully');
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this food entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteDiaryEntry(entry.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleShare = () => {
    setShowShareModal(true);
    // In a real app, would implement native sharing
    setTimeout(() => {
      setShowShareModal(false);
      Alert.alert('Shared!', 'Food entry shared successfully (demo)');
    }, 1500);
  };

  const getSourceLabel = (source) => {
    switch (source) {
      case 'library': return 'Food Database';
      case 'custom': return 'Custom Food';
      case 'scan': return 'Meal Scan';
      default: return 'Unknown';
    }
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'library': return 'library-outline';
      case 'custom': return 'create-outline';
      case 'scan': return 'camera-outline';
      default: return 'help-outline';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <Text style={styles.foodName}>{displayName}</Text>
          <Text style={styles.mealInfo}>
            {getMealDisplayName(entry.meal_type)} • {formatDate(entry.date)}
          </Text>
        </View>
        
        <View style={styles.sourceInfo}>
          <Ionicons 
            name={getSourceIcon(entry.source)} 
            size={16} 
            color="#666" 
          />
          <Text style={styles.sourceText}>{getSourceLabel(entry.source)}</Text>
        </View>
      </View>

      {/* Amount & Unit */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Amount</Text>
        
        {isEditing ? (
          <View style={styles.editContainer}>
            <View style={styles.editRow}>
              <View style={styles.amountInput}>
                <TextInput
                  style={styles.textInput}
                  value={editAmount}
                  onChangeText={setEditAmount}
                  keyboardType="numeric"
                  placeholder="Amount"
                />
              </View>
              
              <View style={styles.unitInput}>
                <TextInput
                  style={styles.textInput}
                  value={editUnit}
                  onChangeText={setEditUnit}
                  placeholder="Unit"
                />
              </View>
            </View>

            <View style={styles.editActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.amountDisplay}>
            <Text style={styles.amountText}>
              {entry.amount} {entry.unit}
            </Text>
            <TouchableOpacity style={styles.editIconButton} onPress={handleEdit}>
              <Ionicons name="create-outline" size={20} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Nutrition Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nutrition Information</Text>
        
        <View style={styles.nutritionGrid}>
          <View style={styles.nutritionCard}>
            <Text style={styles.nutritionValue}>{formatCalories(entry.kcal)}</Text>
            <Text style={styles.nutritionLabel}>Calories</Text>
            <View style={[styles.nutritionBar, { backgroundColor: '#4CAF50' }]} />
          </View>
          
          <View style={styles.nutritionCard}>
            <Text style={styles.nutritionValue}>{formatMacro(entry.carbs)}g</Text>
            <Text style={styles.nutritionLabel}>Carbohydrates</Text>
            <View style={[styles.nutritionBar, { backgroundColor: '#FF9800' }]} />
          </View>
          
          <View style={styles.nutritionCard}>
            <Text style={styles.nutritionValue}>{formatMacro(entry.protein)}g</Text>
            <Text style={styles.nutritionLabel}>Protein</Text>
            <View style={[styles.nutritionBar, { backgroundColor: '#2196F3' }]} />
          </View>
          
          <View style={styles.nutritionCard}>
            <Text style={styles.nutritionValue}>{formatMacro(entry.fat)}g</Text>
            <Text style={styles.nutritionLabel}>Fat</Text>
            <View style={[styles.nutritionBar, { backgroundColor: '#9C27B0' }]} />
          </View>
        </View>
      </View>

      {/* Additional Info */}
      {food && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Food Information</Text>
          
          <View style={styles.infoRows}>
            {food.brand && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Brand</Text>
                <Text style={styles.infoValue}>{food.brand}</Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Calories per 100g</Text>
              <Text style={styles.infoValue}>{food.kcal_per_100g} kcal</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>
                {food.is_builtin ? 'Database Food' : 'Custom Food'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Timestamps */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timestamps</Text>
        
        <View style={styles.infoRows}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Logged Date</Text>
            <Text style={styles.infoValue}>{formatDate(entry.date)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Meal Type</Text>
            <Text style={styles.infoValue}>{getMealDisplayName(entry.meal_type)}</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color="#4CAF50" />
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color="#f44336" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Share Modal */}
      <Modal visible={showShareModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.shareModal}>
            <Ionicons name="share-outline" size={48} color="#4CAF50" />
            <Text style={styles.shareModalText}>Sharing entry...</Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerMain: {
    marginBottom: 12,
  },
  foodName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  mealInfo: {
    fontSize: 16,
    color: '#666',
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  editContainer: {
    marginTop: 8,
  },
  editRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  amountInput: {
    flex: 2,
  },
  unitInput: {
    flex: 1,
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  amountDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  editIconButton: {
    padding: 8,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  nutritionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  nutritionBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
  },
  infoRows: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#f44336',
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  shareModalText: {
    fontSize: 16,
    color: '#333',
    marginTop: 16,
  },
});