import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-paper';
import { colors, spacing, radii } from '../theme';

interface PortalHeaderProps {
  portal: {
    badgeBg: string;
    badgeText: string;
    badgeLabel: string;
    title: string;
    subtitle: string;
  };
}

const PortalHeader: React.FC<PortalHeaderProps> = ({ portal }) => (
  <View style={styles.header}>
    <Image
      source={require('../../assets/landing_hero.png')}
      style={{ width: 64, height: 64, borderRadius: 32, marginBottom: 16, resizeMode: 'cover' }}
    />
    <View style={[styles.badge, { backgroundColor: portal.badgeBg }]}> 
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: portal.badgeText, marginRight: 6 }} />
      <Text style={[styles.badgeText, { color: portal.badgeText }]}>{portal.badgeLabel}</Text>
    </View>
    <Text style={[styles.title, { color: colors.neutral[900] }]}>{portal.title}</Text>
    <Text style={[styles.subtitle, { color: colors.neutral[500] }]}>{portal.subtitle}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default PortalHeader;
