import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Linking,
  Platform,
  useWindowDimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { getAllFacilities, Facility } from '../db/Database';
import { LocationService } from '../services/LocationService';

const FacilitiesScreen = () => {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isDesktop = width > 800;

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLoc] = useState({ lat: 0.3476, lon: 32.5825 }); // Mock current loc (Kampala center)

  useEffect(() => {
    loadFacilities();
  }, []);

  const loadFacilities = async () => {
    const data = await getAllFacilities();
    // Sort by air distance first
    const sorted = data.sort((a, b) => {
      const distA = LocationService.getAirDistance(userLoc.lat, userLoc.lon, a.latitude, a.longitude);
      const distB = LocationService.getAirDistance(userLoc.lat, userLoc.lon, b.latitude, b.longitude);
      return distA - distB;
    });
    setFacilities(sorted);
    setLoading(false);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleNavigate = (facility: Facility) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${facility.name}@${facility.latitude},${facility.longitude}`,
      android: `geo:0,0?q=${facility.latitude},${facility.longitude}(${facility.name})`,
      web: `https://www.google.com/maps/search/?api=1&query=${facility.latitude},${facility.longitude}`
    });
    if (url) Linking.openURL(url);
  };

  const renderItem = ({ item }: { item: Facility }) => {
    const distance = LocationService.getAirDistance(userLoc.lat, userLoc.lon, item.latitude, item.longitude);

    return (
      <View style={[styles.card, isDesktop && styles.desktopCard]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.facilityName}>{item.name}</Text>
            <Text style={styles.facilityType}>{item.type}</Text>
          </View>
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{t('facilities.km_away', { distance: distance.toFixed(1) })}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleCall(item.contact)}
          >
            <Icon source="phone" size={20} color="#006400" />
            <Text style={styles.actionText}>{t('facilities.call')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryAction]} 
            onPress={() => handleNavigate(item)}
          >
            <Icon source="navigation" size={20} color="#FFF" />
            <Text style={[styles.actionText, { color: '#FFF' }]}>{t('facilities.navigate')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#006400', '#004d00']} style={styles.header}>
        <Text style={styles.headerTitle}>{t('facilities.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('facilities.subtitle')}</Text>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color="#006400" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={facilities}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={[styles.list, isDesktop && styles.desktopList]}
          numColumns={isDesktop ? 2 : 1}
          key={isDesktop ? 'desktop' : 'mobile'}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{t('facilities.no_facilities')}</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { padding: 30, paddingTop: 60, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  list: { padding: 20 },
  desktopList: { paddingHorizontal: '5%' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  desktopCard: {
    flex: 1,
    marginHorizontal: 10,
    maxWidth: '50%',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  facilityName: { fontSize: 18, fontWeight: 'bold', color: '#333', maxWidth: '75%' },
  facilityType: { fontSize: 14, color: '#666', marginTop: 4 },
  distanceBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  distanceText: { color: '#2E7D32', fontWeight: 'bold', fontSize: 12 },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },
  cardActions: { flexDirection: 'row', gap: 10 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#006400',
    gap: 8,
  },
  primaryAction: { backgroundColor: '#006400' },
  actionText: { fontWeight: 'bold', color: '#006400' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' }
});

export default FacilitiesScreen;
