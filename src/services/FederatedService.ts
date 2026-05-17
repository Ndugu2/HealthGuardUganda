import { Platform } from 'react-native';
import { MLModel } from '../ai/MLModel';

export interface FederatedPayload {
  deviceId: string;
  weightDeltas: any;
  timestamp: string;
}

const API_BASE = Platform.OS === 'web' ? 'http://localhost:3000/api' : 'http://10.0.2.2:3000/api';
const FED_API = `${API_BASE}/v1/federated`;

export class FederatedService {
  private static model = new MLModel();

  /**
   * Pushes local model weight updates to the central aggregator.
   * This is "Privacy-Preserving" as it never sends the raw claim text.
   */
  public static async pushModelUpdates(): Promise<{ success: boolean; error?: string }> {
    try {
      const weights = this.model.exportWeights();
      const payload: FederatedPayload = {
        deviceId: 'UG-CHW-' + Math.random().toString(36).substring(7).toUpperCase(),
        weightDeltas: weights,
        timestamp: new Date().toISOString()
      };

      console.log('FederatedSync: Pushing weight updates to central node...');
      
      const response = await fetch(`${FED_API}/aggregate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Aggregation failed');
      
      return { success: true };
    } catch (e: any) {
      console.error('FederatedSync Error:', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Pulls the "Global Aggregated Model" from the server.
   */
  public static async pullGlobalModel(): Promise<{ success: boolean; model?: any; error?: string }> {
    try {
      const response = await fetch(`${FED_API}/global-model`);
      if (!response.ok) throw new Error('Could not fetch global model');
      
      const data = await response.json();
      this.model.importWeights(data.model);
      
      return { success: true, model: data.model };
    } catch (e: any) {
      console.error('FederatedSync Error:', e);
      return { success: false, error: e.message };
    }
  }
}
