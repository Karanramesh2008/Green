import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Copy,
  Check,
  Code2,
  FileText,
  UserCheck,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import type { ScoringResult, MessageScoringResult } from '../scoring/types.ts';
import { BANDS, REVIEW_THRESHOLD } from '../scoring/constants.ts';

interface ScoreCardProps {
  result: ScoringResult | MessageScoringResult;
  title?: string;
  sourceType: 'transaction' | 'message';
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  result,
  title = 'Triage Assessment Result',
  sourceType,
}) => {
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);

  const { score, band, reasons, disposition, scoreType } = result;

  const bandConfig =
    band === 'high'
      ? BANDS.HIGH
      : band === 'medium'
      ? BANDS.MEDIUM
      : BANDS.LOW;

  const isReviewRecommended = score >= REVIEW_THRESHOLD;

  const handleCopyJson = () => {
    // Exact schema representation as specified in contract
    const contractJson = {
      score: result.score,
      band: result.band,
      reasons: result.reasons.map((r) => ({
        code: r.code,
        description: r.description,
        points: r.points,
      })),
      disposition: result.disposition,
      scoreType: result.scoreType,
    };
    navigator.clipboard.writeText(JSON.stringify(contractJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // SVG Gauge calculations
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const strokeColor =
    band === 'high'
      ? '#e11d48' // rose-600
      : band === 'medium'
      ? '#d97706' // amber-600
      : '#059669'; // emerald-600

  const badgeBg =
    band === 'high'
      ? 'bg-rose-50 text-rose-800 border-rose-200'
      : band === 'medium'
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : 'bg-emerald-50 text-emerald-800 border-emerald-200';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header bar */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowJson(!showJson)}
            className="text-xs px-2.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{showJson ? 'Show Visual View' : 'Inspect JSON Contract'}</span>
          </button>
          <button
            type="button"
            onClick={handleCopyJson}
            className="text-xs px-2.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copy contract JSON"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy JSON</span>
              </>
            )}
          </button>
        </div>
      </div>

      {showJson ? (
        <div className="p-6 bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400">
            <span>Standard Contract Response (pure JSON):</span>
            <span className="text-[11px] text-slate-500">scoreType: {scoreType}</span>
          </div>
          <pre className="leading-relaxed">
            {JSON.stringify(
              {
                score: result.score,
                band: result.band,
                reasons: result.reasons.map((r) => ({
                  code: r.code,
                  description: r.description,
                  points: r.points,
                })),
                disposition: result.disposition,
                scoreType: result.scoreType,
              },
              null,
              2
            )}
          </pre>
        </div>
      ) : (
        <div className="p-6">
          {/* Top Summary: Radial Gauge & Disposition */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pb-6 border-b border-slate-100">
            {/* Score Radial Indicator */}
            <div className="md:col-span-5 flex items-center gap-5 justify-center md:justify-start">
              <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    stroke="#f1f5f9"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    stroke={strokeColor}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                    {score}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    out of 100
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${badgeBg}`}
                  >
                    {bandConfig.label}
                  </span>
                </div>
                <div className="text-xs text-slate-500 max-w-[200px] leading-relaxed">
                  {bandConfig.description}
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Range: {bandConfig.min}–{bandConfig.max} pts
                </div>
              </div>
            </div>

            {/* Recommendation Disposition Box */}
            <div className="md:col-span-7">
              <div
                className={`p-4 rounded-lg border ${
                  isReviewRecommended
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {isReviewRecommended ? (
                      <UserCheck className="w-5 h-5 text-amber-600" />
                    ) : (
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    )}
                    <span className="text-sm font-bold">
                      {isReviewRecommended
                        ? 'Disposition: Human Review Recommended'
                        : 'Disposition: Standard Automated Processing'}
                    </span>
                  </div>
                  <code className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/70 border border-slate-200 text-slate-700">
                    {disposition}
                  </code>
                </div>

                <p className="text-xs leading-relaxed text-slate-700">
                  {isReviewRecommended
                    ? 'Cumulative score reached 30 or higher. Per protocol, route to analyst worklist for manual review. Do not autonomously block or decline the transaction.'
                    : 'Risk score is beneath review threshold (30). Safe for automated pipeline processing subject to routine payment authorization.'}
                </p>

                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    Contract Type:{' '}
                    <code className="font-mono text-slate-700">{scoreType}</code>
                  </span>
                  <span>Threshold: score ≥ 30</span>
                </div>
              </div>
            </div>
          </div>

          {/* Triggered Reasons Breakdown */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Triggered Indicators ({reasons.length})
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Sum of rule points:{' '}
                <strong className="font-mono text-slate-900">
                  {reasons.reduce((acc, r) => acc + r.points, 0)}
                </strong>
                {score < reasons.reduce((acc, r) => acc + r.points, 0) && (
                  <span className="text-rose-600 ml-1">(capped at 100)</span>
                )}
              </span>
            </div>

            {reasons.length === 0 ? (
              <div className="p-6 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-800">
                  No risk indicators triggered
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Input values met all baseline criteria without firing heuristic flags.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {reasons.map((reason, index) => (
                  <div
                    key={`${reason.code}-${index}`}
                    className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-indigo-700">
                          {reason.code}
                        </code>
                        {Boolean(reason.metadata?.category) && (
                          <span className="text-xs text-slate-500 font-medium">
                            · {String(reason.metadata?.category)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 leading-normal">
                        {reason.description}
                      </p>
                      {Array.isArray(reason.metadata?.triggers) && (
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-600">Matched cues:</span>
                          {(reason.metadata?.triggers as string[]).map((t, idx) => (
                            <span
                              key={idx}
                              className="font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200"
                            >
                              "{t}"
                            </span>
                          ))}
                        </div>
                      )}
                      {Boolean(reason.metadata?.ratio) && (
                        <div className="text-[11px] text-slate-500 font-mono">
                          Multiplier ratio: {String(reason.metadata?.ratio)}x baseline ($
                          {String(reason.metadata?.baseline)})
                        </div>
                      )}
                      {Boolean(reason.metadata?.transactionCountry) && (
                        <div className="text-[11px] text-slate-500 font-mono">
                          Transaction Country: {String(reason.metadata?.transactionCountry)} vs Usual:{' '}
                          {String(reason.metadata?.usualCountry)}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center sm:flex-col sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                      <span className="text-sm font-bold font-mono text-rose-700 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200">
                        +{reason.points} pts
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">
                        Weighted Rule
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
