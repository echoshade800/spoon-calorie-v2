/**
 * Barcode Results Screen - Handle no match scenario
 * 
 * Purpose: Show when barcode is not found in database with fallback options
 * Features: Search fallback, create food option, empty state messaging
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/stores/useAppStore';

export default function BarcodeResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  const { searchFoodsInDatabase, searchResults, isSearching } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState('');

  const barcode = params.barcode;
  const selectedMeal = params.meal || 'breakfast';

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchFoodsInDatabase(query);
    }
  };

  const handleCreateFood = () => {
    router.push({
      pathname: '/create-food',
      params: {
        returnTo: 'barcode-results',
        barcode: barcode,
        meal: selectedMeal,
      }
    });
  };

  const handleFoodSelect = (food) => {
    router.push({
      pathname: '/food-details',
      params: {
        foodId: food.id,
        meal: selectedMeal,
        returnTo: 'add',
        fromBarcode: 'true',
        barcode: barcode,
      }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Barcode Results</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#4CAF50" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a food"
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Search Results */}
        {searchQuery.trim() && (
          <View style={styles.searchResults}>
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              searchResults.map((food) => (
                <TouchableOpacity
                  key={food.id}
                  style={styles.foodItem}
                  onPress={() => handleFoodSelect(food)}
                >
                  <View style={styles.foodContent}>
                    <Text style={styles.foodName}>{food.name}</Text>
                    {food.brand && (
                      <Text style={styles.foodBrand}>{food.brand}</Text>
                    )}
                    <Text style={styles.foodNutrition}>
                      {Math.round(food.kcal_per_100g || 0)} kcal/100g
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noSearchResults}>
                <Text style={styles.noSearchResultsText}>No foods found for "{searchQuery}"</Text>
              </View>
            )}
          </View>
        )}

        {/* Empty State */}
        {!searchQuery.trim() && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="barcode-outline" size={64} color="#ccc" />
            </View>
            
            <Text style={styles.emptyTitle}>
              Sorry, there are millions of foods in our database but we can't seem to find this one.
            </Text>
            
            <TouchableOpacity 
              style={styles.createFoodButton}
              onPress={handleCreateFood}
            >
              <Text style={styles.createFoodButtonText}>Create a Food</Text>
            </TouchableOpacity>
            
            <View style={styles.barcodeInfo}>
              <Text style={styles.barcodeLabel}>Scanned barcode:</Text>
              <Text style={styles.barcodeValue}>{barcode}</Text>
            </View>
          </View>
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
  headerSpacer: {
    width: 32,
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
  contentContainer: {
    flexGrow: 1,
  },
  searchResults: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
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
  noSearchResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noSearchResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
  },
  createFoodButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  createFoodButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  barcodeInfo: {
    alignItems: 'center',
  },
  barcodeLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  barcodeValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});