import React from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity, Linking } from 'react-native';
import { Icon } from 'react-native-paper';
import { radii, shadows, spacing } from '../theme';
import { useAppTheme } from '../ThemeContext';

interface Marker {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  type?: string;
}

interface GoogleMapViewProps {
  /** Center latitude */
  latitude: number;
  /** Center longitude */
  longitude: number;
  /** Zoom level (1-20) */
  zoom?: number;
  /** Optional markers to display */
  markers?: Marker[];
  /** Selected marker ID */
  selectedMarkerId?: number | null;
  /** Callback when a marker is tapped (mobile fallback only) */
  onMarkerPress?: (marker: Marker) => void;
  /** Height of the map container */
  height?: number | string;
}

/**
 * A cross-platform Google Map component.
 * - On Web: Renders an embedded Google Maps iframe (no API key required).
 * - On Mobile: Renders a styled fallback card with a button to open the native Maps app.
 */
const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  latitude,
  longitude,
  zoom = 14,
  markers = [],
  selectedMarkerId,
  onMarkerPress,
  height = 500,
}) => {
  const { colors, mode } = useAppTheme();

  // Build the Google Maps embed URL
  // If a specific marker is selected, center on it
  const selected = markers.find(m => m.id === selectedMarkerId);
  const centerLat = selected ? selected.latitude : latitude;
  const centerLon = selected ? selected.longitude : longitude;
  const query = selected ? `${selected.name}` : `${centerLat},${centerLon}`;

  // Use Google Maps embed (free, no API key needed)
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&ll=${centerLat},${centerLon}&z=${zoom}&output=embed`;

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { height: height as any }]}>
        {/* Map Header */}
        <View style={[styles.mapHeader, { backgroundColor: colors.surface }]}>
          <View style={styles.mapHeaderLeft}>
            <View style={[styles.liveIndicator, { backgroundColor: '#E2F0D9' }]}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE MAP</Text>
            </View>
            {selected && (
              <Text style={[styles.selectedName, { color: colors.neutral[900] }]} numberOfLines={1}>
                {selected.name}
              </Text>
            )}
          </View>
          <View style={styles.mapHeaderRight}>
            <TouchableOpacity
              style={[styles.openExternalBtn, { backgroundColor: colors.neutral[50] }]}
              onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${centerLat},${centerLon}`)}
            >
              <Icon source="open-in-new" size={14} color={colors.primary[900]} />
              <Text style={[styles.openExternalText, { color: colors.primary[900] }]}>Open in Maps</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Map iframe */}
        <View style={[styles.iframeWrap, { backgroundColor: colors.neutral[100] }]}>
          <iframe
            src={mapUrl}
            width="100%"
            height="100%"
            style={{ border: 0, borderRadius: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Health Facility Map"
          />
        </View>

        {/* Map Footer */}
        {selected && (
          <View style={[styles.mapFooter, { backgroundColor: colors.surface, borderTopColor: colors.neutral[100] }]}>
            <View style={[styles.footerIconCircle, { backgroundColor: '#E2F0D9' }]}>
              <Icon source="hospital-building" size={18} color="#2C5E3E" />
            </View>
            <View style={styles.footerInfo}>
              <Text style={[styles.footerName, { color: colors.neutral[900] }]}>{selected.name}</Text>
              <Text style={[styles.footerType, { color: colors.neutral[500] }]}>{selected.type || 'Health Facility'}</Text>
            </View>
            <TouchableOpacity
              style={[styles.footerNavBtn, { backgroundColor: '#2C5E3E' }]}
              onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`)}
            >
              <Icon source="navigation" size={16} color="#FFF" />
              <Text style={styles.footerNavText}>Directions</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // Mobile fallback: styled card encouraging native maps
  return (
    <View style={[styles.mobileCard, { backgroundColor: colors.surface, ...shadows.sm }]}>
      <View style={[styles.mobileMapPlaceholder, { backgroundColor: colors.neutral[50] }]}>
        <Icon source="map-marker-radius" size={48} color={colors.primary[900]} />
        <Text style={[styles.mobileMapTitle, { color: colors.neutral[900] }]}>
          Map View
        </Text>
        <Text style={[styles.mobileMapSub, { color: colors.neutral[500] }]}>
          Tap a facility card, then use "Navigate" to open in your device's Maps app.
        </Text>
      </View>
      {markers.length > 0 && (
        <View style={styles.mobileMarkerList}>
          <Text style={[styles.mobileMarkersTitle, { color: colors.neutral[600] }]}>
            NEARBY ({markers.length})
          </Text>
          {markers.slice(0, 3).map(m => (
            <TouchableOpacity
              key={m.id}
              style={[styles.mobileMarkerItem, { borderBottomColor: colors.neutral[100] }]}
              onPress={() => onMarkerPress?.(m)}
            >
              <Icon source="hospital-marker" size={18} color={colors.primary[900]} />
              <Text style={[styles.mobileMarkerName, { color: colors.neutral[800] }]} numberOfLines={1}>
                {m.name}
              </Text>
              <Icon source="chevron-right" size={16} color={colors.neutral[400]} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  // Map Header
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mapHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2C5E3E',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2C5E3E',
    letterSpacing: 0.5,
  },
  selectedName: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  mapHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  openExternalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  openExternalText: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Iframe
  iframeWrap: {
    flex: 1,
    minHeight: 350,
  },
  // Map Footer
  mapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  footerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerInfo: {
    flex: 1,
  },
  footerName: {
    fontSize: 14,
    fontWeight: '800',
  },
  footerType: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  footerNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.full,
  },
  footerNavText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  // Mobile fallback
  mobileCard: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  mobileMapPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  mobileMapTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  mobileMapSub: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 20,
  },
  mobileMarkerList: {
    padding: spacing.md,
  },
  mobileMarkersTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  mobileMarkerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  mobileMarkerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default GoogleMapView;
