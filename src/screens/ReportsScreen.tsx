import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Dimensions, FlatList, RefreshControl, useWindowDimensions, TouchableOpacity, Alert, Platform } from 'react-native';
import { Text, Divider, Icon, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { BarChart } from 'react-native-chart-kit';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { getStats, getAllClaims, ClaimRecord } from '../db/Database';
import AnimatedCard from '../components/AnimatedCard';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { colors, spacing, radii, shadows } from '../theme';
import { useAppTheme } from '../ThemeContext';
import { PatternService, MisinfoPattern } from '../services/PatternService';
import { HeatmapService, MapPoint } from '../services/HeatmapService';


const getRelativeTime = (dateStr: string, t: any): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return t('time.just_now');
  if (diffMin < 60) return t('time.m_ago', { count: diffMin });
  if (diffHr < 24) return t('time.h_ago', { count: diffHr });
  if (diffDay < 7) return t('time.d_ago', { count: diffDay });
  return date.toLocaleDateString();
};

const ReportsScreen = () => {
  const { t } = useTranslation();
  const { colors, mode } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 800;

  const [stats, setStats] = useState({ total: 0, accurate: 0, misinfo: 0 });
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [patterns, setPatterns] = useState<MisinfoPattern[]>([]);
  const [heatmapData, setHeatmapData] = useState<MapPoint[]>([]);

  const loadData = useCallback(async () => {
    const s = await getStats();
    setStats(s);
    const c = await getAllClaims();
    setClaims(c);
    const p = await PatternService.detectPatterns();
    setPatterns(p);
    const h = await HeatmapService.generateHeatmapData();
    setHeatmapData(h);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 500);
  }, [loadData]);

  const handleExport = async () => {
    if (claims.length === 0) {
      Alert.alert(t('reports.no_data_alert'), t('reports.no_records_export'));
      return;
    }

    setIsExporting(true);
    try {
      const header = 'ID,Claim Text,Label,Confidence,Submitted At\n';
      const rows = claims.map(c => 
        `${c.id},"${c.claim_text.replace(/"/g, '""')}",${c.label},${c.confidence_pct},${c.submitted_at}`
      ).join('\n');
      
      const csvContent = header + rows;
      const fileName = `HealthGuard_Report_${new Date().toISOString().split('T')[0]}.csv`;
      
      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        const fileUri = FileSystem.cacheDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Error', 'Sharing is not available on this device');
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(t('reports.export_failed'), t('reports.export_error_msg'));
    } finally {
      setIsExporting(false);
    }
  };

  const chartConfig = {
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    color: (opacity = 1) => mode === 'light' ? `rgba(27, 94, 32, ${opacity})` : `rgba(165, 214, 167, ${opacity})`,
    labelColor: (opacity = 1) => colors.neutral[600],
    strokeWidth: 2,
    barPercentage: 0.6,
    decimalPlaces: 0,
    propsForBackgroundLines: {
      strokeDasharray: '4 4',
      stroke: colors.neutral[100],
    },
  };

  const renderClaimItem = ({ item, index }: { item: ClaimRecord; index: number }) => (
    <View style={styles.claimItem}>
      <View style={styles.claimContent}>
        <Text style={[styles.claimText, { color: colors.neutral[800] }]} numberOfLines={2}>{item.claim_text}</Text>
        <View style={styles.claimMeta}>
          <StatusBadge
            variant={item.label === 'ACCURATE' ? 'accurate' : item.label === 'INACCURATE' ? 'inaccurate' : 'uncertain'}
            label={item.label}
            compact
          />
          <Text style={[styles.claimDate, { color: colors.neutral[500] }]}>{getRelativeTime(item.submitted_at, t)}</Text>
        </View>
      </View>
      <View style={styles.claimConfidenceWrap}>
        <Text style={[styles.confidenceVal, { color: colors.primary[900] }]}>{Math.round(item.confidence_pct)}%</Text>
        <Text style={[styles.confidenceLabel, { color: colors.neutral[400] }]}>{t('common.conf') || 'Conf.'}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {!isDesktop && (
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.neutral[100] }]}>
          <Text style={[styles.headerTitle, { color: colors.primary[900] }]}>{t('reports.encounter_log')}</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleExport} disabled={isExporting} style={styles.iconAction}>
              <Icon source="download-outline" size={24} color={colors.primary[900]} />
            </TouchableOpacity>
            <View style={[styles.offlinePill, { backgroundColor: mode === 'light' ? '#E2F0D9' : colors.neutral[100] }]}>
              <Icon source="cloud-check-outline" size={14} color={colors.primary[800]} />
              <Text style={[styles.offlineText, { color: colors.primary[900] }]}>{t('home.offline_ready')}</Text>
            </View>
          </View>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[900]} />}
      >
        <View style={isDesktop ? styles.desktopMain : styles.body}>
          
          {/* ── HEADER WITH EXPORT (Desktop) ── */}
          {isDesktop && (
            <View style={styles.desktopHeaderRow}>
               <View>
                 <Text style={[styles.desktopTitle, { color: colors.neutral[900] }]}>{t('reports.reporting_analytics')}</Text>
                 <Text style={[styles.desktopSub, { color: colors.neutral[500] }]}>{t('reports.monitor_trends')}</Text>
               </View>
               <Button 
                mode="contained" 
                icon="download" 
                onPress={handleExport} 
                loading={isExporting}
                style={{ backgroundColor: colors.primary[900], borderRadius: radii.md }}
               >
                 {t('reports.export_csv')}
               </Button>
            </View>
          )}

          {/* ── QUICK STATS ── */}
          <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.neutral[100] }]}>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: colors.neutral[900] }]}>{stats.total}</Text>
              <Text style={[styles.statLabel, { color: colors.neutral[500] }]}>{t('home.total_checks')}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: colors.primary[700] }]}>{stats.accurate}</Text>
              <Text style={[styles.statLabel, { color: colors.neutral[500] }]}>{t('reports.verified_facts')}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: colors.danger[800] }]}>{stats.misinfo}</Text>
              <Text style={[styles.statLabel, { color: colors.neutral[500] }]}>{t('reports.high_risk_myths')}</Text>
            </View>
          </View>

          {/* ── AI PATTERN INTELLIGENCE (NEW) ── */}
          <Text style={[styles.sectionTitle, { color: colors.neutral[900], marginBottom: spacing.md }]}>🧬 {t('reports.misinfo_pattern')}</Text>
          <View style={styles.patternGrid}>
            {patterns.map((pattern) => (
              <AnimatedCard key={pattern.id} delay={100} style={[styles.patternCard, { backgroundColor: colors.surface }]}>
                <View style={styles.patternHeader}>
                  <View style={[styles.severityDot, { backgroundColor: pattern.severity === 'HIGH' ? colors.danger[900] : colors.warning[900] }]} />
                  <Text style={[styles.patternTheme, { color: colors.neutral[900] }]}>{pattern.theme}</Text>
                  <View style={[styles.countBadge, { backgroundColor: colors.primary[50] }]}>
                    <Text style={[styles.countText, { color: colors.primary[900] }]}>{t('reports.claims_count', { count: pattern.claimsCount })}</Text>
                  </View>
                </View>
                <View style={styles.patternExamples}>
                   {pattern.sampleClaims.map((claim, i) => (
                     <View key={i} style={styles.exampleItem}>
                        <Icon source="format-quote-open" size={14} color={colors.neutral[300]} />
                        <Text style={[styles.exampleText, { color: colors.neutral[600] }]} numberOfLines={1}>"{claim}"</Text>
                     </View>
                   ))}
                </View>
                <View style={styles.patternFooter}>
                   <Text style={[styles.patternStatus, { color: colors.neutral[400] }]}>{t('reports.clustered_by')}</Text>
                </View>
              </AnimatedCard>
            ))}
          </View>

          <View style={styles.intelRow}>
            <AnimatedCard delay={50} style={[styles.intelCard, { backgroundColor: colors.surface, flex: 1 }]}>
               <View style={styles.intelHeader}>
                  <Icon source="map-marker-radius" size={20} color={colors.primary[900]} />
                  <Text style={[styles.intelTitle, { color: colors.neutral[900] }]}>{t('reports.top_zones')}</Text>
               </View>
               <View style={styles.intelList}>
                  <View style={styles.intelItem}>
                     <Text style={[styles.intelName, { color: colors.neutral[700] }]}>Kyotera {t('common.district')}</Text>
                     <Text style={[styles.intelValue, { color: colors.danger[900] }]}>{t('reports.high_status')} (24)</Text>
                  </View>
                  <View style={styles.intelItem}>
                     <Text style={[styles.intelName, { color: colors.neutral[700] }]}>Masaka City</Text>
                     <Text style={[styles.intelValue, { color: colors.warning[900] }]}>{t('reports.med_status')} (12)</Text>
                  </View>
               </View>
            </AnimatedCard>
            
            <AnimatedCard delay={150} style={[styles.intelCard, { backgroundColor: colors.surface, flex: 1 }]}>
               <View style={styles.intelHeader}>
                  <Icon source="alert-decagram" size={20} color={colors.danger[900]} />
                  <Text style={[styles.intelTitle, { color: colors.neutral[900] }]}>{t('reports.risk_severity')}</Text>
               </View>
               <View style={styles.riskBars}>
                  <View style={styles.riskBarItem}>
                     <View style={styles.riskBarLabelRow}>
                        <Text style={styles.riskBarLabel}>{t('reports.high_risk')}</Text>
                        <Text style={styles.riskBarValue}>65%</Text>
                     </View>
                     <View style={[styles.riskBarBg, { backgroundColor: colors.neutral[100] }]}>
                        <View style={[styles.riskBarFill, { width: '65%', backgroundColor: colors.danger[900] }]} />
                     </View>
                  </View>
                  <View style={styles.riskBarItem}>
                     <View style={styles.riskBarLabelRow}>
                        <Text style={styles.riskBarLabel}>{t('reports.medium_risk')}</Text>
                        <Text style={styles.riskBarValue}>25%</Text>
                     </View>
                     <View style={[styles.riskBarBg, { backgroundColor: colors.neutral[100] }]}>
                        <View style={[styles.riskBarFill, { width: '25%', backgroundColor: colors.warning[900] }]} />
                     </View>
                  </View>
               </View>
            </AnimatedCard>
          </View>

          {/* ── GEOSPATIAL HEATMAP (NEW HIGH VALUE) ── */}
          <Text style={[styles.sectionTitle, { color: colors.neutral[900], marginBottom: spacing.md }]}>🛰️ {t('reports.geospatial_heatmap')}</Text>
          <AnimatedCard delay={200} style={[styles.mapCard, { backgroundColor: colors.surface }]}>
             <View style={styles.mapContainer}>
                <View style={[styles.mapPlaceholder, { backgroundColor: colors.neutral[50] }]}>
                   <Icon source="map-outline" size={40} color={colors.neutral[200]} />
                   <Text style={{ color: colors.neutral[300], fontSize: 10, fontWeight: '800' }}>{t('reports.spatial_intel')}</Text>
                   
                   {/* Relative positioning for hotspots on a "Virtual Uganda Map" */}
                   {heatmapData.map((point, idx) => {
                     // Normalize lat/lng to 0-100 range for SVG-like placement
                     const top = (1 - (point.latitude - (-1.5)) / (4.2 - (-1.5))) * 100;
                     const left = ((point.longitude - 29.5) / (35.0 - 29.5)) * 100;
                     const size = 20 + (point.weight * 5);
                     
                     return (
                       <View 
                        key={idx} 
                        style={[
                          styles.hotspot, 
                          { 
                            top: `${top}%`, 
                            left: `${left}%`, 
                            width: size, 
                            height: size, 
                            borderRadius: size/2,
                            backgroundColor: point.type === 'EBOLA' ? colors.danger[900] + '80' : point.type === 'VACCINE' ? colors.primary[900] + '80' : colors.warning[900] + '80'
                          }
                        ]}
                       >
                         <View style={[styles.hotspotCore, { width: size/2, height: size/2, borderRadius: size/4, backgroundColor: '#FFF' }]} />
                       </View>
                     );
                   })}
                </View>
                
                <View style={styles.mapLegend}>
                   <Text style={[styles.legendTitle, { color: colors.neutral[900] }]}>{t('reports.spatial_risk_keys')}</Text>
                   <View style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: colors.danger[900] }]} />
                      <Text style={styles.legendText}>{t('reports.ebola_rumors')}</Text>
                   </View>
                   <View style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: colors.primary[900] }]} />
                      <Text style={styles.legendText}>{t('reports.vaccine_hesitancy')}</Text>
                   </View>
                   <View style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: colors.warning[900] }]} />
                      <Text style={styles.legendText}>{t('reports.general_myths')}</Text>
                   </View>
                </View>
             </View>
             
              <View style={styles.mapFooter}>
                <Icon source="satellite-variant" size={16} color={colors.primary[900]} />
                <Text style={styles.mapFooterText}>{t('reports.last_spatial_sync', { date: new Date().toLocaleDateString() })}</Text>
              </View>
          </AnimatedCard>

          <View style={isDesktop ? styles.desktopGrid : null}>
            {/* ── CHART ── */}
            <AnimatedCard delay={100} style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.neutral[100] }, isDesktop ? styles.desktopGridItem : ({} as any)]}>
              <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>{t('reports.weekly_trends')}</Text>
              {stats.total > 0 ? (
                <BarChart
                  data={{
                    labels: ['Accurate', 'Myths', 'Uncertain'],
                    datasets: [{ data: [stats.accurate, stats.misinfo, Math.max(0, stats.total - stats.accurate - stats.misinfo)] }]
                  }}
                  width={isDesktop ? (width > 1200 ? 550 : width * 0.45) : width - 64}
                  height={250}
                  chartConfig={chartConfig}
                  style={styles.chart}
                  fromZero
                  showBarTops={false}
                  yAxisLabel=""
                  yAxisSuffix=""
                />
              ) : (
                <View style={styles.chartEmpty}>
                  <Icon source="chart-line-variant" size={40} color={colors.neutral[200]} />
                  <Text style={[styles.chartEmptyText, { color: colors.neutral[400] }]}>{t('reports.no_data')}</Text>
                </View>
              )}
            </AnimatedCard>

            {/* ── LIST ── */}
            <View style={[isDesktop ? styles.desktopGridItem : ({} as any)]}>
              <Text style={[styles.sectionTitle, { color: colors.neutral[900], marginBottom: spacing.md }]}>{t('reports.recent_checks')}</Text>
              {claims.length === 0 ? (
                <EmptyState
                  icon="clipboard-text-off-outline"
                  title={t('reports.no_encounters')}
                  subtitle={t('reports.no_encounters_sub')}
                />
              ) : (
                <View style={[styles.logList, { backgroundColor: colors.surface, borderColor: colors.neutral[100] }]}>
                  {claims.map((item, idx) => (
                    <React.Fragment key={item.id}>
                      {renderClaimItem({ item, index: idx })}
                      {idx < claims.length - 1 && <Divider style={[styles.divider, { backgroundColor: colors.neutral[100] }]} />}
                    </React.Fragment>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.spacer} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconAction: {
    padding: 5,
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  offlineText: {
    fontSize: 12,
    fontWeight: '600',
  },
  body: {
    padding: spacing.md,
  },
  desktopMain: {
    width: '100%',
    padding: '5%',
  },
  desktopHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  desktopTitle: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 4,
  },
  desktopSub: {
    fontSize: 18,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: radii.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.md,
    borderWidth: 1,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 32,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  desktopGrid: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  desktopGridItem: {
    flex: 1,
  },
  chartCard: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.sm,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  chart: {
    borderRadius: radii.md,
    marginVertical: 8,
  },
  chartEmpty: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  chartEmptyText: {
    fontSize: 14,
  },
  logList: {
    borderRadius: radii.lg,
    ...shadows.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  claimItem: {
    flexDirection: 'row',
    padding: spacing.lg,
    alignItems: 'center',
  },
  claimContent: {
    flex: 1,
  },
  claimText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 8,
  },
  claimMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  claimDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  claimConfidenceWrap: {
    alignItems: 'flex-end',
    paddingLeft: spacing.lg,
  },
  confidenceVal: {
    fontSize: 20,
    fontWeight: '800',
  },
  confidenceLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
  },
  spacer: {
    height: spacing.xxl,
  },
  // Intelligence Section
  intelRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  intelCard: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  intelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  intelTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  intelList: {
    gap: 10,
  },
  intelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  intelName: {
    fontSize: 13,
    fontWeight: '600',
  },
  intelValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  riskBars: {
    gap: 12,
  },
  riskBarItem: {
    width: '100%',
  },
  riskBarLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  riskBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  riskBarValue: {
    fontSize: 11,
    fontWeight: '800',
  },
  riskBarBg: {
    height: 4,
    borderRadius: 2,
  },
  riskBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  // Pattern Intelligence Styles
  patternGrid: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  patternCard: {
    padding: spacing.lg,
    borderRadius: radii.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: 8,
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  patternTheme: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
  },
  patternExamples: {
    backgroundColor: '#F8F9FA',
    padding: spacing.md,
    borderRadius: radii.sm,
    gap: 6,
    marginBottom: spacing.sm,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exampleText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  patternFooter: {
    alignItems: 'flex-end',
  },
  patternStatus: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  // Map Styles
  mapCard: {
    padding: spacing.xl,
    borderRadius: radii.lg,
    marginBottom: spacing.xxl,
    ...shadows.md,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  mapContainer: {
    flexDirection: 'row',
    height: 350,
    gap: 20,
  },
  mapPlaceholder: {
    flex: 2,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  mapLegend: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 15,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  hotspot: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotspotCore: {
    opacity: 0.8,
  },
  mapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  mapFooterText: {
    fontSize: 11,
    color: '#888',
    fontWeight: '700',
  },
});

export default ReportsScreen;
