import type { TransactionInput, ScoringResult, MessageScoringResult } from '../scoring/types.ts';

export type CaseStatus = 'pending_review' | 'approved' | 'escalated' | 'false_positive';

export interface AnalystNote {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  author: string;
  timestamp: string;
  details: string;
}

export interface FraudCase {
  id: string;
  createdAt: string;
  type: 'transaction' | 'message';
  source: 'checkout' | 'user_report' | 'batch_upload' | 'stream_simulator';
  customerName: string;
  customerEmail: string;
  transactionData?: TransactionInput;
  messageText?: string;
  result: ScoringResult | MessageScoringResult;
  status: CaseStatus;
  assignedAnalyst: string;
  analystNotes: AnalystNote[];
  auditLog: AuditLogEntry[];
}
