/**
 * Manual Search Screen - Add missing items not detected by AI
 * 
 * Purpose: Search and add foods that weren't detected in the meal scan
 * Features: OFF + FDC aggregated search, suggested searches, portion adjustment
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/stores/useAppStore';
import EditPortionModal from '@/components/EditPortionModal';

const SUGGESTED_SEARCHES = [
  'sauce', 'dressing', 'oil', 'butter', 'salt', 'pepper',
  'bread', 'rice', 'pasta', 'cheese', 'milk', 'egg'
];

export default function ScanSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  const { searchFoodsInDatabase, searchResults, isSearching } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [addedItems, setAddedItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);

  const selectedMeal = params.meal || 'breakfast';
  const detectedItems = params.detectedItems ? JSON.parse(params.detectedItems) : [];

  useEffect(() => {
    // Initial search for popular foods
    searchFoodsInDatabase('');
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        searchFoodsInDatabase(searchQuery);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery]);

  const handleAddFood = (food) => {
    // Create a standardized item structure
    const newItem = {
      id: `search_${Date.now()}`,
      name: food.name,
      brand: food.brand,
      confidence: 1.0, // Manual selection = high confidence
      calories: food.kcal_per_100g || 0,
      servingText: '100 g',
      units: [
        { label: '100 g', grams: 100 },
        { label: '1 g', grams: 1 },
        ...(food.serving_label && food.grams_per_serving ? [
          { label: food.serving_label, grams: food.grams_per_serving }
        ] : [])
      ],
      macros: {
        carbs: food.carbs_per_100g || 0,
        protein: food.protein_per_100g || 0,
        fat: food.fat_per_100g || 0,
      },
      selectedUnit: { label: '100 g', grams: 100 },
      servings: 1,
      source: 'search',
    };

    setAddedItems(prev => [...prev, newItem]);
  };

  const handleEditPortion = (item) => {
    setEditingItem(item);
  };

  const updateItemPortion = (itemId, updates) => {
    setAddedItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  const removeAddedItem = (itemId) => {
    setAddedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleContinue = () => {
    const allItems = [...detectedItems, ...addedItems];
    
    router.push({
      pathname: '/scan/log',
      params: {
        meal: selectedMeal,
        items: JSON.stringify(allItems),
      }
    });
  };

  const renderSuggestedSearches = () => (
    <View style={styles.suggestedContainer}>
      <Text style={styles.suggestedTitle}>Suggested Searches</Text>
      <View style={styles.suggestedTags}>
        {SUGGESTED_SEARCHES.map((term) => (
          <TouchableOpacity
            key={term}
            style={styles.suggestedTag}
            onPress={() => setSearchQuery(term)}
          >
            <Text style={styles.suggestedTagText}>{term}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSearchResults = () => (
    <View style={styles.searchResults}>
      {isSearching ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        searchResults.map((food) => (
          <TouchableOpacity
            key={food.id}
            style={styles.foodItem}
            onPress={() => handleAddFood(food)}
          >
            <View style={styles.foodContent}>
              <Text style={styles.foodName}>{food.name}</Text>
              {food.brand && (
                <Text style={styles.foodBrand}>{food.brand}</Text>
              )}
              <Text style={styles.foodNutrition}>
                {Math.round(food.kcal_per_100g || 0)} kcal/100g
                {food.source && ` • ${food.source}`}
              </Text>
            </View>
            <View style={styles.addButton}>
              <Ionicons name="add" size={20} color="#4CAF50" />
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderAddedItems = () => {
    if (addedItems.length === 0) return null;

    return (
      <View style={styles.addedItemsSection}>
        <Text style={styles.addedItemsTitle}>Added Items</Text>
        {addedItems.map((item) => {
          const multiplier = item.servings * (item.selectedUnit.grams / 100);
          const adjustedCalories = Math.round(item.calories * multiplier);
          
          return (
            <View key={item.id} style={styles.addedItem}>
              <View style={styles.addedItemContent}>
                <Text style={styles.addedItemName}>{item.name}</Text>
                <Text style={styles.addedItemDetails}>
                  {adjustedCalories} cal, {item.servings} × {item.selectedUnit.label}
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.editAddedButton}
                onPress={() => handleEditPortion(item)}
              >
                <Ionicons name="create-outline" size={18} color="#4CAF50" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.removeAddedButton}
                onPress={() => removeAddedItem(item.id)}
              >
                <Ionicons name="close" size={18} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Add Missing Items</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* Info Bar */}
      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          Meal Scan may miss some items—search to add them.
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#4CAF50" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search foods..."
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Added Items */}
        {renderAddedItems()}

        {/* Suggested Searches */}
        {!searchQuery.trim() && renderSuggestedSearches()}

        {/* Search Results */}
        {renderSearchResults()}
      </ScrollView>

      {/* Bottom Continue Button */}
      {(detectedItems.length > 0 || addedItems.length > 0) && (
        <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>
              Continue ({detectedItems.length + addedItems.length} items)
            </Text>
          </TouchableOpacity>
        </View>
      )}

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
  infoBar: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
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
  content: {
    flex: 1,
  },
  addedItemsSection: {
    backgroundColor: '#fff',
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  addedItemsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  addedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  addedItemContent: {
    flex: 1,
  },
  addedItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  addedItemDetails: {
    fontSize: 14,
    color: '#666',
  },
  editAddedButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  removeAddedButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestedContainer: {
    backgroundColor: '#fff',
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  suggestedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  suggestedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestedTag: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  suggestedTagText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  searchResults: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  foodContent: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  foodBrand: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  foodNutrition: {
    fontSize: 12,
    color: '#999',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});