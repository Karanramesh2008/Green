import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Inbox,
  Sliders,
  PlusCircle,
  Sparkles,
} from 'lucide-react';

export type TabType =
  | 'workbench'
  | 'transaction'
  | 'message'
  | 'rules'
  | 'tests';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenAddScamModal: () => void;
  onOpenAddTransactionModal?: () => void;
  pendingReviewCount?: number;
  testPassCount?: number;
  testTotalCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenAddScamModal,
  onOpenAddTransactionModal,
  pendingReviewCount = 0,
  testPassCount,
  testTotalCount,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3.5 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Fraud Risk Triage Baseline
                </h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Production Workbench
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Blue "Add New Scam Message" Button */}
            <button
              type="button"
              onClick={onOpenAddScamModal}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all duration-150 flex items-center gap-2 cursor-pointer ring-2 ring-blue-300 ring-offset-1"
              title="Add & analyze a new scam message or screenshot"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span className="tracking-wide uppercase">Add New Scam Message</span>
            </button>

            {/* "Transaction Check" Action Button */}
            <button
              type="button"
              onClick={
                onOpenAddTransactionModal
                  ? onOpenAddTransactionModal
                  : () => onTabChange('transaction')
              }
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all duration-150 flex items-center gap-2 cursor-pointer ring-2 ring-emerald-300 ring-offset-1"
              title="Add or score a new payment transaction"
            >
              <ShieldCheck className="w-4 h-4 text-white" />
              <span className="tracking-wide uppercase">Transaction Check</span>
            </button>

            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200 text-xs">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <span>Capped 0–100</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Integration & README removed as requested) */}
        <nav className="flex space-x-1 border-t border-slate-100 -mb-px overflow-x-auto">
          <button
            type="button"
            onClick={() => onTabChange('workbench')}
            className={`py-2.5 px-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === 'workbench'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Triage Queue</span>
            {pendingReviewCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
                {pendingReviewCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange('transaction')}
            className={`py-2.5 px-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === 'transaction'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Transaction Check</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('message')}
            className={`py-2.5 px-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === 'message'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Scam Message Check</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('rules')}
            className={`py-2.5 px-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === 'rules'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Rules & Policy</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('tests')}
            className={`py-2.5 px-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === 'tests'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Unit Test Suite</span>
            {testPassCount !== undefined && testTotalCount !== undefined && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-mono">
                {testPassCount}/{testTotalCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
