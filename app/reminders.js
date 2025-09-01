/**
 * Reminders & Notifications Screen - Meal reminder configuration
 * 
 * Purpose: Configure meal reminders with time pickers and notification settings
 * Features: Permission handling, time selection, days of week, quiet hours
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  StatusBar,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const DAYS_OF_WEEK = [
  { value: 0, label: 'S', fullName: 'Sunday' },
  { value: 1, label: 'M', fullName: 'Monday' },
  { value: 2, label: 'T', fullName: 'Tuesday' },
  { value: 3, label: 'W', fullName: 'Wednesday' },
  { value: 4, label: 'T', fullName: 'Thursday' },
  { value: 5, label: 'F', fullName: 'Friday' },
  { value: 6, label: 'S', fullName: 'Saturday' },
];

const DEFAULT_TIMES = {
  breakfast: '08:00',
  lunch: '12:30',
  dinner: '18:30',
};

export default function RemindersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: false,
    permission: 'undetermined',
    times: DEFAULT_TIMES,
    days: [0, 1, 2, 3, 4, 5, 6], // All days selected by default
    snoozeMinutes: 0, // 0 = off, 10 = on
    quietHours: { enabled: false, start: '22:00', end: '07:00' },
  });
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState(null);

  useEffect(() => {
    loadSavedSettings();
    checkNotificationPermissions();
  }, []);

  // Track changes to show save button
  useEffect(() => {
    if (originalSettings) {
      const hasChanges = 
        originalSettings.enabled !== notificationSettings.enabled ||
        JSON.stringify(originalSettings.times) !== JSON.stringify(notificationSettings.times) ||
        JSON.stringify(originalSettings.days) !== JSON.stringify(notificationSettings.days) ||
        originalSettings.snoozeMinutes !== notificationSettings.snoozeMinutes ||
        JSON.stringify(originalSettings.quietHours) !== JSON.stringify(notificationSettings.quietHours);
      
      setHasUnsavedChanges(hasChanges);
    }
  }, [notificationSettings, originalSettings]);

  const loadSavedSettings = async () => {
    try {
      // Load from AsyncStorage in a real app
      // For demo, we'll check if there are any scheduled notifications
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const hasReminders = scheduledNotifications.some(n => n.identifier.startsWith('reminder:'));
      
      if (hasReminders) {
        setNotificationSettings(prev => ({ ...prev, enabled: true }));
      }
      
      setOriginalSettings({ ...notificationSettings });
      console.log('Loaded notification settings, has reminders:', hasReminders);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      // In a real app, save to AsyncStorage:
      // await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
      
      setNotificationSettings(newSettings);
      setOriginalSettings({ ...newSettings });
      setHasUnsavedChanges(false);
      console.log('Settings saved:', newSettings);
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  };

  const checkNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationSettings(prev => ({
        ...prev,
        permission: status,
        enabled: status === 'granted' && prev.enabled,
      }));
    } catch (error) {
      console.error('Permission check error:', error);
    }
  };

  const requestNotificationPermissions = async () => {
    try {
      setIsLoading(true);
      const { status } = await Notifications.requestPermissionsAsync();
      
      setNotificationSettings(prev => ({
        ...prev,
        permission: status,
      }));

      if (status === 'granted') {
        const newSettings = { ...notificationSettings, enabled: true, permission: status };
        await saveSettings(newSettings);
        await scheduleAllReminders();
        Alert.alert('Success', 'Reminders updated.');
      } else {
        const newSettings = { ...notificationSettings, enabled: false, permission: status };
        await saveSettings(newSettings);
        Alert.alert(
          'Permission Required',
          'Notifications are required to enable reminders.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request permissions');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMealReminders = async (enabled) => {
    if (enabled) {
      if (notificationSettings.permission !== 'granted') {
        await requestNotificationPermissions();
        return;
      }
    } else {
      await cancelAllReminders();
    }
    
    // Just update the state, don't save yet
    setNotificationSettings(prev => ({ ...prev, enabled }));
  };

  const scheduleAllReminders = async () => {
    try {
      // Cancel existing reminders first
      await cancelAllReminders();
      
      if (!notificationSettings.enabled) return;

      const meals = ['breakfast', 'lunch', 'dinner'];
      
      for (const meal of meals) {
        const time = notificationSettings.times[meal];
        const [hours, minutes] = time.split(':').map(Number);
        
        // Calculate next trigger date with buffer to prevent immediate firing
        const now = new Date();
        const bufferTime = new Date(now.getTime() + 10000); // 10 seconds buffer
        
        let nextTriggerDate = new Date();
        nextTriggerDate.setHours(hours, minutes, 0, 0);
        
        // If the scheduled time for today has already passed or is too close, schedule for tomorrow
        if (nextTriggerDate <= bufferTime) {
          nextTriggerDate.setDate(nextTriggerDate.getDate() + 1);
        }

        // Schedule notification with calculated future date
        await Notifications.scheduleNotificationAsync({
          identifier: `reminder:${meal}`,
          content: {
            title: `${meal.charAt(0).toUpperCase() + meal.slice(1)}时间到了！`,
            body: `别忘了在QuickKcal中记录你的${meal === 'breakfast' ? '早餐' : meal === 'lunch' ? '午餐' : '晚餐'}。`,
            sound: true,
            data: { meal, time },
          },
          trigger: {
            hour: hours,
            minute: minutes,
            repeats: true,
          },
        });
        
        console.log(`Scheduled ${meal} reminder for ${time} (next trigger: ${nextTriggerDate.toLocaleString()})`);
      }
      
      console.log('All reminders scheduled successfully');
    } catch (error) {
      console.error('Schedule reminders error:', error);
      throw error;
    }
  };

  const cancelAllReminders = async () => {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        if (notification.identifier.startsWith('reminder:')) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (error) {
      console.error('Cancel reminders error:', error);
    }
  };

  const updateTime = (meal, time) => {
    // Update state and immediately save + reschedule
    setNotificationSettings(prev => ({
      ...prev,
      times: { ...prev.times, [meal]: time }
    }));
    
    // Auto-save and reschedule when time changes
    setTimeout(async () => {
      try {
        const newSettings = {
          ...notificationSettings,
          times: { ...notificationSettings.times, [meal]: time }
        };
        
        await saveSettings(newSettings);
        
        if (newSettings.enabled && newSettings.permission === 'granted') {
          await scheduleAllReminders();
        }
      } catch (error) {
        console.error('Auto-save error:', error);
      }
    }, 100);
  };

  const toggleDay = (dayValue) => {
    const newDays = notificationSettings.days.includes(dayValue)
      ? notificationSettings.days.filter(d => d !== dayValue)
      : [...notificationSettings.days, dayValue].sort();
    
    // Just update the state, don't save yet
    setNotificationSettings(prev => ({ ...prev, days: newDays }));
  };

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      
      // Check if notifications are enabled but permission not granted
      if (notificationSettings.enabled && notificationSettings.permission !== 'granted') {
        Alert.alert('Permission Required', 'Please enable notifications first.');
        setIsLoading(false);
        return;
      }
      
      // Save settings
      await saveSettings(notificationSettings);
      
      // Schedule notifications if enabled
      if (notificationSettings.enabled && notificationSettings.permission === 'granted') {
        await scheduleAllReminders();
        
        // Show confirmation with scheduled times
        const mealTimes = Object.entries(notificationSettings.times)
          .map(([meal, time]) => `${meal}: ${time}`)
          .join('\n');
        
        Alert.alert(
          'Reminders Scheduled!', 
          `You'll receive daily reminders at:\n\n${mealTimes}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Settings Saved', 'Reminder settings have been saved.');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscardChanges = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { 
          text: 'Discard', 
          style: 'destructive',
          onPress: () => {
            setNotificationSettings({ ...originalSettings });
            setHasUnsavedChanges(false);
          }
        },
      ]
    );
  };

  const getPermissionStatusDisplay = () => {
    switch (notificationSettings.permission) {
      case 'granted':
        return (
          <View style={styles.permissionStatus}>
            <View style={styles.permissionBadge}>
              <Text style={styles.permissionBadgeText}>Allowed</Text>
            </View>
          </View>
        );
      case 'denied':
      case 'blocked':
        return (
          <View style={styles.permissionStatus}>
            <View style={[styles.permissionBadge, styles.permissionBadgeDenied]}>
              <Text style={styles.permissionBadgeTextDenied}>Permission needed</Text>
            </View>
            <TouchableOpacity onPress={() => Linking.openSettings()}>
              <Text style={styles.settingsLink}>Enable in Settings</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  const renderTimePickerRow = (meal, label) => (
    <View key={meal} style={styles.timePickerRow}>
      <Text style={styles.timePickerLabel}>{label}</Text>
      <TouchableOpacity 
        style={styles.timePickerButton}
        onPress={() => {
          // Time picker with immediate save
          Alert.prompt(
            `Set ${label} Time`,
            'Enter time in HH:MM format (24-hour)',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Set', 
                onPress: async (time) => {
                  if (time && /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
                    const newSettings = {
                      ...notificationSettings,
                      times: { ...notificationSettings.times, [meal]: time }
                    };
                    
                    await saveSettings(newSettings);
                    
                    if (newSettings.enabled && newSettings.permission === 'granted') {
                      await scheduleAllReminders();
                      Alert.alert('Time Updated', `${label} reminder set for ${time}`);
                    }
                  } else {
                    Alert.alert('Invalid Time', 'Please enter time in HH:MM format (e.g., 08:30)');
                  }
                }
              },
            ],
            'plain-text',
            notificationSettings.times[meal]
          );
        }}
      >
        <Text style={styles.timePickerText}>{notificationSettings.times[meal]}</Text>
        <Ionicons name="chevron-forward" size={16} color="#666" />
      </TouchableOpacity>
    </View>
  );

  const renderDaysSelector = () => (
    <View style={styles.daysSection}>
      <Text style={styles.daysLabel}>Repeat on</Text>
      <View style={styles.daysContainer}>
        {DAYS_OF_WEEK.map((day) => (
          <TouchableOpacity
            key={day.value}
            style={[
              styles.dayButton,
              notificationSettings.days.includes(day.value) && styles.selectedDayButton,
            ]}
            onPress={() => toggleDay(day.value)}
          >
            <Text style={[
              styles.dayButtonText,
              notificationSettings.days.includes(day.value) && styles.selectedDayButtonText,
            ]}>
              {day.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Reminders & Notifications</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Master Toggle */}
        <View style={styles.section}>
          <View style={styles.masterToggleRow}>
            <View style={styles.masterToggleContent}>
              <Text style={styles.masterToggleTitle}>Meal reminders</Text>
              <Text style={styles.masterToggleDescription}>
                Get reminders to log Breakfast, Lunch, and Dinner.
              </Text>
            </View>
            <Switch
              value={notificationSettings.enabled}
              onValueChange={toggleMealReminders}
              trackColor={{ false: '#E5E5EA', true: '#4CAF50' }}
              thumbColor="#fff"
              disabled={isLoading}
            />
          </View>
          
          {/* Permission Status */}
          {getPermissionStatusDisplay()}
          
          {/* Permission CTA */}
          {(notificationSettings.permission === 'denied' || notificationSettings.permission === 'blocked') && (
            <TouchableOpacity 
              style={styles.enableButton}
              onPress={requestNotificationPermissions}
              disabled={isLoading}
            >
              <Text style={styles.enableButtonText}>
                {isLoading ? 'Requesting...' : 'Enable notifications'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Time Pickers - Only show if enabled and permission granted */}
        {notificationSettings.enabled && notificationSettings.permission === 'granted' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meal Times</Text>
            
            {renderTimePickerRow('breakfast', 'Breakfast')}
            {renderTimePickerRow('lunch', 'Lunch')}
            {renderTimePickerRow('dinner', 'Dinner')}
          </View>
        )}

        {/* Advanced Settings - Only show if enabled and permission granted */}
        {notificationSettings.enabled && notificationSettings.permission === 'granted' && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.advancedHeader}
              onPress={() => setShowAdvanced(!showAdvanced)}
            >
              <Text style={styles.sectionTitle}>Advanced</Text>
              <Ionicons 
                name={showAdvanced ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
            
            {showAdvanced && (
              <View style={styles.advancedContent}>
                {/* Days of Week */}
                {renderDaysSelector()}
                
                {/* Snooze */}
                <View style={styles.advancedRow}>
                  <View>
                    <Text style={styles.advancedLabel}>Snooze 10 min</Text>
                    <Text style={styles.advancedDescription}>Allow snoozing reminders</Text>
                  </View>
                  <Switch
                    value={notificationSettings.snoozeMinutes > 0}
                    onValueChange={(enabled) => {
                      setNotificationSettings(prev => ({
                        ...prev,
                        snoozeMinutes: enabled ? 10 : 0
                      }));
                    }}
                    trackColor={{ false: '#E5E5EA', true: '#4CAF50' }}
                    thumbColor="#fff"
                  />
                </View>
                
                {/* Quiet Hours */}
                <View style={styles.advancedRow}>
                  <View>
                    <Text style={styles.advancedLabel}>Quiet hours</Text>
                    <Text style={styles.advancedDescription}>
                      Don't alert between {notificationSettings.quietHours.start}–{notificationSettings.quietHours.end}
                    </Text>
                  </View>
                  <Switch
                    value={notificationSettings.quietHours.enabled}
                    onValueChange={(enabled) => {
                      setNotificationSettings(prev => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, enabled }
                      }));
                    }}
                    trackColor={{ false: '#E5E5EA', true: '#4CAF50' }}
                    thumbColor="#fff"
                  />
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Save Button - Show when there are unsaved changes */}
      {hasUnsavedChanges && (
        <View style={[styles.saveContainer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity 
            style={styles.discardButton}
            onPress={handleDiscardChanges}
          >
            <Text style={styles.discardButtonText}>Discard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSaveSettings}
            disabled={isLoading}
          >
            <Text style={[styles.saveButtonText, isLoading && styles.saveButtonTextDisabled]}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  
  // Master Toggle
  masterToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  masterToggleContent: {
    flex: 1,
    marginRight: 16,
  },
  masterToggleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  masterToggleDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  
  // Permission Status
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  permissionBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  permissionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  permissionBadgeDenied: {
    backgroundColor: '#FFEBEE',
  },
  permissionBadgeTextDenied: {
    color: '#FF3B30',
  },
  settingsLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  
  // Enable Button
  enableButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  enableButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Time Pickers
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timePickerLabel: {
    fontSize: 16,
    color: '#000',
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timePickerText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  
  // Advanced Section
  advancedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  advancedContent: {
    marginTop: 0,
  },
  advancedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  advancedLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  advancedDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  
  // Days Selector
  daysSection: {
    marginBottom: 16,
  },
  daysLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 12,
  },
  daysContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDayButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  selectedDayButtonText: {
    color: '#fff',
  },
  
  // Save Container
  saveContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 12,
  },
  discardButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    alignItems: 'center',
  },
  discardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  saveButtonTextDisabled: {
    color: '#8E8E93',
  },
});