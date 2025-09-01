/**
 * Macro Progress Bar Component - Shows daily macro progress
 * 
 * Purpose: Display current macro intake vs daily targets with visual progress
 * Features: Color-coded bars, percentage display, gram amounts
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MacroProgressBar({ 
  label, 
  current, 
  target, 
  color = '#4CAF50',
  unit = 'g' 
}) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const isOver = current > target;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[
          styles.values,
          isOver && styles.valuesOver
        ]}>
          {Math.round(current)}{unit} / {Math.round(target)}{unit}
        </Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View 
            style={[
              styles.progressBar,
              { 
                width: `${percentage}%`,
                backgroundColor: isOver ? '#FF3B30' : color
              }
            ]} 
          />
        </View>
        <Text style={[
          styles.percentage,
          isOver && styles.percentageOver
        ]}>
          {Math.round(percentage)}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  values: {
    fontSize: 14,
    color: '#666',
  },
  valuesOver: {
    color: '#FF3B30',
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  percentage: {
    fontSize: 12,
    color: '#666',
    minWidth: 32,
    textAlign: 'right',
  },
  percentageOver: {
    color: '#FF3B30',
    fontWeight: '500',
  },
});