import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing } from '../theme';

interface ConfidenceBarProps {
  confidence: number;
  color: string;
  label?: string;
}

/**
 * Animated confidence bar with smooth width transition on mount.
 * Used in AnalyzeScreen to show classification confidence.
 */
const ConfidenceBar: React.FC<ConfidenceBarProps> = ({ confidence, color, label }) => {
  const pct = Math.round(confidence * 100);
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: confidence,
      duration: 800,
      delay: 200,
      useNativeDriver: false,
    }).start();
  }, [confidence, widthAnim]);

  const animatedWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        {label && <Text variant="labelSmall" style={styles.label}>{label}</Text>}
        <Text variant="labelSmall" style={[styles.pct, { color }]}>{pct}%</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: animatedWidth,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    color: colors.neutral[600],
  },
  pct: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.neutral[200],
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
});

export default ConfidenceBar;
