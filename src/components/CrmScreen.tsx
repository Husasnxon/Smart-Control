'use client';

import React, { useState, useMemo } from 'react';
import { 
  CrmLead, 
  CrmObjectPassport, 
  CrmReminder, 
  CrmLeadStage, 
  CrmLeadSource, 
  CrmObjectType,
  Employee,
  Customer,
  CustomerOrder,
  Currency
} from '../types';
import { formatDualMoney, formatMoney, formatUSDNumber, formatNumberWithSpaces } from '../utils/formatters';
import { 
  Users, 
  Kanban, 
  ShieldCheck, 
  CalendarClock, 
  BarChart3, 
  Plus, 
  Search, 
  Phone, 
  Send, 
  MapPin, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  Filter, 
  Printer, 
  Building2, 
  Home, 
  Store, 
  Factory, 
  Video, 
  HardDrive, 
  Key, 
  Lock, 
  UserCheck, 
  Layers, 
  Sparkles, 
  X, 
  Trash2, 
  Edit3, 
  CheckSquare, 
  Square,
  TrendingUp,
  Award,
  FileSpreadsheet
} from 'lucide-react';
import { getTelegramSettings, sendTelegramMessage } from '../utils/telegram';
import { AiCrmAssistantModal } from './AiCrmAssistantModal';
import { Product } from '../types';

interface CrmScreenProps {
  leads: CrmLead[];
  onAddLead: (lead: CrmLead) => void;
  onUpdateLead: (lead: CrmLead) => void;
  onDeleteLead?: (leadId: string) => void;
  objectPassports: CrmObjectPassport[];
  onAddObjectPassport: (obj: CrmObjectPassport) => void;
  onUpdateObjectPassport: (obj: CrmObjectPassport) => void;
  onDeleteObjectPassport?: (objId: string) => void;
  reminders: CrmReminder[];
  onAddReminder: (reminder: CrmReminder) => void;
  onToggleReminder: (reminderId: string) => void;
  onDeleteReminder?: (reminderId: string) => void;
  employees: Employee[];
  customers: Customer[];
  customerOrders: CustomerOrder[];
  products?: Product[];
  baseCurrency?: Currency;
  exchangeRate?: number;
  onConvertToOrder?: (lead: CrmLead) => void;
}

const STAGE_CONFIG: Record<CrmLeadStage, { title: string; color: string; bg: string; border: string; badgeBg: string }> = {
  new_lead: { 
    title: '1. Yangi Murojaat', 
    color: 'text-sky-400', 
    bg: 'bg-sky-950/20', 
    border: 'border-sky-500/30',
    badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/30'
  },
  site_visit: { 
    title: '2. Zamer / O\'lchashda', 
    color: 'text-amber-400', 
    bg: 'bg-amber-950/20', 
    border: 'border-amber-500/30',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  },
  estimate_sent: { 
    title: '3. Smeta Berildi', 
    color: 'text-orange-400', 
    bg: 'bg-orange-950/20', 
    border: 'border-orange-500/30',
    badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/30'
  },
  installation: { 
    title: '4. Montaj & Otgruzka', 
    color: 'text-purple-400', 
    bg: 'bg-purple-950/20', 
    border: 'border-purple-500/30',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
  },
  won: { 
    title: '5. Yopildi (To\'landi)', 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-950/20', 
    border: 'border-emerald-500/30',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  },
  lost: { 
    title: 'Bekor Qilindi / Rad', 
    color: 'text-rose-400', 
    bg: 'bg-rose-950/20', 
    border: 'border-rose-500/30',
    badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
  }
};

const SOURCE_LABELS: Record<CrmLeadSource, { label: string; color: string }> = {
  instagram: { label: 'Instagram / SMM', color: 'text-pink-400 bg-pink-500/10 border-pink-500/30' },
  telegram: { label: 'Telegram', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  phone: { label: 'Qo\'ng\'iroq', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  walk_in: { label: 'Do\'konga keldi', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  recommendation: { label: 'Tavsiya / Mijozdan', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  other: { label: 'Boshqa manba', color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' }
};

const OBJECT_TYPE_LABELS: Record<CrmObjectType, { label: string; icon: any }> = {
  xonadon: { label: 'Hovli / Xonadon', icon: Home },
  dokon: { label: 'Do\'kon / Savdo', icon: Store },
  ofis: { label: 'Ofis / Biznes', icon: Building2 },
  ombor_zavod: { label: 'Zavod / Omborxona', icon: Factory },
  davlat: { label: 'Davlat / Maktab', icon: Building2 },
  boshqa: { label: 'Boshqa obyekt', icon: Video }
};

export const CrmScreen: React.FC<CrmScreenProps> = ({
  leads = [],
  onAddLead,
  onUpdateLead,
  onDeleteLead,
  objectPassports = [],
  onAddObjectPassport,
  onUpdateObjectPassport,
  onDeleteObjectPassport,
  reminders = [],
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  employees = [],
  customers = [],
  customerOrders = [],
  products = [],
  baseCurrency = 'UZS',
  exchangeRate = 12850,
  onConvertToOrder
}) => {
  // Navigation sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'pipeline' | 'passports' | 'reminders' | 'analytics'>('pipeline');

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [selectedTechFilter, setSelectedTechFilter] = useState<string>('all');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Modals state
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isAddPassportModalOpen, setIsAddPassportModalOpen] = useState(false);
  const [isAddReminderModalOpen, setIsAddReminderModalOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<CrmLead | null>(null);
  const [selectedPassportForDetail, setSelectedPassportForDetail] = useState<CrmObjectPassport | null>(null);
  const [printingPassport, setPrintingPassport] = useState<CrmObjectPassport | null>(null);

  // Password visibility map
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // -------------------------------------------------------------
  // 1. CALCULATED METRICS
  // -------------------------------------------------------------
  const totalLeadsCount = leads.length;
  const wonLeadsCount = leads.filter(l => l.stage === 'won').length;
  const activeLeadsCount = leads.filter(l => l.stage !== 'won' && l.stage !== 'lost').length;
  const conversionRate = totalLeadsCount > 0 ? Math.round((wonLeadsCount / totalLeadsCount) * 100) : 0;

  const totalPipelineBudgetUSD = useMemo(() => {
    return leads
      .filter(l => l.stage !== 'lost')
      .reduce((sum, l) => sum + (l.budgetEstimatedUSD || (l.budgetEstimatedUZS ? l.budgetEstimatedUZS / exchangeRate : 0)), 0);
  }, [leads, exchangeRate]);

  const activeRemindersCount = reminders.filter(r => !r.isCompleted).length;

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = 
        lead.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        (lead.address && lead.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
        lead.leadNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStage = selectedStageFilter === 'all' || lead.stage === selectedStageFilter;
      const matchesTech = selectedTechFilter === 'all' || lead.assignedTechnicianId === selectedTechFilter;
      const matchesSource = selectedSourceFilter === 'all' || lead.source === selectedSourceFilter;

      return matchesSearch && matchesStage && matchesTech && matchesSource;
    });
  }, [leads, searchQuery, selectedStageFilter, selectedTechFilter, selectedSourceFilter]);

  // Grouped by stage for Kanban
  const leadsByStage = useMemo(() => {
    const stages: CrmLeadStage[] = ['new_lead', 'site_visit', 'estimate_sent', 'installation', 'won', 'lost'];
    const result: Record<CrmLeadStage, CrmLead[]> = {
      new_lead: [],
      site_visit: [],
      estimate_sent: [],
      installation: [],
      won: [],
      lost: []
    };
    filteredLeads.forEach(l => {
      if (result[l.stage]) {
        result[l.stage].push(l);
      }
    });
    return result;
  }, [filteredLeads]);

  // Filtered Object Passports
  const filteredPassports = useMemo(() => {
    return objectPassports.filter(obj => {
      return (
        obj.objectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obj.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obj.customerPhone.includes(searchQuery) ||
        obj.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (obj.dvrSerialNumber && obj.dvrSerialNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (obj.dvrCloudId && obj.dvrCloudId.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [objectPassports, searchQuery]);

  // Handle stage change
  const handleMoveStage = (lead: CrmLead, nextStage: CrmLeadStage) => {
    const updated: CrmLead = {
      ...lead,
      stage: nextStage,
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    onUpdateLead(updated);
  };

  // -------------------------------------------------------------
  // 2. RENDER: COMPACT SLEEK TOOLBAR & SUB-TABS
  // -------------------------------------------------------------
  return (
    <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col min-h-screen">
      {/* Compact Top Header & Controls (Single sleek row) */}
      <div className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur sticky top-0 z-20 px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Brand + Navigation Pills */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-md">
                <Users className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm text-white tracking-wide">CRM</span>
            </div>

            {/* Sub-Tabs Pills */}
            <div className="flex items-center bg-slate-950/90 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveSubTab('pipeline')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition ${
                  activeSubTab === 'pipeline'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                Voronka
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeSubTab === 'pipeline' ? 'bg-indigo-900 text-indigo-200' : 'bg-slate-800 text-slate-400'
                }`}>
                  {filteredLeads.length}
                </span>
              </button>

              <button
                onClick={() => setActiveSubTab('passports')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition ${
                  activeSubTab === 'passports'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Obyektlar Pasporti
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeSubTab === 'passports' ? 'bg-teal-900 text-teal-200' : 'bg-slate-800 text-slate-400'
                }`}>
                  {filteredPassports.length}
                </span>
              </button>

              <button
                onClick={() => setActiveSubTab('reminders')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition ${
                  activeSubTab === 'reminders'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CalendarClock className="w-3.5 h-3.5" />
                Eslatmalar
                {activeRemindersCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">
                    {activeRemindersCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveSubTab('analytics')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition ${
                  activeSubTab === 'analytics'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Tahlil
              </button>
            </div>
          </div>

          {/* Middle/Right: Compact KPIs & Action Buttons */}
          <div className="flex items-center gap-2">
            {/* AI Assistant Button */}
            <button
              onClick={() => setIsAiAssistantOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 hover:from-purple-500 hover:to-sky-400 text-white font-extrabold text-xs shadow-md shadow-purple-500/20 transition active:scale-95 animate-pulse hover:animate-none"
              title="Ovozli yoki matnli AI orqali tezkor Lid va Smeta ochish"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Yordamchi</span>
            </button>

            {/* Quick Action Buttons */}
            <button
              onClick={() => setIsAddLeadModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Lid qo'shish
            </button>
            <button
              onClick={() => setIsAddPassportModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 font-semibold text-xs transition"
              title="Yangi Obyekt Pasporti"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Obyekt</span>
            </button>
            <button
              onClick={() => setIsAddReminderModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-semibold text-xs transition"
              title="Yangi Eslatma"
            >
              <CalendarClock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Eslatma</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* ========================================================================= */}
        {/* SUB-TAB 1: PIPELINE / KANBAN */}
        {/* ========================================================================= */}
        {activeSubTab === 'pipeline' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Mijoz ismi, telefon, manzil yoki LID raqami bo'yicha qidirish..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Technician filter */}
                <select
                  value={selectedTechFilter}
                  onChange={(e) => setSelectedTechFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">Barcha Ustalar</option>
                  {employees
                    .filter(e => e.role.toLowerCase().includes('usta') || e.role.toLowerCase().includes('muhandis'))
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                    ))}
                </select>

                {/* Source filter */}
                <select
                  value={selectedSourceFilter}
                  onChange={(e) => setSelectedSourceFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">Barcha Manbalar</option>
                  <option value="instagram">Instagram / SMM</option>
                  <option value="telegram">Telegram</option>
                  <option value="phone">Qo'ng'iroq</option>
                  <option value="walk_in">Do'konga kelgan</option>
                  <option value="recommendation">Tavsiya</option>
                </select>

                {/* View Mode */}
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                      viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Kanban className="w-3.5 h-3.5" />
                    Kanban
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                      viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Jadval
                  </button>
                </div>
              </div>
            </div>

            {/* Kanban Board View */}
            {viewMode === 'kanban' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 min-h-[500px]">
                {(['new_lead', 'site_visit', 'estimate_sent', 'installation', 'won', 'lost'] as CrmLeadStage[]).map((stageKey) => {
                  const stageConf = STAGE_CONFIG[stageKey];
                  const stageLeads = leadsByStage[stageKey] || [];
                  const stageTotalBudget = stageLeads.reduce((s, l) => s + (l.budgetEstimatedUSD || 0), 0);

                  return (
                    <div
                      key={stageKey}
                      className={`flex flex-col rounded-2xl border ${stageConf.border} ${stageConf.bg} p-3 transition`}
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800/80">
                        <div>
                          <h3 className={`text-xs font-black ${stageConf.color} tracking-wide`}>
                            {stageConf.title}
                          </h3>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            {stageLeads.length} ta • ${formatUSDNumber(stageTotalBudget)}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${stageConf.badgeBg} border`}>
                          {stageLeads.length}
                        </span>
                      </div>

                      {/* Lead Cards List */}
                      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[70vh] pr-0.5">
                        {stageLeads.map((lead) => {
                          const srcInfo = SOURCE_LABELS[lead.source] || SOURCE_LABELS.other;
                          const objInfo = OBJECT_TYPE_LABELS[lead.objectType] || OBJECT_TYPE_LABELS.boshqa;
                          const ObjIcon = objInfo.icon;

                          return (
                            <div
                              key={lead.id}
                              className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 shadow-md hover:shadow-indigo-500/5 transition space-y-2 group"
                            >
                              {/* Top row: Number & Source */}
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                  {lead.leadNumber}
                                </span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${srcInfo.color}`}>
                                  {srcInfo.label}
                                </span>
                              </div>

                              {/* Client Info */}
                              <div>
                                <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition flex items-center gap-1.5">
                                  <ObjIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate">{lead.clientName}</span>
                                </h4>
                                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-300">
                                  <a
                                    href={`tel:${lead.phone.replace(/\s+/g, '')}`}
                                    className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition"
                                  >
                                    <Phone className="w-3 h-3 text-emerald-400" />
                                    {lead.phone}
                                  </a>
                                  {lead.phone && (
                                    <a
                                      href={`https://t.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1 rounded bg-sky-500/10 text-sky-400 hover:bg-sky-500/20"
                                      title="Telegram orqali yozish"
                                    >
                                      <Send className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* Facility / Address */}
                              {lead.address && (
                                <p className="text-[10px] text-slate-400 flex items-start gap-1 line-clamp-1">
                                  <MapPin className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                                  {lead.address}
                                </p>
                              )}

                              {/* Specs & Budget */}
                              <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-[11px]">
                                <div>
                                  <span className="text-[10px] text-slate-400">Kamera:</span>{' '}
                                  <span className="font-bold text-slate-200">{lead.cameraCountEstimated || 0} ta</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-extrabold text-amber-400">
                                    ${formatUSDNumber(lead.budgetEstimatedUSD || 0)}
                                  </span>
                                </div>
                              </div>

                              {/* Assigned Technician */}
                              {lead.assignedTechnicianName && (
                                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                                  <span className="flex items-center gap-1">
                                    <UserCheck className="w-3 h-3 text-purple-400" />
                                    {lead.assignedTechnicianName}
                                  </span>
                                  {lead.siteVisitDate && (
                                    <span className="text-amber-400 font-medium">
                                      {lead.siteVisitDate.slice(5)} {lead.siteVisitTime || ''}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Next Action reminder */}
                              {lead.nextActionNote && (
                                <div className="p-1.5 rounded bg-amber-500/5 border border-amber-500/20 text-[10px] text-amber-300">
                                  <span className="font-semibold text-amber-400">Keyingi qadam:</span> {lead.nextActionNote}
                                </div>
                              )}

                              {/* Action Footer: Move forward / convert */}
                              <div className="flex items-center justify-between gap-1 pt-1">
                                <button
                                  onClick={() => setSelectedLeadForDetail(lead)}
                                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition"
                                >
                                  Batafsil
                                </button>

                                <div className="flex items-center gap-1">
                                  {/* Quick convert to estimate/order */}
                                  {onConvertToOrder && (
                                    <button
                                      onClick={() => onConvertToOrder(lead)}
                                      className="px-2 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[10px] font-bold border border-indigo-500/30 transition"
                                      title="Smeta hisoblashga o'tkazish"
                                    >
                                      Smeta
                                    </button>
                                  )}

                                  {/* Stage switcher dropdown */}
                                  <select
                                    value={lead.stage}
                                    onChange={(e) => handleMoveStage(lead, e.target.value as CrmLeadStage)}
                                    className="px-1.5 py-1 bg-slate-950 border border-slate-700 rounded text-[10px] text-slate-300 font-semibold focus:outline-none"
                                  >
                                    <option value="new_lead">1. Yangi</option>
                                    <option value="site_visit">2. Zamer</option>
                                    <option value="estimate_sent">3. Smeta</option>
                                    <option value="installation">4. Montaj</option>
                                    <option value="won">5. Yopildi</option>
                                    <option value="lost">Rad</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {stageLeads.length === 0 && (
                          <div className="py-8 text-center text-[11px] text-slate-400 border border-dashed border-slate-800/80 rounded-xl">
                            Hozircha lid yo'q
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Table View */
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">LID #</th>
                        <th className="px-4 py-3">Mijoz / Telefon</th>
                        <th className="px-4 py-3">Obyekt turi & Manzil</th>
                        <th className="px-4 py-3">Manba</th>
                        <th className="px-4 py-3">Kameralar</th>
                        <th className="px-4 py-3">Byudjet ($ / UZS)</th>
                        <th className="px-4 py-3">Biriktirilgan Usta</th>
                        <th className="px-4 py-3">Holat (Bosqich)</th>
                        <th className="px-4 py-3 text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredLeads.map((lead) => {
                        const stageConf = STAGE_CONFIG[lead.stage];
                        const srcInfo = SOURCE_LABELS[lead.source] || SOURCE_LABELS.other;
                        const objInfo = OBJECT_TYPE_LABELS[lead.objectType] || OBJECT_TYPE_LABELS.boshqa;

                        return (
                          <tr key={lead.id} className="hover:bg-slate-800/40 transition">
                            <td className="px-4 py-3 font-mono font-bold text-slate-400">
                              {lead.leadNumber}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-white">{lead.clientName}</div>
                              <a href={`tel:${lead.phone}`} className="text-[11px] text-emerald-400 hover:underline">
                                {lead.phone}
                              </a>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-slate-200 font-semibold">{objInfo.label}</div>
                              <div className="text-[10px] text-slate-400 truncate max-w-xs">{lead.address || '-'}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${srcInfo.color}`}>
                                {srcInfo.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-200">
                              {lead.cameraCountEstimated ? `${lead.cameraCountEstimated} ta` : '-'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-extrabold text-amber-400">${formatUSDNumber(lead.budgetEstimatedUSD || 0)}</div>
                              <div className="text-[10px] text-slate-400">
                                {formatNumberWithSpaces(lead.budgetEstimatedUZS || Math.round((lead.budgetEstimatedUSD || 0) * exchangeRate))} so'm
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-300">
                              {lead.assignedTechnicianName || <span className="text-slate-400">Biriktirilmagan</span>}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${stageConf.badgeBg}`}>
                                {stageConf.title}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setSelectedLeadForDetail(lead)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                                  title="Ko'rish"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {onConvertToOrder && (
                                  <button
                                    onClick={() => onConvertToOrder(lead)}
                                    className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                                    title="Smeta tuzish"
                                  >
                                    <FileSpreadsheet className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-TAB 2: OBYEKTLAR VA QURILMALAR PASPORTI */}
        {/* ========================================================================= */}
        {activeSubTab === 'passports' && (
          <div className="space-y-4">
            {/* Search & Action bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Obyekt nomi, mijoz, DVR S/N, Cloud ID yoki manzil bo'yicha qidirish..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                onClick={() => setIsAddPassportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-teal-600/20 transition"
              >
                <Plus className="w-4 h-4" />
                Yangi Obyekt Pasporti
              </button>
            </div>

            {/* Object Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPassports.map((obj) => {
                const objInfo = OBJECT_TYPE_LABELS[obj.objectType] || OBJECT_TYPE_LABELS.boshqa;
                const ObjIcon = objInfo.icon;
                const isPasswordShown = visiblePasswords[obj.id] || false;

                // Calculate warranty remaining
                const expiresDate = new Date(obj.warrantyExpiresAt);
                const today = new Date();
                const diffTime = expiresDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const isWarrantyActive = diffDays > 0;

                return (
                  <div
                    key={obj.id}
                    className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-teal-500/40 shadow-xl transition space-y-3.5 group flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span className="text-[11px] font-mono font-bold text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-500/30">
                          {obj.passportNumber}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                            isWarrantyActive 
                              ? diffDays < 30 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}>
                            {isWarrantyActive ? `Kafolat: ${diffDays} kun qoldi` : 'Kafolat muddati tugagan'}
                          </span>
                        </div>
                      </div>

                      {/* Object Title & Customer */}
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                            <ObjIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white group-hover:text-teal-300 transition line-clamp-1">
                              {obj.objectName}
                            </h3>
                            <p className="text-xs text-slate-400 font-medium">{obj.customerName}</p>
                          </div>
                        </div>
                      </div>

                      {/* Contact & Address */}
                      <div className="space-y-1.5 text-xs text-slate-300 mt-2">
                        <div className="flex items-center justify-between">
                          <a href={`tel:${obj.customerPhone}`} className="flex items-center gap-1.5 text-emerald-400 hover:underline">
                            <Phone className="w-3.5 h-3.5" />
                            {obj.customerPhone}
                          </a>
                          {obj.mapLocationUrl && (
                            <a
                              href={obj.mapLocationUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
                            >
                              <MapPin className="w-3 h-3 text-rose-400" />
                              Xaritada ko'rish
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 flex items-start gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                          {obj.address}
                        </p>
                      </div>

                      {/* CCTV Hardware Details Box */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs mt-3">
                        <div className="flex items-center justify-between text-slate-300 font-medium">
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <Video className="w-3.5 h-3.5 text-cyan-400" />
                            Kameralar:
                          </span>
                          <span className="font-bold text-white">{obj.installedCamerasCount} ta nuqta</span>
                        </div>

                        {obj.dvrModel && (
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-400 text-[11px]">Registrator:</span>
                            <span className="font-semibold text-slate-200 text-[11px] truncate max-w-[180px]">{obj.dvrModel}</span>
                          </div>
                        )}

                        {obj.dvrCloudId && (
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-400 text-[11px]">Cloud ID:</span>
                            <span className="font-mono text-xs text-sky-400 font-bold">{obj.dvrCloudId}</span>
                          </div>
                        )}

                        {obj.hddCapacity && (
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-400 text-[11px] flex items-center gap-1">
                              <HardDrive className="w-3 h-3 text-purple-400" />
                              Xotira (HDD):
                            </span>
                            <span className="text-purple-300 font-semibold text-[11px]">{obj.hddCapacity}</span>
                          </div>
                        )}

                        {/* DVR Credentials (Secure / Copyable) */}
                        {(obj.dvrAdminLogin || obj.dvrAdminPassword) && (
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between bg-slate-900/60 p-2 rounded-lg">
                            <div className="flex items-center gap-2 text-[11px]">
                              <Key className="w-3.5 h-3.5 text-amber-400" />
                              <span className="text-slate-400">Login:</span>
                              <span className="font-mono font-bold text-white">{obj.dvrAdminLogin || 'admin'}</span>
                              <span className="text-slate-400 ml-1">Parol:</span>
                              <span className="font-mono font-bold text-amber-300">
                                {isPasswordShown ? (obj.dvrAdminPassword || '******') : '••••••••'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => togglePasswordVisibility(obj.id)}
                                className="p-1 text-slate-400 hover:text-white"
                                title="Parolni ko'rsatish/yashirish"
                              >
                                {isPasswordShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => copyToClipboard(obj.dvrAdminPassword || '', `pwd-${obj.id}`)}
                                className="p-1 text-slate-400 hover:text-white"
                                title="Parolni nusxalash"
                              >
                                {copiedId === `pwd-${obj.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Installed Items Preview */}
                      {obj.installedItems && obj.installedItems.length > 0 && (
                        <div className="space-y-1 text-[11px] mt-2">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">O'rnatilgan uskunalar (S/N):</p>
                          <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                            {obj.installedItems.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-slate-300 bg-slate-950/60 px-2 py-1 rounded border border-slate-800/60">
                                <span className="truncate max-w-[150px]">{item.productName}</span>
                                {item.serialNumber && (
                                  <span className="font-mono text-[10px] text-teal-400 font-semibold">{item.serialNumber}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
                      <button
                        onClick={() => setSelectedPassportForDetail(obj)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition text-center"
                      >
                        Batafsil / Tahrirlash
                      </button>
                      <button
                        onClick={() => setPrintingPassport(obj)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="Pasportni chop etish"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredPassports.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
                  <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-300">Obyekt pasportlari topilmadi</p>
                  <p className="text-xs text-slate-400 mt-1">Yangi obyekt qo'shish uchun yuqoridagi tugmani bosing</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-TAB 3: ESLATMALAR VA REJALAR */}
        {/* ========================================================================= */}
        {activeSubTab === 'reminders' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">Rejalashtirilgan Qo'ng'iroqlar va Profilaktikalar</h3>
                <p className="text-xs text-slate-400">Mijozlar bilan qayta bog'lanish, zamerlar va kafolatli profilaktikalar</p>
              </div>
              <button
                onClick={() => setIsAddReminderModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-600/20 transition"
              >
                <Plus className="w-4 h-4" />
                Yangi Eslatma
              </button>
            </div>

            <div className="space-y-2.5">
              {reminders.map((rem) => {
                return (
                  <div
                    key={rem.id}
                    className={`p-4 rounded-2xl border transition flex items-center justify-between gap-4 ${
                      rem.isCompleted
                        ? 'bg-slate-950/60 border-slate-850 opacity-60'
                        : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/40 shadow-lg'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => onToggleReminder(rem.id)}
                        className="mt-0.5 text-slate-400 hover:text-amber-400 transition"
                      >
                        {rem.isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </button>

                      <div>
                        <h4 className={`text-sm font-bold ${rem.isCompleted ? 'line-through text-slate-400' : 'text-white'}`}>
                          {rem.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
                          <span className="font-semibold text-slate-200">{rem.customerName}</span>
                          <a href={`tel:${rem.customerPhone}`} className="text-emerald-400 hover:underline flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {rem.customerPhone}
                          </a>
                        </div>
                        {rem.notes && (
                          <p className="text-xs text-slate-400 mt-1">{rem.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className="text-xs font-extrabold text-amber-400 flex items-center gap-1 justify-end">
                          <Clock className="w-3.5 h-3.5" />
                          {rem.dueDate} {rem.dueTime || ''}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${
                          rem.type === 'call' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                          rem.type === 'visit' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          rem.type === 'maintenance' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                          'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}>
                          {rem.type === 'call' ? 'Qo\'ng\'iroq' : rem.type === 'visit' ? 'Zamerga borish' : rem.type === 'maintenance' ? 'Profilaktika' : 'Qarz eslatish'}
                        </span>
                      </div>

                      {onDeleteReminder && (
                        <button
                          onClick={() => onDeleteReminder(rem.id)}
                          className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                          title="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {reminders.length === 0 && (
                <div className="py-12 text-center text-slate-400 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
                  <CalendarClock className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-300">Hozircha eslatmalar yo'q</p>
                  <p className="text-xs text-slate-400 mt-1">Yangi eslatma yaratish uchun yuqoridagi tugmani bosing</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-TAB 4: ANALYTICS */}
        {/* ========================================================================= */}
        {activeSubTab === 'analytics' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Conversion Funnel Card */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                Lidlar Voronkasi va Bosqichlar Konversiyasi
              </h3>

              <div className="space-y-3">
                {(['new_lead', 'site_visit', 'estimate_sent', 'installation', 'won'] as CrmLeadStage[]).map((stageKey, idx) => {
                  const stageConf = STAGE_CONFIG[stageKey];
                  const count = leads.filter(l => l.stage === stageKey).length;
                  const percent = totalLeadsCount > 0 ? Math.round((count / totalLeadsCount) * 100) : 0;

                  return (
                    <div key={stageKey} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className={stageConf.color}>{stageConf.title}</span>
                        <span className="text-slate-300">{count} ta ({percent}%)</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-indigo-500 to-purple-500"
                          style={{ width: `${Math.max(percent, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sources & Technician breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* By Source */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  Murojaat Manbalari Tahlili
                </h4>
                <div className="space-y-2">
                  {Object.entries(SOURCE_LABELS).map(([srcKey, info]) => {
                    const count = leads.filter(l => l.source === srcKey).length;
                    return (
                      <div key={srcKey} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                        <span className={`font-semibold px-2 py-0.5 rounded-full border ${info.color}`}>
                          {info.label}
                        </span>
                        <span className="font-extrabold text-white">{count} ta lid</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* By Object Type */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-400" />
                  Obyektlar Turi Bo'yicha
                </h4>
                <div className="space-y-2">
                  {Object.entries(OBJECT_TYPE_LABELS).map(([typeKey, info]) => {
                    const count = objectPassports.filter(o => o.objectType === typeKey).length;
                    const Icon = info.icon;
                    return (
                      <div key={typeKey} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                        <span className="flex items-center gap-2 text-slate-300 font-semibold">
                          <Icon className="w-4 h-4 text-teal-400" />
                          {info.label}
                        </span>
                        <span className="font-extrabold text-teal-300">{count} ta obyekt</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW LEAD */}
      {/* ========================================================================= */}
      {isAddLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Yangi Lid / Mijoz Murojaati
              </h3>
              <button onClick={() => setIsAddLeadModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const clientName = (form.elements.namedItem('clientName') as HTMLInputElement).value;
                const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;
                const address = (form.elements.namedItem('address') as HTMLInputElement).value;
                const source = (form.elements.namedItem('source') as HTMLSelectElement).value as CrmLeadSource;
                const objectType = (form.elements.namedItem('objectType') as HTMLSelectElement).value as CrmObjectType;
                const cameraCount = Number((form.elements.namedItem('cameraCount') as HTMLInputElement).value) || 0;
                const budgetUSD = Number((form.elements.namedItem('budgetUSD') as HTMLInputElement).value) || 0;
                const techId = (form.elements.namedItem('technicianId') as HTMLSelectElement).value;
                const siteVisitDate = (form.elements.namedItem('siteVisitDate') as HTMLInputElement).value;
                const siteVisitTime = (form.elements.namedItem('siteVisitTime') as HTMLInputElement).value;
                const notes = (form.elements.namedItem('notes') as HTMLTextAreaElement).value;
                const nextActionNote = (form.elements.namedItem('nextActionNote') as HTMLInputElement).value;

                const assignedEmp = employees.find(emp => emp.id === techId);

                const newLead: CrmLead = {
                  id: `lead-${Date.now()}`,
                  leadNumber: `LID-${1000 + leads.length + 1}`,
                  clientName,
                  phone,
                  address,
                  source,
                  stage: 'new_lead',
                  objectType,
                  cameraCountEstimated: cameraCount,
                  budgetEstimatedUSD: budgetUSD,
                  budgetEstimatedUZS: Math.round(budgetUSD * exchangeRate),
                  assignedTechnicianId: techId || undefined,
                  assignedTechnicianName: assignedEmp?.fullName,
                  siteVisitDate: siteVisitDate || undefined,
                  siteVisitTime: siteVisitTime || undefined,
                  notes,
                  nextActionNote,
                  createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
                  updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
                };

                onAddLead(newLead);
                setIsAddLeadModalOpen(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-bold mb-1">Mijoz Ismi / Korxona *</label>
                <input
                  name="clientName"
                  required
                  placeholder="Masalan: Jasur Rahimov yoki Grand MCHJ"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Telefon Raqami *</label>
                  <input
                    name="phone"
                    required
                    defaultValue="+998 "
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Murojaat Manbasi</label>
                  <select
                    name="source"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="phone">Qo'ng'iroq</option>
                    <option value="instagram">Instagram / SMM</option>
                    <option value="telegram">Telegram</option>
                    <option value="walk_in">Do'konga kelgan</option>
                    <option value="recommendation">Tavsiya</option>
                    <option value="other">Boshqa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Obyekt Turi</label>
                <select
                  name="objectType"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="xonadon">Hovli / Xonadon</option>
                  <option value="dokon">Do'kon / Savdo majmuasi</option>
                  <option value="ofis">Ofis / Biznes markaz</option>
                  <option value="ombor_zavod">Omborxona / Zavod</option>
                  <option value="davlat">Davlat tashkiloti / Maktab</option>
                  <option value="boshqa">Boshqa</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Manzil / Mo'ljal</label>
                <input
                  name="address"
                  placeholder="Namangan sh., Chorsu bozori yaqinida"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Taxminiy Kameralar (ta)</label>
                  <input
                    name="cameraCount"
                    type="number"
                    min="1"
                    placeholder="4"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Taxminiy Byudjet ($)</label>
                  <input
                    name="budgetUSD"
                    type="number"
                    min="0"
                    placeholder="350"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <label className="block text-slate-300 font-bold">Zamer / Usta biriktirish</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-1">
                    <select
                      name="technicianId"
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-indigo-500 focus:outline-none text-xs"
                    >
                      <option value="">Usta tanlash</option>
                      {employees
                        .filter(e => e.role.toLowerCase().includes('usta') || e.role.toLowerCase().includes('muhandis'))
                        .map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <input
                      name="siteVisitDate"
                      type="date"
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-indigo-500 focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <input
                      name="siteVisitTime"
                      type="time"
                      placeholder="14:00"
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-indigo-500 focus:outline-none text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Keyingi Qadam / Eslatma</label>
                <input
                  name="nextActionNote"
                  placeholder="Ertaga 14:00 da qo'ng'iroq qilish va smetani ko'rish"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Qo'shimcha Izoh</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Mijoz talablari va istaklari..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddLeadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-600/20"
                >
                  Lidni Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT OBJECT PASSPORT */}
      {/* ========================================================================= */}
      {isAddPassportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
                Yangi Obyekt & Texnik Pasport Yaratish
              </h3>
              <button onClick={() => setIsAddPassportModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const objectName = (form.elements.namedItem('objectName') as HTMLInputElement).value;
                const customerName = (form.elements.namedItem('customerName') as HTMLInputElement).value;
                const customerPhone = (form.elements.namedItem('customerPhone') as HTMLInputElement).value;
                const address = (form.elements.namedItem('address') as HTMLInputElement).value;
                const objectType = (form.elements.namedItem('objectType') as HTMLSelectElement).value as CrmObjectType;
                const mapLocationUrl = (form.elements.namedItem('mapLocationUrl') as HTMLInputElement).value;
                const dvrModel = (form.elements.namedItem('dvrModel') as HTMLInputElement).value;
                const dvrSerialNumber = (form.elements.namedItem('dvrSerialNumber') as HTMLInputElement).value;
                const dvrCloudId = (form.elements.namedItem('dvrCloudId') as HTMLInputElement).value;
                const dvrAdminLogin = (form.elements.namedItem('dvrAdminLogin') as HTMLInputElement).value;
                const dvrAdminPassword = (form.elements.namedItem('dvrAdminPassword') as HTMLInputElement).value;
                const installedCamerasCount = Number((form.elements.namedItem('installedCamerasCount') as HTMLInputElement).value) || 1;
                const hddCapacity = (form.elements.namedItem('hddCapacity') as HTMLInputElement).value;
                const warrantyMonths = Number((form.elements.namedItem('warrantyMonths') as HTMLInputElement).value) || 12;
                const technicianName = (form.elements.namedItem('technicianName') as HTMLInputElement).value;
                const notes = (form.elements.namedItem('notes') as HTMLTextAreaElement).value;

                const installDate = new Date();
                const expireDate = new Date();
                expireDate.setMonth(expireDate.getMonth() + warrantyMonths);

                const newPassport: CrmObjectPassport = {
                  id: `obj-${Date.now()}`,
                  passportNumber: `OBY-${1000 + objectPassports.length + 1}`,
                  objectName,
                  customerName,
                  customerPhone,
                  address,
                  objectType,
                  mapLocationUrl: mapLocationUrl || undefined,
                  dvrModel: dvrModel || undefined,
                  dvrSerialNumber: dvrSerialNumber || undefined,
                  dvrCloudId: dvrCloudId || undefined,
                  dvrAdminLogin: dvrAdminLogin || 'admin',
                  dvrAdminPassword: dvrAdminPassword || undefined,
                  installedCamerasCount,
                  hddCapacity: hddCapacity || undefined,
                  installedItems: [],
                  installationDate: installDate.toISOString().slice(0, 10),
                  warrantyMonths,
                  warrantyExpiresAt: expireDate.toISOString().slice(0, 10),
                  installedByTechnicianName: technicianName || undefined,
                  notes: notes || undefined,
                  createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
                };

                onAddObjectPassport(newPassport);
                setIsAddPassportModalOpen(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-bold mb-1">Obyekt Nomi *</label>
                <input
                  name="objectName"
                  required
                  placeholder="Masalan: Chorsu Savdo Markazi 3-do'kon"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Mijoz F.I.Sh. *</label>
                  <input
                    name="customerName"
                    required
                    placeholder="Akmal Rahmonov"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Telefon Raqami *</label>
                  <input
                    name="customerPhone"
                    required
                    defaultValue="+998 "
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Obyekt Turi</label>
                  <select
                    name="objectType"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500 focus:outline-none"
                  >
                    <option value="dokon">Do'kon / Savdo</option>
                    <option value="xonadon">Hovli / Xonadon</option>
                    <option value="ofis">Ofis / Biznes</option>
                    <option value="ombor_zavod">Omborxona / Zavod</option>
                    <option value="boshqa">Boshqa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">O'rnatilgan Kameralar soni</label>
                  <input
                    name="installedCamerasCount"
                    type="number"
                    min="1"
                    defaultValue="4"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">To'liq Manzil</label>
                <input
                  name="address"
                  required
                  placeholder="Namangan sh., Navoiy ko'chasi 14-uy"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Xarita / Lokatsiya havolasi (Google / Yandex)</label>
                <input
                  name="mapLocationUrl"
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* DVR / NVR Hardware Details */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <p className="font-bold text-teal-400">DVR / NVR Qurilma Ma'lumotlari</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Registrator Modeli</label>
                    <input
                      name="dvrModel"
                      placeholder="Hikvision DS-7608NI 8CH"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Registrator S/N</label>
                    <input
                      name="dvrSerialNumber"
                      placeholder="NVR-7608-5521"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-teal-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Cloud ID (Hik/DMSS)</label>
                    <input
                      name="dvrCloudId"
                      placeholder="984128941"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-teal-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Admin Login</label>
                    <input
                      name="dvrAdminLogin"
                      defaultValue="admin"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-teal-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Admin Parol</label>
                    <input
                      name="dvrAdminPassword"
                      placeholder="Admin!2026*"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-teal-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Xotira (HDD)</label>
                    <input
                      name="hddCapacity"
                      placeholder="4 TB WD Purple"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Kafolat Muddati (oy)</label>
                    <input
                      name="warrantyMonths"
                      type="number"
                      defaultValue="24"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-teal-500 focus:outline-none font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">O'rnatgan Usta</label>
                <input
                  name="technicianName"
                  placeholder="Dilshod Karimov"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Texnik Izoh</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Sozlamalar, ulanish portlari va tavsiyalar..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddPassportModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-lg shadow-teal-600/20"
                >
                  Pasportni Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD REMINDER */}
      {/* ========================================================================= */}
      {isAddReminderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-amber-400" />
                Yangi Eslatma / Reja
              </h3>
              <button onClick={() => setIsAddReminderModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const title = (form.elements.namedItem('title') as HTMLInputElement).value;
                const customerName = (form.elements.namedItem('customerName') as HTMLInputElement).value;
                const customerPhone = (form.elements.namedItem('customerPhone') as HTMLInputElement).value;
                const type = (form.elements.namedItem('type') as HTMLSelectElement).value as any;
                const dueDate = (form.elements.namedItem('dueDate') as HTMLInputElement).value;
                const dueTime = (form.elements.namedItem('dueTime') as HTMLInputElement).value;
                const notes = (form.elements.namedItem('notes') as HTMLTextAreaElement).value;

                const newReminder: CrmReminder = {
                  id: `rem-${Date.now()}`,
                  title,
                  customerName,
                  customerPhone,
                  type,
                  dueDate,
                  dueTime: dueTime || undefined,
                  notes: notes || undefined,
                  isCompleted: false,
                  createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
                };

                onAddReminder(newReminder);
                setIsAddReminderModalOpen(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-bold mb-1">Eslatma Mavzusi *</label>
                <input
                  name="title"
                  required
                  placeholder="Masalan: Smeta bo'yicha javobini bilish"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Mijoz Ismi *</label>
                  <input
                    name="customerName"
                    required
                    placeholder="Otabek aka"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Telefon Raqami *</label>
                  <input
                    name="customerPhone"
                    required
                    defaultValue="+998 "
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Eslatma Turi</label>
                <select
                  name="type"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="call">Telefon orqali qo'ng'iroq qilish</option>
                  <option value="visit">Zamer / Obyektga borish</option>
                  <option value="maintenance">Rejali profilaktika / Servis</option>
                  <option value="debt_reminder">Nasiya / Qarz eslatish</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Sana *</label>
                  <input
                    name="dueDate"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Vaqt</label>
                  <input
                    name="dueTime"
                    type="time"
                    defaultValue="14:00"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Izoh</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Qo'shimcha tafsilotlar..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddReminderModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-600/20"
                >
                  Eslatmani Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PRINTABLE OBJECT TECHNICAL PASSPORT */}
      {/* ========================================================================= */}
      {printingPassport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-white text-slate-900 rounded-2xl p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto print:p-0 print:m-0 print:shadow-none">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">SMART CONTROL</h2>
                <p className="text-xs uppercase tracking-wider text-slate-600 font-bold">Xavfsizlik Tizimlari & Kuzatuv Texnik Pasporti</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-mono font-black text-slate-900">{printingPassport.passportNumber}</span>
                <p className="text-xs text-slate-500">Sana: {printingPassport.installationDate}</p>
              </div>
            </div>

            {/* Client & Facility details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">Buyurtmachi & Obyekt:</p>
                <p className="font-extrabold text-sm text-slate-900">{printingPassport.customerName}</p>
                <p className="text-slate-700">{printingPassport.objectName}</p>
                <p className="text-slate-600">{printingPassport.address}</p>
                <p className="font-bold text-slate-900">{printingPassport.customerPhone}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">Kafolat & Montajchi:</p>
                <p className="font-bold text-slate-900">Kafolat: {printingPassport.warrantyMonths} oy</p>
                <p className="text-slate-600">Amal qilish muddati: <span className="font-bold text-slate-900">{printingPassport.warrantyExpiresAt}</span></p>
                <p className="text-slate-600">O'rnatgan usta: <span className="font-bold text-slate-900">{printingPassport.installedByTechnicianName || '-'}</span></p>
              </div>
            </div>

            {/* DVR Technical Config */}
            <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 border-b border-slate-300">
                1. Registrator (DVR/NVR) Sozlamalari
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500">Model:</span> <span className="font-bold text-slate-900">{printingPassport.dvrModel || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Seriya raqami (S/N):</span> <span className="font-mono font-bold text-slate-900">{printingPassport.dvrSerialNumber || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Cloud ID / Hik-Connect:</span> <span className="font-mono font-bold text-slate-900">{printingPassport.dvrCloudId || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Xotira (HDD):</span> <span className="font-bold text-slate-900">{printingPassport.hddCapacity || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Admin Login:</span> <span className="font-mono font-bold text-slate-900">{printingPassport.dvrAdminLogin || 'admin'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Admin Parol:</span> <span className="font-mono font-bold text-slate-900">{printingPassport.dvrAdminPassword || '******'}</span>
                </div>
              </div>
            </div>

            {/* Installed Cameras */}
            {printingPassport.installedItems && printingPassport.installedItems.length > 0 && (
              <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 border-b border-slate-300">
                  2. O'rnatilgan Kameralar va Nuqtalar
                </div>
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Uskuna Nomi</th>
                      <th className="px-3 py-2">Seriya Raqami (S/N)</th>
                      <th className="px-3 py-2">O'rnatilgan Joyi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {printingPassport.installedItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 font-bold">{idx + 1}</td>
                        <td className="px-3 py-2 font-semibold">{item.productName}</td>
                        <td className="px-3 py-2 font-mono">{item.serialNumber || '-'}</td>
                        <td className="px-3 py-2 text-slate-600">{item.locationInFacility || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Signatures */}
            <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-xs">
              <div>
                <p className="font-bold text-slate-900">Usta / Muhandis:</p>
                <div className="mt-8 border-b border-slate-400 w-48" />
                <p className="text-[10px] text-slate-500 mt-1">Imzo & F.I.Sh.</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="font-bold text-slate-900">Mijoz / Qabul qiluvchi:</p>
                <div className="mt-8 border-b border-slate-400 w-48" />
                <p className="text-[10px] text-slate-500 mt-1">Imzo & F.I.Sh.</p>
              </div>
            </div>

            {/* Print Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 print:hidden">
              <button
                onClick={() => setPrintingPassport(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs"
              >
                Yopish
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-lg"
              >
                <Printer className="w-4 h-4" />
                Chop Etish (PDF)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI CRM & Smeta Assistant Modal */}
      <AiCrmAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        products={products}
        employees={employees}
        onSaveLead={onAddLead}
        onSaveReminder={onAddReminder}
        baseCurrency={baseCurrency}
        exchangeRate={exchangeRate}
        onConvertToOrder={onConvertToOrder}
      />
    </div>
  );
};
