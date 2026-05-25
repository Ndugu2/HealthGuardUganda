import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppTheme } from '../ThemeContext';
import FAQBot from '../components/FAQBot';

export default function FAQScreen() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FAQBot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
