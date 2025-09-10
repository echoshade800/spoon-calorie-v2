/**
 * Barcode Resolution Screen - Handle barcode lookup and matching
 * 
 * Purpose: Resolve barcode to food item and handle different match scenarios
 * Features: API lookup, loading states, match/no-match/multiple-match handling
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BarcodeResolveScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const barcode = params.barcode;
  const selectedMeal = params.meal || 'breakfast';
  const selectedDate = params.date;

  useEffect(() => {
    resolveBarcodeToFood();
  }, []);

  const resolveBarcodeToFood = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate API call to resolve barcode
      // In real implementation, this would call your barcode API
      const response = await mockBarcodeAPI(barcode);
      
      if (response.matched === true) {
        // Navigate to Add Food with matched food
        router.replace({
          pathname: '/barcode/add-food',
          params: {
            foodId: response.foodId,
            foodName: response.foodName,
            meal: selectedMeal,
            date: selectedDate,
            barcode: barcode,
          }
        });
      } else if (response.matched === 'multiple') {
        // Navigate to multiple results
        router.replace({
          pathname: '/barcode/results',
          params: {
            barcode: barcode,
            meal: selectedMeal,
            date: selectedDate,
            candidates: JSON.stringify(response.candidates),
          }
        });
      } else {
        // Navigate to no results page
        router.replace({
          pathname: '/barcode/results',
          params: {
            barcode: barcode,
            meal: selectedMeal,
            date: selectedDate,
            matched: 'false',
          }
        });
      }
    } catch (error) {
      console.error('Barcode resolution error:', error);
      setError('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  // Mock API for demonstration
  const mockBarcodeAPI = async (barcode) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock different scenarios based on barcode
    if (barcode === '1234567890123') {
      return {
        matched: true,
        foodId: 'off_1234567890123',
        foodName: 'Coca-Cola Classic',
      };
    } else if (barcode === '9876543210987') {
      return {
        matched: 'multiple',
        candidates: [
          { id: 'food1', name: 'Product A', brand: 'Brand X' },
          { id: 'food2', name: 'Product B', brand: 'Brand Y' },
        ]
      };
    } else {
      return { matched: false };
    }
  };

  const handleRetry = () => {
    resolveBarcodeToFood();
  };

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Barcode Lookup</Text>
          
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Ionicons name="wifi-outline" size={48} color="#FF3B30" />
          </View>
          <Text style={styles.errorTitle}>Network Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Barcode Lookup</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingTitle}>Finding your food...</Text>
        <Text style={styles.loadingSubtitle}>
          Searching for barcode: {barcode}
        </Text>
      </View>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorIcon: {
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});