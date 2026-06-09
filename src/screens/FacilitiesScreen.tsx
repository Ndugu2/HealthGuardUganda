import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  Platform,
  useWindowDimensions,
  TextInput,
} from 'react-native';
import { Text, Icon, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { getAllFacilities, Facility } from '../db/Database';
import { LocationService } from '../services/LocationService';
import { useAppTheme } from '../ThemeContext';
import { spacing, radii, shadows, gradients } from '../theme';
import { useResponsive, typography , rf } from '../responsive';
import AnimatedCard from '../components/AnimatedCard';
import GoogleMapView from '../components/GoogleMapView';

const FACILITY_ICONS: Record<string, string> = {
  'Hospital':        'hospital-building',
  'Health Center':   'medical-bag',
  'Clinic':          'stethoscope',
  'Pharmacy':        'pill',
  'Dispensary':      'hospital-box-outline',
  'default':         'hospital-marker',
};

const getFacilityIcon = (type: string): string => {
  for (const key of Object.keys(FACILITY_ICONS)) {
    if (type?.toLowerCase().includes(key.toLowerCase())) return FACILITY_ICONS[key];
  }
  return FACILITY_ICONS.default;
};

const FacilitiesScreen = () => {
  const { t } = useTranslation();
  const { colors, mode } = useAppTheme();
  const { isPhone, isTablet, isDesktop, hPad, heroHeight, rf, bp, width, height } = useResponsive();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [filtered, setFiltered] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(null);
  const [userLoc] = useState({ lat: 0.3476, lon: 32.5825 }); // Kampala centre

  const loadFacilities = useCallback(async () => {
    const data = await getAllFacilities();
    const sorted = data.sort((a, b) => {
      const distA = LocationService.getAirDistance(userLoc.lat, userLoc.lon, a.latitude, a.longitude);
      const distB = LocationService.getAirDistance(userLoc.lat, userLoc.lon, b.latitude, b.longitude);
      return distA - distB;
    });
    setFacilities(sorted);
    setFiltered(sorted);
    setLoading(false);
  }, [userLoc.lat, userLoc.lon]);

  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(facilities);
    } else {
      const q = search.toLowerCase();
      setFiltered(facilities.filter(f => {
        const translatedType = f.type ? t('facilities.types.' + f.type, { defaultValue: f.type }).toLowerCase() : '';
        return (
          f.name.toLowerCase().includes(q) ||
          f.type?.toLowerCase().includes(q) ||
          translatedType.includes(q)
        );
      }));
    }
  }, [search, facilities, t]);

  const handleCall = (phone: string) => Linking.openURL(`tel:${phone}`);

  const handleNavigate = (facility: Facility) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${facility.name}@${facility.latitude},${facility.longitude}`,
      android: `geo:0,0?q=${facility.latitude},${facility.longitude}(${facility.name})`,
      web: `https://www.google.com/maps/search/?api=1&query=${facility.latitude},${facility.longitude}`,
    });
    if (url) Linking.openURL(url);
  };

  const renderItem = ({ item, index }: { item: Facility; index: number }) => {
    const distance = LocationService.getAirDistance(userLoc.lat, userLoc.lon, item.latitude, item.longitude);
    const icon = getFacilityIcon(item.type || '');
    const isNear = distance < 5;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setSelectedFacilityId(item.id)}
      >
        <AnimatedCard
          delay={index * 60}
          style={[
            styles.card,
            { backgroundColor: colors.surface },
            isDesktop ? styles.desktopCard : {},
            selectedFacilityId === item.id ? { borderWidth: 2, borderColor: '#2C5E3E' } : {},
          ]}
        >
          {/* Card Top */}
          <View style={styles.cardTop}>
            <View style={[styles.iconCircle, { backgroundColor: selectedFacilityId === item.id ? '#E2F0D9' : colors.primary[50] }]}>
              <Icon source={icon} size={26} color={colors.primary[900]} />
            </View>
            <View style={styles.cardMeta}>
              <Text style={[styles.facilityName, { color: colors.neutral[900] }]}>
                {item.name}
              </Text>
              <View style={styles.typeBadgeRow}>
                <View style={[styles.typeBadge, { backgroundColor: colors.neutral[100] }]}>
                  <Text style={[styles.typeText, { color: colors.neutral[600] }]}>
                    {item.type ? t('facilities.types.' + item.type, { defaultValue: item.type }) : t('facilities.facility')}
                  </Text>
                </View>
                {isNear && (
                  <View style={[styles.nearBadge, { backgroundColor: colors.primary[50] }]}>
                    <Icon source="map-marker-check" size={12} color={colors.primary[900]} />
                    <Text style={[styles.nearText, { color: colors.primary[900] }]}>
                      {t('facilities.nearby')}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={[styles.distanceBadge, { backgroundColor: selectedFacilityId === item.id ? '#2C5E3E' : colors.primary[900] }]}>
              <Text style={styles.distanceNum}>{distance.toFixed(1)}</Text>
              <Text style={styles.distanceUnit}>km</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.neutral[100] }]} />

          {/* Actions */}
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.callBtn, { borderColor: colors.primary[900] }]}
              onPress={() => handleCall(item.contact)}
            >
              <Icon source="phone-outline" size={18} color={colors.primary[900]} />
              <Text style={[styles.callBtnText, { color: colors.primary[900] }]}>
                {t('facilities.call')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: '#2C5E3E' }]}
              onPress={() => handleNavigate(item)}
            >
              <Icon source="navigation" size={18} color="#FFF" />
              <Text style={styles.navBtnText}>{t('facilities.navigate')}</Text>
            </TouchableOpacity>
          </View>
        </AnimatedCard>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── HEADER ── */}
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>{t('facilities.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('facilities.subtitle')}</Text>
          </View>
          <View style={styles.headerBadge}>
            <Icon source="crosshairs-gps" size={18} color="#FFF" />
            <Text style={styles.headerBadgeText}>GPS</Text>
          </View>
        </View>

        {/* ── SEARCH BAR ── */}
        <View style={[styles.searchBar, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <Icon source="magnify" size={20} color="rgba(255,255,255,0.8)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('facilities.search_placeholder') || 'Search facilities…'}
            placeholderTextColor="rgba(255,255,255,0.6)"
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon source="close-circle" size={18} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          )}
        </View>

        {/* Summary pill */}
        {!loading && (
          <View style={styles.summaryPill}>
            <Icon source="hospital-marker" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={styles.summaryText}>
              {filtered.length} {t('facilities.facilities_found') || 'facilities found near you'}
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* ── CONTENT ── */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator animating size="large" color={colors.primary[900]} />
          <Text style={[styles.loadingText, { color: colors.neutral[500] }]}>
            {t('facilities.loading') || 'Finding nearby facilities…'}
          </Text>
        </View>
      ) : isDesktop ? (
        /* ── DESKTOP: Split Screen (List + Map) ── */
        <View style={styles.splitLayout}>
          {/* Left: Scrollable List */}
          <View style={styles.splitListCol}>
            <FlatList
              data={filtered}
              renderItem={renderItem}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.splitListContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Icon source="hospital-off" size={48} color={colors.neutral[200]} />
                  <Text style={[styles.emptyTitle, { color: colors.neutral[600] }]}>
                    {t('facilities.no_facilities')}
                  </Text>
                  <Text style={[styles.emptySub, { color: colors.neutral[400] }]}>
                    {t('facilities.no_facilities_sub') || 'Try a different search term.'}
                  </Text>
                </View>
              }
            />
          </View>

          {/* Right: Google Map */}
          <View style={styles.splitMapCol}>
            <GoogleMapView
              latitude={userLoc.lat}
              longitude={userLoc.lon}
              zoom={13}
              selectedMarkerId={selectedFacilityId}
              markers={filtered.map(f => ({
                id: f.id,
                name: f.name,
                latitude: f.latitude,
                longitude: f.longitude,
                type: f.type,
              }))}
              height="100%"
            />
          </View>
        </View>
      ) : (
        /* ── MOBILE: List only ── */
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <GoogleMapView
              latitude={userLoc.lat}
              longitude={userLoc.lon}
              zoom={13}
              selectedMarkerId={selectedFacilityId}
              markers={filtered.slice(0, 5).map(f => ({
                id: f.id,
                name: f.name,
                latitude: f.latitude,
                longitude: f.longitude,
                type: f.type,
              }))}
              onMarkerPress={(m) => setSelectedFacilityId(m.id)}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Icon source="hospital-off" size={48} color={colors.neutral[200]} />
              <Text style={[styles.emptyTitle, { color: colors.neutral[600] }]}>
                {t('facilities.no_facilities')}
              </Text>
              <Text style={[styles.emptySub, { color: colors.neutral[400] }]}>
                {t('facilities.no_facilities_sub') || 'Try a different search term.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header
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
  headerTitle: {
    fontSize: rf(20),
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginTop: 2,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
  },
  headerBadgeText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 12,
  },
  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: radii.full,
    gap: 10,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFF',
    fontWeight: '500',
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  summaryText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  // Loading
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // List
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  desktopList: {
    paddingHorizontal: '5%',
  },
  // Split Layout (Desktop)
  splitLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  splitListCol: {
    flex: 0.42,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.06)',
  },
  splitListContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  splitMapCol: {
    flex: 0.58,
  },
  // Card
  card: {
    borderRadius: radii.xl,
    marginBottom: spacing.md,
    borderWidth: 0,
    ...shadows.sm,
    overflow: 'hidden',
  },
  desktopCard: {
    flex: 1,
    marginHorizontal: spacing.sm,
    maxWidth: '50%',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMeta: {
    flex: 1,
    gap: 6,
  },
  facilityName: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  nearBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  nearText: {
    fontSize: 10,
    fontWeight: '800',
  },
  distanceBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 52,
  },
  distanceNum: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 20,
  },
  distanceUnit: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginHorizontal: spacing.lg,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: radii.full,
    borderWidth: 1.5,
    gap: 8,
  },
  callBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  navBtn: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: radii.full,
    gap: 8,
    ...shadows.md,
  },
  navBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  // Empty
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default FacilitiesScreen;
