import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, useWindowDimensions, ScrollView } from 'react-native';
import { Text, Searchbar, Chip, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { searchKnowledge, KnowledgeItem } from '../db/Database';
import AnimatedCard from '../components/AnimatedCard';
import EmptyState from '../components/EmptyState';
import { colors, spacing, radii, shadows, topicColors } from '../theme';
import { useAppTheme } from '../ThemeContext';

const TOPIC_FILTERS = [
  { key: 'all',          i18nKey: 'knowledge.all' },
  { key: 'vaccination',  i18nKey: 'knowledge.filter_vaccination' },
  { key: 'malaria',      i18nKey: 'knowledge.filter_malaria' },
  { key: 'hiv',          i18nKey: 'knowledge.filter_hiv' },
  { key: 'maternal',     i18nKey: 'knowledge.filter_maternal' },
  { key: 'covid',        i18nKey: 'knowledge.filter_covid' },
  { key: 'nutrition',    i18nKey: 'knowledge.filter_nutrition' },
  { key: 'sanitation',   i18nKey: 'knowledge.filter_sanitation' },
  { key: 'stds',         i18nKey: 'knowledge.filter_stds' },
];

const KnowledgeScreen = () => {
  const { t, i18n } = useTranslation();
  const { colors, mode } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 800;

  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [topic, setTopic] = useState('all');

  const [recentSearches, setRecentSearches] = useState<string[]>(['Malaria nets', 'COVID vaccine', 'HIV ARV']);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<'browse' | 'training'>('browse');

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);

  const QUIZZES = [
    {
      question: "A patient tells you that drinking hot water kills the coronavirus. How do you respond?",
      question_lg: "Omulwadde akugamba nti okunywa amazzi agookya kitta akawuka ka corona. Omuddamu otya?",
      options: [
        "Agree, heat is known to kill viruses.",
        "Correct them: High temperatures don't kill the virus inside the body and can cause burns.",
        "Suggest drinking tea instead."
      ],
      options_lg: [
        "Kirize, ebbugumu kifuula akawuka akagezi.",
        "Mukakase: Ebbugumu eringi teritta kawuka munda mu mubiri era kiyinza okwokya munda.",
        "Mugambe anywe caayi mu kifo ky'amazzi."
      ],
      correct: 1,
      explanation: "COVID-19 is a respiratory virus. Drinking hot liquids does not reach the lungs where the virus replicates and can lead to internal scalding.",
      explanation_lg: "COVID-19 kawuka k'omu mawuggwe. Okunywa ebyokulya ebyokya tekutuuka mu mawuggwe gye kawangaalira era kiyinza okwosa munda."
    },
    {
      question: "Which of the following is true about malaria transmission?",
      question_lg: "Kiki ku bino ekituufu ku ngeri malaria gye nsaasaanyizibwamu?",
      options: [
        "It is caused by eating too many ripe mangoes.",
        "It is caused by drinking dirty stagnant water.",
        "It is transmitted solely through the bite of an infected female Anopheles mosquito."
      ],
      options_lg: [
        "Kiva mu kulya emmiyembe emingi emigiire.",
        "Kiva mu kunywa amazzi amacaafu agali awamu.",
        "Kisaasaanyizibwa nnyo mu kulumwa kw'ensiri ey'ekika kya female Anopheles."
      ],
      correct: 2,
      explanation: "Malaria is a blood-borne parasite. While mangoes and water are health concerns, they do not cause malaria.",
      explanation_lg: "Malaria kireetebwa kanywa akali mu musaayi. Wadde emmiyembe n'amazzi amacaafu si birungi ku bulamu, tebireeta malaria."
    },
    {
      question: "A mother is worried that the polio vaccine will make her daughter infertile later in life. What is the MoH guidance?",
      question_lg: "Maama yeeraliikirivu nti enkingo ya polio ejja kufuula muwala we omugumba mu maaso. Kiki Minisitule ky'egamba?",
      options: [
        "Tell her it's a risk but the vaccine is needed anyway.",
        "Explain that vaccines are rigorously tested and have no effect on reproductive health.",
        "Suggest she waits until the child is older."
      ],
      options_lg: [
        "Mugambe nti kabonero ka bulabe naye ekingo kyetaagisa.",
        "Munnyonnyole nti enkingo zikebereddwa nnyo era tezirina buzibu ku kuzaala.",
        "Mugambe alinde mwana akulemu."
      ],
      correct: 1,
      explanation: "This is a common myth. There is no biological mechanism for vaccines to affect fertility.",
      explanation_lg: "Luno lufumo lumanyiddwa nnyo. Tewali ngeri nkingo gye ziyinza kukosa kizaala."
    }
  ];

  const loadData = useCallback(async () => {
    const results = await searchKnowledge(searchQuery);
    setItems(results);
  }, [searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  };

  const submitSearch = () => {
    if (searchQuery.trim().length > 1) {
      setRecentSearches(prev => {
        const filtered = prev.filter(s => s.toLowerCase() !== searchQuery.toLowerCase());
        return [searchQuery, ...filtered].slice(0, 5);
      });
    }
  };

  const handleTopicChange = (newTopic: string) => {
    setTopic(newTopic);
  };

  const filteredItems = topic === 'all' ? items : items.filter(i => i.topic === topic);

  const renderItem = ({ item, index }: { item: KnowledgeItem; index: number }) => {
    const tc = topicColors[item.topic] || topicColors.general;

    return (
      <AnimatedCard delay={index * 30} style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.neutral[100] }, isDesktop ? styles.desktopItemCard : ({} as any)]}>
        <View style={styles.itemHeader}>
           <View style={[styles.topicBadge, { backgroundColor: mode === 'light' ? tc.bg : tc.accent + '30' }]}>
             <Text style={[styles.topicText, { color: mode === 'light' ? tc.text : tc.accent }]}>{item.topic.toUpperCase()}</Text>
           </View>
           <Text style={[styles.sourceLabel, { color: colors.neutral[500] }]}>{item.source}</Text>
        </View>
        
        {item.myth_text_en ? (
          <View style={[styles.mythBox, { backgroundColor: mode === 'light' ? '#FDECEA' : colors.danger[900] + '20' }]}>
            <Text style={[styles.mythLabel, { color: colors.danger[900] }]}>MYTH</Text>
            <Text style={[styles.mythText, { color: colors.danger[900] }]}>"{item.myth_text_en}"</Text>
          </View>
        ) : null}

        <Text style={[styles.correctText, { color: colors.neutral[800] }]}>
          {i18n.language === 'lg' ? item.correct_text_lg || item.correct_text_en : item.correct_text_en}
        </Text>

        <View style={[styles.itemFooter, { borderTopColor: colors.neutral[50] }]}>
           <TouchableOpacity style={styles.actionBtn}>
             <Icon source="share-variant-outline" size={18} color={colors.neutral[500]} />
           </TouchableOpacity>
           <TouchableOpacity style={styles.actionBtn}>
             <Icon source="bookmark-outline" size={18} color={colors.neutral[500]} />
           </TouchableOpacity>
        </View>
      </AnimatedCard>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {!isDesktop && (
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.neutral[100] }]}>
          <Text style={[styles.headerTitle, { color: colors.primary[900] }]}>
            {viewMode === 'browse' ? t('knowledge.title') : t('knowledge.training_quizzes')}
          </Text>
          <View style={[styles.offlinePill, { backgroundColor: mode === 'light' ? '#E2F0D9' : colors.neutral[100] }]}>
            <Icon source="cloud-check-outline" size={14} color={colors.primary[800]} />
            <Text style={[styles.offlineText, { color: colors.primary[900] }]}>{t('home.offline_ready')}</Text>
          </View>
        </View>
      )}

      <View style={[styles.modeSelector, { backgroundColor: colors.surface }]}>
         <TouchableOpacity 
           onPress={() => setViewMode('browse')} 
           style={[styles.modeBtn, viewMode === 'browse' && { borderBottomColor: colors.primary[900] }]}
         >
            <Text style={[styles.modeBtnText, { color: viewMode === 'browse' ? colors.primary[900] : colors.neutral[400] }]}>{t('knowledge.browse_facts')}</Text>
         </TouchableOpacity>
         <TouchableOpacity 
           onPress={() => setViewMode('training')} 
           style={[styles.modeBtn, viewMode === 'training' && { borderBottomColor: colors.primary[900] }]}
         >
            <Text style={[styles.modeBtnText, { color: viewMode === 'training' ? colors.primary[900] : colors.neutral[400] }]}>{t('knowledge.training_mode')}</Text>
         </TouchableOpacity>
      </View>

      {viewMode === 'browse' ? (
        <>
          <View style={[styles.searchSection, { backgroundColor: colors.surface, borderBottomColor: colors.neutral[100] }]}>
            <View style={isDesktop ? styles.desktopSearchWrap : null}>
              <Searchbar
                placeholder={t('knowledge.search') || 'Search health topics...'}
                onChangeText={handleSearch}
                onSubmitEditing={submitSearch}
                value={searchQuery}
                style={[styles.searchBar, { backgroundColor: colors.neutral[100] }]}
                inputStyle={[styles.searchInput, { color: colors.neutral[900] }]}
                iconColor={colors.primary[800]}
                placeholderTextColor={colors.neutral[400]}
                elevation={0}
              />
              
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={TOPIC_FILTERS}
                keyExtractor={(item) => item.key}
                style={styles.chipList}
                contentContainerStyle={styles.chipListContent}
                renderItem={({ item: filter }) => {
                  const isSelected = topic === filter.key;
                  return (
                    <Chip
                      selected={isSelected}
                      onPress={() => handleTopicChange(filter.key)}
                      style={[
                        styles.chip, 
                        { backgroundColor: colors.neutral[100] },
                        isSelected && { backgroundColor: colors.primary[900] }
                      ]}
                      textStyle={[
                        styles.chipText, 
                        { color: colors.neutral[600] },
                        isSelected && { color: '#FFF' }
                      ]}
                      showSelectedCheck={false}
                    >
                      {t(filter.i18nKey)}
                    </Chip>
                  );
                }}
              />
            </View>
          </View>

          {searchQuery.length === 0 && (
             <View style={styles.historySection}>
                <View style={styles.historyHeader}>
                   <Text style={[styles.historyTitle, { color: colors.neutral[500] }]}>{t('knowledge.recent_searches')}</Text>
                   <TouchableOpacity onPress={() => setRecentSearches([])}>
                      <Text style={[styles.clearText, { color: colors.primary[900] }]}>{t('knowledge.clear_all')}</Text>
                   </TouchableOpacity>
                </View>
                <View style={styles.historyList}>
                   {recentSearches.map((s, i) => (
                      <TouchableOpacity key={i} style={[styles.historyItem, { backgroundColor: colors.neutral[50] }]} onPress={() => setSearchQuery(s)}>
                         <Icon source="history" size={16} color={colors.neutral[400]} />
                         <Text style={[styles.historyItemText, { color: colors.neutral[700] }]}>{s}</Text>
                      </TouchableOpacity>
                   ))}
                </View>
             </View>
          )}

          <FlatList
            data={filteredItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={isDesktop ? 2 : 1}
            key={isDesktop ? 'desktop' : 'mobile'}
            contentContainerStyle={[styles.listContent, isDesktop && styles.desktopListContent]}
            ListEmptyComponent={
              <EmptyState
                icon="text-search"
                title={t('knowledge.empty')}
                subtitle={t('knowledge.empty_subtitle')}
              />
            }
          />
        </>
      ) : (
        <ScrollView contentContainerStyle={[styles.trainingContainer, isDesktop && styles.desktopTrainingContainer]}>
            <View style={[styles.quizCard, { backgroundColor: colors.surface }]}>
              <View style={styles.quizHeader}>
                 <Text style={[styles.quizStep, { color: colors.primary[600] }]}>{t('knowledge.scenario', { current: quizIndex + 1, total: QUIZZES.length })}</Text>
                 <View style={[styles.scoreBadge, { backgroundColor: colors.primary[100] }]}>
                    <Text style={[styles.scoreText, { color: colors.primary[900] }]}>{t('knowledge.score', { score })}</Text>
                 </View>
              </View>
              
              <Text style={[styles.questionText, { color: colors.neutral[900] }]}>{i18n.language === 'lg' ? QUIZZES[quizIndex].question_lg || QUIZZES[quizIndex].question : QUIZZES[quizIndex].question}</Text>
              
              <View style={styles.optionsList}>
                 {QUIZZES[quizIndex].options.map((option, idx) => {
                    const isCorrect = idx === QUIZZES[quizIndex].correct;
                    const isSelected = showAnswer && idx === QUIZZES[quizIndex].correct;
                    const optionText = i18n.language === 'lg' ? (QUIZZES[quizIndex] as any).options_lg?.[idx] || option : option;
                    return (
                       <TouchableOpacity 
                         key={idx} 
                         disabled={showAnswer}
                         onPress={() => {
                            if (idx === QUIZZES[quizIndex].correct) setScore(s => s + 10);
                            setShowAnswer(true);
                         }}
                         style={[
                           styles.optionBtn, 
                           { borderColor: colors.neutral[200] },
                           showAnswer && isCorrect && { borderColor: colors.primary[600], backgroundColor: '#E2F0D9' },
                           showAnswer && !isCorrect && { opacity: 0.5 }
                         ]}
                       >
                          <View style={[styles.optionDot, showAnswer && isCorrect && { backgroundColor: colors.primary[600] }]} />
                          <Text style={[styles.optionText, { color: colors.neutral[800] }]}>{optionText}</Text>
                       </TouchableOpacity>
                    );
                 })}
              </View>
              
              {showAnswer && (
                  <AnimatedCard style={[styles.explanationBox, { backgroundColor: colors.neutral[50] }]}>
                    <View style={styles.explanationHeader}>
                       <Icon source="information-variant" size={20} color={colors.primary[900]} />
                       <Text style={[styles.explanationTitle, { color: colors.primary[900] }]}>{t('knowledge.scientific_explanation')}</Text>
                    </View>
                    <Text style={[styles.explanationText, { color: colors.neutral[700] }]}>
                       {i18n.language === 'lg' ? QUIZZES[quizIndex].explanation_lg || QUIZZES[quizIndex].explanation : QUIZZES[quizIndex].explanation}
                    </Text>
                    
                    <TouchableOpacity 
                      style={[styles.nextBtn, { backgroundColor: colors.primary[900] }]}
                      onPress={() => {
                         setShowAnswer(false);
                         if (quizIndex < QUIZZES.length - 1) {
                            setQuizIndex(quizIndex + 1);
                         } else {
                            setQuizIndex(0);
                            setScore(0);
                         }
                      }}
                    >
                       <Text style={styles.nextBtnText}>{quizIndex < QUIZZES.length - 1 ? t('knowledge.next_scenario') : t('knowledge.restart_practice')}</Text>
                       <Icon source="arrow-right" size={20} color="#FFF" />
                    </TouchableOpacity>
                 </AnimatedCard>
              )}
           </View>
           
           <View style={[styles.practiceTip, { backgroundColor: mode === 'light' ? '#FEEBC8' : colors.neutral[100] }]}>
              <Icon source="trophy-outline" size={24} color={colors.warning[900]} />
              <View style={styles.tipBody}>
                 <Text style={[styles.tipTitle, { color: colors.warning[900] }]}>{t('knowledge.training_goal')}</Text>
                 <Text style={[styles.tipText, { color: colors.neutral[700] }]}>{t('knowledge.training_goal_text')}</Text>
              </View>
           </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary[900],
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E2F0D9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  offlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[900],
  },
  searchSection: {
    padding: spacing.md,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  desktopSearchWrap: {
    width: '100%',
    paddingHorizontal: '5%',
    paddingVertical: spacing.md,
  },
  searchBar: {
    borderRadius: radii.md,
    backgroundColor: colors.neutral[100],
    marginBottom: spacing.md,
  },
  searchInput: {
    fontSize: 15,
  },
  chipList: {
    marginBottom: spacing.xs,
  },
  chipListContent: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  chip: {
    backgroundColor: colors.neutral[100],
    borderRadius: radii.full,
    borderWidth: 0,
  },
  chipActive: {
    backgroundColor: colors.primary[900],
  },
  chipText: {
    color: colors.neutral[600],
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFF',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  desktopListContent: {
    width: '100%',
    paddingHorizontal: '5%',
  },
  itemCard: {
    backgroundColor: '#FFF',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  desktopItemCard: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  topicBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  topicText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sourceLabel: {
    fontSize: 11,
    color: colors.neutral[500],
    fontWeight: '600',
  },
  mythBox: {
    backgroundColor: '#FDECEA',
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  mythLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.danger[900],
    marginBottom: 4,
    letterSpacing: 1,
  },
  mythText: {
    fontSize: 15,
    color: colors.danger[900],
    fontStyle: 'italic',
    lineHeight: 22,
  },
  correctText: {
    fontSize: 16,
    color: colors.neutral[800],
    lineHeight: 26,
    marginBottom: spacing.md,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  actionBtn: {
    padding: 4,
  },
  historySection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  historyTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  clearText: {
    fontSize: 11,
    fontWeight: '700',
  },
  historyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  historyItemText: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Mode Selector
  modeSelector: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  // Training Mode
  trainingContainer: {
    padding: spacing.lg,
  },
  desktopTrainingContainer: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  quizCard: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    ...shadows.md,
    marginBottom: spacing.lg,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  quizStep: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '700',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: spacing.xl,
  },
  optionsList: {
    gap: spacing.md,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radii.md,
    gap: 12,
  },
  optionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  explanationBox: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radii.md,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radii.full,
    gap: 12,
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  practiceTip: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: radii.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  tipBody: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default KnowledgeScreen;
