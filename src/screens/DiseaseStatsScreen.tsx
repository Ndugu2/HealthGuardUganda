// src/screens/DiseaseStatsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getDiseaseStats, DiseaseStat } from '../db/diseaseStats';
import { useAppTheme } from '../ThemeContext';

const DiseaseStatsScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const [stats, setStats] = useState<DiseaseStat[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await getDiseaseStats();
      setStats(data);
    };
    load();
  }, []);

  const renderItem = ({ item }: { item: DiseaseStat }) => (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.primary[900] }]}>{item.title}</Text>
      <Text style={[styles.desc, { color: colors.neutral[800] }]}>{item.description}</Text>
      <Text style={[styles.date, { color: colors.neutral[600] }]}>{new Date(item.reportedAt).toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={stats}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  list: { paddingBottom: 80 },
  card: { borderRadius: 12, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  title: { fontSize: 16, fontWeight: '700' },
  desc: { fontSize: 14, marginTop: 4 },
  date: { fontSize: 12, marginTop: 6, textAlign: 'right' },
});

export default DiseaseStatsScreen;
