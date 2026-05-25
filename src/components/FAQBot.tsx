import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, IconButton, Card, Text } from 'react-native-paper';
import { useAppTheme } from '../ThemeContext';
import { fetchFAQs } from '../api/faq'; // assumes an API returning list of {question, answer}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

/**
 * FAQBot – a simple chat‑like interface that lets users search FAQs.
 * It fetches a list of FAQs from the backend and filters them as the user types.
 * The UI uses glass‑morphism effects consistent with the rest of the app.
 */
const FAQBot: React.FC = () => {
  const { colors } = useAppTheme();
  const [query, setQuery] = useState('');
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [filtered, setFiltered] = useState<FAQItem[]>([]);

  // Load FAQs once on mount
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchFAQs();
        setFaqs(data);
        setFiltered(data);
      } catch (e) {
        console.error('Failed to load FAQs', e);
      }
    };
    load();
  }, []);

  // Filter as query changes
  const filterFAQs = useCallback(() => {
    if (!query.trim()) {
      setFiltered(faqs);
      return;
    }
    const lower = query.toLowerCase();
    const hits = faqs.filter(f =>
      f.question.toLowerCase().includes(lower) || f.answer.toLowerCase().includes(lower)
    );
    setFiltered(hits);
  }, [query, faqs]);

  useEffect(() => {
    filterFAQs();
  }, [query, filterFAQs]);

  const renderItem = ({ item }: { item: FAQItem }) => (
    <Card style={[styles.card, { backgroundColor: colors.surface + '33' /* glass effect */ }]}> 
      <Card.Content>
        <Text variant="titleMedium" style={{ color: colors.primary[900] }}>{item.question}</Text>
        <Text variant="bodyMedium" style={{ marginTop: 4, color: colors.neutral[800] }}>{item.answer}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search FAQs…"
          value={query}
          onChangeText={setQuery}
          left={<TextInput.Icon icon="magnify" />}
          style={styles.searchInput}
        />
        <IconButton icon="close" onPress={() => setQuery('')} disabled={!query} />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'transparent',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
  },
  list: {
    paddingBottom: 80,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
    // glass‑morphism core – semi‑transparent backdrop
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default FAQBot;
