import { MLModel } from '../ai/MLModel';

export interface FederatedPayload {
  deviceId: string;
  weightDeltas: any;
  timestamp: string;
}

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
      
      // Simulated API Call to /api/v1/federated/aggregate
      const response = await fetch('http://localhost:3000/api/v1/federated/aggregate', {
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
      const response = await fetch('http://localhost:3000/api/v1/federated/global-model');
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
