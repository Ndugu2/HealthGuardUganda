import { Platform } from 'react-native';
import { getAllClaims, saveKnowledge } from '../db/Database';
import { AuthService } from './AuthService';
import { ConnectivityService } from './ConnectivityService';

const API_URL = Platform.OS === 'web' ? 'http://localhost:3000/api' : 'http://10.136.128.21:3000/api';

export class SyncService {
  /**
   * Pushes all local claims to the National Backend.
   * Only authenticated health workers can sync data.
   */
  public static async pushEncounters(): Promise<{ success: boolean; count?: number; error?: string }> {
    const session = await AuthService.getSession();
    if (!session) return { success: false, error: 'User not authenticated' };

    const claims = await getAllClaims();
    if (claims.length === 0) return { success: true, count: 0 };

    try {
      const signal = await ConnectivityService.getSignalStrength();
      
      // Use Compressed Packet Strategy for LOW connectivity
      const isLowBandwidth = signal === 'LOW';
      const payload = isLowBandwidth 
        ? { c: ConnectivityService.compress(claims), mode: 'LOW_BANDWIDTH' }
        : { 
            encounters: claims.map(c => ({
              claimText: c.claim_text,
              label: c.label,
              confidencePct: c.confidence_pct,
              locationNote: c.location_note,
              submittedAt: c.submitted_at,
            })),
            mode: 'FULL'
          };

      const response = await fetch(`${API_URL}/sync/encounters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        return { success: true, count: data.count };
      } else {
        return { success: false, error: data.error || 'Sync failed' };
      }
    } catch (error: any) {
      return { success: false, error: 'Connection error' };
    }
  }

  /**
   * Pulls latest knowledge base items from the backend.
   * In the Hybrid Architecture, we offload persistence to the native engine.
   */
  public static async pullKnowledge(): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const response = await fetch(`${API_URL}/sync/knowledge`);
      const items = await response.json();

      if (Array.isArray(items)) {
        await saveKnowledge(items);
        console.log('Knowledge base synced from server:', items.length, 'items');
        return { success: true, count: items.length };
      } else {
        return { success: false, error: 'Invalid data format from server' };
      }
    } catch (error: any) {
      return { success: false, error: 'Connection error' };
    }
  }

  /**
   * Seeds the local database from the bundled knowledge base JSON.
   * Used as a fallback when the server is unreachable or on first run.
   */
  public static async seedLocalKnowledge(): Promise<void> {
    try {
      const localData = require('../db/knowledge_base.json');
      if (Array.isArray(localData)) {
        await saveKnowledge(localData);
        console.log('Knowledge base seeded from local bundle:', localData.length, 'items');
      }
    } catch (error) {
      console.error('Failed to seed local knowledge:', error);
    }
  }
}
