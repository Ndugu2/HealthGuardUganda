import { AuthService } from './AuthService';

export type UserRole = 'CHW' | 'DMO' | 'MOH_OFFICER';

export interface GovernancePolicy {
  minConfidenceForAutoApproval: number;
  requiresPeerReview: boolean;
  version: string;
}

export class GovernanceService {
  private static CURRENT_POLICY: GovernancePolicy = {
    minConfidenceForAutoApproval: 0.95,
    requiresPeerReview: true,
    version: 'MoH-2026.05.v1'
  };

  /**
   * Checks if the current user has permission to validate claims.
   * DMOs (District Medical Officers) and MoH Officers are authorized.
   */
  public static async canValidate(): Promise<boolean> {
    const session = await AuthService.getSession();
    if (!session) return false;
    
    const user = session.user;
    return user.role === 'DMO' || user.role === 'MOH_OFFICER';
  }

  /**
   * Returns the current governing policy for the AI.
   */
  public static getActivePolicy(): GovernancePolicy {
    return this.CURRENT_POLICY;
  }

  /**
   * Validates a classification result against the national policy.
   * If confidence is low, it marks it as "NEEDS_HUMAN_REVIEW".
   */
  public static assessGovernance(confidence: number): { action: 'AUTO' | 'REVIEW', note: string } {
    if (confidence >= this.CURRENT_POLICY.minConfidenceForAutoApproval) {
      return { action: 'AUTO', note: `Approved via MoH Policy ${this.CURRENT_POLICY.version}` };
    }
    return { action: 'REVIEW', note: "Confidence below threshold. Peer review required by District Medical Officer." };
  }
}
