/**
 * Core types for the Fraud & Scam Risk Triage Baseline Prototype.
 * Follows the strict JSON output contract and input boundaries.
 */

export type RiskBand = 'low' | 'medium' | 'high';

export type ScoreType = 'heuristic_triage_not_probability';

export type Disposition = 'recommend_human_review' | 'standard_processing';

export interface ScoringReason {
  code: string;
  description: string;
  points: number;
  metadata?: Record<string, unknown>;
}

export interface ScoringResult {
  score: number; // integer from 0 to 100
  band: RiskBand; // 'low' | 'medium' | 'high'
  reasons: ScoringReason[];
  disposition: Disposition;
  scoreType: ScoreType;
}

export interface TransactionInput {
  amount: number;
  baselineAmount?: number | null;
  country?: string | null;
  usualCountry?: string | null;
  newDevice?: boolean | null;
  billingShippingMismatch?: boolean | null;
  attemptsLast10m?: number | null;
  declinesLast24h?: number | null;
  accountAgeDays?: number | null;
}

export interface MatchedCue {
  category: string;
  code: string;
  label: string;
  matchedText: string;
  index: number;
}

export interface MessageScoringResult extends ScoringResult {
  matchedCues?: MatchedCue[];
}

export interface UnitTestResult {
  id: string;
  name: string;
  category: 'transaction' | 'message' | 'edge_case' | 'determinism';
  passed: boolean;
  expected: Partial<ScoringResult>;
  actual?: ScoringResult;
  error?: string;
  durationMs: number;
}
