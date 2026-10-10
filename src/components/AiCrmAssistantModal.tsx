'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { Product, Employee, CrmLead, CrmReminder, Currency } from '../types';
import { 
  processCrmInputWithGemini, 
  AiParsedCrmResult,
  getGeminiApiKey
} from '../utils/ai';
import { formatNumberWithSpaces, formatUSDNumber } from '../utils/formatters';
import { 
  Sparkles, 
  Mic, 
  MicOff, 
  Send, 
  Check, 
  Copy, 
  X, 
  Plus, 
  Bot, 
  Video, 
  HardDrive, 
  UserCheck, 
  Clock, 
  Calendar, 
  DollarSign, 
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { getTelegramSettings, sendTelegramMessage } from '../utils/telegram';

const subscribeToGeminiApiKey = (onStoreChange: () => void) => {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener('focus', onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener('focus', onStoreChange);
  };
};

const getGeminiApiKeySnapshot = () => Boolean(getGeminiApiKey());
const getGeminiApiKeyServerSnapshot = () => false;

interface AiCrmAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  employees: Employee[];
  onSaveLead: (lead: CrmLead) => void;
  onSaveReminder?: (reminder: CrmReminder) => void;
  baseCurrency?: Currency;
  exchangeRate?: number;
  onConvertToOrder?: (lead: CrmLead) => void;
}

export const AiCrmAssistantModal: React.FC<AiCrmAssistantModalProps> = ({
  isOpen,
  onClose,
  products,
  employees,
  onSaveLead,
  onSaveReminder,
  baseCurrency = 'UZS',
  exchangeRate = 12850,
  onConvertToOrder
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedResult, setParsedResult] = useState<AiParsedCrmResult | null>(null);
  const [copiedProposal, setCopiedProposal] = useState(false);
  const hasApiKey = useSyncExternalStore(
    subscribeToGeminiApiKey,
    getGeminiApiKeySnapshot,
    getGeminiApiKeyServerSnapshot
  );

  // Escape key handler to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Speech Recognition (Web Speech API)
  const toggleSpeechRecognition = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Brauzeringiz ovozli yozishni (Web Speech) to'liq qo'llab-quvvatlamaydi. Iltimos matnni qo'lda yozing yoki Chrome brauzeridan foydalaning.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'uz-UZ';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(prev => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (event: any) => {
        console.error("Speech error", event);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleRunAI = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    try {
      const res = await processCrmInputWithGemini(inputText, products, employees);
      setParsedResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAsLead = () => {
    if (!parsedResult) return;

    const matchedEmp = employees.find(e => 
      parsedResult.assignedTechnicianName && 
      e.fullName.toLowerCase().includes(parsedResult.assignedTechnicianName.toLowerCase().split(' ')[0])
    );

    const newLead: CrmLead = {
      id: `lead-${Date.now()}`,
      leadNumber: `LID-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: parsedResult.clientName,
      phone: parsedResult.phone,
      address: parsedResult.address,
      source: parsedResult.source || 'phone',
      stage: 'new_lead',
      objectType: parsedResult.objectType || 'xonadon',
      cameraCountEstimated: parsedResult.cameraCountEstimated || 4,
      budgetEstimatedUSD: parsedResult.budgetEstimatedUSD || 300,
      budgetEstimatedUZS: Math.round((parsedResult.budgetEstimatedUSD || 300) * exchangeRate),
      assignedTechnicianId: matchedEmp?.id,
      assignedTechnicianName: matchedEmp?.fullName || parsedResult.assignedTechnicianName,
      siteVisitDate: parsedResult.siteVisitDate,
      siteVisitTime: parsedResult.siteVisitTime,
      notes: parsedResult.notes,
      nextActionNote: parsedResult.nextActionNote,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    onSaveLead(newLead);

    // Also auto-create reminder if date is present
    if (parsedResult.siteVisitDate && onSaveReminder) {
      const newRem: CrmReminder = {
        id: `rem-${Date.now()}`,
        title: `${parsedResult.clientName} - O'lchash-hisoblash / Smeta ko'rigi`,
        customerName: parsedResult.clientName,
        customerPhone: parsedResult.phone,
        type: 'visit',
        dueDate: parsedResult.siteVisitDate,
        dueTime: parsedResult.siteVisitTime || '14:00',
        notes: parsedResult.notes,
        isCompleted: false,
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
      };
      onSaveReminder(newRem);
    }

    onClose();
  };

  const handleCopyProposal = () => {
    if (parsedResult?.commercialProposalText) {
      navigator.clipboard.writeText(parsedResult.commercialProposalText);
      setCopiedProposal(true);
      setTimeout(() => setCopiedProposal(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Gemini AI CRM & Smeta Yordamchisi
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  {hasApiKey ? 'Google Gemini 1.5/2.0' : 'Intelligent Local Engine'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Ovozli xabar yoki yozuvdan avtomatik Lid, Smeta va Tijoriy Taklif tuzish</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Area */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>Ovozli xabar matni yoki mijoz so'rovi:</span>
            <span className="text-[10px] text-slate-500 font-normal">O'zbekcha / Ruscha / Inglizcha</span>
          </label>

          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Masalan: Shoxrux aka, 90 123 45 67, Kosonsoy ko'chasi 45-uy. Hovlisiga 6 ta rangli kamera qo'ymoqchi, 350 dollar byudjeti bor, Dilshod usta ertaga soat 2 da o'lchash-hisoblashga borishi kerak..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none pr-12"
            />
            {/* Mic button inside textarea */}
            <button
              onClick={toggleSpeechRecognition}
              className={`absolute right-3 bottom-3 p-2 rounded-xl transition ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title={isListening ? "Ovoz yozishni to'xtatish" : "Mikrofon orqali gapirish"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-sky-400" />}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Namuna: "Otabek aka 93 987 65 43, 8 ta kamera, magazinga..."</span>
            </div>

            <button
              onClick={handleRunAI}
              disabled={isProcessing || !inputText.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              {isProcessing ? 'AI Tahlil qilmoqda...' : 'AI Tahlil qilish'}
            </button>
          </div>
        </div>

        {/* AI Result Card */}
        {parsedResult && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-black text-indigo-400 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                AI Tahlil Natijalari:
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Aniqlik: Yuqori</span>
            </div>

            {/* Extracted Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Mijoz:</span>
                <span className="font-bold text-white text-xs">{parsedResult.clientName}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Telefon:</span>
                <span className="font-bold text-emerald-400 text-xs">{parsedResult.phone}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Obyekt Turi:</span>
                <span className="font-bold text-slate-200 capitalize">{parsedResult.objectType}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Kameralar:</span>
                <span className="font-extrabold text-sky-400">{parsedResult.cameraCountEstimated || 0} ta</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Taxminiy Byudjet:</span>
                <span className="font-extrabold text-amber-400">${parsedResult.budgetEstimatedUSD || 0}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Biriktirilgan Usta:</span>
                <span className="font-bold text-purple-300">{parsedResult.assignedTechnicianName || 'Belgilanmagan'}</span>
              </div>
            </div>

            {/* Suggested Equipment Breakdown */}
            {parsedResult.recommendedItems && parsedResult.recommendedItems.length > 0 && (
              <div className="space-y-1.5 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tavsiya etilgan tovarlar & xizmatlar:</span>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {parsedResult.recommendedItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-xs">
                      <span className="text-slate-200 font-semibold">{item.productName} ({item.quantity} ta)</span>
                      <span className="font-bold text-amber-400">${item.totalPriceUSD || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Commercial Proposal Text */}
            {parsedResult.commercialProposalText && (
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tayyor Telegram Tijoriy Taklifi:</span>
                  <button
                    onClick={handleCopyProposal}
                    className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-semibold"
                  >
                    {copiedProposal ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedProposal ? "Nusxalandi!" : "Nusxalash"}
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 whitespace-pre-line">
                  {parsedResult.commercialProposalText}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={handleSaveAsLead}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                Lid va Eslatma Yaratish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
