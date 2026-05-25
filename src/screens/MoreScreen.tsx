import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions, ScrollView } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../ThemeContext';
import { spacing, radii, shadows } from '../theme';
import HealthProfileScreen from './HealthProfileScreen';
import EmergencyContactsScreen from './EmergencyContactsScreen';
import { MaternalDashboardScreen } from './MaternalDashboardScreen';
import { ImmunizationTrackerScreen } from './ImmunizationTrackerScreen';
import { SymptomTriageScreen } from './SymptomTriageScreen';
import DiseaseStatsScreen from './DiseaseStatsScreen';
import DrugInfoScreen from './DrugInfoScreen';
import FAQBot from '../components/FAQBot';
import SettingsScreen from './SettingsScreen';
import AlertCenterScreen from './AlertCenterScreen';
import PatientQueueScreen from './PatientQueueScreen';
import AcademyScreen from './AcademyScreen';

type MoreView = 
  | 'menu' 
  | 'profile' 
  | 'emergency' 
  | 'maternal' 
  | 'immunization' 
  | 'triage'
  | 'stats'
  | 'drugs'
  | 'faq'
  | 'settings'
  | 'alerts'
  | 'queue'
  | 'academy';

interface MoreScreenProps {
  navigateToTab?: (key: string) => void;
  userRole?: string;
}

const MoreScreen: React.FC<MoreScreenProps> = ({ userRole }) => {
  const { t } = useTranslation();
  const { colors, mode } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 800;
  const [view, setView] = useState<MoreView>('menu');

  const role = userRole || 'COMMUNITY';

  if (view === 'profile') {
    return (
      <View style={styles.flex}>
        <TouchableOpacity style={[styles.backBar, { backgroundColor: colors.surface }]} onPress={() => setView('menu')}>
          <Icon source="arrow-left" size={22} color={colors.primary[900]} />
          <Text style={[styles.backText, { color: colors.primary[900] }]}>{t('nav.more') || 'Back'}</Text>
        </TouchableOpacity>
        <HealthProfileScreen />
      </View>
    );
  }

  if (view === 'emergency') {
    return (
      <View style={styles.flex}>
        <TouchableOpacity style={[styles.backBar, { backgroundColor: colors.surface }]} onPress={() => setView('menu')}>
          <Icon source="arrow-left" size={22} color={colors.primary[900]} />
          <Text style={[styles.backText, { color: colors.primary[900] }]}>{t('nav.more') || 'Back'}</Text>
        </TouchableOpacity>
        <EmergencyContactsScreen />
      </View>
    );
  }

  if (view === 'maternal') {
    return (
      <View style={styles.flex}>
        <TouchableOpacity style={[styles.backBar, { backgroundColor: colors.surface }]} onPress={() => setView('menu')}>
          <Icon source="arrow-left" size={22} color={colors.primary[900]} />
          <Text style={[styles.backText, { color: colors.primary[900] }]}>Maternal Tracker</Text>
        </TouchableOpacity>
        <MaternalDashboardScreen />
      </View>
    );
  }

  if (view === 'immunization') {
    return (
      <View style={styles.flex}>
        <TouchableOpacity style={[styles.backBar, { backgroundColor: colors.surface }]} onPress={() => setView('menu')}>
          <Icon source="arrow-left" size={22} color={colors.primary[900]} />
          <Text style={[styles.backText, { color: colors.primary[900] }]}>Immunization Tracker</Text>
        </TouchableOpacity>
        <ImmunizationTrackerScreen />
      </View>
    );
  }

  if (view === 'triage') {
    return (
      <View style={styles.flex}>
        <TouchableOpacity style={[styles.backBar, { backgroundColor: colors.surface }]} onPress={() => setView('menu')}>
          <Icon source="arrow-left" size={22} color={colors.primary[900]} />
          <Text style={[styles.backText, { color: colors.primary[900] }]}>Symptom Triage</Text>
        </TouchableOpacity>
        <SymptomTriageScreen />
      </View>
    );
  }

  if (view === 'stats') {
    return (
      <View style={styles.flex}>
        <TouchableOpacity style={[styles.backBar, { backgroundColor: colors.surface }]} onPress={() => setView('menu')}>
          <Icon source="arrow-left" size={22} color={colors.primary[900]} />
          <Text style={[styles.backText, { color: colors.primary[900] }]}>Disease Outbreaks</Text>
        </TouchableOpacity>
        <DiseaseStatsScreen />
      </View>
    );
  }

  if (view === 'drugs') {
    return (
      <View style={styles.flex}>
        <TouchableOpacity style={[styles.backBar, { backgroundColor: colors.surface }]} onPress={() => setView('menu')}>
          <Icon source="arrow-left" size={22} color={colors.primary[900]} />
          <Text style={[styles.backText, { color: colors.primary[900] }]}>Medication Safety</Text>
        </TouchableOpacity>
        <DrugInfoScreen />
      </View>
    );
  }

  if (view === 'faq') {
    return (
      <View style={styles.flex}>
        <TouchableOpacity style={[styles.backBar, { backgroundColor: colors.surface }]} onPress={() => setView('menu')}>
          <Icon source="arrow-left" size={22} color={colors.primary[900]} />
          <Text style={[styles.backText, { color: colors.primary[900] }]}>Interactive FAQ</Text>
        </TouchableOpacity>
        <FAQBot />
      </View>
    );
  }

  if (view === 'settings') {
    return (
      <View style={styles.flex}>
        <TouchableOpacity style={[styles.backBar, { backgroundColor: colors.surface }]} onPress={() => setView('menu')}>
          <Icon source="arrow-left" size={22} color={colors.primary[900]} />
          <Text style={[styles.backText, { color: colors.primary[900] }]}>{t('nav.more') || 'Back'}</Text>
        </TouchableOpacity>
        <SettingsScreen />
      </View>
    );
  }

  if (view === 'alerts') {
    return (
      <View style={styles.flex}>
        <TouchableOpacity style={[styles.backBar, { backgroundColor: colors.surface }]} onPress={() => setView('menu')}>
          <Icon source="arrow-left" size={22} color={colors.primary[900]} />
          <Text style={[styles.backText, { color: colors.primary[900] }]}>Alerts Center</Text>
        </TouchableOpacity>
        <AlertCenterScreen userRole={role} />
      </View>
    );
  }

  if (view === 'queue') {
    return (
      <View style={styles.flex}>
        <TouchableOpacity style={[styles.backBar, { backgroundColor: colors.surface }]} onPress={() => setView('menu')}>
          <Icon source="arrow-left" size={22} color={colors.primary[900]} />
          <Text style={[styles.backText, { color: colors.primary[900] }]}>{t('nav.more') || 'Back'}</Text>
        </TouchableOpacity>
        <PatientQueueScreen />
      </View>
    );
  }

  if (view === 'academy') {
    return (
      <View style={styles.flex}>
        <TouchableOpacity style={[styles.backBar, { backgroundColor: colors.surface }]} onPress={() => setView('menu')}>
          <Icon source="arrow-left" size={22} color={colors.primary[900]} />
          <Text style={[styles.backText, { color: colors.primary[900] }]}>{t('nav.more') || 'Back'}</Text>
        </TouchableOpacity>
        <AcademyScreen />
      </View>
    );
  }

  // Generate dynamic items based on user role
  const getMenuItems = () => {
    const baseItems = [
      { key: 'profile' as const, icon: 'account-circle', title: t('nav.profile') || 'Health Profile', sub: t('more.profile_sub') || 'Your health information and preferences' },
      { key: 'maternal' as const, icon: 'baby-carriage', title: 'Maternal Health Tracker', sub: 'Register and track prenatal visits & development' },
      { key: 'immunization' as const, icon: 'needle', title: 'Child Immunization Tracker', sub: 'UNEPI schedule generator & vaccine history' },
      { key: 'triage' as const, icon: 'shield-check-outline', title: 'Offline Symptom Triage', sub: 'Urgency checklist & home care guidelines' },
      { key: 'faq' as const, icon: 'help-circle-outline', title: 'Interactive FAQ Bot', sub: 'Instant answers to local health questions' },
      { key: 'drugs' as const, icon: 'pill', title: 'Medication Safety Lookup', sub: 'Check usage instructions and safety warnings' },
      { key: 'stats' as const, icon: 'virus-outline', title: 'Disease Outbreaks', sub: 'Latest national alerts & outbreak statuses' },
      { key: 'alerts' as const, icon: 'bell-outline', title: 'Alerts Center', sub: 'MoH public safety announcements & bulletins' },
      { key: 'settings' as const, icon: 'cog-outline', title: t('nav.settings') || 'System Settings', sub: 'Configure interface theme and network settings' },
      { key: 'emergency' as const, icon: 'phone-alert', title: t('nav.emergency') || 'Emergency Contacts', sub: t('more.emergency_sub') || 'Hotlines and nearest emergency services' },
    ];

    if (role === 'COMMUNITY') {
      return baseItems;
    }

    // HW or ADMIN items
    return [
      { key: 'profile' as const, icon: 'account-circle', title: t('nav.profile') || 'Health Profile', sub: t('more.profile_sub') || 'Your health information and preferences' },
      { key: 'queue' as const, icon: 'account-multiple', title: 'Patient Queue', sub: 'Manage local clinical visits & triaged patients' },
      { key: 'academy' as const, icon: 'school', title: 'CHW Academy', sub: 'Interactive lessons & training simulation quizzes' },
      ...baseItems.filter(i => i.key !== 'profile'),
    ];
  };

  const menuItems = getMenuItems();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
      <View style={isDesktop ? styles.desktopPad : undefined}>
        <Text style={[styles.title, { color: colors.neutral[900] }]}>{t('nav.more') || 'More Services'}</Text>
        <Text style={[styles.sub, { color: colors.neutral[500] }]}>{t('more.subtitle') || 'Explore additional tools, resources and configurations'}</Text>
        
        <View style={styles.gridContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.card, 
                { 
                  backgroundColor: colors.surface, 
                  borderColor: mode === 'light' ? colors.neutral[200] : colors.neutral[100],
                  borderWidth: 1
                },
                isDesktop && styles.desktopCard
              ]}
              onPress={() => setView(item.key)}
            >
              <View style={[styles.iconCircle, { backgroundColor: mode === 'light' ? '#F0FDF4' : 'rgba(16, 185, 129, 0.15)' }]}>
                <Icon source={item.icon} size={26} color={colors.primary[900]} />
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: colors.neutral[900] }]}>{item.title}</Text>
                <Text style={[styles.cardSub, { color: colors.neutral[500] }]}>{item.sub}</Text>
              </View>
              <Icon source="chevron-right" size={20} color={colors.neutral[400]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 80 },
  desktopPad: { paddingHorizontal: 48, paddingTop: 32, maxWidth: 1000, alignSelf: 'center', width: '100%' },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 4 },
  sub: { fontSize: 15, marginBottom: spacing.xl },
  gridContainer: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.xl,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  desktopCard: {
    padding: spacing.lg,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  cardSub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  backBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  backText: { fontSize: 15, fontWeight: '700' },
});

export default MoreScreen;
