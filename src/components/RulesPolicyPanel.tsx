import React, { useState } from 'react';
import {
  Sliders,
  Shield,
  Layers,
  CheckCircle2,
  AlertCircle,
  Download,
  Copy,
  Check,
  Zap,
  HelpCircle,
} from 'lucide-react';
import {
  TRANSACTION_RULES,
  MESSAGE_RULES,
  REVIEW_THRESHOLD,
  BANDS,
} from '../scoring/constants.ts';
import { useCases } from '../context/CaseContext.tsx';

export const RulesPolicyPanel: React.FC = () => {
  const { cases } = useCases();
  const [copied, setCopied] = useState(false);

  // Compute rule hit counts across current cases in the system
  const ruleHits: Record<string, number> = {};
  cases.forEach((c) => {
    c.result.reasons.forEach((r) => {
      ruleHits[r.code] = (ruleHits[r.code] || 0) + 1;
    });
  });

  const exportRulesConfig = () => {
    const config = {
      version: '1.0.0-triage-baseline',
      reviewThreshold: REVIEW_THRESHOLD,
      bands: BANDS,
      transactionRules: TRANSACTION_RULES,
      messageRules: Object.keys(MESSAGE_RULES).map((k) => ({
        code: MESSAGE_RULES[k].code,
        category: MESSAGE_RULES[k].category,
        label: MESSAGE_RULES[k].label,
        points: MESSAGE_RULES[k].points,
        description: MESSAGE_RULES[k].description,
      })),
    };

    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Heuristic Rules & Policy Configuration
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Inspect deterministic rule weights, trigger conditions, and real-time hit frequency across active queue incidents. Export configuration directly for backend policy synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportRulesConfig}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied Policy JSON</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Export Policy Config</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Threshold Policies */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Review Triage Threshold
          </span>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
            Score ≥ {REVIEW_THRESHOLD}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Scores $\ge 30$ trigger <code className="font-mono text-slate-700">recommend_human_review</code>.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            High Risk Escalation
          </span>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-1">
            Score ≥ {BANDS.HIGH.min}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Scores 60–100 prioritize immediate Tier 1 specialist routing.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Score Saturation Ceiling
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            100 Points Cap
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Scores are normalized and strictly capped at 100 maximum.
          </p>
        </div>
      </div>

      {/* Rules Catalog with Live Queue Hit Counters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Rules Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Transaction Rules ({Object.keys(TRANSACTION_RULES).length})
            </span>
            <span className="text-[11px] text-slate-500">Live Queue Triggers</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {Object.values(TRANSACTION_RULES).map((rule) => {
              const hits = ruleHits[rule.code] || 0;
              return (
                <div key={rule.code} className="p-3.5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {rule.code}
                      </code>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-rose-600">
                        +{rule.points} pts
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold" title="Hits across current queue">
                        {hits} hits
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {rule.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Message NLP Rules Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Scam Message Features ({Object.keys(MESSAGE_RULES).length})
            </span>
            <span className="text-[11px] text-slate-500">Live Queue Triggers</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {Object.values(MESSAGE_RULES).map((rule) => {
              const hits = ruleHits[rule.code] || 0;
              return (
                <div key={rule.code} className="p-3.5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {rule.code}
                      </code>
                      <span className="text-[10px] text-slate-400 font-medium">
                        · {rule.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-rose-600">
                        +{rule.points} pts
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold" title="Hits across current queue">
                        {hits} hits
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {rule.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
