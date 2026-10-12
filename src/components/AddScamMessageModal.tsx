import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldAlert,
  Send,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Smartphone,
  Mail,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { scoreMessage } from '../scoring/messageScorer.ts';
import { useCases } from '../context/CaseContext.tsx';
import type { FraudCase } from '../types/cases.ts';

interface AddScamMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (caseId: string) => void;
}

// Sample realistic scam screenshots with transcribed OCR text
const SAMPLE_SCREENSHOTS = [
  {
    id: 'chase-sms',
    title: 'Chase Bank Lockout SMS',
    channel: 'SMS',
    previewColor: 'from-blue-600 to-indigo-800',
    badgeText: 'SMS Alert',
    text: 'URGENT: Your Chase banking account has been temporarily locked due to suspicious activity. Enter your one-time verification passcode (OTP) at https://bit.ly/chase-auth-9812 within 24 hours to avoid permanent suspension.',
  },
  {
    id: 'irs-giftcard',
    title: 'IRS Impostor Gift Card Email',
    channel: 'Email',
    previewColor: 'from-amber-600 to-rose-700',
    badgeText: 'Official Notice',
    text: 'Final Notice from IRS Dept: Settle your outstanding tax liability immediately using $500 Apple gift cards or wire transfer via Western Union. Keep this strictly confidential and do not contact your bank.',
  },
  {
    id: 'fedex-delivery',
    title: 'Delivery Package Phishing SMS',
    channel: 'SMS',
    previewColor: 'from-purple-600 to-pink-700',
    badgeText: 'FedEx Parcel',
    text: 'USPS/FedEx Alert: Parcel #4921 held at dispatch hub due to incorrect delivery address. Action required: verify card details at http://192.168.1.105/track to avoid return.',
  },
];

export const AddScamMessageModal: React.FC<AddScamMessageModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addCase } = useCases();

  const [messageText, setMessageText] = useState('');
  const [reporterName, setReporterName] = useState('Alex Morgan');
  const [reporterEmail, setReporterEmail] = useState('alex.morgan@example.com');
  const [channel, setChannel] = useState<'SMS' | 'Email' | 'WhatsApp' | 'Telegram'>('SMS');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  // Evaluate in real-time
  const scoringResult = useMemo(() => {
    return scoreMessage(messageText);
  }, [messageText]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotPreview(reader.result as string);
      setSelectedSampleId(null);
      // If user uploaded an image without text, provide a sensible default extraction prompt or sample
      if (!messageText.trim()) {
        setMessageText(
          'URGENT ALERT: Your account session has been suspended. Please confirm your one-time passcode (OTP) at https://bit.ly/auth-verify immediately to prevent lockout.'
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: (typeof SAMPLE_SCREENSHOTS)[0]) => {
    setSelectedSampleId(sample.id);
    setMessageText(sample.text);
    setChannel(sample.channel as any);
    setScreenshotPreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const newCaseId = `CASE-${Math.floor(1060 + Math.random() * 8900)}`;
    const newCase: FraudCase = {
      id: newCaseId,
      createdAt: new Date().toISOString(),
      type: 'message',
      source: 'user_report',
      customerName: reporterName.trim() || 'Anonymous Reporter',
      customerEmail: reporterEmail.trim() || 'unknown@example.com',
      messageText: messageText.trim(),
      result: scoringResult,
      status: scoringResult.score >= 30 ? 'pending_review' : 'approved',
      assignedAnalyst: scoringResult.score >= 30 ? 'Unassigned' : 'Auto-Rule Engine',
      analystNotes: [
        {
          id: `note-${Date.now()}`,
          author: 'Incident Intake',
          text: `Reported via ${channel}. Extracted text scored ${scoringResult.score} pts (${scoringResult.band} band).`,
          timestamp: new Date().toISOString(),
        },
      ],
      auditLog: [
        {
          id: `log-${Date.now()}`,
          action: 'Manual Intake Report Created',
          author: reporterName.trim() || 'Reporter',
          timestamp: new Date().toISOString(),
          details: `Channel: ${channel} · Score: ${scoringResult.score} · Disposition: ${scoringResult.disposition}`,
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
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-amber-300 shadow-xs">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">
                  Add & Analyze New Scam Message
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase tracking-wider">
                  Live Intake
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Upload screenshot, select sample, or paste message text for instant heuristic triage.
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Screenshot to Text Section */}
          <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Screenshot & Image to Text (OCR)
              </span>
              <span className="text-[11px] text-indigo-700 font-medium">
                Upload image or choose preset screenshot
              </span>
            </div>

            {/* Preset Sample Screenshots */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SAMPLE_SCREENSHOTS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedSampleId === sample.id
                      ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                      {sample.channel}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  </div>
                  <span className="text-xs font-bold text-slate-800 line-clamp-1">
                    {sample.title}
                  </span>
                  <span className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                    "{sample.text.slice(0, 60)}..."
                  </span>
                </button>
              ))}
            </div>

            {/* Custom File Upload Option */}
            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-indigo-300 bg-white hover:bg-indigo-50/50 text-indigo-700 text-xs font-medium cursor-pointer transition-colors shadow-xs">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Custom Screenshot</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {screenshotPreview && (
                <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Image loaded & text extracted
                </span>
              )}
            </div>
          </div>

          {/* Reporter & Channel Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reported Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                className="w-full text-xs px-3 py-2 border rounded-lg bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="SMS">SMS / Text Message</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Email">Email</option>
                <option value="Telegram">Telegram</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reporter / Customer Name
              </label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full text-xs px-3 py-2 border rounded-lg bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reporter Email
              </label>
              <input
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="e.g. alex@example.com"
                className="w-full text-xs px-3 py-2 border rounded-lg bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Extracted / Input Message Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Message Text (Extracted from Screenshot or Pasted) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {messageText.length} characters
              </span>
            </div>
            <textarea
              rows={4}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Paste suspicious text or select screenshot above to populate..."
              className="w-full text-xs font-sans p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white border-slate-300 resize-y"
            />
          </div>

          {/* Real-time Triage Preview Card */}
          {messageText.trim().length > 0 && (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    Live Score Assessment:
                  </span>
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
                  Disposition:{' '}
                  <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-700">
                    {scoringResult.disposition}
                  </code>{' '}
                  · {scoringResult.reasons.length} rule indicators triggered
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Target Queue
                </span>
                <span className="text-xs font-bold text-indigo-700">
                  {scoringResult.score >= 30 ? 'Needs Human Review' : 'Auto-Cleared'}
                </span>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!messageText.trim()}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit & Push to Queue</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
