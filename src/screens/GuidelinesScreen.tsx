import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GuidelineViewer } from '../components/GuidelineViewer';
import { useAppTheme } from '../ThemeContext';

// Relative path to the markdown file (GuidelineViewer will require it internally)
const markdownPath = 'assets/guidelines/GeneralGuidelines.md';

export default function GuidelinesScreen() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GuidelineViewer source={markdownPath} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
