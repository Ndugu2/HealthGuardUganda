import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { useAppTheme } from '../ThemeContext';
import { getAllDrugs } from '../db/drugCache';

export default function DrugInfoScreen() {
  const { colors } = useAppTheme();
  const [drugs, setDrugs] = useState<Array<{ id: number; name: string; description: string }>>([]);

  useEffect(() => {
    (async () => {
      const list = await getAllDrugs();
      setDrugs(list);
    })();
  }, []);

  const renderItem = ({ item }: { item: { id: number; name: string; description: string } }) => (
    <Card style={[styles.card, { backgroundColor: colors.surface + '33', borderColor: colors.primary[200] }]}>
      <Card.Content>
        <Title>{item.name}</Title>
        <Paragraph>{item.description}</Paragraph>
      </Card.Content>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <FlatList
        data={drugs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={{ color: colors.neutral[400] }}>No drug data available.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  list: {
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    elevation: 4,
  },
});
