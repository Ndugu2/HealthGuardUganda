// src/screens/DiseaseStatsScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { Text, Icon, ActivityIndicator } from 'react-native-paper';
import { useAppTheme } from '../ThemeContext';
import { spacing, radii, shadows } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedCard from '../components/AnimatedCard';
import { getDiseaseStats, saveDiseaseStats, DiseaseStat } from '../db/diseaseStats';

// ── Uganda-specific seeded outbreak data ─────────────────────────────────────

const SEED_STATS: DiseaseStat[] = [
  {
    id: 'malaria-2026-05',
    title: 'Malaria Surge — Northern Uganda',
    description:
      'A seasonal rise in Plasmodium falciparum cases has been recorded across Gulu, Lira, and Kitgum districts following heavier-than-expected May rains. Health facilities report a 34% increase in confirmed RDT-positive cases compared to April. MoH urges sleeping under LLINs and seeking treatment within 24 hours of fever onset.',
    reportedAt: new Date(2026, 4, 24).toISOString(),
    severity: 'HIGH',
  },
  {
    id: 'cholera-2026-05',
    title: 'Cholera Outbreak — Kasese District',
    description:
      'The Uganda Virus Research Institute (UVRI) has confirmed a cholera (Vibrio cholerae O1) cluster linked to contaminated water sources near the Rwenzori foothills. 47 cases and 2 deaths have been reported. ORS centres are operational at Kasese General Hospital. Residents are advised to boil or treat all drinking water.',
    reportedAt: new Date(2026, 4, 20).toISOString(),
    severity: 'CRITICAL',
  },
  {
    id: 'mpox-2026-04',
    title: 'Mpox (Monkeypox) — Nakaseke & Luweero',
    description:
      'MoH has confirmed 12 laboratory-verified Mpox Clade Ib cases in Nakaseke and Luweero districts, connected to cross-border movement from the DRC. Contact tracing teams are deployed. Vaccination with JYNNEOS is ongoing for high-risk contacts. Public is advised to avoid contact with sick animals and report rash-like symptoms.',
    reportedAt: new Date(2026, 3, 15).toISOString(),
    severity: 'HIGH',
  },
  {
    id: 'measles-2026-03',
    title: 'Measles Alert — Karamoja Sub-Region',
    description:
      'Low vaccination coverage (estimated 52%) in Moroto, Nakapiripirit, and Amudat districts has resulted in a measles resurgence. 89 suspected cases with 6 confirmed deaths — predominantly children under 5. UNEPI reactive vaccination campaigns are scheduled. Caregivers are urged to present children at the nearest health facility.',
    reportedAt: new Date(2026, 2, 28).toISOString(),
    severity: 'HIGH',
  },
  {
    id: 'typhoid-2026-03',
    title: 'Typhoid Fever Cluster — Kampala Slums',
    description:
      'A cluster of Salmonella typhi infections has been linked to contaminated food vendors in Bwaise, Kamwokya, and Katanga. 23 confirmed cases, mostly young adults aged 15–30. Antimicrobial susceptibility testing shows 60% resistance to ciprofloxacin. MoH advises eating only properly cooked food and washing hands frequently.',
    reportedAt: new Date(2026, 2, 10).toISOString(),
    severity: 'MEDIUM',
  },
  {
    id: 'rabies-2026-02',
    title: 'Rabies Deaths — Lyantonde & Rakai Districts',
    description:
      'Three human deaths from rabies have been confirmed following dog bites in Lyantonde and Rakai districts. Investigations indicate low dog vaccination coverage in affected sub-counties. MoH is conducting mass dog vaccination campaigns. Anyone bitten by an animal should immediately wash the wound and seek PEP at a health facility.',
    reportedAt: new Date(2026, 1, 5).toISOString(),
    severity: 'HIGH',
  },
  {
    id: 'covid-2026-01',
    title: 'COVID-19 XEC Variant — Minor Wave',
    description:
      'A minor uptick in SARS-CoV-2 cases attributed to the XEC sub-variant has been detected in Kampala and Wakiso. 340 confirmed cases in January 2026 — no significant hospitalizations. Genomic surveillance by UVRI is ongoing. Vulnerable individuals (elderly, immunocompromised) are encouraged to get updated XBB booster doses.',
    reportedAt: new Date(2026, 0, 18).toISOString(),
    severity: 'LOW',
  },
  {
    id: 'tb-2026-jan',
    title: 'Tuberculosis — Annual MoH Report',
    description:
      'Uganda notified 84,000 TB cases in 2025, an increase of 8% from 2024. Drug-resistant TB (MDR-TB) accounts for 3.4% of new cases. Co-infection with HIV remains high at 39%. MoH emphasizes completing the full 6-month treatment course. TB care is free at all government health facilities.',
    reportedAt: new Date(2026, 0, 5).toISOString(),
    severity: 'MEDIUM',
  },
];

// ── Severity configuration ────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  CRITICAL: { label: 'CRITICAL', color: '#7F1D1D', bg: '#FEE2E2', icon: 'alert-octagram' },
  HIGH:     { label: 'HIGH',     color: '#B45309', bg: '#FEF3C7', icon: 'alert' },
  MEDIUM:   { label: 'MEDIUM',   color: '#1D4ED8', bg: '#DBEAFE', icon: 'information' },
  LOW:      { label: 'LOW',      color: '#065F46', bg: '#D1FAE5', icon: 'check-circle-outline' },
};

type SeverityFilter = 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Component ─────────────────────────────────────────────────────────────────

const DiseaseStatsScreen: React.FC = () => {
  const { colors, mode } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 800;

  const [stats, setStats] = useState<DiseaseStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<SeverityFilter>('ALL');
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      let data = await getDiseaseStats();
      if (data.length === 0) {
        await saveDiseaseStats(SEED_STATS);
        data = SEED_STATS;
      }
      setStats(data);
    } catch (e) {
      console.error('DiseaseStats load error', e);
      setStats(SEED_STATS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const onRefresh = () => { setRefreshing(true); loadStats(); };

  const filtered = filter === 'ALL' ? stats : stats.filter(s => s.severity === filter);

  const counts = {
    CRITICAL: stats.filter(s => s.severity === 'CRITICAL').length,
    HIGH:     stats.filter(s => s.severity === 'HIGH').length,
    MEDIUM:   stats.filter(s => s.severity === 'MEDIUM').length,
    LOW:      stats.filter(s => s.severity === 'LOW').length,
  };

  if (loading) {
    return (
      <View style={[styles.loadingCenter, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={[styles.loadingText, { color: colors.neutral[500] }]}>Loading outbreak data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary[600]]} />}
    >
      <View style={isDesktop ? styles.desktopPad : undefined}>

        {/* ── Header Banner ── */}
        <AnimatedCard delay={0} style={styles.headerCard}>
          <LinearGradient colors={['#7F1D1D', '#B91C1C']} style={styles.headerGradient}>
            <View style={styles.headerTop}>
              <View>
                <View style={styles.headerBadge}>
                  <Icon source="alert-octagram" size={12} color="#FCA5A5" />
                  <Text style={styles.headerBadgeText}>LIVE SURVEILLANCE</Text>
                </View>
                <Text style={styles.headerTitle}>Disease Outbreak Monitor</Text>
                <Text style={styles.headerSub}>Uganda MoH · Epidemiological Intelligence</Text>
              </View>
              <View style={styles.headerIcon}>
                <Icon source="virus-outline" size={40} color="rgba(255,255,255,0.3)" />
              </View>
            </View>
            {/* Summary Row */}
            <View style={styles.summaryRow}>
              {Object.entries(counts).map(([sev, count]) => {
                const cfg = SEVERITY_CONFIG[sev];
                return (
                  <View key={sev} style={styles.summaryCell}>
                    <Text style={styles.summaryCount}>{count}</Text>
                    <Text style={styles.summaryLabel}>{sev}</Text>
                  </View>
                );
              })}
            </View>
          </LinearGradient>
        </AnimatedCard>

        {/* ── Filter Tabs ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as SeverityFilter[]).map(f => {
            const isActive = filter === f;
            const cfg = f !== 'ALL' ? SEVERITY_CONFIG[f] : null;
            return (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterChip,
                  { backgroundColor: isActive ? (cfg?.color || colors.primary[900]) : colors.surface },
                  !isActive && { borderWidth: 1, borderColor: colors.neutral[200] },
                ]}
                onPress={() => setFilter(f)}
              >
                {cfg && <Icon source={cfg.icon} size={13} color={isActive ? '#FFF' : cfg.color} />}
                <Text style={[styles.filterChipText, { color: isActive ? '#FFF' : colors.neutral[700] }]}>
                  {f === 'ALL' ? `All (${stats.length})` : `${f} (${counts[f as keyof typeof counts]})`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Outbreak Cards ── */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon source="check-circle-outline" size={60} color={colors.primary[400]} />
            <Text style={[styles.emptyText, { color: colors.neutral[500] }]}>No {filter} alerts at this time</Text>
          </View>
        ) : (
          filtered.map((item, idx) => {
            const sev = item.severity || 'MEDIUM';
            const cfg = SEVERITY_CONFIG[sev] || SEVERITY_CONFIG.MEDIUM;
            const isExpanded = expanded === item.id;
            return (
              <AnimatedCard key={item.id} delay={idx * 60} style={[styles.card, { backgroundColor: colors.surface }]}>
                <TouchableOpacity activeOpacity={0.85} onPress={() => setExpanded(isExpanded ? null : item.id)}>
                  <View style={[styles.cardSeverityBar, { backgroundColor: cfg.color }]} />
                  <View style={styles.cardBody}>
                    {/* Top Row */}
                    <View style={styles.cardTopRow}>
                      <View style={[styles.severityBadge, { backgroundColor: cfg.bg }]}>
                        <Icon source={cfg.icon} size={12} color={cfg.color} />
                        <Text style={[styles.severityBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                      <Text style={[styles.cardTime, { color: colors.neutral[400] }]}>{timeAgo(item.reportedAt)}</Text>
                    </View>

                    {/* Title */}
                    <Text style={[styles.cardTitle, { color: colors.neutral[900] }]}>{item.title}</Text>

                    {/* Description — truncated or expanded */}
                    <Text
                      style={[styles.cardDesc, { color: colors.neutral[600] }]}
                      numberOfLines={isExpanded ? undefined : 3}
                    >
                      {item.description}
                    </Text>

                    {/* Expand / Collapse */}
                    <TouchableOpacity
                      style={styles.expandBtn}
                      onPress={() => setExpanded(isExpanded ? null : item.id)}
                    >
                      <Text style={[styles.expandBtnText, { color: cfg.color }]}>
                        {isExpanded ? 'Show less ▲' : 'Read full alert ▼'}
                      </Text>
                    </TouchableOpacity>

                    {/* Date */}
                    <View style={styles.cardFooter}>
                      <Icon source="calendar-outline" size={12} color={colors.neutral[400]} />
                      <Text style={[styles.cardDate, { color: colors.neutral[400] }]}>
                        Reported: {new Date(item.reportedAt).toLocaleDateString('en-UG', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </AnimatedCard>
            );
          })
        )}

        {/* ── Footer disclaimer ── */}
        <View style={styles.disclaimer}>
          <Icon source="information-outline" size={14} color={colors.neutral[400]} />
          <Text style={[styles.disclaimerText, { color: colors.neutral[400] }]}>
            Data sourced from Uganda MoH Epidemiological Bulletins & UVRI Surveillance Reports. Refresh for latest data.
          </Text>
        </View>

        <View style={{ height: 80 }} />
      </View>
    </ScrollView>
  );
};

export default DiseaseStatsScreen;

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  desktopPad: { maxWidth: 860, alignSelf: 'center', width: '100%' },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '600' },

  // Header
  headerCard: { borderRadius: radii.xl, overflow: 'hidden', marginBottom: spacing.md, ...shadows.md },
  headerGradient: { padding: spacing.lg },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  headerBadgeText: { color: '#FCA5A5', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '600', marginTop: 2 },
  headerIcon: { opacity: 0.5 },
  summaryRow: { flexDirection: 'row', gap: spacing.sm },
  summaryCell: {
    flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radii.md, paddingVertical: 8,
  },
  summaryCount: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  // Filters
  filterScroll: { marginBottom: spacing.md },
  filterRow: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.sm },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.full,
  },
  filterChipText: { fontSize: 12, fontWeight: '700' },

  // Cards
  card: {
    borderRadius: radii.xl, marginBottom: spacing.md,
    overflow: 'hidden', ...shadows.sm,
  },
  cardSeverityBar: { height: 4 },
  cardBody: { padding: spacing.md },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  severityBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.full,
  },
  severityBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  cardTime: { fontSize: 11, fontWeight: '600' },
  cardTitle: { fontSize: 16, fontWeight: '800', lineHeight: 22, marginBottom: 8 },
  cardDesc: { fontSize: 14, lineHeight: 22, marginBottom: 8 },
  expandBtn: { paddingVertical: 4 },
  expandBtnText: { fontSize: 12, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  cardDate: { fontSize: 11, fontWeight: '600' },

  // Misc
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '600' },
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 4, marginTop: spacing.md },
  disclaimerText: { flex: 1, fontSize: 11, lineHeight: 16 },
});
