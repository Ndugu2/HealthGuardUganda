import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Text, Icon, Searchbar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../ThemeContext';
import { spacing, radii, shadows, gradients } from '../theme';
import { useResponsive, typography , rf } from '../responsive';
import AnimatedCard from '../components/AnimatedCard';
import { getPatients } from '../db/Database';

type PatientStatus = 'waiting' | 'in-progress' | 'referred' | 'completed' | 'follow-up';

interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  village: string;
  symptoms: string;
  status: PatientStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  screenedDate: string;
  followUpDate?: string;
  referredTo?: string;
}

const MOCK_PATIENTS: Patient[] = [
  { id: 1, name: 'Nakato Sarah', age: 28, gender: 'F', village: 'Nakawa', symptoms: 'High fever, headache, body aches', status: 'waiting', priority: 'high', screenedDate: 'Today, 09:15' },
  { id: 2, name: 'Okello James', age: 45, gender: 'M', village: 'Kisenyi', symptoms: 'Persistent cough, weight loss', status: 'in-progress', priority: 'critical', screenedDate: 'Today, 08:30' },
  { id: 3, name: 'Auma Grace', age: 32, gender: 'F', village: 'Bwaise', symptoms: 'Prenatal checkup — 7 months', status: 'completed', priority: 'medium', screenedDate: 'Today, 07:45' },
  { id: 4, name: 'Mugisha David', age: 5, gender: 'M', village: 'Nakawa', symptoms: 'Diarrhea, vomiting since 2 days', status: 'referred', priority: 'high', screenedDate: 'Yesterday', referredTo: 'Mulago Hospital' },
  { id: 5, name: 'Nambi Ruth', age: 22, gender: 'F', village: 'Kawempe', symptoms: 'Skin rash, itching', status: 'follow-up', priority: 'low', screenedDate: '18 May', followUpDate: '25 May 2026' },
  { id: 6, name: 'Ssekandi Moses', age: 60, gender: 'M', village: 'Makindye', symptoms: 'Chest pains, shortness of breath', status: 'referred', priority: 'critical', screenedDate: '17 May', referredTo: 'Nsambya Hospital' },
  { id: 7, name: 'Babirye Esther', age: 19, gender: 'F', village: 'Rubaga', symptoms: 'Missed period, nausea', status: 'completed', priority: 'medium', screenedDate: '16 May' },
  { id: 8, name: 'Kato Brian', age: 8, gender: 'M', village: 'Nakawa', symptoms: 'Malaria (confirmed RDT+)', status: 'follow-up', priority: 'medium', screenedDate: '15 May', followUpDate: '22 May 2026' },
];

const STATUS_CONFIG: Record<PatientStatus, { icon: string; color: string; bg: string; label: string }> = {
  'waiting': { icon: 'clock-outline', color: '#DD6B20', bg: '#FFFAF0', label: 'Waiting' },
  'in-progress': { icon: 'stethoscope', color: '#3182CE', bg: '#EBF8FF', label: 'In Progress' },
  'referred': { icon: 'hospital-building', color: '#9B2C2C', bg: '#FFF5F5', label: 'Referred' },
  'completed': { icon: 'check-circle', color: '#2C5E3E', bg: '#E2F0D9', label: 'Completed' },
  'follow-up': { icon: 'calendar-clock', color: '#6B46C1', bg: '#FAF5FF', label: 'Follow-up' },
};

const PRIORITY_COLORS: Record<string, { color: string; bg: string }> = {
  'low': { color: '#2C5E3E', bg: '#E2F0D9' },
  'medium': { color: '#DD6B20', bg: '#FFFAF0' },
  'high': { color: '#E53E3E', bg: '#FFF5F5' },
  'critical': { color: '#FFF', bg: '#E53E3E' },
};

const PatientQueueScreen = () => {
  const { t } = useTranslation();
  const { colors, mode } = useAppTheme();
  const { isPhone, isTablet, isDesktop, hPad, heroHeight, rf, bp, width, height } = useResponsive();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PatientStatus | 'all'>('all');

  useEffect(() => {
    const fetchPatients = async () => {
      const data = await getPatients();
      setPatients(data as any[]);
    };
    fetchPatients();
  }, []);

  const filtered = patients.filter(p => {
    const matchSearch = !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()) || p.symptoms.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    waiting: patients.filter(p => p.status === 'waiting').length,
    inProgress: patients.filter(p => p.status === 'in-progress').length,
    referred: patients.filter(p => p.status === 'referred').length,
    completed: patients.filter(p => p.status === 'completed').length,
    followUp: patients.filter(p => p.status === 'follow-up').length,
  };

  const renderPatient = ({ item, index }: { item: Patient; index: number }) => {
    const statusCfg = STATUS_CONFIG[item.status];
    const priorityCfg = PRIORITY_COLORS[item.priority];

    return (
      <AnimatedCard
        delay={index * 60}
        style={[
          styles.patientCard,
          { backgroundColor: colors.surface },
          item.priority === 'critical' ? { borderLeftWidth: 4, borderLeftColor: '#E53E3E' } : {},
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.patientIdent}>
            <View style={[styles.avatar, { backgroundColor: mode === 'dark' ? colors.neutral[100] : '#F0F9F4' }]}>
              <Text style={[styles.avatarLetter, { color: '#2C5E3E' }]}>{item.name[0]}</Text>
            </View>
            <View style={styles.nameCol}>
              <Text style={[styles.patientName, { color: colors.neutral[900] }]}>{item.name}</Text>
              <Text style={[styles.patientMeta, { color: colors.neutral[500] }]}>
                {item.age}y • {item.gender} • {item.village}
              </Text>
            </View>
          </View>
          <View style={styles.badges}>
            <View style={[styles.priorityBadge, { backgroundColor: priorityCfg.bg }]}>
              <Text style={[styles.priorityText, { color: priorityCfg.color }]}>
                {item.priority.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.symptomsRow, { backgroundColor: mode === 'dark' ? colors.neutral[100] : '#FAFAFA' }]}>
          <Icon source="text-box-outline" size={14} color={colors.neutral[400]} />
          <Text style={[styles.symptomsText, { color: colors.neutral[700] }]}>{item.symptoms}</Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : statusCfg.bg }]}>
            <Icon source={statusCfg.icon} size={14} color={statusCfg.color} />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>

          {item.referredTo && (
            <Text style={[styles.referralText, { color: colors.neutral[500] }]}>
              → {item.referredTo}
            </Text>
          )}
          {item.followUpDate && (
            <Text style={[styles.referralText, { color: '#6B46C1' }]}>
              Follow-up: {item.followUpDate}
            </Text>
          )}

          <Text style={[styles.dateText, { color: colors.neutral[400] }]}>{item.screenedDate}</Text>
        </View>
      </AnimatedCard>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>{t('queue.title') || 'Patient Queue'}</Text>
            <Text style={styles.headerSub}>{t('queue.subtitle') || 'Today\'s screening and follow-ups'}</Text>
          </View>
          <View style={styles.todayBadge}>
            <Icon source="calendar-today" size={16} color="#FFF" />
            <Text style={styles.todayText}>{new Date().toLocaleDateString('en-UG', { day: 'numeric', month: 'short' })}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Waiting', count: stats.waiting, color: '#DD6B20' },
            { label: 'Active', count: stats.inProgress, color: '#3182CE' },
            { label: 'Referred', count: stats.referred, color: '#9B2C2C' },
            { label: 'Done', count: stats.completed, color: '#2C5E3E' },
            { label: 'Follow-up', count: stats.followUp, color: '#6B46C1' },
          ].map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={[styles.statCount, { color: '#FFF' }]}>{s.count}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Search + Filters */}
      <View style={[styles.filterBar, { backgroundColor: colors.surface }]}>
        <Searchbar
          placeholder={t('queue.search') || 'Search patients...'}
          value={search}
          onChangeText={setSearch}
          style={[styles.searchBar, { backgroundColor: colors.neutral[50] }]}
          inputStyle={{ fontSize: 14, color: colors.neutral[900] }}
          iconColor={colors.primary[800]}
          placeholderTextColor={colors.neutral[400]}
          elevation={0}
        />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { key: 'all', label: `All (${patients.length})` },
            { key: 'waiting', label: `Waiting (${stats.waiting})` },
            { key: 'in-progress', label: `Active (${stats.inProgress})` },
            { key: 'referred', label: `Referred (${stats.referred})` },
            { key: 'follow-up', label: `Follow-up (${stats.followUp})` },
            { key: 'completed', label: `Done (${stats.completed})` },
          ]}
          keyExtractor={item => item.key}
          contentContainerStyle={styles.chipRow}
          renderItem={({ item: chip }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                { backgroundColor: filter === chip.key ? '#2C5E3E' : colors.neutral[100] },
              ]}
              onPress={() => setFilter(chip.key as any)}
            >
              <Text style={[
                styles.chipText,
                { color: filter === chip.key ? '#FFF' : colors.neutral[600] },
              ]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Patient List */}
      <FlatList
        data={filtered}
        renderItem={renderPatient}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={[styles.listContent, isDesktop && styles.desktopList]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Icon source="account-search" size={48} color={colors.neutral[200]} />
            <Text style={[styles.emptyTitle, { color: colors.neutral[600] }]}>No patients found</Text>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerTitle: { fontSize: rf(20), fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginTop: 2 },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
  },
  todayText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radii.xl,
    paddingVertical: 14,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statCount: { fontSize: rf(16), fontWeight: '900' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '700', marginTop: 2 },
  // Filter
  filterBar: {
    padding: spacing.md,
    ...shadows.sm,
  },
  searchBar: {
    borderRadius: radii.full,
    marginBottom: spacing.sm,
    borderWidth: 0,
  },
  chipRow: { gap: 8, paddingVertical: 4 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
  },
  chipText: { fontSize: 12, fontWeight: '700' },
  // List
  listContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  desktopList: { maxWidth: 900, alignSelf: 'center', width: '100%' },
  // Patient Card
  patientCard: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  patientIdent: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 18, fontWeight: '900' },
  nameCol: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: '800' },
  patientMeta: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  badges: { flexDirection: 'row', gap: 6 },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  priorityText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  symptomsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.sm,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
  },
  symptomsText: { fontSize: 13, fontWeight: '500', flex: 1, lineHeight: 18 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  statusText: { fontSize: 11, fontWeight: '800' },
  referralText: { fontSize: 12, fontWeight: '600' },
  dateText: { fontSize: 11, fontWeight: '600', marginLeft: 'auto' },
  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
});

export default PatientQueueScreen;
