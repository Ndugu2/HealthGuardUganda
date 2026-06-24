import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Text, Icon, Searchbar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../ThemeContext';
import { spacing, radii, shadows, gradients } from '../theme';
import { useResponsive, rf } from '../responsive';
import AnimatedCard from '../components/AnimatedCard';

// ── Types ──────────────────────────────────────────────────────────────────
type ReferralStatus = 'pending' | 'in-transit' | 'received' | 'completed' | 'cancelled';
type ReferralUrgency = 'routine' | 'urgent' | 'emergency';

interface Referral {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: 'M' | 'F';
  village: string;
  diagnosis: string;
  reason: string;
  fromFacility: string;
  toFacility: string;
  urgency: ReferralUrgency;
  status: ReferralStatus;
  referredBy: string;
  referralDate: string;
  notes?: string;
  contactPhone?: string;
}

// ── Mock Data ──────────────────────────────────────────────────────────────
const MOCK_REFERRALS: Referral[] = [
  {
    id: 'REF-2026-001',
    patientName: 'Nakato Sarah',
    patientAge: 28,
    patientGender: 'F',
    village: 'Nakawa',
    diagnosis: 'Severe Malaria (P. falciparum)',
    reason: 'IV artesunate required, beyond facility capacity',
    fromFacility: 'Nakawa Health Centre III',
    toFacility: 'Mulago National Referral Hospital',
    urgency: 'emergency',
    status: 'in-transit',
    referredBy: 'Dr. Okello James',
    referralDate: 'Today, 10:30 AM',
    contactPhone: '+256 700 123456',
  },
  {
    id: 'REF-2026-002',
    patientName: 'Mugisha David',
    patientAge: 5,
    patientGender: 'M',
    village: 'Bwaise',
    diagnosis: 'Severe Acute Malnutrition (SAM)',
    reason: 'Requires therapeutic feeding unit and nutritional rehab',
    fromFacility: 'Bwaise Health Centre II',
    toFacility: 'Kawempe National Referral Hospital',
    urgency: 'urgent',
    status: 'received',
    referredBy: 'Nurse Auma Grace',
    referralDate: 'Yesterday, 02:15 PM',
    notes: 'MUAC < 11.5cm, bilateral pitting oedema',
  },
  {
    id: 'REF-2026-003',
    patientName: 'Ssekandi Moses',
    patientAge: 60,
    patientGender: 'M',
    village: 'Makindye',
    diagnosis: 'Suspected Acute MI',
    reason: 'Chest pain + ECG changes, needs cardiology review',
    fromFacility: 'Makindye HC IV',
    toFacility: 'Nsambya Hospital',
    urgency: 'emergency',
    status: 'completed',
    referredBy: 'Dr. Nambi Ruth',
    referralDate: '2 days ago',
    contactPhone: '+256 772 987654',
  },
  {
    id: 'REF-2026-004',
    patientName: 'Babirye Esther',
    patientAge: 19,
    patientGender: 'F',
    village: 'Rubaga',
    diagnosis: 'High-Risk Pregnancy',
    reason: 'Gestational hypertension, needs specialist antenatal care',
    fromFacility: 'Rubaga HC III',
    toFacility: 'Kawempe National Referral Hospital',
    urgency: 'routine',
    status: 'pending',
    referredBy: 'Midwife Kato Brian',
    referralDate: 'Today, 08:00 AM',
    notes: 'BP 145/90 at 32 weeks. Second episode this month.',
    contactPhone: '+256 703 456789',
  },
  {
    id: 'REF-2026-005',
    patientName: 'Okello James',
    patientAge: 45,
    patientGender: 'M',
    village: 'Kisenyi',
    diagnosis: 'Pulmonary Tuberculosis (presumptive)',
    reason: 'Persistent cough > 3 weeks, GeneXpert needed',
    fromFacility: 'Kisenyi HC II',
    toFacility: 'Mulago National Referral Hospital',
    urgency: 'urgent',
    status: 'pending',
    referredBy: 'Nurse Nambi',
    referralDate: 'Today, 09:45 AM',
  },
];

const UGANDAN_FACILITIES = [
  'Mulago National Referral Hospital',
  'Kawempe National Referral Hospital',
  'Entebbe Regional Referral Hospital',
  'Mbarara Regional Referral Hospital',
  'Gulu Regional Referral Hospital',
  'Jinja Regional Referral Hospital',
  'Mbale Regional Referral Hospital',
  'Nsambya Hospital',
  'Mengo Hospital',
  'Nakawa Health Centre III',
  'Kiruddu National Referral Hospital',
  'Hoima Regional Referral Hospital',
  'Lira Regional Referral Hospital',
  'Masaka Regional Referral Hospital',
  'Soroti Regional Referral Hospital',
];

// ── Status Config ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<ReferralStatus, { icon: string; color: string; bg: string; label: string }> = {
  pending: { icon: 'clock-outline', color: '#DD6B20', bg: '#FFFAF0', label: 'Pending' },
  'in-transit': { icon: 'ambulance', color: '#3182CE', bg: '#EBF8FF', label: 'In Transit' },
  received: { icon: 'hospital-building', color: '#6B46C1', bg: '#FAF5FF', label: 'Received' },
  completed: { icon: 'check-circle', color: '#2C5E3E', bg: '#E2F0D9', label: 'Completed' },
  cancelled: { icon: 'close-circle', color: '#9B2C2C', bg: '#FFF5F5', label: 'Cancelled' },
};

const URGENCY_CONFIG: Record<ReferralUrgency, { color: string; bg: string; label: string; borderColor: string }> = {
  routine: { color: '#2C5E3E', bg: '#E2F0D9', label: 'ROUTINE', borderColor: '#68D391' },
  urgent: { color: '#DD6B20', bg: '#FFFAF0', label: 'URGENT', borderColor: '#F6AD55' },
  emergency: { color: '#FFF', bg: '#E53E3E', label: 'EMERGENCY', borderColor: '#FC8181' },
};

// ── Main Component ─────────────────────────────────────────────────────────
export const ReferralPortalScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { colors, mode } = useAppTheme();
  const { isPhone, isDesktop } = useResponsive();

  const [referrals, setReferrals] = useState<Referral[]>(MOCK_REFERRALS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReferralStatus | 'all'>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<ReferralUrgency | 'all'>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);

  // New Referral Form State
  const [form, setForm] = useState({
    patientName: '',
    patientAge: '',
    patientGender: 'F' as 'M' | 'F',
    village: '',
    diagnosis: '',
    reason: '',
    fromFacility: '',
    toFacility: '',
    urgency: 'routine' as ReferralUrgency,
    referredBy: '',
    notes: '',
    contactPhone: '',
  });
  const [facilitySearch, setFacilitySearch] = useState('');
  const [showFacilityPicker, setShowFacilityPicker] = useState<'from' | 'to' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDark = mode === 'dark';

  // ── Computed Values ──────────────────────────────────────────────────────
  const filtered = referrals.filter(r => {
    const matchSearch = !search.trim() ||
      r.patientName.toLowerCase().includes(search.toLowerCase()) ||
      r.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchUrgency = urgencyFilter === 'all' || r.urgency === urgencyFilter;
    return matchSearch && matchStatus && matchUrgency;
  });

  const stats = {
    total: referrals.length,
    pending: referrals.filter(r => r.status === 'pending').length,
    inTransit: referrals.filter(r => r.status === 'in-transit').length,
    received: referrals.filter(r => r.status === 'received').length,
    completed: referrals.filter(r => r.status === 'completed').length,
    emergency: referrals.filter(r => r.urgency === 'emergency').length,
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSubmitReferral = async () => {
    if (!form.patientName.trim() || !form.diagnosis.trim() || !form.toFacility || !form.reason.trim()) {
      Alert.alert('Missing Fields', 'Please fill in patient name, diagnosis, destination facility and referral reason.');
      return;
    }
    setIsSubmitting(true);
    await new Promise(res => setTimeout(res, 1000));

    const newRef: Referral = {
      id: `REF-2026-${String(referrals.length + 1).padStart(3, '0')}`,
      patientName: form.patientName,
      patientAge: parseInt(form.patientAge) || 0,
      patientGender: form.patientGender,
      village: form.village,
      diagnosis: form.diagnosis,
      reason: form.reason,
      fromFacility: form.fromFacility || 'Current Facility',
      toFacility: form.toFacility,
      urgency: form.urgency,
      status: 'pending',
      referredBy: form.referredBy || 'Health Worker',
      referralDate: 'Just now',
      notes: form.notes || undefined,
      contactPhone: form.contactPhone || undefined,
    };

    setReferrals(prev => [newRef, ...prev]);
    setIsSubmitting(false);
    setShowNewModal(false);
    setForm({ patientName: '', patientAge: '', patientGender: 'F', village: '', diagnosis: '', reason: '', fromFacility: '', toFacility: '', urgency: 'routine', referredBy: '', notes: '', contactPhone: '' });
    Alert.alert('Referral Created', `Referral ${newRef.id} has been submitted and is now pending confirmation.`);
  };

  const handleUpdateStatus = (ref: Referral, newStatus: ReferralStatus) => {
    Alert.alert(
      'Update Status',
      `Mark referral ${ref.id} as "${STATUS_CONFIG[newStatus].label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            setReferrals(prev => prev.map(r => r.id === ref.id ? { ...r, status: newStatus } : r));
            setSelectedReferral(null);
          },
        },
      ]
    );
  };

  // ── Render helpers ────────────────────────────────────────────────────────
  const renderReferralCard = (item: Referral, index: number) => {
    const statusCfg = STATUS_CONFIG[item.status];
    const urgencyCfg = URGENCY_CONFIG[item.urgency];

    return (
      <AnimatedCard
        key={item.id}
        delay={index * 60}
        style={[
          styles.referralCard,
          { backgroundColor: colors.surface },
          ...(item.urgency === 'emergency' ? [{ borderLeftWidth: 4, borderLeftColor: '#E53E3E' }] : []),
        ]}
      >
        <TouchableOpacity onPress={() => setSelectedReferral(item)} activeOpacity={0.85}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.patientIdent}>
              <View style={[styles.avatar, { backgroundColor: isDark ? colors.neutral[100] : '#F0F9F4' }]}>
                <Text style={[styles.avatarLetter, { color: '#2C5E3E' }]}>{item.patientName[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.patientName, { color: colors.neutral[900] }]}>{item.patientName}</Text>
                <Text style={[styles.patientMeta, { color: colors.neutral[500] }]}>
                  {item.patientAge}y • {item.patientGender} • {item.village}
                </Text>
              </View>
            </View>
            <View style={[styles.urgencyBadge, { backgroundColor: urgencyCfg.bg }]}>
              <Text style={[styles.urgencyText, { color: urgencyCfg.color }]}>{urgencyCfg.label}</Text>
            </View>
          </View>

          {/* Diagnosis */}
          <View style={[styles.diagnosisRow, { backgroundColor: isDark ? colors.neutral[100] : '#FAFAFA' }]}>
            <Icon source="stethoscope" size={14} color={colors.neutral[400]} />
            <Text style={[styles.diagnosisText, { color: colors.neutral[700] }]} numberOfLines={1}>
              {item.diagnosis}
            </Text>
          </View>

          {/* Route */}
          <View style={styles.routeRow}>
            <View style={styles.routeChip}>
              <Icon source="hospital-building" size={12} color={colors.neutral[500]} />
              <Text style={[styles.routeText, { color: colors.neutral[600] }]} numberOfLines={1}>{item.fromFacility}</Text>
            </View>
            <Icon source="arrow-right" size={16} color={colors.primary[600]} />
            <View style={[styles.routeChip, { flex: 1 }]}>
              <Icon source="hospital-marker" size={12} color="#6B46C1" />
              <Text style={[styles.routeText, { color: '#6B46C1', fontWeight: '700' }]} numberOfLines={1}>{item.toFacility}</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : statusCfg.bg }]}>
              <Icon source={statusCfg.icon} size={13} color={statusCfg.color} />
              <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
            </View>
            <Text style={[styles.refId, { color: colors.neutral[400] }]}>{item.id}</Text>
            <Text style={[styles.dateText, { color: colors.neutral[400] }]}>{item.referralDate}</Text>
          </View>
        </TouchableOpacity>
      </AnimatedCard>
    );
  };

  // ── Facility Picker Modal ─────────────────────────────────────────────────
  const facilityMatches = UGANDAN_FACILITIES.filter(f =>
    f.toLowerCase().includes(facilitySearch.toLowerCase())
  );

  // ── Main Render ───────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <LinearGradient
        colors={['#6B46C1', '#5B21B6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Referral Portal</Text>
            <Text style={styles.headerSub}>Track & manage patient referrals</Text>
          </View>
          <TouchableOpacity style={styles.newBtn} onPress={() => setShowNewModal(true)}>
            <Icon source="plus" size={18} color="#6B46C1" />
            <Text style={styles.newBtnText}>New Referral</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total', count: stats.total, color: '#FFF' },
            { label: 'Pending', count: stats.pending, color: '#F6AD55' },
            { label: 'In Transit', count: stats.inTransit, color: '#90CDF4' },
            { label: 'Received', count: stats.received, color: '#D6BCFA' },
            { label: 'Emergency', count: stats.emergency, color: '#FC8181' },
          ].map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={[styles.statCount, { color: s.color }]}>{s.count}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* ── Search + Filters ── */}
      <View style={[styles.filterBar, { backgroundColor: colors.surface }]}>
        <Searchbar
          placeholder="Search by patient or diagnosis..."
          value={search}
          onChangeText={setSearch}
          style={[styles.searchBar, { backgroundColor: colors.neutral[50] }]}
          inputStyle={{ fontSize: 14, color: colors.neutral[900] }}
          iconColor="#6B46C1"
          placeholderTextColor={colors.neutral[400]}
          elevation={0}
        />

        {/* Status Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {(['all', 'pending', 'in-transit', 'received', 'completed'] as const).map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.filterChip, { backgroundColor: statusFilter === s ? '#6B46C1' : colors.neutral[100] }]}
              onPress={() => setStatusFilter(s)}
            >
              <Text style={[styles.chipText, { color: statusFilter === s ? '#FFF' : colors.neutral[600] }]}>
                {s === 'all' ? `All (${stats.total})` :
                 s === 'pending' ? `Pending (${stats.pending})` :
                 s === 'in-transit' ? `In Transit (${stats.inTransit})` :
                 s === 'received' ? `Received (${stats.received})` :
                 `Done (${stats.completed})`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── List ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.listContent, isDesktop && styles.desktopList]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Icon source="transfer" size={56} color={colors.neutral[200]} />
            <Text style={[styles.emptyTitle, { color: colors.neutral[600] }]}>No referrals found</Text>
            <Text style={[styles.emptySub, { color: colors.neutral[400] }]}>
              Create a new referral using the button above
            </Text>
          </View>
        ) : (
          filtered.map((item, idx) => renderReferralCard(item, idx))
        )}
      </ScrollView>

      {/* ── Detail Modal ── */}
      {selectedReferral && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.detailModal, { backgroundColor: colors.surface }]}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <LinearGradient colors={['#6B46C1', '#5B21B6']} style={styles.detailHeader}>
                  <Text style={styles.detailId}>{selectedReferral.id}</Text>
                  <Text style={styles.detailPatient}>{selectedReferral.patientName}</Text>
                  <Text style={styles.detailMeta}>
                    {selectedReferral.patientAge}y • {selectedReferral.patientGender} • {selectedReferral.village}
                  </Text>
                  <View style={[styles.urgencyBadge, { backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 8, alignSelf: 'flex-start' }]}>
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12 }}>
                      {URGENCY_CONFIG[selectedReferral.urgency].label}
                    </Text>
                  </View>
                </LinearGradient>

                <View style={{ padding: spacing.lg, gap: spacing.md }}>
                  {/* Diagnosis */}
                  <View style={[styles.detailSection, { backgroundColor: isDark ? colors.neutral[100] : '#FAFAFA' }]}>
                    <Text style={[styles.detailSectionLabel, { color: '#6B46C1' }]}>
                      <Icon source="stethoscope" size={14} color="#6B46C1" /> Diagnosis
                    </Text>
                    <Text style={[styles.detailSectionValue, { color: colors.neutral[900] }]}>{selectedReferral.diagnosis}</Text>
                  </View>

                  {/* Reason */}
                  <View style={[styles.detailSection, { backgroundColor: isDark ? colors.neutral[100] : '#FAFAFA' }]}>
                    <Text style={[styles.detailSectionLabel, { color: '#6B46C1' }]}>Referral Reason</Text>
                    <Text style={[styles.detailSectionValue, { color: colors.neutral[800] }]}>{selectedReferral.reason}</Text>
                  </View>

                  {/* Route */}
                  <View style={[styles.detailSection, { backgroundColor: isDark ? colors.neutral[100] : '#FAFAFA' }]}>
                    <Text style={[styles.detailSectionLabel, { color: '#6B46C1' }]}>Transfer Route</Text>
                    <View style={{ gap: 6, marginTop: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Icon source="hospital-building" size={16} color={colors.neutral[500]} />
                        <Text style={[styles.detailSectionValue, { color: colors.neutral[700], flex: 1 }]}>
                          From: {selectedReferral.fromFacility}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Icon source="hospital-marker" size={16} color="#6B46C1" />
                        <Text style={[styles.detailSectionValue, { color: '#6B46C1', fontWeight: '700', flex: 1 }]}>
                          To: {selectedReferral.toFacility}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Referred By / Date */}
                  <View style={{ flexDirection: 'row', gap: spacing.md }}>
                    <View style={[styles.detailSection, { flex: 1, backgroundColor: isDark ? colors.neutral[100] : '#FAFAFA' }]}>
                      <Text style={[styles.detailSectionLabel, { color: '#6B46C1' }]}>Referred By</Text>
                      <Text style={[styles.detailSectionValue, { color: colors.neutral[800] }]}>{selectedReferral.referredBy}</Text>
                    </View>
                    <View style={[styles.detailSection, { flex: 1, backgroundColor: isDark ? colors.neutral[100] : '#FAFAFA' }]}>
                      <Text style={[styles.detailSectionLabel, { color: '#6B46C1' }]}>Date</Text>
                      <Text style={[styles.detailSectionValue, { color: colors.neutral[800] }]}>{selectedReferral.referralDate}</Text>
                    </View>
                  </View>

                  {/* Notes */}
                  {selectedReferral.notes && (
                    <View style={[styles.detailSection, { backgroundColor: '#FFF9E6', borderWidth: 1, borderColor: '#F6AD55' }]}>
                      <Text style={[styles.detailSectionLabel, { color: '#DD6B20' }]}>⚠ Clinical Notes</Text>
                      <Text style={[styles.detailSectionValue, { color: '#744210' }]}>{selectedReferral.notes}</Text>
                    </View>
                  )}

                  {/* Contact */}
                  {selectedReferral.contactPhone && (
                    <View style={[styles.detailSection, { backgroundColor: '#EBF8FF' }]}>
                      <Text style={[styles.detailSectionLabel, { color: '#3182CE' }]}>Contact Phone</Text>
                      <Text style={[styles.detailSectionValue, { color: '#2B6CB0', fontWeight: '700' }]}>{selectedReferral.contactPhone}</Text>
                    </View>
                  )}

                  {/* Status Update Buttons */}
                  <Text style={[styles.detailSectionLabel, { color: colors.neutral[500], marginTop: 4 }]}>UPDATE STATUS</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {(['pending', 'in-transit', 'received', 'completed', 'cancelled'] as ReferralStatus[])
                      .filter(s => s !== selectedReferral.status)
                      .map(s => {
                        const cfg = STATUS_CONFIG[s];
                        return (
                          <TouchableOpacity
                            key={s}
                            style={[styles.statusUpdateBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : cfg.bg, borderColor: cfg.color + '60' }]}
                            onPress={() => handleUpdateStatus(selectedReferral, s)}
                          >
                            <Icon source={cfg.icon} size={14} color={cfg.color} />
                            <Text style={[styles.statusUpdateText, { color: cfg.color }]}>{cfg.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[styles.closeDetailBtn, { borderTopColor: colors.neutral[100] }]}
                onPress={() => setSelectedReferral(null)}
              >
                <Icon source="close" size={18} color={colors.neutral[500]} />
                <Text style={[styles.closeDetailText, { color: colors.neutral[600] }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ── New Referral Modal ── */}
      <Modal visible={showNewModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.newModal, { backgroundColor: colors.surface }]}>
            {/* Modal Header */}
            <LinearGradient colors={['#6B46C1', '#5B21B6']} style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Patient Referral</Text>
              <Text style={styles.modalSub}>Fill in the referral form below</Text>
              <TouchableOpacity style={styles.closeModal} onPress={() => setShowNewModal(false)}>
                <Icon source="close" size={22} color="#FFF" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Urgency Selector */}
              <Text style={[styles.fieldLabel, { color: colors.neutral[700] }]}>Urgency Level *</Text>
              <View style={styles.urgencyRow}>
                {(['routine', 'urgent', 'emergency'] as ReferralUrgency[]).map(u => {
                  const cfg = URGENCY_CONFIG[u];
                  return (
                    <TouchableOpacity
                      key={u}
                      style={[styles.urgencyOption, { backgroundColor: form.urgency === u ? cfg.bg : colors.neutral[50], borderColor: form.urgency === u ? cfg.borderColor : colors.neutral[200] }]}
                      onPress={() => setForm(p => ({ ...p, urgency: u }))}
                    >
                      <Text style={[styles.urgencyOptionText, { color: form.urgency === u ? cfg.color : colors.neutral[500] }]}>{cfg.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Patient Name */}
              <Text style={[styles.fieldLabel, { color: colors.neutral[700] }]}>Patient Name *</Text>
              <TextInput
                value={form.patientName}
                onChangeText={v => setForm(p => ({ ...p, patientName: v }))}
                style={[styles.input, { borderColor: colors.neutral[300], backgroundColor: colors.background, color: colors.neutral[900] }]}
                placeholder="Full name"
                placeholderTextColor={colors.neutral[400]}
              />

              {/* Age + Gender row */}
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.neutral[700] }]}>Age</Text>
                  <TextInput
                    value={form.patientAge}
                    onChangeText={v => setForm(p => ({ ...p, patientAge: v }))}
                    style={[styles.input, { borderColor: colors.neutral[300], backgroundColor: colors.background, color: colors.neutral[900] }]}
                    placeholder="Age"
                    placeholderTextColor={colors.neutral[400]}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.neutral[700] }]}>Gender</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['F', 'M'] as const).map(g => (
                      <TouchableOpacity
                        key={g}
                        style={[styles.genderBtn, { backgroundColor: form.patientGender === g ? '#6B46C1' : colors.neutral[100], flex: 1 }]}
                        onPress={() => setForm(p => ({ ...p, patientGender: g }))}
                      >
                        <Text style={[styles.genderBtnText, { color: form.patientGender === g ? '#FFF' : colors.neutral[600] }]}>{g === 'F' ? 'Female' : 'Male'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Village */}
              <Text style={[styles.fieldLabel, { color: colors.neutral[700] }]}>Village / Sub-county</Text>
              <TextInput
                value={form.village}
                onChangeText={v => setForm(p => ({ ...p, village: v }))}
                style={[styles.input, { borderColor: colors.neutral[300], backgroundColor: colors.background, color: colors.neutral[900] }]}
                placeholder="Patient's home area"
                placeholderTextColor={colors.neutral[400]}
              />

              {/* Diagnosis */}
              <Text style={[styles.fieldLabel, { color: colors.neutral[700] }]}>Diagnosis / Working Diagnosis *</Text>
              <TextInput
                value={form.diagnosis}
                onChangeText={v => setForm(p => ({ ...p, diagnosis: v }))}
                style={[styles.input, { borderColor: colors.neutral[300], backgroundColor: colors.background, color: colors.neutral[900] }]}
                placeholder="E.g. Severe Malaria, Acute MI, SAM"
                placeholderTextColor={colors.neutral[400]}
              />

              {/* Reason */}
              <Text style={[styles.fieldLabel, { color: colors.neutral[700] }]}>Reason for Referral *</Text>
              <TextInput
                value={form.reason}
                onChangeText={v => setForm(p => ({ ...p, reason: v }))}
                style={[styles.input, styles.textArea, { borderColor: colors.neutral[300], backgroundColor: colors.background, color: colors.neutral[900] }]}
                placeholder="Why is this patient being referred? What is needed?"
                placeholderTextColor={colors.neutral[400]}
                multiline
                numberOfLines={3}
              />

              {/* From Facility */}
              <Text style={[styles.fieldLabel, { color: colors.neutral[700] }]}>From Facility</Text>
              <TouchableOpacity
                style={[styles.facilityPicker, { borderColor: colors.neutral[300], backgroundColor: colors.background }]}
                onPress={() => { setShowFacilityPicker('from'); setFacilitySearch(''); }}
              >
                <Icon source="hospital-building" size={18} color={colors.neutral[400]} />
                <Text style={[{ flex: 1, color: form.fromFacility ? colors.neutral[900] : colors.neutral[400], fontSize: 14 }]}>
                  {form.fromFacility || 'Select origin facility'}
                </Text>
                <Icon source="chevron-down" size={18} color={colors.neutral[400]} />
              </TouchableOpacity>

              {/* To Facility */}
              <Text style={[styles.fieldLabel, { color: colors.neutral[700] }]}>Destination Facility *</Text>
              <TouchableOpacity
                style={[styles.facilityPicker, { borderColor: '#6B46C1', backgroundColor: colors.background }]}
                onPress={() => { setShowFacilityPicker('to'); setFacilitySearch(''); }}
              >
                <Icon source="hospital-marker" size={18} color="#6B46C1" />
                <Text style={[{ flex: 1, color: form.toFacility ? '#6B46C1' : colors.neutral[400], fontSize: 14, fontWeight: form.toFacility ? '700' : '400' }]}>
                  {form.toFacility || 'Select destination facility'}
                </Text>
                <Icon source="chevron-down" size={18} color="#6B46C1" />
              </TouchableOpacity>

              {/* Referred By */}
              <Text style={[styles.fieldLabel, { color: colors.neutral[700] }]}>Referred By</Text>
              <TextInput
                value={form.referredBy}
                onChangeText={v => setForm(p => ({ ...p, referredBy: v }))}
                style={[styles.input, { borderColor: colors.neutral[300], backgroundColor: colors.background, color: colors.neutral[900] }]}
                placeholder="Your name and title"
                placeholderTextColor={colors.neutral[400]}
              />

              {/* Contact */}
              <Text style={[styles.fieldLabel, { color: colors.neutral[700] }]}>Patient/Escort Contact Phone</Text>
              <TextInput
                value={form.contactPhone}
                onChangeText={v => setForm(p => ({ ...p, contactPhone: v }))}
                style={[styles.input, { borderColor: colors.neutral[300], backgroundColor: colors.background, color: colors.neutral[900] }]}
                placeholder="+256 7XX XXX XXX"
                placeholderTextColor={colors.neutral[400]}
                keyboardType="phone-pad"
              />

              {/* Notes */}
              <Text style={[styles.fieldLabel, { color: colors.neutral[700] }]}>Additional Clinical Notes</Text>
              <TextInput
                value={form.notes}
                onChangeText={v => setForm(p => ({ ...p, notes: v }))}
                style={[styles.input, styles.textArea, { borderColor: colors.neutral[300], backgroundColor: colors.background, color: colors.neutral[900] }]}
                placeholder="Vitals, labs, pre-referral treatment given..."
                placeholderTextColor={colors.neutral[400]}
                multiline
                numberOfLines={4}
              />

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: isSubmitting ? '#9B7EDB' : '#6B46C1', opacity: isSubmitting ? 0.7 : 1 }]}
                onPress={handleSubmitReferral}
                disabled={isSubmitting}
              >
                <Icon source={isSubmitting ? 'loading' : 'transfer'} size={20} color="#FFF" />
                <Text style={styles.submitBtnText}>{isSubmitting ? 'Submitting...' : 'Submit Referral'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Facility Picker ── */}
      {showFacilityPicker && (
        <Modal visible transparent animationType="fade">
          <TouchableOpacity style={styles.pickerOverlay} onPress={() => setShowFacilityPicker(null)} activeOpacity={1}>
            <View style={[styles.pickerModal, { backgroundColor: colors.surface }]} onStartShouldSetResponder={() => true}>
              <Text style={[styles.pickerTitle, { color: colors.neutral[900] }]}>
                {showFacilityPicker === 'from' ? 'Select Origin Facility' : 'Select Destination Facility'}
              </Text>
              <TextInput
                value={facilitySearch}
                onChangeText={setFacilitySearch}
                style={[styles.input, { borderColor: colors.neutral[300], backgroundColor: colors.background, color: colors.neutral[900], marginBottom: 8 }]}
                placeholder="Search facilities..."
                placeholderTextColor={colors.neutral[400]}
                autoFocus
              />
              <ScrollView style={{ maxHeight: 280 }}>
                {facilityMatches.map((f, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.facilityOption, { borderBottomColor: colors.neutral[100] }]}
                    onPress={() => {
                      if (showFacilityPicker === 'from') {
                        setForm(p => ({ ...p, fromFacility: f }));
                      } else {
                        setForm(p => ({ ...p, toFacility: f }));
                      }
                      setShowFacilityPicker(null);
                    }}
                  >
                    <Icon source="hospital-building" size={16} color={colors.neutral[400]} />
                    <Text style={[styles.facilityOptionText, { color: colors.neutral[800] }]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    paddingTop: 56,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  headerTitle: { fontSize: rf(20), fontWeight: '900', color: '#FFF' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF', paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: radii.full,
  },
  newBtnText: { color: '#6B46C1', fontWeight: '800', fontSize: 13 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radii.xl,
    paddingVertical: 12,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statCount: { fontSize: rf(16), fontWeight: '900' },
  statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.65)', fontWeight: '700', marginTop: 2 },

  // Filters
  filterBar: { padding: spacing.md, ...shadows.sm },
  searchBar: { borderRadius: radii.full, marginBottom: spacing.sm, borderWidth: 0 },
  chipRow: { gap: 8, paddingVertical: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.full },
  chipText: { fontSize: 12, fontWeight: '700' },

  // List
  listContent: { padding: spacing.md, paddingBottom: 100 },
  desktopList: { maxWidth: 960, alignSelf: 'center', width: '100%' },

  // Referral Card
  referralCard: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  patientIdent: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 18, fontWeight: '900' },
  patientName: { fontSize: 16, fontWeight: '800' },
  patientMeta: { fontSize: 12, marginTop: 1 },
  urgencyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.full },
  urgencyText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  diagnosisRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: spacing.sm, borderRadius: radii.md, marginBottom: spacing.sm },
  diagnosisText: { fontSize: 13, fontWeight: '600', flex: 1 },

  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md, flexWrap: 'wrap' },
  routeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '45%' },
  routeText: { fontSize: 11, fontWeight: '600' },

  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.full },
  statusText: { fontSize: 11, fontWeight: '800' },
  refId: { fontSize: 11, fontWeight: '700', marginLeft: 4 },
  dateText: { fontSize: 11, marginLeft: 'auto' },

  // Empty State
  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptySub: { fontSize: 13, textAlign: 'center' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  detailModal: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%' },
  newModal: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '95%', flex: 1 },

  detailHeader: { padding: spacing.xl, paddingTop: 32 },
  detailId: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '700', letterSpacing: 1 },
  detailPatient: { fontSize: rf(20), fontWeight: '900', color: '#FFF', marginTop: 4 },
  detailMeta: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  detailSection: { padding: spacing.md, borderRadius: radii.lg, gap: 4 },
  detailSectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  detailSectionValue: { fontSize: 14, fontWeight: '500', lineHeight: 20 },

  statusUpdateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.full,
    borderWidth: 1,
  },
  statusUpdateText: { fontSize: 12, fontWeight: '700' },

  closeDetailBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: spacing.lg, borderTopWidth: 1,
  },
  closeDetailText: { fontSize: 15, fontWeight: '700' },

  // New Modal Form
  modalHeader: { padding: spacing.lg, paddingTop: 28, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  modalTitle: { fontSize: rf(18), fontWeight: '900', color: '#FFF' },
  modalSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  closeModal: { position: 'absolute', top: spacing.lg, right: spacing.lg, padding: 4 },
  formContent: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 60 },

  fieldLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 4 },
  input: {
    borderWidth: 1, borderRadius: radii.lg,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },

  urgencyRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  urgencyOption: { flex: 1, paddingVertical: 10, borderRadius: radii.lg, borderWidth: 1.5, alignItems: 'center' },
  urgencyOptionText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  genderBtn: { paddingVertical: 10, borderRadius: radii.lg, alignItems: 'center' },
  genderBtnText: { fontSize: 13, fontWeight: '700' },

  facilityPicker: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: radii.lg,
    paddingHorizontal: 12, paddingVertical: 11,
  },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: radii.xl, marginTop: spacing.md,
  },
  submitBtnText: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 0.3 },

  // Facility Picker Popover
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl },
  pickerModal: { borderRadius: radii.xl, padding: spacing.lg, maxHeight: 420 },
  pickerTitle: { fontSize: 16, fontWeight: '800', marginBottom: spacing.md },
  facilityOption: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1 },
  facilityOptionText: { fontSize: 14, fontWeight: '500', flex: 1 },
});

export default ReferralPortalScreen;
