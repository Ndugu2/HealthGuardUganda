import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { useAppTheme } from '../ThemeContext';

// Placeholder data – in a real app this would come from a DB or API
const upcomingVaccinations = [
  { id: '1', name: 'Polio', date: '2024-09-15' },
  { id: '2', name: 'Measles', date: '2024-10-02' },
  { id: '3', name: 'COVID‑19 Booster', date: '2025-01-20' },
];

export default function VaccinationScreen() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {upcomingVaccinations.map(v => (
        <Card key={v.id} style={[styles.card, { backgroundColor: colors.surface + '33' }]}> 
          <Card.Content>
            <Title>{v.name}</Title>
            <Paragraph>Scheduled for {v.date}</Paragraph>
          </Card.Content>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { marginBottom: 12, borderRadius: 12, elevation: 4 },
});
