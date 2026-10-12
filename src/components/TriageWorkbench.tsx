import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Activity,
  ArrowUpDown,
  Download,
  RotateCcw,
  Radio,
  DollarSign,
  MessageSquare,
  CheckCircle2,
  Clock,
  Eye,
  ChevronRight,
  AlertTriangle,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { useCases } from '../context/CaseContext.tsx';
import type { FraudCase, CaseStatus } from '../types/cases.ts';
import { CaseDetailsDrawer } from './CaseDetailsDrawer.tsx';
import { REVIEW_THRESHOLD } from '../scoring/constants.ts';

interface TriageWorkbenchProps {
  onOpenAddScamModal?: () => void;
}

export const TriageWorkbench: React.FC<TriageWorkbenchProps> = ({ onOpenAddScamModal }) => {
  const {
    cases,
    isLiveStreaming,
    toggleLiveStreaming,
    updateCaseStatus,
    resetToDefaults,
  } = useCases();

  const [selectedCase, setSelectedCase] = useState<FraudCase | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CaseStatus>('all');
  const [bandFilter, setBandFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'transaction' | 'message'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'highest_risk'>('newest');

  // Metrics computation
  const pendingReviewCount = useCases().cases.filter(
    (c) => c.status === 'pending_review' && c.result.score >= REVIEW_THRESHOLD
  ).length;

  const highRiskCount = useCases().cases.filter((c) => c.result.band === 'high').length;
  const autoApprovedCount = useCases().cases.filter((c) => c.status === 'approved').length;
  const escalatedCount = useCases().cases.filter((c) => c.status === 'escalated').length;

  // Filter and sort items
  const filteredCases = useMemo(() => {
    return cases
      .filter((c) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            c.id.toLowerCase().includes(q) ||
            c.customerName.toLowerCase().includes(q) ||
            c.customerEmail.toLowerCase().includes(q);
          if (!matches) return false;
        }

        // Status
        if (statusFilter !== 'all' && c.status !== statusFilter) {
          return false;
        }

        // Band
        if (bandFilter !== 'all' && c.result.band !== bandFilter) {
          return false;
        }

        // Type
        if (typeFilter !== 'all' && c.type !== typeFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'highest_risk') {
          return b.result.score - a.result.score;
        }
        // Newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [cases, searchQuery, statusFilter, bandFilter, typeFilter, sortBy]);

  // Export current view to CSV
  const handleExportCsv = () => {
    const headers = [
      'Case ID',
      'Created At',
      'Type',
      'Customer Name',
      'Customer Email',
      'Score',
      'Risk Band',
      'Disposition',
      'Status',
      'Reasons Count',
      'Reasons Summary',
    ];

    const rows = filteredCases.map((c) => [
      c.id,
      c.createdAt,
      c.type,
      `"${c.customerName}"`,
      `"${c.customerEmail}"`,
      c.result.score,
      c.result.band,
      c.result.disposition,
      c.status,
      c.result.reasons.length,
      `"${c.result.reasons.map((r) => r.code).join('; ')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fraud_triage_queue_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Metric KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Review */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Needs Human Review
            </span>
            <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
              {pendingReviewCount}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Score ≥ 30 (Action Required)
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* High Risk Critical */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              High Risk Incidents
            </span>
            <div className="text-2xl font-bold font-mono text-rose-600 mt-1">
              {highRiskCount}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Score 60–100 (Priority 1)
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Approved / Cleared */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Approved / Cleared
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
              {autoApprovedCount}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Low risk automated pass
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Live Simulator Ingestion Feed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block flex items-center gap-1.5">
              <span>Live Ingest Feed</span>
              {isLiveStreaming && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </span>
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleLiveStreaming}
                className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer border ${
                  isLiveStreaming
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                }`}
              >
                {isLiveStreaming ? 'Streaming Active' : 'Start Feed'}
              </button>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {isLiveStreaming ? 'Simulating events ~14s' : 'Ingest simulator idle'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-200">
            <Radio className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Queue Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by case ID, customer name, email..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white border-slate-300"
            />
          </div>

          {/* Filters & Actions */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 border rounded-md bg-white border-slate-300 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending_review">Needs Review</option>
              <option value="approved">Approved</option>
              <option value="escalated">Escalated</option>
              <option value="false_positive">False Positive</option>
            </select>

            {/* Risk Band Filter */}
            <select
              value={bandFilter}
              onChange={(e) => setBandFilter(e.target.value as any)}
              className="px-2.5 py-1.5 border rounded-md bg-white border-slate-300 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Risk Bands</option>
              <option value="high">High Risk (60–100)</option>
              <option value="medium">Medium Risk (30–59)</option>
              <option value="low">Low Risk (0–29)</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-2.5 py-1.5 border rounded-md bg-white border-slate-300 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Event Types</option>
              <option value="transaction">Transactions Only</option>
              <option value="message">Messages Only</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 border rounded-md bg-white border-slate-300 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="highest_risk">Sort: Highest Risk Score</option>
            </select>

            {/* Blue "Add New Scam Message" Button in Toolbar */}
            {onOpenAddScamModal && (
              <button
                type="button"
                onClick={onOpenAddScamModal}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 transition-all shadow-xs hover:shadow-md cursor-pointer ring-1 ring-blue-300"
                title="Add and analyze a new scam message or screenshot"
              >
                <PlusCircle className="w-3.5 h-3.5 text-white" />
                <span className="uppercase tracking-wider text-[11px]">Add Scam Message</span>
              </button>
            )}

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1 transition-colors cursor-pointer"
              title="Export current table to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            {/* Reset Defaults */}
            <button
              type="button"
              onClick={resetToDefaults}
              className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1 transition-colors cursor-pointer"
              title="Reset queue to default seed cases"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Queue Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Signals Summary</th>
                <th className="py-3 px-4">Heuristic Score</th>
                <th className="py-3 px-4">Disposition</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No cases match the specified filters. Try loosening search criteria.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => {
                  const isHigh = c.result.band === 'high';
                  const isMedium = c.result.band === 'medium';

                  const badgeClass = isHigh
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : isMedium
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                  const statusClass = {
                    pending_review: 'bg-amber-50 text-amber-800 border-amber-200',
                    approved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    escalated: 'bg-rose-50 text-rose-800 border-rose-200',
                    false_positive: 'bg-slate-100 text-slate-700 border-slate-300',
                  }[c.status];

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCase(c)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      {/* Case ID & Time */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">{c.id}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {c.type === 'transaction' ? (
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <MessageSquare className="w-4 h-4 text-indigo-600" />
                          )}
                          <span className="capitalize text-slate-700">{c.type}</span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 truncate max-w-[150px]">
                          {c.customerName}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                          {c.customerEmail}
                        </div>
                      </td>

                      {/* Signals Summary */}
                      <td className="py-3 px-4">
                        {c.type === 'transaction' && c.transactionData ? (
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-slate-800">
                              ${c.transactionData.amount.toFixed(2)}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate max-w-[200px]">
                              {c.result.reasons.length > 0
                                ? c.result.reasons.map((r) => r.code).join(', ')
                                : 'Baseline routine purchase'}
                            </span>
                          </div>
                        ) : (
                          <div className="text-slate-600 truncate max-w-[220px]">
                            {c.messageText}
                          </div>
                        )}
                      </td>

                      {/* Score Badge */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded border text-xs ${badgeClass}`}
                          >
                            {c.result.score} pts
                          </span>
                          <span className="uppercase text-[10px] text-slate-400 font-semibold">
                            {c.result.band}
                          </span>
                        </div>
                      </td>

                      {/* Disposition */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                          {c.result.disposition}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border capitalize whitespace-nowrap ${statusClass}`}
                        >
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateCaseStatus(c.id, 'approved', 'Quick approved from table')}
                            className="p-1 rounded hover:bg-emerald-50 text-emerald-700 transition-colors"
                            title="Quick Approve"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateCaseStatus(c.id, 'escalated', 'Quick escalated from table')}
                            className="p-1 rounded hover:bg-rose-50 text-rose-700 transition-colors"
                            title="Quick Escalate"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedCase(c)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-500 transition-colors"
                            title="Open Full Case Dossier"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong>{filteredCases.length}</strong> of <strong>{cases.length}</strong> incidents
          </span>
          <span>Click any row to open full incident dossier & analyst notes</span>
        </div>
      </div>

      {/* Case Details Slide-over Drawer */}
      <CaseDetailsDrawer
        fraudCase={selectedCase}
        onClose={() => setSelectedCase(null)}
      />
    </div>
  );
};
