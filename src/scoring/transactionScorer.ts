/**
 * Pure, explainable heuristic transaction risk scoring function.
 * Independent of any UI framework or external services.
 */

import {
  BANDS,
  REVIEW_THRESHOLD,
  TRANSACTION_RULES,
} from './constants.ts';
import type {
  RiskBand,
  ScoringReason,
  ScoringResult,
  TransactionInput,
} from './types.ts';

/**
 * Validates and scores transaction-level risk indicators against heuristic rules.
 *
 * @throws Error if amount is invalid (missing, NaN, or negative)
 */
export function scoreTransaction(input: TransactionInput): ScoringResult {
  if (
    input === null ||
    input === undefined ||
    typeof input.amount !== 'number' ||
    Number.isNaN(input.amount) ||
    !Number.isFinite(input.amount) ||
    input.amount < 0
  ) {
    throw new Error(
      'Invalid transaction input: "amount" must be a non-negative finite number.'
    );
  }

  const reasons: ScoringReason[] = [];
  let pointsTotal = 0;

  // 1. Amount multiplier relative to positive baseline
  // Rule: amount >= 5x baseline (+25) OR amount >= 3x (+18) OR amount >= 2x (+10)
  if (
    typeof input.baselineAmount === 'number' &&
    Number.isFinite(input.baselineAmount) &&
    input.baselineAmount > 0
  ) {
    const ratio = input.amount / input.baselineAmount;

    if (ratio >= 5) {
      const rule = TRANSACTION_RULES.AMOUNT_SPIKE_5X;
      reasons.push({
        code: rule.code,
        description: rule.description,
        points: rule.points,
        metadata: { ratio: Number(ratio.toFixed(2)), baseline: input.baselineAmount },
      });
      pointsTotal += rule.points;
    } else if (ratio >= 3) {
      const rule = TRANSACTION_RULES.AMOUNT_SPIKE_3X;
      reasons.push({
        code: rule.code,
        description: rule.description,
        points: rule.points,
        metadata: { ratio: Number(ratio.toFixed(2)), baseline: input.baselineAmount },
      });
      pointsTotal += rule.points;
    } else if (ratio >= 2) {
      const rule = TRANSACTION_RULES.AMOUNT_SPIKE_2X;
      reasons.push({
        code: rule.code,
        description: rule.description,
        points: rule.points,
        metadata: { ratio: Number(ratio.toFixed(2)), baseline: input.baselineAmount },
      });
      pointsTotal += rule.points;
    }
  }

  // 2. Country mismatch (case-insensitive check, only when both are provided)
  if (
    typeof input.country === 'string' &&
    input.country.trim().length > 0 &&
    typeof input.usualCountry === 'string' &&
    input.usualCountry.trim().length > 0
  ) {
    const normalizedTxCountry = input.country.trim().toLowerCase();
    const normalizedUsualCountry = input.usualCountry.trim().toLowerCase();

    if (normalizedTxCountry !== normalizedUsualCountry) {
      const rule = TRANSACTION_RULES.COUNTRY_MISMATCH;
      reasons.push({
        code: rule.code,
        description: rule.description,
        points: rule.points,
        metadata: {
          transactionCountry: input.country.trim(),
          usualCountry: input.usualCountry.trim(),
        },
      });
      pointsTotal += rule.points;
    }
  }

  // 3. New device (+15 points)
  if (input.newDevice === true) {
    const rule = TRANSACTION_RULES.NEW_DEVICE;
    reasons.push({
      code: rule.code,
      description: rule.description,
      points: rule.points,
    });
    pointsTotal += rule.points;
  }

  // 4. Billing/shipping mismatch (+12 points)
  if (input.billingShippingMismatch === true) {
    const rule = TRANSACTION_RULES.BILLING_SHIPPING_MISMATCH;
    reasons.push({
      code: rule.code,
      description: rule.description,
      points: rule.points,
    });
    pointsTotal += rule.points;
  }

  // 5. Velocity: payment attempts in the last 10 minutes
  // 5 or more: +20 points; 3–4 attempts: +12 points
  if (
    typeof input.attemptsLast10m === 'number' &&
    Number.isInteger(input.attemptsLast10m) &&
    input.attemptsLast10m > 0
  ) {
    if (input.attemptsLast10m >= 5) {
      const rule = TRANSACTION_RULES.VELOCITY_ATTEMPTS_HIGH;
      reasons.push({
        code: rule.code,
        description: rule.description,
        points: rule.points,
        metadata: { attemptsLast10m: input.attemptsLast10m },
      });
      pointsTotal += rule.points;
    } else if (input.attemptsLast10m >= 3) {
      const rule = TRANSACTION_RULES.VELOCITY_ATTEMPTS_ELEVATED;
      reasons.push({
        code: rule.code,
        description: rule.description,
        points: rule.points,
        metadata: { attemptsLast10m: input.attemptsLast10m },
      });
      pointsTotal += rule.points;
    }
  }

  // 6. Recent declines: in last 24 hours
  // 5 or more: +20 points; 3–4 declines: +12 points
  if (
    typeof input.declinesLast24h === 'number' &&
    Number.isInteger(input.declinesLast24h) &&
    input.declinesLast24h > 0
  ) {
    if (input.declinesLast24h >= 5) {
      const rule = TRANSACTION_RULES.DECLINES_HIGH;
      reasons.push({
        code: rule.code,
        description: rule.description,
        points: rule.points,
        metadata: { declinesLast24h: input.declinesLast24h },
      });
      pointsTotal += rule.points;
    } else if (input.declinesLast24h >= 3) {
      const rule = TRANSACTION_RULES.DECLINES_ELEVATED;
      reasons.push({
        code: rule.code,
        description: rule.description,
        points: rule.points,
        metadata: { declinesLast24h: input.declinesLast24h },
      });
      pointsTotal += rule.points;
    }
  }

  // 7. Account age: younger than 7 days (+10 points)
  if (
    typeof input.accountAgeDays === 'number' &&
    Number.isFinite(input.accountAgeDays) &&
    input.accountAgeDays >= 0 &&
    input.accountAgeDays < 7
  ) {
    const rule = TRANSACTION_RULES.ACCOUNT_AGE_NEW;
    reasons.push({
      code: rule.code,
      description: rule.description,
      points: rule.points,
      metadata: { accountAgeDays: input.accountAgeDays },
    });
    pointsTotal += rule.points;
  }

  // Cap score at 100
  const finalScore = Math.min(100, Math.max(0, pointsTotal));

  // Determine band
  let band: RiskBand = BANDS.LOW.name;
  if (finalScore >= BANDS.HIGH.min) {
    band = BANDS.HIGH.name;
  } else if (finalScore >= BANDS.MEDIUM.min) {
    band = BANDS.MEDIUM.name;
  }

  // Determine disposition
  const disposition =
    finalScore >= REVIEW_THRESHOLD ? 'recommend_human_review' : 'standard_processing';

  return {
    score: finalScore,
    band,
    reasons,
    disposition,
    scoreType: 'heuristic_triage_not_probability',
  };
}
