/**
 * Barcode Search Screen - Search for better match when barcode match is incorrect
 * 
 * Purpose: Allow users to search for correct food when barcode match is wrong
 * Features: Full food database search, create food option, return to add food flow
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

export default function BarcodeSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  const { searchFoodsInDatabase, searchResults, isSearching } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const barcode = params.barcode;
  const selectedMeal = params.meal || 'breakfast';
  const selectedDate = params.date;

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

  const handleFoodSelect = (food) => {
    router.replace({
      pathname: '/barcode/add-food',
      params: {
        foodId: food.id,
        foodName: food.name,
        meal: selectedMeal,
        date: selectedDate,
        barcode: barcode,
      }
    });
  };

  const handleCreateFood = () => {
    router.push({
      pathname: '/create-food',
      params: {
        barcode: barcode,
        meal: selectedMeal,
        date: selectedDate,
        returnTo: 'barcode',
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
        
        <Text style={styles.headerTitle}>Find Better Match</Text>
        
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
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoText}>
          Barcode: {barcode} • Search for the correct food or create a new one
        </Text>
      </View>

      {/* Search Results */}
      <ScrollView style={styles.searchResults} showsVerticalScrollIndicator={false}>
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : (
          <>
            {searchResults.map((food) => (
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
                    {food.source && ` • ${food.source}`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            ))}
            
            {/* Create Food Option */}
            <TouchableOpacity 
              style={styles.createFoodItem}
              onPress={handleCreateFood}
            >
              <View style={styles.createFoodIcon}>
                <Ionicons name="add" size={24} color="#2196F3" />
              </View>
              <View style={styles.createFoodContent}>
                <Text style={styles.createFoodName}>Create a Food</Text>
                <Text style={styles.createFoodDescription}>
                  Add this product to the database
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          </>
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
  infoBanner: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  
  // No match state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createFoodButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2196F3',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  createFoodButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  
  // Multiple matches
  candidatesContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  candidatesTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  candidatesSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  candidatesList: {
    flex: 1,
  },
  candidateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  candidateContent: {
    flex: 1,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  candidateBrand: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  
  // Search results
  searchResults: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
  createFoodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#F8F9FA',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  createFoodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  createFoodContent: {
    flex: 1,
  },
  createFoodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 2,
  },
  createFoodDescription: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});