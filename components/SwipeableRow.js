import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

export default function SwipeableRow({ children, onDelete, itemName }) {
  const renderRightAction = (text, color, x, progress, onPress) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [x, 0],
    });
    
    const pressHandler = () => {
      onPress && onPress();
    };

    return (
      <Animated.View style={{ flex: 1, transform: [{ translateX: trans }] }}>
        <TouchableOpacity
          style={[styles.rightAction, { backgroundColor: color, transform: [{ translateY: -4 }] }]}
          onPress={pressHandler}
        >
          <Text style={styles.deleteText}>{text}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderRightActions = (progress) => (
    <View style={styles.rightActionsContainer}>
      {renderRightAction('Delete', '#DC3545', 100, progress, onDelete)}
    </View>
  );

  return (
    <Swipeable renderRightActions={renderRightActions}>
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  rightActionsContainer: {
    alignItems: 'stretch',
    justifyContent: 'center',
    width: 100,
    paddingLeft: 8,
  },
  rightAction: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 56,
    borderRadius: 8,
    marginVertical: 4,
  },
  deleteText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});