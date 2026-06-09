import React, { useRef, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, Platform, Animated, Easing } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { colors, spacing, radii, shadows } from '../theme';
import { useResponsive, typography, rf } from '../responsive';
import { useAppTheme } from '../ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

interface LandingScreenProps {
  onLoginPress: (roleHint?: 'COMMUNITY' | 'HW' | 'ADMIN') => void;
}

const LandingScreen: React.FC<LandingScreenProps> = ({ onLoginPress }) => {
  const { t } = useTranslation();
  const { mode } = useAppTheme();
  const { isPhone, isTablet, isDesktop, hPad } = useResponsive();
  const isMobile = isPhone;
  const [selectedRole, setSelectedRole] = useState<'COMMUNITY' | 'HW' | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const [offsets, setOffsets] = useState<Record<string, number>>({
    mission: 0,
    impact: 0,
    partners: 0,
  });

  // Simple floating animation for the hero image
  const floatAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const handleLayout = (key: string) => (event: any) => {
    const layout = event.nativeEvent.layout;
    setOffsets((prev) => ({ ...prev, [key]: layout.y }));
  };

  const scrollToSection = (key: string) => {
    setMobileMenuOpen(false);
    scrollViewRef.current?.scrollTo({ y: offsets[key], animated: true });
  };

  return (
    <View style={styles.container}>
      {/* ── HEADER ── */}
      <View style={[styles.header, { backgroundColor: mode === 'light' ? 'rgba(255,255,255,0.9)' : colors.surface }]}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={[colors.primary[600], colors.primary[900]]}
            style={styles.logoCircle}
          >
            <Icon source="shield-plus" size={24} color="#FFF" />
          </LinearGradient>
          <Text style={[styles.logoText, { color: colors.primary[900] }]}>HealthGuard <Text style={{ fontWeight: '400' }}>Uganda</Text></Text>
        </View>

        {isDesktop && (
          <View style={styles.headerCenter}>
            <TouchableOpacity onPress={() => { setSelectedRole('COMMUNITY'); onLoginPress('COMMUNITY'); }} style={{ marginLeft: 12 }}>
              <Text style={[styles.navLink, { color: colors.primary[900], fontWeight: '700' }]}>{t('landing.community_portal')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSelectedRole('HW'); onLoginPress('HW'); }} style={{ marginLeft: 12 }}>
              <Text style={[styles.navLink, { color: colors.primary[900], fontWeight: '700' }]}>{t('landing.hw_login')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.headerRight}>
          {!isDesktop && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity 
                style={[styles.mobileAdminBtn, { backgroundColor: colors.primary[900] }]}
                onPress={() => onLoginPress('ADMIN')}
              >
                <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>Admin Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.hamburgerBtn]}
                onPress={() => setMobileMenuOpen(prev => !prev)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Icon source={mobileMenuOpen ? 'close' : 'menu'} size={26} color={colors.primary[900]} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* ── MOBILE NAV DROPDOWN ── */}
      {mobileMenuOpen && !isDesktop && (
        <View style={[styles.mobileMenu, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderBottomColor: mode === 'light' ? '#E5E7EB' : colors.neutral[100] }]}>
          <TouchableOpacity style={styles.mobileNavItem} onPress={() => scrollToSection('mission')}>
            <Icon source="information-outline" size={20} color={colors.primary[900]} />
            <Text style={[styles.mobileNavLink, { color: colors.neutral[700] }]}>{t('landing.our_mission')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mobileNavItem} onPress={() => scrollToSection('impact')}>
            <Icon source="chart-bar" size={20} color={colors.primary[900]} />
            <Text style={[styles.mobileNavLink, { color: colors.neutral[700] }]}>{t('landing.impact')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mobileNavItem} onPress={() => scrollToSection('partners')}>
            <Icon source="handshake-outline" size={20} color={colors.primary[900]} />
            <Text style={[styles.mobileNavLink, { color: colors.neutral[700] }]}>{t('landing.partners')}</Text>
          </TouchableOpacity>
          <View style={[styles.mobileMenuDivider, { backgroundColor: mode === 'light' ? '#E5E7EB' : colors.neutral[100] }]} />
          <TouchableOpacity style={[styles.mobileMenuLoginBtn, { backgroundColor: colors.primary[900] }]} onPress={() => { setMobileMenuOpen(false); setSelectedRole('COMMUNITY'); onLoginPress('COMMUNITY'); }}>
            <Text style={styles.mobileMenuLoginText}>{t('landing.community_portal')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.mobileMenuLoginBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary[900] }]} onPress={() => { setMobileMenuOpen(false); setSelectedRole('HW'); onLoginPress('HW'); }}>
            <Text style={[styles.mobileMenuLoginText, { color: colors.primary[900] }]}>{t('landing.hw_login')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { backgroundColor: mode === 'light' ? '#FAFAFA' : colors.background }]}>
        
        {/* ── HERO SECTION ── */}
        <LinearGradient
            colors={mode === 'light' ? ['#F0FDF4', '#FFFFFF'] : [colors.surface, colors.background]}
            style={[styles.heroSection, !isDesktop && styles.heroSectionMobile]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
          <View style={styles.heroLeft}>
            <LinearGradient 
              colors={['rgba(20, 184, 166, 0.15)', 'rgba(16, 185, 129, 0.15)']} 
              style={[styles.pill]}
            >
              <View style={[styles.pillDot, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.pillText, { color: '#047857' }]}>{t('landing.hero_pill')}</Text>
            </LinearGradient>
            
            <Text style={[styles.heroHeadline, { color: colors.neutral[900] }, isMobile && styles.heroHeadlineMobile]}>
              {t('landing.hero_headline')} <Text style={{ color: colors.primary[900] }}>{t('landing.hero_headline_em')}</Text>
            </Text>
            
            <Text style={[styles.heroSub, { color: colors.neutral[600] }, isMobile && styles.heroSubMobile]}>
              {t('landing.hero_sub')}
            </Text>
            
            <View style={[styles.heroActions, isMobile && styles.heroActionsMobile]}>
              <TouchableOpacity onPress={() => onLoginPress('COMMUNITY')} activeOpacity={0.8}>
                <LinearGradient
                  colors={[colors.primary[600], colors.primary[900]]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={[styles.primaryActionBtn, isMobile && styles.primaryActionBtnMobile]}
                >
                  <Text style={[styles.primaryActionBtnText, isMobile && { fontSize: 16 }]}>{t('landing.community_portal')}</Text>
                  <Icon source="arrow-right" size={18} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.secondaryActionBtn, isMobile && styles.secondaryActionBtnMobile, { backgroundColor: '#FFF', borderColor: '#E5E7EB' }]} onPress={() => onLoginPress('HW')}>
                <Text style={[styles.secondaryActionBtnText, isMobile && { fontSize: 16 }, { color: colors.neutral[800] }]}>{t('landing.hw_login')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Animated.View style={[styles.heroRight, isMobile && styles.heroRightMobile, { transform: [{ translateY }] }]}>
            <View style={[styles.heroImageCard, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, ...shadows.xl }]}>
              <Image 
                source={require('../../assets/landing_hero.png')} 
                style={styles.heroImage as any} 
                resizeMode="contain"
              />
              
              <View style={[styles.floatingBadge, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, ...shadows.md }]}>
                <LinearGradient colors={['#E2F0D9', '#D1E8C5']} style={[styles.badgeIconWrap]}>
                  <Icon source="trending-down" size={18} color={colors.primary[900]} />
                </LinearGradient>
                <View>
                  <Text style={[styles.badgeLabel, { color: colors.neutral[500] }]}>{t('landing.misinfo_rate_label')}</Text>
                  <Text style={[styles.badgeValue, { color: colors.neutral[900] }]}>{t('landing.misinfo_rate_value')}</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* ── MISSION SECTION ── */}
        <View onLayout={handleLayout('mission')} style={styles.missionSection}>
          <Text style={[styles.sectionTitle, { color: colors.primary[900] }]}>{t('landing.mission_title')}</Text>
          <Text style={[styles.missionQuote, { color: colors.neutral[700] }, isMobile && styles.missionQuoteMobile]}>
            "{t('landing.mission_quote')}"
          </Text>

          <View style={[styles.featuresGrid, !isDesktop && styles.featuresGridMobile]}>
            <View style={[styles.featureCard, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderColor: mode === 'light' ? '#F3F4F6' : colors.neutral[200] }]}>
              <LinearGradient colors={[colors.primary[600], colors.primary[900]]} style={[styles.featureIconBox]}>
                <Icon source="shield-search" size={24} color="#FFF" />
              </LinearGradient>
              <Text style={[styles.featureTitle, { color: colors.neutral[900] }]}>{t('landing.feature_factcheck')}</Text>
              <Text style={[styles.featureDesc, { color: colors.neutral[500] }]}>
                {t('landing.feature_factcheck_desc')}
              </Text>
            </View>

            <View style={[styles.featureCard, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderColor: mode === 'light' ? '#F3F4F6' : colors.neutral[200] }]}>
              <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={[styles.featureIconBox]}>
                <Icon source="chart-bar" size={24} color="#FFF" />
              </LinearGradient>
              <Text style={[styles.featureTitle, { color: colors.neutral[900] }]}>{t('landing.feature_data')}</Text>
              <Text style={[styles.featureDesc, { color: colors.neutral[500] }]}>
                {t('landing.feature_data_desc')}
              </Text>
            </View>

            <View style={[styles.featureCard, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderColor: mode === 'light' ? '#F3F4F6' : colors.neutral[200] }]}>
              <LinearGradient colors={['#F59E0B', '#B45309']} style={[styles.featureIconBox]}>
                <Icon source="doctor" size={24} color="#FFF" />
              </LinearGradient>
              <Text style={[styles.featureTitle, { color: colors.neutral[900] }]}>{t('landing.feature_expert')}</Text>
              <Text style={[styles.featureDesc, { color: colors.neutral[500] }]}>
                {t('landing.feature_expert_desc')}
              </Text>
            </View>
          </View>
        </View>

        {/* ── IMPACT SECTION ── */}
        <LinearGradient colors={mode === 'light' ? ['#FFFFFF', '#F9FAFB'] : [colors.surface, colors.background]} onLayout={handleLayout('impact')} style={styles.impactSection}>
          <Text style={[styles.sectionTitle, { color: colors.primary[900] }]}>{t('landing.impact_title')}</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.neutral[500] }]}>
            {t('landing.impact_sub')}
          </Text>

          <View style={[styles.statsGrid, !isDesktop && styles.statsGridMobile]}>
            <View style={[styles.statCard, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderColor: mode === 'light' ? '#F3F4F6' : colors.neutral[200] }]}>
              <Text style={[styles.statNumber, { color: colors.primary[900] }]}>45%</Text>
              <Text style={[styles.statLabel, { color: colors.neutral[900] }]}>{t('landing.stat_misinfo')}</Text>
              <Text style={[styles.statDesc, { color: colors.neutral[500] }]}>{t('landing.stat_misinfo_desc')}</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderColor: mode === 'light' ? '#F3F4F6' : colors.neutral[200] }]}>
              <Text style={[styles.statNumber, { color: colors.primary[900] }]}>10K+</Text>
              <Text style={[styles.statLabel, { color: colors.neutral[900] }]}>{t('landing.stat_hw')}</Text>
              <Text style={[styles.statDesc, { color: colors.neutral[500] }]}>{t('landing.stat_hw_desc')}</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderColor: mode === 'light' ? '#F3F4F6' : colors.neutral[200] }]}>
              <Text style={[styles.statNumber, { color: colors.primary[900] }]}>24 Hrs</Text>
              <Text style={[styles.statLabel, { color: colors.neutral[900] }]}>{t('landing.stat_response')}</Text>
              <Text style={[styles.statDesc, { color: colors.neutral[500] }]}>{t('landing.stat_response_desc')}</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderColor: mode === 'light' ? '#F3F4F6' : colors.neutral[200] }]}>
              <Text style={[styles.statNumber, { color: colors.primary[900] }]}>150+</Text>
              <Text style={[styles.statLabel, { color: colors.neutral[900] }]}>{t('landing.stat_clinics')}</Text>
              <Text style={[styles.statDesc, { color: colors.neutral[500] }]}>{t('landing.stat_clinics_desc')}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── PARTNERS SECTION ── */}
        <View onLayout={handleLayout('partners')} style={styles.partnersSection}>
          <Text style={[styles.sectionTitle, { color: colors.primary[900] }]}>{t('landing.partners_title')}</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.neutral[500] }]}>
            {t('landing.partners_sub')}
          </Text>

          <View style={[styles.partnersGrid, !isDesktop && styles.partnersGridMobile]}>
            <View style={[styles.partnerCard, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderColor: mode === 'light' ? '#F3F4F6' : colors.neutral[200] }]}>
              <Icon source="bank" size={36} color={colors.primary[900]} />
              <Text style={[styles.partnerName, { color: colors.neutral[900] }]}>Ministry of Health</Text>
              <Text style={[styles.partnerSub, { color: colors.neutral[500] }]}>{t('landing.partner_moh_sub')}</Text>
            </View>

            <View style={[styles.partnerCard, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderColor: mode === 'light' ? '#F3F4F6' : colors.neutral[200] }]}>
              <Icon source="earth" size={36} color={colors.primary[900]} />
              <Text style={[styles.partnerName, { color: colors.neutral[900] }]}>World Health Org.</Text>
              <Text style={[styles.partnerSub, { color: colors.neutral[500] }]}>{t('landing.partner_who_sub')}</Text>
            </View>

            <View style={[styles.partnerCard, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderColor: mode === 'light' ? '#F3F4F6' : colors.neutral[200] }]}>
              <Icon source="school-outline" size={36} color={colors.primary[900]} />
              <Text style={[styles.partnerName, { color: colors.neutral[900] }]}>Bugema University</Text>
              <Text style={[styles.partnerSub, { color: colors.neutral[500] }]}>{t('landing.partner_bugema_sub')}</Text>
            </View>

            <View style={[styles.partnerCard, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderColor: mode === 'light' ? '#F3F4F6' : colors.neutral[200] }]}>
              <Icon source="face-agent" size={36} color={colors.primary[900]} />
              <Text style={[styles.partnerName, { color: colors.neutral[900] }]}>UNICEF Uganda</Text>
              <Text style={[styles.partnerSub, { color: colors.neutral[500] }]}>{t('landing.partner_unicef_sub')}</Text>
            </View>
          </View>
        </View>

        {/* ── FOOTER ── */}
        <View style={[styles.footer, { backgroundColor: colors.primary[900] }]}>
          <View style={[styles.footerContent, !isDesktop && styles.footerContentMobile]}>
            <View style={styles.footerCol}>
              <View style={styles.footerLogoRow}>
                <View style={[styles.logoCircle, { backgroundColor: '#FFF' }]}>
                  <Icon source="shield-plus" size={20} color={colors.primary[900]} />
                </View>
                <Text style={[styles.footerLogoText, { color: '#FFF' }]}>HealthGuard</Text>
              </View>
              <Text style={[styles.footerDesc, { color: 'rgba(255,255,255,0.7)' }]}>
                {t('landing.footer_desc')}
              </Text>
            </View>
            
            <View style={styles.footerLinksCol}>
               <Text style={styles.footerHeading}>{t('landing.footer_platform')}</Text>
               <TouchableOpacity onPress={() => onLoginPress('ADMIN')}><Text style={styles.footerLink}>{t('landing.footer_admin')}</Text></TouchableOpacity>
               <TouchableOpacity onPress={() => onLoginPress('HW')}><Text style={styles.footerLink}>{t('landing.footer_hw')}</Text></TouchableOpacity>
               <TouchableOpacity onPress={() => onLoginPress('COMMUNITY')}><Text style={styles.footerLink}>{t('landing.community_portal')}</Text></TouchableOpacity>
            </View>
            
            <View style={styles.footerLinksCol}>
               <Text style={styles.footerHeading}>{t('landing.footer_contact')}</Text>
               <Text style={styles.footerLink}>info@healthguard.ug</Text>
               <Text style={styles.footerLink}>+256 800 100 066</Text>
               <Text style={styles.footerLink}>Kampala, Uganda</Text>
            </View>
          </View>
          <View style={styles.footerBottom}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{t('landing.footer_copy')}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '5%',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    zIndex: 10,
    ...(Platform.OS === 'web' ? { position: 'sticky' as any, top: 0 } : {}),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: rf(18),
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  navLink: {
    fontSize: 15,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileAdminBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.full,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '8%',
    paddingVertical: 100,
    width: '100%',
    alignSelf: 'center',
    gap: 60,
  },
  heroSectionMobile: {
    flexDirection: 'column',
    paddingVertical: 50,
    paddingHorizontal: spacing.lg,
    gap: 30,
  },
  heroLeft: {
    flex: 1,
    alignItems: 'flex-start',
    width: '100%',
    maxWidth: 600,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.full,
    gap: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroHeadline: {
    fontSize: rf(48),
    fontWeight: '900',
    lineHeight: rf(54),
    letterSpacing: -1.5,
    marginBottom: 24,
  },
  heroHeadlineMobile: {
    fontSize: rf(34),
    lineHeight: rf(40),
    marginBottom: 20,
  },
  heroSub: {
    fontSize: rf(17),
    lineHeight: rf(26),
    marginBottom: 40,
    maxWidth: '90%',
  },
  heroSubMobile: {
    fontSize: rf(15),
    lineHeight: rf(24),
    marginBottom: 30,
    maxWidth: '100%',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  heroActionsMobile: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: radii.xl,
    gap: 10,
    ...shadows.md,
  },
  primaryActionBtnMobile: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: radii.xl,
    borderWidth: 1,
    ...shadows.sm,
  },
  secondaryActionBtnMobile: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryActionBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
  heroRight: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRightMobile: {
    width: '100%',
    paddingHorizontal: spacing.md,
  },
  heroImageCard: {
    width: '100%',
    maxWidth: 500,
    aspectRatio: 1,
    borderRadius: 40,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  heroImage: {
    width: '90%',
    height: '90%',
  },
  floatingBadge: {
    position: 'absolute',
    bottom: -20,
    left: -30,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: radii.xl,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  badgeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeValue: {
    fontSize: rf(18),
    fontWeight: '900',
  },
  missionSection: {
    alignItems: 'center',
    paddingHorizontal: '5%',
    paddingTop: 80,
    paddingBottom: 80,
    maxWidth: 1200,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: rf(26),
    fontWeight: '900',
    marginBottom: 24,
    textAlign: 'center',
  },
  missionQuote: {
    fontSize: rf(17),
    lineHeight: rf(28),
    textAlign: 'center',
    maxWidth: 800,
    marginBottom: 60,
    fontStyle: 'italic',
  },
  missionQuoteMobile: {
    fontSize: rf(15),
    lineHeight: rf(26),
  },
  featuresGrid: {
    flexDirection: 'row',
    gap: 30,
    width: '100%',
  },
  featuresGridMobile: {
    flexDirection: 'column',
    gap: 20,
  },
  featureCard: {
    flex: 1,
    padding: 30,
    borderRadius: radii.xl,
    borderWidth: 1,
    ...shadows.sm,
  },
  featureIconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  featureTitle: {
    fontSize: rf(17),
    fontWeight: '800',
    marginBottom: 12,
  },
  featureDesc: {
    fontSize: rf(14),
    lineHeight: rf(24),
  },
  impactSection: {
    alignItems: 'center',
    paddingHorizontal: '5%',
    paddingTop: 80,
    paddingBottom: 80,
    width: '100%',
  },
  sectionSubtitle: {
    fontSize: rf(16),
    lineHeight: rf(26),
    textAlign: 'center',
    maxWidth: 600,
    marginBottom: 60,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 30,
    width: '100%',
    maxWidth: 1200,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statsGridMobile: {
    flexDirection: 'column',
    gap: 20,
  },
  statCard: {
    flex: 1,
    minWidth: 220,
    padding: 30,
    borderRadius: radii.xl,
    borderWidth: 1,
    alignItems: 'flex-start',
    ...shadows.md,
  },
  statNumber: {
    fontSize: rf(36),
    fontWeight: '900',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: rf(16),
    fontWeight: '800',
    marginBottom: 12,
  },
  statDesc: {
    fontSize: rf(14),
    lineHeight: rf(22),
  },
  partnersSection: {
    alignItems: 'center',
    paddingHorizontal: '5%',
    paddingTop: 80,
    paddingBottom: 100,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  partnersGrid: {
    flexDirection: 'row',
    gap: 24,
    width: '100%',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  partnersGridMobile: {
    flexDirection: 'column',
    gap: 20,
  },
  partnerCard: {
    flex: 1,
    minWidth: 200,
    padding: 30,
    borderRadius: radii.xl,
    borderWidth: 1,
    alignItems: 'center',
    ...shadows.sm,
  },
  partnerName: {
    fontSize: rf(16),
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 6,
    textAlign: 'center',
  },
  partnerSub: {
    fontSize: rf(13),
    textAlign: 'center',
  },
  footer: {
    width: '100%',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: '8%',
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    marginBottom: 40,
    gap: 40,
  },
  footerContentMobile: {
    flexDirection: 'column',
    gap: 40,
  },
  footerCol: {
    flex: 2,
    paddingRight: 40,
  },
  footerLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  footerLogoText: {
    fontSize: rf(18),
    fontWeight: '900',
  },
  footerDesc: {
    fontSize: rf(14),
    lineHeight: rf(24),
  },
  footerLinksCol: {
    flex: 1,
  },
  footerHeading: {
    color: '#FFF',
    fontSize: rf(15),
    fontWeight: '800',
    marginBottom: 24,
  },
  footerLink: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: rf(14),
    marginBottom: 16,
  },
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 30,
    alignItems: 'center',
  },
  hamburgerBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileMenu: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    gap: 4,
    zIndex: 9,
    ...(Platform.OS === 'web' ? { position: 'sticky' as any, top: 80 } : {}),
  },
  mobileNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  mobileNavLink: {
    fontSize: rf(15),
    fontWeight: '700',
  },
  mobileMenuDivider: {
    height: 1,
    marginVertical: 12,
  },
  mobileMenuLoginBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: radii.lg,
    marginTop: 8,
  },
  mobileMenuLoginText: {
    color: '#FFF',
    fontSize: rf(14),
    fontWeight: '800',
  },
});

export default LandingScreen;
