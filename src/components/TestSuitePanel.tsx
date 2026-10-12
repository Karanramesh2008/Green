import React, { useState, useEffect } from 'react';
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  Terminal,
  AlertTriangle,
} from 'lucide-react';
import { TEST_SUITE, type TestCase } from '../scoring/tests/testCases.ts';

interface TestExecutionItem {
  id: string;
  name: string;
  category: string;
  description: string;
  passed: boolean;
  actual: unknown;
  expectedSummary: string;
  durationMs: number;
  error?: string;
}

export const TestSuitePanel: React.FC = () => {
  const [results, setResults] = useState<TestExecutionItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedTest, setSelectedTest] = useState<TestExecutionItem | null>(null);

  const runAllTests = () => {
    setIsRunning(true);
    const newResults: TestExecutionItem[] = [];

    // Run tests synchronously
    for (const test of TEST_SUITE) {
      const t0 = performance.now();
      try {
        const runRes = test.run();
        const durationMs = parseFloat((performance.now() - t0).toFixed(2));
        newResults.push({
          id: test.id,
          name: test.name,
          category: test.category,
          description: test.description,
          passed: runRes.passed,
          actual: runRes.actual,
          expectedSummary: runRes.expectedSummary,
          durationMs,
        });
      } catch (err: any) {
        const durationMs = parseFloat((performance.now() - t0).toFixed(2));
        newResults.push({
          id: test.id,
          name: test.name,
          category: test.category,
          description: test.description,
          passed: false,
          actual: null,
          expectedSummary: 'Expected test to run without throwing unexpected errors',
          durationMs,
          error: err?.message || String(err),
        });
      }
    }

    setResults(newResults);
    setIsRunning(false);
    if (newResults.length > 0 && !selectedTest) {
      setSelectedTest(newResults[0]);
    }
  };

  // Run tests automatically on initial load
  useEffect(() => {
    runAllTests();
  }, []);

  const totalPassed = results.filter((r) => r.passed).length;
  const totalFailed = results.filter((r) => !r.passed).length;
  const totalDuration = results.reduce((acc, r) => acc + r.durationMs, 0).toFixed(2);

  const filteredResults =
    activeCategory === 'all'
      ? results
      : results.filter((r) => r.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Top Controls and Stats */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Interactive Test Runner & Verification Suite
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
              {results.length} total test cases
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Verifies suspicious/benign transactions, amount multiplier tiers, velocity bounds, message scam cues, edge cases, and determinism.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={runAllTests}
            disabled={isRunning}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition-colors disabled:opacity-50"
          >
            {isRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isRunning ? 'Running Tests...' : 'Re-Run Test Suite'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tests Passed
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6" />
            <span>{totalPassed}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">100% target pass rate</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tests Failed
          </div>
          <div
            className={`text-2xl font-bold font-mono mt-1 flex items-center gap-2 ${
              totalFailed > 0 ? 'text-rose-600' : 'text-slate-400'
            }`}
          >
            <XCircle className="w-6 h-6" />
            <span>{totalFailed}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">0 failures expected</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Execution Time
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1 flex items-center gap-2">
            <Clock className="w-6 h-6 text-slate-400" />
            <span>{totalDuration} ms</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Local synchronous runtime</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            CLI Equivalence
          </div>
          <div className="text-sm font-mono text-slate-700 mt-2 bg-slate-50 px-2 py-1 rounded border border-slate-200 truncate">
            npm test
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Runs with tsx</div>
        </div>
      </div>

      {/* Test List & Detailed Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Test List */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Category Filter Tabs */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/70 overflow-x-auto">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-600">Filter:</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              {(['all', 'transaction', 'message', 'edge_case', 'determinism'] as const).map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1 rounded-md capitalize cursor-pointer transition-colors ${
                      activeCategory === cat
                        ? 'bg-white text-indigo-700 font-semibold shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[540px] overflow-y-auto">
            {filteredResults.map((test) => (
              <button
                key={test.id}
                type="button"
                onClick={() => setSelectedTest(test)}
                className={`w-full text-left p-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                  selectedTest?.id === test.id
                    ? 'bg-indigo-50/40'
                    : 'hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {test.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-800 block truncate">
                      {test.name}
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate">
                      {test.description}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {test.category.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {test.durationMs}ms
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Test Details Inspector */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Assertion Inspector
              </h3>
              <p className="text-xs text-slate-500">
                Detailed test outcome & contract evaluation
              </p>
            </div>
            {selectedTest && (
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                  selectedTest.passed
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {selectedTest.passed ? 'PASSED' : 'FAILED'}
              </span>
            )}
          </div>

          {selectedTest ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-semibold text-[10px] block">
                  Test Case ID & Name
                </span>
                <span className="font-semibold text-slate-800 text-sm">
                  {selectedTest.name}
                </span>
                <code className="text-[11px] font-mono text-slate-500 block mt-0.5">
                  ID: {selectedTest.id}
                </code>
              </div>

              <div>
                <span className="text-slate-400 uppercase font-semibold text-[10px] block">
                  Test Objective
                </span>
                <p className="text-slate-700 leading-relaxed mt-0.5">
                  {selectedTest.description}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                  Expected Outcome Rule
                </span>
                <div className="font-mono text-slate-800 text-[11px]">
                  {selectedTest.expectedSummary}
                </div>
              </div>

              {selectedTest.error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                  <span className="font-bold flex items-center gap-1 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Execution Error
                  </span>
                  <div className="font-mono text-[11px]">{selectedTest.error}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Select a test from the list to view its assertions and runtime state.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
