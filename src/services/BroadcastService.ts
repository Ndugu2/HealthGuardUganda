import { saveBroadcast, getBroadcasts, Broadcast } from '../db/Database';

export class BroadcastService {
  /**
   * Simulates syncing emergency alerts from the Ministry of Health central server.
   * In a real app, this would be an actual API call.
   */
  public static async syncAlerts(): Promise<number> {
    try {
      // Mocked MoH Server Response
      const incomingAlerts: Omit<Broadcast, 'id'>[] = [
        {
          title: '🚨 New Measles Outbreak Advisory',
          title_lg: '🚨 Kirira Kipya kya Measles',
          message: 'Increased measles cases reported in Kampala Central. Ensure all children under 5 are screened and immunization records verified.',
          message_lg: 'Waliwo okweyongera kw\'obulwadde bwa Measles mu Kampala Central. Kakasa nti abaana bafuna enkingo.',
          severity: 'URGENT',
          timestamp: new Date().toISOString(),
          isRead: false
        },
        {
          title: 'ℹ️ Malaria Drug Supply Update',
          title_lg: 'ℹ️ Ebikwata ku Ddagala lya Malaria',
          message: 'New batch of Artemether-lumefantrine (AL) has arrived at Entebbe stores. Distribution to VHTs starts Monday.',
          message_lg: 'Eddagala lya Artemether-lumefantrine (AL) lijjiddwa mu masitoowa ga Entebbe. Okugaba kutandika ku Mmande.',
          severity: 'INFO',
          timestamp: new Date().toISOString(),
          isRead: false
        }
      ];

      const current = await getBroadcasts();
      let newCount = 0;

      for (const alert of incomingAlerts) {
        // Simple check to avoid duplicates based on title
        if (!current.some(b => b.title === alert.title)) {
          await saveBroadcast(alert);
          newCount++;
        }
      }

      return newCount;
    } catch (error) {
      console.error('Broadcast Sync Error:', error);
      return 0;
    }
  }

  public static async fetchOfflineBroadcasts(): Promise<Broadcast[]> {
    return await getBroadcasts();
  }
}
