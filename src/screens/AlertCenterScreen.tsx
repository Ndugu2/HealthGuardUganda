import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../ThemeContext';
import { spacing, radii, shadows, gradients } from '../theme';
import { useResponsive, typography , rf } from '../responsive';
import AnimatedCard from '../components/AnimatedCard';

interface Alert {
  id: number;
  title: string;
  category: 'outbreak' | 'moh' | 'info';
  categoryLabel: string;
  message: string;
  date: string;
  urgency: 'high' | 'medium' | 'low';
}

const ALERTS: Alert[] = [
  {
    id: 1,
    title: 'Ebola Alert: Kassanda District Outbreak Warning',
    category: 'outbreak',
    categoryLabel: 'Outbreak Alert',
    message: 'Ministry of Health has declared an outbreak of Ebola Virus Disease. Health workers should maintain strict hygiene and report any suspected symptoms (sudden fever, body weakness, bleeding) immediately to the district surveillance officer.',
    date: 'Today, 10:45 AM',
    urgency: 'high',
  },
  {
    id: 2,
    title: 'New Maternal Health Directives (MoH-UG)',
    category: 'moh',
    categoryLabel: 'MoH Directive',
    message: 'Updated guidelines for Antenatal Care (ANC) services require at least 8 contacts. VHTs are urged to follow up with pregnant mothers in their village and ensure they attend the local health center early in their pregnancy.',
    date: 'Yesterday, 2:30 PM',
    urgency: 'medium',
  },
  {
    id: 3,
    title: 'Yellow Fever Vaccination Campaign Starting Next Week',
    category: 'info',
    categoryLabel: 'General Info',
    message: 'National mass vaccination campaign starts next week. All children aged 9 months to 15 years are eligible. Ensure local vaccination registers are ready and sensitize communities to attend the designated outreach points.',
    date: '18 May 2026',
    urgency: 'low',
  },
  {
    id: 4,
    title: 'Increase in Malaria Cases (Kampala District)',
    category: 'outbreak',
    categoryLabel: 'Surveillance Alert',
    message: 'Substantial increase in malaria clinical cases reported in Kampala. Check stocks of Artemether-Lumefantrine (AL) and rapid diagnostic tests (RDTs). VHTs should emphasize proper use of insecticide-treated bed nets.',
    date: '15 May 2026',
    urgency: 'high',
  },
];

const AlertCenterScreen = ({ userRole }: { userRole?: string }) => {
  const { t } = useTranslation();
  const { colors, mode } = useAppTheme();
  const { isPhone, isTablet, isDesktop, hPad, heroHeight, rf, bp, width, height } = useResponsive();

  const [activeTab, setActiveTab] = useState<'all' | 'outbreak' | 'moh'>('all');

  const filteredAlerts = ALERTS.filter(alert => {
    if (activeTab === 'all') return true;
    return alert.category === activeTab;
  });

  const renderAlertItem = ({ item, index }: { item: Alert; index: number }) => {
    const urgencyColors = {
      high: { main: '#E53E3E', bg: '#FFF5F5' },
      medium: { main: '#DD6B20', bg: '#FFFAF0' },
      low: { main: '#3182CE', bg: '#EBF8FF' },
    }[item.urgency];

    const categoryIcons = {
      outbreak: 'alert-decagram',
      moh: 'file-document-outline',
      info: 'information-outline',
    }[item.category];

    return (
      <AnimatedCard
        delay={index * 65}
        style={[
          styles.alertCard,
          { backgroundColor: colors.surface },
          item.urgency === 'high' ? { borderLeftWidth: 4, borderLeftColor: '#E53E3E' } : {},
        ]}
      >
        <View style={styles.alertHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : urgencyColors.bg }]}>
            <Icon source={categoryIcons} size={14} color={urgencyColors.main} />
            <Text style={[styles.categoryText, { color: urgencyColors.main }]}>{item.categoryLabel}</Text>
          </View>
          <Text style={[styles.alertDate, { color: colors.neutral[400] }]}>{item.date}</Text>
        </View>

        <Text style={[styles.alertTitle, { color: colors.neutral[900] }]}>{item.title}</Text>
        <Text style={[styles.alertMsg, { color: colors.neutral[600] }]}>{item.message}</Text>

        <View style={styles.alertActions}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: mode === 'dark' ? colors.neutral[100] : '#F3F9EE' }]}>
            <Icon source="share-variant" size={14} color="#2C5E3E" />
            <Text style={styles.actionBtnText}>Share Alert</Text>
          </TouchableOpacity>
          {userRole !== 'COMMUNITY' && item.category === 'outbreak' && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#E2F0D9' }]}>
              <Icon source="checkbox-marked-circle-outline" size={14} color="#2C5E3E" />
              <Text style={[styles.actionBtnText, { color: '#2C5E3E' }]}>Acknowledge</Text>
            </TouchableOpacity>
          )}
        </View>
      </AnimatedCard>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Banner */}
      <LinearGradient
        colors={['#1F2937', '#111827'] as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.iconCircle}>
            <Icon source="bell-ring" size={24} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{t('alerts.title') || 'Alert Center'}</Text>
            <Text style={styles.headerSub}>
              {userRole === 'COMMUNITY'
                ? 'Official public health alerts and updates'
                : 'Surveillance advisories and ministry directives'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface }]}>
        {(['all', 'outbreak', 'moh'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab ? { borderBottomColor: '#2C5E3E', borderBottomWidth: 2 } : {},
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === tab ? '#2C5E3E' : colors.neutral[400] },
              activeTab === tab ? { fontWeight: '800' } : {},
            ]}>
              {tab === 'all' ? 'All Alerts' : tab === 'outbreak' ? 'Outbreaks' : 'Directives'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filteredAlerts}
        renderItem={renderAlertItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={[styles.listContent, isDesktop && styles.desktopList]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Icon source="bell-off-outline" size={48} color={colors.neutral[200]} />
            <Text style={[styles.emptyTitle, { color: colors.neutral[600] }]}>No active alerts</Text>
          </View>
        }
      />
    </View>
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
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: rf(18), fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginTop: 2 },
  // Tabs
  tabBar: {
    flexDirection: 'row',
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: { fontSize: 13, fontWeight: '600' },
  // List
  listContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  desktopList: { maxWidth: 900, alignSelf: 'center', width: '100%' },
  // Card
  alertCard: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  categoryText: { fontSize: 11, fontWeight: '800' },
  alertDate: { fontSize: 11, fontWeight: '600' },
  alertTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8, lineHeight: 22 },
  alertMsg: { fontSize: 13, fontWeight: '500', lineHeight: 19, marginBottom: 12 },
  alertActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: '#2C5E3E' },
  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
});

export default AlertCenterScreen;
