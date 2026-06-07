import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../ThemeContext';
import { spacing, radii, shadows } from '../theme';
import AnimatedCard from '../components/AnimatedCard';

const VACCINATIONS = [
  { name: 'BCG (Tuberculosis)', date: 'At birth', status: 'completed' },
  { name: 'Polio (OPV)', date: '6 weeks', status: 'completed' },
  { name: 'DPT-HepB-Hib', date: '10 weeks', status: 'completed' },
  { name: 'Measles', date: '9 months', status: 'completed' },
  { name: 'COVID-19 (AstraZeneca)', date: 'Mar 2024', status: 'completed' },
  { name: 'Tetanus Toxoid (TT)', date: 'Due Jun 2026', status: 'pending' },
];

const VISIT_HISTORY = [
  { id: 1, date: '15 May 2026', facility: 'Nakasero Hospital', reason: 'Malaria Treatment', outcome: 'Recovered' },
  { id: 2, date: '02 Apr 2026', facility: 'Mulago Health Center', reason: 'Routine Checkup', outcome: 'Healthy' },
  { id: 3, date: '18 Feb 2026', facility: 'Kisenyi HC IV', reason: 'Respiratory Infection', outcome: 'Recovered' },
  { id: 4, date: '10 Jan 2026', facility: 'Nakasero Hospital', reason: 'Vaccination (COVID Booster)', outcome: 'Completed' },
];

const HealthProfileScreen = () => {
  const { t } = useTranslation();
  const { colors, mode } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 800;
  const [activeTab, setActiveTab] = useState<'overview' | 'vaccines' | 'visits'>('overview');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { AuthService } = require('../services/AuthService');
      const session = await AuthService.getSession();
      if (session && session.user) {
        setUser(session.user);
      }
    };
    loadUser();
  }, []);

  const getInitials = (nameString?: string) => {
    if (!nameString) return 'JN';
    const parts = nameString.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nameString.substring(0, 2).toUpperCase();
  };

  const completedVaccines = VACCINATIONS.filter(v => v.status === 'completed').length;
  const totalVaccines = VACCINATIONS.length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <LinearGradient
        colors={['#1A3C2A', '#2C5E3E', '#3D7A52'] as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.name || t('profile.default_name')}
            </Text>
            <Text style={styles.profileDetail}>
              {user?.district ? `${user.district} District` : t('profile.district')}
            </Text>
            <View style={styles.idBadge}>
              <Icon source="card-account-details-outline" size={12} color="rgba(255,255,255,0.8)" />
              <Text style={styles.idText}>NIN: CM-2026-XXXXX</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{completedVaccines}/{totalVaccines}</Text>
            <Text style={styles.statLabel}>{t('profile.vaccines') || 'Vaccines'}</Text>
          </View>
          <View style={[styles.statDivider]} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{VISIT_HISTORY.length}</Text>
            <Text style={styles.statLabel}>{t('profile.visits') || 'Visits'}</Text>
          </View>
          <View style={[styles.statDivider]} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>A+</Text>
            <Text style={styles.statLabel}>{t('profile.blood_type') || 'Blood'}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={[styles.content, isDesktop && styles.desktopContent]}>
        {/* Tab Selector */}
        <View style={[styles.tabRow, { backgroundColor: colors.surface }]}>
          {(['overview', 'vaccines', 'visits'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab ? { backgroundColor: '#2C5E3E' } : {},
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Icon
                source={tab === 'overview' ? 'account-circle' : tab === 'vaccines' ? 'needle' : 'clipboard-text-clock'}
                size={16}
                color={activeTab === tab ? '#FFF' : colors.neutral[500]}
              />
              <Text style={[
                styles.tabText,
                { color: activeTab === tab ? '#FFF' : colors.neutral[500] },
              ]}>
                {tab === 'overview' ? (t('profile.overview') || 'Overview') :
                 tab === 'vaccines' ? (t('profile.vaccines_tab') || 'Vaccines') :
                 (t('profile.visits_tab') || 'Visit History')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            <AnimatedCard delay={50} style={[styles.infoCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.cardTitle, { color: colors.neutral[900] }]}>
                {t('profile.personal_info') || 'Personal Information'}
              </Text>
              {[
                { icon: 'calendar', label: t('profile.dob'), value: '15 March 1990' },
                { icon: 'human-male-female', label: t('profile.gender'), value: 'Female' },
                { icon: 'phone', label: t('profile.phone'), value: user?.phone || '+256 7XX XXX XXX' },
                { icon: 'map-marker', label: t('profile.address'), value: (user?.village ? `${user.village}, ` : '') + (user?.district ? `${user.district}` : 'Nakawa Division, Kampala') },
                { icon: 'account-group', label: t('profile.household'), value: '5 members' },
              ].map((item, i) => (
                <View key={i} style={[styles.infoRow, i > 0 ? { borderTopColor: colors.neutral[100], borderTopWidth: 1 } : {}]}>
                  <View style={[styles.infoIconCircle, { backgroundColor: mode === 'dark' ? colors.neutral[100] : '#F0F9F4' }]}>
                    <Icon source={item.icon} size={16} color="#2C5E3E" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: colors.neutral[500] }]}>{item.label}</Text>
                    <Text style={[styles.infoValue, { color: colors.neutral[900] }]}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </AnimatedCard>

            {/* Health Summary */}
            <AnimatedCard delay={150} style={[styles.infoCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.cardTitle, { color: colors.neutral[900] }]}>
                {t('profile.health_summary') || 'Health Summary'}
              </Text>
              <View style={styles.summaryGrid}>
                {[
                  { icon: 'heart-pulse', label: 'Blood Pressure', value: '120/80', color: '#2C5E3E', bg: '#E2F0D9' },
                  { icon: 'water', label: 'Blood Sugar', value: 'Normal', color: '#3182CE', bg: '#EBF8FF' },
                  { icon: 'weight-kilogram', label: 'BMI', value: '22.5', color: '#DD6B20', bg: '#FFFAF0' },
                  { icon: 'shield-check', label: 'HIV Status', value: 'Negative', color: '#2C5E3E', bg: '#E2F0D9' },
                ].map((item, i) => (
                  <View key={i} style={[styles.summaryItem, { backgroundColor: mode === 'dark' ? colors.neutral[100] : item.bg }]}>
                    <Icon source={item.icon} size={22} color={item.color} />
                    <Text style={[styles.summaryValue, { color: colors.neutral[900] }]}>{item.value}</Text>
                    <Text style={[styles.summaryLabel, { color: colors.neutral[500] }]}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </AnimatedCard>
          </>
        )}

        {/* Vaccines Tab */}
        {activeTab === 'vaccines' && (
          <>
            {/* Progress Bar */}
            <AnimatedCard delay={50} style={[styles.progressCard, { backgroundColor: colors.surface }]}>
              <View style={styles.progressHeader}>
                <Text style={[styles.cardTitle, { color: colors.neutral[900] }]}>
                  {t('profile.vaccination_progress') || 'Vaccination Progress'}
                </Text>
                <Text style={[styles.progressPercent, { color: '#2C5E3E' }]}>
                  {Math.round((completedVaccines / totalVaccines) * 100)}%
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.neutral[100] }]}>
                <View style={[styles.progressFill, { width: `${(completedVaccines / totalVaccines) * 100}%` as any }]} />
              </View>
              <Text style={[styles.progressSub, { color: colors.neutral[500] }]}>
                {completedVaccines} of {totalVaccines} vaccinations completed
              </Text>
            </AnimatedCard>

            {VACCINATIONS.map((vax, index) => (
              <AnimatedCard key={index} delay={100 + index * 60} style={[styles.vaccineCard, { backgroundColor: colors.surface }]}>
                <View style={[
                  styles.vaccineIcon,
                  { backgroundColor: vax.status === 'completed' ? '#E2F0D9' : '#FFF5F5' },
                ]}>
                  <Icon
                    source={vax.status === 'completed' ? 'check-circle' : 'clock-alert-outline'}
                    size={22}
                    color={vax.status === 'completed' ? '#2C5E3E' : '#E53E3E'}
                  />
                </View>
                <View style={styles.vaccineInfo}>
                  <Text style={[styles.vaccineName, { color: colors.neutral[900] }]}>{vax.name}</Text>
                  <Text style={[styles.vaccineDate, { color: colors.neutral[500] }]}>{vax.date}</Text>
                </View>
                <View style={[
                  styles.vaccineBadge,
                  { backgroundColor: vax.status === 'completed' ? '#E2F0D9' : '#FFF5F5' },
                ]}>
                  <Text style={[
                    styles.vaccineBadgeText,
                    { color: vax.status === 'completed' ? '#2C5E3E' : '#E53E3E' },
                  ]}>
                    {vax.status === 'completed' ? 'Done' : 'Pending'}
                  </Text>
                </View>
              </AnimatedCard>
            ))}
          </>
        )}

        {/* Visits Tab */}
        {activeTab === 'visits' && (
          <>
            {VISIT_HISTORY.map((visit, index) => (
              <AnimatedCard key={visit.id} delay={index * 80} style={[styles.visitCard, { backgroundColor: colors.surface }]}>
                <View style={styles.visitDateCol}>
                  <Text style={[styles.visitDay, { color: '#2C5E3E' }]}>{visit.date.split(' ')[0]}</Text>
                  <Text style={[styles.visitMonth, { color: colors.neutral[500] }]}>{visit.date.split(' ')[1]}</Text>
                </View>
                <View style={[styles.visitDivider, { backgroundColor: colors.neutral[100] }]} />
                <View style={styles.visitInfo}>
                  <Text style={[styles.visitReason, { color: colors.neutral[900] }]}>{visit.reason}</Text>
                  <Text style={[styles.visitFacility, { color: colors.neutral[500] }]}>
                    <Icon source="hospital-building" size={12} color={colors.neutral[400]} /> {visit.facility}
                  </Text>
                  <View style={[styles.outcomeBadge, { backgroundColor: '#E2F0D9' }]}>
                    <Text style={styles.outcomeText}>{visit.outcome}</Text>
                  </View>
                </View>
              </AnimatedCard>
            ))}
          </>
        )}

        <View style={{ height: 100 }} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '900',
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
  },
  profileDetail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginTop: 2,
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  idText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radii.xl,
    paddingVertical: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    padding: spacing.lg,
  },
  desktopContent: {
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  // Tabs
  tabRow: {
    flexDirection: 'row',
    borderRadius: radii.full,
    padding: 4,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radii.full,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Info Card
  infoCard: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 12,
  },
  infoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '600' },
  infoValue: { fontSize: 15, fontWeight: '700', marginTop: 1 },
  // Health Summary
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    gap: 6,
  },
  summaryValue: { fontSize: 18, fontWeight: '900' },
  summaryLabel: { fontSize: 11, fontWeight: '600' },
  // Progress
  progressCard: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressPercent: { fontSize: 22, fontWeight: '900' },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2C5E3E',
  },
  progressSub: { fontSize: 12, fontWeight: '500' },
  // Vaccine Card
  vaccineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.xl,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadows.sm,
  },
  vaccineIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaccineInfo: { flex: 1 },
  vaccineName: { fontSize: 14, fontWeight: '800' },
  vaccineDate: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  vaccineBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  vaccineBadgeText: { fontSize: 11, fontWeight: '800' },
  // Visit Card
  visitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.xl,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadows.sm,
  },
  visitDateCol: { alignItems: 'center', minWidth: 40 },
  visitDay: { fontSize: 22, fontWeight: '900' },
  visitMonth: { fontSize: 11, fontWeight: '700' },
  visitDivider: { width: 2, height: 40, borderRadius: 1 },
  visitInfo: { flex: 1 },
  visitReason: { fontSize: 15, fontWeight: '800' },
  visitFacility: { fontSize: 12, fontWeight: '500', marginTop: 4 },
  outcomeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.full,
    marginTop: 6,
  },
  outcomeText: { fontSize: 11, fontWeight: '800', color: '#2C5E3E' },
});

export default HealthProfileScreen;
