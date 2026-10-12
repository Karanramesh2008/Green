import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Clock,
  Send,
  MessageSquare,
  DollarSign,
  Globe,
  Smartphone,
  MapPin,
  AlertTriangle,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  History,
} from 'lucide-react';
import type { FraudCase, CaseStatus } from '../types/cases.ts';
import { useCases } from '../context/CaseContext.tsx';
import { ScoreCard } from './ScoreCard.tsx';

interface CaseDetailsDrawerProps {
  fraudCase: FraudCase | null;
  onClose: () => void;
}

export const CaseDetailsDrawer: React.FC<CaseDetailsDrawerProps> = ({
  fraudCase,
  onClose,
}) => {
  const { updateCaseStatus, addAnalystNote } = useCases();
  const [noteInput, setNoteInput] = useState('');
  const [copiedJson, setCopiedJson] = useState(false);

  if (!fraudCase) return null;

  const {
    id,
    createdAt,
    type,
    source,
    customerName,
    customerEmail,
    transactionData,
    messageText,
    result,
    status,
    assignedAnalyst,
    analystNotes,
    auditLog,
  } = fraudCase;

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    addAnalystNote(id, noteInput);
    setNoteInput('');
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(fraudCase, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const statusColor = {
    pending_review: 'bg-amber-50 text-amber-800 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    escalated: 'bg-rose-50 text-rose-800 border-rose-200',
    false_positive: 'bg-slate-100 text-slate-700 border-slate-300',
  }[status];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">
              {type === 'transaction' ? (
                <DollarSign className="w-5 h-5 text-emerald-400" />
              ) : (
                <MessageSquare className="w-5 h-5 text-indigo-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 font-mono tracking-tight">
                  {id}
                </h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wide border ${statusColor}`}
                >
                  {status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Created {new Date(createdAt).toLocaleString()} · Channel:{' '}
                <span className="capitalize">{source.replace('_', ' ')}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyJson}
              className="p-2 rounded-md hover:bg-slate-200/60 text-slate-600 transition-colors cursor-pointer"
              title="Copy Full Case JSON"
            >
              {copiedJson ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-md hover:bg-slate-200/60 text-slate-600 transition-colors cursor-pointer"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="px-5 py-3 bg-white border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Analyst Triage Decision:
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateCaseStatus(id, 'approved', 'Analyst marked as cleared/approved')}
              className="text-xs px-3 py-1.5 rounded-md font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Approve (Clear)</span>
            </button>
            <button
              type="button"
              onClick={() => updateCaseStatus(id, 'escalated', 'Escalated to Tier 2 specialist for phone verification')}
              className="text-xs px-3 py-1.5 rounded-md font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Escalate to Tier 2</span>
            </button>
            <button
              type="button"
              onClick={() => updateCaseStatus(id, 'false_positive', 'Flagged as benign false positive')}
              className="text-xs px-3 py-1.5 rounded-md font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              <span>False Positive</span>
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Customer Metadata Card */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium block">Customer</span>
              <span className="font-semibold text-slate-800 text-sm">
                {customerName}
              </span>
              <span className="text-slate-500 text-[11px] block">{customerEmail}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Assigned Analyst</span>
              <span className="font-semibold text-slate-800">{assignedAnalyst}</span>
              <span className="text-slate-500 text-[11px] block">Role: Triage Specialist</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Source Channel</span>
              <span className="font-semibold text-slate-800 capitalize">
                {source.replace('_', ' ')}
              </span>
              <span className="text-slate-500 text-[11px] block">Synchronous Ingest</span>
            </div>
          </div>

          {/* Contextual Payload Details */}
          {type === 'transaction' && transactionData && (
            <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Transaction Parameters
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Amount</span>
                  <span className="text-base font-bold font-mono text-slate-900">
                    ${transactionData.amount.toFixed(2)}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Customer Baseline</span>
                  <span className="text-base font-bold font-mono text-slate-900">
                    {transactionData.baselineAmount
                      ? `$${transactionData.baselineAmount.toFixed(2)}`
                      : 'None (Sparse)'}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Country vs Usual</span>
                  <span className="text-sm font-bold font-mono text-slate-900">
                    {transactionData.country || 'N/A'} vs {transactionData.usualCountry || 'N/A'}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Velocity & Declines</span>
                  <span className="text-sm font-bold font-mono text-slate-900">
                    {transactionData.attemptsLast10m || 0} att / {transactionData.declinesLast24h || 0} dec
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  New Device: <strong>{transactionData.newDevice ? 'Yes (+15)' : 'No'}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Address Mismatch:{' '}
                  <strong>{transactionData.billingShippingMismatch ? 'Yes (+12)' : 'No'}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Account Age:{' '}
                  <strong>
                    {transactionData.accountAgeDays !== null && transactionData.accountAgeDays !== undefined
                      ? `${transactionData.accountAgeDays} days`
                      : 'Unknown'}
                  </strong>
                </span>
              </div>
            </div>
          )}

          {type === 'message' && messageText && (
            <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                Raw Message Body
              </h3>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-sans text-slate-800 leading-relaxed whitespace-pre-wrap">
                {messageText}
              </div>
            </div>
          )}

          {/* Assessment Score Card */}
          <ScoreCard
            result={result}
            title="Deterministic Heuristic Assessment"
            sourceType={type}
          />

          {/* Internal Analyst Notes Thread */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              Internal Analyst Notes ({analystNotes.length})
            </h3>

            {analystNotes.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No analyst notes recorded yet. Add an observation below to preserve audit context.
              </p>
            ) : (
              <div className="space-y-2.5">
                {analystNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-800">{note.author}</span>
                      <span>{new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{note.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Note Input Form */}
            <form onSubmit={handleAddNote} className="flex gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Attach note (e.g. 'Confirmed customer travel via ticketing notes')..."
                className="flex-1 text-xs px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border-slate-300"
              />
              <button
                type="submit"
                disabled={!noteInput.trim()}
                className="px-3 py-2 rounded-md bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </form>
          </div>

          {/* Audit Trail */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-500" />
              Case Audit Trail ({auditLog.length})
            </h3>

            <div className="space-y-2">
              {auditLog.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2.5 text-xs border-l-2 border-indigo-200 pl-3 py-1"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{log.action}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
