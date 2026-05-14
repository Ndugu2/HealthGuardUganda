import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Animated,
  RefreshControl,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { Text, Icon, Avatar, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { getStats } from '../db/Database';
import AnimatedCard from '../components/AnimatedCard';
import StatusBadge from '../components/StatusBadge';
import { colors, spacing, radii, shadows, topicColors } from '../theme';
import { useAppTheme } from '../ThemeContext';
import { RiskService, RiskAlert } from '../services/RiskService';
import { BroadcastService } from '../services/BroadcastService';
import { Broadcast } from '../db/Database';

interface HomeScreenProps {
  navigateToTab: (key: string) => void;
}

const RECENT_ALERTS = [
  { id: 1, type: 'alert', title: 'Malaria Outbreak Warning', title_lg: 'Okulabula ku Malaria', location: 'Wakiso District', location_lg: 'Disitulikiti y\'e Wakiso', time: '2h ago', icon: 'alert-decagram' },
  { id: 2, type: 'verified', title: 'Vaccination Drive Confirmed', title_lg: 'Okukakasa Enkingo', location: 'Kampala North', location_lg: 'Kampala mu Mambuka', time: '5h ago', icon: 'check-decagram' },
  { id: 3, type: 'myth', title: 'New COVID Myth Debunked', title_lg: 'Olufumo lwa COVID Olulala', location: 'National', location_lg: 'Eggwanga Lyonna', time: '1d ago', icon: 'shield-search' },
  { id: 4, type: 'update', title: 'MoH Guidelines Updated', title_lg: 'Ebikwata ku Minisitule y\'Obulamu', location: 'Ministry of Health', location_lg: 'Minisitule y\'Obulamu', time: '1d ago', icon: 'file-document-outline' },
];

const HomeScreen: React.FC<HomeScreenProps> = ({ navigateToTab }) => {
  const { t, i18n } = useTranslation();
  const { colors, mode } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 900;

  const [stats, setStats] = useState({ total: 0, accurate: 0, misinfo: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [risks, setRisks] = useState<RiskAlert[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);

  const loadStats = useCallback(async () => {
    const s = await getStats();
    setStats(s);
    const r = await RiskService.analyzeCommunityRisk();
    setRisks(r);
    
    // Sync broadcasts (Mock sync)
    await BroadcastService.syncAlerts();
    const b = await BroadcastService.fetchOfflineBroadcasts();
    setBroadcasts(b);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStats();
    setTimeout(() => setRefreshing(false), 500);
  }, [loadStats]);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── MOBILE HEADER ── */}
      {!isDesktop && (
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.neutral[100] }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.logoCircle, { backgroundColor: colors.primary[50] }]}>
              <Icon source="shield-plus" size={24} color={colors.primary[900]} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.primary[900] }]}>HealthGuard</Text>
              <Text style={[styles.headerSubtitle, { color: colors.primary[900] }]}>Uganda</Text>
            </View>
          </View>
          <View style={[styles.offlinePill, { backgroundColor: mode === 'light' ? '#E2F0D9' : colors.neutral[100] }]}>
            <Icon source="cloud-check-outline" size={14} color={colors.primary[800]} />
            <Text style={[styles.offlineText, { color: colors.primary[900] }]}>{t('home.offline_ready')}</Text>
          </View>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[900]} />
        }
      >
        {/* ── EMERGENCY BROADCAST BANNER ── */}
        {broadcasts.filter(b => b.severity === 'URGENT' && !b.isRead).map(alert => (
          <AnimatedCard key={alert.id} delay={0} style={[styles.urgentBanner, { backgroundColor: colors.danger[900] }]}>
            <View style={styles.bannerIcon}>
              <Icon source="alert-decagram" size={24} color="#FFF" />
            </View>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>{i18n.language === 'lg' ? alert.title_lg || alert.title : alert.title}</Text>
              <Text style={styles.bannerMessage}>{i18n.language === 'lg' ? alert.message_lg || alert.message : alert.message}</Text>
            </View>
            <TouchableOpacity style={styles.bannerAction}>
              <Text style={styles.bannerActionText}>{t('home.view_btn')}</Text>
            </TouchableOpacity>
          </AnimatedCard>
        ))}

        <View style={isDesktop ? styles.desktopMain : null}>
          <View style={styles.welcomeSection}>
            <Text style={[styles.dashboardLabel, { color: colors.neutral[400] }]}>{t('home.dashboard_overview')}</Text>
            <Text style={[styles.welcomeText, { color: colors.neutral[900] }]}>{t('home.welcome')}</Text>
            <Text style={[styles.locationText, { color: colors.neutral[500] }]}>{t('home.reporting_from', { location: 'Kampala Central Health Office' })}</Text>
          </View>

          <View style={isDesktop ? styles.desktopLayout : null}>
            <View style={isDesktop ? styles.leftSide : null}>
              {/* ── UNIFIED STATS CARD ── */}
              <AnimatedCard delay={100} style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.neutral[100] }]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.neutral[400] }]}>{t('home.stats_total')}</Text>
                  <Text style={[styles.statValue, { color: colors.primary[900] }]}>{stats.total.toLocaleString()}</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.neutral[100] }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.neutral[400] }]}>{t('home.stats_myths')}</Text>
                  <Text style={[styles.statValue, { color: colors.primary[600] }]}>{stats.misinfo}</Text>
                </View>
                <View style={styles.avatars}>
                  <Avatar.Text size={24} label="JD" style={[styles.avatar, { backgroundColor: colors.primary[100], borderColor: colors.surface }]} labelStyle={{ color: colors.primary[900] }} />
                  <Avatar.Text size={24} label="SM" style={[styles.avatar, { marginLeft: -8, backgroundColor: colors.primary[100], borderColor: colors.surface }]} labelStyle={{ color: colors.primary[900] }} />
                </View>
              </AnimatedCard>

              {/* ── HERO IMAGE CARD ── */}
              <AnimatedCard delay={200} style={styles.heroCard}>
                <ImageBackground
                  source={require('../../assets/hero_dashboard.png')}
                  style={styles.heroImage}
                  imageStyle={{ borderRadius: radii.lg }}
                >
                  <View style={styles.heroOverlay}>
                    <Text style={styles.heroText}>{t('home.hero_text')}</Text>
                  </View>
                </ImageBackground>
              </AnimatedCard>

              {/* ── COMMUNITY RISK MONITOR (HIGH VALUE) ── */}
              <View style={[styles.riskSection, { backgroundColor: colors.surface, borderColor: colors.neutral[100] }]}>
                <View style={styles.activityHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>{t('home.risk_monitor')}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: colors.danger[50] }]}>
                    <Text style={[styles.statusText, { color: colors.danger[900] }]}>{t('home.ai_active')}</Text>
                  </View>
                </View>
                <Text style={[styles.sectionSub, { color: colors.neutral[500] }]}>{t('home.risk_sub')}</Text>

                <View style={styles.riskList}>
                  {risks.map((risk) => (
                    <TouchableOpacity 
                      key={risk.id} 
                      style={[styles.riskCard, { borderLeftColor: risk.severity === 'HIGH' ? colors.danger[900] : risk.severity === 'MEDIUM' ? colors.warning[900] : colors.primary[900] }]}
                    >
                      <View style={styles.riskCardMain}>
                        <View style={styles.riskHeader}>
                          <Text style={[styles.riskTopic, { color: colors.neutral[900] }]}>{risk.topic}</Text>
                          <View style={[styles.growthBadge, { backgroundColor: risk.severity === 'HIGH' ? colors.danger[50] : colors.primary[50] }]}>
                            <Icon source="trending-up" size={14} color={risk.severity === 'HIGH' ? colors.danger[900] : colors.primary[900]} />
                            <Text style={[styles.growthText, { color: risk.severity === 'HIGH' ? colors.danger[900] : colors.primary[900] }]}>+{risk.growthRate}%</Text>
                          </View>
                        </View>
                        <Text style={[styles.riskRegion, { color: colors.neutral[500] }]}>{risk.region} {t('common.district') || 'District'}</Text>
                        <Text style={[styles.riskMessage, { color: colors.neutral[700] }]}>{risk.message}</Text>
                      </View>
                      <Icon source="chevron-right" size={24} color={colors.neutral[300]} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* ── RECENT ACTIVITY FEED ── */}
              <View style={[styles.activitySection, { backgroundColor: colors.surface, borderColor: colors.neutral[100], marginTop: spacing.lg }]}>
                 <View style={styles.activityHeader}>
                   <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>{t('home.recent_activity')}</Text>
                   <TouchableOpacity>
                     <Text style={[styles.viewAllText, { color: colors.primary[900] }]}>{t('home.view_all')}</Text>
                   </TouchableOpacity>
                 </View>
                 
                 <View style={styles.activityList}>
                   {RECENT_ALERTS.map((alert, idx) => (
                     <View key={alert.id} style={styles.activityItem}>
                        <View style={[styles.activityIconBox, { backgroundColor: alert.type === 'alert' ? (mode === 'light' ? '#FDECEA' : colors.danger[900] + '40') : (mode === 'light' ? '#E2F0D9' : colors.primary[900] + '40') }]}>
                           <Icon source={alert.icon} size={20} color={alert.type === 'alert' ? colors.danger[900] : colors.primary[900]} />
                        </View>
                        <View style={styles.activityTextWrap}>
                           <Text style={[styles.activityTitle, { color: colors.neutral[800] }]}>
                              {i18n.language === 'lg' ? alert.title_lg || alert.title : alert.title}
                           </Text>
                           <Text style={[styles.activitySub, { color: colors.neutral[500] }]}>
                              {i18n.language === 'lg' ? alert.location_lg || alert.location : alert.location} • {alert.time}
                           </Text>
                        </View>
                        <Icon source="chevron-right" size={20} color={colors.neutral[300]} />
                     </View>
                   ))}
                 </View>
              </View>
            </View>

            <View style={isDesktop ? styles.rightSide : null}>
              {/* ── PRIMARY ACTION CARD ── */}
              <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => navigateToTab('analyze')}
                style={[styles.actionCard, { backgroundColor: colors.primary[900] }]}
              >
                <View style={styles.actionIconCircle}>
                  <Icon source="magnify" size={24} color="#FFF" />
                </View>
                <View style={styles.actionTextContent}>
                   <Text style={styles.actionTitle}>{t('home.analyze_card_title')}</Text>
                   <Text style={styles.actionSub}>{t('home.analyze_card_sub')}</Text>
                </View>
                <Icon source="arrow-right" size={24} color="#FFF" />
              </TouchableOpacity>

              {/* ── SECONDARY ACTIONS ── */}
              <View style={isDesktop ? styles.secondaryCol : styles.secondaryRow}>
                <TouchableOpacity 
                  style={[styles.secondaryCard, { backgroundColor: colors.surface, borderColor: colors.neutral[200] }]} 
                  onPress={() => navigateToTab('knowledge')}
                >
                  <Icon source="book-open-outline" size={24} color={colors.primary[900]} />
                  <View>
                    <Text style={[styles.secondaryTitle, { color: colors.neutral[900] }]}>{t('home.kb_card_title')}</Text>
                    <Text style={[styles.secondarySub, { color: colors.neutral[500] }]}>{t('home.kb_card_sub')}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.secondaryCard, { backgroundColor: colors.surface, borderColor: colors.neutral[200] }]} 
                  onPress={() => navigateToTab('reports')}
                >
                  <Icon source="chart-box-outline" size={24} color={colors.primary[900]} />
                  <View>
                    <Text style={[styles.secondaryTitle, { color: colors.neutral[900] }]}>{t('home.reports_card_title')}</Text>
                    <Text style={[styles.secondarySub, { color: colors.neutral[500] }]}>{t('home.reports_card_sub')}</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* ── QUICK TIPS ── */}
              <View style={[styles.tipsSection, { backgroundColor: mode === 'light' ? '#FFF9E6' : colors.neutral[100], borderColor: colors.accent.amber + '40' }]}>
                 <Text style={[styles.tipsHeaderTitle, { color: colors.accent.amber }]}>{t('home.tips_title')}</Text>
                 <View style={styles.tipItem}>
                    <Icon source="lightbulb-on-outline" size={18} color={colors.accent.amber} />
                    <Text style={[styles.tipText, { color: colors.neutral[700] }]}>{t('home.tip_1')}</Text>
                 </View>
                 <View style={styles.tipItem}>
                    <Icon source="lightbulb-on-outline" size={18} color={colors.accent.amber} />
                    <Text style={[styles.tipText, { color: colors.neutral[700] }]}>{t('home.tip_2')}</Text>
                 </View>
              </View>

              {/* ── LANGUAGE SWITCHER ── */}
              <View style={styles.langToggleContainer}>
                <View style={[styles.langToggle, { backgroundColor: colors.neutral[200] }]}>
                  <TouchableOpacity 
                    style={[styles.langBtn, i18n.language === 'en' && [styles.langBtnActive, { backgroundColor: colors.surface }]]}
                    onPress={() => changeLanguage('en')}
                  >
                    <Text style={[styles.langBtnText, { color: colors.neutral[500] }, i18n.language === 'en' && { color: colors.primary[900] }]}>English</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.langBtn, i18n.language === 'lg' && [styles.langBtnActive, { backgroundColor: colors.surface }]]}
                    onPress={() => changeLanguage('lg')}
                  >
                    <Text style={[styles.langBtnText, { color: colors.neutral[500] }, i18n.language === 'lg' && { color: colors.primary[900] }]}>Luganda</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary[900],
    lineHeight: 22,
  },
  headerSubtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary[900],
    lineHeight: 20,
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
    paddingHorizontal: '2%',
    paddingTop: spacing.lg,
  },
  desktopLayout: {
    flexDirection: 'row',
    gap: 30,
  },
  leftSide: {
    flex: 1.8,
  },
  rightSide: {
    flex: 1,
  },
  welcomeSection: {
    marginBottom: spacing.xl,
  },
  dashboardLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.neutral[400],
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  locationText: {
    fontSize: 18,
    color: colors.neutral[500],
    fontWeight: '500',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: '#FFF',
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.neutral[400],
    marginBottom: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primary[900],
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: colors.neutral[100],
    marginHorizontal: spacing.lg,
  },
  avatars: {
    flexDirection: 'row',
  },
  avatar: {
    backgroundColor: colors.primary[100],
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary[900],
  },
  heroCard: {
    height: 380,
    marginBottom: 30,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  heroImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  heroOverlay: {
    padding: 40,
    backgroundColor: 'rgba(0,0,0,0.3)',
    height: '100%',
    justifyContent: 'flex-end',
  },
  heroText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 38,
    maxWidth: '70%',
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  riskSection: {
    backgroundColor: '#FFF',
    borderRadius: radii.lg,
    padding: spacing.xl,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  sectionSub: {
    fontSize: 14,
    marginBottom: spacing.lg,
    fontWeight: '500',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  riskList: {
    gap: spacing.md,
  },
  riskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: '#F8F9FA',
    borderRadius: radii.md,
    borderLeftWidth: 4,
  },
  riskCardMain: {
    flex: 1,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  riskTopic: {
    fontSize: 18,
    fontWeight: '800',
  },
  riskRegion: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  riskMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '900',
  },
  activitySection: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: spacing.lg,
  },
  sectionTitle: {
     fontSize: 20,
     fontWeight: '800',
     color: colors.neutral[900],
  },
  viewAllText: {
     color: colors.primary[900],
     fontWeight: '700',
     fontSize: 14,
  },
  activityList: {
     gap: spacing.md,
  },
  activityItem: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 15,
     paddingVertical: 10,
  },
  activityIconBox: {
     width: 40,
     height: 40,
     borderRadius: radii.md,
     alignItems: 'center',
     justifyContent: 'center',
  },
  activityTextWrap: {
     flex: 1,
  },
  activityTitle: {
     fontSize: 15,
     fontWeight: '700',
     color: colors.neutral[800],
  },
  activitySub: {
     fontSize: 12,
     color: colors.neutral[500],
  },
  actionCard: {
    backgroundColor: colors.primary[900],
    borderRadius: radii.lg,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  actionIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  actionTextContent: {
    flex: 1,
  },
  actionTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
  },
  actionSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  secondaryCol: {
    flexDirection: 'column',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  secondaryCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    ...shadows.sm,
  },
  secondaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  secondarySub: {
    fontSize: 14,
    color: colors.neutral[500],
  },
  tipsSection: {
     backgroundColor: '#FFF9E6',
     padding: spacing.lg,
     borderRadius: radii.lg,
     marginBottom: spacing.xl,
     borderWidth: 1,
     borderColor: colors.accent.amber + '40',
  },
  tipsHeaderTitle: {
     fontSize: 16,
     fontWeight: '800',
     color: colors.accent.amber,
     marginBottom: spacing.md,
  },
  tipItem: {
     flexDirection: 'row',
     gap: 10,
     marginBottom: 10,
  },
  tipText: {
     fontSize: 13,
     color: colors.neutral[700],
     fontWeight: '600',
     lineHeight: 18,
     flex: 1,
  },
  langToggleContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  langToggle: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[200],
    borderRadius: radii.full,
    padding: 4,
    width: '100%',
  },
  langBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: radii.full,
  },
  langBtnActive: {
    backgroundColor: '#FFF',
    ...shadows.sm,
  },
  langBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral[500],
  },
  langBtnTextActive: {
    color: colors.primary[900],
  },
  spacer: {
    height: spacing.xxl,
  },
  urgentBanner: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  bannerIcon: {
    marginRight: spacing.md,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  bannerMessage: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    lineHeight: 16,
  },
  bannerAction: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: spacing.md,
  },
  bannerActionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
});

export default HomeScreen;
