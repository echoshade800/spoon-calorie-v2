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
import Constants from 'expo-constants';
import {API_BASE_URL} from '@/utils/apiClient';

// API 基础配置
// const API_BASE_URL = Constants.platform?.OS === 'web' 
//   ? 'http://localhost:3001/api'
//   : 'http://54.80.146.38:3001/api';

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
      
      // 首先尝试在本地数据库中查找条形码
      console.log('开始条形码查找:', barcode);
      
      // 尝试通过条形码搜索本地数据库
      const { searchFoodsInDatabase } = useAppStore.getState();
      const localResults = await searchFoodsInDatabase(barcode);
      
      // 检查本地是否有匹配的条形码
      const localMatch = localResults.find(food => food.barcode === barcode);
      
      if (localMatch) {
        console.log('在本地数据库找到条形码匹配:', localMatch.name);
        setLookupResult({
          matched: true,
          foodId: localMatch.id,
          foodName: localMatch.name,
          brand: localMatch.brand
        });
        
        // Navigate to food details with barcode match info
        router.replace({
          pathname: '/food-details',
          params: {
            foodId: localMatch.id,
            meal: selectedMeal,
            returnTo: 'add',
            barcodeMatched: 'true',
            matchedFoodName: localMatch.name,
            barcode: barcode,
          }
        });
      } else {
        console.log('本地数据库未找到，尝试FatSecret API...');
        
        // 尝试使用FatSecret API查找条形码
        try {
          const barcode_url=`${API_BASE_URL}/foods/barcode/${barcode}`
          console.log('FatSecret API URL:', barcode_url);
          const response = await fetch(barcode_url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 15000,
          });
          console.log('FatSecret API响应状态:', response.status,response);
          
          const data = await response.json();
          
          if (data.success && data.food) {
            console.log('FatSecret找到条形码匹配:', data.food.name);
            setLookupResult({
              matched: true,
              foodId: data.food.id,
              foodName: data.food.name,
              brand: data.food.brand
            });
            
            // Navigate to food details with barcode match info
            router.replace({
              pathname: '/food-details',
              params: {
                foodId: data.food.id,
                meal: selectedMeal,
                returnTo: 'add',
                barcodeMatched: 'true',
                matchedFoodName: data.food.name,
                barcode: barcode,
                fromFatSecret: 'true',
              }
            });
            return;
          }
        } catch (fatSecretError) {
          console.log('FatSecret API调用失败:', fatSecretError.message);
        }
        
        // 如果本地和FatSecret都没找到，显示无匹配结果
        console.log('所有数据源都未找到该条形码');
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
        'Network Error',
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