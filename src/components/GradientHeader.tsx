import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing } from '../theme';

interface GradientHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  /** Extra content rendered below the subtitle (e.g. an offline badge) */
  children?: React.ReactNode;
}

/**
 * Premium gradient header bar used at the top of every screen.
 * Provides visual consistency and a polished "hero" feel.
 */
const GradientHeader: React.FC<GradientHeaderProps> = ({
  title,
  subtitle,
  icon,
  children,
}) => {
  return (
    <LinearGradient
      colors={gradients.primary as unknown as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.content}>
        {icon && (
          <View style={styles.iconWrap}>
            <Icon source={icon} size={32} color="rgba(255,255,255,0.9)" />
          </View>
        )}
        <Text variant="headlineMedium" style={styles.title}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="bodyMedium" style={styles.subtitle}>
            {subtitle}
          </Text>
        )}
        {children}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    paddingTop: 52,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  content: {
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.neutral[0],
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default GradientHeader;
