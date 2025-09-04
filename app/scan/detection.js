/**
 * Detection Results Screen - Review AI-detected food items
 * 
 * Purpose: Display detected food items with selection and portion adjustment
 * Features: Multi-select list, portion editing, meal assignment, manual search fallback
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMealDisplayName } from '@/utils/helpers';
import EditPortionModal from '@/components/EditPortionModal';
import { detectFoodsInImage } from '@/utils/visionAPI';

export default function DetectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  const [detectedItems, setDetectedItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isDetecting, setIsDetecting] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [detectionFailed, setDetectionFailed] = useState(false);

  const selectedMeal = params.meal || 'breakfast';
  const photoUri = params.photoUri;

  useEffect(() => {
    performFoodDetection();
  }, []);

  const performFoodDetection = async () => {
    try {
      setIsDetecting(true);
      
      // Call real OpenAI food detection API
      console.log('开始调用 OpenAI 图片识别...');
      const detectedFoods = await detectFoodsInImage(photoUri);
      
      if (!detectedFoods || detectedFoods.length === 0) {
        console.log('OpenAI 未识别到食物');
        setDetectionFailed(true);
        setIsDetecting(false);
        return;
      }
      
      console.log(`OpenAI 识别到 ${detectedFoods.length} 种食物:`, detectedFoods);
      setDetectedItems(detectedFoods);
      
      // Auto-select high confidence items (>= 0.7)
      const autoSelected = new Set(
        detectedFoods
          .filter(item => item.confidence >= 0.7)
          .map(item => item.id)
      );
      setSelectedItems(autoSelected);
      
      setIsDetecting(false);
    } catch (error) {
      console.error('Detection error:', error);
      setDetectionFailed(true);
      setIsDetecting(false);
      
      // Show user-friendly error message
      Alert.alert(
        '识别失败',
        '图片识别服务暂时不可用，请稍后重试或手动添加食物。',
        [
          { text: '手动添加', onPress: handleManualSearch },
          { text: '重试', onPress: performFoodDetection },
          { text: '取消', style: 'cancel' }
        ]
      );
    }
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const updateItemPortion = (itemId, updates) => {
    setDetectedItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  const getSelectedItemsData = () => {
    return detectedItems.filter(item => selectedItems.has(item.id));
  };

  const getTotalCalories = () => {
    return getSelectedItemsData().reduce((total, item) => {
      const multiplier = item.servings * (item.selectedUnit.grams / 100);
      return total + Math.round(item.calories * multiplier);
    }, 0);
  };

  const handleManualSearch = () => {
    router.push({
      pathname: '/scan/search',
      params: {
        meal: selectedMeal,
        photoUri: photoUri,
        detectedItems: JSON.stringify(getSelectedItemsData()),
      }
    });
  };

  const renderDetectionItem = (item) => {
    const isSelected = selectedItems.has(item.id);
    const isLowConfidence = item.confidence < 0.5;
    const multiplier = item.servings * (item.selectedUnit.grams / 100);
    const adjustedCalories = Math.round(item.calories * multiplier);
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.detectionItem, isSelected && styles.selectedDetectionItem]}
        onPress={() => toggleItemSelection(item.id)}
      >
        <View style={styles.itemCheckbox}>
          {isSelected && (
            <Ionicons name="checkmark" size={16} color="#4CAF50" />
          )}
        </View>
        
        <View style={styles.itemContent}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={[
            styles.itemDetails,
            isLowConfidence && styles.lowConfidenceText
          ]}>
            {adjustedCalories} cal, {item.servings} × {item.selectedUnit.label}
            {isLowConfidence && ' • low confidence'}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditingItem(item)}
        >
          <Ionicons name="create-outline" size={20} color="#4CAF50" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingContent}>
        <View style={styles.loadingIcon}>
          <Ionicons name="scan" size={32} color="#4CAF50" />
        </View>
        <Text style={styles.loadingTitle}>Detecting foods...</Text>
        <Text style={styles.loadingSubtitle}>This may take a few seconds</Text>
        
        {/* Skeleton items */}
        <View style={styles.skeletonContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonItem}>
              <View style={styles.skeletonCheckbox} />
              <View style={styles.skeletonContent}>
                <View style={styles.skeletonTitle} />
                <View style={styles.skeletonSubtitle} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyContent}>
        <View style={styles.emptyIcon}>
          <Ionicons name="search-outline" size={48} color="#ccc" />
        </View>
        <Text style={styles.emptyTitle}>We couldn't detect items</Text>
        <Text style={styles.emptySubtitle}>
          Don't worry! You can search and add foods manually.
        </Text>
        
        <TouchableOpacity 
          style={styles.manualSearchButton}
          onPress={handleManualSearch}
        >
          <Ionicons name="search" size={20} color="#fff" />
          <Text style={styles.manualSearchButtonText}>Search & Add manually</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isDetecting) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Scan a Meal</Text>
          
          <View style={styles.headerSpacer} />
        </View>

        {renderLoadingState()}
      </View>
    );
  }

  if (detectionFailed || detectedItems.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Scan a Meal</Text>
          
          <View style={styles.headerSpacer} />
        </View>

        {renderEmptyState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Scan a Meal</Text>
        
        <TouchableOpacity onPress={handleManualSearch}>
          <Ionicons name="search" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Photo Preview */}
      <View style={styles.photoPreview}>
        <Image source={{ uri: photoUri }} style={styles.photo} />
      </View>

      {/* Instructions */}
      <View style={styles.instructionsBar}>
        <Text style={styles.instructionsText}>
          Review items and adjust servings if needed.
        </Text>
      </View>

      {/* Detection Results */}
      <ScrollView style={styles.resultsList} showsVerticalScrollIndicator={false}>
        {detectedItems.map(renderDetectionItem)}
        
        {/* Add More Items Button */}
        <TouchableOpacity 
          style={styles.addMoreButton}
          onPress={handleManualSearch}
        >
          <Ionicons name="add" size={20} color="#4CAF50" />
          <Text style={styles.addMoreText}>Add more items</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Fixed Next Button */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity 
          style={[
            styles.nextButton,
            selectedItems.size === 0 && styles.nextButtonDisabled
          ]}
          onPress={() => {
            if (selectedItems.size > 0) {
              router.push({
                pathname: '/scan/log',
                params: {
                  meal: selectedMeal,
                  items: JSON.stringify(getSelectedItemsData()),
                }
              });
            }
          }}
          disabled={selectedItems.size === 0}
        >
          <Text style={[
            styles.nextButtonText,
            selectedItems.size === 0 && styles.nextButtonTextDisabled
          ]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>

      {/* Edit Portion Modal */}
      {editingItem && (
        <EditPortionModal
          visible={!!editingItem}
          item={editingItem}
          meal={selectedMeal}
          onClose={() => setEditingItem(null)}
          onSave={(updates) => {
            updateItemPortion(editingItem.id, updates);
            setEditingItem(null);
          }}
        />
      )}

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
  photoPreview: {
    height: 120,
    backgroundColor: '#000',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  instructionsBar: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
    fontWeight: '500',
  },
  resultsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  detectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedDetectionItem: {
    borderColor: '#4CAF50',
    backgroundColor: '#F8FFF8',
  },
  itemCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
  },
  lowConfidenceText: {
    color: '#FF9500',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 8,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  addMoreText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  nextButtonDisabled: {
    backgroundColor: '#E5E5EA',
    opacity: 0.4,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  nextButtonTextDisabled: {
    color: '#8E8E93',
  },
  
  // Loading state
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  loadingIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  skeletonContainer: {
    alignSelf: 'stretch',
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  skeletonCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    marginRight: 12,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonTitle: {
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
    width: '70%',
  },
  skeletonSubtitle: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    width: '50%',
  },
  
  // Empty state
  emptyContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  manualSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  manualSearchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});