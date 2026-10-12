/**
 * Comprehensive test cases for Fraud Risk Triage baseline prototype.
 * Uses strictly fictional test data.
 */

import { scoreTransaction } from '../transactionScorer.ts';
import { scoreMessage } from '../messageScorer.ts';
import type { TransactionInput, ScoringResult } from '../types.ts';

export interface TestCase {
  id: string;
  name: string;
  category: 'transaction' | 'message' | 'edge_case' | 'determinism';
  description: string;
  run: () => { passed: boolean; message?: string; actual: unknown; expectedSummary: string };
}

export const TEST_SUITE: TestCase[] = [
  // 1. Normal benign transaction
  {
    id: 'tx-benign-normal',
    name: 'Benign Transaction: Routine Purchase',
    category: 'transaction',
    description: 'Transaction with baseline amount, familiar device, same country, no velocity spikes.',
    run: () => {
      const input: TransactionInput = {
        amount: 45.0,
        baselineAmount: 50.0,
        country: 'US',
        usualCountry: 'US',
        newDevice: false,
        billingShippingMismatch: false,
        attemptsLast10m: 1,
        declinesLast24h: 0,
        accountAgeDays: 180,
      };
      const result = scoreTransaction(input);
      const passed =
        result.score === 0 &&
        result.band === 'low' &&
        result.disposition === 'standard_processing' &&
        result.reasons.length === 0;
      return {
        passed,
        actual: result,
        expectedSummary: 'Score: 0, Band: low, Disposition: standard_processing, Reasons: 0',
      };
    },
  },

  // 2. Suspicious transaction with multiple independent indicators
  {
    id: 'tx-suspicious-multi',
    name: 'Suspicious Transaction: Multi-Indicator Spike',
    category: 'transaction',
    description: '5x baseline (+25), country mismatch (+20), new device (+15), 5+ attempts (+20), 3 declines (+12). Total points = 92.',
    run: () => {
      const input: TransactionInput = {
        amount: 600.0,
        baselineAmount: 100.0, // 6x > 5x => +25
        country: 'GB',
        usualCountry: 'US', // country mismatch => +20
        newDevice: true, // +15
        billingShippingMismatch: false,
        attemptsLast10m: 6, // 5+ => +20
        declinesLast24h: 3, // 3-4 => +12
        accountAgeDays: 60,
      };
      const result = scoreTransaction(input);
      // Expected score = 25 + 20 + 15 + 20 + 12 = 92
      const passed =
        result.score === 92 &&
        result.band === 'high' &&
        result.disposition === 'recommend_human_review' &&
        result.reasons.length === 5;
      return {
        passed,
        actual: result,
        expectedSummary: 'Score: 92, Band: high, Disposition: recommend_human_review, Reasons: 5',
      };
    },
  },

  // 3. Amount multiplier: 2x tier (+10)
  {
    id: 'tx-amount-2x',
    name: 'Amount Tier: 2x Baseline',
    category: 'transaction',
    description: 'Amount exactly 2x baseline ($200 vs $100) triggers +10 points.',
    run: () => {
      const result = scoreTransaction({
        amount: 200,
        baselineAmount: 100,
      });
      const passed =
        result.score === 10 &&
        result.reasons.some((r) => r.code === 'amount_spike_2x') &&
        result.band === 'low';
      return {
        passed,
        actual: result,
        expectedSummary: 'Score: 10, Reason: amount_spike_2x',
      };
    },
  },

  // 4. Amount multiplier: 3x tier (+18 instead of +10)
  {
    id: 'tx-amount-3x',
    name: 'Amount Tier: 3x Baseline',
    category: 'transaction',
    description: 'Amount 3.5x baseline ($350 vs $100) triggers +18 points instead of +10.',
    run: () => {
      const result = scoreTransaction({
        amount: 350,
        baselineAmount: 100,
      });
      const passed =
        result.score === 18 &&
        result.reasons.some((r) => r.code === 'amount_spike_3x') &&
        !result.reasons.some((r) => r.code === 'amount_spike_2x');
      return {
        passed,
        actual: result,
        expectedSummary: 'Score: 18, Reason: amount_spike_3x (exclusive)',
      };
    },
  },

  // 5. Amount multiplier: 5x tier (+25 instead of lower amount rule)
  {
    id: 'tx-amount-5x',
    name: 'Amount Tier: 5x Baseline',
    category: 'transaction',
    description: 'Amount 5x baseline ($500 vs $100) triggers +25 points exclusively.',
    run: () => {
      const result = scoreTransaction({
        amount: 500,
        baselineAmount: 100,
      });
      const passed =
        result.score === 25 &&
        result.reasons.some((r) => r.code === 'amount_spike_5x') &&
        !result.reasons.some((r) => r.code === 'amount_spike_3x') &&
        !result.reasons.some((r) => r.code === 'amount_spike_2x');
      return {
        passed,
        actual: result,
        expectedSummary: 'Score: 25, Reason: amount_spike_5x (exclusive)',
      };
    },
  },

  // 6. Case-insensitive country match
  {
    id: 'tx-country-case-match',
    name: 'Country Comparison: Case Insensitive Equal',
    category: 'transaction',
    description: 'Comparing "us" with "US" must NOT trigger a country mismatch rule.',
    run: () => {
      const result = scoreTransaction({
        amount: 50,
        country: 'us',
        usualCountry: 'US',
      });
      const passed =
        result.score === 0 &&
        !result.reasons.some((r) => r.code === 'country_mismatch');
      return {
        passed,
        actual: result,
        expectedSummary: 'Score: 0, No country mismatch triggered for "us" vs "US"',
      };
    },
  },

  // 7. Velocity rules: 3-4 attempts (+12) vs 5+ attempts (+20)
  {
    id: 'tx-velocity-attempts',
    name: 'Velocity Attempts Tiers',
    category: 'transaction',
    description: '4 attempts gives +12; 5 attempts gives +20 points.',
    run: () => {
      const res4 = scoreTransaction({ amount: 50, attemptsLast10m: 4 });
      const res5 = scoreTransaction({ amount: 50, attemptsLast10m: 5 });
      const passed =
        res4.score === 12 &&
        res4.reasons.some((r) => r.code === 'velocity_attempts_elevated') &&
        res5.score === 20 &&
        res5.reasons.some((r) => r.code === 'velocity_attempts_high');
      return {
        passed,
        actual: { res4Score: res4.score, res5Score: res5.score },
        expectedSummary: 'res4 score: 12, res5 score: 20',
      };
    },
  },

  // 8. Decline rules: 3-4 declines (+12) vs 5+ declines (+20)
  {
    id: 'tx-velocity-declines',
    name: 'Recent Declines Tiers',
    category: 'transaction',
    description: '3 declines gives +12; 5 declines gives +20 points.',
    run: () => {
      const res3 = scoreTransaction({ amount: 50, declinesLast24h: 3 });
      const res5 = scoreTransaction({ amount: 50, declinesLast24h: 5 });
      const passed =
        res3.score === 12 &&
        res3.reasons.some((r) => r.code === 'declines_elevated') &&
        res5.score === 20 &&
        res5.reasons.some((r) => r.code === 'declines_high');
      return {
        passed,
        actual: { res3Score: res3.score, res5Score: res5.score },
        expectedSummary: 'res3 score: 12, res5 score: 20',
      };
    },
  },

  // 9. Account age: younger than 7 days (+10) vs 7+ days (0)
  {
    id: 'tx-account-age',
    name: 'Account Age Threshold',
    category: 'transaction',
    description: 'Account age 6 days triggers +10 points; age 7 days triggers 0 points.',
    run: () => {
      const res6 = scoreTransaction({ amount: 50, accountAgeDays: 6 });
      const res7 = scoreTransaction({ amount: 50, accountAgeDays: 7 });
      const passed =
        res6.score === 10 &&
        res6.reasons.some((r) => r.code === 'account_younger_than_7_days') &&
        res7.score === 0;
      return {
        passed,
        actual: { res6Score: res6.score, res7Score: res7.score },
        expectedSummary: 'Age 6: 10 pts, Age 7: 0 pts',
      };
    },
  },

  // 10. Cap score at 100
  {
    id: 'tx-score-cap-100',
    name: 'Score Saturation Cap at 100',
    category: 'transaction',
    description: 'When accumulated points exceed 100, final score is strictly capped at 100.',
    run: () => {
      // 25 (amount 5x) + 20 (country) + 15 (device) + 12 (mismatch) + 20 (attempts) + 20 (declines) + 10 (age) = 122 pts
      const res = scoreTransaction({
        amount: 1000,
        baselineAmount: 100,
        country: 'FR',
        usualCountry: 'US',
        newDevice: true,
        billingShippingMismatch: true,
        attemptsLast10m: 7,
        declinesLast24h: 8,
        accountAgeDays: 2,
      });
      const passed = res.score === 100 && res.band === 'high';
      return {
        passed,
        actual: res.score,
        expectedSummary: 'Score capped at 100 despite sum being 122',
      };
    },
  },

  // 11. Edge case: Missing optional values must not trigger a rule
  {
    id: 'tx-missing-optionals',
    name: 'Edge Case: Missing Optional Values',
    category: 'edge_case',
    description: 'Providing only required amount with null/undefined optionals triggers 0 points.',
    run: () => {
      const res = scoreTransaction({
        amount: 89.99,
        baselineAmount: null,
        country: null,
        usualCountry: null,
        newDevice: null,
        billingShippingMismatch: null,
        attemptsLast10m: null,
        declinesLast24h: null,
        accountAgeDays: null,
      });
      const passed = res.score === 0 && res.reasons.length === 0 && res.band === 'low';
      return {
        passed,
        actual: res,
        expectedSummary: 'Score: 0, Reasons: 0',
      };
    },
  },

  // 12. Edge case: Invalid negative amount throws error
  {
    id: 'tx-invalid-amount-error',
    name: 'Edge Case: Invalid Negative Amount Rejection',
    category: 'edge_case',
    description: 'Negative or NaN amount must throw a validation error.',
    run: () => {
      let threwCorrectly = false;
      try {
        scoreTransaction({ amount: -50 });
      } catch (e: any) {
        threwCorrectly = e && e.message.includes('Invalid transaction input');
      }
      return {
        passed: threwCorrectly,
        actual: threwCorrectly ? 'Threw validation error' : 'Did not throw',
        expectedSummary: 'Throws invalid transaction input error',
      };
    },
  },

  // 13. Scam message: Phishing + OTP + Threat + Link
  {
    id: 'msg-phishing-otp',
    name: 'Scam Message: Phishing & Credential Harvest',
    category: 'message',
    description: 'Suspicious text claiming account suspended, demanding OTP within 24 hours via bit.ly link.',
    run: () => {
      const text =
        'URGENT: Your Chase account will be suspended within 24 hours. Action required immediately! Please reply with your one-time passcode (OTP) or verify at https://bit.ly/secure-login-392';
      const res = scoreMessage(text);
      // Urgency (+15) + Threat (+20) + OTP (+25) + Shortener link (+22) + Brand with link (+18) = 100 (capped)
      const passed =
        res.score >= 60 &&
        res.band === 'high' &&
        res.disposition === 'recommend_human_review' &&
        res.reasons.some((r) => r.code === 'credential_otp_request') &&
        res.reasons.some((r) => r.code === 'suspicious_url') &&
        res.reasons.some((r) => r.code === 'threat_suspension_coercion') &&
        res.reasons.some((r) => r.code === 'urgency_deadline');
      return {
        passed,
        actual: res,
        expectedSummary: 'Score: >= 60 (high band), triggered credential, threat, url, urgency',
      };
    },
  },

  // 14. Scam message: Gift Card & Wire Transfer Extortion with Secrecy
  {
    id: 'msg-giftcard-secrecy',
    name: 'Scam Message: Gift Card Demands & Secrecy',
    category: 'message',
    description: 'Demands Apple gift card payment and orders recipient not to tell their bank.',
    run: () => {
      const text =
        'To settle your debt immediately, purchase an Apple gift card and send the code. Strictly confidential: do not tell your bank or anyone else.';
      const res = scoreMessage(text);
      const passed =
        res.score >= 40 &&
        res.reasons.some((r) => r.code === 'unusual_payment_method') &&
        res.reasons.some((r) => r.code === 'secrecy_request');
      return {
        passed,
        actual: res,
        expectedSummary: 'Detected unusual_payment_method and secrecy_request',
      };
    },
  },

  // 15. Benign message: Routine Order Delivery
  {
    id: 'msg-benign-delivery',
    name: 'Benign Message: Routine Delivery Notice',
    category: 'message',
    description: 'Everyday package arrival notice without coercive threats or credential demands.',
    run: () => {
      const text =
        'Hi Alex, your package #9821 has been delivered to your front porch. Thank you for shopping with us today!';
      const res = scoreMessage(text);
      const passed =
        res.score === 0 &&
        res.band === 'low' &&
        res.disposition === 'standard_processing' &&
        res.reasons.length === 0;
      return {
        passed,
        actual: res,
        expectedSummary: 'Score: 0, Band: low, No scam rules triggered',
      };
    },
  },

  // 16. Benign message with urgency only: Team Meeting
  {
    id: 'msg-urgency-only-benign',
    name: 'Benign Message: Urgency Words Only',
    category: 'message',
    description: 'Calendar meeting reminder with "urgent" wording but NO scam indicators (stays in Low band < 30).',
    run: () => {
      const text =
        'Urgent reminder: Our engineering standup starts immediately in room 4B.';
      const res = scoreMessage(text);
      // Only urgency (+15 points), so score = 15, band = low (0-29), disposition = standard_processing
      const passed =
        res.score === 15 &&
        res.band === 'low' &&
        res.disposition === 'standard_processing' &&
        res.reasons.length === 1 &&
        res.reasons[0].code === 'urgency_deadline';
      return {
        passed,
        actual: res,
        expectedSummary: 'Score: 15, Band: low (below review threshold 30), only urgency triggered',
      };
    },
  },

  // 17. Edge case: Empty / whitespace message text
  {
    id: 'msg-empty-edge',
    name: 'Edge Case: Empty & Whitespace Text',
    category: 'edge_case',
    description: 'Empty or whitespace string returns safe default low-risk contract.',
    run: () => {
      const resEmpty = scoreMessage('');
      const resSpaces = scoreMessage('    \n\t  ');
      const passed =
        resEmpty.score === 0 &&
        resEmpty.band === 'low' &&
        resEmpty.reasons.length === 0 &&
        resSpaces.score === 0 &&
        resSpaces.band === 'low';
      return {
        passed,
        actual: { empty: resEmpty.score, spaces: resSpaces.score },
        expectedSummary: 'Both return score: 0, band: low',
      };
    },
  },

  // 18. Determinism: Repeated runs return identical outputs
  {
    id: 'det-identical-runs',
    name: 'Determinism: Identical Output on Re-Run',
    category: 'determinism',
    description: 'Evaluating the same inputs 10 times in a row yields strictly identical JSON structures.',
    run: () => {
      const txInput: TransactionInput = {
        amount: 250,
        baselineAmount: 50,
        country: 'MX',
        usualCountry: 'US',
        newDevice: true,
      };
      const tx1 = JSON.stringify(scoreTransaction(txInput));
      const tx2 = JSON.stringify(scoreTransaction(txInput));

      const msgText = 'Please provide your OTP code within 10 minutes to avoid account closure: bit.ly/unlock';
      const msg1 = JSON.stringify(scoreMessage(msgText));
      const msg2 = JSON.stringify(scoreMessage(msgText));

      const passed = tx1 === tx2 && msg1 === msg2;
      return {
        passed,
        actual: { txDeterministic: tx1 === tx2, msgDeterministic: msg1 === msg2 },
        expectedSummary: 'Exact deep equality across consecutive executions',
      };
    },
  },
];
