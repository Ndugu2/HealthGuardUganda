import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Animated, useWindowDimensions } from 'react-native';
import { Text, Icon, ProgressBar, Button, Portal, Modal, Divider, List } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { ACADEMY_CONTENT, AcademyService, LessonModule, QuizQuestion } from '../services/AcademyService';
import { colors, spacing, radii, shadows } from '../theme';
import { useAppTheme } from '../ThemeContext';
import AnimatedCard from '../components/AnimatedCard';

const AcademyScreen = () => {
  const { t, i18n } = useTranslation();
  const { colors, mode } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 800;
  
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [selectedModule, setSelectedModule] = useState<LessonModule | null>(null);
  const [quizMode, setQuizMode] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const p = await AcademyService.getProgress();
    setProgress(p);
  };

  const startModule = (module: LessonModule) => {
    setSelectedModule(module);
    setQuizMode(false);
    setQuizIndex(0);
    setQuizScore(0);
    setShowResult(false);
  };

  const handleAnswer = (index: number) => {
    if (!selectedModule) return;
    
    if (index === selectedModule.quiz[quizIndex].correctIndex) {
      setQuizScore(quizScore + 1);
    }
    
    if (quizIndex < selectedModule.quiz.length - 1) {
      setQuizIndex(quizIndex + 1);
    } else {
      setShowResult(true);
      AcademyService.markCompleted(selectedModule.id);
      loadProgress();
    }
  };

  const completedCount = Object.keys(progress).length;
  const overallProgress = completedCount / ACADEMY_CONTENT.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── ACADEMY HEADER ── */}
        <LinearGradient colors={[colors.primary[900], colors.primary[700]]} style={styles.header}>
           <View style={styles.headerTop}>
              <View>
                 <Text style={styles.headerTitle}>{t('academy.title')}</Text>
                 <Text style={styles.headerSub}>{t('academy.subtitle')}</Text>
              </View>
              <View style={styles.badgeContainer}>
                 <Icon source="medal" size={32} color="#FFD700" />
                 <Text style={styles.badgeText}>{completedCount} {t('academy.badges')}</Text>
              </View>
           </View>
           
           <View style={styles.progressSection}>
              <View style={styles.progressInfo}>
                 <Text style={styles.progressLabel}>{t('academy.overall_progress')}</Text>
                 <Text style={styles.progressVal}>{Math.round(overallProgress * 100)}%</Text>
              </View>
              <ProgressBar progress={overallProgress} color="#FFF" style={styles.progressBar} />
           </View>
        </LinearGradient>

        <View style={styles.body}>
           <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>{t('academy.learning_modules')}</Text>
           
           <View style={isDesktop ? styles.desktopGrid : {}}>
             {ACADEMY_CONTENT.map((module, index) => {
               const isCompleted = progress[module.id];
               return (
                 <AnimatedCard key={module.id} delay={index * 100} style={[styles.moduleCard, { backgroundColor: colors.surface }, isDesktop ? styles.desktopCard : undefined] as any}>
                  <TouchableOpacity onPress={() => startModule(module)} style={styles.moduleRow}>
                     <View style={[styles.iconCircle, { backgroundColor: isCompleted ? colors.primary[50] : colors.neutral[50] }]}>
                        <Icon source={module.icon} size={28} color={isCompleted ? colors.primary[900] : colors.neutral[400]} />
                     </View>
                     <View style={styles.moduleMeta}>
                        <View style={styles.moduleHeaderRow}>
                           <Text style={[styles.moduleCategory, { color: colors.primary[700] }]}>{i18n.language === 'lg' ? module.category_lg || module.category : module.category}</Text>
                           {isCompleted && <View style={styles.completedPill}><Text style={styles.completedText}>{t('academy.module_completed')}</Text></View>}
                        </View>
                        <Text style={[styles.moduleTitle, { color: colors.neutral[900] }]}>{i18n.language === 'lg' ? module.title_lg || module.title : module.title}</Text>
                        <Text style={[styles.moduleDesc, { color: colors.neutral[500] }]} numberOfLines={2}>{i18n.language === 'lg' ? module.description_lg || module.description : module.description}</Text>
                        <View style={styles.moduleFooter}>
                           <Icon source="clock-outline" size={14} color={colors.neutral[400]} />
                           <Text style={styles.moduleTime}>{module.estimatedMinutes} {t('academy.mins')}</Text>
                        </View>
                     </View>
                     <Icon source="chevron-right" size={24} color={colors.neutral[300]} />
                  </TouchableOpacity>
               </AnimatedCard>
             );
           })}
           </View>
        </View>
        <View style={styles.spacer} />
      </ScrollView>

      {/* ── LESSON MODAL ── */}
      <Portal>
        <Modal visible={!!selectedModule} onDismiss={() => setSelectedModule(null)} contentContainerStyle={[styles.modal, isDesktop && styles.desktopModal]}>
           {selectedModule && (
             <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                <View style={styles.modalHeader}>
                   <Text style={[styles.modalTitle, { color: colors.neutral[900] }]}>{i18n.language === 'lg' ? selectedModule.title_lg || selectedModule.title : selectedModule.title}</Text>
                   <TouchableOpacity onPress={() => setSelectedModule(null)}>
                      <Icon source="close" size={24} color={colors.neutral[400]} />
                   </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.lessonScroll} showsVerticalScrollIndicator={false}>
                   {!quizMode ? (
                     <View>
                        <View style={[styles.lessonInfoBox, { backgroundColor: colors.primary[50] }]}>
                           <Icon source="information" size={20} color={colors.primary[900]} />
                           <Text style={[styles.lessonInfoText, { color: colors.primary[900] }]}>{t('academy.read_below')}</Text>
                        </View>
                        {(i18n.language === 'lg' ? selectedModule.content_lg || selectedModule.content : selectedModule.content).map((point, i) => (
                          <View key={i} style={styles.contentItem}>
                             <View style={[styles.bullet, { backgroundColor: colors.primary[900] }]} />
                             <Text style={[styles.contentText, { color: colors.neutral[700] }]}>{point}</Text>
                          </View>
                        ))}
                        <Button 
                          mode="contained" 
                          onPress={() => setQuizMode(true)} 
                          style={styles.startQuizBtn}
                          buttonColor={colors.primary[900]}
                        >
                          {t('academy.start_quiz')}
                        </Button>
                     </View>
                   ) : showResult ? (
                     <View style={styles.resultContainer}>
                        <Icon source="check-decagram" size={64} color={colors.primary[900]} />
                        <Text style={[styles.resultTitle, { color: colors.neutral[900] }]}>{t('academy.module_completed')}</Text>
                        <Text style={[styles.resultScore, { color: colors.neutral[600] }]}>{t('academy.quiz_score', { score: quizScore, total: selectedModule.quiz.length })}</Text>
                        <Text style={styles.resultCongrats}>{t('academy.congrats')}</Text>
                        <Button mode="contained" onPress={() => setSelectedModule(null)} style={styles.closeBtn} buttonColor={colors.primary[900]}>{t('academy.back_to_academy')}</Button>
                     </View>
                   ) : (
                     <View>
                        <View style={styles.quizHeader}>
                           <Text style={styles.quizStep}>{t('academy.question_step', { current: quizIndex + 1, total: selectedModule.quiz.length })}</Text>
                           <ProgressBar progress={(quizIndex + 1) / selectedModule.quiz.length} color={colors.primary[900]} style={styles.quizProgress} />
                        </View>
                        <Text style={[styles.questionText, { color: colors.neutral[900] }]}>
                           {i18n.language === 'lg' ? selectedModule.quiz[quizIndex].text_lg || selectedModule.quiz[quizIndex].text : selectedModule.quiz[quizIndex].text}
                        </Text>
                        <View style={styles.optionsContainer}>
                           {(i18n.language === 'lg' ? selectedModule.quiz[quizIndex].options_lg || selectedModule.quiz[quizIndex].options : selectedModule.quiz[quizIndex].options).map((option, i) => (
                             <TouchableOpacity 
                              key={i} 
                              onPress={() => handleAnswer(i)} 
                              style={[styles.optionBtn, { borderColor: colors.neutral[200] }]}
                             >
                                <Text style={[styles.optionText, { color: colors.neutral[700] }]}>{option}</Text>
                             </TouchableOpacity>
                           ))}
                        </View>
                     </View>
                   )}
                </ScrollView>
             </View>
           )}
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.xl,
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
  },
  headerSub: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  badgeContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: radii.lg,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  progressSection: {
    marginTop: 10,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '700',
  },
  progressVal: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  body: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
  },
  moduleCard: {
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  desktopCard: {
    width: '48%',
    marginBottom: 0,
  },
  moduleRow: {
    flexDirection: 'row',
    padding: spacing.lg,
    alignItems: 'center',
    gap: 15,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleMeta: {
    flex: 1,
  },
  moduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  moduleCategory: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  completedPill: {
    backgroundColor: '#E2F0D9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completedText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#1B5E20',
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  moduleDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  moduleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moduleTime: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
  },
  spacer: {
    height: 40,
  },
  // Modal
  modal: {
    margin: 20,
  },
  desktopModal: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  modalContent: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    flex: 1,
  },
  lessonScroll: {
    flexGrow: 0,
  },
  lessonInfoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: radii.md,
    gap: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  lessonInfoText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  contentItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 15,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  startQuizBtn: {
    marginTop: 20,
    borderRadius: radii.md,
    paddingVertical: 6,
  },
  // Quiz
  quizHeader: {
    marginBottom: 20,
  },
  quizStep: {
    fontSize: 12,
    fontWeight: '800',
    color: '#888',
    marginBottom: 8,
  },
  quizProgress: {
    height: 4,
    borderRadius: 2,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: 25,
  },
  optionsContainer: {
    gap: 12,
  },
  optionBtn: {
    padding: 16,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  // Result
  resultContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 20,
  },
  resultScore: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  resultCongrats: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  closeBtn: {
    marginTop: 30,
    width: '100%',
    borderRadius: radii.md,
  }
});

export default AcademyScreen;
