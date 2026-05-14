import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { colors, spacing } from '../theme';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
}

/**
 * Empty-state placeholder with icon, title, and subtitle.
 * Used in Knowledge (no results) and Reports (no encounters).
 */
const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Icon source={icon} size={48} color={colors.neutral[400]} />
      </View>
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      {subtitle && (
        <Text variant="bodyMedium" style={styles.subtitle}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.neutral[700],
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default EmptyState;
