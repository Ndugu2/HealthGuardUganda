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
  Alert,
  Linking,
  Modal,
} from 'react-native';
import { Text, Icon, Avatar, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { getStats, markBroadcastAsRead, saveSetting } from '../db/Database';
import AnimatedCard from '../components/AnimatedCard';
import StatusBadge from '../components/StatusBadge';
import { colors, spacing, radii, shadows, topicColors, gradients } from '../theme';
import { useResponsive, typography } from '../responsive';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../ThemeContext';
import { RiskService, RiskAlert } from '../services/RiskService';
import { BroadcastService } from '../services/BroadcastService';
import { Broadcast } from '../db/Database';
import { MythBusterFeed } from '../components/home/MythBusterFeed';
import { AilmentGuides } from '../components/home/AilmentGuides';
import { FacilityLocator } from '../components/home/FacilityLocator';
import { HealthQuiz } from '../components/home/HealthQuiz';
import { DailyHealthTips } from '../components/home/DailyHealthTips';
import { RumorChecker } from '../components/home/RumorChecker';
import { EmergencyFirstAid } from '../components/home/EmergencyFirstAid';
import { VillageMedicineShelf } from '../components/home/VillageMedicineShelf';

interface HomeScreenProps {
  navigateToTab: (key: string) => void;
  userRole?: string;
}

const RECENT_ALERTS = [
  { id: 1, type: 'alert', title: 'Malaria Outbreak Warning', title_lg: 'Okulabula ku Malaria', location: 'Wakiso District', location_lg: 'Disitulikiti y\'e Wakiso', time: '2h ago', icon: 'alert-decagram' },
  { id: 2, type: 'verified', title: 'Vaccination Drive Confirmed', title_lg: 'Okukakasa Enkingo', location: 'Kampala North', location_lg: 'Kampala mu Mambuka', time: '5h ago', icon: 'check-decagram' },
  { id: 3, type: 'myth', title: 'New COVID Myth Debunked', title_lg: 'Olufumo lwa COVID Olulala', location: 'National', location_lg: 'Eggwanga Lyonna', time: '1d ago', icon: 'shield-search' },
  { id: 4, type: 'update', title: 'MoH Guidelines Updated', title_lg: 'Ebikwata ku Minisitule y\'Obulamu', location: 'Ministry of Health', location_lg: 'Minisitule y\'Obulamu', time: '1d ago', icon: 'file-document-outline' },
];


const HomeScreen: React.FC<HomeScreenProps> = ({ navigateToTab, userRole }) => {
  const { t, i18n } = useTranslation();
  const { colors, mode } = useAppTheme();
  const { isPhone, isTablet, isDesktop, hPad, heroHeight, rf, bp } = useResponsive();
  const { width } = useWindowDimensions();
  const isCommunity = userRole === 'COMMUNITY';

  const [stats, setStats] = useState({ total: 0, accurate: 0, misinfo: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [risks, setRisks] = useState<RiskAlert[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [selectedAdvisoryAlert, setSelectedAdvisoryAlert] = useState<Broadcast | null>(null);

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

  const changeLanguage = async (lang: string) => {
    i18n.changeLanguage(lang);
    await saveSetting('app_language', lang);
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
          <AnimatedCard
            key={alert.id}
            delay={0}
            style={[styles.urgentBanner]}
          >
            <LinearGradient
              colors={gradients.danger}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bannerGradient}
            >
              <View style={styles.bannerIcon}>
                <Icon source="alert-decagram" size={28} color="#FFF" />
              </View>
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>{i18n.language === 'lg' ? alert.title_lg || alert.title : alert.title}</Text>
                <Text style={styles.bannerMessage} numberOfLines={2}>
                  {i18n.language === 'lg' ? alert.message_lg || alert.message : alert.message}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.bannerAction}
                onPress={() => {
                  setSelectedAdvisoryAlert(alert);
                }}
              >
                <Text style={styles.bannerActionText}>{t('home.view_btn') || 'VIEW'}</Text>
                <Icon source="chevron-right" size={16} color="#FFF" />
              </TouchableOpacity>
            </LinearGradient>
          </AnimatedCard>
        ))}

        <View style={isDesktop ? styles.desktopMain : null}>
          <View style={styles.welcomeSection}>
            <Text style={[styles.dashboardLabel, { color: colors.neutral[400] }]}>{isCommunity ? t('home.community_label') : t('home.dashboard_overview')}</Text>
            <Text style={[styles.welcomeText, { color: colors.neutral[900], fontSize: isPhone ? 22 : 30 }]}>{isCommunity ? t('home.community_welcome') : t('home.welcome')}</Text>
            <Text style={[styles.locationText, { color: colors.neutral[500], fontSize: isPhone ? 13 : 18 }]}>{isCommunity ? t('home.community_subtitle') : t('home.reporting_from', { location: 'Kampala Central Health Office' })}</Text>
          </View>

          <View style={isDesktop ? styles.desktopLayout : null}>
            <View style={isDesktop ? styles.leftSide : null}>
              {/* ── EMERGENCY SOS BUTTON — COMMUNITY ONLY ── */}
              {isCommunity && <EmergencyFirstAid />}

              {/* ── UNIFIED STATS CARD ── */}
              {isCommunity ? (
                <AnimatedCard delay={100} style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.neutral[100] }]}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: colors.neutral[400] }]}>{t('home.rumors_checked')}</Text>
                    <Text style={[styles.statValue, { color: colors.primary[900] }]}>{stats.total.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.neutral[100] }]} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: colors.neutral[400] }]}>{t('home.verified_facts')}</Text>
                    <Text style={[styles.statValue, { color: colors.primary[600] }]}>{stats.accurate}</Text>
                  </View>
                </AnimatedCard>
              ) : (
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
              )}

              {/* ── HERO IMAGE CARD ── */}
              <AnimatedCard delay={200} style={[styles.heroCard, { height: isPhone ? 200 : 380 }]}>
                <ImageBackground
                  source={require('../../assets/hero_dashboard.png')}
                  style={styles.heroImage}
                  imageStyle={{ borderRadius: radii.lg }}
                >
                  <View style={[styles.heroOverlay, { padding: isPhone ? 20 : 40 }]}>
                    <Text style={[styles.heroText, { fontSize: isPhone ? 18 : 28 }]}>{isCommunity ? t('home.community_hero_text') : t('home.hero_text')}</Text>
                  </View>
                </ImageBackground>
              </AnimatedCard>

              {isCommunity ? (
                <>
                  {/* ── MY VILLAGE MEDICINE SHELF ── */}
                  <VillageMedicineShelf />

                  {/* ── SEASONAL ALERT WIDGET ── */}
                  <AnimatedCard delay={150} style={[styles.seasonalCard, { backgroundColor: mode === 'light' ? '#F0F4F8' : colors.neutral[100] }]}>
                    <View style={styles.seasonalHeader}>
                      <Icon source="weather-pouring" size={24} color="#3182CE" />
                      <Text style={[styles.seasonalTitle, { color: '#2B6CB0' }]}>
                        {i18n.language === 'lg' ? 'Ekiseera ky\'Enkuba — Yewale Malaria' : 'Rainy Season — Prevent Malaria'}
                      </Text>
                    </View>
                    <Text style={[styles.seasonalText, { color: colors.neutral[700] }]}>
                      {i18n.language === 'lg'
                        ? 'Enkuba etonnya buli wamu. Fuba okulaba nti buli omu mu nju yo asula mu katimba k\'ensiri akaliko eddagala buli kiro.'
                        : 'Increased rainfall means more breeding sites for mosquitoes. Ensure your family sleeps under insecticide-treated nets and clear stagnant water around your home.'}
                    </Text>
                  </AnimatedCard>

                  {/* ── DAILY HEALTH TIP ── */}
                  <DailyHealthTips />

                  {/* ── MATERNAL & IMMUNIZATION QUICK PORTALS ── */}
                  <View style={styles.quickPortalsRow}>
                    <TouchableOpacity
                      style={[styles.portalPromoCard, { backgroundColor: '#FFF5F5', borderColor: '#FED7D7' }]}
                      onPress={() => navigateToTab('more')}
                    >
                      <View style={styles.promoHeader}>
                        <Icon source="baby-carriage" size={24} color="#E53E3E" />
                        <Text style={[styles.portalPromoTitle, { color: '#9B2C2C' }]}>{t('home.maternal_tracker')}</Text>
                      </View>
                      <Text style={styles.portalPromoSub}>{t('home.maternal_tracker_sub')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.portalPromoCard, { backgroundColor: '#EBF8FF', borderColor: '#BEE3F8' }]}
                      onPress={() => navigateToTab('more')}
                    >
                      <View style={styles.promoHeader}>
                        <Icon source="needle" size={24} color="#3182CE" />
                        <Text style={[styles.portalPromoTitle, { color: '#2B6CB0' }]}>{t('home.immunization')}</Text>
                      </View>
                      <Text style={styles.portalPromoSub}>{t('home.immunization_sub')}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* ── VILLAGE RUMOR CHECKER ── */}
                  <RumorChecker />

                  <MythBusterFeed />
                  <AilmentGuides />
                  <FacilityLocator />
                  <HealthQuiz />
                </>
              ) : (
                <>
                  {/* ── COMMUNITY RISK MONITOR (HIGH VALUE) ── */}
                  <View style={[styles.riskSection, { backgroundColor: colors.surface, borderColor: colors.neutral[200] }]}>
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
                          style={[styles.riskCard, { backgroundColor: colors.neutral[50], borderLeftColor: risk.severity === 'HIGH' ? colors.danger[900] : risk.severity === 'MEDIUM' ? colors.warning[900] : colors.primary[900] }]}
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
                  <View style={[styles.activitySection, { backgroundColor: colors.surface, borderColor: colors.neutral[200], marginTop: spacing.lg }]}>
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
                </>
              )}
            </View>

            <View style={isDesktop ? styles.rightSide : null}>
              {/* ── PRIMARY ACTION CARD ── */}
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => navigateToTab('analyze')}
                style={styles.actionCard}
              >
                <LinearGradient
                  colors={gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.actionGradient, { padding: isPhone ? 16 : 24 }]}
                >
                  <View style={[styles.actionIconCircle, { width: isPhone ? 48 : 64, height: isPhone ? 48 : 64, borderRadius: isPhone ? 24 : 32, marginRight: isPhone ? 12 : 16 }]}>
                    <Icon source={isCommunity ? "help-circle-outline" : "magnify"} size={isPhone ? 22 : 28} color="#FFF" />
                  </View>
                  <View style={styles.actionTextContent}>
                    <Text style={[styles.actionTitle, { fontSize: isPhone ? 16 : 24 }]}>{isCommunity ? t('home.ask_health_question') : t('home.analyze_card_title')}</Text>
                    <Text style={[styles.actionSub, { fontSize: isPhone ? 12 : 15 }]}>{isCommunity ? t('home.ask_health_sub') : t('home.analyze_card_sub')}</Text>
                  </View>
                  <Icon source="arrow-right" size={isPhone ? 22 : 28} color="#FFF" />
                </LinearGradient>
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

                {!isCommunity && (
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
                )}
              </View>

              {/* ── QUICK TIPS ── */}
              <View style={[styles.tipsSection, { backgroundColor: mode === 'light' ? '#FFF9E6' : colors.neutral[100], borderColor: colors.warning[500] + '40' }]}>
                <Text style={[styles.tipsHeaderTitle, { color: colors.warning[500] }]}>{t('home.tips_title')}</Text>
                <View style={styles.tipItem}>
                  <Icon source="lightbulb-on-outline" size={18} color={colors.warning[500]} />
                  <Text style={[styles.tipText, { color: colors.neutral[700] }]}>{t('home.tip_1')}</Text>
                </View>
                <View style={styles.tipItem}>
                  <Icon source="lightbulb-on-outline" size={18} color={colors.warning[500]} />
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

      {/* ── INTERACTIVE OUTBREAK RESPONSE MODAL ── */}
      <Modal
        visible={!!selectedAdvisoryAlert}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedAdvisoryAlert(null)}
      >
        <View style={advisoryStyles.overlay}>
          <View style={[advisoryStyles.sheet, { backgroundColor: colors.surface }]}>
            <View style={advisoryStyles.header}>
              <View style={advisoryStyles.headerIconBox}>
                <Icon source="alert-decagram" size={28} color="#C53030" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[advisoryStyles.alertTag, { color: '#C53030' }]}>
                  {i18n.language === 'lg' ? 'OKULABULA OKWAMANGU' : 'URGENT MEDICAL ADVISORY'}
                </Text>
                <Text style={[advisoryStyles.title, { color: colors.neutral[900] }]} numberOfLines={2}>
                  {selectedAdvisoryAlert ? (i18n.language === 'lg' ? selectedAdvisoryAlert.title_lg || selectedAdvisoryAlert.title : selectedAdvisoryAlert.title) : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedAdvisoryAlert(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Icon source="close" size={24} color={colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={advisoryStyles.scrollContent} showsVerticalScrollIndicator={false}>
              <Text style={[advisoryStyles.msg, { color: colors.neutral[700] }]}>
                {selectedAdvisoryAlert ? (i18n.language === 'lg' ? selectedAdvisoryAlert.message_lg || selectedAdvisoryAlert.message : selectedAdvisoryAlert.message) : ''}
              </Text>

              {/* DYNAMIC ACTION PROTOCOLS (E.G. MEASLES DETECTED) */}
              {selectedAdvisoryAlert?.title.toLowerCase().includes('measles') && (
                <View style={[advisoryStyles.protocolBox, { backgroundColor: mode === 'light' ? '#FFF5F5' : colors.neutral[100], borderColor: '#FEB2B2' }]}>
                  <View style={advisoryStyles.protocolHeader}>
                    <Icon source="hospital-box" size={20} color="#C53030" />
                    <Text style={[advisoryStyles.protocolTitle, { color: '#9B2C2C' }]}>
                      {i18n.language === 'lg' ? 'Mumpumpu (Measles) — Ebikolebwa Mangu' : 'Measles Protocol — Essential Offline Triage'}
                    </Text>
                  </View>
                  <View style={advisoryStyles.stepsList}>
                    <View style={advisoryStyles.stepItem}>
                      <View style={[advisoryStyles.stepDot, { backgroundColor: '#C53030' }]} />
                      <Text style={[advisoryStyles.stepText, { color: colors.neutral[700] }]}>
                        {i18n.language === 'lg' ? 'Mukuume omwana wekka okumala ennaku 5 okutangira okusaasaana' : 'Isolate the child for at least 5 days from rash onset to stop respiratory spread.'}
                      </Text>
                    </View>
                    <View style={advisoryStyles.stepItem}>
                      <View style={[advisoryStyles.stepDot, { backgroundColor: '#C53030' }]} />
                      <Text style={[advisoryStyles.stepText, { color: colors.neutral[700] }]}>
                        {i18n.language === 'lg' ? 'Wa omwana emirundi ebiri egya Vitamin A supplement' : 'Administer two doses of Vitamin A supplements immediately.'}
                      </Text>
                    </View>
                    <View style={advisoryStyles.stepItem}>
                      <View style={[advisoryStyles.stepDot, { backgroundColor: '#C53030' }]} />
                      <Text style={[advisoryStyles.stepText, { color: colors.neutral[700] }]}>
                        {i18n.language === 'lg' ? 'Kozesa Paracetamol ku musujja era labirira amaaso (weewale ekizikiza)' : 'Treat high fever with Paracetamol; clean eyes with sterile water.'}
                      </Text>
                    </View>
                    <View style={advisoryStyles.stepItem}>
                      <View style={[advisoryStyles.stepDot, { backgroundColor: '#C53030' }]} />
                      <Text style={[advisoryStyles.stepText, { color: colors.neutral[700] }]}>
                        {i18n.language === 'lg' ? 'Kakasa nti enkingo ez’obulwadde zombi zaggwaako omwana wansi w’emyaka 5' : 'Verify routine immunizations under the age of 5 (MR 1st dose + MR booster).'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* INTEGRATED INTERACTIVE ACTIONS */}
              <View style={advisoryStyles.actionsWrap}>
                <TouchableOpacity
                  style={[advisoryStyles.ctaBtn, { backgroundColor: colors.primary[900] }]}
                  onPress={() => {
                    setSelectedAdvisoryAlert(null);
                    navigateToTab('more'); // Leads to immunization card tab
                  }}
                >
                  <Icon source="checkbox-marked-circle-outline" size={20} color="#FFF" />
                  <Text style={advisoryStyles.ctaText}>
                    {i18n.language === 'lg' ? 'Kakasa Ekitabo ky\'Enkingo' : 'Verify Child Vaccine Schedule'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[advisoryStyles.ctaBtn, { backgroundColor: '#3182CE' }]}
                  onPress={() => {
                    setSelectedAdvisoryAlert(null);
                    navigateToTab('facilities'); // Opens mapping locator tab
                  }}
                >
                  <Icon source="hospital-marker" size={20} color="#FFF" />
                  <Text style={advisoryStyles.ctaText}>
                    {i18n.language === 'lg' ? 'Noonya Amalwaliro g\'Enkingo' : 'Locate Free Vaccine Clinics'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[advisoryStyles.dismissBtn, { borderColor: colors.neutral[300] }]}
                  onPress={async () => {
                    if (selectedAdvisoryAlert) {
                      await markBroadcastAsRead(selectedAdvisoryAlert.id);
                      // reload list
                      const b = await BroadcastService.fetchOfflineBroadcasts();
                      setBroadcasts(b);
                    }
                    setSelectedAdvisoryAlert(null);
                  }}
                >
                  <Text style={[advisoryStyles.dismissText, { color: colors.neutral[600] }]}>
                    {i18n.language === 'lg' ? 'Okitegedde & Ggyako' : 'Acknowledge & Dismiss Alert'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    backgroundColor: colors.surface,
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
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary[900],
    lineHeight: 20,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary[900],
    lineHeight: 16,
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary[50],
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
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: spacing.lg,
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
    fontSize: 11,
    fontWeight: '800',
    color: colors.neutral[400],
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  welcomeText: {
    fontSize: 30,
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
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.neutral[400],
    marginBottom: 4,
  },
  statValue: {
    fontSize: 26,
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
    borderColor: colors.surface,
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
    // border removed for premium look
    borderColor: colors.neutral[100],
  },
  riskSection: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    ...shadows.sm,
    borderWidth: 0,
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
    backgroundColor: colors.neutral[50],
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
    fontSize: 15,
    fontWeight: '800',
  },
  riskRegion: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
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
    flexDirection: 'column',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: 16,
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
  urgentBanner: {
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
    ...shadows.lg,
    overflow: 'hidden',
  },
  bannerGradient: {
    flexDirection: 'row',
    padding: spacing.lg,
    alignItems: 'center',
  },
  bannerIcon: {
    marginRight: spacing.md,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  bannerMessage: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  bannerAction: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.md,
    marginLeft: spacing.md,
    gap: 4,
  },
  bannerActionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  actionCard: {
    borderRadius: radii.xl,
    marginBottom: spacing.lg,
    ...shadows.lg,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  actionSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '500',
    marginTop: 2,
  },
  secondaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    flexBasis: '45%',
    minWidth: 140,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    ...shadows.sm,
  },
  secondaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  secondarySub: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  tipsSection: {
    backgroundColor: colors.warning[50],
    padding: spacing.lg,
    borderRadius: radii.xl,
    marginBottom: spacing.xl,
    borderWidth: 0,
  },
  seasonalCard: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  seasonalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  seasonalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  seasonalText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  communityTipSection: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    ...shadows.sm,
  },
  tipMainText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  tipsHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.warning[900],
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

  /* ── Myth-Buster Feed ── */
  mythSection: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    ...shadows.sm,
  },
  mythCard: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
  },
  mythCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mythVerdictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  mythVerdictText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  mythTime: {
    fontSize: 11,
    fontWeight: '600',
  },
  mythClaim: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 8,
  },
  mythFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mythSource: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* ── Quick Ailment Guides ── */
  ailmentSection: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    ...shadows.sm,
  },
  ailmentCard: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
  },
  ailmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ailmentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ailmentTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  ailmentSteps: {
    marginTop: 14,
    gap: 10,
  },
  ailmentStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  stepText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    fontWeight: '500',
  },

  /* ── Facility Locator & Emergency Hotlines ── */
  facilitySection: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    ...shadows.sm,
  },
  facilitySubHeader: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  hotlineRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  hotlineCard: {
    flex: 1,
    minWidth: 90,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: 6,
  },
  hotlineLabel: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  hotlineNumber: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  facilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    gap: 12,
  },
  facilityIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facilityInfo: {
    flex: 1,
  },
  facilityName: {
    fontSize: 14,
    fontWeight: '700',
  },
  facilityType: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Health Quiz ── */
  quizSection: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  quizProgress: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  quizCard: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  quizQuestion: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 16,
  },
  quizButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quizBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radii.lg,
  },
  quizBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
  quizResult: {
    gap: 12,
  },
  quizResultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.lg,
  },
  quizResultText: {
    fontSize: 16,
    fontWeight: '800',
  },
  quizExplanation: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  quizNextBtn: {
    paddingVertical: 14,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  quizNextBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  quizScoreTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  quizScoreBig: {
    fontSize: 48,
    fontWeight: '900',
    marginVertical: 4,
  },
  quizScoreMsg: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  feedFilterContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  feedFilterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.neutral[100],
  },
  feedFilterBtnActive: {
    backgroundColor: '#805AD5',
  },
  feedFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[600],
  },
  feedFilterTextActive: {
    color: '#FFF',
  },
  reportRumorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radii.xl,
    marginBottom: spacing.lg,
    gap: spacing.md,
    ...shadows.md,
  },
  reportRumorTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  reportRumorSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '500',
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
    backgroundColor: colors.surface,
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
  quickPortalsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  portalPromoCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  portalPromoTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  portalPromoSub: {
    fontSize: 11,
    color: '#4A5568',
    lineHeight: 15,
  },
});

const advisoryStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.xl,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.lg,
  },
  headerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FED7D7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTag: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  msg: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: spacing.lg,
  },
  protocolBox: {
    borderRadius: radii.xl,
    borderWidth: 1.5,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  protocolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  protocolTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  stepsList: {
    gap: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  stepText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '600',
  },
  actionsWrap: {
    gap: 12,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radii.xl,
  },
  ctaText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: radii.xl,
    borderWidth: 1,
    marginTop: 4,
  },
  dismissText: {
    fontSize: 14,
    fontWeight: '800',
  },
});

export default HomeScreen;
