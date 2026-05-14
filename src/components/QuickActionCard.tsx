import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { colors, spacing, radii, shadows } from '../theme';

interface QuickActionCardProps {
  icon: string;
  title: string;
  description: string;
  accentColor: string;
  onPress: () => void;
}

/**
 * Tappable action card with icon, title, description.
 * Features a spring-based press-in animation for tactile feedback.
 */
const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon,
  title,
  description,
  accentColor,
  onPress,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <View style={[styles.iconWrap, { backgroundColor: accentColor + '18' }]}>
          <Icon source={icon} size={28} color={accentColor} />
        </View>
        <View style={styles.textWrap}>
          <Text variant="titleSmall" style={styles.title}>{title}</Text>
          <Text variant="bodySmall" style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        </View>
        <Icon source="chevron-right" size={22} color={colors.neutral[400]} />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadows.md,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textWrap: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    color: colors.neutral[900],
    fontWeight: '700',
  },
  description: {
    color: colors.neutral[600],
    marginTop: 2,
    lineHeight: 18,
  },
});

export default QuickActionCard;
