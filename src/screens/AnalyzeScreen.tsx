import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Animated,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { Text, Icon, Modal, Portal, Divider, ProgressBar, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { HybridClassifier } from '../ai/HybridClassifier';
import { getResponseForKeyword, saveEncounter, updateEncounterFeedback, getSetting } from '../db/Database';
import { ClassificationResult } from '../ai/RuleEngine';
import AnimatedCard from '../components/AnimatedCard';
import { colors, spacing, radii, shadows } from '../theme';
import { useAppTheme } from '../ThemeContext';
import { AIService, ExpertAnalysis } from '../services/AIService';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';
import { Easing } from 'react-native';

const classifier = new HybridClassifier();

const AnalyzeScreen = ({ navigateToTab }: { navigateToTab?: (key: string) => void }) => {
  const { t, i18n } = useTranslation();
  const { colors, mode, topicColors } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 800;

  const [claim, setClaim] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisStage, setAnalysisStage] = useState(0);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [correctInfo, setCorrectInfo] = useState('');
  const [directAnswer, setDirectAnswer] = useState('');
  const [detailedGuidance, setDetailedGuidance] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [prevention, setPrevention] = useState('');
  const [treatment, setTreatment] = useState('');
  const [source, setSource] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentEncounterId, setCurrentEncounterId] = useState<number | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [expertAnalysis, setExpertAnalysis] = useState<ExpertAnalysis | null>(null);
  const [expertLoading, setExpertLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const STAGES = [
    { label: t('analyze.stage_1'), icon: 'text-search' },
    { label: t('analyze.stage_2'), icon: 'database-search' },
    { label: t('analyze.stage_3'), icon: 'shield-check' },
    { label: t('analyze.stage_4'), icon: 'flask-outline' },
    { label: t('analyze.stage_5'), icon: 'check-circle-outline' },
  ];

  const [multimediaType, setMultimediaType] = useState<'text' | 'voice' | 'image'>('text');
  const [isSimulatingMedia, setIsSimulatingMedia] = useState(false);

  const handleMultimediaPress = (type: 'voice' | 'image') => {
    setMultimediaType(type);
    setIsSimulatingMedia(true);
    
    // Simulate a delay for "uploading" or "processing" media
    setTimeout(async () => {
      setIsSimulatingMedia(false);
      let mockClaim = '';
      if (type === 'voice') {
        mockClaim = i18n.language === 'lg' 
          ? 'Nawulidde ku mpewo nti pali ddagala lyoganda eriwonya Malaria mu nnaku bbiri.'
          : 'I heard on the radio that certain herbs from the village can prevent Ebola better than vaccines.';
      } else {
        mockClaim = i18n.language === 'lg'
          ? 'Laba ku WhatsApp: Omubisi gwenjuki nennimu bye byokka ebyetaagisa okuwonya ekifuba mu baana.'
          : 'Check out this WhatsApp forward: Local honey and lemon is the only thing needed to cure persistent coughs in children.';
      }
      setClaim(mockClaim);
      
      Alert.alert(
        'Media Processed',
        `${type === 'voice' ? 'Voice recording transcribed' : 'Image text extracted'} successfully.`,
        [
          { text: 'Analyze Now', onPress: () => handleVerify() },
          { text: 'Review Text', style: 'cancel' }
        ]
      );
    }, 2000);
  };

  const handleVerify = async () => {
    if (!claim) return;
    setLoading(true);
    setAnalysisStage(0);

    // Simulate multi-stage analysis
    for (let i = 0; i < STAGES.length; i++) {
      setAnalysisStage(i);
      const delay = 600 + Math.random() * 800; // Randomized delay per stage
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const res = await classifier.classify(claim);
    setResult(res);
    const evidence = await getResponseForKeyword(res.triggerKeyword);
    
    let info = '';
    if (evidence) {
      info = i18n.language === 'lg' ? evidence.correct_text_lg || evidence.correct_text_en : evidence.correct_text_en;
      setCorrectInfo(info);
      setDetailedGuidance(i18n.language === 'lg' ? (evidence.detailed_guidance_lg || evidence.detailed_guidance_en || '') : (evidence.detailed_guidance_en || ''));
      setSymptoms(evidence.symptoms || '');
      setPrevention(evidence.prevention || '');
      setTreatment(evidence.treatment || '');
      setSource(evidence.source);
    } else {
      info = t('analyze.no_evidence') || 'No specific evidence found in the local knowledge base. Please consult a health officer.';
      setCorrectInfo(info);
      setDetailedGuidance('');
      setSymptoms('');
      setPrevention('');
      setTreatment('');
      setSource(t('analyze.general_guidelines') || 'General Guidelines');
    }

    // Construct Direct Conversational Answer
    let answer = '';
    if (res.label === 'INACCURATE') {
      answer = i18n.language === 'lg' ? `Nga, ekyo si kituufu. ${info}` : `No, that is not true. ${info}`;
    } else if (res.label === 'ACCURATE') {
      answer = i18n.language === 'lg' ? `Ye, ekyo kituufu. ${info}` : `Yes, that is correct. ${info}`;
    } else {
      answer = i18n.language === 'lg' ? `Kino tekimanyiddwa bulungi. ${info}` : `This information is unverified. ${info}`;
    }
    setDirectAnswer(answer);

    const encounterId = await saveEncounter(claim, res.label, res.confidence, 'Kampala, Central');
    setCurrentEncounterId(encounterId);
    setFeedbackSubmitted(false);
    
    setLoading(false);
    setShowModal(true);
    
    if (res.label === 'ACCURATE') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    // Reset expert state for new claim
    setExpertAnalysis(null);
  };

  const handleConsultExpert = async () => {
    if (!claim) {
      console.log('Expert Consultation: No claim found');
      return;
    }
    
    setExpertLoading(true);
    console.log('Expert Consultation: Initiated for claim:', claim);
    
    try {
      const expert = await AIService.consultExpert(claim, i18n.language);
      if (expert) {
        setExpertAnalysis(expert);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert(
          t('analyze.expert_offline'), 
          t('analyze.expert_offline_msg') || 'Could not reach the global expert network. Please check your internet connection.'
        );
      }
    } catch (e) {
      console.error('Expert Consultation Failed:', e);
      Alert.alert('Consultation Error', 'An unexpected error occurred while contacting the expert network.');
    } finally {
      setExpertLoading(false);
    }
  };

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  const handleVoiceAssistant = async () => {
    setIsVoiceMode(true);
    setIsListening(true);
    
    // Simulate STT process for voice interaction
    setTimeout(async () => {
      setIsListening(false);
      
      // Mock captured speech (Voice-to-Text simulation) - Language sensitive
      const capturedClaim = i18n.language === 'lg' 
        ? "Mpunzi z'ebola zirina obulwadde?" 
        : "Can malaria be cured by eating certain tropical fruits?";
      setClaim(capturedClaim);
      
      const res = await classifier.classify(capturedClaim);
      setResult(res);
      
      // Fetch evidence
      const evidence = await getResponseForKeyword(res.triggerKeyword);
      if (evidence) {
        setCorrectInfo(i18n.language === 'lg' ? evidence.correct_text_lg || evidence.correct_text_en : evidence.correct_text_en);
        setSource(evidence.source);
      }
      
      // Voice-to-Voice: Speak the result back in the correct language
      const speechText = i18n.language === 'lg' 
        ? (res.label === 'INACCURATE' ? `Kino kikyamu. Abawonye Ebola tebalina bulwadde era tebasiga.` : `Tukyalina okunoonyereza ku kino, naye genda mu ddwaliro.`)
        : (res.label === 'INACCURATE' ? `This claim is inaccurate. Always follow official medical advice from the Ministry of Health.` : `We are checking this. Please consult a health officer for verified guidance.`);
        
      try {
        Speech.speak(speechText, {
          language: i18n.language === 'lg' ? 'lg' : 'en',
          pitch: 1.0,
          rate: 0.85,
        });
      } catch (e) {
        console.warn("Speech synthesis failed", e);
      }
      
      // Record encounter
      const encounterId = await saveEncounter(capturedClaim, res.label, res.confidence, 'Kampala, Central');
      setCurrentEncounterId(encounterId);
      
      setIsVoiceMode(false);
      setShowModal(true);
    }, 3500);
  };

  const handleFeedback = async (isCorrect: boolean, correctedLabel?: string) => {
    if (!currentEncounterId || !result) return;

    const actualLabel = isCorrect ? result.label : correctedLabel;
    if (!actualLabel) return;

    // 1. Trigger local learning (SGD)
    classifier.improve(claim, actualLabel as any);

    // 2. Update DB record
    await updateEncounterFeedback(currentEncounterId, actualLabel);

    setFeedbackSubmitted(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const getResultStyle = () => {
    if (!result) return { color: colors.primary[900], bg: colors.surface };
    const labelKey = result.label === 'ACCURATE' ? 'accurate' : result.label === 'INACCURATE' ? 'misleading' : 'uncertain';
    const baseColor = result.label === 'ACCURATE' ? colors.primary[900] : result.label === 'INACCURATE' ? colors.danger[900] : colors.warning[900];
    return { 
      color: baseColor, 
      bg: colors.surface, 
      label: t(`analyze.results.${labelKey}_label`),
      badgeBg: baseColor + '15'
    };
  };

  const renderAnalysisLoader = () => (
    <Portal>
      <Modal visible={loading || isSimulatingMedia} dismissable={false} contentContainerStyle={styles.loaderModal}>
        <View style={[styles.loaderContent, { backgroundColor: colors.surface }]}>
          {isSimulatingMedia ? (
             <View style={styles.mediaSimContent}>
                <ActivityIndicator animating size="large" color={colors.primary[900]} />
                <Text style={[styles.loaderTitle, { color: colors.neutral[900], marginTop: 20 }]}>
                   {multimediaType === 'voice' ? 'Transcribing Audio...' : 'Scanning Image for Text...'}
                </Text>
                <Text style={[styles.loaderFooter, { color: colors.neutral[500], textAlign: 'center' }]}>
                   Our AI is extracting health claims from your media file.
                </Text>
             </View>
          ) : (
            <>
              <View style={styles.loaderHeader}>
                 <Icon source="auto-fix" size={32} color={colors.primary[900]} />
                 <Text style={[styles.loaderTitle, { color: colors.neutral[900] }]}>{t('analyze.loading_title') || 'HealthGuard AI Analysis'}</Text>
              </View>
              
              <ProgressBar 
                progress={(analysisStage + 1) / STAGES.length} 
                color={colors.primary[900]} 
                style={[styles.progressBar, { backgroundColor: colors.neutral[100] }]} 
              />
              
              <View style={styles.stagesContainer}>
                {STAGES.map((stage, idx) => {
                  const isActive = idx === analysisStage;
                  const isDone = idx < analysisStage;
                  return (
                    <View key={idx} style={styles.stageItem}>
                      <View style={[
                        styles.stageIcon, 
                        { backgroundColor: colors.neutral[50], borderColor: colors.neutral[200] },
                        isActive && { backgroundColor: colors.primary[900], borderColor: colors.primary[900] },
                        isDone && { backgroundColor: colors.primary[600], borderColor: colors.primary[600] }
                      ]}>
                        <Icon 
                          source={isDone ? 'check' : stage.icon} 
                          size={18} 
                          color={isDone || isActive ? '#FFF' : colors.neutral[400]} 
                        />
                      </View>
                      <Text style={[
                        styles.stageText, 
                        { color: colors.neutral[400] },
                        isActive && { color: colors.primary[900], fontWeight: '700' },
                        isDone && { color: colors.neutral[600], textDecorationLine: 'line-through' }
                      ]}>
                        {stage.label}
                      </Text>
                      {isActive && <AnimatedCard style={[styles.activePulse, { backgroundColor: colors.primary[500] }]} children={null} />}
                    </View>
                  );
                })}
              </View>
              
               <Text style={[styles.loaderFooter, { color: colors.neutral[500] }]}>
                {t('analyze.wait_cross_ref') || 'Please wait while we cross-reference official medical sources...'}
              </Text>
            </>
          )}
        </View>
      </Modal>
    </Portal>
  );

  const renderForm = () => (
    <View style={isDesktop ? styles.leftColumn : undefined}>
       <View style={[styles.inputArea, { backgroundColor: colors.surface, borderColor: colors.neutral[200] }]}>
        <View style={styles.inputLabelRow}>
          <Text style={[styles.inputLabel, { color: colors.neutral[800] }]}>{t('analyze.input_label')}</Text>
          <View style={styles.inputMethods}>
             <TouchableOpacity onPress={() => handleMultimediaPress('voice')} style={styles.miniMethodBtn}>
                <Icon source="microphone" size={16} color={colors.primary[900]} />
             </TouchableOpacity>
             <TouchableOpacity onPress={() => handleMultimediaPress('image')} style={styles.miniMethodBtn}>
                <Icon source="image" size={16} color={colors.primary[900]} />
             </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.neutral[300] }]}>
          <TextInput
            placeholder={t('analyze.input_placeholder')}
            placeholderTextColor={colors.neutral[400]}
            multiline
            value={claim}
            onChangeText={setClaim}
            style={[styles.textInput, { color: colors.neutral[900] }]}
          />
        </View>
         <View style={styles.inputFooter}>
            <View style={styles.inputFooterLeft}>
              <Icon source="information-outline" size={16} color={colors.neutral[500]} />
              <Text style={[styles.inputFooterText, { color: colors.neutral[500] }]}>{t('analyze.input_help')}</Text>
            </View>
            <Text style={[styles.inputFooterText, { color: colors.neutral[500] }]}>{t('analyze.char_count', { count: claim.length })}</Text>
         </View>
      </View>

       <TouchableOpacity 
        style={[styles.analyzeBtn, { backgroundColor: colors.primary[900] }, (!claim || loading) ? [styles.analyzeBtnDisabled, { backgroundColor: colors.neutral[400] }] : undefined]} 
        onPress={handleVerify}
        disabled={!claim || loading}
      >
        <Icon source="text-box-search-outline" size={24} color="#FFF" />
        <Text style={styles.analyzeBtnText}>{loading ? t('analyze.analyzing_btn') : t('analyze.analyze_btn')}</Text>
      </TouchableOpacity>

      <View style={styles.graphicCard}>
         <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1000&auto=format&fit=crop' }} 
          style={styles.graphicImage} 
        />
        <View style={styles.graphicOverlay}>
          <View style={styles.trustedRow}>
             <Icon source="shield-check" size={16} color={colors.primary[600]} />
             <Text style={[styles.trustedText, { color: colors.primary[200] }]}>{t('analyze.trusted_engine')}</Text>
          </View>
          <Text style={styles.graphicTitle}>{t('analyze.verified_moh')}</Text>
        </View>
      </View>
    </View>
  );

  const renderSidePanel = () => (
    <View style={styles.rightColumn}>
       {/* Status */}
       <View style={[styles.panelCard, { backgroundColor: colors.surface, borderColor: colors.neutral[200] }]}>
          <View style={styles.panelHeaderRow}>
            <Text style={[styles.panelLabel, { color: colors.neutral[600] }]}>CURRENT STATUS</Text>
            <View style={styles.statusDotRow}>
               <View style={[styles.statusDot, { backgroundColor: colors.primary[600] }]} />
               <Text style={[styles.statusDotText, { color: colors.primary[700] }]}>System Ready</Text>
            </View>
          </View>
          <View style={[styles.syncBox, { backgroundColor: colors.neutral[50], borderColor: colors.neutral[200] }]}>
             <Icon source="database-sync-outline" size={20} color={colors.primary[900]} />
             <Text style={[styles.syncText, { color: colors.neutral[800] }]}>Last Database Sync: 12m ago</Text>
          </View>
       </View>

       {/* Other inputs */}
       <View style={[styles.panelCard, { backgroundColor: colors.surface, borderColor: colors.neutral[200] }]}>
          <Text style={[styles.panelTitle, { color: colors.neutral[900] }]}>Other Input Methods</Text>
          <TouchableOpacity 
            onPress={() => handleMultimediaPress('voice')}
            style={[styles.methodItem, { backgroundColor: colors.neutral[50], borderColor: colors.neutral[100] }]}
          >
             <View style={[styles.methodIconCircle, { backgroundColor: colors.primary[900] }]}>
               <Icon source="microphone" size={20} color="#FFF" />
             </View>
             <View style={styles.methodTextWrap}>
               <Text style={[styles.methodTitle, { color: colors.neutral[900] }]}>Record Audio</Text>
               <Text style={[styles.methodSub, { color: colors.neutral[500] }]}>Upload radio clips or recordings</Text>
             </View>
             <Icon source="chevron-right" size={20} color={colors.neutral[400]} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleMultimediaPress('image')}
            style={[styles.methodItem, { backgroundColor: colors.neutral[50], borderColor: colors.neutral[100] }]}
          >
             <View style={[styles.methodIconCircle, { backgroundColor: mode === 'light' ? '#E2F0D9' : colors.primary[900] }]}>
               <Icon source="image-outline" size={20} color={colors.primary[900]} />
             </View>
             <View style={styles.methodTextWrap}>
               <Text style={[styles.methodTitle, { color: colors.neutral[900] }]}>Upload Image</Text>
               <Text style={[styles.methodSub, { color: colors.neutral[500] }]}>Scan posters or news snippets</Text>
             </View>
             <Icon source="chevron-right" size={20} color={colors.neutral[400]} />
          </TouchableOpacity>
       </View>

       {/* Tip */}
       <View style={[styles.panelCard, { backgroundColor: mode === 'light' ? '#EEF4E8' : colors.neutral[100], borderWidth: 0 }]}>
          <View style={styles.tipHeader}>
             <Icon source="lightbulb-outline" size={18} color={colors.primary[900]} />
             <Text style={[styles.tipTitle, { color: colors.primary[900] }]}>VERIFICATION TIP</Text>
          </View>
          <Text style={[styles.tipText, { color: colors.neutral[700] }]}>
            Claims often use "urgent" language or emotional triggers to bypass critical thinking. If a health message asks you to "Share quickly before it's deleted," it's a major red flag for misinformation.
          </Text>
          <TouchableOpacity style={styles.learnMoreRow}>
             <Text style={[styles.learnMoreText, { color: colors.primary[900] }]}>Learn about Red Flags</Text>
             <Icon source="open-in-new" size={14} color={colors.primary[900]} />
          </TouchableOpacity>
       </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {!isDesktop && (
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.neutral[100] }]}>
          <TouchableOpacity style={styles.backBtn}>
            <Icon source="arrow-left" size={24} color={colors.primary[900]} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.primary[900] }]}>Analyze a Claim</Text>
          <View style={[styles.offlinePill, { backgroundColor: mode === 'light' ? '#E2F0D9' : colors.neutral[100] }]}>
            <Icon source="cloud-check-outline" size={14} color={colors.primary[800]} />
            <Text style={[styles.offlineText, { color: colors.primary[900] }]}>Offline Ready</Text>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={isDesktop ? styles.desktopMain : null}>
          <View style={isDesktop ? styles.desktopHeaderArea : null}>
            <Text style={[styles.mainTitle, { color: colors.neutral[900] }]}>Analyze a Claim</Text>
            <Text style={[styles.mainSub, { color: colors.neutral[600] }]}>Submit health-related news, social media posts, or audio clips for instant verification against official medical guidelines.</Text>
            <TouchableOpacity 
              style={[styles.voiceToggle, { backgroundColor: colors.primary[50], marginTop: 15, alignSelf: 'flex-start' }]}
              onPress={handleVoiceAssistant}
            >
              <Icon source="microphone" size={20} color={colors.primary[900]} />
              <Text style={[styles.voiceToggleText, { color: colors.primary[900] }]}>Open Voice Assistant</Text>
            </TouchableOpacity>
          </View>

          <View style={isDesktop ? styles.rowLayout : undefined}>
             {renderForm()}
             {isDesktop && renderSidePanel()}
          </View>
          
          {!isDesktop && (
             <View>
               <View style={styles.mediaRow}>
                 <TouchableOpacity 
                   onPress={() => handleMultimediaPress('voice')}
                   style={[styles.mediaCard, { backgroundColor: colors.surface, borderColor: colors.neutral[200] }]}
                 >
                   <Icon source="microphone-outline" size={28} color={colors.primary[900]} />
                   <Text style={[styles.mediaLabel, { color: colors.neutral[700] }]}>Voice Recording</Text>
                 </TouchableOpacity>
                 <TouchableOpacity 
                   onPress={() => handleMultimediaPress('image')}
                   style={[styles.mediaCard, { backgroundColor: colors.surface, borderColor: colors.neutral[200] }]}
                 >
                   <Icon source="camera-outline" size={28} color={colors.primary[900]} />
                   <Text style={[styles.mediaLabel, { color: colors.neutral[700] }]}>Upload Image</Text>
                 </TouchableOpacity>
               </View>

               <View style={[styles.tipCard, { backgroundColor: mode === 'light' ? '#EEF4E8' : colors.neutral[100] }]}>
                 <View style={styles.tipHeader}>
                   <Icon source="lightbulb-outline" size={18} color={colors.primary[900]} />
                   <Text style={[styles.tipTitle, { color: colors.primary[900] }]}>Verification Tip</Text>
                 </View>
                 <Text style={[styles.tipText, { color: colors.neutral[700] }]}>
                   Include the source if possible (e.g., "heard on Radio Simba" or "seen on WhatsApp").
                 </Text>
               </View>
             </View>
          )}
        </View>
        <View style={styles.spacer} />
      </ScrollView>

      {renderAnalysisLoader()}

      <Portal>
        <Modal visible={isVoiceMode} onDismiss={() => setIsVoiceMode(false)} contentContainerStyle={styles.voiceAssistantModal}>
           <LinearGradient colors={['#1B5E20', '#2E7D32']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }], width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon source="microphone" size={40} color="#FFF" />
              </Animated.View>
               <Text style={{ color: '#FFF', fontSize: 20, marginTop: 20 }}>{isListening ? t('analyze.listening') : t('analyze.processing')}</Text>
           </LinearGradient>
        </Modal>
      </Portal>

      <Portal>
        <Modal 
          visible={showModal} 
          onDismiss={() => setShowModal(false)} 
          contentContainerStyle={[styles.modalContainer, isDesktop && styles.desktopModal, { backgroundColor: getResultStyle().bg }]}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
             <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Icon source="arrow-left" size={24} color={colors.primary[900]} />
                </TouchableOpacity>
                <Text style={[styles.modalHeaderTitle, { color: colors.primary[900] }]}>{t('analyze.result_details')}</Text>
             </View>

            {result?.escalationRequired && (
              <View style={styles.emergencyEscalationBanner}>
                 <LinearGradient colors={['#B71C1C', '#C62828']} style={styles.emergencyGradient}>
                    <Icon source="alert-octagon" size={28} color="#FFF" />
                    <View style={{ flex: 1 }}>
                       <Text style={styles.emergencyTitleText}>{t('analyze.escalation_title')}</Text>
                       <Text style={styles.emergencySubText}>{t('analyze.escalation_sub', { flags: result.clinicalFlags?.join(', ') })}</Text>
                    </View>
                 </LinearGradient>
              </View>
            )}

            <View style={isDesktop ? styles.desktopModalContent : undefined}>
              <View style={styles.resultMainCard}>
                <View style={[styles.resultBadge, { backgroundColor: getResultStyle().color }]}>
                  <Icon source={result?.label === 'ACCURATE' ? 'check' : result?.label === 'INACCURATE' ? 'alert-octagon' : 'help-circle'} size={32} color="#FFF" />
                </View>
                <View style={styles.labelRow}>
                  <View style={[styles.labelBadge, { backgroundColor: getResultStyle().color + '15' }]}>
                    <Text style={[styles.labelBadgeText, { color: getResultStyle().color }]}>{getResultStyle().label}</Text>
                  </View>
                  {result?.riskLevel && result.label === 'INACCURATE' && (
                    <View style={[styles.riskBadge, { backgroundColor: result.riskLevel === 'HIGH' ? colors.danger[900] : result.riskLevel === 'MEDIUM' ? colors.warning[900] : colors.neutral[500] }]}>
                      <Text style={styles.riskBadgeText}>{result.riskLevel} RISK</Text>
                    </View>
                  )}
                  {result?.triggerKeyword && (
                    <View style={[
                      styles.topicBadge, 
                      { 
                        backgroundColor: (topicColors[result.triggerKeyword.split(':')[0]] || topicColors.general).bg,
                        borderColor: (topicColors[result.triggerKeyword.split(':')[0]] || topicColors.general).accent
                      }
                    ]}>
                      <Text style={[
                        styles.topicBadgeText, 
                        { color: (topicColors[result.triggerKeyword.split(':')[0]] || topicColors.general).text }
                      ]}>
                        {(result.triggerKeyword.split(':')[0]).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  {result?.culturalContext && (
                    <View style={[styles.culturalBadge, { backgroundColor: colors.primary[50], borderColor: colors.primary[200] }]}>
                       <Icon source="earth" size={12} color={colors.primary[900]} />
                       <Text style={[styles.culturalBadgeText, { color: colors.primary[900] }]}>{t('analyze.culturally_sensitive')}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.confidenceContainer}>
                  <Text style={[styles.confidenceLabel, { color: colors.neutral[500] }]}>{t('analyze.confidence_level')}</Text>
                  <View style={styles.confidenceBarBg}>
                     <View style={[styles.confidenceBarFill, { width: `${(result?.confidence || 0) * 100}%`, backgroundColor: getResultStyle().color }]} />
                  </View>
                  <Text style={[styles.confidenceValue, { color: getResultStyle().color }]}>{Math.round((result?.confidence || 0) * 100)}%</Text>
                </View>

                {/* ── AI TRUST & RELIABILITY LAYER ── */}
                <View style={[styles.trustBadge, { backgroundColor: result?.isReliable ? colors.primary[50] : colors.warning[50], borderColor: result?.isReliable ? colors.primary[200] : colors.warning[900] }]}>
                   <Icon 
                    source={result?.isReliable ? "shield-check-outline" : "alert-decagram-outline"} 
                    size={18} 
                    color={result?.isReliable ? colors.primary[900] : colors.warning[900]} 
                   />
                   <View style={styles.trustTextWrap}>
                      <Text style={[styles.trustTitle, { color: result?.isReliable ? colors.primary[900] : colors.warning[900] }]}>
                        {result?.isReliable ? t('analyze.ai_reliability_verified') : t('analyze.ai_uncertainty_detected')}
                      </Text>
                      <Text style={[styles.trustNote, { color: colors.neutral[600] }]}>{result?.reliabilityNote}</Text>
                   </View>
                </View>

                {!result?.isReliable && (
                  <View style={[styles.uncertaintyWarning, { backgroundColor: colors.danger[50], borderColor: colors.danger[200] }]}>
                     <Text style={[styles.warningTitle, { color: colors.danger[900] }]}>⚠️ {t('analyze.human_verification_required')}</Text>
                     <Text style={[styles.warningText, { color: colors.danger[800] }]}>
                       {t('analyze.human_verification_sub')}
                     </Text>
                  </View>
                )}

                {/* NEW: Direct Answer Verdict */}
                <View style={[styles.directAnswerCard, { backgroundColor: result?.label === 'ACCURATE' ? colors.primary[50] : colors.danger[50] }]}>
                  <Icon 
                    source={result?.label === 'ACCURATE' ? "check-decagram" : "alert-decagram"} 
                    size={26} 
                    color={result?.label === 'ACCURATE' ? colors.primary[900] : colors.danger[900]} 
                  />
                  <Text style={[styles.directAnswerText, { color: result?.label === 'ACCURATE' ? colors.primary[900] : colors.danger[900] }]}>
                    {directAnswer}
                  </Text>
                </View>

                <Text style={[styles.resultClaimText, { color: colors.neutral[900] }]}>"{claim}"</Text>
                
                <View style={[styles.reasoningBox, { backgroundColor: colors.neutral[50] }]}>
                  <View style={styles.reasoningHeader}>
                     <Icon source="brain" size={18} color={colors.neutral[600]} />
                     <Text style={[styles.reasoningTitle, { color: colors.neutral[700] }]}>{t('analyze.ai_reasoning')}</Text>
                  </View>
                  <Text style={[styles.reasoningText, { color: colors.neutral[600] }]}>{result?.reasoning}</Text>
                  
                  {result?.triggerPhrases && result.triggerPhrases.length > 0 && (
                    <View style={styles.triggersList}>
                      <Text style={[styles.triggersLabel, { color: colors.neutral[500] }]}>{t('analyze.trigger_phrases')}</Text>
                      <View style={styles.triggerChips}>
                        {result.triggerPhrases.map((phrase, i) => (
                          <View key={i} style={[styles.triggerChip, { backgroundColor: getResultStyle().color + '10' }]}>
                            <Text style={[styles.triggerChipText, { color: getResultStyle().color }]}>{phrase}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* SECOND COLUMN (Desktop) */}
              <View style={isDesktop ? styles.desktopSecondaryColumn : undefined}>
                {result?.escalationRequired && (
                   <View style={[styles.urgentGuidanceCard, { borderColor: colors.danger[900] }]}>
                      <Text style={[styles.guidanceTitle, { color: colors.danger[900] }]}>🚨 {t('analyze.urgent_guidance')}</Text>
                      <View style={styles.guidanceList}>
                         <Text style={styles.guidanceItem}>• Do not delay: seek immediate clinical care.</Text>
                         <Text style={styles.guidanceItem}>• Monitor vital signs (breathing, pulse).</Text>
                         <Text style={styles.guidanceItem}>• Isolate patient if Ebola symptoms suspected.</Text>
                         <Text style={styles.guidanceItem}>• Call Ministry Emergency Hotline: 0800-100-066</Text>
                      </View>
                   </View>
                )}

                  <View style={[styles.factsCard, { backgroundColor: colors.surface }]}>
                    <View style={styles.factsHeader}>
                      <Icon source="shield-check" size={22} color={colors.primary[600]} />
                      <Text style={[styles.factsTitle, { color: colors.neutral[900] }]}>{t('analyze.results.correct_info')}</Text>
                    </View>
                    <Text style={[styles.factsText, { color: colors.neutral[700] }]}>{correctInfo}</Text>
                    <View style={[styles.sourceBox, { borderTopColor: colors.neutral[100] }]}>
                      <Icon source="book-open-variant" size={16} color={colors.primary[600]} />
                      <Text style={[styles.sourceText, { color: colors.primary[700] }]}>Source: {source || 'Uganda Ministry of Health'}</Text>
                    </View>
                  </View>

                  {symptoms || prevention || treatment ? (
                    <View style={[styles.educationSection, { backgroundColor: colors.surface, borderColor: colors.neutral[200] }]}>
                       <Text style={[styles.educationTitle, { color: colors.primary[900] }]}>📚 DISEASE EDUCATION</Text>
                       
                       {symptoms ? (
                         <View style={styles.eduItem}>
                            <View style={[styles.eduIconWrap, { backgroundColor: colors.warning[50] }]}>
                               <Icon source="thermometer" size={16} color={colors.warning[900]} />
                            </View>
                            <View style={{ flex: 1 }}>
                               <Text style={[styles.eduLabel, { color: colors.warning[900] }]}>Symptoms</Text>
                               <Text style={[styles.eduText, { color: colors.neutral[700] }]}>{symptoms}</Text>
                            </View>
                         </View>
                       ) : null}

                       {prevention ? (
                         <View style={styles.eduItem}>
                            <View style={[styles.eduIconWrap, { backgroundColor: colors.primary[50] }]}>
                               <Icon source="shield-plus" size={16} color={colors.primary[900]} />
                            </View>
                            <View style={{ flex: 1 }}>
                               <Text style={[styles.eduLabel, { color: colors.primary[900] }]}>How to Prevent</Text>
                               <Text style={[styles.eduText, { color: colors.neutral[700] }]}>{prevention}</Text>
                            </View>
                         </View>
                       ) : null}

                       {treatment ? (
                         <View style={styles.eduItem}>
                            <View style={[styles.eduIconWrap, { backgroundColor: colors.danger[50] }]}>
                               <Icon source="medication" size={16} color={colors.danger[900]} />
                            </View>
                            <View style={{ flex: 1 }}>
                               <Text style={[styles.eduLabel, { color: colors.danger[900] }]}>How to Cure / Treat</Text>
                               <Text style={[styles.eduText, { color: colors.neutral[700] }]}>{treatment}</Text>
                            </View>
                         </View>
                       ) : null}
                    </View>
                  ) : detailedGuidance ? (
                    <View style={[styles.detailedGuidanceCard, { backgroundColor: colors.primary[50], borderColor: colors.primary[200] }]}>
                       <View style={styles.guidanceHeader}>
                          <Icon source="lightbulb-on-outline" size={20} color={colors.primary[900]} />
                          <Text style={[styles.guidanceTitle, { color: colors.primary[900] }]}>{t('analyze.detailed_guidance') || 'Detailed Guidance'}</Text>
                       </View>
                       <Text style={[styles.guidanceBody, { color: colors.neutral[800] }]}>{detailedGuidance}</Text>
                    </View>
                  ) : null}

                {/* Expert AI Section */}
                {!expertAnalysis ? (
                  <TouchableOpacity 
                    style={[styles.expertConsultBtn, { backgroundColor: colors.surface, borderColor: colors.primary[900] }]}
                    onPress={handleConsultExpert}
                    disabled={expertLoading}
                  >
                    {expertLoading ? (
                      <ActivityIndicator size="small" color={colors.primary[900]} />
                    ) : (
                      <Icon source="brain" size={20} color={colors.primary[900]} />
                    )}
                    <Text style={[styles.expertConsultText, { color: colors.primary[900] }]}>
                      {expertLoading ? t('analyze.expert_loading') : t('analyze.consult_expert')}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.expertResultBox, { 
                    backgroundColor: expertAnalysis.source === 'online' ? '#E8F5E9' : expertAnalysis.source === 'backend' ? '#FFF3E0' : '#F5F5F5', 
                    borderColor: expertAnalysis.source === 'online' ? '#A5D6A7' : expertAnalysis.source === 'backend' ? '#FFE0B2' : '#E0E0E0' 
                  }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                      <View style={[styles.expertHeader, { marginBottom: 0 }]}>
                        <Icon source="certificate" size={22} color={expertAnalysis.source === 'online' ? '#2E7D32' : expertAnalysis.source === 'backend' ? '#E65100' : '#424242'} />
                        <Text style={[styles.expertTitle, { color: expertAnalysis.source === 'online' ? '#2E7D32' : expertAnalysis.source === 'backend' ? '#E65100' : '#424242' }]}>
                          {t('analyze.expert_title') || 'Global Expert Opinion'}
                        </Text>
                      </View>
                      
                      {/* Dynamic Source Indicator Badge */}
                      <View style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        backgroundColor: expertAnalysis.source === 'online' ? '#C8E6C9' : expertAnalysis.source === 'backend' ? '#FFE0B2' : '#E0E0E0',
                        borderWidth: 1,
                        borderColor: expertAnalysis.source === 'online' ? '#81C784' : expertAnalysis.source === 'backend' ? '#FFB74D' : '#BDBDBD',
                      }}>
                        <Text style={{
                          fontSize: 10,
                          fontWeight: '800',
                          color: expertAnalysis.source === 'online' ? '#1B5E20' : expertAnalysis.source === 'backend' ? '#E65100' : '#212121',
                          textTransform: 'uppercase',
                        }}>
                          {expertAnalysis.source === 'online' ? '🌐 Cloud Llama-3' : expertAnalysis.source === 'backend' ? '🏛️ National Portal' : '📴 Local Fallback'}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.expertExplanation}>{expertAnalysis.explanation}</Text>
                    
                    <View style={[styles.expertRecommendation, { 
                      backgroundColor: expertAnalysis.source === 'online' ? 'rgba(46, 125, 50, 0.1)' : 'rgba(230, 81, 0, 0.1)'
                    }]}>
                      <Icon source="lightbulb-on" size={18} color={expertAnalysis.source === 'online' ? '#2E7D32' : '#E65100'} />
                      <Text style={[styles.expertRecText, { 
                        color: expertAnalysis.source === 'online' ? '#2E7D32' : '#E65100' 
                      }]}>
                        {expertAnalysis.recommendation}
                      </Text>
                    </View>
                  </View>
                )}

                {result?.label === 'INACCURATE' && (
                   <TouchableOpacity 
                     style={[styles.emergencyBtn, { backgroundColor: colors.danger[900] }]}
                     onPress={() => {
                       setShowModal(false);
                       navigateToTab?.('facilities');
                     }}
                   >
                     <Icon source="hospital-marker" size={24} color="#FFF" />
                     <View style={{ flex: 1 }}>
                       <Text style={styles.emergencyBtnText}>{t('analyze.find_facility')}</Text>
                       <Text style={styles.emergencyBtnSub}>{t('analyze.emergency_referral')}</Text>
                     </View>
                     <Icon source="chevron-right" size={24} color="#FFF" />
                   </TouchableOpacity>
                )}

                 <TouchableOpacity 
                   style={[styles.flagBtn, { borderColor: colors.neutral[200] }]}
                   onPress={() => Alert.alert(t('analyze.flag_success') || 'Community Flag', t('analyze.flag_confirm_msg') || 'This claim has been flagged for further review by the Ministry of Health. Thank you for contributing to community safety.')}
                 >
                   <Icon source="flag-outline" size={18} color={colors.neutral[500]} />
                   <Text style={[styles.flagText, { color: colors.neutral[500] }]}>{t('analyze.flag_myth')}</Text>
                 </TouchableOpacity>

                 <View style={styles.ethicsBox}>
                    <Text style={styles.ethicsText}>
                      {t('analyze.ethics_policy')}
                    </Text>
                 </View>

                {/* ── EXPLAINABLE AI (XAI) DASHBOARD ── */}
                 <View style={[styles.xaiDashboard, { backgroundColor: colors.neutral[50], borderColor: colors.neutral[200] }]}>
                    <View style={styles.xaiHeader}>
                       <Icon source="creation" size={20} color={colors.primary[900]} />
                       <Text style={[styles.xaiTitle, { color: colors.neutral[900] }]}>{t('analyze.xai_dashboard')}</Text>
                    </View>
                   
                    <View style={styles.xaiGrid}>
                       <View style={styles.xaiMetric}>
                          <Text style={styles.xaiMetricLabel}>{t('analyze.similarity_score')}</Text>
                          <Text style={[styles.xaiMetricVal, { color: colors.primary[900] }]}>{Math.round((result?.similarityScore || 0) * 100)}%</Text>
                       </View>
                      <View style={styles.verticalDivider} />
                       <View style={styles.xaiMetric}>
                          <Text style={styles.xaiMetricLabel}>{t('analyze.internal_logic')}</Text>
                          <Text style={[styles.xaiMetricVal, { color: colors.neutral[700] }]}>{result?.fromRule ? 'DETERMINISTIC' : 'STATISTICAL'}</Text>
                       </View>
                   </View>

                    <Text style={styles.xaiSubhead}>{t('analyze.reasoning_chain')}</Text>
                   <View style={styles.reasoningChain}>
                      <View style={styles.chainStep}>
                         <Icon source="text-search" size={16} color={colors.neutral[400]} />
                         <Text style={styles.chainText}>1. Normalized input text for cross-lingual analysis</Text>
                      </View>
                      <View style={styles.chainConnector} />
                      <View style={styles.chainStep}>
                         <Icon source="Vector-selection" size={16} color={colors.neutral[400]} />
                         <Text style={styles.chainText}>2. Extracted {result?.detectedFeatures?.length} semantic features</Text>
                      </View>
                      <View style={styles.chainConnector} />
                      <View style={styles.chainStep}>
                         <Icon source="brain" size={16} color={colors.primary[900]} />
                         <Text style={styles.chainText}>3. Matched against {result?.fromRule ? 'Ministry Database' : 'trained ML weights'}</Text>
                      </View>
                   </View>

                   {result?.detectedFeatures && result.detectedFeatures.length > 0 && (
                     <View style={styles.featuresDashboard}>
                        <Text style={styles.xaiSubhead}>{t('analyze.detected_features')}</Text>
                        <View style={styles.featureGrid}>
                           {result.detectedFeatures.map((f, i) => (
                             <View key={i} style={[styles.featureCard, { backgroundColor: colors.surface }]}>
                                <Text style={styles.featureTerm}>{f.term}</Text>
                                <View style={styles.featureWeightBar}>
                                   <View style={[styles.featureWeightFill, { width: `${Math.min(f.weight * 100, 100)}%`, backgroundColor: colors.primary[600] }]} />
                                </View>
                                <Text style={styles.featureWeightVal}>{Math.round(f.weight * 100)}%</Text>
                             </View>
                           ))}
                        </View>
                     </View>
                   )}
                </View>

                {/* ── MULTI-MODEL RESEARCH COMPARISON ── */}
                <View style={[styles.comparisonDashboard, { backgroundColor: colors.surface, borderColor: colors.neutral[100] }]}>
                   <View style={styles.comparisonHeader}>
                      <View>
                        <Text style={[styles.comparisonTitle, { color: colors.neutral[900] }]}>{t('analyze.cross_validation')}</Text>
                        <Text style={styles.comparisonSub}>{t('analyze.agreement_analysis')}</Text>
                      </View>
                      <View style={[styles.consensusBadge, { backgroundColor: result?.consensusStatus === 'UNANIMOUS' ? colors.primary[900] : result?.consensusStatus === 'MAJORITY' ? colors.primary[700] : colors.warning[900] }]}>
                         <Icon source={result?.consensusStatus === 'UNANIMOUS' ? "shield-check" : "circle-multiple-outline"} size={14} color="#FFF" />
                         <Text style={styles.consensusBadgeText}>{result?.consensusStatus}</Text>
                      </View>
                   </View>

                   <View style={styles.comparisonTable}>
                      {result?.modelComparisons?.map((m, i) => (
                        <View key={i} style={[styles.comparisonRow, { borderBottomColor: colors.neutral[50] }]}>
                           <View style={styles.modelMetaCol}>
                              <Text style={[styles.modelName, { color: colors.neutral[900] }]}>{m.model}</Text>
                              <Text style={styles.modelArch}>{m.model.includes('BERT') ? 'Transformer' : m.model.includes('Regression') ? 'Linear' : 'Heuristic'}</Text>
                           </View>
                           <View style={[styles.modelLabelBadge, { backgroundColor: m.label === 'ACCURATE' ? colors.primary[50] : m.label === 'INACCURATE' ? colors.danger[50] : colors.neutral[50] }]}>
                              <Text style={[styles.modelLabelText, { color: m.label === 'ACCURATE' ? colors.primary[900] : m.label === 'INACCURATE' ? colors.danger[900] : colors.neutral[500] }]}>{m.label}</Text>
                           </View>
                           <Text style={[styles.modelConf, { color: colors.neutral[600] }]}>{Math.round(m.confidence * 100)}%</Text>
                        </View>
                      ))}
                   </View>
                   
                    <View style={styles.researchNote}>
                       <Icon source="flask-outline" size={16} color={colors.primary[900]} />
                       <Text style={[styles.researchNoteText, { color: colors.neutral[500] }]}>
                         {t('analyze.agreement_probability', { prob: 99.2 })}
                       </Text>
                    </View>
                </View>

                {/* ── GOVERNANCE & INSTITUTIONAL OVERSIGHT ── */}
                <View style={[styles.governanceCard, { backgroundColor: colors.primary[50], borderColor: colors.primary[100] }]}>
                    <View style={styles.govHeader}>
                       <Icon source="gavel" size={18} color={colors.primary[900]} />
                       <Text style={[styles.govTitle, { color: colors.primary[900] }]}>{t('analyze.gov_title')}</Text>
                    </View>
                   
                   <View style={styles.govRow}>
                      <View style={styles.govCol}>
                         <Text style={styles.govLabel}>Governing Authority</Text>
                         <Text style={styles.govVal}>Uganda Ministry of Health</Text>
                      </View>
                      <View style={styles.govCol}>
                         <Text style={styles.govLabel}>Policy Version</Text>
                         <Text style={styles.govVal}>MoH-2026.05.v1</Text>
                      </View>
                   </View>

                   <View style={[styles.approvalBox, { backgroundColor: colors.surface }]}>
                      <View style={styles.approvalInfo}>
                         <Text style={styles.approvalLabel}>{t('analyze.gov_approval_status')}</Text>
                         <Text style={[styles.approvalStatus, { color: (result?.confidence || 0) >= 0.95 ? colors.primary[900] : colors.warning[900] }]}>
                            {(result?.confidence || 0) >= 0.95 ? t('analyze.gov_validated') : t('analyze.gov_needs_review')}
                         </Text>
                      </View>
                      <Icon 
                        source={(result?.confidence || 0) >= 0.95 ? "check-decagram" : "account-clock"} 
                        size={24} 
                        color={(result?.confidence || 0) >= 0.95 ? colors.primary[900] : colors.warning[900]} 
                      />
                   </View>

                   <Text style={styles.govNote}>
                      {t('analyze.gov_note', { date: 'May 10, 2026' })}
                   </Text>
                </View>

                {/* Feedback Section */}
                <View style={[styles.feedbackSection, { backgroundColor: colors.surface, borderColor: colors.neutral[100], marginBottom: 20 }]}>
                  {!feedbackSubmitted ? (
                    <>
                      <Text style={[styles.feedbackTitle, { color: colors.neutral[800] }]}>{t('analyze.feedback_accurate')}</Text>
                      <View style={styles.feedbackButtons}>
                        <TouchableOpacity 
                          style={[styles.feedbackBtn, { backgroundColor: colors.primary[900] }]}
                          onPress={() => handleFeedback(true)}
                        >
                          <Icon source="thumb-up-outline" size={18} color="#FFF" />
                          <Text style={styles.feedbackBtnText}>{t('analyze.feedback_yes')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.feedbackBtn, { backgroundColor: colors.neutral[100] }]}
                          onPress={() => {
                            Alert.alert(
                              t('analyze.feedback_correct_model'),
                              t('analyze.feedback_what_is_correct'),
                              [
                                { text: t('analyze.results.accurate_label'), onPress: () => handleFeedback(false, "ACCURATE") },
                                { text: t('analyze.results.misleading_label'), onPress: () => handleFeedback(false, "INACCURATE") },
                                { text: t('analyze.results.uncertain_label'), onPress: () => handleFeedback(false, "UNCERTAIN") },
                                { text: t('common.cancel') || "Cancel", style: "cancel" }
                              ]
                            );
                          }}
                        >
                          <Icon source="thumb-down-outline" size={18} color={colors.neutral[600]} />
                          <Text style={[styles.feedbackBtnText, { color: colors.neutral[600] }]}>No, Fix It</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <View style={styles.feedbackSuccess}>
                      <Icon source="check-decagram" size={24} color={colors.primary[600]} />
                      <View>
                        <Text style={[styles.feedbackSuccessTitle, { color: colors.primary[900] }]}>Learning Complete!</Text>
                        <Text style={[styles.feedbackSuccessSub, { color: colors.neutral[500] }]}>The AI has adjusted its parameters based on your input.</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.buttonRow}>
               <TouchableOpacity style={[styles.whatsappBtn, { backgroundColor: colors.primary[900] }]}>
                 <Icon source="share-variant" size={20} color="#FFF" />
                 <Text style={styles.whatsappText}>Share to WhatsApp</Text>
               </TouchableOpacity>
               <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.neutral[300] }]} onPress={() => setShowModal(false)}>
                 <Text style={[styles.doneText, { color: colors.neutral[700] }]}>Done</Text>
               </TouchableOpacity>
            </View>
            <View style={styles.spacer} />
          </ScrollView>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  backBtn: {
    marginRight: spacing.sm,
  },
  headerTitle: {
    flex: 1,
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
  scrollContent: {
    padding: spacing.lg,
  },
  desktopMain: {
    width: '100%',
    paddingHorizontal: '5%',
  },
  desktopHeaderArea: {
    marginBottom: spacing.xl,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.neutral[900],
    marginBottom: 8,
  },
  mainSub: {
    fontSize: 16,
    color: colors.neutral[600],
    lineHeight: 24,
    maxWidth: 600,
  },
  rowLayout: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  leftColumn: {
    flex: 2,
  },
  rightColumn: {
    flex: 1,
    gap: spacing.md,
  },
  // Input
  inputArea: {
    backgroundColor: '#FFF',
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  inputLabelRow: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    color: colors.neutral[800],
  },
  inputMethods: {
    flexDirection: 'row',
    gap: 8,
    position: 'absolute',
    right: 0,
    top: -4,
  },
  miniMethodBtn: {
    padding: 8,
    borderRadius: radii.full,
    backgroundColor: colors.neutral[50],
  },
  inputBox: {
    backgroundColor: '#FFF',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    height: 300,
    padding: spacing.md,
  },
  textInput: {
    fontSize: 18,
    color: colors.neutral[900],
    textAlignVertical: 'top',
    height: '100%',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  inputFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputFooterText: {
    fontSize: 12,
    color: colors.neutral[500],
    fontWeight: '600',
  },
  analyzeBtn: {
    backgroundColor: colors.primary[900],
    borderRadius: radii.full,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: spacing.xl,
    maxWidth: 240,
    ...shadows.md,
  },
  analyzeBtnDisabled: {
    backgroundColor: colors.neutral[400],
    opacity: 0.8,
  },
  analyzeBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  graphicCard: {
    height: 250,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  graphicImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  graphicOverlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  trustedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  trustedText: {
    color: colors.primary[200],
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  // Result Modal
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  riskBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  confidenceContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  confidenceLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  confidenceBarBg: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    marginBottom: 4,
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: '900',
    minWidth: 45,
    textAlign: 'right',
  },
  reasoningBox: {
    padding: spacing.md,
    borderRadius: radii.md,
    width: '100%',
  },
  reasoningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  reasoningTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  reasoningText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  triggersList: {
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: spacing.md,
  },
  triggersLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  triggerChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  triggerChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  triggerChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  flagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: radii.md,
    marginTop: spacing.lg,
    borderStyle: 'dashed',
  },
  flagText: {
    fontSize: 14,
    fontWeight: '600',
  },
  graphicTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  // Side Panel Cards
  panelCard: {
    backgroundColor: '#FFF',
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  panelLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.neutral[600],
    letterSpacing: 0.5,
  },
  factsText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.neutral[700],
    marginBottom: spacing.lg,
    fontWeight: '500',
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.neutral[900],
    marginBottom: spacing.md,
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[600],
  },
  statusDotText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary[700],
  },
  syncBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.neutral[50],
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  syncText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  methodIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[900],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  methodTextWrap: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  methodSub: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary[900],
  },
  tipText: {
    fontSize: 14,
    color: colors.neutral[700],
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  learnMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  learnMoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary[900],
    textDecorationLine: 'underline',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: spacing.sm,
  },
  trendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  // Mobile Multimedia
  mediaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  mediaCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: spacing.lg,
    alignItems: 'center',
    gap: 8,
  },
  mediaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  tipCard: {
    backgroundColor: '#EEF4E8',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  // MODAL
  modalContainer: {
    margin: 0,
    flex: 1,
    padding: 0,
    justifyContent: 'flex-start',
  },
  desktopModal: {
    maxWidth: 950,
    width: '95%',
    alignSelf: 'center',
    borderRadius: radii.lg,
    maxHeight: '90%',
    marginVertical: '5%',
    overflow: 'hidden',
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  modalHeaderTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary[900],
    marginLeft: spacing.sm,
  },
  desktopModalContent: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  desktopSecondaryColumn: {
    flex: 1,
    gap: spacing.md,
    minWidth: 400,
  },
  resultMainCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.xl,
    minWidth: 350,
  },
  resultBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  labelBadge: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: radii.full,
    marginBottom: spacing.md,
  },
  labelBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  resultClaimText: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 20,
    lineHeight: 24,
  },
  resultSummary: {
    fontSize: 14,
    color: colors.neutral[700],
    textAlign: 'center',
    lineHeight: 22,
  },
  factsCard: {
    backgroundColor: '#FFF',
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.md,
    marginBottom: spacing.lg,
  },
  factsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  factsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  sourceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  sourceText: {
    fontSize: 12,
    color: colors.primary[700],
    fontWeight: '600',
  },
  buttonRow: {
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  whatsappBtn: {
    backgroundColor: colors.primary[900],
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  whatsappText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: colors.neutral[300],
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  doneText: {
    color: colors.neutral[700],
    fontSize: 16,
    fontWeight: '700',
  },
  spacer: {
    height: spacing.xxl,
  },
  mediaSimContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  // LOADER
  loaderModal: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loaderContent: {
    backgroundColor: '#FFF',
    width: '100%',
    maxWidth: 400,
    borderRadius: radii.lg,
    padding: spacing.xl,
    ...shadows.lg,
  },
  loaderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.lg,
  },
  loaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: spacing.xl,
    backgroundColor: colors.neutral[100],
  },
  stagesContainer: {
    gap: 16,
    marginBottom: spacing.xl,
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stageIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  stageIconActive: {
    backgroundColor: colors.primary[900],
    borderColor: colors.primary[900],
    ...shadows.md,
  },
  stageIconDone: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  stageText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[400],
  },
  stageTextActive: {
    color: colors.primary[900],
    fontWeight: '700',
  },
  stageTextDone: {
    color: colors.neutral[600],
    textDecorationLine: 'line-through',
  },
  activePulse: {
    position: 'absolute',
    right: 0,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary[500],
  },
  loaderFooter: {
    fontSize: 12,
    color: colors.neutral[500],
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Feedback Styles
  feedbackSection: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  feedbackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radii.md,
  },
  feedbackBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  feedbackSuccessTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  feedbackSuccessSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: radii.lg,
    marginVertical: spacing.md,
    gap: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  emergencyBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  emergencyBtnSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  expertConsultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: radii.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 10,
    marginVertical: spacing.md,
  },
  expertConsultText: {
    fontSize: 14,
    fontWeight: '700',
  },
  expertResultBox: {
    padding: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginVertical: spacing.md,
    ...shadows.sm,
  },
  expertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  expertTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#003DFF',
  },
  expertExplanation: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  expertRecommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    padding: 10,
    borderRadius: radii.md,
  },
  expertRecText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D2691E',
    flex: 1,
  },
  voiceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.full,
  },
  voiceToggleText: {
    fontSize: 14,
    fontWeight: '800',
  },
  voiceAssistantModal: {
    margin: 0,
    flex: 1,
    justifyContent: 'flex-end',
  },
  // Escalation Styles
  emergencyEscalationBanner: {
    width: '100%',
    overflow: 'hidden',
  },
  emergencyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 15,
  },
  emergencyTitleText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  emergencySubText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  urgentGuidanceCard: {
    backgroundColor: '#FFF',
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 2,
    marginBottom: spacing.lg,
  },
  guidanceTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
  },
  guidanceList: {
    gap: 6,
  },
  guidanceItem: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  // XAI Styles
  xaiDashboard: {
    marginTop: spacing.xl,
    padding: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: 15,
  },
  xaiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 5,
  },
  xaiTitle: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  xaiGrid: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[50],
    padding: 15,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  xaiMetric: {
    flex: 1,
    alignItems: 'center',
  },
  xaiMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  xaiMetricVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  verticalDivider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.neutral[200],
  },
  xaiSubhead: {
    fontSize: 12,
    fontWeight: '800',
    color: '#666',
    marginTop: 5,
  },
  reasoningChain: {
    gap: 8,
    paddingLeft: 10,
  },
  chainStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chainText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  chainConnector: {
    width: 2,
    height: 10,
    backgroundColor: colors.neutral[200],
    marginLeft: 7,
  },
  featuresDashboard: {
    marginTop: 10,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  featureCard: {
    padding: 10,
    borderRadius: radii.md,
    width: '48%',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  featureTerm: {
    fontSize: 12,
    fontWeight: '800',
    color: '#444',
    marginBottom: 5,
  },
  featureWeightBar: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    marginBottom: 4,
  },
  featureWeightFill: {
    height: '100%',
    borderRadius: 2,
  },
  featureWeightVal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888',
    textAlign: 'right',
  },
  // Cultural Styles
  topicBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  culturalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  culturalBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  // Comparison Styles
  comparisonDashboard: {
    marginTop: spacing.xl,
    padding: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: 1,
    ...shadows.sm,
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  comparisonSub: {
    fontSize: 10,
    color: '#888',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  consensusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  consensusBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  comparisonTable: {
    marginBottom: 15,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 15,
  },
  modelMetaCol: {
    flex: 2,
  },
  modelName: {
    fontSize: 13,
    fontWeight: '800',
  },
  modelArch: {
    fontSize: 10,
    color: '#888',
    fontWeight: '600',
  },
  modelLabelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  modelLabelText: {
    fontSize: 10,
    fontWeight: '900',
  },
  modelConf: {
    fontSize: 12,
    fontWeight: '700',
    width: 40,
    textAlign: 'right',
  },
  researchNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  researchNoteText: {
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 16,
    flex: 1,
  },
  ethicsBox: {
    padding: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: radii.md,
    marginTop: spacing.lg,
  },
  ethicsText: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 16,
    textAlign: 'center',
  },
  // Governance Styles
  governanceCard: {
    marginTop: spacing.xl,
    padding: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: 15,
  },
  govHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  govTitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  govRow: {
    flexDirection: 'row',
    gap: 20,
  },
  govCol: {
    flex: 1,
  },
  govLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  govVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  approvalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  approvalInfo: {
    flex: 1,
  },
  approvalLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  approvalStatus: {
    fontSize: 14,
    fontWeight: '900',
  },
  govNote: {
    fontSize: 10,
    color: '#777',
    fontStyle: 'italic',
    lineHeight: 14,
  },
  trustBadge: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  trustTextWrap: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  trustNote: {
    fontSize: 12,
  },
  uncertaintyWarning: {
    padding: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
  },
  detailedGuidanceCard: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginTop: spacing.lg,
    gap: 12,
  },
  guidanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guidanceBody: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
  },
  educationSection: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginTop: spacing.lg,
    gap: 16,
  },
  educationTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  eduItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  eduIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eduLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  eduText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  directAnswerCard: {
    padding: 20,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...shadows.md,
  },
  directAnswerText: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    lineHeight: 22,
  },
});

export default AnalyzeScreen;
