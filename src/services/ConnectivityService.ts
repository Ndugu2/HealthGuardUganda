import { NativeModules, Platform } from 'react-native';

export interface SyncPacket {
  id: string;
  t: string; // text
  l: string; // label
  c: number; // confidence
  ts: string; // timestamp
}

export class ConnectivityService {
  /**
   * Compresses data for ultra-low bandwidth sync.
   * Maps long keys to single characters to save bytes.
   */
  public static compress(records: any[]): SyncPacket[] {
    return records.map(r => ({
      id: r.id,
      t: r.claim_text,
      l: r.label === 'INACCURATE' ? 'I' : 'A',
      c: Math.round(r.confidence_pct),
      ts: new Date(r.submitted_at).getTime().toString(36) // Base36 timestamp
    }));
  }

  /**
   * SMS Fallback Strategy:
   * Used for high-risk misinformation when data/GPRS is unavailable.
   */
  public static async sendSMSAlert(claim: string, label: string): Promise<boolean> {
    const message = `HG_ALERT|${label}|${claim.substring(0, 100)}`;
    
    console.log(`[ConnectivityService] SMS Fallback Triggered: To +256700000000 -> ${message}`);
    
    // In a real app, we'd use Expo SMS or a native module
    // return await SMS.sendSMSAsync(['+256700000000'], message);
    
    return true;
  }

  /**
   * Simulates a "Lazy Sync Queue" that waits for strong signal.
   */
  public static async getSignalStrength(): Promise<'LOW' | 'MEDIUM' | 'HIGH'> {
    // Mock signal detection
    const rand = Math.random();
    if (rand < 0.3) return 'LOW';
    if (rand < 0.7) return 'MEDIUM';
    return 'HIGH';
  }
}
