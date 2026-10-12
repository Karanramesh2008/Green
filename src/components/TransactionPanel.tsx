import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Sparkles,
  DollarSign,
  Globe,
  Smartphone,
  MapPin,
  Clock,
  AlertTriangle,
  HelpCircle,
  CreditCard,
} from 'lucide-react';
import { scoreTransaction } from '../scoring/transactionScorer.ts';
import { TRANSACTION_PRESETS } from '../scoring/sampleData.ts';
import { ScoreCard } from './ScoreCard.tsx';
import type { TransactionInput } from '../scoring/types.ts';

const DEFAULT_TRANSACTION_STATE: {
  amount: string;
  baselineAmount: string;
  country: string;
  usualCountry: string;
  newDevice: boolean;
  billingShippingMismatch: boolean;
  attemptsLast10m: string;
  declinesLast24h: string;
  accountAgeDays: string;
} = {
  amount: '125.00',
  baselineAmount: '100.00',
  country: 'US',
  usualCountry: 'US',
  newDevice: false,
  billingShippingMismatch: false,
  attemptsLast10m: '1',
  declinesLast24h: '0',
  accountAgeDays: '90',
};

export const TransactionPanel: React.FC = () => {
  const [formData, setFormData] = useState(DEFAULT_TRANSACTION_STATE);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Parse input fields cleanly
  const { input, validationError } = useMemo(() => {
    const rawAmt = formData.amount.trim();
    if (rawAmt === '') {
      return {
        input: null,
        validationError: 'Transaction amount is required and cannot be empty.',
      };
    }

    const parsedAmt = parseFloat(rawAmt);
    if (Number.isNaN(parsedAmt) || !Number.isFinite(parsedAmt) || parsedAmt < 0) {
      return {
        input: null,
        validationError: 'Amount must be a non-negative number.',
      };
    }

    const parsedBaseline =
      formData.baselineAmount.trim() === ''
        ? null
        : parseFloat(formData.baselineAmount.trim());

    const parsedAttempts =
      formData.attemptsLast10m.trim() === ''
        ? 0
        : parseInt(formData.attemptsLast10m.trim(), 10);

    const parsedDeclines =
      formData.declinesLast24h.trim() === ''
        ? 0
        : parseInt(formData.declinesLast24h.trim(), 10);

    const parsedAge =
      formData.accountAgeDays.trim() === ''
        ? null
        : parseInt(formData.accountAgeDays.trim(), 10);

    const txInput: TransactionInput = {
      amount: parsedAmt,
      baselineAmount:
        parsedBaseline !== null && !Number.isNaN(parsedBaseline) && parsedBaseline >= 0
          ? parsedBaseline
          : null,
      country: formData.country.trim() || null,
      usualCountry: formData.usualCountry.trim() || null,
      newDevice: formData.newDevice,
      billingShippingMismatch: formData.billingShippingMismatch,
      attemptsLast10m:
        !Number.isNaN(parsedAttempts) && parsedAttempts >= 0 ? parsedAttempts : 0,
      declinesLast24h:
        !Number.isNaN(parsedDeclines) && parsedDeclines >= 0 ? parsedDeclines : 0,
      accountAgeDays:
        parsedAge !== null && !Number.isNaN(parsedAge) && parsedAge >= 0 ? parsedAge : null,
    };

    return { input: txInput, validationError: null };
  }, [formData]);

  // Compute score using pure function
  const scoringResult = useMemo(() => {
    if (!input) return null;
    try {
      return scoreTransaction(input);
    } catch (err: any) {
      return null;
    }
  }, [input]);

  const loadPreset = (presetId: string) => {
    const preset = TRANSACTION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePresetId(presetId);
    setFormData({
      amount: preset.data.amount.toString(),
      baselineAmount:
        preset.data.baselineAmount !== null && preset.data.baselineAmount !== undefined
          ? preset.data.baselineAmount.toString()
          : '',
      country: preset.data.country || '',
      usualCountry: preset.data.usualCountry || '',
      newDevice: Boolean(preset.data.newDevice),
      billingShippingMismatch: Boolean(preset.data.billingShippingMismatch),
      attemptsLast10m:
        preset.data.attemptsLast10m !== null && preset.data.attemptsLast10m !== undefined
          ? preset.data.attemptsLast10m.toString()
          : '0',
      declinesLast24h:
        preset.data.declinesLast24h !== null && preset.data.declinesLast24h !== undefined
          ? preset.data.declinesLast24h.toString()
          : '0',
      accountAgeDays:
        preset.data.accountAgeDays !== null && preset.data.accountAgeDays !== undefined
          ? preset.data.accountAgeDays.toString()
          : '',
    });
  };

  const handleReset = () => {
    setFormData(DEFAULT_TRANSACTION_STATE);
    setActivePresetId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Presets */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Fictional Demo Scenarios
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a representative scenario to inspect deterministic indicator scoring:
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors self-start md:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Form</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {TRANSACTION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => loadPreset(preset.id)}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                activePresetId === preset.id
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
              }`}
            >
              <div>
                <span className="text-xs font-semibold text-slate-900 block truncate">
                  {preset.title}
                </span>
                <span className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                  {preset.subtitle}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-mono">Est: {preset.expectedScore} pts</span>
                <span className="uppercase font-semibold">{preset.expectedBand}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Form Inputs and Real-time Score Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form Controls */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Transaction Signals
                </h3>
                <p className="text-xs text-slate-500">
                  Amount is required; optional parameters trigger weighted rules only when present.
                </p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                scoreTransaction(input)
              </span>
            </div>

            {/* Amount Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="tx-amount"
                  className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1"
                >
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  Transaction Amount ($) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="tx-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => {
                      setFormData({ ...formData, amount: e.target.value });
                      setActivePresetId(null);
                    }}
                    placeholder="e.g. 150.00"
                    className="w-full text-sm font-mono px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white border-slate-300"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Current transaction charge.</p>
              </div>

              <div>
                <label
                  htmlFor="tx-baseline"
                  className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1"
                >
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  Customer Baseline ($)
                </label>
                <input
                  id="tx-baseline"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.baselineAmount}
                  onChange={(e) => {
                    setFormData({ ...formData, baselineAmount: e.target.value });
                    setActivePresetId(null);
                  }}
                  placeholder="Optional, e.g. 100.00"
                  className="w-full text-sm font-mono px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white border-slate-300"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  ≥2x: +10 · ≥3x: +18 · ≥5x: +25 pts
                </p>
              </div>
            </div>

            {/* Country Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label
                  htmlFor="tx-country"
                  className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  Transaction Country
                </label>
                <input
                  id="tx-country"
                  type="text"
                  maxLength={10}
                  value={formData.country}
                  onChange={(e) => {
                    setFormData({ ...formData, country: e.target.value });
                    setActivePresetId(null);
                  }}
                  placeholder="e.g. US, CA, GB"
                  className="w-full text-sm px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white border-slate-300 uppercase"
                />
              </div>

              <div>
                <label
                  htmlFor="tx-usual-country"
                  className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  Customer Usual Country
                </label>
                <input
                  id="tx-usual-country"
                  type="text"
                  maxLength={10}
                  value={formData.usualCountry}
                  onChange={(e) => {
                    setFormData({ ...formData, usualCountry: e.target.value });
                    setActivePresetId(null);
                  }}
                  placeholder="e.g. US"
                  className="w-full text-sm px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white border-slate-300 uppercase"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Mismatch (case-insensitive) = +20 pts
                </p>
              </div>
            </div>

            {/* Velocity Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label
                  htmlFor="tx-attempts"
                  className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Attempts (Last 10m)
                </label>
                <input
                  id="tx-attempts"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.attemptsLast10m}
                  onChange={(e) => {
                    setFormData({ ...formData, attemptsLast10m: e.target.value });
                    setActivePresetId(null);
                  }}
                  className="w-full text-sm font-mono px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white border-slate-300"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  3–4: +12 · 5+: +20 pts
                </p>
              </div>

              <div>
                <label
                  htmlFor="tx-declines"
                  className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                  Declines (Last 24h)
                </label>
                <input
                  id="tx-declines"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.declinesLast24h}
                  onChange={(e) => {
                    setFormData({ ...formData, declinesLast24h: e.target.value });
                    setActivePresetId(null);
                  }}
                  className="w-full text-sm font-mono px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white border-slate-300"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  3–4: +12 · 5+: +20 pts
                </p>
              </div>

              <div>
                <label
                  htmlFor="tx-account-age"
                  className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Account Age (Days)
                </label>
                <input
                  id="tx-account-age"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.accountAgeDays}
                  onChange={(e) => {
                    setFormData({ ...formData, accountAgeDays: e.target.value });
                    setActivePresetId(null);
                  }}
                  placeholder="e.g. 180"
                  className="w-full text-sm font-mono px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white border-slate-300"
                />
                <p className="text-[10px] text-slate-400 mt-1">&lt;7 days: +10 pts</p>
              </div>
            </div>

            {/* Checkbox Toggles: Device and Billing Mismatch */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <label className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.newDevice}
                  onChange={(e) => {
                    setFormData({ ...formData, newDevice: e.target.checked });
                    setActivePresetId(null);
                  }}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <div className="flex-1 text-xs">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                    New Device Unseen Flag (+15 pts)
                  </div>
                  <div className="text-slate-500">
                    Device fingerprint is not associated with customer historical logins.
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.billingShippingMismatch}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      billingShippingMismatch: e.target.checked,
                    });
                    setActivePresetId(null);
                  }}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <div className="flex-1 text-xs">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    Billing & Shipping Mismatch Flag (+12 pts)
                  </div>
                  <div className="text-slate-500">
                    Shipping destination postcode or region diverges from billing address.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {validationError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* Real-time Triage Assessment Output */}
        <div className="lg:col-span-6 space-y-4">
          {scoringResult ? (
            <ScoreCard
              result={scoringResult}
              title="Transaction Risk Assessment"
              sourceType="transaction"
            />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
              Please enter a valid transaction amount to evaluate risk indicators.
            </div>
          )}

          {/* Quick Rules Legend */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-slate-700 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              Heuristic Weights Reference
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-500">
              <div>• Amount ≥ 5x baseline: +25</div>
              <div>• Country mismatch: +20</div>
              <div>• Amount ≥ 3x baseline: +18</div>
              <div>• Attempts 5+ (10m): +20</div>
              <div>• Amount ≥ 2x baseline: +10</div>
              <div>• Declines 5+ (24h): +20</div>
              <div>• New device unseen: +15</div>
              <div>• Velocity 3–4 (10m): +12</div>
              <div>• Billing/shipping mismatch: +12</div>
              <div>• Account age &lt; 7d: +10</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
