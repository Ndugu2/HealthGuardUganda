import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../ThemeContext';
import { radii, shadows, spacing } from '../../theme';
import { AnalyticsService } from '../../services/AnalyticsService';

const FACILITIES = [
  { id: 1, name: 'Mulago National Referral Hospital', name_lg: 'Eddwaliro lya Mulago', type: 'Referral Hospital', distance: '2.3 km', phone: '+256-414-554-001', icon: 'hospital-building' },
  { id: 2, name: 'Kisenyi Health Centre IV', name_lg: 'Eddwaliro lya Kisenyi IV', type: 'Health Centre IV', distance: '1.1 km', phone: '+256-414-233-655', icon: 'medical-bag' },
  { id: 3, name: 'Naguru Teenage Centre', name_lg: 'Eddwaliro lya Naguru', type: 'Health Centre III', distance: '3.5 km', phone: '+256-414-286-971', icon: 'hospital-marker' },
];

const EMERGENCY_HOTLINES = [
  { id: 1, label: 'Ambulance', label_lg: 'Ambulansi', number: '911', icon: 'ambulance', color: '#E53E3E' },
  { id: 2, label: 'MoH Toll-Free', label_lg: 'MoH Essimu ya Bwereere', number: '0800-100-066', icon: 'phone', color: '#3182CE' },
  { id: 3, label: 'Poison Centre', label_lg: 'Obutwa bw\'Eddagala', number: '+256-414-270-372', icon: 'skull-crossbones', color: '#DD6B20' },
];

export const FacilityLocator: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();

  const handleCall = (number: string, name: string, id: number | string) => {
    Alert.alert(
      i18n.language === 'lg' ? 'Kuba Essimu' : 'Call Confirmation',
      i18n.language === 'lg' 
        ? `Okwagala okukuba ${name} ku nnamba ${number}?` 
        : `Are you sure you want to call ${name} at ${number}?`,
      [
        { text: i18n.language === 'lg' ? 'Nedda' : 'Cancel', style: 'cancel' },
        { 
          text: i18n.language === 'lg' ? 'Kuba' : 'Call', 
          onPress: () => {
            AnalyticsService.logCallInitiated(id, name);
            Linking.openURL(`tel:${number}`);
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.facilitySection, { backgroundColor: colors.surface, borderColor: colors.neutral[100] }]}>
      <View style={styles.activityHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon source="hospital-marker" size={22} color={colors.primary[900]} />
          <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>
            {i18n.language === 'lg' ? 'Amalwaliro n\'Obuyambi' : 'Local Health Facilities'}
          </Text>
        </View>
      </View>
      <Text style={[styles.sectionSub, { color: colors.neutral[500], marginBottom: 20 }]}>
        {i18n.language === 'lg' ? 'Obuyambi bw\'amangu okumpi naawe' : 'Nearest clinics and emergency numbers'}
      </Text>

      <Text style={[styles.facilitySubHeader, { color: colors.neutral[800] }]}>EMERGENCY HOTLINES</Text>
      <View style={styles.hotlineRow}>
        {EMERGENCY_HOTLINES.map(hotline => (
          <TouchableOpacity
            key={hotline.id}
            style={[styles.hotlineCard, { borderColor: hotline.color + '40', backgroundColor: hotline.color + '10' }]}
            onPress={() => handleCall(hotline.number, hotline.label, `hotline_${hotline.id}`)}
          >
            <Icon source={hotline.icon} size={24} color={hotline.color} />
            <Text style={[styles.hotlineLabel, { color: hotline.color }]}>
              {i18n.language === 'lg' && hotline.label_lg ? hotline.label_lg : hotline.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.facilitySubHeader, { color: colors.neutral[800], marginTop: 10 }]}>NEARBY CLINICS</Text>
      {FACILITIES.map(facility => (
        <View key={facility.id} style={[styles.facilityCard, { backgroundColor: colors.neutral[50] }]}>
          <View style={[styles.facilityIconBox, { backgroundColor: colors.primary[100] }]}>
            <Icon source={facility.icon} size={22} color={colors.primary[900]} />
          </View>
          <View style={styles.facilityInfo}>
            <Text style={[styles.facilityName, { color: colors.neutral[900] }]}>
              {i18n.language === 'lg' && facility.name_lg ? facility.name_lg : facility.name}
            </Text>
            <Text style={[styles.facilityType, { color: colors.neutral[500] }]}>{facility.type} • {facility.distance}</Text>
          </View>
          <TouchableOpacity
            style={[styles.callBtn, { backgroundColor: '#C6F6D5' }]}
            onPress={() => handleCall(facility.phone, facility.name, `clinic_${facility.id}`)}
          >
            <Icon source="phone" size={18} color="#276749" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  facilitySection: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  sectionSub: {
    fontSize: 14,
    fontWeight: '500',
  },
  facilitySubHeader: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  hotlineRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  hotlineCard: {
    flex: 1,
    minWidth: 90,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  hotlineLabel: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  facilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
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
    fontSize: 15,
    fontWeight: '800',
  },
  facilityType: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
