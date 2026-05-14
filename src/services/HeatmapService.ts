import { getAllClaims, ClaimRecord } from '../db/Database';

export interface MapPoint {
  latitude: number;
  longitude: number;
  weight: number; // misinformation density
  label: string;
  type: 'EBOLA' | 'VACCINE' | 'MALARIA' | 'GENERAL';
}

const DISTRICT_COORDS: Record<string, { lat: number, lng: number }> = {
  'Kampala': { lat: 0.3476, lng: 32.5825 },
  'Wakiso': { lat: 0.3951, lng: 32.4468 },
  'Gulu': { lat: 2.7720, lng: 32.2881 },
  'Mbarara': { lat: -0.6074, lng: 30.6545 },
  'Jinja': { lat: 0.4479, lng: 33.2032 },
  'Mbale': { lat: 1.0785, lng: 34.1748 },
  'Arua': { lat: 3.0303, lng: 30.9073 }
};

export class HeatmapService {
  /**
   * Aggregates misinformation encounters into geospatial heatmap data.
   */
  public static async generateHeatmapData(): Promise<MapPoint[]> {
    try {
      const claims = await getAllClaims();
      const misinfo = claims.filter(c => c.label === 'INACCURATE');

      if (misinfo.length < 5) {
        return this.getSimulatedHeatmap();
      }

      const hotspots: Record<string, MapPoint> = {};

      misinfo.forEach(c => {
        const region = c.location_note || 'Kampala';
        const coords = DISTRICT_COORDS[region] || DISTRICT_COORDS['Kampala'];
        const type = this.detectType(c.claim_text);
        
        const key = `${region}-${type}`;
        if (!hotspots[key]) {
          hotspots[key] = {
            latitude: coords.lat,
            longitude: coords.lng,
            weight: 0,
            label: region,
            type: type
          };
        }
        hotspots[key].weight += 1;
      });

      return Object.values(hotspots);
    } catch (error) {
      console.error('Heatmap Error:', error);
      return this.getSimulatedHeatmap();
    }
  }

  private static detectType(text: string): 'EBOLA' | 'VACCINE' | 'MALARIA' | 'GENERAL' {
    const t = text.toLowerCase();
    if (t.includes('ebola')) return 'EBOLA';
    if (t.includes('vaccine') || t.includes('polio')) return 'VACCINE';
    if (t.includes('malaria')) return 'MALARIA';
    return 'GENERAL';
  }

  private static getSimulatedHeatmap(): MapPoint[] {
    return [
      { latitude: 0.3951, longitude: 32.4468, weight: 8, label: 'Wakiso', type: 'EBOLA' },
      { latitude: 0.3476, longitude: 32.5825, weight: 12, label: 'Kampala', type: 'VACCINE' },
      { latitude: 2.7720, longitude: 32.2881, weight: 6, label: 'Gulu', type: 'MALARIA' },
      { latitude: -0.6074, longitude: 30.6545, weight: 4, label: 'Mbarara', type: 'GENERAL' },
      { latitude: 1.0785, longitude: 34.1748, weight: 5, label: 'Mbale', type: 'EBOLA' },
    ];
  }
}
