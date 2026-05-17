import { Platform } from 'react-native';

const API_URL = Platform.OS === 'web'
  ? 'http://localhost:3000'
  : 'http://10.0.2.2:3000';

export interface SyncPacket {
  id: string;
  t: string; // text
  l: string; // label
  c: number; // confidence
  ts: string; // timestamp
}

// ─── Cached connectivity state ───────────────────────────────────────────────
let _lastKnownOnline: boolean = false;
let _lastCheckTimestamp: number = 0;
const CACHE_TTL_MS = 5000; // re-check at most every 5 seconds

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
   * Checks if the device has basic internet access.
   * Uses navigator.onLine (Web) or a lightweight ping to the backend.
   */
  public static async isOnline(): Promise<boolean> {
    const now = Date.now();
    if (now - _lastCheckTimestamp < CACHE_TTL_MS) {
      return _lastKnownOnline;
    }

    try {
      // Platform-specific basic online check
      if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
        if (!navigator.onLine) {
          _lastKnownOnline = false;
          _lastCheckTimestamp = now;
          return false;
        }
      }

      // Lightweight ping to our own backend to confirm real reachability
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      _lastKnownOnline = response.ok;
      _lastCheckTimestamp = now;
      return response.ok;
    } catch (error) {
      _lastKnownOnline = false;
      _lastCheckTimestamp = now;
      return false;
    }
  }

  /**
   * Returns real signal strength based on backend response latency.
   *  - < 500ms  → HIGH
   *  - < 2000ms → MEDIUM
   *  - > 2000ms or offline → LOW
   */
  public static async getSignalStrength(): Promise<'LOW' | 'MEDIUM' | 'HIGH'> {
    try {
      // Quick browser offline check
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !navigator.onLine) {
        return 'LOW';
      }

      const start = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) return 'LOW';

      const latency = Date.now() - start;
      if (latency < 500) return 'HIGH';
      if (latency < 2000) return 'MEDIUM';
      return 'LOW';
    } catch (error) {
      return 'LOW';
    }
  }

  /**
   * Subscribes to online/offline events on the web platform.
   * Returns an unsubscribe function.
   */
  public static subscribeToConnectivityChanges(
    onChange: (isOnline: boolean) => void
  ): () => void {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOnline = () => {
        _lastKnownOnline = true;
        _lastCheckTimestamp = Date.now();
        onChange(true);
      };
      const handleOffline = () => {
        _lastKnownOnline = false;
        _lastCheckTimestamp = Date.now();
        onChange(false);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    // For native platforms, poll every 10 seconds
    const intervalId = setInterval(async () => {
      const online = await ConnectivityService.isOnline();
      onChange(online);
    }, 10000);

    return () => clearInterval(intervalId);
  }
}
