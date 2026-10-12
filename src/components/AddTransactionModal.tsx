import React, { useState, useMemo } from 'react';
import {
  X,
  DollarSign,
  Send,
  CreditCard,
  Globe,
  Smartphone,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { scoreTransaction } from '../scoring/transactionScorer.ts';
import { useCases } from '../context/CaseContext.tsx';
import type { FraudCase } from '../types/cases.ts';
import type { TransactionInput } from '../scoring/types.ts';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (caseId: string) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addCase } = useCases();

  const [customerName, setCustomerName] = useState('David Vance');
  const [customerEmail, setCustomerEmail] = useState('d.vance@example.com');
  const [amount, setAmount] = useState('350.00');
  const [baselineAmount, setBaselineAmount] = useState('100.00');
  const [country, setCountry] = useState('GB');
  const [usualCountry, setUsualCountry] = useState('US');
  const [newDevice, setNewDevice] = useState(true);
  const [billingShippingMismatch, setBillingShippingMismatch] = useState(false);
  const [attemptsLast10m, setAttemptsLast10m] = useState('3');
  const [declinesLast24h, setDeclinesLast24h] = useState('1');
  const [accountAgeDays, setAccountAgeDays] = useState('12');

  const { txInput, validationError } = useMemo(() => {
    const rawAmt = amount.trim();
    if (!rawAmt) {
      return { txInput: null, validationError: 'Transaction amount is required.' };
    }
    const parsedAmt = parseFloat(rawAmt);
    if (Number.isNaN(parsedAmt) || parsedAmt < 0) {
      return { txInput: null, validationError: 'Amount must be a non-negative number.' };
    }

    const parsedBaseline = baselineAmount.trim() ? parseFloat(baselineAmount.trim()) : null;
    const parsedAttempts = attemptsLast10m.trim() ? parseInt(attemptsLast10m.trim(), 10) : 0;
    const parsedDeclines = declinesLast24h.trim() ? parseInt(declinesLast24h.trim(), 10) : 0;
    const parsedAge = accountAgeDays.trim() ? parseInt(accountAgeDays.trim(), 10) : null;

    const input: TransactionInput = {
      amount: parsedAmt,
      baselineAmount: parsedBaseline && parsedBaseline > 0 ? parsedBaseline : null,
      country: country.trim() || null,
      usualCountry: usualCountry.trim() || null,
      newDevice,
      billingShippingMismatch,
      attemptsLast10m: parsedAttempts >= 0 ? parsedAttempts : 0,
      declinesLast24h: parsedDeclines >= 0 ? parsedDeclines : 0,
      accountAgeDays: parsedAge !== null && parsedAge >= 0 ? parsedAge : null,
    };

    return { txInput: input, validationError: null };
  }, [
    amount,
    baselineAmount,
    country,
    usualCountry,
    newDevice,
    billingShippingMismatch,
    attemptsLast10m,
    declinesLast24h,
    accountAgeDays,
  ]);

  const scoringResult = useMemo(() => {
    if (!txInput) return null;
    try {
      return scoreTransaction(txInput);
    } catch {
      return null;
    }
  }, [txInput]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txInput || !scoringResult) return;

    const newCaseId = `CASE-${Math.floor(1070 + Math.random() * 8900)}`;
    const newCase: FraudCase = {
      id: newCaseId,
      createdAt: new Date().toISOString(),
      type: 'transaction',
      source: 'checkout',
      customerName: customerName.trim() || 'Anonymous Customer',
      customerEmail: customerEmail.trim() || 'checkout@example.com',
      transactionData: txInput,
      result: scoringResult,
      status: scoringResult.score >= 30 ? 'pending_review' : 'approved',
      assignedAnalyst: scoringResult.score >= 30 ? 'Unassigned' : 'Auto-Rule Engine',
      analystNotes: [
        {
          id: `note-${Date.now()}`,
          author: 'Checkout Ingestion',
          text: `Transaction $${txInput.amount.toFixed(2)} scored ${scoringResult.score} pts (${scoringResult.band} band).`,
          timestamp: new Date().toISOString(),
        },
      ],
      auditLog: [
        {
          id: `log-${Date.now()}`,
          action: 'Manual Transaction Check Ingested',
          author: 'Analyst (You)',
          timestamp: new Date().toISOString(),
          details: `Score: ${scoringResult.score} · Disposition: ${scoringResult.disposition}`,
        },
      ],
    };

    addCase(newCase);
    if (onSuccess) {
      onSuccess(newCaseId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-xs">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">
                  New Transaction Risk Check
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 uppercase tracking-wider">
                  Payment Signals
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Score transaction parameters against explainable risk indicators.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Customer Profile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-lg bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Email
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-lg bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Amount & Baseline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transaction Amount ($) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 250.00"
                className="w-full text-xs font-mono px-3 py-2 border rounded-lg bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Baseline ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={baselineAmount}
                onChange={(e) => setBaselineAmount(e.target.value)}
                placeholder="Optional, e.g. 100.00"
                className="w-full text-xs font-mono px-3 py-2 border rounded-lg bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Countries */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transaction Country
              </label>
              <input
                type="text"
                maxLength={5}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. US, GB, CA"
                className="w-full text-xs px-3 py-2 border rounded-lg bg-white border-slate-300 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Usual Country
              </label>
              <input
                type="text"
                maxLength={5}
                value={usualCountry}
                onChange={(e) => setUsualCountry(e.target.value)}
                placeholder="e.g. US"
                className="w-full text-xs px-3 py-2 border rounded-lg bg-white border-slate-300 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Velocity & Declines */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attempts (Last 10m)
              </label>
              <input
                type="number"
                min="0"
                value={attemptsLast10m}
                onChange={(e) => setAttemptsLast10m(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 border rounded-lg bg-white border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Declines (Last 24h)
              </label>
              <input
                type="number"
                min="0"
                value={declinesLast24h}
                onChange={(e) => setDeclinesLast24h(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 border rounded-lg bg-white border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Age (Days)
              </label>
              <input
                type="number"
                min="0"
                value={accountAgeDays}
                onChange={(e) => setAccountAgeDays(e.target.value)}
                placeholder="e.g. 60"
                className="w-full text-xs font-mono px-3 py-2 border rounded-lg bg-white border-slate-300"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={newDevice}
                onChange={(e) => setNewDevice(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600"
              />
              <span>New Device (+15)</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={billingShippingMismatch}
                onChange={(e) => setBillingShippingMismatch(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600"
              />
              <span>Billing/Shipping Mismatch (+12)</span>
            </label>
          </div>

          {/* Real-time Score Preview */}
          {scoringResult && (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Calculated Score:</span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded text-xs border ${
                      scoringResult.band === 'high'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : scoringResult.band === 'medium'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {scoringResult.score} pts ({scoringResult.band.toUpperCase()})
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {scoringResult.reasons.length} indicators triggered · {scoringResult.disposition}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Routing
                </span>
                <span className="text-xs font-bold text-indigo-700">
                  {scoringResult.score >= 30 ? 'Needs Human Review' : 'Auto-Cleared'}
                </span>
              </div>
            </div>
          )}

          {validationError && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {validationError}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!txInput}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit & Score Transaction</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
