/**
 * iOS-style Date Picker Modal Component
 * Mimics the native iOS date picker with scrollable month/day/year wheels
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height: screenHeight } = Dimensions.get('window');

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

export default function DatePickerModal({ 
  visible, 
  onClose, 
  selectedDate, 
  onDateSelect 
}) {
  const [currentDate, setCurrentDate] = useState(new Date(selectedDate));
  const [tempDate, setTempDate] = useState(new Date(selectedDate));
  
  const monthScrollRef = useRef(null);
  const dayScrollRef = useRef(null);
  const yearScrollRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setTempDate(new Date(selectedDate));
      // Small delay to ensure refs are ready
      setTimeout(() => {
        scrollToInitialPositions();
      }, 100);
    }
  }, [visible, selectedDate]);

  const scrollToInitialPositions = () => {
    const date = new Date(selectedDate);
    const month = date.getMonth();
    const day = date.getDate() - 1; // 0-indexed
    const year = date.getFullYear();
    
    // Scroll to current values
    monthScrollRef.current?.scrollTo({
      y: month * ITEM_HEIGHT,
      animated: false
    });
    
    dayScrollRef.current?.scrollTo({
      y: day * ITEM_HEIGHT,
      animated: false
    });
    
    const yearIndex = getYearOptions().findIndex(y => y === year);
    if (yearIndex >= 0) {
      yearScrollRef.current?.scrollTo({
        y: yearIndex * ITEM_HEIGHT,
        animated: false
      });
    }
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 10; i--) {
      years.push(i);
    }
    return years;
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getDayOptions = () => {
    const daysInMonth = getDaysInMonth(tempDate.getMonth(), tempDate.getFullYear());
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const handleScroll = (scrollRef, options, setValue, type) => {
    return (event) => {
      const y = event.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, options.length - 1));
      
      if (type === 'month') {
        const newDate = new Date(tempDate);
        newDate.setMonth(options[clampedIndex]);
        // Adjust day if it doesn't exist in new month
        const daysInNewMonth = getDaysInMonth(options[clampedIndex], newDate.getFullYear());
        if (newDate.getDate() > daysInNewMonth) {
          newDate.setDate(daysInNewMonth);
        }
        setTempDate(newDate);
      } else if (type === 'day') {
        const newDate = new Date(tempDate);
        newDate.setDate(options[clampedIndex]);
        setTempDate(newDate);
      } else if (type === 'year') {
        const newDate = new Date(tempDate);
        newDate.setFullYear(options[clampedIndex]);
        setTempDate(newDate);
      }
    };
  };

  const handleDone = () => {
    // Don't allow future dates
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (tempDate > today) {
      return;
    }
    
    const dateString = tempDate.toISOString().split('T')[0];
    onDateSelect(dateString);
    onClose();
  };

  const isToday = () => {
    const today = new Date();
    return tempDate.toDateString() === today.toDateString();
  };

  const isFutureDate = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return tempDate > today;
  };

  const renderPickerColumn = (options, selectedValue, scrollRef, type, formatter = (item) => item) => {
    const selectedIndex = options.findIndex(option => option === selectedValue);
    
    return (
      <View style={styles.pickerColumn}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={handleScroll(scrollRef, options, null, type)}
          contentContainerStyle={{
            paddingVertical: PICKER_HEIGHT / 2 - ITEM_HEIGHT / 2
          }}
        >
          {options.map((option, index) => {
            const isSelected = index === selectedIndex;
            const isFuture = type === 'day' && 
              new Date(tempDate.getFullYear(), tempDate.getMonth(), option) > new Date();
            
            return (
              <View key={index} style={styles.pickerItem}>
                <Text style={[
                  styles.pickerItemText,
                  isSelected && styles.selectedPickerItemText,
                  isFuture && styles.futurePickerItemText
                ]}>
                  {formatter(option)}
                </Text>
              </View>
            );
          })}
        </ScrollView>
        
        {/* Selection indicator */}
        <View style={styles.selectionIndicator} />
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.datePickerModal}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Change Date</Text>
            
            <TouchableOpacity 
              onPress={handleDone} 
              style={[
                styles.headerButton,
                isFutureDate() && styles.disabledButton
              ]}
              disabled={isFutureDate()}
            >
              <Ionicons 
                name="checkmark" 
                size={28} 
                color={isFutureDate() ? "#C7C7CC" : "#4CAF50"} 
              />
            </TouchableOpacity>
          </View>

          {/* Today Button */}
          {!isToday() && (
            <View style={styles.todaySection}>
              <TouchableOpacity 
                style={styles.todayButton}
                onPress={() => {
                  const today = new Date();
                  setTempDate(today);
                  setTimeout(scrollToInitialPositions, 50);
                }}
              >
                <Text style={styles.todayButtonText}>Today</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Date Picker Wheels */}
          <View style={styles.pickerContainer}>
            {/* Month Picker */}
            {renderPickerColumn(
              MONTHS.map((_, index) => index),
              tempDate.getMonth(),
              monthScrollRef,
              'month',
              (monthIndex) => MONTHS[monthIndex]
            )}
            
            {/* Day Picker */}
            {renderPickerColumn(
              getDayOptions(),
              tempDate.getDate(),
              dayScrollRef,
              'day'
            )}
            
            {/* Year Picker */}
            {renderPickerColumn(
              getYearOptions(),
              tempDate.getFullYear(),
              yearScrollRef,
              'year'
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  datePickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area for home indicator
    maxHeight: screenHeight * 0.6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  headerButton: {
    padding: 4,
    minWidth: 44,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.3,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  todaySection: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  todayButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  todayButtonText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '400',
  },
  pickerContainer: {
    flexDirection: 'row',
    height: PICKER_HEIGHT,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  pickerColumn: {
    flex: 1,
    position: 'relative',
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: 22,
    color: '#C7C7CC',
    fontWeight: '400',
  },
  selectedPickerItemText: {
    color: '#000',
    fontWeight: '400',
  },
  futurePickerItemText: {
    color: '#E5E5EA',
  },
  selectionIndicator: {
    position: 'absolute',
    top: PICKER_HEIGHT / 2 - ITEM_HEIGHT / 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#C6C6C8',
    pointerEvents: 'none',
  },
});