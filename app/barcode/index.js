/**
 * Barcode Scanner Entry Screen - Camera permission and scanner interface
 * 
 * Purpose: Entry point for barcode scanning with permission handling
 * Features: Camera permission request, live barcode scanning, manual input fallback
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  StatusBar,
  Platform,
  Vibration,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/stores/useAppStore';

export default function BarcodeIndexScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { selectedDate } = useAppStore();
  
  const [permission, requestPermission] = useCameraPermissions();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [lastScanTime, setLastScanTime] = useState(0);
  
  const selectedMeal = params.meal || 'breakfast';
  const cameraRef = useRef(null);

  useEffect(() => {
    // Check permission on mount
    if (permission === null) {
      // Still loading
      return;
    }
    
    if (permission && !permission.granted) {
      setShowPermissionModal(true);
    }
  }, [permission]);

  const handlePermissionRequest = async () => {
    setShowPermissionModal(false);
    const result = await requestPermission();
    
    if (!result.granted) {
      // Permission denied, show manual input mode
      setShowManualInput(true);
    }
  };

  const handleBarcodeScanned = ({ type, data }) => {
    if (!isScanning) return;
    
    // Debounce scanning - prevent duplicate scans within 1.5s
    const now = Date.now();
    if (data === lastScannedCode && now - lastScanTime < 1500) {
      return;
    }
    
    setLastScannedCode(data);
    setLastScanTime(now);
    setIsScanning(false);
    
    // Haptic feedback
    if (Platform.OS !== 'web') {
      Vibration.vibrate(100);
    }
    
    // Navigate to barcode resolution
    handleBarcodeResolution(data);
  };

  const handleManualSubmit = () => {
    const cleanBarcode = manualBarcode.replace(/\D/g, ''); // Remove non-digits
    
    if (cleanBarcode.length < 8 || cleanBarcode.length > 14) {
      Alert.alert('Invalid Barcode', 'Please enter a valid barcode.');
      return;
    }
    
    handleBarcodeResolution(cleanBarcode);
  };

  const handleBarcodeResolution = (barcode) => {
    router.push({
      pathname: '/barcode/resolve',
      params: {
        barcode: barcode,
        meal: selectedMeal,
        date: selectedDate,
      }
    });
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

  const renderManualInputKeyboard = () => (
    <Modal visible={showManualInput} animationType="slide">
      <View style={styles.manualInputContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        {/* Header */}
        <View style={[styles.manualHeader, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => setShowManualInput(false)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Scan a Barcode</Text>
          
          <TouchableOpacity 
            style={[
              styles.submitButton,
              !manualBarcode.trim() && styles.submitButtonDisabled
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

        {/* Manual Input */}
        <View style={styles.manualInputContent}>
          <TextInput
            style={styles.barcodeInput}
            value={manualBarcode}
            onChangeText={setManualBarcode}
            placeholder="Enter barcode here"
            placeholderTextColor="#999"
            keyboardType="numeric"
            autoFocus
            maxLength={14}
          />
        </View>

        {/* Custom Numeric Keypad */}
        <View style={styles.keypadContainer}>
          <View style={styles.keypadRow}>
            {[1, 2, 3].map(num => (
              <TouchableOpacity
                key={num}
                style={styles.keypadButton}
                onPress={() => setManualBarcode(prev => prev + num.toString())}
              >
                <Text style={styles.keypadButtonText}>{num}</Text>
                <Text style={styles.keypadButtonSubtext}>
                  {num === 1 ? '' : num === 2 ? 'ABC' : 'DEF'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.keypadRow}>
            {[4, 5, 6].map(num => (
              <TouchableOpacity
                key={num}
                style={styles.keypadButton}
                onPress={() => setManualBarcode(prev => prev + num.toString())}
              >
                <Text style={styles.keypadButtonText}>{num}</Text>
                <Text style={styles.keypadButtonSubtext}>
                  {num === 4 ? 'GHI' : num === 5 ? 'JKL' : 'MNO'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.keypadRow}>
            {[7, 8, 9].map(num => (
              <TouchableOpacity
                key={num}
                style={styles.keypadButton}
                onPress={() => setManualBarcode(prev => prev + num.toString())}
              >
                <Text style={styles.keypadButtonText}>{num}</Text>
                <Text style={styles.keypadButtonSubtext}>
                  {num === 7 ? 'PQRS' : num === 8 ? 'TUV' : 'WXYZ'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.keypadRow}>
            <View style={styles.keypadButton} />
            <TouchableOpacity
              style={styles.keypadButton}
              onPress={() => setManualBarcode(prev => prev + '0')}
            >
              <Text style={styles.keypadButtonText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.keypadButton}
              onPress={() => setManualBarcode(prev => prev.slice(0, -1))}
            >
              <Ionicons name="backspace-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
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
          <View style={styles.permissionIcon}>
            <Ionicons name="scan-outline" size={64} color="#666" />
          </View>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to scan food barcodes for quick logging.
          </Text>
          
          <TouchableOpacity style={styles.permissionButton} onPress={handlePermissionRequest}>
            <Text style={styles.permissionButtonText}>Enable Camera</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.fallbackButton} 
            onPress={() => setShowManualInput(true)}
          >
            <Text style={styles.fallbackButtonText}>Enter Manually</Text>
          </TouchableOpacity>
        </View>

        {renderPermissionModal()}
        {renderManualInputKeyboard()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Scan a Barcode</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
          }}
        >
          {/* Scanning Overlay */}
          <View style={styles.scanningOverlay}>
            <View style={styles.scanningFrame}>
              <View style={styles.cornerTopLeft} />
              <View style={styles.cornerTopRight} />
              <View style={styles.cornerBottomLeft} />
              <View style={styles.cornerBottomRight} />
            </View>
            
            {!isScanning && (
              <View style={styles.scanningIndicator}>
                <Text style={styles.scanningText}>Scanning...</Text>
              </View>
            )}
          </View>
        </CameraView>
      </View>

      {/* Manual Input Bar */}
      <View style={[styles.manualInputBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity 
          style={styles.manualInputButton}
          onPress={() => setShowManualInput(true)}
        >
          <Text style={styles.manualInputText}>Manually enter barcode</Text>
        </TouchableOpacity>
      </View>

      {renderPermissionModal()}
      {renderManualInputKeyboard()}
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
  scanningFrame: {
    width: 250,
    height: 150,
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#4CAF50',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#4CAF50',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#4CAF50',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#4CAF50',
  },
  scanningIndicator: {
    position: 'absolute',
    bottom: -50,
    alignItems: 'center',
  },
  scanningText: {
    fontSize: 14,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  manualInputBar: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  manualInputButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  manualInputText: {
    fontSize: 16,
    color: '#666',
  },
  
  // Permission states
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
  
  // Permission Modal
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
  permissionActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  permissionCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  permissionContinueButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionContinueText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  
  // Manual Input Screen
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
  submitButton: {
    padding: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  manualInputContent: {
    backgroundColor: '#000',
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barcodeInput: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 18,
    color: '#000',
    textAlign: 'center',
    width: '100%',
    maxWidth: 300,
  },
  
  // Custom Keypad
  keypadContainer: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  keypadButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  keypadButtonText: {
    fontSize: 24,
    fontWeight: '400',
    color: '#000',
  },
  keypadButtonSubtext: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 2,
  },
});