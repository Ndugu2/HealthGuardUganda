import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Linking,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../ThemeContext';
import { radii, spacing, shadows } from '../../theme';
import { getAilmentGuides } from '../../db/sqlite';
import type { AilmentGuide } from '../../db/types';

export const EmergencyFirstAid: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [guides, setGuides] = useState<AilmentGuide[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<AilmentGuide | null>(null);
  const [emergencyLang, setEmergencyLang] = useState<'en' | 'lg'>((i18n.language === 'lg' ? 'lg' : 'en'));

  useEffect(() => {
    // Keep local language in sync with app language initially
    setEmergencyLang(i18n.language === 'lg' ? 'lg' : 'en');
  }, [i18n.language]);

  const loadGuides = async () => {
    try {
      const data = await getAilmentGuides();
      // Filter or prioritize critical emergency guides (Snake Bite, Burns, Cholera, Obstetric Emergencies, Diarrhea, Pneumonia, Typhoid)
      const emergencyIds = [3, 4, 17, 8, 2, 13, 12];
      const sorted = [...data].sort((a, b) => {
        const aIdx = emergencyIds.indexOf(a.id);
        const bIdx = emergencyIds.indexOf(b.id);
        if (aIdx === -1 && bIdx === -1) return 0;
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
      });
      setGuides(sorted.length > 0 ? sorted : []);
    } catch (e) {
      console.error('Failed to load emergency guides', e);
    }
  };

  const handleOpenSOS = () => {
    loadGuides();
    setModalVisible(true);
    setSelectedGuide(null);
  };

  const handleCallHotline = () => {
    const number = '+256800100066'; // MoH Uganda Toll-Free Hotline
    const url = `tel:${number}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert(
            emergencyLang === 'lg' ? 'Musawo Ayogera' : 'Direct Call',
            emergencyLang === 'lg' 
              ? 'Kubira Minisitule y\'Obulamu ku ssimu eno: 0800 100 066'
              : 'Call Uganda Ministry of Health toll-free: 0800 100 066'
          );
        }
      })
      .catch((err) => console.error(err));
  };

  const toggleLanguage = () => {
    setEmergencyLang(prev => (prev === 'en' ? 'lg' : 'en'));
  };

  const renderSOSButton = () => {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleOpenSOS}
        style={[styles.sosBadge, { backgroundColor: '#C53030' }]}
      >
        <View style={styles.sosPulsingDot} />
        <Icon source="alert-decagram" size={24} color="#FFF" />
        <Text style={styles.sosBadgeText}>
          {i18n.language === 'lg' ? 'EMERGENCY FIRST AID — SOS' : 'EMERGENCY FIRST AID — SOS'}
        </Text>
      </TouchableOpacity>
    );
  };

  const isLg = emergencyLang === 'lg';

  return (
    <View style={styles.container}>
      {renderSOSButton()}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: '#1A202C' }]}>
          {/* HEADER */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
            >
              <Icon source="arrow-left" size={26} color="#FFF" />
              <Text style={styles.closeBtnText}>{isLg ? 'Ggalawo' : 'Back'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
              <Icon source="translate" size={18} color="#FFD700" />
              <Text style={styles.langToggleText}>{isLg ? 'English' : 'Luganda'}</Text>
            </TouchableOpacity>
          </View>

          {selectedGuide ? (
            /* DETAILED EMERGENCY FIRST AID STEPS (ULTRA HIGH CONTRAST) */
            <View style={styles.guideContainer}>
              <View style={styles.guideHeader}>
                <View style={[styles.iconWrap, { backgroundColor: selectedGuide.color }]}>
                  <Icon source={selectedGuide.icon} size={28} color="#FFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.guideLabel}>{isLg ? 'OBUYANBI OSOOKA' : 'EMERGENCY ACTION'}</Text>
                  <Text style={styles.guideTitle}>
                    {isLg && selectedGuide.title_lg ? selectedGuide.title_lg : selectedGuide.title}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.backToGridBtn}
                  onPress={() => setSelectedGuide(null)}
                >
                  <Icon source="grid" size={20} color="#CBD5E0" />
                  <Text style={styles.backToGridText}>{isLg ? 'Lista' : 'All'}</Text>
                </TouchableOpacity>
              </View>

              <ScrollView 
                contentContainerStyle={styles.stepsScroll}
                showsVerticalScrollIndicator={false}
              >
                {((isLg && selectedGuide.steps_lg) ? selectedGuide.steps_lg : selectedGuide.steps).map((step, idx) => (
                  <View key={idx} style={styles.stepRow}>
                    <View style={[styles.stepNumberBadge, { backgroundColor: '#E53E3E' }]}>
                      <Text style={styles.stepNumberText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.giantStepText}>{step}</Text>
                  </View>
                ))}
                
                <View style={styles.disclaimerContainer}>
                  <Icon source="shield-alert-outline" size={20} color="#FFD700" />
                  <Text style={styles.disclaimerText}>
                    {isLg 
                      ? 'Bino bya bukyali. Singa embeera eyongera okuba embi, mangu ddala muteekwa okugenda mu ddwaliro eriri okumpi.' 
                      : 'First-aid is temporary. If the symptoms are severe, rush the patient to the nearest hospital immediately.'}
                  </Text>
                </View>
              </ScrollView>

              {/* CALL HOTLINE OVERLAY */}
              <TouchableOpacity
                style={styles.callHotlineBtn}
                onPress={handleCallHotline}
                activeOpacity={0.85}
              >
                <Icon source="phone" size={26} color="#FFF" />
                <View>
                  <Text style={styles.callTitle}>{isLg ? 'KUBIRA MINISITULE Y\'OBULAMU' : 'CALL MINISTRY OF HEALTH'}</Text>
                  <Text style={styles.callSub}>Toll-Free Helpline: 0800 100 066</Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            /* SOS CRISIS GRID SELECTION */
            <View style={styles.gridContainer}>
              <View style={styles.gridHero}>
                <View style={styles.emergencyIconPulse}>
                  <Icon source="shield-alert" size={40} color="#C53030" />
                </View>
                <Text style={styles.gridHeroTitle}>
                  {isLg ? 'Obuyambi Obw\'embaga' : 'Emergency Guidelines'}
                </Text>
                <Text style={styles.gridHeroSub}>
                  {isLg 
                    ? 'Kuba ku ndwadde wansi okusoma obulagirizi obw\'embaga mu ngeri ey\'ekifuba' 
                    : 'Tap any condition below for instant, giant-text first-aid steps fully offline.'}
                </Text>
              </View>

              <ScrollView 
                contentContainerStyle={styles.gridScroll}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.gridRow}>
                  {guides.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.emergencyGridCard, { borderLeftColor: item.color }]}
                      onPress={() => setSelectedGuide(item)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.gridIconWrap, { backgroundColor: item.color + '25' }]}>
                        <Icon source={item.icon} size={24} color={item.color} />
                      </View>
                      <Text style={styles.gridCardTitle}>
                        {isLg && item.title_lg ? item.title_lg : item.title}
                      </Text>
                      <Icon source="chevron-right" size={20} color="#718096" />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* DIRECT HOTLINE ACCESS */}
                <TouchableOpacity
                  style={styles.directHotlineCard}
                  onPress={handleCallHotline}
                >
                  <Icon source="phone-in-talk" size={32} color="#FFF" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.directHotlineTitle}>
                      {isLg ? 'Kubira Aba Minisitule Mangu' : 'Call National Emergency Hotline'}
                    </Text>
                    <Text style={styles.directHotlineSub}>0800 100 066 (Toll-Free Call)</Text>
                  </View>
                  <Icon source="chevron-right" size={24} color="#FFF" />
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  sosBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    gap: 12,
    marginBottom: spacing.md,
    ...shadows.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  sosPulsingDot: {
    position: 'absolute',
    right: 15,
    top: '50%',
    marginTop: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    opacity: 0.8,
  },
  sosBadgeText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  modalContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3748',
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  langToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2D3748',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  langToggleText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '800',
  },
  gridContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  gridHero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
  },
  emergencyIconPulse: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(197, 48, 48, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  gridHeroTitle: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 6,
  },
  gridHeroSub: {
    color: '#A0AEC0',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  gridScroll: {
    paddingBottom: 40,
  },
  gridRow: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  emergencyGridCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D3748',
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderLeftWidth: 5,
    gap: 16,
  },
  gridIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCardTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  directHotlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C53030',
    padding: spacing.xl,
    borderRadius: radii.xl,
    gap: 20,
    ...shadows.lg,
  },
  directHotlineTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  directHotlineSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  guideContainer: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3748',
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideLabel: {
    color: '#E53E3E',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  guideTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },
  backToGridBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D3748',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
    gap: 6,
  },
  backToGridText: {
    color: '#CBD5E0',
    fontSize: 13,
    fontWeight: '700',
  },
  stepsScroll: {
    paddingVertical: spacing.xl,
    paddingBottom: 40,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: spacing.xl,
    backgroundColor: '#2D3748',
    padding: spacing.xl,
    borderRadius: radii.xl,
  },
  stepNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  giantStepText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 32,
    flex: 1,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    backgroundColor: '#2D3748',
    borderColor: '#FFD700',
    borderWidth: 1,
    padding: spacing.lg,
    borderRadius: radii.lg,
    gap: 12,
    marginTop: spacing.md,
  },
  disclaimerText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    flex: 1,
  },
  callHotlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C53030',
    padding: spacing.lg,
    borderRadius: radii.xl,
    gap: 16,
    ...shadows.lg,
  },
  callTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  callSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
});
