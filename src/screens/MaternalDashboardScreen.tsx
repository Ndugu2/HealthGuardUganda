import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Text, Icon, Button, Switch, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { getMaternalRecords, saveMaternalRecord, deleteMaternalRecord, MaternalRecord } from '../db/Database';
import { colors, spacing, radii, shadows, gradients } from '../theme';
import { useAppTheme } from '../ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedCard from '../components/AnimatedCard';

const BABY_SIZES: { [key: number]: { size: string; size_lg: string; icon: string; desc: string; desc_lg: string } } = {
  4: { size: 'Poppy Seed', size_lg: 'Kasigo ka Poppy', icon: 'sprout', desc: 'The blastocyst is implanting into the uterine wall.', desc_lg: 'Akasoloboozi katandise okwekwata ku kisenge ky’omu kisawo ky’omwana.' },
  8: { size: 'Raspberry', size_lg: 'Raspberry', icon: 'fruit-grapes', desc: 'Webbed fingers and toes are forming, and the heart is beating.', desc_lg: 'Engalo n’ebigere ebigatte bitandise okukula, era n’omutima gukuba.' },
  12: { size: 'Lime', size_lg: 'Lime (Nnimu)', icon: 'fruit-citrus', desc: 'The baby can open and close its fists and curl its toes.', desc_lg: 'Omwana asobola okuggula n’okusiba ebikonde bye n’okupeta ebigere bye.' },
  16: { size: 'Avocado', size_lg: 'Avocado', icon: 'food-apple', desc: 'Your baby’s skeleton is starting to harden from rubbery cartilage to bone.', desc_lg: 'Egumba ly’omwana litandise okukaluba okuva ku binywa ebigonda okugenda ku magumba.' },
  20: { size: 'Banana', size_lg: 'Banana (Katooke)', icon: 'food-banana', desc: 'The baby can swallow and is starting to produce meconium.', desc_lg: 'Omwana asobola okumira era atandise okukola meconium (caafu ow’olubereera).' },
  24: { size: 'Cantaloupe', size_lg: 'Cantaloupe (Kamyu)', icon: 'melon', desc: 'Taste buds are developing, and the lungs are forming branches.', desc_lg: 'Obulago bw’okulega bugenda mu maaso n’okukula, era n’amawuggwe gatandika okukula ebitundu.' },
  28: { size: 'Eggplant', size_lg: 'Eggplant (Biringanya)', icon: 'eggplant', desc: 'The eyes are beginning to open and blink. The brain is very active.', desc_lg: 'Amaaso gatandika okugguka n’okutemya. Obwongo bukola nnyo mu kaseera kano.' },
  32: { size: 'Squash', size_lg: 'Squash', icon: 'leaf-maple', desc: 'The baby is gaining weight quickly and accumulating layers of fat.', desc_lg: 'Omwana weyongera obuzito mangu ddala n’okukunganya amasavu g’omubiri.' },
  36: { size: 'Papaya', size_lg: 'Papaya (Ppaapaali)', icon: 'food-croissant', desc: 'The baby is dropping into the pelvis in preparation for birth.', desc_lg: 'Omwana agwa wansi mu basinzi mu kweteekerateekera okuzaalibwa.' },
  40: { size: 'Pumpkin', size_lg: 'Pumpkin (Nsujju)', icon: 'pumpkin', desc: 'Your baby is fully developed and ready to meet the world!', desc_lg: 'Omwana wo akulidde ddala era yeetegefu okulaba ensi eno!' },
};

const DANGER_SIGNS_KEYS = [
  'danger_bleeding',
  'danger_headache',
  'danger_convulsions',
  'danger_fever',
  'danger_abdominal',
  'danger_movement',
  'danger_water',
];

const RISK_FACTORS_KEYS = [
  'risk_first',
  'risk_age',
  'risk_bp',
  'risk_csection',
  'risk_twins',
];

export const MaternalDashboardScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const { t, i18n } = useTranslation();
  const isLg = i18n.language === 'lg';
  
  // Database states
  const [record, setRecord] = useState<MaternalRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [lmpDate, setLmpDate] = useState('');
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // ANC details modal/input states
  const [activeAncIdx, setActiveAncIdx] = useState<number | null>(null);
  const [ancNotes, setAncNotes] = useState('');
  const [ancWeight, setAncWeight] = useState('');
  const [ancBp, setAncBp] = useState('');

  useEffect(() => {
    loadMaternalRecord();
  }, []);

  const loadMaternalRecord = async () => {
    try {
      setLoading(true);
      const records = await getMaternalRecords();
      if (records.length > 0) {
        setRecord(records[0]);
      } else {
        setRecord(null);
      }
    } catch (e) {
      console.error('Failed to load maternal record', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !age.trim() || !lmpDate.trim()) {
      Alert.alert(t('maternal_tracker.missing_fields'), t('maternal_tracker.missing_fields_msg'));
      return;
    }

    const lmp = new Date(lmpDate);
    if (isNaN(lmp.getTime())) {
      Alert.alert(t('maternal_tracker.invalid_date'), t('maternal_tracker.invalid_date_msg'));
      return;
    }

    // EDD: Naegele's rule (LMP + 280 days)
    const edd = new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000);
    const eddStr = edd.toISOString().split('T')[0];

    // Standard 8 ANC visits suggested by MoH Uganda
    const defaultAncSchedule = [
      { name: 'Visit 1', weeks: 12, date: new Date(lmp.getTime() + 12 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'pending' },
      { name: 'Visit 2', weeks: 20, date: new Date(lmp.getTime() + 20 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'pending' },
      { name: 'Visit 3', weeks: 26, date: new Date(lmp.getTime() + 26 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'pending' },
      { name: 'Visit 4', weeks: 30, date: new Date(lmp.getTime() + 30 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'pending' },
      { name: 'Visit 5', weeks: 34, date: new Date(lmp.getTime() + 34 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'pending' },
      { name: 'Visit 6', weeks: 36, date: new Date(lmp.getTime() + 36 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'pending' },
      { name: 'Visit 7', weeks: 38, date: new Date(lmp.getTime() + 38 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'pending' },
      { name: 'Visit 8', weeks: 40, date: new Date(lmp.getTime() + 40 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'pending' },
    ];

    const newRecord: Omit<MaternalRecord, 'id'> = {
      name,
      age: parseInt(age),
      lastMenstrualPeriod: lmpDate,
      expectedDeliveryDate: eddStr,
      ancVisitsJson: JSON.stringify(defaultAncSchedule),
      nextAncDate: defaultAncSchedule[0].date,
      highRiskFactors: selectedRisks.join(','),
      notes: notes || null,
    };

    await saveMaternalRecord(newRecord);
    Alert.alert(t('maternal_tracker.reg_success'), t('maternal_tracker.reg_success_msg'));
    loadMaternalRecord();
  };

  const handleToggleAnc = (index: number) => {
    if (!record) return;
    const schedule = JSON.parse(record.ancVisitsJson);
    const visit = schedule[index];

    if (visit.status === 'completed') {
      // Revert to pending
      visit.status = 'pending';
      delete visit.completionDetails;
      saveUpdatedSchedule(schedule);
    } else {
      // Prompt completion details
      setActiveAncIdx(index);
      setAncNotes('');
      setAncWeight('');
      setAncBp('');
    }
  };

  const handleCompleteAncDetails = () => {
    if (!record || activeAncIdx === null) return;
    const schedule = JSON.parse(record.ancVisitsJson);
    const visit = schedule[activeAncIdx];

    visit.status = 'completed';
    visit.completionDetails = {
      notes: ancNotes,
      weight: ancWeight ? parseFloat(ancWeight) : undefined,
      bp: ancBp || undefined,
      dateCompleted: new Date().toISOString().split('T')[0],
    };

    saveUpdatedSchedule(schedule);
    setActiveAncIdx(null);
  };

  const saveUpdatedSchedule = async (schedule: any[]) => {
    if (!record) return;
    const nextPending = schedule.find(v => v.status === 'pending');
    const updated = {
      ...record,
      ancVisitsJson: JSON.stringify(schedule),
      nextAncDate: nextPending ? nextPending.date : null,
    };
    await saveMaternalRecord(updated);
    loadMaternalRecord();
  };

  const handleDeleteRecord = () => {
    if (!record) return;
    Alert.alert(
      t('maternal_tracker.confirm_reset_title'),
      t('maternal_tracker.confirm_reset_msg'),
      [
        { text: t('maternal_tracker.cancel'), style: 'cancel' },
        {
          text: t('maternal_tracker.delete_everything'),
          style: 'destructive',
          onPress: async () => {
            await deleteMaternalRecord(record.id);
            setName('');
            setAge('');
            setLmpDate('');
            setSelectedRisks([]);
            setNotes('');
            loadMaternalRecord();
          },
        },
      ]
    );
  };

  const toggleRisk = (riskKey: string) => {
    setSelectedRisks(prev =>
      prev.includes(riskKey) ? prev.filter(r => r !== riskKey) : [...prev, riskKey]
    );
  };

  // Calculations helper
  const getPregnancyStats = () => {
    if (!record) return { weeks: 0, days: 0, trimester: 1, babyWeek: 4 };
    const lmp = new Date(record.lastMenstrualPeriod);
    const diffMs = Date.now() - lmp.getTime();
    const totalDays = Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
    const weeks = Math.floor(totalDays / 7);
    const days = totalDays % 7;
    const trimester = weeks <= 12 ? 1 : weeks <= 26 ? 2 : 3;

    // Find nearest size reference
    const weekKeys = Object.keys(BABY_SIZES).map(Number).sort((a, b) => b - a);
    const babyWeek = weekKeys.find(w => w <= weeks) || 4;

    return { weeks, days, trimester, babyWeek };
  };

  if (loading) {
    return (
      <View style={[styles.loadingCenter, { backgroundColor: colors.background }]}>
        <Text>{t('maternal_tracker.loading')}</Text>
      </View>
    );
  }

  if (!record) {
    // Show registration Form
    return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={['#FFF5F5', '#FFE3E3']} style={styles.heroIntro}>
          <Icon source="baby-carriage" size={48} color="#E53E3E" />
          <Text style={styles.introTitle}>{t('more.maternal_title')}</Text>
          <Text style={styles.introSubtitle}>
            {t('more.maternal_sub')}
          </Text>
        </LinearGradient>

        <AnimatedCard delay={100} style={[styles.cardForm, { backgroundColor: colors.surface }]}>
          <Text style={styles.formSectionTitle}>{t('maternal_tracker.reg_details')}</Text>
          
          <Text style={styles.fieldLabel}>{t('maternal_tracker.mother_name')}</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.neutral[300], color: colors.neutral[900] }]}
            placeholder="Sarah Namubiru"
            placeholderTextColor={colors.neutral[400]}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.fieldLabel}>{t('maternal_tracker.age')}</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.neutral[300], color: colors.neutral[900] }]}
            placeholder="26"
            placeholderTextColor={colors.neutral[400]}
            keyboardType="numeric"
            value={age}
            onChangeText={setAge}
          />

          <Text style={styles.fieldLabel}>{t('maternal_tracker.lmp_date')}</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.neutral[300], color: colors.neutral[900] }]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.neutral[400]}
            value={lmpDate}
            onChangeText={setLmpDate}
          />

          <Text style={styles.fieldLabel}>{t('maternal_tracker.risk_factors')}</Text>
          {RISK_FACTORS_KEYS.map(key => {
            const isSelected = selectedRisks.includes(key);
            return (
              <TouchableOpacity
                key={key}
                style={[styles.riskCheck, isSelected && { backgroundColor: '#FFE3E3', borderColor: '#E53E3E' }]}
                onPress={() => toggleRisk(key)}
              >
                <Icon source={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'} size={20} color={isSelected ? '#E53E3E' : colors.neutral[400]} />
                <Text style={[styles.riskCheckText, { color: colors.neutral[800] }]}>{t('maternal_tracker.' + key)}</Text>
              </TouchableOpacity>
            );
          })}

          <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>{t('maternal_tracker.add_notes')}</Text>
          <TextInput
            style={[styles.input, styles.textArea, { borderColor: colors.neutral[300], color: colors.neutral[900] }]}
            placeholder="..."
            placeholderTextColor={colors.neutral[400]}
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />

          <Button
            mode="contained"
            buttonColor="#E53E3E"
            textColor="#FFF"
            style={styles.submitBtn}
            onPress={handleRegister}
          >
            {t('maternal_tracker.start_tracker')}
          </Button>
        </AnimatedCard>
      </ScrollView>
    );
  }

  // Dashboard view
  const stats = getPregnancyStats();
  const babyDetails = BABY_SIZES[stats.babyWeek];
  const ancSchedule = JSON.parse(record.ancVisitsJson);

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      {/* Pregnancy Summary Banner */}
      <AnimatedCard delay={0} style={styles.bannerCard}>
        <LinearGradient colors={['#FF8A8A', '#E53E3E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientBanner}>
          <View style={styles.bannerHeader}>
            <View>
              <Text style={styles.bannerMotherName}>{record.name}</Text>
              <Text style={styles.bannerAge}>{t('maternal_tracker.expected_delivery', { date: record.expectedDeliveryDate })}</Text>
            </View>
            <View style={styles.trimesterBadge}>
              <Text style={styles.trimesterText}>{t('maternal_tracker.trimester', { trimester: stats.trimester })}</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <Text style={styles.progressWeekNumber}>{t('maternal_tracker.weeks_days', { weeks: stats.weeks, days: stats.days })}</Text>
            <Text style={styles.progressSubtext}>{t('maternal_tracker.baby_developing')}</Text>
          </View>
        </LinearGradient>
      </AnimatedCard>

      {/* Baby Development Info */}
      <AnimatedCard delay={100} style={[styles.infoCard, { backgroundColor: colors.surface }]}>
        <View style={styles.infoTitleRow}>
          <Icon source={babyDetails.icon} size={28} color="#E53E3E" />
          <Text style={styles.infoTitle}>{t('maternal_tracker.baby_size', { size: isLg ? babyDetails.size_lg : babyDetails.size })}</Text>
        </View>
        <Text style={[styles.infoDesc, { color: colors.neutral[600] }]}>{isLg ? babyDetails.desc_lg : babyDetails.desc}</Text>
      </AnimatedCard>

      {/* ANC Visits Section */}
      <Text style={styles.sectionHeading}>{t('maternal_tracker.anc_calendar')}</Text>
      <View style={styles.visitsContainer}>
        {ancSchedule.map((visit: any, index: number) => {
          const isCompleted = visit.status === 'completed';
          return (
            <View key={visit.name} style={[styles.visitRow, { backgroundColor: colors.surface }]}>
              <View style={[styles.visitIconBox, { backgroundColor: isCompleted ? '#C6F6D5' : '#F7FAFC' }]}>
                <Icon source={isCompleted ? 'check' : 'calendar'} size={20} color={isCompleted ? '#2F855A' : '#718096'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.visitName}>{isLg ? visit.name.replace('Visit', 'Okukeberwa') : visit.name} (Week {visit.weeks})</Text>
                <Text style={[styles.visitDate, { color: colors.neutral[500] }]}>{t('maternal_tracker.due', { date: visit.date })}</Text>
                {visit.completionDetails && (
                  <Text style={[styles.visitDetails, { color: colors.primary[700] }]}>
                    {t('maternal_tracker.completed')}: BP {visit.completionDetails.bp || 'N/A'}, {t('maternal_tracker.weight_label').split(' ')[0]} {visit.completionDetails.weight ? `${visit.completionDetails.weight}kg` : 'N/A'}
                  </Text>
                )}
              </View>
              <Switch
                value={isCompleted}
                onValueChange={() => handleToggleAnc(index)}
                color="#E53E3E"
              />
            </View>
          );
        })}
      </View>

      {/* Complete visit details popup inputs */}
      {activeAncIdx !== null && (
        <View style={[styles.detailsBox, { backgroundColor: colors.surface, borderColor: '#E53E3E' }]}>
          <Text style={styles.detailsHeading}>{t('maternal_tracker.log_visit', { name: isLg ? ancSchedule[activeAncIdx].name.replace('Visit', 'Okukeberwa') : ancSchedule[activeAncIdx].name })}</Text>
          <View style={styles.detailsInputs}>
            <TextInput
              style={[styles.smallInput, { color: colors.neutral[900], borderColor: colors.neutral[300] }]}
              placeholder={t('maternal_tracker.bp_label')}
              placeholderTextColor={colors.neutral[400]}
              value={ancBp}
              onChangeText={setAncBp}
            />
            <TextInput
              style={[styles.smallInput, { color: colors.neutral[900], borderColor: colors.neutral[300] }]}
              placeholder={t('maternal_tracker.weight_label')}
              placeholderTextColor={colors.neutral[400]}
              keyboardType="numeric"
              value={ancWeight}
              onChangeText={setAncWeight}
            />
          </View>
          <TextInput
            style={[styles.input, { color: colors.neutral[900], borderColor: colors.neutral[300] }]}
            placeholder={t('maternal_tracker.doc_notes')}
            placeholderTextColor={colors.neutral[400]}
            value={ancNotes}
            onChangeText={setAncNotes}
          />
          <View style={styles.detailsActions}>
            <Button textColor="#718096" onPress={() => setActiveAncIdx(null)}>{t('maternal_tracker.cancel')}</Button>
            <Button mode="contained" buttonColor="#E53E3E" textColor="#FFF" onPress={handleCompleteAncDetails}>{t('maternal_tracker.save_visit')}</Button>
          </View>
        </View>
      )}

      {/* Danger Signs & Helpline */}
      <AnimatedCard delay={200} style={[styles.dangerCard, { backgroundColor: '#FFF5F5', borderColor: '#FEB2B2' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Icon source="alert-octagon" size={24} color="#C53030" />
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#C53030' }}>{t('maternal_tracker.danger_signs')}</Text>
        </View>
        {DANGER_SIGNS_KEYS.map((key, idx) => (
          <Text key={idx} style={{ color: '#9B2C2C', fontSize: 14, marginBottom: 4 }}>• {t('maternal_tracker.' + key)}</Text>
        ))}
        <TouchableOpacity
          style={styles.hotlineBtn}
          onPress={() => Alert.alert(t('maternal_tracker.hotline_label').split(':')[0], t('maternal_tracker.hotline_label') + '?')}
        >
          <Icon source="phone" size={18} color="#FFF" />
          <Text style={styles.hotlineBtnText}>{t('maternal_tracker.hotline_label')}</Text>
        </TouchableOpacity>
      </AnimatedCard>

      {/* Reset options */}
      <TouchableOpacity style={styles.resetBtn} onPress={handleDeleteRecord}>
        <Text style={styles.resetBtnText}>{t('maternal_tracker.reset_tracker')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIntro: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.xl,
    marginBottom: spacing.lg,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#9B2C2C',
    marginTop: spacing.md,
  },
  introSubtitle: {
    fontSize: 14,
    color: '#C53030',
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  cardForm: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    ...shadows.sm,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  textArea: {
    textAlignVertical: 'top',
  },
  riskCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radii.md,
    marginBottom: spacing.xs,
    gap: 8,
  },
  riskCheckText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: spacing.md,
    borderRadius: radii.full,
  },

  // Dashboard styles
  bannerCard: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  gradientBanner: {
    padding: spacing.lg,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerMotherName: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
  },
  bannerAge: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '700',
  },
  trimesterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  trimesterText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  progressSection: {
    marginTop: spacing.lg,
  },
  progressWeekNumber: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
  },
  progressSubtext: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  infoDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  visitsContainer: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  visitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    gap: spacing.md,
  },
  visitIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitName: {
    fontSize: 14,
    fontWeight: '800',
  },
  visitDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  visitDetails: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  detailsBox: {
    borderWidth: 2,
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
  },
  detailsHeading: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: spacing.sm,
    color: '#E53E3E',
  },
  detailsInputs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  smallInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    fontSize: 14,
  },
  detailsActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  dangerCard: {
    borderWidth: 1,
    padding: spacing.lg,
    borderRadius: radii.xl,
    marginBottom: spacing.lg,
  },
  hotlineBtn: {
    backgroundColor: '#C53030',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    marginTop: spacing.md,
    gap: 8,
  },
  hotlineBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  resetBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  resetBtnText: {
    color: '#718096',
    fontWeight: '700',
    fontSize: 14,
  },
});
