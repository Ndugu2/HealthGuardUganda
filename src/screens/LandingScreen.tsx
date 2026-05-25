import React, { useRef, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, useWindowDimensions, Image, Platform, Animated, Linking } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { colors, spacing, radii, shadows } from '../theme';
import { useAppTheme } from '../ThemeContext';

interface LandingScreenProps {
  onLoginPress: (roleHint?: 'COMMUNITY' | 'HW' | 'ADMIN') => void;
}

const LandingScreen: React.FC<LandingScreenProps> = ({ onLoginPress }) => {
  const { mode } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 900;
  const isMobile = width < 600;
  const [selectedRole, setSelectedRole] = useState<'COMMUNITY' | 'HW' | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const [offsets, setOffsets] = useState<Record<string, number>>({
    mission: 0,
    impact: 0,
    partners: 0,
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
    <View style={[styles.container, { backgroundColor: mode === 'light' ? '#FAFAFA' : colors.background }]}>
      {/* ── HEADER ── */}
      <View style={[styles.header, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderBottomColor: mode === 'light' ? '#E5E7EB' : colors.neutral[100] }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logoCircle}>
            <Icon source="shield-plus" size={28} color={colors.primary[900]} />
          </View>
          <Text style={[styles.logoText, { color: colors.primary[900] }]}>HealthGuard <Text style={{ fontWeight: '400' }}>Uganda</Text></Text>
        </View>

        {isDesktop && (
          <View style={styles.headerCenter}>
            <TouchableOpacity onPress={() => { setSelectedRole('COMMUNITY'); onLoginPress('COMMUNITY'); }} style={{ marginLeft: 12 }}>
              <Text style={[styles.navLink, { color: colors.primary[900], fontWeight: '700' }]}>Community Portal</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSelectedRole('HW'); onLoginPress('HW'); }} style={{ marginLeft: 12 }}>
              <Text style={[styles.navLink, { color: colors.primary[900], fontWeight: '700' }]}>Health Worker Login</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.headerRight}>
          {!isDesktop && (
            <TouchableOpacity
              style={[styles.hamburgerBtn, { marginLeft: 12 }]}
              onPress={() => setMobileMenuOpen(prev => !prev)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon source={mobileMenuOpen ? 'close' : 'menu'} size={26} color={colors.primary[900]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── MOBILE NAV DROPDOWN ── */}
      {mobileMenuOpen && !isDesktop && (
        <View style={[styles.mobileMenu, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderBottomColor: mode === 'light' ? '#E5E7EB' : colors.neutral[100] }]}>
          <TouchableOpacity style={styles.mobileNavItem} onPress={() => scrollToSection('mission')}>
            <Icon source="information-outline" size={20} color={colors.primary[900]} />
            <Text style={[styles.mobileNavLink, { color: colors.neutral[700] }]}>Our Mission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mobileNavItem} onPress={() => scrollToSection('impact')}>
            <Icon source="chart-bar" size={20} color={colors.primary[900]} />
            <Text style={[styles.mobileNavLink, { color: colors.neutral[700] }]}>Impact</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mobileNavItem} onPress={() => scrollToSection('partners')}>
            <Icon source="handshake-outline" size={20} color={colors.primary[900]} />
            <Text style={[styles.mobileNavLink, { color: colors.neutral[700] }]}>Partners</Text>
          </TouchableOpacity>
          <View style={[styles.mobileMenuDivider, { backgroundColor: mode === 'light' ? '#E5E7EB' : colors.neutral[100] }]} />
          <TouchableOpacity style={[styles.mobileMenuLoginBtn, { backgroundColor: colors.primary[900] }]} onPress={() => { setMobileMenuOpen(false); setSelectedRole('COMMUNITY'); onLoginPress('COMMUNITY'); }}>
            <Text style={styles.mobileMenuLoginText}>Community Portal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.mobileMenuLoginBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary[900] }]} onPress={() => { setMobileMenuOpen(false); setSelectedRole('HW'); onLoginPress('HW'); }}>
            <Text style={[styles.mobileMenuLoginText, { color: colors.primary[900] }]}>Health Worker Login</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ── HERO SECTION ── */}
        <View style={[styles.heroSection, !isDesktop && styles.heroSectionMobile]}>
          
          <View style={styles.heroLeft}>
            <View style={[styles.pill, { backgroundColor: colors.neutral[100] }]}>
              <View style={[styles.pillDot, { backgroundColor: colors.primary[900] }]} />
              <Text style={[styles.pillText, { color: colors.neutral[700] }]}>EMPOWERING 10K+ HEALTH WORKERS</Text>
            </View>
            
            <Text style={[styles.heroHeadline, { color: colors.neutral[900] }, isMobile && styles.heroHeadlineMobile]}>
              Smarter Health for <Text style={{ color: colors.primary[900] }}>Every Community.</Text>
            </Text>
            
            <Text style={[styles.heroSub, { color: colors.neutral[500] }, isMobile && styles.heroSubMobile]}>
              We leverage data analytics and offline technology to bring expert medical intelligence directly to rural health workers, ensuring verified facts and sustainable public health.
            </Text>
            
            <View style={[styles.heroActions, isMobile && styles.heroActionsMobile]}>
              <TouchableOpacity style={[styles.primaryActionBtn, isMobile && styles.primaryActionBtnMobile, { backgroundColor: colors.primary[900] }]} onPress={() => onLoginPress('COMMUNITY')}>
                <Text style={[styles.primaryActionBtnText, isMobile && { fontSize: 14 }]}>Community Portal</Text>
                <Icon source="arrow-right" size={16} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.secondaryActionBtn, isMobile && styles.secondaryActionBtnMobile, { borderColor: colors.neutral[200] }]} onPress={() => onLoginPress('HW')}>
                <Text style={[styles.secondaryActionBtnText, isMobile && { fontSize: 14 }, { color: colors.neutral[700] }]}>Health Worker Login</Text>
              </TouchableOpacity>
            </View>
          </View>

          {!isMobile && (
            <View style={[styles.heroRight, isMobile && styles.heroRightMobile]}>
              <View style={[styles.heroImageCard, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, ...shadows.lg }]}>
                <Image 
                  source={require('../../assets/landing_hero.png')} 
                  style={styles.heroImage as any} 
                  resizeMode="contain"
                />
                
                <View style={[styles.floatingBadge, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, ...shadows.md }]}>
                  <View style={[styles.badgeIconWrap, { backgroundColor: '#E2F0D9' }]}>
                    <Icon source="trending-down" size={16} color={colors.primary[900]} />
                  </View>
                  <View>
                    <Text style={[styles.badgeLabel, { color: colors.neutral[400] }]}>MISINFORMATION RATE</Text>
                    <Text style={[styles.badgeValue, { color: colors.neutral[900] }]}>45% Reduction</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ── MISSION SECTION ── */}
        <View onLayout={handleLayout('mission')} style={styles.missionSection}>
          <Text style={[styles.sectionTitle, { color: colors.primary[900] }]}>Our Mission</Text>
          <Text style={[styles.missionQuote, { color: colors.neutral[700] }, isMobile && styles.missionQuoteMobile]}>
            "HealthGuard Uganda exists to bridge the information gap in rural healthcare. By combining accessible fact-checking with complex epidemiological data analytics, we help health workers identify outbreaks early, optimize care, and verify claims instantly."
          </Text>

          <View style={[styles.featuresGrid, !isDesktop && styles.featuresGridMobile]}>
            {/* Feature 1 */}
            <View style={[styles.featureCard, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderColor: mode === 'light' ? '#E5E7EB' : colors.neutral[200] }]}>
              <View style={[styles.featureIconBox, { backgroundColor: colors.primary[900] }]}>
                <Icon source="shield-search" size={24} color="#FFF" />
              </View>
              <Text style={[styles.featureTitle, { color: colors.neutral[900] }]}>Fact-Checking</Text>
              <Text style={[styles.featureDesc, { color: colors.neutral[500] }]}>
                Instant verification of health rumors against official Ministry of Health guidelines, available fully offline.
              </Text>
            </View>

            {/* Feature 2 */}
            <View style={[styles.featureCard, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderColor: mode === 'light' ? '#E5E7EB' : colors.neutral[200] }]}>
              <View style={[styles.featureIconBox, { backgroundColor: colors.primary[900] }]}>
                <Icon source="chart-bar" size={24} color="#FFF" />
              </View>
              <Text style={[styles.featureTitle, { color: colors.neutral[900] }]}>Data Insights</Text>
              <Text style={[styles.featureDesc, { color: colors.neutral[500] }]}>
                Real-time tracking of localized health trends and symptom outbreaks across entire rural regions.
              </Text>
            </View>

            {/* Feature 3 */}
            <View style={[styles.featureCard, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderColor: mode === 'light' ? '#E5E7EB' : colors.neutral[200] }]}>
              <View style={[styles.featureIconBox, { backgroundColor: colors.primary[900] }]}>
                <Icon source="doctor" size={24} color="#FFF" />
              </View>
              <Text style={[styles.featureTitle, { color: colors.neutral[900] }]}>Expert Support</Text>
              <Text style={[styles.featureDesc, { color: colors.neutral[500] }]}>
                Connecting rural health workers directly with certified medical experts in seconds for complex triage.
              </Text>
            </View>
          </View>
        </View>

        {/* ── IMPACT SECTION ── */}
        <View onLayout={handleLayout('impact')} style={styles.impactSection}>
          <Text style={[styles.sectionTitle, { color: colors.primary[900] }]}>Our Impact</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.neutral[500] }]}>
            Empowering communities and strengthening healthcare delivery through evidence-based technology.
          </Text>

          <View style={[styles.statsGrid, !isDesktop && styles.statsGridMobile]}>
            {/* Stat 1 */}
            <View style={[styles.statCard, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderColor: mode === 'light' ? '#E5E7EB' : colors.neutral[200] }]}>
              <Text style={[styles.statNumber, { color: colors.primary[900] }]}>45%</Text>
              <Text style={[styles.statLabel, { color: colors.neutral[900] }]}>Misinformation Reduction</Text>
              <Text style={[styles.statDesc, { color: colors.neutral[500] }]}>
                Significant decrease in community health rumors and false medical claims in our active districts.
              </Text>
            </View>

            {/* Stat 2 */}
            <View style={[styles.statCard, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderColor: mode === 'light' ? '#E5E7EB' : colors.neutral[200] }]}>
              <Text style={[styles.statNumber, { color: colors.primary[900] }]}>10K+</Text>
              <Text style={[styles.statLabel, { color: colors.neutral[900] }]}>Health Workers Trained</Text>
              <Text style={[styles.statDesc, { color: colors.neutral[500] }]}>
                Equipped with offline-capable diagnostic and fact-checking toolkits for prompt field interventions.
              </Text>
            </View>

            {/* Stat 3 */}
            <View style={[styles.statCard, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderColor: mode === 'light' ? '#E5E7EB' : colors.neutral[200] }]}>
              <Text style={[styles.statNumber, { color: colors.primary[900] }]}>24 Hrs</Text>
              <Text style={[styles.statLabel, { color: colors.neutral[900] }]}>Response & Verification</Text>
              <Text style={[styles.statDesc, { color: colors.neutral[500] }]}>
                Fast verification of emergent health queries mapped to official guidelines.
              </Text>
            </View>

            {/* Stat 4 */}
            <View style={[styles.statCard, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderColor: mode === 'light' ? '#E5E7EB' : colors.neutral[200] }]}>
              <Text style={[styles.statNumber, { color: colors.primary[900] }]}>150+</Text>
              <Text style={[styles.statLabel, { color: colors.neutral[900] }]}>Clinics Connected</Text>
              <Text style={[styles.statDesc, { color: colors.neutral[500] }]}>
                Providing reliable digital infrastructure and local database access in remote rural areas.
              </Text>
            </View>
          </View>
        </View>

        {/* ── PARTNERS SECTION ── */}
        <View onLayout={handleLayout('partners')} style={styles.partnersSection}>
          <Text style={[styles.sectionTitle, { color: colors.primary[900] }]}>Trusted Partners</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.neutral[500] }]}>
            Working hand-in-hand with leading health institutions to build resilient public health systems.
          </Text>

          <View style={[styles.partnersGrid, !isDesktop && styles.partnersGridMobile]}>
            {/* Partner 1 */}
            <View style={[styles.partnerCard, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderColor: mode === 'light' ? '#E5E7EB' : colors.neutral[200] }]}>
              <Icon source="bank" size={32} color={colors.primary[900]} />
              <Text style={[styles.partnerName, { color: colors.neutral[900] }]}>Ministry of Health</Text>
              <Text style={[styles.partnerSub, { color: colors.neutral[500] }]}>Republic of Uganda</Text>
            </View>

            {/* Partner 2 */}
            <View style={[styles.partnerCard, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderColor: mode === 'light' ? '#E5E7EB' : colors.neutral[200] }]}>
              <Icon source="earth" size={32} color={colors.primary[900]} />
              <Text style={[styles.partnerName, { color: colors.neutral[900] }]}>World Health Org.</Text>
              <Text style={[styles.partnerSub, { color: colors.neutral[500] }]}>Global Health Standards</Text>
            </View>

            {/* Partner 3 */}
            <View style={[styles.partnerCard, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderColor: mode === 'light' ? '#E5E7EB' : colors.neutral[200] }]}>
              <Icon source="school-outline" size={32} color={colors.primary[900]} />
              <Text style={[styles.partnerName, { color: colors.neutral[900] }]}>Bugema University</Text>
              <Text style={[styles.partnerSub, { color: colors.neutral[500] }]}>School of Health Sciences</Text>
            </View>

            {/* Partner 4 */}
            <View style={[styles.partnerCard, { backgroundColor: mode === 'light' ? '#FFFFFF' : colors.surface, borderColor: mode === 'light' ? '#E5E7EB' : colors.neutral[200] }]}>
              <Icon source="face-agent" size={32} color={colors.primary[900]} />
              <Text style={[styles.partnerName, { color: colors.neutral[900] }]}>UNICEF Uganda</Text>
              <Text style={[styles.partnerSub, { color: colors.neutral[500] }]}>Child Health & Support</Text>
            </View>
          </View>
        </View>

      </ScrollView>

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
              Protecting livelihoods by verifying health facts. We are committed to sustainable public health and empowering communities through accurate information.
            </Text>
          </View>
          
          <View style={styles.footerLinksCol}>
             <Text style={styles.footerHeading}>Platform</Text>
             <TouchableOpacity onPress={() => onLoginPress('ADMIN')}><Text style={styles.footerLink}>Admin Dashboard</Text></TouchableOpacity>
             <TouchableOpacity onPress={() => onLoginPress('HW')}><Text style={styles.footerLink}>For Health Workers</Text></TouchableOpacity>
             <TouchableOpacity onPress={() => onLoginPress('COMMUNITY')}><Text style={styles.footerLink}>Community Portal</Text></TouchableOpacity>
          </View>
          
          <View style={styles.footerLinksCol}>
             <Text style={styles.footerHeading}>Contact</Text>
             <Text style={styles.footerLink}>info@healthguard.ug</Text>
             <Text style={styles.footerLink}>+256 800 100 066</Text>
             <Text style={styles.footerLink}>Kampala, Uganda</Text>
          </View>
        </View>
        <View style={styles.footerBottom}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>© 2026 HealthGuard Uganda. All rights reserved.</Text>
        </View>
      </View>
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
    backgroundColor: 'rgba(12, 74, 52, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 22,
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
  loginBtnHeader: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radii.full,
  },
  loginBtnHeaderText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 60,
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '8%',
    paddingVertical: 80,
    maxWidth: 1400,
    alignSelf: 'center',
    gap: 60,
  },
  heroSectionMobile: {
    flexDirection: 'column',
    paddingVertical: 28,
    paddingHorizontal: spacing.lg,
    gap: 24,
  },
  heroLeft: {
    flex: 1,
    alignItems: 'flex-start',
    width: '100%',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    gap: 8,
    marginBottom: 24,
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroHeadline: {
    fontSize: 64,
    fontWeight: '900',
    lineHeight: 70,
    letterSpacing: -1.5,
    marginBottom: 24,
  },
  heroHeadlineMobile: {
    fontSize: 34,
    lineHeight: 40,
    marginBottom: 16,
  },
  heroSub: {
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 40,
    maxWidth: '90%',
  },
  heroSubMobile: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
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
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: radii.md,
    gap: 8,
  },
  primaryActionBtnMobile: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  secondaryActionBtnMobile: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryActionBtnText: {
    fontSize: 16,
    fontWeight: '700',
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
  },
  heroImageCardMobile: {
    aspectRatio: 1.4,
    borderRadius: 24,
    padding: 20,
    marginBottom: 30,
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
    padding: 16,
    borderRadius: radii.lg,
    gap: 12,
  },
  floatingBadgeMobile: {
    left: 10,
    right: 10,
    bottom: -16,
    padding: 12,
  },
  badgeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  missionSection: {
    alignItems: 'center',
    paddingHorizontal: '5%',
    paddingTop: 40,
    paddingBottom: 80,
    maxWidth: 1200,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 24,
  },
  missionQuote: {
    fontSize: 20,
    lineHeight: 32,
    textAlign: 'center',
    maxWidth: 800,
    marginBottom: 60,
    fontStyle: 'italic',
  },
  missionQuoteMobile: {
    fontSize: 16,
    lineHeight: 26,
  },
  featuresGrid: {
    flexDirection: 'row',
    gap: 24,
    width: '100%',
  },
  featuresGridMobile: {
    flexDirection: 'column',
  },
  featureCard: {
    flex: 1,
    padding: 30,
    borderRadius: radii.xl,
    borderWidth: 1,
  },
  featureIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  featureDesc: {
    fontSize: 15,
    lineHeight: 24,
  },
  footer: {
    width: '100%',
    paddingTop: 60,
    paddingBottom: 20,
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
  },
  footerCol: {
    flex: 2,
    paddingRight: 40,
  },
  footerLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  footerLogoText: {
    fontSize: 20,
    fontWeight: '800',
  },
  footerDesc: {
    fontSize: 14,
    lineHeight: 22,
  },
  footerLinksCol: {
    flex: 1,
  },
  footerHeading: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 20,
  },
  footerLink: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 12,
  },
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 20,
    alignItems: 'center',
  },
  impactSection: {
    alignItems: 'center',
    paddingHorizontal: '5%',
    paddingTop: 40,
    paddingBottom: 80,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  sectionSubtitle: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
    maxWidth: 600,
    marginBottom: 48,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 24,
    width: '100%',
    flexWrap: 'wrap',
  },
  statsGridMobile: {
    flexDirection: 'column',
  },
  statCard: {
    flex: 1,
    minWidth: 250,
    padding: 30,
    borderRadius: radii.xl,
    borderWidth: 1,
    alignItems: 'flex-start',
    ...shadows.sm,
  },
  statNumber: {
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  statDesc: {
    fontSize: 14,
    lineHeight: 22,
  },
  partnersSection: {
    alignItems: 'center',
    paddingHorizontal: '5%',
    paddingTop: 40,
    paddingBottom: 80,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  partnersGrid: {
    flexDirection: 'row',
    gap: 24,
    width: '100%',
    flexWrap: 'wrap',
  },
  partnersGridMobile: {
    flexDirection: 'column',
  },
  partnerCard: {
    flex: 1,
    minWidth: 220,
    padding: 30,
    borderRadius: radii.xl,
    borderWidth: 1,
    alignItems: 'center',
    ...shadows.sm,
  },
  partnerName: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 4,
    textAlign: 'center',
  },
  partnerSub: {
    fontSize: 13,
    textAlign: 'center',
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
    fontSize: 16,
    fontWeight: '600',
  },
  mobileMenuDivider: {
    height: 1,
    marginVertical: 8,
  },
  mobileMenuLoginBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radii.md,
    marginTop: 8,
  },
  mobileMenuLoginText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default LandingScreen;
