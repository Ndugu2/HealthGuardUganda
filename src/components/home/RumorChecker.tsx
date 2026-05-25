import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { searchKnowledge, KnowledgeItem } from '../../db/Database';
import { radii, spacing, shadows } from '../../theme';
import { useAppTheme } from '../../ThemeContext';
import AnimatedCard from '../AnimatedCard';

export const RumorChecker: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<KnowledgeItem | 'not_found' | null>(null);
  const [searched, setSearched] = useState(false);

  const handleCheck = async () => {
    if (!query.trim()) return;
    setSearched(true);
    try {
      const matches = await searchKnowledge(query);
      if (matches.length > 0) {
        // Return first match
        setResult(matches[0]);
      } else {
        setResult('not_found');
      }
    } catch (e) {
      console.error('Failed to search knowledge for rumor', e);
      setResult('not_found');
    }
  };

  const handleClear = () => {
    setQuery('');
    setResult(null);
    setSearched(false);
  };

  const isLuganda = i18n.language === 'lg';

  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.neutral[100] }]}>
      <View style={styles.header}>
        <Icon source="shield-alert-outline" size={24} color="#DD6B20" />
        <Text style={[styles.title, { color: colors.neutral[900] }]}>
          {isLuganda ? 'Kebera Engeri Gye Wejjanjaba' : 'Village Rumor Checker'}
        </Text>
      </View>
      <Text style={[styles.subtitle, { color: colors.neutral[500] }]}>
        {isLuganda 
          ? 'Wandiika olufumo lwowulidde ewaka okukakasa oba ddala mazima oba lwa bulimba.' 
          : 'Type any rumor you heard in your village (e.g. "garlic", "mangoes", "witchcraft") to get an instant scientific verdict.'}
      </Text>

      <View style={[styles.searchBox, { borderColor: colors.neutral[300] }]}>
        <TextInput
          style={[styles.input, { color: colors.neutral[900] }]}
          placeholder={isLuganda ? 'Noonya olufumo...' : 'Type a rumor here...'}
          placeholderTextColor={colors.neutral[400]}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleCheck}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Icon source="close-circle" size={20} color={colors.neutral[400]} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.checkBtn, { backgroundColor: colors.primary[900] }]} onPress={handleCheck}>
          <Text style={styles.checkBtnText}>{isLuganda ? 'Kebera' : 'Verify'}</Text>
        </TouchableOpacity>
      </View>

      {searched && result !== null && (
        <AnimatedCard delay={0} style={styles.resultContainer}>
          {result === 'not_found' ? (
            <View style={[styles.resultCard, styles.uncertainCard]}>
              <View style={styles.verdictHeader}>
                <View style={[styles.verdictBadge, styles.uncertainBadge]}>
                  <Icon source="help-circle" size={16} color="#D69E2E" />
                  <Text style={[styles.verdictText, { color: '#D69E2E' }]}>UNCERTAIN / UNVERIFIED</Text>
                </View>
              </View>
              <Text style={[styles.claimText, { color: colors.neutral[900] }]}>"{query}"</Text>
              <Text style={[styles.explanation, { color: colors.neutral[700] }]}>
                {isLuganda
                  ? 'Tewali kunoonyereza kukakasiddwa ku mbeera eno mu ddwaliro lyaffe. Kwegendereza era buuza omusawo w\'ebyobulamu.'
                  : 'We could not find any official WHO or Ministry of Health guidelines verifying this specific claim. Treat this claim with high caution and consult a qualified health worker.'}
              </Text>
              <Text style={[styles.source, { color: colors.neutral[400] }]}>Source: General Precaution</Text>
            </View>
          ) : (
            <View style={[
              styles.resultCard,
              result.myth_text_en ? styles.mythCard : styles.factCard
            ]}>
              <View style={styles.verdictHeader}>
                {result.myth_text_en ? (
                  <View style={[styles.verdictBadge, styles.mythBadge]}>
                    <Icon source="close-circle" size={16} color="#C53030" />
                    <Text style={[styles.verdictText, { color: '#C53030' }]}>MYTH / INACCURATE</Text>
                  </View>
                ) : (
                  <View style={[styles.verdictBadge, styles.factBadge]}>
                    <Icon source="check-circle" size={16} color="#2F855A" />
                    <Text style={[styles.verdictText, { color: '#2F855A' }]}>FACT / ACCURATE</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.claimText, { color: colors.neutral[900] }]}>
                "{isLuganda && result.correct_text_lg ? result.correct_text_lg.substring(0, 80) + '...' : result.topic.toUpperCase()}"
              </Text>
              
              <Text style={[styles.explanation, { color: colors.neutral[700] }]}>
                {isLuganda ? result.correct_text_lg || result.correct_text_en : result.correct_text_en}
              </Text>

              {result.detailed_guidance_en && (
                <View style={[styles.guidanceBox, { backgroundColor: colors.neutral[50] }]}>
                  <Text style={[styles.guidanceTitle, { color: colors.neutral[800] }]}>Official MOH Guidelines:</Text>
                  <Text style={[styles.guidanceText, { color: colors.neutral[600] }]}>
                    {isLuganda ? result.detailed_guidance_lg || result.detailed_guidance_en : result.detailed_guidance_en}
                  </Text>
                </View>
              )}

              <Text style={[styles.source, { color: colors.neutral[500] }]}>Source: {result.source}</Text>
            </View>
          )}
        </AnimatedCard>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingLeft: spacing.md,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 15,
  },
  clearBtn: {
    padding: spacing.sm,
  },
  checkBtn: {
    paddingHorizontal: 20,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
  },
  resultContainer: {
    marginTop: spacing.md,
  },
  resultCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
  },
  verdictHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  verdictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  verdictText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  mythBadge: {
    backgroundColor: '#FFF5F5',
  },
  factBadge: {
    backgroundColor: '#F0FFF4',
  },
  uncertainBadge: {
    backgroundColor: '#FFFFF0',
  },
  mythCard: {
    borderColor: '#FEB2B2',
    backgroundColor: '#FFF5F5',
  },
  factCard: {
    borderColor: '#C6F6D5',
    backgroundColor: '#F0FFF4',
  },
  uncertainCard: {
    borderColor: '#FEFCBF',
    backgroundColor: '#FFFFF0',
  },
  claimText: {
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  explanation: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  guidanceBox: {
    padding: spacing.sm,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
  },
  guidanceTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  guidanceText: {
    fontSize: 12,
    lineHeight: 18,
  },
  source: {
    fontSize: 11,
    fontWeight: '600',
  },
});
