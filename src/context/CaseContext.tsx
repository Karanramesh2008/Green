import React, { createContext, useContext, useState, useEffect } from 'react';
import type { FraudCase, CaseStatus, AnalystNote, AuditLogEntry } from '../types/cases.ts';
import { INITIAL_CASES } from '../data/initialCases.ts';
import { scoreTransaction } from '../scoring/transactionScorer.ts';
import { scoreMessage } from '../scoring/messageScorer.ts';

const LOCAL_STORAGE_KEY = 'fraud_triage_cases_v1';
const STREAM_STORAGE_KEY = 'fraud_triage_stream_active_v1';

interface CaseContextType {
  cases: FraudCase[];
  isLiveStreaming: boolean;
  toggleLiveStreaming: () => void;
  updateCaseStatus: (caseId: string, status: CaseStatus, note?: string) => void;
  addAnalystNote: (caseId: string, text: string, author?: string) => void;
  assignAnalyst: (caseId: string, analystName: string) => void;
  addCase: (newCase: FraudCase) => void;
  batchAddCases: (newCases: FraudCase[]) => void;
  deleteCase: (caseId: string) => void;
  resetToDefaults: () => void;
}

const CaseContext = createContext<CaseContextType | null>(null);

export const CaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cases, setCases] = useState<FraudCase[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return INITIAL_CASES;
  });

  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STREAM_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Save cases to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cases));
    } catch {
      // Ignore quota errors
    }
  }, [cases]);

  // Save live streaming toggle
  useEffect(() => {
    try {
      localStorage.setItem(STREAM_STORAGE_KEY, String(isLiveStreaming));
    } catch {
      // Ignore
    }
  }, [isLiveStreaming]);

  // Live Stream Simulation: Generates an event every 14 seconds when toggled on
  useEffect(() => {
    if (!isLiveStreaming) return;

    const names = ['Kai Mercer', 'Sophia Thorne', 'Liam Vance', 'Avery Brooks', 'Chloe Dupont', 'Noah Sterling'];
    const countries = ['US', 'CA', 'GB', 'DE', 'FR', 'AU'];

    const interval = setInterval(() => {
      const isTx = Math.random() > 0.3; // 70% transactions, 30% messages
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomId = `CASE-${Math.floor(1050 + Math.random() * 8900)}`;

      if (isTx) {
        const baseline = Math.random() > 0.4 ? Math.floor(40 + Math.random() * 80) : null;
        // 35% chance of high spike or mismatch
        const isSpike = Math.random() > 0.65;
        const multiplier = isSpike ? (Math.random() > 0.5 ? 5.2 : 3.4) : (0.8 + Math.random() * 0.5);
        const amount = baseline ? Math.round(baseline * multiplier * 100) / 100 : Math.round((20 + Math.random() * 150) * 100) / 100;
        const txCountry = isSpike && Math.random() > 0.5 ? 'GB' : 'US';
        const newDevice = isSpike && Math.random() > 0.5;
        const attempts = isSpike && Math.random() > 0.6 ? 4 : 1;
        const declines = isSpike && Math.random() > 0.7 ? 3 : 0;
        const age = isSpike && Math.random() > 0.6 ? 3 : Math.floor(10 + Math.random() * 300);

        const txInput = {
          amount,
          baselineAmount: baseline,
          country: txCountry,
          usualCountry: 'US',
          newDevice,
          billingShippingMismatch: isSpike && Math.random() > 0.7,
          attemptsLast10m: attempts,
          declinesLast24h: declines,
          accountAgeDays: age,
        };

        const result = scoreTransaction(txInput);

        const newCase: FraudCase = {
          id: randomId,
          createdAt: new Date().toISOString(),
          type: 'transaction',
          source: 'stream_simulator',
          customerName: randomName,
          customerEmail: `${randomName.toLowerCase().replace(' ', '.')}@example.com`,
          transactionData: txInput,
          result,
          status: result.score >= 30 ? 'pending_review' : 'approved',
          assignedAnalyst: result.score >= 30 ? 'Unassigned' : 'Auto-Rule Engine',
          analystNotes: [],
          auditLog: [
            {
              id: `log-${Date.now()}`,
              action: 'Stream Ingestion',
              author: 'Live Simulator',
              timestamp: new Date().toISOString(),
              details: `Score: ${result.score} (${result.band} band) - ${result.disposition}`,
            },
          ],
        };

        setCases((prev) => [newCase, ...prev.slice(0, 49)]); // keep recent 50
      } else {
        const scamTexts = [
          'Alert from Wells Fargo: Your card has been temporarily locked. Enter your 6-digit OTP passcode at https://bit.ly/wf-auth-token now to restore access.',
          'Notice from Treasury Dept: Urgent fine due immediately. Settle via Steam gift cards or wire transfer to avoid immediate police warrant.',
          'Order delivered: Your parcel #8812 has arrived safely in your mailbox. Thank you for ordering with us!',
        ];
        const selectedText = scamTexts[Math.floor(Math.random() * scamTexts.length)];
        const result = scoreMessage(selectedText);

        const newCase: FraudCase = {
          id: randomId,
          createdAt: new Date().toISOString(),
          type: 'message',
          source: 'stream_simulator',
          customerName: randomName,
          customerEmail: `${randomName.toLowerCase().replace(' ', '.')}@example.com`,
          messageText: selectedText,
          result,
          status: result.score >= 30 ? 'pending_review' : 'approved',
          assignedAnalyst: result.score >= 30 ? 'Unassigned' : 'Auto-Rule Engine',
          analystNotes: [],
          auditLog: [
            {
              id: `log-${Date.now()}`,
              action: 'Stream Ingestion',
              author: 'Live Simulator',
              timestamp: new Date().toISOString(),
              details: `Score: ${result.score} (${result.band} band) - ${result.disposition}`,
            },
          ],
        };

        setCases((prev) => [newCase, ...prev.slice(0, 49)]);
      }
    }, 14000);

    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  const toggleLiveStreaming = () => {
    setIsLiveStreaming((prev) => !prev);
  };

  const updateCaseStatus = (caseId: string, status: CaseStatus, note?: string) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;

        const newNotes = [...c.analystNotes];
        if (note && note.trim().length > 0) {
          newNotes.push({
            id: `note-${Date.now()}`,
            author: 'Analyst (You)',
            text: note.trim(),
            timestamp: new Date().toISOString(),
          });
        }

        const logEntry: AuditLogEntry = {
          id: `log-${Date.now()}`,
          action: `Status changed to ${status.replace('_', ' ').toUpperCase()}`,
          author: 'Analyst (You)',
          timestamp: new Date().toISOString(),
          details: note ? `Note attached: "${note.trim()}"` : 'Status transition executed.',
        };

        return {
          ...c,
          status,
          analystNotes: newNotes,
          auditLog: [logEntry, ...c.auditLog],
        };
      })
    );
  };

  const addAnalystNote = (caseId: string, text: string, author: string = 'Analyst (You)') => {
    if (!text.trim()) return;

    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;

        const newNote: AnalystNote = {
          id: `note-${Date.now()}`,
          author,
          text: text.trim(),
          timestamp: new Date().toISOString(),
        };

        const logEntry: AuditLogEntry = {
          id: `log-${Date.now()}`,
          action: 'Added Internal Note',
          author,
          timestamp: new Date().toISOString(),
          details: `"${text.trim().slice(0, 60)}${text.trim().length > 60 ? '...' : ''}"`,
        };

        return {
          ...c,
          analystNotes: [...c.analystNotes, newNote],
          auditLog: [logEntry, ...c.auditLog],
        };
      })
    );
  };

  const assignAnalyst = (caseId: string, analystName: string) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;

        const logEntry: AuditLogEntry = {
          id: `log-${Date.now()}`,
          action: 'Assigned Analyst',
          author: 'System / Supervisor',
          timestamp: new Date().toISOString(),
          details: `Assigned case to ${analystName}`,
        };

        return {
          ...c,
          assignedAnalyst: analystName,
          auditLog: [logEntry, ...c.auditLog],
        };
      })
    );
  };

  const addCase = (newCase: FraudCase) => {
    setCases((prev) => [newCase, ...prev]);
  };

  const batchAddCases = (newCases: FraudCase[]) => {
    setCases((prev) => [...newCases, ...prev]);
  };

  const deleteCase = (caseId: string) => {
    setCases((prev) => prev.filter((c) => c.id !== caseId));
  };

  const resetToDefaults = () => {
    setCases(INITIAL_CASES);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  return (
    <CaseContext.Provider
      value={{
        cases,
        isLiveStreaming,
        toggleLiveStreaming,
        updateCaseStatus,
        addAnalystNote,
        assignAnalyst,
        addCase,
        batchAddCases,
        deleteCase,
        resetToDefaults,
      }}
    >
      {children}
    </CaseContext.Provider>
  );
};

export const useCases = () => {
  const context = useContext(CaseContext);
  if (!context) {
    throw new Error('useCases must be used within a CaseProvider');
  }
  return context;
};
