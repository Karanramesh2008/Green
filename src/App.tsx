import React, { useState } from 'react';
import { Header, type TabType } from './components/Header.tsx';
import { TriageWorkbench } from './components/TriageWorkbench.tsx';
import { TransactionPanel } from './components/TransactionPanel.tsx';
import { MessagePanel } from './components/MessagePanel.tsx';
import { RulesPolicyPanel } from './components/RulesPolicyPanel.tsx';
import { TestSuitePanel } from './components/TestSuitePanel.tsx';
import { AddScamMessageModal } from './components/AddScamMessageModal.tsx';
import { AddTransactionModal } from './components/AddTransactionModal.tsx';
import { CaseProvider, useCases } from './context/CaseContext.tsx';
import { TEST_SUITE } from './scoring/tests/testCases.ts';
import { REVIEW_THRESHOLD } from './scoring/constants.ts';

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('workbench');
  const [isAddScamModalOpen, setIsAddScamModalOpen] = useState(false);
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const { cases } = useCases();

  const pendingReviewCount = cases.filter(
    (c) => c.status === 'pending_review' && c.result.score >= REVIEW_THRESHOLD
  ).length;

  const testTotalCount = TEST_SUITE.length;
  const testPassCount = TEST_SUITE.filter((t) => {
    try {
      return t.run().passed;
    } catch {
      return false;
    }
  }).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header with blue Add New Scam Message button & Transaction Check button */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAddScamModal={() => setIsAddScamModalOpen(true)}
        onOpenAddTransactionModal={() => setIsAddTxModalOpen(true)}
        pendingReviewCount={pendingReviewCount}
        testPassCount={testPassCount}
        testTotalCount={testTotalCount}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'workbench' && (
          <TriageWorkbench
            onOpenAddScamModal={() => setIsAddScamModalOpen(true)}
          />
        )}
        {activeTab === 'transaction' && <TransactionPanel />}
        {activeTab === 'message' && (
          <MessagePanel
            onOpenAddModal={() => setIsAddScamModalOpen(true)}
          />
        )}
        {activeTab === 'rules' && <RulesPolicyPanel />}
        {activeTab === 'tests' && <TestSuitePanel />}
      </main>

      {/* Add Scam Message Modal (With Screenshot OCR & Live Intake) */}
      <AddScamMessageModal
        isOpen={isAddScamModalOpen}
        onClose={() => setIsAddScamModalOpen(false)}
        onSuccess={() => {
          setActiveTab('workbench');
        }}
      />

      {/* Add Transaction Check Modal */}
      <AddTransactionModal
        isOpen={isAddTxModalOpen}
        onClose={() => setIsAddTxModalOpen(false)}
        onSuccess={() => {
          setActiveTab('workbench');
        }}
      />

      {/* Product Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-slate-800">Fraud Risk Triage Baseline</span> · Operations & Analyst Queue.
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Deterministic pure functions</span>
            <span>·</span>
            <span>Screenshot OCR transcription</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <CaseProvider>
      <AppContent />
    </CaseProvider>
  );
}
