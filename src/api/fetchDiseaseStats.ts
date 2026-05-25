import axios from 'axios';
import { saveDiseaseStats } from '../db/diseaseStats';

export interface DiseaseStat {
  id: string;
  title: string;
  description: string;
  reportedAt: string;
  severity: string;
}

/**
 * Fetches latest disease alerts from a public endpoint and persists them.
 * @param endpoint URL of the WHO disease alerts JSON feed.
 */
export async function fetchDiseaseStats(endpoint: string = 'https://diseasealerts.who.int/api/v1/alerts') {
  try {
    const response = await axios.get(endpoint);
    const data: DiseaseStat[] = response.data?.alerts?.map((a: any) => ({
      id: a.id,
      title: a.title,
      description: a.summary,
      reportedAt: a.published_at,
      severity: a.severity ?? 'unknown',
    })) ?? [];
    await saveDiseaseStats(data);
    console.log(`[DiseaseStats] Saved ${data.length} records`);
  } catch (err) {
    console.error('Failed to fetch disease stats:', err);
  }
}
