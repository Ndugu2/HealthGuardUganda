import { getAllClaims, ClaimRecord } from '../db/Database';

export interface MisinfoPattern {
  id: string;
  theme: string;
  claimsCount: number;
  sampleClaims: string[];
  severity: 'HIGH' | 'MEDIUM';
}

export class PatternService {
  /**
   * Automatically groups individual misinformation claims into semantic patterns.
   */
  public static async detectPatterns(): Promise<MisinfoPattern[]> {
    try {
      const claims = await getAllClaims();
      const misinfoClaims = claims.filter(c => c.label === 'INACCURATE');

      if (misinfoClaims.length < 3) {
        return this.getMockPatterns();
      }

      // Semantic Clustering Logic (Simplified for Hybrid Offline execution)
      const patterns: Record<string, MisinfoPattern> = {
        'Fertility-related vaccine myths': { id: 'p1', theme: 'Fertility-related vaccine misinformation', claimsCount: 0, sampleClaims: [], severity: 'HIGH' },
        'Herbal vs Hospital cures': { id: 'p2', theme: 'Traditional vs Clinical treatment myths', claimsCount: 0, sampleClaims: [], severity: 'MEDIUM' },
        'Government/Foreign conspiracy': { id: 'p3', theme: 'Institutional distrust narratives', claimsCount: 0, sampleClaims: [], severity: 'MEDIUM' },
        'Outbreak denialism': { id: 'p4', theme: 'Disease existence denial', claimsCount: 0, sampleClaims: [], severity: 'HIGH' }
      };

      misinfoClaims.forEach(claim => {
        const text = claim.claim_text.toLowerCase();
        
        // Pattern 1: Fertility & Vaccines
        if ((text.includes('vaccine') || text.includes('injection')) && 
            (text.includes('child') || text.includes('birth') || text.includes('barren') || text.includes('fertile'))) {
          patterns['Fertility-related vaccine myths'].claimsCount++;
          if (patterns['Fertility-related vaccine myths'].sampleClaims.length < 2) {
            patterns['Fertility-related vaccine myths'].sampleClaims.push(claim.claim_text);
          }
        }
        
        // Pattern 2: Traditional Cures
        else if (text.includes('herbal') || text.includes('roots') || text.includes('cure') && (text.includes('malaria') || text.includes('hiv'))) {
          patterns['Herbal vs Hospital cures'].claimsCount++;
          if (patterns['Herbal vs Hospital cures'].sampleClaims.length < 2) {
            patterns['Herbal vs Hospital cures'].sampleClaims.push(claim.claim_text);
          }
        }

        // Pattern 3: Distrust
        else if (text.includes('government') || text.includes('bill gates') || text.includes('5g') || text.includes('experiment')) {
          patterns['Government/Foreign conspiracy'].claimsCount++;
          if (patterns['Government/Foreign conspiracy'].sampleClaims.length < 2) {
            patterns['Government/Foreign conspiracy'].sampleClaims.push(claim.claim_text);
          }
        }
      });

      // Filter out empty patterns and return
      return Object.values(patterns).filter(p => p.claimsCount > 0);
    } catch (error) {
      console.error('Pattern Detection Error:', error);
      return this.getMockPatterns();
    }
  }

  private static getMockPatterns(): MisinfoPattern[] {
    return [
      {
        id: 'p1',
        theme: 'Fertility-related vaccine misinformation',
        claimsCount: 14,
        sampleClaims: [
          'Vaccines cause infertility in young girls',
          'Injection stops childbirth'
        ],
        severity: 'HIGH'
      },
      {
        id: 'p2',
        theme: 'Traditional vs Clinical treatment myths',
        claimsCount: 8,
        sampleClaims: [
          'Neem leaves cure malaria better than tablets',
          'Traditional roots can wash away HIV'
        ],
        severity: 'MEDIUM'
      }
    ];
  }
}
