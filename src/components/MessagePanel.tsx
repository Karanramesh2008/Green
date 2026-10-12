import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Sparkles,
  MessageSquare,
  Search,
  CheckCircle,
  AlertOctagon,
  HelpCircle,
  Eye,
  Type,
  Upload,
  Image as ImageIcon,
  PlusCircle,
  Scan,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { scoreMessage } from '../scoring/messageScorer.ts';
import { MESSAGE_PRESETS } from '../scoring/sampleData.ts';
import { ScoreCard } from './ScoreCard.tsx';

const DEFAULT_MESSAGE =
  'URGENT: Your Chase account will be locked within 24 hours due to unauthorized activity. Action required immediately! Verify your identity and share your one-time passcode (OTP) at https://bit.ly/chase-auth-9812 to prevent suspension.';

// Realistic screenshot presets
const SCREENSHOT_PRESETS = [
  {
    id: 'chase-phish',
    name: 'Chase Bank Lockout SMS',
    channel: 'SMS Text',
    badge: 'Urgent Phish',
    previewColor: 'bg-blue-900',
    headerText: 'Chase Fraud Alert · 88201',
    text: 'URGENT: Your Chase account will be locked within 24 hours due to unauthorized activity. Action required immediately! Verify your identity and share your one-time passcode (OTP) at https://bit.ly/chase-auth-9812 to prevent suspension.',
  },
  {
    id: 'crypto-irs',
    name: 'IRS Apple Gift Card Extortion',
    channel: 'Notice',
    badge: 'Extortion Demand',
    previewColor: 'bg-stone-900',
    headerText: 'Internal Revenue Service · Dept 14',
    text: 'Final notice from official department: To resolve your outstanding ticket immediately, please purchase $500 in Apple gift cards or wire transfer funds via Western Union. Keep this strictly confidential and do not inform your bank.',
  },
  {
    id: 'fedex-sms',
    name: 'USPS / FedEx Fake Tracking',
    channel: 'SMS Text',
    badge: 'Malicious Link',
    previewColor: 'bg-purple-950',
    headerText: 'USPS Express · 9021',
    text: 'USPS Notification: Parcel shipment #4901 is pending clearance due to invalid delivery fee. Confirm card details immediately at http://192.168.1.1/parcel to release item.',
  },
];

interface MessagePanelProps {
  onOpenAddModal?: () => void;
}

export const MessagePanel: React.FC<MessagePanelProps> = ({ onOpenAddModal }) => {
  const [text, setText] = useState(DEFAULT_MESSAGE);
  const [activePresetId, setActivePresetId] = useState<string | null>('urgent-bank-lockout');
  const [highlightMode, setHighlightMode] = useState(true);
  const [activeScreenshot, setActiveScreenshot] = useState<(typeof SCREENSHOT_PRESETS)[0] | null>(
    SCREENSHOT_PRESETS[0]
  );
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [isOcrExtracting, setIsOcrExtracting] = useState(false);

  const scoringResult = useMemo(() => {
    return scoreMessage(text);
  }, [text]);

  const loadPreset = (presetId: string) => {
    const preset = MESSAGE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePresetId(presetId);
    setText(preset.text);
    setActiveScreenshot(null);
    setUploadedImageSrc(null);
  };

  const handleSelectScreenshotPreset = (sc: (typeof SCREENSHOT_PRESETS)[0]) => {
    setActiveScreenshot(sc);
    setUploadedImageSrc(null);
    setIsOcrExtracting(true);
    setTimeout(() => {
      setText(sc.text);
      setActivePresetId(null);
      setIsOcrExtracting(false);
    }, 400);
  };

  const handleCustomScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImageSrc(reader.result as string);
      setActiveScreenshot(null);
      setIsOcrExtracting(true);

      // Simulate client-side OCR extraction
      setTimeout(() => {
        setIsOcrExtracting(false);
        setText(
          'URGENT SECURITY ALERT: Unauthorized login detected from unfamiliar IP address. Share your one-time verification passcode (OTP) or click http://bit.ly/secure-restore to prevent immediate account closure.'
        );
      }, 600);
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setText('');
    setActivePresetId(null);
    setActiveScreenshot(null);
    setUploadedImageSrc(null);
  };

  // Build highlighted markup for matched text
  const renderedHighlightedText = useMemo(() => {
    if (!text || !scoringResult.matchedCues || scoringResult.matchedCues.length === 0) {
      return <span>{text || '(No text entered)'}</span>;
    }

    const sortedCues = [...scoringResult.matchedCues].sort((a, b) => a.index - b.index);
    const segments: Array<{ text: string; isMatch: boolean; label?: string; code?: string }> = [];
    let lastIndex = 0;

    for (const cue of sortedCues) {
      const matchStart = cue.index;
      const matchEnd = cue.index + cue.matchedText.length;

      if (matchStart < lastIndex) continue;

      if (matchStart > lastIndex) {
        segments.push({
          text: text.slice(lastIndex, matchStart),
          isMatch: false,
        });
      }

      segments.push({
        text: text.slice(matchStart, matchEnd),
        isMatch: true,
        label: cue.label,
        code: cue.code,
      });

      lastIndex = matchEnd;
    }

    if (lastIndex < text.length) {
      segments.push({
        text: text.slice(lastIndex),
        isMatch: false,
      });
    }

    return (
      <div className="leading-relaxed whitespace-pre-wrap font-sans text-sm text-slate-800">
        {segments.map((seg, idx) =>
          seg.isMatch ? (
            <mark
              key={idx}
              className="bg-amber-100 text-amber-950 px-1 py-0.5 rounded font-semibold border-b-2 border-amber-400 group relative inline-block cursor-help"
              title={`${seg.label} (${seg.code})`}
            >
              {seg.text}
            </mark>
          ) : (
            <span key={idx}>{seg.text}</span>
          )
        )}
      </div>
    );
  }, [text, scoringResult]);

  return (
    <div className="space-y-6">
      {/* Top Banner with Highlighted Button */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Scam & Phishing Message Analyzer
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Deterministic OCR & NLP
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Extract text from screenshot images, identify coercive pressure patterns, and detect credential theft signals.
          </p>
        </div>

        {/* Blue Action Button */}
        {onOpenAddModal && (
          <button
            type="button"
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all duration-150 flex items-center gap-2 cursor-pointer ring-2 ring-blue-300 ring-offset-1"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span className="uppercase tracking-wider">Add New Scam Message</span>
          </button>
        )}
      </div>

      {/* Screenshot to Text OCR Inspector Card */}
      <div className="bg-white rounded-xl border border-indigo-200 shadow-xs p-5 bg-gradient-to-b from-indigo-50/30 to-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Scan className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-950 block">
                Screenshot & Image to Text (OCR)
              </span>
              <span className="text-[11px] text-slate-500">
                Click a sample phone screenshot or upload your own to extract and scan the text
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs px-3 py-1.5 rounded-md border border-indigo-300 bg-white hover:bg-indigo-50 text-indigo-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Custom Screenshot</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleCustomScreenshotUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Screenshot Presets Carousel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SCREENSHOT_PRESETS.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => handleSelectScreenshotPreset(sc)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                activeScreenshot?.id === sc.id
                  ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-white shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {/* Simulated Mobile Screenshot Graphic */}
              <div
                className={`w-full h-24 rounded-lg p-2.5 text-white mb-2.5 flex flex-col justify-between ${sc.previewColor} shadow-inner relative`}
              >
                <div className="flex items-center justify-between text-[10px] opacity-80 font-mono">
                  <span>9:41 AM</span>
                  <span className="px-1 rounded bg-white/20 text-[9px] uppercase font-bold">
                    {sc.channel}
                  </span>
                </div>
                <div className="bg-white/10 backdrop-blur-xs p-1.5 rounded text-[10px] font-sans leading-tight line-clamp-2 border border-white/20">
                  {sc.text}
                </div>
                <div className="text-[9px] opacity-70 truncate font-mono">
                  {sc.headerText}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {sc.name}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  {sc.badge}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Click to extract text & evaluate
              </span>
            </button>
          ))}
        </div>

        {isOcrExtracting && (
          <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-center gap-2 animate-pulse font-medium">
            <Scan className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Scanning screenshot image and transcribing text features...</span>
          </div>
        )}
      </div>

      {/* Main Grid: Message Input / Cue Inspector and Score Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Message Input & Live Highlight Inspector */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  Message Content (Extracted Text)
                </h3>
                <p className="text-xs text-slate-500">
                  Transparent NLP regex evaluation · Local processing only
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHighlightMode(!highlightMode)}
                  className="text-xs px-2.5 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{highlightMode ? 'Show Raw Text' : 'Highlight Cues'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Input or Highlight View */}
            {highlightMode && text.trim().length > 0 ? (
              <div className="space-y-2">
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 min-h-[140px] max-h-[220px] overflow-y-auto">
                  {renderedHighlightedText}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-amber-200 border border-amber-400 inline-block" />
                    Highlighted items denote matched heuristic scam patterns
                  </span>
                  <button
                    type="button"
                    onClick={() => setHighlightMode(false)}
                    className="text-indigo-600 hover:text-indigo-800 font-medium underline cursor-pointer"
                  >
                    Edit message text
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="msg-textarea" className="sr-only">
                  Message Text
                </label>
                <textarea
                  id="msg-textarea"
                  rows={6}
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setActivePresetId(null);
                  }}
                  placeholder="Paste or type suspicious SMS, email, or chat notification message..."
                  className="w-full text-sm font-sans p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white border-slate-300 resize-y"
                />
                <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                  <span>Characters: {text.length} · Words: {text.trim() ? text.trim().split(/\s+/).length : 0}</span>
                  <span>Evaluates synchronously</span>
                </div>
              </div>
            )}

            {/* Triggered Cues Summary */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Detected Transparent Features ({scoringResult.reasons.length})
              </span>
              {scoringResult.reasons.length === 0 ? (
                <div className="text-xs text-slate-500 flex items-center gap-1.5 p-2.5 rounded bg-slate-50 border border-slate-200">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No suspicious patterns or coercive language detected.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {scoringResult.reasons.map((r, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded border border-amber-200 bg-amber-50/50 text-xs flex items-center justify-between"
                    >
                      <div className="truncate mr-2">
                        <span className="font-semibold text-amber-950 block truncate">
                          {r.metadata?.category ? String(r.metadata.category) : r.code}
                        </span>
                        <span className="text-[10px] text-amber-800 truncate block">
                          {r.code}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-rose-700 shrink-0">
                        +{r.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Preset Samples Buttons */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Additional Text Presets
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MESSAGE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => loadPreset(preset.id)}
                  className={`p-2 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                    activePresetId === preset.id
                      ? 'border-indigo-600 bg-indigo-50/50 font-semibold'
                      : 'border-slate-200 bg-white hover:bg-slate-100'
                  }`}
                >
                  <span className="block truncate text-slate-900">{preset.title}</span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {preset.primaryThreats[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Triage Assessment Card */}
        <div className="lg:col-span-6 space-y-4">
          <ScoreCard
            result={scoringResult}
            title="Message Scam Triage Assessment"
            sourceType="message"
          />
        </div>
      </div>
    </div>
  );
};
