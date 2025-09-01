/**
 * Directions Editor Screen - Edit meal preparation instructions
 * 
 * Purpose: Full-screen text editor for meal directions with auto-save
 * Features: Multi-line input, placeholder text, keyboard handling, change detection
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PLACEHOLDER_TEXT = `1. Spread peanut butter and jelly on bread.
2. Put slices of bread together.
3. Enjoy`;

export default function DirectionsEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const textInputRef = useRef(null);
  
  const [directions, setDirections] = useState(params.directions || '');
  const [initialDirections] = useState(params.directions || '');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Auto-focus the text input when screen opens
    const timer = setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setHasChanges(directions !== initialDirections);
  }, [directions, initialDirections]);

  const handleClose = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes that will be lost.',
        [
          { text: 'Keep editing', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => router.back()
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleDone = () => {
    // Navigate back with updated directions as a parameter
    router.replace({
      pathname: '/create-meal',
      params: { 
        ...params,
        updatedDirections: directions 
      }
    });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Directions</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* Text Input */}
      <View style={styles.content}>
        <TextInput
          ref={textInputRef}
          style={styles.textInput}
          value={directions}
          onChangeText={setDirections}
          placeholder={PLACEHOLDER_TEXT}
          placeholderTextColor="#999"
          multiline
          textAlignVertical="top"
          autoFocus
        />
      </View>

      {/* Done Button */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity 
          style={styles.doneButton}
          onPress={handleDone}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  closeButton: {
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  doneButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});