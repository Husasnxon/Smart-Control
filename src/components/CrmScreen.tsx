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
  OrderItem,
  Product,
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
  FileSpreadsheet,
  Save,
  QrCode,
  Compass
} from 'lucide-react';
import { getTelegramSettings, sendTelegramMessage } from '../utils/telegram';
import { AiCrmAssistantModal } from './AiCrmAssistantModal';
import { InteractiveFloorPlanEditor } from './InteractiveFloorPlanEditor';
import { ObjectQrPassportModal } from './ObjectQrPassportModal';

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
  onSaveOrder?: (order: CustomerOrder) => void;
  onNavigateToOrders?: () => void;
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
    title: '2. O\'lchash-hisoblash', 
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
  onConvertToOrder,
  onSaveOrder,
  onNavigateToOrders
}) => {
  // Navigation sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'pipeline' | 'passports' | 'reminders' | 'analytics'>('pipeline');

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [selectedTechFilter, setSelectedTechFilter] = useState<string>('all');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Drag & Drop state
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<CrmLeadStage | null>(null);

  // Modals state
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isAddPassportModalOpen, setIsAddPassportModalOpen] = useState(false);
  const [isAddReminderModalOpen, setIsAddReminderModalOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<CrmLead | null>(null);
  const [selectedPassportForDetail, setSelectedPassportForDetail] = useState<CrmObjectPassport | null>(null);
  const [selectedPassportForFloorPlan, setSelectedPassportForFloorPlan] = useState<CrmObjectPassport | null>(null);
  const [selectedPassportForQr, setSelectedPassportForQr] = useState<CrmObjectPassport | null>(null);
  const [printingPassport, setPrintingPassport] = useState<CrmObjectPassport | null>(null);

  // Integrated Lead Smeta Creator Modal State
  const [selectedLeadForEstimate, setSelectedLeadForEstimate] = useState<CrmLead | null>(null);
  const [estimateItems, setEstimateItems] = useState<OrderItem[]>([]);
  const [estimateCurrency, setEstimateCurrency] = useState<'UZS' | 'USD'>('USD');
  const [estimateTechId, setEstimateTechId] = useState<string>('');
  const [estimateDiscountPercent, setEstimateDiscountPercent] = useState<number>(0);
  const [estimateProductSearch, setEstimateProductSearch] = useState<string>('');

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

  // Open Integrated Estimate Modal for a Lead
  const handleOpenEstimateModal = (lead: CrmLead) => {
    setSelectedLeadForEstimate(lead);
    setEstimateTechId(lead.assignedTechnicianId || '');
    setEstimateCurrency('USD');
    setEstimateDiscountPercent(0);
    setEstimateProductSearch('');

    const existingOrder = customerOrders.find(o => o.id === lead.linkedOrderId || (o.orderNumber && lead.linkedOrderNumber && o.orderNumber === lead.linkedOrderNumber));
    if (existingOrder && existingOrder.items.length > 0) {
      setEstimateItems([...existingOrder.items]);
      setEstimateCurrency(existingOrder.currency || 'USD');
      setEstimateTechId(existingOrder.technicianId || lead.assignedTechnicianId || '');
      return;
    }

    const camCount = lead.cameraCountEstimated || 4;
    const initialItems: OrderItem[] = [];

    const camProd = (products || []).find(p => p.category.toLowerCase().includes('kamera') && !p.isService) || products?.[0];
    if (camProd) {
      const unitPriceUSD = camProd.retailPriceUSD || Math.round(camProd.retailPrice / exchangeRate);
      initialItems.push({
        productId: camProd.id,
        productName: camProd.name,
        category: camProd.category,
        sku: camProd.sku,
        quantity: camCount,
        unit: camProd.unit || 'dona',
        unitPrice: Math.round(unitPriceUSD * exchangeRate),
        unitPriceUSD: unitPriceUSD,
        discountPercent: 0,
        totalPrice: Math.round(unitPriceUSD * exchangeRate * camCount),
        hasSerialNumber: camProd.hasSerialNumber || false,
        isService: false
      });
    }

    const nvrProd = (products || []).find(p => p.category.toLowerCase().includes('registrator') || p.name.toLowerCase().includes('nvr') || p.name.toLowerCase().includes('dvr'));
    if (nvrProd) {
      const unitPriceUSD = nvrProd.retailPriceUSD || Math.round(nvrProd.retailPrice / exchangeRate);
      initialItems.push({
        productId: nvrProd.id,
        productName: nvrProd.name,
        category: nvrProd.category,
        sku: nvrProd.sku,
        quantity: 1,
        unit: nvrProd.unit || 'dona',
        unitPrice: Math.round(unitPriceUSD * exchangeRate),
        unitPriceUSD: unitPriceUSD,
        discountPercent: 0,
        totalPrice: Math.round(unitPriceUSD * exchangeRate),
        hasSerialNumber: nvrProd.hasSerialNumber || false,
        isService: false
      });
    }

    const srvProd = (products || []).find(p => p.isService || p.category.toLowerCase().includes('montaj') || p.name.toLowerCase().includes('montaj'));
    if (srvProd) {
      const unitPriceUSD = srvProd.retailPriceUSD || Math.round(srvProd.retailPrice / exchangeRate);
      initialItems.push({
        productId: srvProd.id,
        productName: srvProd.name,
        category: srvProd.category,
        sku: srvProd.sku,
        quantity: camCount,
        unit: srvProd.unit || 'xizmat',
        unitPrice: Math.round(unitPriceUSD * exchangeRate),
        unitPriceUSD: unitPriceUSD,
        discountPercent: 0,
        totalPrice: Math.round(unitPriceUSD * exchangeRate * camCount),
        hasSerialNumber: false,
        isService: true
      });
    }

    setEstimateItems(initialItems);
  };

  // Save Estimate & Link to Lead
  const handleSaveEstimateForLead = () => {
    if (!selectedLeadForEstimate) return;
    if (estimateItems.length === 0) {
      alert("Iltimos, smetaga kamida bitta tovar yoki xizmat qo'shing!");
      return;
    }

    const isUSD = estimateCurrency === 'USD';
    const assignedEmp = employees.find(e => e.id === estimateTechId);

    let subtotalUSD = 0;
    let subtotalUZS = 0;

    estimateItems.forEach(item => {
      const itemPriceUSD = item.unitPriceUSD || Math.round(item.unitPrice / exchangeRate);
      const itemPriceUZS = item.unitPrice || Math.round(itemPriceUSD * exchangeRate);
      const itemDisc = item.discountPercent || 0;
      
      const lineTotalUSD = itemPriceUSD * (1 - itemDisc / 100) * item.quantity;
      const lineTotalUZS = itemPriceUZS * (1 - itemDisc / 100) * item.quantity;

      subtotalUSD += lineTotalUSD;
      subtotalUZS += lineTotalUZS;
    });

    const totalDiscountUSD = subtotalUSD * (estimateDiscountPercent / 100);
    const totalDiscountUZS = subtotalUZS * (estimateDiscountPercent / 100);

    const finalTotalUSD = Number((subtotalUSD - totalDiscountUSD).toFixed(2));
    const finalTotalUZS = Math.round(subtotalUZS - totalDiscountUZS);

    const existingOrder = customerOrders.find(o => o.id === selectedLeadForEstimate.linkedOrderId || (o.orderNumber && selectedLeadForEstimate.linkedOrderNumber && o.orderNumber === selectedLeadForEstimate.linkedOrderNumber));

    const orderNum = existingOrder ? existingOrder.orderNumber : `ZK-${1000 + customerOrders.length + 1}`;
    const orderId = existingOrder ? existingOrder.id : `ord-${Date.now()}`;

    const newOrder: CustomerOrder = {
      id: orderId,
      orderNumber: orderNum,
      createdAt: existingOrder?.createdAt || new Date().toISOString().slice(0, 16).replace('T', ' '),
      organization: 'WST Namangan',
      warehouseName: 'Asosiy ombor',
      customerId: selectedLeadForEstimate.id,
      customerName: selectedLeadForEstimate.clientName,
      customerPhone: selectedLeadForEstimate.phone,
      deliveryAddress: selectedLeadForEstimate.address || '',
      projectName: `${selectedLeadForEstimate.clientName} (${OBJECT_TYPE_LABELS[selectedLeadForEstimate.objectType]?.label || 'Obyekt'})`,
      comment: `LID: ${selectedLeadForEstimate.leadNumber}. Manba: ${selectedLeadForEstimate.source}`,
      currency: estimateCurrency,
      exchangeRate: exchangeRate,
      items: estimateItems,
      subtotal: isUSD ? subtotalUSD : subtotalUZS,
      discountTotal: isUSD ? totalDiscountUSD : totalDiscountUZS,
      totalAmount: isUSD ? Math.round(finalTotalUSD * exchangeRate) : finalTotalUZS,
      totalAmountUSD: isUSD ? finalTotalUSD : Number((finalTotalUZS / exchangeRate).toFixed(2)),
      status: 'calculated',
      technicianId: assignedEmp?.id,
      technicianName: assignedEmp?.fullName,
      technicians: assignedEmp ? [{
        id: assignedEmp.id,
        fullName: assignedEmp.fullName,
        phone: assignedEmp.phone,
        role: assignedEmp.role,
        wageUSD: 0,
        wageUZS: 0
      }] : undefined,
      createdBy: 'CRM Menejer'
    };

    onSaveOrder?.(newOrder);

    const updatedLead: CrmLead = {
      ...selectedLeadForEstimate,
      linkedOrderId: newOrder.id,
      linkedOrderNumber: newOrder.orderNumber,
      budgetEstimatedUSD: newOrder.totalAmountUSD,
      budgetEstimatedUZS: newOrder.totalAmount,
      assignedTechnicianId: assignedEmp?.id || selectedLeadForEstimate.assignedTechnicianId,
      assignedTechnicianName: assignedEmp?.fullName || selectedLeadForEstimate.assignedTechnicianName,
      stage: selectedLeadForEstimate.stage === 'new_lead' || selectedLeadForEstimate.stage === 'site_visit' ? 'estimate_sent' : selectedLeadForEstimate.stage,
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    onUpdateLead(updatedLead);

    setSelectedLeadForEstimate(null);
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
                    ? 'bg-gradient-to-r from-teal-600 to-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-sky-300" />
                <span>Obyektlar & 2D Sxema</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeSubTab === 'passports' ? 'bg-black/40 text-sky-200' : 'bg-slate-800 text-slate-400'
                }`}>
                  {filteredPassports.length} ta
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

            {/* Kanban Board View with Drag & Drop & Super Compact Cards */}
            {viewMode === 'kanban' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 min-h-[500px]">
                {(['new_lead', 'site_visit', 'estimate_sent', 'installation', 'won', 'lost'] as CrmLeadStage[]).map((stageKey) => {
                  const stageConf = STAGE_CONFIG[stageKey];
                  const stageLeads = leadsByStage[stageKey] || [];
                  const stageTotalBudget = stageLeads.reduce((s, l) => s + (l.budgetEstimatedUSD || 0), 0);

                  return (
                    <div
                      key={stageKey}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverStage !== stageKey) setDragOverStage(stageKey);
                      }}
                      onDragLeave={(e) => {
                        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                        setDragOverStage(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const droppedLeadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
                        if (droppedLeadId) {
                          const targetLead = leads.find(l => l.id === droppedLeadId);
                          if (targetLead && targetLead.stage !== stageKey) {
                            handleMoveStage(targetLead, stageKey);
                          }
                        }
                        setDragOverStage(null);
                        setDraggedLeadId(null);
                      }}
                      className={`flex flex-col rounded-2xl border ${stageConf.border} ${stageConf.bg} p-2.5 transition-all duration-200 ${
                        dragOverStage === stageKey ? 'ring-2 ring-indigo-500 bg-indigo-950/40 shadow-xl shadow-indigo-500/20 scale-[1.01]' : ''
                      }`}
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
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

                      {/* Lead Cards List (Super Compact & Clean) */}
                      <div className="flex-1 space-y-2 overflow-y-auto max-h-[72vh] pr-0.5">
                        {stageLeads.map((lead) => {
                          const srcInfo = SOURCE_LABELS[lead.source] || SOURCE_LABELS.other;
                          const objInfo = OBJECT_TYPE_LABELS[lead.objectType] || OBJECT_TYPE_LABELS.boshqa;
                          const ObjIcon = objInfo.icon;

                          return (
                            <div
                              key={lead.id}
                              draggable={true}
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', lead.id);
                                e.dataTransfer.effectAllowed = 'move';
                                setDraggedLeadId(lead.id);
                              }}
                              onDragEnd={() => {
                                setDraggedLeadId(null);
                                setDragOverStage(null);
                              }}
                              className={`p-2.5 rounded-xl bg-slate-900/95 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 shadow-sm transition space-y-1.5 group cursor-grab active:cursor-grabbing ${
                                draggedLeadId === lead.id ? 'opacity-40 scale-95 ring-2 ring-indigo-500' : ''
                              }`}
                            >
                              {/* Top row: Number & Source */}
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-mono font-black text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/80">
                                  {lead.leadNumber}
                                </span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border truncate max-w-[120px] ${srcInfo.color}`}>
                                  {srcInfo.label}
                                </span>
                              </div>

                              {/* Client Info & Telegram quick button */}
                              <div>
                                <div className="flex items-center justify-between gap-1">
                                  <h4 className="text-xs font-black text-white group-hover:text-indigo-300 transition flex items-center gap-1 truncate" title={lead.clientName}>
                                    <ObjIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate">{lead.clientName}</span>
                                  </h4>
                                  {lead.phone && (
                                    <a
                                      href={`https://t.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1 rounded bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 shrink-0"
                                      title="Telegram orqali yozish"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Send className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-300 mt-0.5">
                                  <a
                                    href={`tel:${lead.phone.replace(/\s+/g, '')}`}
                                    className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Phone className="w-2.5 h-2.5 text-emerald-400" />
                                    <span>{lead.phone}</span>
                                  </a>
                                </div>
                              </div>

                              {/* Facility / Address (only if present) */}
                              {lead.address && (
                                <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate" title={lead.address}>
                                  <MapPin className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                                  <span className="truncate">{lead.address}</span>
                                </p>
                              )}

                              {/* Compact Specs & Budget Pill */}
                              <div className="px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-[10px]">
                                <span className="text-slate-400 font-medium">
                                  Kamera: <b className="text-slate-200">{lead.cameraCountEstimated || 0} ta</b>
                                </span>
                                <span className="font-extrabold text-amber-400">
                                  ${formatUSDNumber(lead.budgetEstimatedUSD || 0)}
                                </span>
                              </div>

                              {/* Assigned Technician & Visit Date (only if assigned) */}
                              {lead.assignedTechnicianName && (
                                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-slate-800/60">
                                  <span className="flex items-center gap-1 text-purple-300 truncate max-w-[110px]">
                                    <UserCheck className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                                    <span className="truncate">{lead.assignedTechnicianName.split(' ')[0]}</span>
                                  </span>
                                  {lead.siteVisitDate && (
                                    <span className="text-amber-400 font-bold text-[9px]">
                                      {lead.siteVisitDate.slice(5)} {lead.siteVisitTime || ''}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Next Action reminder (only if present) */}
                              {lead.nextActionNote && (
                                <div className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-300 truncate" title={lead.nextActionNote}>
                                  <span className="font-bold text-amber-400">Qadam:</span> {lead.nextActionNote}
                                </div>
                              )}

                              {/* Action Footer: Batafsil, Smeta, Stage dropdown */}
                              <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/50">
                                <button
                                  type="button"
                                  onClick={() => setSelectedLeadForDetail(lead)}
                                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition"
                                >
                                  Batafsil
                                </button>

                                <div className="flex items-center gap-1">
                                  {/* Quick Smeta creation & linking */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEstimateModal(lead)}
                                    className={`px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 ${
                                      lead.linkedOrderNumber
                                        ? 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/30'
                                        : 'bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/30'
                                    }`}
                                    title={lead.linkedOrderNumber ? `Smeta: #${lead.linkedOrderNumber}` : "Yangi smeta yaratish va hisob-kitobga qo'shish"}
                                  >
                                    <FileSpreadsheet className="w-2.5 h-2.5" />
                                    <span>{lead.linkedOrderNumber ? lead.linkedOrderNumber : 'Smeta'}</span>
                                  </button>

                                  {/* Stage switcher dropdown */}
                                  <select
                                    value={lead.stage}
                                    onChange={(e) => handleMoveStage(lead, e.target.value as CrmLeadStage)}
                                    className="px-1 py-1 bg-slate-950 border border-slate-700 rounded text-[9px] text-slate-300 font-semibold focus:outline-none"
                                  >
                                    <option value="new_lead">1. Yangi</option>
                                    <option value="site_visit">2. O'lchash</option>
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

                const stage = obj.installationStage || 'cabling_phase';
                const totalPinsCount = (obj.floorPlans || []).flatMap(p => p.pins || []).length;
                const cabledCount = (obj.floorPlans || []).flatMap(p => p.pins || []).filter(p => p.status === 'cabled').length;
                const installedCount = (obj.floorPlans || []).flatMap(p => p.pins || []).filter(p => p.status === 'installed' || p.status === 'tested').length;

                return (
                  <div
                    key={obj.id}
                    className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-teal-500/40 shadow-xl transition space-y-3.5 group flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800 gap-2">
                        <span className="text-[11px] font-mono font-bold text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-500/30">
                          {obj.passportNumber}
                        </span>
                        
                        {/* 2-Stage Installation Badge */}
                        <div className="flex items-center gap-1.5">
                          {stage === 'cabling_phase' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center gap-1">
                              <span>🔌</span> 1-Kabel Bosqichi
                            </span>
                          )}
                          {stage === 'devices_phase' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                              <span>📹</span> 2-Qurilmalar Bosqichi
                            </span>
                          )}
                          {stage === 'fully_completed' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <span>✅</span> To'liq Topshirildi
                            </span>
                          )}
                          {stage === 'maintenance' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <span>🛠️</span> Servis & Kafolat
                            </span>
                          )}
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

                      {/* 2D Schema & Montaj Progress Summary */}
                      <div className="mt-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            <Compass className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-200">2D Loyiha: </span>
                            <span className="text-slate-400">
                              {totalPinsCount > 0 ? `${totalPinsCount} ta nuqta (${obj.floorPlans?.length || 1} qavat)` : "Chizma yuklanmagan"}
                            </span>
                          </div>
                        </div>
                        {totalPinsCount > 0 && (
                          <div className="flex items-center gap-1 text-[10px] font-mono font-bold">
                            <span className="text-sky-400">{cabledCount}🔌</span>
                            <span className="text-slate-600">/</span>
                            <span className="text-emerald-400">{installedCount}📹</span>
                          </div>
                        )}
                      </div>

                      {/* CCTV Hardware Details Box */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs mt-2">
                        <div className="flex items-center justify-between text-slate-300 font-medium">
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <Video className="w-3.5 h-3.5 text-cyan-400" />
                            Kameralar:
                          </span>
                          <span className="font-bold text-white">{totalPinsCount || obj.installedCamerasCount} ta nuqta</span>
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
                    </div>

                    {/* Card Action Buttons */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setSelectedPassportForFloorPlan(obj)}
                          className="py-2 px-3 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                          title="2D Chizma, xonalar va kabel rasmlari"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>2D Sxema</span>
                        </button>

                        <button
                          onClick={() => setSelectedPassportForQr(obj)}
                          className="py-2 px-3 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                          title="QR Texnik Pasport & Termo-Stiker"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>QR Stiker</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedPassportForDetail(obj)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition text-center"
                        >
                          Pasportni Tahrirlash
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
                <p className="text-xs text-slate-400">Mijozlar bilan qayta bog'lanish, o'lchash-hisoblash va kafolatli profilaktikalar</p>
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
                          {rem.type === 'call' ? 'Qo\'ng\'iroq' : rem.type === 'visit' ? 'O\'lchash-hisoblash' : rem.type === 'maintenance' ? 'Profilaktika' : 'Qarz eslatish'}
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
                <label className="block text-slate-300 font-bold">O'lchash-hisoblash / Usta biriktirish</label>
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
                  <option value="visit">O'lchash-hisoblash / Obyektga borish</option>
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

      {/* ========================================================================= */}
      {/* MODAL 5: INTEGRATED LEAD SMETA / ESTIMATE BUILDER */}
      {/* ========================================================================= */}
      {selectedLeadForEstimate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-4xl w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>Smeta Tuzish & Bog'lash</span>
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/30">
                      {selectedLeadForEstimate.leadNumber}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    Mijoz: <b className="text-slate-200">{selectedLeadForEstimate.clientName}</b> ({selectedLeadForEstimate.phone}) • {OBJECT_TYPE_LABELS[selectedLeadForEstimate.objectType]?.label || 'Obyekt'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLeadForEstimate(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Settings & Templates Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-xs">
              {/* Currency Selector */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">Valyuta:</label>
                <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEstimateCurrency('USD')}
                    className={`flex-1 py-1 rounded-lg font-bold transition ${
                      estimateCurrency === 'USD' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    $ AQSH Dollari
                  </button>
                  <button
                    type="button"
                    onClick={() => setEstimateCurrency('UZS')}
                    className={`flex-1 py-1 rounded-lg font-bold transition ${
                      estimateCurrency === 'UZS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    So'm (UZS)
                  </button>
                </div>
              </div>

              {/* Technician Selector */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">Mas'ul Usta / Muhandis:</label>
                <select
                  value={estimateTechId}
                  onChange={(e) => setEstimateTechId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-semibold"
                >
                  <option value="">Ustani tanlang...</option>
                  {employees
                    .filter(e => e.role.toLowerCase().includes('usta') || e.role.toLowerCase().includes('muhandis') || e.role.toLowerCase().includes('sozlovchi'))
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                    ))}
                </select>
              </div>

              {/* Overall Discount */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">Umumiy Chegirma (%):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={estimateDiscountPercent}
                    onChange={(e) => setEstimateDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold text-center focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-slate-400 font-bold">%</span>
                </div>
              </div>
            </div>

            {/* Quick Package Presets */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-bold flex items-center gap-1 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Tezkor To'plamlar:
              </span>
              <button
                type="button"
                onClick={() => {
                  const camCount = selectedLeadForEstimate.cameraCountEstimated || 4;
                  const cam = (products || []).find(p => p.category.toLowerCase().includes('kamera') && !p.isService) || products?.[0];
                  const nvr = (products || []).find(p => p.category.toLowerCase().includes('registrator') || p.name.toLowerCase().includes('nvr'));
                  const srv = (products || []).find(p => p.isService || p.category.toLowerCase().includes('montaj'));

                  const newItems: OrderItem[] = [];
                  if (cam) {
                    const priceUSD = cam.retailPriceUSD || Math.round(cam.retailPrice / exchangeRate);
                    newItems.push({
                      productId: cam.id,
                      productName: cam.name,
                      quantity: camCount,
                      unit: cam.unit || 'dona',
                      unitPrice: Math.round(priceUSD * exchangeRate),
                      unitPriceUSD: priceUSD,
                      discountPercent: 0,
                      totalPrice: Math.round(priceUSD * exchangeRate * camCount),
                      hasSerialNumber: cam.hasSerialNumber || false,
                      isService: false
                    });
                  }
                  if (nvr) {
                    const priceUSD = nvr.retailPriceUSD || Math.round(nvr.retailPrice / exchangeRate);
                    newItems.push({
                      productId: nvr.id,
                      productName: nvr.name,
                      quantity: 1,
                      unit: nvr.unit || 'dona',
                      unitPrice: Math.round(priceUSD * exchangeRate),
                      unitPriceUSD: priceUSD,
                      discountPercent: 0,
                      totalPrice: Math.round(priceUSD * exchangeRate),
                      hasSerialNumber: nvr.hasSerialNumber || false,
                      isService: false
                    });
                  }
                  if (srv) {
                    const priceUSD = srv.retailPriceUSD || Math.round(srv.retailPrice / exchangeRate);
                    newItems.push({
                      productId: srv.id,
                      productName: srv.name,
                      quantity: camCount,
                      unit: srv.unit || 'xizmat',
                      unitPrice: Math.round(priceUSD * exchangeRate),
                      unitPriceUSD: priceUSD,
                      discountPercent: 0,
                      totalPrice: Math.round(priceUSD * exchangeRate * camCount),
                      hasSerialNumber: false,
                      isService: true
                    });
                  }
                  setEstimateItems(newItems);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition"
              >
                📹 Standart CCTV To'plam
              </button>
              <button
                type="button"
                onClick={() => {
                  const srv = (products || []).find(p => p.isService || p.category.toLowerCase().includes('montaj'));
                  if (srv) {
                    const priceUSD = srv.retailPriceUSD || Math.round(srv.retailPrice / exchangeRate);
                    setEstimateItems([{
                      productId: srv.id,
                      productName: srv.name,
                      quantity: selectedLeadForEstimate.cameraCountEstimated || 4,
                      unit: srv.unit || 'xizmat',
                      unitPrice: Math.round(priceUSD * exchangeRate),
                      unitPriceUSD: priceUSD,
                      discountPercent: 0,
                      totalPrice: Math.round(priceUSD * exchangeRate * (selectedLeadForEstimate.cameraCountEstimated || 4)),
                      hasSerialNumber: false,
                      isService: true
                    }]);
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 font-semibold transition"
              >
                ⚡ Faqat Montaj & Sozlash
              </button>
            </div>

            {/* Add Product Search & Catalog Dropdown */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-slate-300">Ombordan Tovar yoki Xizmat Qo'shish:</label>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={estimateProductSearch}
                    onChange={(e) => setEstimateProductSearch(e.target.value)}
                    placeholder="Ombordan tovar yoki xizmat nomini qidiring..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Search Suggestions */}
              {estimateProductSearch.trim().length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1 bg-slate-900 p-2 rounded-xl border border-slate-800">
                  {(products || [])
                    .filter(p => p.name.toLowerCase().includes(estimateProductSearch.toLowerCase()) || p.category.toLowerCase().includes(estimateProductSearch.toLowerCase()))
                    .slice(0, 6)
                    .map(prod => {
                      const priceUSD = prod.retailPriceUSD || Math.round(prod.retailPrice / exchangeRate);
                      return (
                        <div
                          key={prod.id}
                          onClick={() => {
                            const existsIdx = estimateItems.findIndex(it => it.productId === prod.id);
                            if (existsIdx >= 0) {
                              const updated = [...estimateItems];
                              updated[existsIdx].quantity += 1;
                              setEstimateItems(updated);
                            } else {
                              setEstimateItems([
                                ...estimateItems,
                                {
                                  productId: prod.id,
                                  productName: prod.name,
                                  category: prod.category,
                                  sku: prod.sku,
                                  quantity: 1,
                                  unit: prod.unit || 'dona',
                                  unitPrice: prod.retailPrice,
                                  unitPriceUSD: priceUSD,
                                  discountPercent: 0,
                                  totalPrice: prod.retailPrice,
                                  hasSerialNumber: prod.hasSerialNumber || false,
                                  isService: prod.isService || false
                                }
                              ]);
                            }
                            setEstimateProductSearch('');
                          }}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 cursor-pointer text-xs transition"
                        >
                          <div>
                            <span className="font-bold text-white">{prod.name}</span>
                            <span className="text-[10px] text-slate-400 ml-2">({prod.category})</span>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-amber-400">${priceUSD}</span>
                            <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({prod.retailPrice.toLocaleString()} so'm)</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Selected Items Table */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-3 py-2.5">#</th>
                      <th className="px-3 py-2.5">Tovar / Xizmat Nomi</th>
                      <th className="px-3 py-2.5 text-center">Soni</th>
                      <th className="px-3 py-2.5 text-right">Narxi ({estimateCurrency === 'USD' ? '$' : 'so\'m'})</th>
                      <th className="px-3 py-2.5 text-center">Chegirma</th>
                      <th className="px-3 py-2.5 text-right">Jami</th>
                      <th className="px-3 py-2.5 text-center">O'chirish</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {estimateItems.map((item, idx) => {
                      const itemPriceUSD = item.unitPriceUSD || Math.round(item.unitPrice / exchangeRate);
                      const itemPriceUZS = item.unitPrice || Math.round(itemPriceUSD * exchangeRate);
                      const unitPriceDisplay = estimateCurrency === 'USD' ? itemPriceUSD : itemPriceUZS;
                      const lineTotalUSD = itemPriceUSD * (1 - (item.discountPercent || 0) / 100) * item.quantity;
                      const lineTotalUZS = itemPriceUZS * (1 - (item.discountPercent || 0) / 100) * item.quantity;

                      return (
                        <tr key={idx} className="hover:bg-slate-900/60 transition">
                          <td className="px-3 py-2 font-mono text-slate-500">{idx + 1}</td>
                          <td className="px-3 py-2">
                            <span className="font-bold text-white">{item.productName}</span>
                            {item.isService && (
                              <span className="ml-1.5 px-1.5 py-0.2 rounded text-[9px] bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                                Xizmat
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="inline-flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...estimateItems];
                                  if (updated[idx].quantity > 1) {
                                    updated[idx].quantity -= 1;
                                    setEstimateItems(updated);
                                  }
                                }}
                                className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 font-bold"
                              >
                                -
                              </button>
                              <span className="px-2 font-mono font-bold text-white">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...estimateItems];
                                  updated[idx].quantity += 1;
                                  setEstimateItems(updated);
                                }}
                                className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 font-bold"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              min="0"
                              value={unitPriceDisplay}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                const updated = [...estimateItems];
                                if (estimateCurrency === 'USD') {
                                  updated[idx].unitPriceUSD = val;
                                  updated[idx].unitPrice = Math.round(val * exchangeRate);
                                } else {
                                  updated[idx].unitPrice = val;
                                  updated[idx].unitPriceUSD = Number((val / exchangeRate).toFixed(2));
                                }
                                setEstimateItems(updated);
                              }}
                              className="w-24 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-right font-bold text-white focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discountPercent || 0}
                              onChange={(e) => {
                                const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                const updated = [...estimateItems];
                                updated[idx].discountPercent = val;
                                setEstimateItems(updated);
                              }}
                              className="w-14 px-1.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-center font-bold text-slate-300 focus:outline-none focus:border-indigo-500"
                            />
                            <span className="text-slate-400 ml-0.5">%</span>
                          </td>
                          <td className="px-3 py-2 text-right font-extrabold text-amber-400">
                            {estimateCurrency === 'USD' ? `$${formatUSDNumber(lineTotalUSD)}` : `${Math.round(lineTotalUZS).toLocaleString()} so'm`}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setEstimateItems(estimateItems.filter((_, i) => i !== idx));
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {estimateItems.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                          Smetada hali tovarlar yo'q. Yuqoridan to'plam tanlang yoki qidiruv orqali qo'shing.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations & Total Summary */}
            {(() => {
              let subtotalUSD = 0;
              let subtotalUZS = 0;
              estimateItems.forEach(item => {
                const itemPriceUSD = item.unitPriceUSD || Math.round(item.unitPrice / exchangeRate);
                const itemPriceUZS = item.unitPrice || Math.round(itemPriceUSD * exchangeRate);
                const itemDisc = item.discountPercent || 0;
                subtotalUSD += itemPriceUSD * (1 - itemDisc / 100) * item.quantity;
                subtotalUZS += itemPriceUZS * (1 - itemDisc / 100) * item.quantity;
              });
              const totalDiscountUSD = subtotalUSD * (estimateDiscountPercent / 100);
              const totalDiscountUZS = subtotalUZS * (estimateDiscountPercent / 100);
              const finalTotalUSD = Number((subtotalUSD - totalDiscountUSD).toFixed(2));
              const finalTotalUZS = Math.round(subtotalUZS - totalDiscountUZS);

              return (
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 text-xs">
                  <div className="space-y-0.5">
                    <p className="text-slate-400 font-semibold">
                      Oraliq summa: <b className="text-slate-200">${formatUSDNumber(subtotalUSD)}</b> ({Math.round(subtotalUZS).toLocaleString()} so'm)
                    </p>
                    {estimateDiscountPercent > 0 && (
                      <p className="text-rose-400 font-semibold">
                        Chegirma ({estimateDiscountPercent}%): -${formatUSDNumber(totalDiscountUSD)} (-{Math.round(totalDiscountUZS).toLocaleString()} so'm)
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-black text-amber-400">
                      ${formatUSDNumber(finalTotalUSD)}
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-400">
                      {finalTotalUZS.toLocaleString()} so'm
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                {onNavigateToOrders && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLeadForEstimate(null);
                      onNavigateToOrders();
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Hisob-kitoblar Bo'limiga O'tish</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLeadForEstimate(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold text-xs"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={handleSaveEstimateForLead}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Smetani Saqlash & Bog'lash</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: OBJECT PASSPORT FULL DETAIL & EDIT MODAL */}
      {/* ========================================================================= */}
      {selectedPassportForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>Obyekt Pasportini Tahrirlash</span>
                    <span className="font-mono text-xs text-teal-400 font-bold bg-teal-950 px-2 py-0.5 rounded border border-teal-500/30">
                      {selectedPassportForDetail.passportNumber}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">{selectedPassportForDetail.objectName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPassportForDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
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
                const installationStage = (form.elements.namedItem('installationStage') as HTMLSelectElement).value as any;
                const mapLocationUrl = (form.elements.namedItem('mapLocationUrl') as HTMLInputElement).value;
                const dvrModel = (form.elements.namedItem('dvrModel') as HTMLInputElement).value;
                const dvrSerialNumber = (form.elements.namedItem('dvrSerialNumber') as HTMLInputElement).value;
                const dvrCloudId = (form.elements.namedItem('dvrCloudId') as HTMLInputElement).value;
                const dvrAdminLogin = (form.elements.namedItem('dvrAdminLogin') as HTMLInputElement).value;
                const dvrAdminPassword = (form.elements.namedItem('dvrAdminPassword') as HTMLInputElement).value;
                const hddCapacity = (form.elements.namedItem('hddCapacity') as HTMLInputElement).value;
                const warrantyMonths = Number((form.elements.namedItem('warrantyMonths') as HTMLInputElement).value) || 12;
                const cablingTechnicianName = (form.elements.namedItem('cablingTechnicianName') as HTMLInputElement).value;
                const installedByTechnicianName = (form.elements.namedItem('installedByTechnicianName') as HTMLInputElement).value;
                const notes = (form.elements.namedItem('notes') as HTMLTextAreaElement).value;

                const updatedPassport: CrmObjectPassport = {
                  ...selectedPassportForDetail,
                  objectName,
                  customerName,
                  customerPhone,
                  address,
                  objectType,
                  installationStage,
                  mapLocationUrl: mapLocationUrl || undefined,
                  dvrModel: dvrModel || undefined,
                  dvrSerialNumber: dvrSerialNumber || undefined,
                  dvrCloudId: dvrCloudId || undefined,
                  dvrAdminLogin: dvrAdminLogin || 'admin',
                  dvrAdminPassword: dvrAdminPassword || undefined,
                  hddCapacity: hddCapacity || undefined,
                  warrantyMonths,
                  cablingTechnicianName: cablingTechnicianName || undefined,
                  installedByTechnicianName: installedByTechnicianName || undefined,
                  notes: notes || undefined
                };

                onUpdateObjectPassport(updatedPassport);
                setSelectedPassportForDetail(null);
              }}
              className="space-y-4 text-xs"
            >
              {/* Stage selector */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                <label className="block text-slate-300 font-bold">Obyekt Bosqichi (Montaj Holati):</label>
                <select
                  name="installationStage"
                  defaultValue={selectedPassportForDetail.installationStage || 'cabling_phase'}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold focus:border-teal-500 focus:outline-none"
                >
                  <option value="cabling_phase">🔌 1-Bosqich: Kabel montaji (Chernovoy davr)</option>
                  <option value="devices_phase">📹 2-Bosqich: Qurilmalar montaji (Chistovoy davr)</option>
                  <option value="fully_completed">✅ To'liq montaj topshirilgan & Faol</option>
                  <option value="maintenance">🛠️ Servis & Rejali profilaktika</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Obyekt Nomi *</label>
                  <input
                    name="objectName"
                    required
                    defaultValue={selectedPassportForDetail.objectName}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Obyekt Turi</label>
                  <select
                    name="objectType"
                    defaultValue={selectedPassportForDetail.objectType}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500 focus:outline-none"
                  >
                    <option value="dokon">Do'kon / Savdo</option>
                    <option value="xonadon">Hovli / Xonadon</option>
                    <option value="ofis">Ofis / Biznes</option>
                    <option value="ombor_zavod">Omborxona / Zavod</option>
                    <option value="boshqa">Boshqa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Mijoz Ismi *</label>
                  <input
                    name="customerName"
                    required
                    defaultValue={selectedPassportForDetail.customerName}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Telefon *</label>
                  <input
                    name="customerPhone"
                    required
                    defaultValue={selectedPassportForDetail.customerPhone}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">To'liq Manzil</label>
                <input
                  name="address"
                  required
                  defaultValue={selectedPassportForDetail.address}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Xarita / Lokatsiya URL</label>
                <input
                  name="mapLocationUrl"
                  defaultValue={selectedPassportForDetail.mapLocationUrl || ''}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* DVR Credentials & Info */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <p className="font-bold text-teal-400">DVR / NVR Registrator Sozlamalari</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Registrator Modeli</label>
                    <input
                      name="dvrModel"
                      defaultValue={selectedPassportForDetail.dvrModel || ''}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Registrator S/N</label>
                    <input
                      name="dvrSerialNumber"
                      defaultValue={selectedPassportForDetail.dvrSerialNumber || ''}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-teal-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Cloud ID</label>
                    <input
                      name="dvrCloudId"
                      defaultValue={selectedPassportForDetail.dvrCloudId || ''}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-teal-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Admin Login</label>
                    <input
                      name="dvrAdminLogin"
                      defaultValue={selectedPassportForDetail.dvrAdminLogin || 'admin'}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-teal-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Admin Parol</label>
                    <input
                      name="dvrAdminPassword"
                      defaultValue={selectedPassportForDetail.dvrAdminPassword || ''}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-teal-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Xotira (HDD)</label>
                    <input
                      name="hddCapacity"
                      defaultValue={selectedPassportForDetail.hddCapacity || ''}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Kafolat (oy)</label>
                    <input
                      name="warrantyMonths"
                      type="number"
                      defaultValue={selectedPassportForDetail.warrantyMonths || 24}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-teal-500 focus:outline-none font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Technicians */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">1-Bosqich (Kabel montaj ustasi)</label>
                  <input
                    name="cablingTechnicianName"
                    defaultValue={selectedPassportForDetail.cablingTechnicianName || ''}
                    placeholder="Masalan: Sardor Aliyev"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">2-Bosqich (Qurilma sozlovchi usta)</label>
                  <input
                    name="installedByTechnicianName"
                    defaultValue={selectedPassportForDetail.installedByTechnicianName || ''}
                    placeholder="Masalan: Dilshod Karimov"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Texnik Izoh</label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={selectedPassportForDetail.notes || ''}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                {onDeleteObjectPassport && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Ushbu obyekt pasportini va uning barcha 2D sxemalarini o'chirishni tasdiqlaysizmi?")) {
                        onDeleteObjectPassport(selectedPassportForDetail.id);
                        setSelectedPassportForDetail(null);
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 font-bold border border-rose-800/40"
                  >
                    O'chirish
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedPassportForDetail(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-lg shadow-teal-600/20"
                  >
                    O'zgarishlarni Saqlash
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: 2D FLOOR PLAN AND BLUEPRINT EDITOR */}
      {/* ========================================================================= */}
      {selectedPassportForFloorPlan && (
        <InteractiveFloorPlanEditor
          objectPassport={selectedPassportForFloorPlan}
          onSaveObjectPassport={(updated) => {
            onUpdateObjectPassport(updated);
            setSelectedPassportForFloorPlan(null);
          }}
          onClose={() => setSelectedPassportForFloorPlan(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: QR TECHNICAL PASSPORT & THERMAL STICKER */}
      {/* ========================================================================= */}
      {selectedPassportForQr && (
        <ObjectQrPassportModal
          objectPassport={selectedPassportForQr}
          onSaveObjectPassport={(updated) => {
            onUpdateObjectPassport(updated);
            setSelectedPassportForQr(null);
          }}
          onClose={() => setSelectedPassportForQr(null)}
        />
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
