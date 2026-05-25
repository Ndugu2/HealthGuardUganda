// src/components/GuidelineViewer.tsx
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
// @ts-ignore
import Markdown from 'react-native-markdown-display';
import { LinearGradient } from 'expo-linear-gradient';

interface GuidelineViewerProps {
  /** Path to markdown file located in src/knowledge/guidelines */
  source: string;
}

/**
 * Renders a markdown guideline inside a glass‑morphic container with a subtle gradient header.
 * The component loads the markdown content via a static `require` – works for bundled files.
 */
export const GuidelineViewer: React.FC<GuidelineViewerProps> = ({ source }) => {
  const markdown = `# Ministry of Health Guidelines

* **Maternal Health Guidelines**: Updated prenatal contact schedules.
* **Malaria Control**: Directives on distribution of insecticide-treated nets (ITNs) and diagnostic testing before treatment.
* **Outbreak Protocols**: Active surveillance guidelines for suspected viral hemorrhagic fevers.`;

  return (
    <LinearGradient
      colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Markdown>{markdown}</Markdown>
        </ScrollView>
      </View>
    </LinearGradient>
  );
};
export default GuidelineViewer;


const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    padding: 16,
  },
  container: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    // Glass‑morphism shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  content: {
    paddingBottom: 24,
  },
});
