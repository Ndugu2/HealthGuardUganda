import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, Icon, Button, Checkbox, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import * as Speech from 'expo-speech';
import { spacing, radii, shadows, gradients } from '../theme';
import { useAppTheme } from '../ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedCard from '../components/AnimatedCard';

interface TriageQuestion {
  id: string;
  label: string;
  label_lg: string;
  isRedFlag: boolean;
}

const TRIAGE_QUESTIONS: TriageQuestion[] = [
  // Emergency Red Flags
  { id: 'convulsions', label: 'Convulsions, fitting or fits', label_lg: 'Okugwa eddalu oba okwebagala', isRedFlag: true },
  { id: 'lethargy', label: 'Lethargic, unconscious, or difficult to wake', label_lg: 'Okuba nga mukoowu nnyo, atategereka oba azirikidde', isRedFlag: true },
  { id: 'vomiting', label: 'Vomiting everything (cannot keep any fluids down)', label_lg: 'Okusesema buli kintu ky\'anywa oba ky\'alya', isRedFlag: true },
  { id: 'drinking', label: 'Inability to drink, suckle, or breastfeed', label_lg: 'Okulemererwa okunywa oba okuyonka', isRedFlag: true },
  { id: 'breathing_severe', label: 'Severe difficulty breathing (chest in-drawing or grunting)', label_lg: 'Okulemererwa okussa mu ngeri ey\'amaanyi', isRedFlag: true },
  
  // Moderate Symptoms
  { id: 'fever', label: 'High fever (hot body temperature) for more than 2 days', label_lg: 'Omusujja gw\'ensiri ogw\'amaanyi (emmeeme okwokya) okumala ennaku 2+', isRedFlag: false },
  { id: 'diarrhea', label: 'Frequent watery diarrhea (sunken eyes, high thirst)', label_lg: 'Okuddukana amazzi amangi (amaaso okugwa munda, ennyonta ey\'amaanyi)', isRedFlag: false },
  { id: 'blood_stool', label: 'Blood in stool (Dysentery)', label_lg: 'Okuddukana omusaayi', isRedFlag: false },
  { id: 'cough', label: 'Persistent cough or rapid breathing', label_lg: 'Ekifuba ekisinga oba okussa okw\'angu', isRedFlag: false },
];

export const SymptomTriageScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();

  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [triageResult, setTriageResult] = useState<'RED' | 'YELLOW' | 'GREEN' | null>(null);
  const [speaking, setSpeaking] = useState(false);

  const toggleAnswer = (id: string) => {
    setSelectedAnswers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleEvaluate = () => {
    const hasRedFlag = TRIAGE_QUESTIONS.some(
      q => q.isRedFlag && selectedAnswers.includes(q.id)
    );

    const hasModerate = TRIAGE_QUESTIONS.some(
      q => !q.isRedFlag && selectedAnswers.includes(q.id)
    );

    if (hasRedFlag) {
      setTriageResult('RED');
    } else if (hasModerate) {
      setTriageResult('YELLOW');
    } else {
      setTriageResult('GREEN');
    }
  };

  const handleReset = () => {
    setSelectedAnswers([]);
    setTriageResult(null);
    Speech.stop();
    setSpeaking(false);
  };

  const speakInstructions = () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }

    const isLuganda = i18n.language === 'lg';
    let text = '';

    if (triageResult === 'RED') {
      text = isLuganda
        ? "Wano waliwo akatyabaga! Twala omulwadde mu ddwaliro amangu ddala. Leka okumupa eddagala lya kunywa ssinga azirikidde. Kuba essimu ya ambulance 911 oba minisitule y'obulamu."
        : "Emergency alert! Refer the patient to the nearest hospital immediately. Do not give oral medication if unconscious. Call ambulance line 911 or the maternal health line.";
    } else if (triageResult === 'YELLOW') {
      text = isLuganda
        ? "Ebyobulamu bya mulwadde byetaaga okukeberebwa. Genda ku clinic oba health centre leero kwesalira Malaria oba Diarrhea. Nywa ORS."
        : "Clinic visit recommended. Visit a local health facility today for formal diagnosis. Check for malaria or dehydration.";
    } else if (triageResult === 'GREEN') {
      text = isLuganda
        ? "Omulwadde asobola okwejjanjaba ewaka. Nywa amazzi agasebulule oba ORS. Fuba okusulira mu katimba k'ensiri era webale we wumule."
        : "Home care is safe. Stay hydrated with boiled water or ORS, rest, and sleep under a treated net. Monitor temperature closely.";
    } else {
      text = isLuganda
        ? "Kebera obubonero buli wamu. Nyiga ku kabonero okukebera."
        : "Check symptoms carefully to determine risk level. Press check boxes to start.";
    }

    setSpeaking(true);
    Speech.speak(text, {
      language: isLuganda ? 'sw' : 'en',
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.neutral[900] }]}>Offline Symptom Triage</Text>
      <Text style={[styles.subtitle, { color: colors.neutral[500] }]}>
        Answer these questions carefully to determine the urgency of your patient's symptoms.
      </Text>

      {triageResult === null ? (
        /* Questionnaire View */
        <>
          <Text style={styles.sectionTitle}>Emergency Warning Signs (Red Flags)</Text>
          {TRIAGE_QUESTIONS.filter(q => q.isRedFlag).map(q => {
            const checked = selectedAnswers.includes(q.id);
            return (
              <TouchableOpacity
                key={q.id}
                style={[styles.checkboxRow, { backgroundColor: colors.surface }, checked && styles.redSelected]}
                onPress={() => toggleAnswer(q.id)}
              >
                <Checkbox.Android
                  status={checked ? 'checked' : 'unchecked'}
                  onPress={() => toggleAnswer(q.id)}
                  color="#E53E3E"
                />
                <Text style={styles.checkboxLabel}>
                  {i18n.language === 'lg' ? q.label_lg : q.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Other Common Symptoms</Text>
          {TRIAGE_QUESTIONS.filter(q => !q.isRedFlag).map(q => {
            const checked = selectedAnswers.includes(q.id);
            return (
              <TouchableOpacity
                key={q.id}
                style={[styles.checkboxRow, { backgroundColor: colors.surface }, checked && styles.yellowSelected]}
                onPress={() => toggleAnswer(q.id)}
              >
                <Checkbox.Android
                  status={checked ? 'checked' : 'unchecked'}
                  onPress={() => toggleAnswer(q.id)}
                  color="#D69E2E"
                />
                <Text style={styles.checkboxLabel}>
                  {i18n.language === 'lg' ? q.label_lg : q.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          <Button
            mode="contained"
            buttonColor={colors.primary[900]}
            textColor="#FFF"
            style={styles.evaluateBtn}
            onPress={handleEvaluate}
          >
            Check Triage Level
          </Button>
        </>
      ) : (
        /* Result View */
        <AnimatedCard delay={50} style={styles.resultCard}>
          {triageResult === 'RED' && (
            <LinearGradient colors={['#FF8A8A', '#E53E3E']} style={styles.resultGradient}>
              <Icon source="alert-octagon" size={48} color="#FFF" />
              <Text style={styles.resultTitle}>RED - EMERGENCY REFERRAL</Text>
              <Text style={styles.resultDesc}>
                {i18n.language === 'lg'
                  ? 'Twala omulwadde mu ddwaliro erisinganye okumpi amangu ddala! Obubonero buno bulaga nti obulamu buli mu kabenje.'
                  : 'Refer the patient immediately to the nearest hospital! The symptoms selected are critical and require professional emergency attention.'}
              </Text>
              
              <Divider style={styles.resultDivider} />
              
              <Text style={styles.instructionsHeader}>Critical Steps:</Text>
              <Text style={styles.stepText}>• Secure transport immediately.</Text>
              <Text style={styles.stepText}>• Do not give foods or liquids if patient is lethargic or vomiting continuously.</Text>
              <Text style={styles.stepText}>• Keep patient in a recovery position (on their side) if unconscious.</Text>
            </LinearGradient>
          )}

          {triageResult === 'YELLOW' && (
            <LinearGradient colors={['#F6AD55', '#DD6B20']} style={styles.resultGradient}>
              <Icon source="hospital-building" size={48} color="#FFF" />
              <Text style={styles.resultTitle}>YELLOW - VISIT CLINIC</Text>
              <Text style={styles.resultDesc}>
                {i18n.language === 'lg'
                  ? 'Genda okulaba omusawo ku clinic oba ddowaliro eriri okumpi leero. Kikulu okukebera omusujja ne diarrhea.'
                  : 'Please visit a clinic or local health facility today. Diagnosis is required to test for malaria, pneumonia, or treat dehydration.'}
              </Text>

              <Divider style={styles.resultDivider} />

              <Text style={styles.instructionsHeader}>Next Steps:</Text>
              <Text style={styles.stepText}>• Keep patient hydrated using Oral Rehydration Salts (ORS).</Text>
              <Text style={styles.stepText}>• Never self-medicate with antibiotics without diagnostic tests.</Text>
              <Text style={styles.stepText}>• Sleep under a net to prevent further mosquito transmissions.</Text>
            </LinearGradient>
          )}

          {triageResult === 'GREEN' && (
            <LinearGradient colors={['#68D391', '#38A169']} style={styles.resultGradient}>
              <Icon source="home-heart" size={48} color="#FFF" />
              <Text style={styles.resultTitle}>GREEN - HOME MANAGEMENT</Text>
              <Text style={styles.resultDesc}>
                {i18n.language === 'lg'
                  ? 'Kyakala okulabirira omulwadde ewaka. Fuba okumuwa ebizigo, ORS, era yeewummule bulungi.'
                  : 'Safe to manage at home. Monitor the patient’s status closely, ensure proper hydration, rest, and check temperature regularly.'}
              </Text>

              <Divider style={styles.resultDivider} />

              <Text style={styles.instructionsHeader}>Home Care Advice:</Text>
              <Text style={styles.stepText}>• Administer Paracetamol if fever is present (on advice of health worker).</Text>
              <Text style={styles.stepText}>• Give plenty of fluids (boiled water, soup, breastmilk).</Text>
              <Text style={styles.stepText}>• If symptoms worsen or a red-flag warning appears, go to a clinic immediately.</Text>
            </LinearGradient>
          )}

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.soundBtn} onPress={speakInstructions}>
              <Icon source={speaking ? 'volume-high' : 'volume-medium'} size={24} color={colors.primary[900]} />
              <Text style={[styles.soundBtnText, { color: colors.primary[900] }]}>
                {speaking ? 'Stop Reading' : 'Listen Instructions'}
              </Text>
            </TouchableOpacity>

            <Button
              mode="contained"
              buttonColor={colors.neutral[800]}
              textColor="#FFF"
              onPress={handleReset}
              style={{ borderRadius: radii.full }}
            >
              Check Again
            </Button>
          </View>
        </AnimatedCard>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radii.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  redSelected: {
    borderColor: '#FEB2B2',
    backgroundColor: '#FFF5F5',
  },
  yellowSelected: {
    borderColor: '#FEEBC8',
    backgroundColor: '#FFFDF5',
  },
  evaluateBtn: {
    marginTop: spacing.lg,
    borderRadius: radii.full,
    paddingVertical: 4,
  },

  // Results styling
  resultCard: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  resultGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  resultTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  resultDesc: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  resultDivider: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: '100%',
    marginVertical: spacing.lg,
  },
  instructionsHeader: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  stepText: {
    color: '#FFF',
    fontSize: 14,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: '#FFF',
  },
  soundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  soundBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
