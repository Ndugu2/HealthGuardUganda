import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../ThemeContext';
import { spacing, radii, shadows, gradients } from '../theme';
import { useResponsive, typography , rf } from '../responsive';
import AnimatedCard from '../components/AnimatedCard';

const EMERGENCY_CONTACTS = [
  {
    id: 'ambulance',
    icon: 'ambulance',
    titleKey: 'emergency.ambulance',
    fallbackTitle: 'National Ambulance',
    subtitleKey: 'emergency.ambulance_sub',
    fallbackSub: 'Uganda Red Cross Emergency',
    phone: '911',
    color: '#E53E3E',
    bgColor: '#FFF5F5',
  },
  {
    id: 'police',
    icon: 'police-badge',
    titleKey: 'emergency.police',
    fallbackTitle: 'Uganda Police',
    subtitleKey: 'emergency.police_sub',
    fallbackSub: 'Emergency & Gender-Based Violence',
    phone: '999',
    color: '#3182CE',
    bgColor: '#EBF8FF',
  },
  {
    id: 'fire',
    icon: 'fire-truck',
    titleKey: 'emergency.fire',
    fallbackTitle: 'Fire Brigade',
    subtitleKey: 'emergency.fire_sub',
    fallbackSub: 'Kampala Fire & Rescue',
    phone: '112',
    color: '#DD6B20',
    bgColor: '#FFFAF0',
  },
  {
    id: 'moh_hotline',
    icon: 'phone-in-talk',
    titleKey: 'emergency.moh_hotline',
    fallbackTitle: 'MoH Health Hotline',
    subtitleKey: 'emergency.moh_hotline_sub',
    fallbackSub: 'Ministry of Health toll-free line',
    phone: '0800100066',
    color: '#2C5E3E',
    bgColor: '#E2F0D9',
  },
  {
    id: 'maternal',
    icon: 'baby-carriage',
    titleKey: 'emergency.maternal',
    fallbackTitle: 'Maternal Emergency',
    subtitleKey: 'emergency.maternal_sub',
    fallbackSub: 'Mulago National Referral Hospital',
    phone: '+256414541188',
    color: '#9B2C2C',
    bgColor: '#FFF5F5',
  },
  {
    id: 'poison',
    icon: 'bottle-tonic-skull',
    titleKey: 'emergency.poison',
    fallbackTitle: 'Poison Control',
    subtitleKey: 'emergency.poison_sub',
    fallbackSub: 'National Drug Authority',
    phone: '+256417788100',
    color: '#6B46C1',
    bgColor: '#FAF5FF',
  },
];

const QUICK_TIPS = [
  { icon: 'heart-pulse', text: 'If someone is unconscious, call 911 immediately and begin CPR if trained.' },
  { icon: 'snake', text: 'For snake bites: keep calm, immobilize the limb, and get to the nearest hospital.' },
  { icon: 'water', text: 'For severe dehydration in children: give ORS solution and seek medical help urgently.' },
  { icon: 'thermometer-alert', text: 'High fever (>39°C) with convulsions? Rush to the nearest health center — it could be cerebral malaria.' },
];

const EmergencyContactsScreen = () => {
  const { t } = useTranslation();
  const { colors, mode } = useAppTheme();
  const { isPhone, isTablet, isDesktop, hPad, heroHeight, rf, bp, width, height } = useResponsive();
  const [expandedTip, setExpandedTip] = useState<number | null>(null);

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient
        colors={['#C53030', '#E53E3E', '#FC8181'] as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIconWrap}>
            <Icon source="phone-alert" size={32} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>
              {t('emergency.title') || 'Emergency Contacts'}
            </Text>
            <Text style={styles.headerSub}>
              {t('emergency.subtitle') || 'One-tap access to life-saving help'}
            </Text>
          </View>
        </View>

        {/* SOS Banner */}
        <TouchableOpacity
          style={styles.sosBanner}
          onPress={() => handleCall('911')}
        >
          <Icon source="alarm-light" size={20} color="#FFF" />
          <Text style={styles.sosText}>
            {t('emergency.sos_call') || 'TAP HERE FOR EMERGENCY SOS — CALL 911'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={[styles.content, isDesktop && styles.desktopContent]}>
        {/* Your VHT Section */}
        <AnimatedCard delay={50} style={[styles.vhtCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.vhtIconCircle, { backgroundColor: '#E2F0D9' }]}>
            <Icon source="account-heart" size={28} color="#2C5E3E" />
          </View>
          <View style={styles.vhtInfo}>
            <Text style={[styles.vhtLabel, { color: colors.neutral[500] }]}>
              {t('emergency.your_vht') || 'YOUR ASSIGNED HEALTH WORKER'}
            </Text>
            <Text style={[styles.vhtName, { color: colors.neutral[900] }]}>
              {t('emergency.vht_name') || 'Contact Your Local VHT'}
            </Text>
            <Text style={[styles.vhtDetail, { color: colors.neutral[500] }]}>
              {t('emergency.vht_detail') || 'Village Health Team — assigned to your area'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.vhtCallBtn, { backgroundColor: '#2C5E3E' }]}
            onPress={() => handleCall('+256700000000')}
          >
            <Icon source="phone" size={20} color="#FFF" />
          </TouchableOpacity>
        </AnimatedCard>

        {/* Emergency Contacts Grid */}
        <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>
          {t('emergency.contacts_title') || 'Emergency Numbers'}
        </Text>

        <View style={[styles.contactsGrid, isDesktop && styles.desktopGrid]}>
          {EMERGENCY_CONTACTS.map((contact, index) => (
            <AnimatedCard
              key={contact.id}
              delay={index * 80}
              style={[
                styles.contactCard,
                { backgroundColor: colors.surface },
                isDesktop ? styles.desktopContactCard : {},
              ]}
            >
              <View style={styles.contactTop}>
                <View style={[styles.contactIconCircle, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : contact.bgColor }]}>
                  <Icon source={contact.icon} size={24} color={contact.color} />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactName, { color: colors.neutral[900] }]}>
                    {t(contact.titleKey) || contact.fallbackTitle}
                  </Text>
                  <Text style={[styles.contactSub, { color: colors.neutral[500] }]} numberOfLines={1}>
                    {t(contact.subtitleKey) || contact.fallbackSub}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.callButton, { backgroundColor: contact.color }]}
                onPress={() => handleCall(contact.phone)}
              >
                <Icon source="phone" size={18} color="#FFF" />
                <Text style={styles.callButtonText}>
                  {contact.phone.startsWith('+') ? contact.phone : `Call ${contact.phone}`}
                </Text>
              </TouchableOpacity>
            </AnimatedCard>
          ))}
        </View>

        {/* Quick First Aid Tips */}
        <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>
          {t('emergency.first_aid') || 'Quick First Aid Tips'}
        </Text>

        {QUICK_TIPS.map((tip, index) => (
          <AnimatedCard
            key={index}
            delay={600 + index * 60}
            style={[styles.tipCard, { backgroundColor: colors.surface }]}
          >
            <TouchableOpacity
              style={styles.tipRow}
              onPress={() => setExpandedTip(expandedTip === index ? null : index)}
              activeOpacity={0.7}
            >
              <View style={[styles.tipIconCircle, { backgroundColor: '#FFF5F5' }]}>
                <Icon source={tip.icon} size={20} color="#E53E3E" />
              </View>
              <Text style={[styles.tipText, { color: colors.neutral[800] }]} numberOfLines={expandedTip === index ? undefined : 2}>
                {tip.text}
              </Text>
              <Icon
                source={expandedTip === index ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.neutral[400]}
              />
            </TouchableOpacity>
          </AnimatedCard>
        ))}

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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: rf(20),
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    marginTop: 2,
  },
  sosBanner: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: radii.full,
  },
  sosText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  content: {
    padding: spacing.lg,
  },
  desktopContent: {
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  // VHT Card
  vhtCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radii.xl,
    marginBottom: spacing.xl,
    gap: spacing.md,
    ...shadows.sm,
  },
  vhtIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vhtInfo: { flex: 1 },
  vhtLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  vhtName: {
    fontSize: 16,
    fontWeight: '800',
  },
  vhtDetail: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  vhtCallBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  // Contacts Grid
  contactsGrid: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  contactCard: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  desktopContactCard: {
    width: '48%',
    marginRight: '2%',
  },
  contactTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  contactIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: { flex: 1 },
  contactName: {
    fontSize: 15,
    fontWeight: '800',
  },
  contactSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: radii.full,
    ...shadows.sm,
  },
  callButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  // Tips
  tipCard: {
    borderRadius: radii.xl,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  tipIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});

export default EmergencyContactsScreen;
