import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { colors } from '../theme';

type BadgeVariant = 'accurate' | 'inaccurate' | 'uncertain';

interface StatusBadgeProps {
  variant: BadgeVariant;
  label: string;
  compact?: boolean;
}

const VARIANT_CONFIG: Record<BadgeVariant, { bg: string; text: string; icon: string }> = {
  accurate:   { bg: colors.primary[50],  text: colors.primary[800], icon: 'check-circle' },
  inaccurate: { bg: colors.danger[50],   text: colors.danger[900],  icon: 'alert-circle' },
  uncertain:  { bg: colors.warning[50],  text: colors.warning[900], icon: 'help-circle' },
};

/**
 * Color-coded status badge with icon for classification results.
 * Used across AnalyzeScreen and ReportsScreen.
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({ variant, label, compact }) => {
  const config = VARIANT_CONFIG[variant];

  return (
    <View style={[
      styles.badge,
      { backgroundColor: config.bg },
      compact && styles.compact,
    ]}>
      <Icon source={config.icon} size={compact ? 14 : 18} color={config.text} />
      <Text style={[
        styles.text,
        { color: config.text },
        compact && styles.compactText,
      ]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  compact: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    gap: 4,
  },
  text: {
    fontWeight: '700',
    fontSize: 14,
  },
  compactText: {
    fontSize: 11,
  },
});

export default StatusBadge;
