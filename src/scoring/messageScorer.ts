/**
 * Pure, transparent NLP-style baseline scam message detector.
 * Scores text based on observable deterministic cues and keyword structures.
 * Does NOT invoke any external AI, LLM, or network APIs.
 */

import {
  BANDS,
  MESSAGE_RULES,
  REVIEW_THRESHOLD,
} from './constants.ts';
import type {
  MatchedCue,
  MessageScoringResult,
  RiskBand,
  ScoringReason,
} from './types.ts';

/**
 * Scores a message text using transparent NLP pattern features.
 * Returns capped score 0–100, risk band, detailed reasons, and matched cues.
 */
export function scoreMessage(text: unknown): MessageScoringResult {
  // Gracefully handle non-string or empty inputs
  if (typeof text !== 'string' || text.trim().length === 0) {
    return {
      score: 0,
      band: BANDS.LOW.name,
      reasons: [],
      disposition: 'standard_processing',
      scoreType: 'heuristic_triage_not_probability',
      matchedCues: [],
    };
  }

  const rawText = text;
  const reasons: ScoringReason[] = [];
  const matchedCues: MatchedCue[] = [];
  let pointsTotal = 0;

  // Iterate through defined rule definitions
  for (const ruleKey of Object.keys(MESSAGE_RULES)) {
    const rule = MESSAGE_RULES[ruleKey];
    let ruleMatched = false;
    const triggersForThisRule: string[] = [];

    for (const pattern of rule.patterns) {
      // Use global regex copy to extract all instances
      const regexGlobal = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
      let match: RegExpExecArray | null;

      while ((match = regexGlobal.exec(rawText)) !== null) {
        ruleMatched = true;
        const matchedStr = match[0];
        triggersForThisRule.push(matchedStr);

        matchedCues.push({
          category: rule.category,
          code: rule.code,
          label: rule.label,
          matchedText: matchedStr,
          index: match.index,
        });

        // Break if zero-length match to prevent infinite loop
        if (match.index === regexGlobal.lastIndex) {
          regexGlobal.lastIndex++;
        }
      }
    }

    if (ruleMatched) {
      reasons.push({
        code: rule.code,
        description: rule.description,
        points: rule.points,
        metadata: {
          category: rule.category,
          triggers: Array.from(new Set(triggersForThisRule)),
        },
      });
      pointsTotal += rule.points;
    }
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
    matchedCues,
  };
}
