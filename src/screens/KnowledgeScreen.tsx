import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, useWindowDimensions, ScrollView } from 'react-native';
import { Text, Searchbar, Chip, Icon, Modal, Portal } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { searchKnowledge, KnowledgeItem } from '../db/Database';
import AnimatedCard from '../components/AnimatedCard';
import EmptyState from '../components/EmptyState';
import { colors, spacing, radii, shadows, topicColors, darkTopicColors } from '../theme';
import { useResponsive, typography , rf } from '../responsive';
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

interface KnowledgeScreenProps {
  userRole?: string;
  onLogout?: () => void;
}

const KnowledgeScreen: React.FC<KnowledgeScreenProps> = ({ userRole }) => {
  const { t, i18n } = useTranslation();
  const { colors, mode } = useAppTheme();
  const { isPhone, isTablet, isDesktop, hPad, heroHeight, rf, bp, width, height } = useResponsive();
  const isCommunity = userRole === 'COMMUNITY';

  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [topic, setTopic] = useState('all');

  const [recentSearches, setRecentSearches] = useState<string[]>(['Malaria nets', 'COVID vaccine', 'HIV ARV']);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<'browse' | 'training' | 'guidelines'>('browse');
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);

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
    const tc = mode === 'light'
      ? (topicColors[item.topic] || topicColors.general)
      : (darkTopicColors[item.topic] || darkTopicColors.general);

    return (
      <AnimatedCard delay={index * 30} style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.neutral[200] }, isDesktop ? styles.desktopItemCard : ({} as any)]}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => setSelectedItem(item)} style={{ flex: 1 }}>
          <View style={styles.itemHeader}>
             <View style={[styles.topicBadge, { backgroundColor: tc.bg }]}>
               <Text style={[styles.topicText, { color: tc.text }]}>{item.topic.toUpperCase()}</Text>
             </View>
             <Text style={[styles.sourceLabel, { color: colors.neutral[500] }]}>{item.source}</Text>
          </View>
          
          {item.myth_text_en ? (
            <View style={[styles.mythBox, { backgroundColor: mode === 'light' ? '#FDECEA' : 'rgba(239, 68, 68, 0.15)', borderColor: mode === 'light' ? '#FCA5A5' : 'rgba(239, 68, 68, 0.3)', borderWidth: 1 }]}>
              <Text style={[styles.mythLabel, { color: mode === 'light' ? colors.danger[900] : '#FCA5A5' }]}>MYTH</Text>
              <Text style={[styles.mythText, { color: mode === 'light' ? colors.danger[900] : '#FECACA' }]}>"{item.myth_text_en}"</Text>
            </View>
          ) : null}

          <Text style={[styles.correctText, { color: colors.neutral[800] }]}>
            {i18n.language === 'lg' ? item.correct_text_lg || item.correct_text_en : item.correct_text_en}
          </Text>

          <View style={[styles.itemFooter, { borderTopColor: colors.neutral[200] }]}>
             <TouchableOpacity style={styles.actionBtn}>
               <Icon source="share-variant-outline" size={18} color={colors.neutral[500]} />
             </TouchableOpacity>
             <TouchableOpacity style={styles.actionBtn}>
               <Icon source="bookmark-outline" size={18} color={colors.neutral[500]} />
             </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </AnimatedCard>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {!isDesktop && (
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.neutral[200] }]}>
          <Text style={[styles.headerTitle, { color: colors.primary[900] }]}>
            {isCommunity ? 'Health Facts' : (viewMode === 'browse' ? t('knowledge.title') : t('knowledge.training_quizzes'))}
          </Text>
          <View style={[styles.offlinePill, { backgroundColor: colors.primary[50] }]}>
            <Icon source="cloud-check-outline" size={14} color={colors.primary[800]} />
            <Text style={[styles.offlineText, { color: colors.primary[900] }]}>{t('home.offline_ready')}</Text>
          </View>
        </View>
      )}

      <View style={[styles.modeSelector, { backgroundColor: colors.surface, borderBottomColor: colors.neutral[200] }]}>
         <TouchableOpacity 
           onPress={() => setViewMode('browse')} 
           style={[styles.modeBtn, viewMode === 'browse' && { borderBottomColor: colors.primary[900] }]}
         >
            <Text style={[styles.modeBtnText, { color: viewMode === 'browse' ? colors.primary[900] : colors.neutral[400] }]}>
              {isCommunity ? 'Browse Facts' : t('knowledge.browse_facts') || 'Browse Facts'}
            </Text>
         </TouchableOpacity>
         <TouchableOpacity 
           onPress={() => setViewMode('guidelines')} 
           style={[styles.modeBtn, viewMode === 'guidelines' && { borderBottomColor: colors.primary[900] }]}
         >
            <Text style={[styles.modeBtnText, { color: viewMode === 'guidelines' ? colors.primary[900] : colors.neutral[400] }]}>Guidelines Hub</Text>
         </TouchableOpacity>
         {!isCommunity && (
           <TouchableOpacity 
             onPress={() => setViewMode('training')} 
             style={[styles.modeBtn, viewMode === 'training' && { borderBottomColor: colors.primary[900] }]}
           >
              <Text style={[styles.modeBtnText, { color: viewMode === 'training' ? colors.primary[900] : colors.neutral[400] }]}>
                {t('knowledge.training_mode') || 'Training'}
              </Text>
           </TouchableOpacity>
         )}
      </View>

      {viewMode === 'browse' && (
        <>
          <View style={[styles.searchSection, { backgroundColor: colors.surface, borderBottomColor: colors.neutral[200] }]}>
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
      )}

      {viewMode === 'guidelines' && (
        <ScrollView contentContainerStyle={[styles.trainingContainer, isDesktop && styles.desktopTrainingContainer]}>
          <View style={[styles.quizCard, { backgroundColor: colors.surface }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Icon source="book-open-page-variant" size={26} color={colors.primary[900]} />
              <Text style={{ fontSize: 20, fontWeight: '900', color: colors.neutral[900] }}>Official Guidelines Hub</Text>
            </View>
            <Text style={{ fontSize: 14, color: colors.neutral[500], marginBottom: 24 }}>
              Authoritative medical scope from the World Health Organization (WHO) and Ministry of Health (MOH) Uganda.
            </Text>

            {/* Malaria Guideline */}
            <View style={styles.guidelineSectionCard}>
              <View style={[styles.guidelineHeader, { backgroundColor: '#F7FAFC', borderLeftColor: '#3182CE' }]}>
                <Icon source="shield-bug-outline" size={24} color="#3182CE" />
                <Text style={styles.guidelineTitle}>Malaria Management Guideline (MOH)</Text>
              </View>
              <View style={styles.guidelineBody}>
                <Text style={styles.guidelineSubheading}>1. Diagnosis & Testing</Text>
                <Text style={styles.guidelineText}>• Always test using a Malaria Rapid Diagnostic Test (RDT) or microscopy before treating. Never treat based on fever symptoms alone.</Text>
                
                <Text style={styles.guidelineSubheading}>2. First-Line Treatment</Text>
                <Text style={styles.guidelineText}>• Artemether-Lumefantrine (Coartem) is the recommended first-line drug for uncomplicated malaria. Dose depends on patient weight/age.</Text>
                
                <Text style={styles.guidelineSubheading}>3. Severe Malaria</Text>
                <Text style={styles.guidelineText}>• Give intravenous or intramuscular Artesunate immediately (pre-referral dose if in rural area), and refer the patient to a higher facility immediately.</Text>

                <Text style={styles.guidelineSubheading}>4. Prevention</Text>
                <Text style={styles.guidelineText}>• Sleep under a long-lasting insecticide-treated net (LLIN) every night. Clean stagnant water near houses. Utilize indoor residual spraying.</Text>
              </View>
            </View>

            {/* HIV Guideline */}
            <View style={styles.guidelineSectionCard}>
              <View style={[styles.guidelineHeader, { backgroundColor: '#F7FAFC', borderLeftColor: '#E53E3E' }]}>
                <Icon source="ribbon" size={24} color="#E53E3E" />
                <Text style={styles.guidelineTitle}>HIV Prevention & Care Protocol (WHO)</Text>
              </View>
              <View style={styles.guidelineBody}>
                <Text style={styles.guidelineSubheading}>1. Testing Algorithm</Text>
                <Text style={styles.guidelineText}>• Routine HIV testing is recommended. Pre-test and post-test counseling is mandatory. Standard rapid diagnostic test kits (e.g. Determine, Stat-Pak) must be used.</Text>
                
                <Text style={styles.guidelineSubheading}>2. Immediately Start ART ("Test & Treat")</Text>
                <Text style={styles.guidelineText}>• All individuals testing positive for HIV must be initiated on Antiretroviral Therapy (ART) immediately, regardless of CD4 count.</Text>
                
                <Text style={styles.guidelineSubheading}>3. Recommended First-Line Regimen</Text>
                <Text style={styles.guidelineText}>• The preferred first-line regimen for adults and adolescents is TLD (Tenofovir disoproxil fumarate + Lamivudine + Dolutegravir).</Text>

                <Text style={styles.guidelineSubheading}>4. Prevention (PrEP / PEP)</Text>
                <Text style={styles.guidelineText}>• Post-Exposure Prophylaxis (PEP) must be started within 72 hours of potential exposure. Pre-Exposure Prophylaxis (PrEP) is recommended for people at high ongoing risk of infection.</Text>
              </View>
            </View>

            {/* Maternal Standards */}
            <View style={styles.guidelineSectionCard}>
              <View style={[styles.guidelineHeader, { backgroundColor: '#F7FAFC', borderLeftColor: '#805AD5' }]}>
                <Icon source="baby-carriage" size={24} color="#805AD5" />
                <Text style={styles.guidelineTitle}>Maternal Health & ANC Standards (MOH)</Text>
              </View>
              <View style={styles.guidelineBody}>
                <Text style={styles.guidelineSubheading}>1. Antenatal Care Contacts</Text>
                <Text style={styles.guidelineText}>• At least 8 ANC contacts are recommended by MOH Uganda to detect complications early (weeks 12, 20, 26, 30, 34, 36, 38, 40).</Text>
                
                <Text style={styles.guidelineSubheading}>2. Iron & Folic Acid Supplementation</Text>
                <Text style={styles.guidelineText}>• Pregnant women should receive daily oral iron (60mg) and folic acid (400mcg) supplements to prevent maternal anaemia and birth defects.</Text>
                
                <Text style={styles.guidelineSubheading}>3. Facility Delivery</Text>
                <Text style={styles.guidelineText}>• Clean and safe deliveries must be conducted at a certified health facility under the supervision of a skilled birth attendant (midwife or doctor).</Text>

                <Text style={styles.guidelineSubheading}>4. Postnatal Care (PNC)</Text>
                <Text style={styles.guidelineText}>• A minimum of four postnatal contacts is recommended: within 24 hours, on day 3, between days 7-14, and at 6 weeks.</Text>
              </View>
            </View>

            {/* Sanitation Protocols */}
            <View style={styles.guidelineSectionCard}>
              <View style={[styles.guidelineHeader, { backgroundColor: '#F7FAFC', borderLeftColor: '#319795' }]}>
                <Icon source="hand-water" size={24} color="#319795" />
                <Text style={styles.guidelineTitle}>Sanitation & Wash Protocols (WHO)</Text>
              </View>
              <View style={styles.guidelineBody}>
                <Text style={styles.guidelineSubheading}>1. Safe Water Management</Text>
                <Text style={styles.guidelineText}>• Boil all drinking water or use water purification chemicals. Store drinking water in clean, covered containers with a narrow opening.</Text>
                
                <Text style={styles.guidelineSubheading}>2. Latrines & Waste Disposal</Text>
                <Text style={styles.guidelineText}>• Every household must have access to a clean, ventilated improved pit latrine (VIP). Latrines must be sited at least 30 meters away from water sources.</Text>
                
                <Text style={styles.guidelineSubheading}>3. Critical Handwashing Times</Text>
                <Text style={styles.guidelineText}>• Wash hands with soap and running water: after visiting the toilet, after cleaning a child’s bottom, before preparing food, and before eating.</Text>
              </View>
            </View>

          </View>
        </ScrollView>
      )}

      {viewMode === 'training' && (
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
                           showAnswer && isCorrect && { borderColor: colors.primary[600], backgroundColor: mode === 'light' ? '#E2F0D9' : colors.primary[50] },
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
      {/* Detail Modal */}
      <Portal>
        <Modal visible={!!selectedItem} onDismiss={() => setSelectedItem(null)} contentContainerStyle={[styles.modalContainer, { backgroundColor: colors.surface, maxWidth: 600, alignSelf: 'center', width: '90%', maxHeight: '85%' }]}>
          {selectedItem && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <View style={[styles.topicBadge, { backgroundColor: (mode === 'light' ? (topicColors[selectedItem.topic] || topicColors.general) : (darkTopicColors[selectedItem.topic] || darkTopicColors.general)).bg }]}>
                  <Text style={[styles.topicText, { color: (mode === 'light' ? (topicColors[selectedItem.topic] || topicColors.general) : (darkTopicColors[selectedItem.topic] || darkTopicColors.general)).text }]}>{selectedItem.topic.toUpperCase()}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedItem(null)}>
                  <Icon source="close" size={24} color={colors.neutral[500]} />
                </TouchableOpacity>
              </View>

              {selectedItem.myth_text_en && (
                <View style={[styles.mythBox, { backgroundColor: mode === 'light' ? '#FDECEA' : 'rgba(239, 68, 68, 0.15)', borderColor: mode === 'light' ? '#FCA5A5' : 'rgba(239, 68, 68, 0.3)', borderWidth: 1, marginBottom: 16 }]}>
                  <Text style={[styles.mythLabel, { color: mode === 'light' ? colors.danger[900] : '#FCA5A5' }]}>MYTH</Text>
                  <Text style={[styles.mythText, { color: mode === 'light' ? colors.danger[900] : '#FECACA', fontSize: 16 }]}>"{selectedItem.myth_text_en}"</Text>
                </View>
              )}

              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.neutral[900], marginBottom: 8 }}>Verified Fact</Text>
              <Text style={{ fontSize: 16, color: colors.neutral[800], lineHeight: 24, marginBottom: 24 }}>
                {i18n.language === 'lg' ? selectedItem.correct_text_lg || selectedItem.correct_text_en : selectedItem.correct_text_en}
              </Text>

              {selectedItem.detailed_guidance_en && (
                <View style={{ backgroundColor: colors.primary[50], padding: 16, borderRadius: radii.md, marginBottom: 24, borderWidth: 1, borderColor: colors.primary[100] }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Icon source="information" size={20} color={colors.primary[900]} />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primary[900] }}>Detailed Guidance</Text>
                  </View>
                  <Text style={{ fontSize: 15, color: colors.neutral[800], lineHeight: 22 }}>
                    {i18n.language === 'lg' ? selectedItem.detailed_guidance_lg || selectedItem.detailed_guidance_en : selectedItem.detailed_guidance_en}
                  </Text>
                </View>
              )}

              {(selectedItem.symptoms || selectedItem.prevention || selectedItem.treatment) && (
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.neutral[900], marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Disease Education</Text>
                  
                  {selectedItem.symptoms && (
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.warning[50], alignItems: 'center', justifyContent: 'center' }}>
                        <Icon source="thermometer" size={18} color={colors.warning[900]} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.warning[900], marginBottom: 4 }}>Symptoms</Text>
                        <Text style={{ fontSize: 15, color: colors.neutral[700], lineHeight: 22 }}>{selectedItem.symptoms}</Text>
                      </View>
                    </View>
                  )}

                  {selectedItem.prevention && (
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary[50], alignItems: 'center', justifyContent: 'center' }}>
                        <Icon source="shield-plus" size={18} color={colors.primary[900]} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary[900], marginBottom: 4 }}>Prevention</Text>
                        <Text style={{ fontSize: 15, color: colors.neutral[700], lineHeight: 22 }}>{selectedItem.prevention}</Text>
                      </View>
                    </View>
                  )}

                  {selectedItem.treatment && (
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.danger[50], alignItems: 'center', justifyContent: 'center' }}>
                        <Icon source="medication" size={18} color={colors.danger[900]} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.danger[900], marginBottom: 4 }}>Treatment</Text>
                        <Text style={{ fontSize: 15, color: colors.neutral[700], lineHeight: 22 }}>{selectedItem.treatment}</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              <View style={{ borderTopWidth: 1, borderTopColor: colors.neutral[200], paddingTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: colors.neutral[500] }}>Source: {selectedItem.source}</Text>
              </View>
            </ScrollView>
          )}
        </Modal>
      </Portal>
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
    fontSize: rf(16),
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
    borderRadius: radii.full,
    backgroundColor: colors.neutral[50],
    marginBottom: spacing.md,
    borderWidth: 0,
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
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 0,
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
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    borderWidth: 0,
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
    fontSize: rf(16),
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
    backgroundColor: '#2C5E3E',
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
  communityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  communityBannerText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  modalContainer: {
    padding: spacing.xl,
    borderRadius: radii.xl,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  guidelineSectionCard: {
    marginBottom: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  guidelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: spacing.md,
    borderLeftWidth: 4,
  },
  guidelineTitle: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  guidelineBody: {
    padding: spacing.md,
  },
  guidelineSubheading: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
  },
  guidelineText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
});

export default KnowledgeScreen;
