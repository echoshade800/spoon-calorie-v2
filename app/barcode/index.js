/**
 * Barcode Scan Screen - Camera interface for scanning food barcodes
 * 
 * Purpose: Scan product barcodes for quick food logging
 * Features: Live camera preview, barcode detection, manual input fallback
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
  Vibration,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

export default function BarcodeScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  const [permission, requestPermission] = useCameraPermissions();
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [lastScanTime, setLastScanTime] = useState(0);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const selectedMeal = params.meal || 'breakfast';

  useEffect(() => {
    // Show permission explanation on first visit
    if (permission && !permission.granted && permission.canAskAgain) {
      setShowPermissionModal(true);
    }
  }, [permission]);

  const handleBarcodeScanned = ({ type, data }) => {
    const now = Date.now();
    
    // Debounce: prevent scanning same code within 1.5 seconds
    if (data === lastScannedCode && now - lastScanTime < 1500) {
      return;
    }
    
    setLastScannedCode(data);
    setLastScanTime(now);
    setIsScanning(true);
    
    // Haptic feedback
    if (Constants.platform?.OS !== 'web') {
      Vibration.vibrate(100);
    }
    
    // Process barcode
    processBarcodeData(data);
  };

  const processBarcodeData = async (barcode) => {
    try {
      // Navigate to barcode lookup with the scanned code
      router.push({
        pathname: '/barcode/lookup',
        params: {
          barcode: barcode,
          meal: selectedMeal,
          source: 'scan'
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to process barcode. Please try again.');
      setIsScanning(false);
    }
  };

  const handleManualSubmit = () => {
    const cleanBarcode = manualBarcode.replace(/\D/g, ''); // Remove non-digits
    
    if (!cleanBarcode || cleanBarcode.length < 8 || cleanBarcode.length > 14) {
      Alert.alert('Invalid Barcode', 'Please enter a valid barcode.');
      return;
    }
    
    setShowManualInput(false);
    router.push({
      pathname: '/barcode/lookup',
      params: {
        barcode: cleanBarcode,
        meal: selectedMeal,
        source: 'manual'
      }
    });
  };

  const handlePermissionRequest = async () => {
    setShowPermissionModal(false);
    const result = await requestPermission();
    
    if (!result.granted) {
      // Show manual input mode
      setShowManualInput(true);
    }
  };

  const renderPermissionModal = () => (
    <Modal visible={showPermissionModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.permissionModal}>
          <View style={styles.permissionIcon}>
            <Ionicons name="camera-outline" size={48} color="#4CAF50" />
          </View>
          
          <Text style={styles.permissionTitle}>Allow Camera Access</Text>
          <Text style={styles.permissionBody}>
            We use your camera to scan food barcodes for quick logging.
          </Text>
          
          <View style={styles.permissionActions}>
            <TouchableOpacity 
              style={styles.permissionCancelButton}
              onPress={() => {
                setShowPermissionModal(false);
                setShowManualInput(true);
              }}
            >
              <Text style={styles.permissionCancelText}>Not Now</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.permissionContinueButton}
              onPress={handlePermissionRequest}
            >
              <Text style={styles.permissionContinueText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderManualInputModal = () => (
    <Modal visible={showManualInput} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.manualInputContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        {/* Header */}
        <View style={[styles.manualHeader, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => setShowManualInput(false)} style={styles.manualBackButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          
          <Text style={styles.manualHeaderTitle}>Scan a Barcode</Text>
          
          <TouchableOpacity 
            style={[
              styles.manualSubmitButton,
              !manualBarcode.trim() && styles.manualSubmitButtonDisabled
            ]}
            onPress={handleManualSubmit}
            disabled={!manualBarcode.trim()}
          >
            <Ionicons 
              name="checkmark" 
              size={24} 
              color={!manualBarcode.trim() ? "#C7C7CC" : "#4CAF50"} 
            />
          </TouchableOpacity>
        </View>

        {/* Input */}
        <View style={styles.manualInputContent}>
          <TextInput
            style={styles.manualBarcodeInput}
            value={manualBarcode}
            onChangeText={(text) => setManualBarcode(text.replace(/\D/g, ''))}
            placeholder="Enter barcode here"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={14}
            autoFocus
          />
        </View>
      </View>
    </Modal>
  );

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
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Scan a Barcode</Text>
          
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.permissionContainer}>
          <View style={styles.permissionIconLarge}>
            <Ionicons name="camera-outline" size={64} color="#666" />
          </View>
          <Text style={styles.permissionTitleLarge}>Camera Permission Required</Text>
          <Text style={styles.permissionTextLarge}>
            To scan barcodes, we need access to your camera.
          </Text>
          
          <TouchableOpacity style={styles.enableCameraButton} onPress={requestPermission}>
            <Text style={styles.enableCameraButtonText}>Enable Camera</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.manualModeButton} 
            onPress={() => setShowManualInput(true)}
          >
            <Text style={styles.manualModeButtonText}>Enter Barcode Manually</Text>
          </TouchableOpacity>
        </View>

        {renderManualInputModal()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Scan a Barcode</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
          }}
        >
          {/* Scanning Overlay */}
          <View style={styles.scanningOverlay}>
            {/* Viewfinder */}
            <View style={styles.viewfinder}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            
            {/* Scanning indicator */}
            {isScanning && (
              <View style={styles.scanningIndicator}>
                <Text style={styles.scanningText}>Scanning...</Text>
              </View>
            )}
          </View>
        </CameraView>
      </View>

      {/* Bottom Input Bar */}
      <View style={[styles.bottomInputBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity 
          style={styles.manualInputButton}
          onPress={() => setShowManualInput(true)}
        >
          <Text style={styles.manualInputText}>Manually enter barcode</Text>
        </TouchableOpacity>
      </View>

      {renderPermissionModal()}
      {renderManualInputModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerSpacer: {
    width: 32,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  scanningOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#4CAF50',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanningIndicator: {
    position: 'absolute',
    top: -60,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scanningText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  bottomInputBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  manualInputButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  manualInputText: {
    fontSize: 16,
    color: '#666',
  },
  
  // Permission screen
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#F2F2F7',
  },
  permissionIconLarge: {
    marginBottom: 24,
  },
  permissionTitleLarge: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  permissionTextLarge: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  enableCameraButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  enableCameraButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  manualModeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  manualModeButtonText: {
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
  
  // Permission modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 40,
    maxWidth: 320,
  },
  permissionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  permissionBody: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  permissionActions: {
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'stretch',
  },
  permissionCancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  permissionContinueButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionContinueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Manual input modal
  manualInputContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  manualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  manualBackButton: {
    padding: 4,
  },
  manualHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  manualSubmitButton: {
    padding: 4,
  },
  manualSubmitButtonDisabled: {
    opacity: 0.3,
  },
  manualInputContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  manualBarcodeInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    color: '#000',
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});