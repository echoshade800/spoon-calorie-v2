/**
 * Barcode Lookup Screen - Process scanned barcode and find matching food
 * 
 * Purpose: Look up barcode in database and handle match/no-match scenarios
 * Features: API lookup, loading state, match handling, fallback options
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/stores/useAppStore';

import { API } from '@/utils/apiClient';

export default function BarcodeLookupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  const { searchFoodsInDatabase } = useAppStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [lookupResult, setLookupResult] = useState(null);

  const barcode = params.barcode;
  const selectedMeal = params.meal || 'breakfast';
  const source = params.source || 'scan';

  useEffect(() => {
    performBarcodeLookup();
  }, []);

  const performBarcodeLookup = async () => {
    try {
      setIsLoading(true);
      
      console.log('开始条形码查找:', barcode);
      
      // 调用专门的条形码查找API
      const response = await API.getFoodByBarcode(barcode);
      
      if (response.success && response.food) {
        console.log('找到条形码匹配:', response.food.name);
        setLookupResult({
          matched: true,
          foodId: response.food.id,
          foodName: response.food.name,
          brand: response.food.brand,
          source: response.source
        });
        
        // Navigate to food details with barcode match info
        router.replace({
          pathname: '/food-details',
          params: {
            foodId: response.food.id,
            meal: selectedMeal,
            returnTo: 'add',
            barcodeMatched: 'true',
            matchedFoodName: response.food.name,
            barcode: barcode,
            fromFatSecret: response.source === 'fatsecret' ? 'true' : 'false',
          }
        });
      } else {
        console.log('未找到该条形码对应的食品');
        setLookupResult({ matched: false });
        
        router.replace({
          pathname: '/barcode/results',
          params: {
            barcode: barcode,
            meal: selectedMeal,
          }
        });
      }
    } catch (error) {
      console.error('Barcode lookup error:', error);
      Alert.alert(
        'Lookup Error',
        'Please try again.',
        [
          { text: 'Retry', onPress: () => performBarcodeLookup() },
          { text: 'Cancel', onPress: () => router.back() },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Looking up barcode...</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* Loading Content */}
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <View style={styles.loadingIcon}>
            <Ionicons name="search" size={48} color="#4CAF50" />
          </View>
          
          <Text style={styles.loadingTitle}>Finding your food...</Text>
          <Text style={styles.loadingSubtitle}>
            Searching our database for barcode {barcode}
          </Text>
          
          {/* Loading animation placeholder */}
          <View style={styles.loadingDots}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
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
  loadingContent: {
    alignItems: 'center',
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
    marginBottom: 32,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    opacity: 0.6,
  },
});