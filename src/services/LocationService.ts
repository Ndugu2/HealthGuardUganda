import { Facility } from '../db/Database';

const ORS_API_URL = 'https://api.openrouteservice.org';

export interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: string; // polyline
}

export class LocationService {
  /**
   * Calculates the distance and duration to a facility using ORS.
   */
  public static async getRouteToFacility(startLat: number, startLon: number, facility: Facility): Promise<RouteInfo | null> {
    try {
      const apiKey = localStorage.getItem('ors_api_key');
      if (!apiKey) throw new Error('ORS Key missing');

      const response = await fetch(`${ORS_API_URL}/v2/directions/driving-car?api_key=${apiKey}&start=${startLon},${startLat}&end=${facility.longitude},${facility.latitude}`);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        return {
          distance: feature.properties.summary.distance,
          duration: feature.properties.summary.duration,
          geometry: feature.geometry
        };
      }
      return null;
    } catch (error) {
      console.error('ORS Route Error:', error);
      return null;
    }
  }

  /**
   * Simple haversine distance for local sorting before hitting the API.
   */
  public static getAirDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
