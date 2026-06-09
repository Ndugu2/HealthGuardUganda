import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions, ScrollView, Alert } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../ThemeContext';
import { spacing, radii, shadows } from '../theme';
import { useResponsive, typography , rf } from '../responsive';
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
import InventoryScreen from './InventoryScreen';

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
  | 'academy'
  | 'inventory';

interface MoreScreenProps {
  navigateToTab?: (key: string) => void;
  userRole?: string;
  onLogout?: () => void;
}

const MoreScreen: React.FC<MoreScreenProps> = ({ userRole, onLogout }) => {
  const { t } = useTranslation();
  const { colors, mode } = useAppTheme();
  const { isPhone, isTablet, isDesktop, hPad, heroHeight, rf, bp, width, height } = useResponsive();
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
          <Text style={[styles.backText, { color: colors.primary[900] }]}>{t('more.maternal_title') || 'Maternal Tracker'}</Text>
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
          <Text style={[styles.backText, { color: colors.primary[900] }]}>{t('more.immunization_title') || 'Immunization Tracker'}</Text>
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
          <Text style={[styles.backText, { color: colors.primary[900] }]}>{t('more.triage_title') || 'Symptom Triage'}</Text>
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
          <Text style={[styles.backText, { color: colors.primary[900] }]}>{t('more.stats_title') || 'Disease Outbreaks'}</Text>
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
          <Text style={[styles.backText, { color: colors.primary[900] }]}>{t('more.drugs_title') || 'Medication Safety'}</Text>
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
          <Text style={[styles.backText, { color: colors.primary[900] }]}>{t('more.faq_title') || 'Interactive FAQ'}</Text>
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
        <SettingsScreen onLogout={onLogout} />
      </View>
    );
  }

  if (view === 'alerts') {
    return (
      <View style={styles.flex}>
        <TouchableOpacity style={[styles.backBar, { backgroundColor: colors.surface }]} onPress={() => setView('menu')}>
          <Icon source="arrow-left" size={22} color={colors.primary[900]} />
          <Text style={[styles.backText, { color: colors.primary[900] }]}>{t('more.alerts_title') || 'Alerts Center'}</Text>
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
          <Text style={[styles.backText, { color: colors.primary[900] }]}>{t('more.queue_title') || 'Patient Queue'}</Text>
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
          <Text style={[styles.backText, { color: colors.primary[900] }]}>{t('more.academy_title') || 'CHW Academy'}</Text>
        </TouchableOpacity>
        <AcademyScreen />
      </View>
    );
  }

  if (view === 'inventory') {
    return (
      <View style={styles.flex}>
        <TouchableOpacity style={[styles.backBar, { backgroundColor: colors.surface }]} onPress={() => setView('menu')}>
          <Icon source="arrow-left" size={22} color={colors.primary[900]} />
          <Text style={[styles.backText, { color: colors.primary[900] }]}>{t('more.inventory_title') || 'Drug Inventory'}</Text>
        </TouchableOpacity>
        <InventoryScreen />
      </View>
    );
  }

  // Generate dynamic items based on user role
  const getMenuItems = () => {
    const baseItems = [
      { key: 'profile' as const, icon: 'account-circle', title: t('nav.profile') || 'Health Profile', sub: t('more.profile_sub') || 'Your health information and preferences' },
      { key: 'maternal' as const, icon: 'baby-carriage', title: t('more.maternal_title') || 'Maternal Health Tracker', sub: t('more.maternal_sub') || 'Register and track prenatal visits & development' },
      { key: 'immunization' as const, icon: 'needle', title: t('more.immunization_title') || 'Child Immunization Tracker', sub: t('more.immunization_sub') || 'UNEPI schedule generator & vaccine history' },
      { key: 'triage' as const, icon: 'shield-check-outline', title: t('more.triage_title') || 'Offline Symptom Triage', sub: t('more.triage_sub') || 'Urgency checklist & home care guidelines' },
      { key: 'faq' as const, icon: 'help-circle-outline', title: t('more.faq_title') || 'Interactive FAQ Bot', sub: t('more.faq_sub') || 'Instant answers to local health questions' },
      { key: 'drugs' as const, icon: 'pill', title: t('more.drugs_title') || 'Medication Safety Lookup', sub: t('more.drugs_sub') || 'Check usage instructions and safety warnings' },
      { key: 'stats' as const, icon: 'virus-outline', title: t('more.stats_title') || 'Disease Outbreaks', sub: t('more.stats_sub') || 'Latest national alerts & outbreak statuses' },
      { key: 'alerts' as const, icon: 'bell-outline', title: t('more.alerts_title') || 'Alerts Center', sub: t('more.alerts_sub') || 'MoH public safety announcements & bulletins' },
      { key: 'settings' as const, icon: 'cog-outline', title: t('nav.settings') || 'System Settings', sub: t('settings.subtitle') || 'Configure interface theme and network settings' },
      { key: 'emergency' as const, icon: 'phone-alert', title: t('nav.emergency') || 'Emergency Contacts', sub: t('more.emergency_sub') || 'Hotlines and nearest emergency services' },
    ];

    if (role === 'COMMUNITY') {
      return baseItems;
    }

    // HW or ADMIN items
    return [
      { key: 'profile' as const, icon: 'account-circle', title: t('nav.profile') || 'Health Profile', sub: t('more.profile_sub') || 'Your health information and preferences' },
      { key: 'queue' as const, icon: 'account-multiple', title: t('more.queue_title') || 'Patient Queue', sub: t('more.queue_sub') || 'Manage local clinical visits & triaged patients' },
      { key: 'inventory' as const, icon: 'medical-bag', title: t('more.inventory_title') || 'Drug Inventory', sub: t('more.inventory_sub') || 'Manage clinic supplies and deduct stock' },
      { key: 'academy' as const, icon: 'school', title: t('more.academy_title') || 'CHW Academy', sub: t('more.academy_sub') || 'Interactive lessons & training simulation quizzes' },
      ...baseItems.filter(i => i.key !== 'profile'),
    ];
  };

  const menuItems = getMenuItems();

  const isDark = mode === 'dark';
  const logoutBg = isDark ? 'rgba(239, 68, 68, 0.08)' : colors.danger[50];
  const logoutBorder = isDark ? 'rgba(239, 68, 68, 0.2)' : colors.danger[100];
  const logoutTextAndIcon = isDark ? '#F87171' : colors.danger[800];

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

        {!isDesktop && (
          <TouchableOpacity
            style={[
              styles.logoutButton,
              {
                backgroundColor: logoutBg,
                borderColor: logoutBorder,
              }
            ]}
            onPress={() => {
              Alert.alert(
                t('settings.logout_confirm_title') || 'Log Out',
                t('settings.logout_confirm_msg') || 'Are you sure you want to log out?',
                [
                  { text: t('common.cancel') || 'Cancel', style: 'cancel' },
                  {
                    text: t('settings.logout') || 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                      const { AuthService } = require('../services/AuthService');
                      await AuthService.logout();
                      if (onLogout) {
                        onLogout();
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Icon source="logout" size={22} color={logoutTextAndIcon} />
            <Text style={[styles.logoutText, { color: logoutTextAndIcon }]}>
              {t('settings.logout') || 'Log Out'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 80 },
  desktopPad: { paddingHorizontal: 48, paddingTop: 32, maxWidth: 1000, alignSelf: 'center', width: '100%' },
  title: { fontSize: rf(22), fontWeight: '900', marginBottom: 4 },
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radii.xl,
    gap: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '800',
  },
});

export default MoreScreen;
