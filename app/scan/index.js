/**
 * Scan Intro / Live Camera Screen - Entry point for meal scanning
 * 
 * Purpose: Camera interface for capturing meal photos with AI food detection
 * Features: Live camera preview, photo capture, gallery selection, flash toggle
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ScanIntroScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  const [permission, requestPermission] = useCameraPermissions();
  const [showHelp, setShowHelp] = useState(false);
  const [showFirstTimeGuide, setShowFirstTimeGuide] = useState(false);
  const cameraRef = useRef(null);

  const selectedMeal = params.meal || 'breakfast';

  useEffect(() => {
    // Show first-time guide for new users
    const hasSeenGuide = false; // TODO: Get from storage
    if (!hasSeenGuide) {
      setShowFirstTimeGuide(true);
    }
  }, []);

  const handleCameraCapture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      if (photo) {
        // Navigate to detection results with photo
        router.push({
          pathname: '/scan/detection',
          params: {
            photoUri: photo.uri,
            meal: selectedMeal,
          }
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const handlePickFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        router.push({
          pathname: '/scan/detection',
          params: {
            photoUri: result.assets[0].uri,
            meal: selectedMeal,
          }
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const toggleFlash = () => {
    setFlash(flash === 'off' ? 'on' : 'off');
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading camera...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Scan a Meal</Text>
          
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.permissionContainer}>
          <View style={styles.permissionIcon}>
            <Ionicons name="camera-outline" size={64} color="#666" />
          </View>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            To scan meals, we need access to your camera and photo library.
          </Text>
          
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Enable Camera</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.fallbackButton} onPress={handlePickFromLibrary}>
            <Text style={styles.fallbackButtonText}>Choose from Photos</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderFirstTimeGuide = () => (
    <Modal visible={showFirstTimeGuide} animationType="slide">
      <View style={styles.guideContainer}>
        <View style={styles.guideContent}>
          <View style={styles.guideIcon}>
            <Ionicons name="camera" size={48} color="#4CAF50" />
          </View>
          
          <Text style={styles.guideTitle}>How Meal Scan Works</Text>
          
          <View style={styles.guideSteps}>
            <View style={styles.guideStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Take a photo of your meal</Text>
            </View>
            
            <View style={styles.guideStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>Review detected food items</Text>
            </View>
            
            <View style={styles.guideStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>Adjust portions if needed</Text>
            </View>
            
            <View style={styles.guideStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepText}>Log to your diary</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.guideButton}
            onPress={() => setShowFirstTimeGuide(false)}
          >
            <Text style={styles.guideButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderHelpModal = () => (
    <Modal visible={showHelp} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.helpModal}>
          <View style={styles.helpHeader}>
            <Text style={styles.helpTitle}>How it works</Text>
            <TouchableOpacity onPress={() => setShowHelp(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.helpContent}>
            <Text style={styles.helpText}>
              • Point camera at your meal{'\n'}
              • Tap the capture button{'\n'}
              • Review detected items{'\n'}
              • Adjust portions if needed{'\n'}
              • Log to your diary
            </Text>
            
            <Text style={styles.helpTip}>
              💡 For best results, ensure good lighting and clear view of all food items.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Scan a Meal</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleFlash} style={styles.headerButton}>
            <Ionicons 
              name={flash === 'on' ? 'flash' : 'flash-off'} 
              size={24} 
              color="#000" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setShowHelp(true)} style={styles.headerButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flash}
        />
      </View>

      {/* Instructions and Capture Button */}
      <View style={styles.instructionsAndCaptureContainer}>
        <Text style={styles.instructionsText}>
          Tap the button to detect{'\n'}items in your meal
        </Text>
        
        <TouchableOpacity 
          style={styles.captureButton}
          onPress={handleCameraCapture}
        >
          <View style={styles.captureButtonInner}>
            <Ionicons name="scan" size={32} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      {renderFirstTimeGuide()}
      {renderHelpModal()}
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 4,
  },
  headerSpacer: {
    width: 32,
  },
  cameraContainer: {
    height: 400,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  instructionsAndCaptureContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  instructionsText: {
    fontSize: 20,
    color: '#000',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
  },
  captureButton: {
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // Permission screen
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#F2F2F7',
  },
  permissionIcon: {
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  fallbackButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  fallbackButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  
  // First time guide
  guideContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  guideContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  guideIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  guideTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 32,
  },
  guideSteps: {
    alignSelf: 'stretch',
    marginBottom: 40,
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  stepText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  guideButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  guideButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Help modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 0,
    width: '85%',
    maxWidth: 400,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  helpContent: {
    padding: 20,
  },
  helpText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
  },
  helpTip: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    lineHeight: 20,
  },
});