'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Product, 
  SaleReceipt, 
  PurchaseInvoice, 
  ServiceTicket, 
  ServiceTicketStatus,
  Currency 
} from '../types';
import { formatNumberWithSpaces, formatUSDNumber } from '../utils/formatters';
import { printRawHtmlInIframe } from '../utils/thermalPrinter';
import { 
  ShieldCheck, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  RefreshCw, 
  Package, 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  FileText, 
  Printer, 
  Plus, 
  X, 
  Check, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  ChevronLeft,
  Cpu, 
  Eye, 
  DollarSign,
  Building2,
  HardHat,
  ArrowRight,
  Filter,
  Sparkles,
  Download
} from 'lucide-react';
import { exportWarrantyToExcel } from '../utils/excel';

interface WarrantyScreenProps {
  products: Product[];
  receipts: SaleReceipt[];
  purchases?: PurchaseInvoice[];
  serviceTickets: ServiceTicket[];
  onAddTicket: (ticket: ServiceTicket) => void;
  onUpdateTicket: (ticket: ServiceTicket) => void;
  onDeleteTicket: (ticketId: string) => void;
  onReplaceDevice: (ticketId: string, oldSerial: string, newSerial: string, productId: string) => void;
  exchangeRate?: number;
  baseCurrency?: Currency;
  onViewReceipt?: (receiptId: string) => void;
}

export const WarrantyScreen: React.FC<WarrantyScreenProps> = ({
  products,
  receipts,
  purchases = [],
  serviceTickets,
  onAddTicket,
  onUpdateTicket,
  onDeleteTicket,
  onReplaceDevice,
  exchangeRate = 12850,
  baseCurrency = 'UZS',
  onViewReceipt
}) => {
  // Main view tab: 'tickets' | 'sold_serials'
  const [activeSubTab, setActiveSubTab] = useState<'tickets' | 'sold_serials'>('tickets');
  
  // Hero S/N Inspector state
  const [inspectQuery, setInspectQuery] = useState('');
  
  // Tickets filter
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | ServiceTicketStatus>('all');
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');

  // Modals
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<ServiceTicket | null>(null);

  // Replacement (Zamen) modal state
  const [replacementTicket, setReplacementTicket] = useState<ServiceTicket | null>(null);
  const [selectedReplacementSN, setSelectedReplacementSN] = useState<string>('');

  // Print slip modal state
  const [printingTicket, setPrintingTicket] = useState<ServiceTicket | null>(null);

  // ESC key listener to close any open service/warranty modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (printingTicket) {
          setPrintingTicket(null);
          return;
        }
        if (replacementTicket) {
          setReplacementTicket(null);
          return;
        }
        if (isTicketModalOpen) {
          setIsTicketModalOpen(false);
          setEditingTicket(null);
          return;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [printingTicket, replacementTicket, isTicketModalOpen]);

  // -------------------------------------------------------------
  // 1. S/N INSPECTION ENGINE (Hero Search)
  // -------------------------------------------------------------
  const inspectionResult = useMemo(() => {
    const q = inspectQuery.trim().toUpperCase();
    if (!q) return null;

    // A. Check in sold receipts
    let foundReceipt: SaleReceipt | null = null;
    let foundItem: any = null;

    for (const r of receipts) {
      for (const it of r.items) {
        if (it.selectedSerialNumbers && it.selectedSerialNumbers.some(sn => sn.trim().toUpperCase() === q)) {
          foundReceipt = r;
          foundItem = it;
          break;
        }
      }
      if (foundReceipt) break;
    }

    if (foundReceipt && foundItem) {
      // Calculate warranty expiry
      const saleDate = new Date(foundReceipt.createdAt.replace('Bugun', new Date().toISOString().slice(0, 10)));
      const validDate = isNaN(saleDate.getTime()) ? new Date() : saleDate;
      const months = foundReceipt.warrantyMonths || foundItem.product?.warrantyMonths || 24;
      
      const expiryDate = new Date(validDate);
      expiryDate.setMonth(expiryDate.getMonth() + months);

      const now = new Date();
      const isUnderWarranty = now.getTime() <= expiryDate.getTime();
      const remainingDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const remainingMonths = Math.max(0, Math.round(remainingDays / 30));

      // Check if ticket exists
      const existingTicket = serviceTickets.find(t => t.serialNumber.trim().toUpperCase() === q);

      return {
        type: 'sold' as const,
        serialNumber: q,
        product: foundItem.product,
        productName: foundItem.product?.name || 'Kuzatuv Qurilmasi',
        category: foundItem.product?.category || 'Xavfsizlik tizimlari',
        receipt: foundReceipt,
        saleDateStr: foundReceipt.createdAt,
        warrantyMonths: months,
        expiryDateStr: expiryDate.toISOString().slice(0, 10),
        isUnderWarranty,
        remainingDays,
        remainingMonths,
        existingTicket
      };
    }

    // B. Check in current warehouse stock
    const inStockProd = products.find(p => p.serialNumbers && p.serialNumbers.some(sn => sn.trim().toUpperCase() === q));
    if (inStockProd) {
      return {
        type: 'warehouse' as const,
        serialNumber: q,
        product: inStockProd,
        productName: inStockProd.name,
        category: inStockProd.category,
        stockQuantity: inStockProd.stockQuantity,
        retailPrice: inStockProd.retailPrice,
        retailPriceUSD: inStockProd.retailPriceUSD,
        warrantyMonths: inStockProd.warrantyMonths || 24
      };
    }

    // C. Check in purchases from suppliers
    for (const purch of purchases) {
      for (const item of purch.items) {
        if (item.serialNumbers && item.serialNumbers.some(sn => sn.trim().toUpperCase() === q)) {
          return {
            type: 'purchase' as const,
            serialNumber: q,
            purchase: purch,
            item,
            productName: item.productName,
            supplierName: purch.supplierName,
            invoiceNumber: purch.invoiceNumber,
            date: purch.createdAt
          };
        }
      }
    }

    // D. Not found
    return {
      type: 'not_found' as const,
      serialNumber: q
    };
  }, [inspectQuery, receipts, products, purchases, serviceTickets]);

  // -------------------------------------------------------------
  // 2. ALL SOLD SERIAL NUMBERS DATABASE
  // -------------------------------------------------------------
  const allSoldSerials = useMemo(() => {
    const list: Array<{
      serialNumber: string;
      productName: string;
      category: string;
      customerName: string;
      customerPhone: string;
      installationAddress: string;
      receiptNumber: string;
      receiptId: string;
      saleDate: string;
      warrantyMonths: number;
      expiryDate: string;
      isUnderWarranty: boolean;
      remainingDays: number;
      remainingMonths: number;
    }> = [];

    receipts.forEach(r => {
      r.items.forEach(it => {
        if (it.selectedSerialNumbers && it.selectedSerialNumbers.length > 0) {
          const saleDate = new Date(r.createdAt.replace('Bugun', new Date().toISOString().slice(0, 10)));
          const validDate = isNaN(saleDate.getTime()) ? new Date() : saleDate;
          const months = r.warrantyMonths || it.product?.warrantyMonths || 24;
          const expiry = new Date(validDate);
          expiry.setMonth(expiry.getMonth() + months);
          const now = new Date();
          const isUnder = now.getTime() <= expiry.getTime();
          const remDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const remMonths = Math.max(0, Math.round(remDays / 30));

          it.selectedSerialNumbers.forEach(sn => {
            list.push({
              serialNumber: sn,
              productName: it.product?.name || 'Qurilma',
              category: it.product?.category || 'CCTV',
              customerName: r.customer?.fullName || 'Noma\'lum xaridor',
              customerPhone: r.customer?.phone || '-',
              installationAddress: r.installationAddress || '-',
              receiptNumber: r.receiptNumber,
              receiptId: r.id,
              saleDate: r.createdAt,
              warrantyMonths: months,
              expiryDate: expiry.toISOString().slice(0, 10),
              isUnderWarranty: isUnder,
              remainingDays: remDays,
              remainingMonths: remMonths
            });
          });
        }
      });
    });

    return list;
  }, [receipts]);

  // Filter sold serials
  const [soldSearchText, setSoldSearchText] = useState('');
  const [soldPage, setSoldPage] = useState(1);
  const [soldPageSize, setSoldPageSize] = useState(25);

  const filteredSoldSerials = useMemo(() => {
    const q = soldSearchText.trim().toLowerCase();
    if (!q) return allSoldSerials;
    return allSoldSerials.filter(s => 
      s.serialNumber.toLowerCase().includes(q) ||
      s.productName.toLowerCase().includes(q) ||
      s.customerName.toLowerCase().includes(q) ||
      s.receiptNumber.toLowerCase().includes(q) ||
      s.customerPhone.includes(q)
    );
  }, [allSoldSerials, soldSearchText]);

  const totalSoldPages = Math.max(1, Math.ceil(filteredSoldSerials.length / soldPageSize));
  const paginatedSoldSerials = useMemo(() => {
    const start = (soldPage - 1) * soldPageSize;
    return filteredSoldSerials.slice(start, start + soldPageSize);
  }, [filteredSoldSerials, soldPage, soldPageSize]);

  // -------------------------------------------------------------
  // 3. SERVICE TICKETS FILTERING
  // -------------------------------------------------------------
  const [ticketPage, setTicketPage] = useState(1);
  const [ticketPageSize] = useState(15);

  const filteredTickets = useMemo(() => {
    return serviceTickets.filter(t => {
      const matchStatus = ticketStatusFilter === 'all' || t.status === ticketStatusFilter;
      const q = ticketSearchQuery.trim().toLowerCase();
      const matchSearch = !q || 
        t.ticketNumber.toLowerCase().includes(q) ||
        t.serialNumber.toLowerCase().includes(q) ||
        t.productName.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.customerPhone.includes(q) ||
        t.issueDescription.toLowerCase().includes(q);

      return matchStatus && matchSearch;
    });
  }, [serviceTickets, ticketStatusFilter, ticketSearchQuery]);

  const totalTicketPages = Math.max(1, Math.ceil(filteredTickets.length / ticketPageSize));
  const paginatedTickets = useMemo(() => {
    const start = (ticketPage - 1) * ticketPageSize;
    return filteredTickets.slice(start, start + ticketPageSize);
  }, [filteredTickets, ticketPage, ticketPageSize]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = serviceTickets.length;
    const active = serviceTickets.filter(t => t.status === 'in_diagnosis' || t.status === 'in_repair' || t.status === 'received').length;
    const replaced = serviceTickets.filter(t => t.status === 'replaced').length;
    const ready = serviceTickets.filter(t => t.status === 'ready').length;
    const underWarranty = serviceTickets.filter(t => t.isUnderWarranty).length;
    return { total, active, replaced, ready, underWarranty };
  }, [serviceTickets]);

  // Handler to open new ticket with prefilled data
  const handleOpenNewTicketFromInspector = () => {
    if (inspectionResult && inspectionResult.type === 'sold') {
      const newDraft: ServiceTicket = {
        id: `srv-${Date.now()}`,
        ticketNumber: `SRV-${1000 + serviceTickets.length + 1}`,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        serialNumber: inspectionResult.serialNumber,
        productId: inspectionResult.product?.id || `prod-${Date.now()}`,
        productName: inspectionResult.productName,
        category: inspectionResult.category,
        receiptId: inspectionResult.receipt?.id,
        receiptNumber: inspectionResult.receipt?.receiptNumber,
        saleDate: inspectionResult.saleDateStr,
        warrantyMonths: inspectionResult.warrantyMonths,
        isUnderWarranty: inspectionResult.isUnderWarranty,
        warrantyExpiresAt: inspectionResult.expiryDateStr,
        customerId: inspectionResult.receipt?.customer?.id,
        customerName: inspectionResult.receipt?.customer?.fullName || '',
        customerPhone: inspectionResult.receipt?.customer?.phone || '',
        installationAddress: inspectionResult.receipt?.installationAddress || '',
        assignedTechnicianName: inspectionResult.receipt?.technicians?.[0]?.fullName || inspectionResult.receipt?.technicianName || '',
        assignedTechnicianPhone: inspectionResult.receipt?.technicians?.[0]?.phone || inspectionResult.receipt?.technicianPhone || '',
        issueDescription: '',
        diagnosticNotes: '',
        status: 'received',
        isWarrantyFree: inspectionResult.isUnderWarranty,
        repairCost: 0,
        repairCostUSD: 0,
        receivedBy: 'Kassir / Servis menejeri'
      };
      setEditingTicket(newDraft);
      setIsTicketModalOpen(true);
    } else {
      const emptyDraft: ServiceTicket = {
        id: `srv-${Date.now()}`,
        ticketNumber: `SRV-${1000 + serviceTickets.length + 1}`,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        serialNumber: inspectQuery.trim().toUpperCase() || '',
        productId: '',
        productName: '',
        category: 'Kuzatuv kameralari (CCTV)',
        warrantyMonths: 24,
        isUnderWarranty: true,
        customerName: '',
        customerPhone: '+998 ',
        issueDescription: '',
        diagnosticNotes: '',
        status: 'received',
        isWarrantyFree: true,
        repairCost: 0,
        repairCostUSD: 0,
        receivedBy: 'Kassir / Servis menejeri'
      };
      setEditingTicket(emptyDraft);
      setIsTicketModalOpen(true);
    }
  };

  // Status Badge Colors & Labels
  const getStatusBadge = (status: ServiceTicketStatus) => {
    switch (status) {
      case 'received':
        return { label: 'Qabul qilindi', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800' };
      case 'in_diagnosis':
        return { label: 'Diagnostikada', bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800' };
      case 'in_repair':
        return { label: 'Ta\'mirlanmoqda', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
      case 'ready':
        return { label: 'Tayyor (Mijozga)', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
      case 'replaced':
        return { label: 'Almashtirildi (Zamen)', bg: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800' };
      case 'returned_to_client':
        return { label: 'Mijozga topshirildi', bg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' };
      case 'cancelled':
        return { label: 'Bekor qilindi', bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800' };
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Kafolat Xizmati & S/N Nazorati
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Servis Markazi
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Qurilmalar seriya raqami (S/N) bo&apos;yicha kafolatni tekshirish, ta&apos;mir kvitansiyalari va ombordan almashtirish (Zamen)
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportWarrantyToExcel(serviceTickets)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-sm transition active:scale-[0.98]"
            title="Servis kvitansiyalari va nosoz qurilmalar ro'yxatini Excelga eksport qilish"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">Excel Eksport</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewTicketFromInspector}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nosoz Qurilmani Qabul Qilish</span>
          </button>
        </div>
      </div>

      {/* Main Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {/* SECTION 1: HERO S/N INSPECTION ENGINE */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-2xl p-5 text-white shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-emerald-500/5 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-4xl">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Tezkor S/N & Kafolat Diagnostikasi</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black mb-2">
              Qurilma Seriya Raqami (S/N) orqali barcha ma&apos;lumotlarni toping
            </h3>
            <p className="text-xs text-slate-300 mb-4 max-w-2xl leading-relaxed">
              Kamera yoki apparat qutisidagi seriya raqamini skanerlang: xarid cheki, kafolat muddati, o&apos;rnatgan usta va xaridor manzili bir zumda chiqadi.
            </p>

            {/* Big Search Input */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={inspectQuery}
                  onChange={(e) => setInspectQuery(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  placeholder="Seriya raqamini (S/N) kiriting yoki skanerlang (masalan: HK-4MP-982101 yoki DH-2MP-84011)..."
                  className="w-full bg-slate-800/90 border-2 border-slate-700 focus:border-emerald-500 rounded-xl pl-11 pr-10 py-3 text-sm font-mono font-bold text-white placeholder:text-slate-400 outline-none shadow-inner transition"
                />
                {inspectQuery && (
                  <button
                    type="button"
                    onClick={() => setInspectQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quick sample chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
                <span className="text-slate-400 text-xs hidden lg:inline">Namunalar:</span>
                <button
                  type="button"
                  onClick={() => setInspectQuery('HK-4MP-982101')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold transition"
                >
                  HK-4MP-982101
                </button>
                <button
                  type="button"
                  onClick={() => setInspectQuery('DH-2MP-84011')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold transition"
                >
                  DH-2MP-84011
                </button>
              </div>
            </div>

            {/* INSPECTION RESULT HERO CARD */}
            {inspectionResult && (
              <div className="mt-4 animate-in fade-in zoom-in-95 duration-150">
                {inspectionResult.type === 'sold' && (
                  <div className="p-4 rounded-xl bg-slate-800/95 border-2 border-emerald-500/60 shadow-2xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white">{inspectionResult.productName}</span>
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-700 text-emerald-300 font-bold">
                              S/N: {inspectionResult.serialNumber}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">{inspectionResult.category}</span>
                        </div>
                      </div>

                      {/* Warranty Status Pill */}
                      <div>
                        {inspectionResult.isUnderWarranty ? (
                          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500 text-emerald-300 flex items-center gap-2 font-bold text-xs">
                            <ShieldCheck className="w-4 h-4" />
                            <span>KAFOLAT AMAL QILMOQDA (tugashiga {inspectionResult.remainingMonths} oy / {inspectionResult.remainingDays} kun qoldi)</span>
                          </div>
                        ) : (
                          <div className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500 text-rose-300 flex items-center gap-2 font-bold text-xs">
                            <AlertTriangle className="w-4 h-4" />
                            <span>KAFOLAT MUDDATI TUGAGAN</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 4-Column Grid Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      {/* Customer info */}
                      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/50">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                          Buyurtmachi / Mijoz
                        </span>
                        <div className="font-bold text-slate-200 truncate">
                          {inspectionResult.receipt.customer?.fullName || 'Noma\'lum xaridor'}
                        </div>
                        <div className="text-[11px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{inspectionResult.receipt.customer?.phone || '-'}</span>
                        </div>
                      </div>

                      {/* Receipt & Date */}
                      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/50">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                          Xarid Cheki & Sana
                        </span>
                        <div className="font-mono font-bold text-cyan-400">
                          {inspectionResult.receipt.receiptNumber}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{inspectionResult.saleDateStr}</span>
                        </div>
                      </div>

                      {/* Installation Address */}
                      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/50">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                          O&apos;rnatish Manzili
                        </span>
                        <div className="font-medium text-slate-300 truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{inspectionResult.receipt.installationAddress || 'Ko\'rsatilmagan'}</span>
                        </div>
                      </div>

                      {/* Assigned Technicians */}
                      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/50">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                          O&apos;rnatgan Ustalar
                        </span>
                        <div className="font-bold text-slate-200 truncate flex items-center gap-1">
                          <HardHat className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>
                            {inspectionResult.receipt.technicians?.map(t => t.fullName).join(', ') || inspectionResult.receipt.technicianName || 'Biriktirilmagan'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-700/80">
                      <div className="text-[11px] text-slate-400 font-mono">
                        Kafolat muddati: <strong>{inspectionResult.warrantyMonths} oy</strong> (Tugaydi: {inspectionResult.expiryDateStr})
                      </div>
                      <div className="flex items-center gap-2">
                        {onViewReceipt && (
                          <button
                            type="button"
                            onClick={() => onViewReceipt(inspectionResult.receipt.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white transition flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Chekni Ko&apos;rish</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleOpenNewTicketFromInspector}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Ushbu Qurilmani Servisga Qabul Qilish</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {inspectionResult.type === 'warehouse' && (
                  <div className="p-4 rounded-xl bg-cyan-950/80 border-2 border-cyan-500/60 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">{inspectionResult.productName}</span>
                          <span className="px-2 py-0.5 rounded bg-cyan-900 text-cyan-300 font-mono font-bold">
                            S/N: {inspectionResult.serialNumber}
                          </span>
                        </div>
                        <span className="text-[11px] text-cyan-400 font-semibold">
                          OMBORDAGI TOVAR — Hali sotilmagan (Qoldiq: {inspectionResult.stockQuantity} dona)
                        </span>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-sm font-black text-cyan-300">
                        {baseCurrency === 'USD' ? `$${formatUSDNumber(inspectionResult.retailPriceUSD || 0)}` : `${formatNumberWithSpaces(inspectionResult.retailPrice)} so'm`}
                      </div>
                      <div className="text-[10px] text-cyan-500">
                        Kafolati: {inspectionResult.warrantyMonths} oy
                      </div>
                    </div>
                  </div>
                )}

                {inspectionResult.type === 'purchase' && (
                  <div className="p-4 rounded-xl bg-amber-950/80 border-2 border-amber-500/60 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">{inspectionResult.productName}</span>
                          <span className="px-2 py-0.5 rounded bg-amber-900 text-amber-300 font-mono font-bold">
                            S/N: {inspectionResult.serialNumber}
                          </span>
                        </div>
                        <span className="text-[11px] text-amber-400">
                          Ta&apos;minotchi: <strong>{inspectionResult.supplierName}</strong> &bull; Nakladnoy: {inspectionResult.invoiceNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {inspectionResult.type === 'not_found' && (
                  <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                      <span>
                        <strong>&quot;{inspectionResult.serialNumber}&quot;</strong> seriya raqami sotuvlar yoki ombor bazasida topilmadi.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenNewTicketFromInspector}
                      className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold text-white text-xs"
                    >
                      + Qo&apos;lda Servisga Qabul Qilish
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: METRICS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">Jami Servisda</span>
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono">{metrics.total} ta</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">Hozir Ta&apos;mirlanmoqda</span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">{metrics.active} ta</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">Tayyor (Topshirishga)</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{metrics.ready} ta</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">Almashtirilgan (Zamen)</span>
              <span className="text-xl font-black text-cyan-600 dark:text-cyan-400 font-mono">{metrics.replaced} ta</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* SECTION 3: SUB-TABS NAVIGATION */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('tickets')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeSubTab === 'tickets'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Servis & Ta&apos;mir Jurnali ({serviceTickets.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('sold_serials')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeSubTab === 'sold_serials'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sotilgan Barcha Qurilmalar & S/N ({allSoldSerials.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: SERVICE TICKETS LIST */}
        {activeSubTab === 'tickets' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              {/* Status Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: 'Barchasi' },
                  { id: 'received', label: 'Qabul qilindi' },
                  { id: 'in_diagnosis', label: 'Diagnostika' },
                  { id: 'in_repair', label: 'Ta\'mirda' },
                  { id: 'ready', label: 'Tayyor' },
                  { id: 'replaced', label: 'Zamen' },
                  { id: 'returned_to_client', label: 'Topshirildi' }
                ].map(st => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setTicketStatusFilter(st.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                      ticketStatusFilter === st.id
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Search in tickets */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={ticketSearchQuery}
                  onChange={(e) => setTicketSearchQuery(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  placeholder="Chipta, S/N, mijoz qidirish..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Tickets Table / Cards */}
            {filteredTickets.length === 0 ? (
              <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
                <Wrench className="w-12 h-12 stroke-[1.2] mx-auto mb-2 opacity-40 text-emerald-500" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Servis chiptalari topilmadi</h4>
                <p className="text-xs text-slate-400 mt-1">Ushbu filtr bo&apos;yicha hech qanday ta&apos;mir arizasi mavjud emas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {paginatedTickets.map((ticket) => {
                  const statusStyle = getStatusBadge(ticket.status);

                  return (
                    <div
                      key={ticket.id}
                      className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-emerald-500/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Left: Info */}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                            {ticket.ticketNumber}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle.bg}`}>
                            {statusStyle.label}
                          </span>
                          {ticket.isWarrantyFree ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Kafolatli (Bepul)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              Kafolatsiz (Pullik)
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 font-mono">
                            Qabul: {ticket.createdAt}
                          </span>
                        </div>

                        {/* Device & Serial */}
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {ticket.productName}
                          </h4>
                          <span className="font-mono text-xs text-cyan-600 dark:text-cyan-400 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded shrink-0">
                            S/N: {ticket.serialNumber}
                          </span>
                        </div>

                        {/* Customer & Issue */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{ticket.customerName}</span>
                            <span className="text-slate-400 font-mono">({ticket.customerPhone})</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="truncate italic text-slate-500 dark:text-slate-400">
                              Shikoyat: &quot;{ticket.issueDescription}&quot;
                            </span>
                          </div>
                        </div>

                        {/* If replacement S/N */}
                        {ticket.replacementSerialNumber && (
                          <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-xs font-mono flex items-center gap-2 text-cyan-800 dark:text-cyan-300">
                            <RefreshCw className="w-3.5 h-3.5 text-cyan-600" />
                            <span>Ombordan almashtirib berilgan yangi S/N: <strong>{ticket.replacementSerialNumber}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Right: Status Dropdown & Action Buttons */}
                      <div className="flex flex-wrap md:flex-col items-end justify-between gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                        {/* Status Pipeline Selector */}
                        <select
                          value={ticket.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as ServiceTicketStatus;
                            onUpdateTicket({ ...ticket, status: newStatus });
                          }}
                          className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="received">Qabul qilindi</option>
                          <option value="in_diagnosis">Diagnostikada</option>
                          <option value="in_repair">Ta&apos;mirlanmoqda</option>
                          <option value="ready">Tayyor (Mijozga topshirishga)</option>
                          <option value="replaced">Almashtirildi (Zamen)</option>
                          <option value="returned_to_client">Mijozga topshirildi</option>
                          <option value="cancelled">Bekor qilindi</option>
                        </select>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5">
                          {/* Zamen button */}
                          <button
                            type="button"
                            onClick={() => {
                              setReplacementTicket(ticket);
                              setSelectedReplacementSN('');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-xs font-bold flex items-center gap-1 transition"
                            title="Ombordan yangi qurilmaga almashtirish (Zamen)"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Zamen</span>
                          </button>

                          {/* Print slip */}
                          <button
                            type="button"
                            onClick={() => setPrintingTicket(ticket)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                            title="Kvitansiya chop etish"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTicket(ticket);
                              setIsTicketModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                            title="Tahrirlash"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`"${ticket.ticketNumber}" servis arizasini o'chirib tashlamoqchimisiz?`)) {
                                onDeleteTicket(ticket.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 transition"
                            title="O'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tickets Pagination */}
            {totalTicketPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Jami <strong className="text-slate-800 dark:text-white font-mono">{filteredTickets.length}</strong> tadan {(ticketPage - 1) * ticketPageSize + 1} - {Math.min(ticketPage * ticketPageSize, filteredTickets.length)} ko&apos;rsatilmoqda
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTicketPage(p => Math.max(1, p - 1))}
                    disabled={ticketPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 font-mono font-bold text-slate-700 dark:text-slate-300">
                    {ticketPage} / {totalTicketPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTicketPage(p => Math.min(totalTicketPages, p + 1))}
                    disabled={ticketPage === totalTicketPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SOLD SERIALS DATABASE EXPLORER */}
        {activeSubTab === 'sold_serials' && (
          <div className="space-y-4">
            {/* Search Box & Page size */}
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={soldSearchText}
                  onChange={(e) => {
                    setSoldSearchText(e.target.value);
                    setSoldPage(1);
                  }}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  placeholder="Sotilgan tovarlar ichidan S/N, model, mijoz yoki chek raqami bo'yicha qidiring..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
                  {filteredSoldSerials.length.toLocaleString()} ta qurilma topildi
                </span>
                <select
                  value={soldPageSize}
                  onChange={(e) => {
                    setSoldPageSize(Number(e.target.value));
                    setSoldPage(1);
                  }}
                  className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 outline-none"
                >
                  <option value={25}>25 tadan</option>
                  <option value={50}>50 tadan</option>
                  <option value={100}>100 tadan</option>
                </select>
              </div>
            </div>

            {/* Sold Serials Table */}
            <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Seriya Raqami (S/N)</th>
                      <th className="px-4 py-3">Qurilma Nomi</th>
                      <th className="px-4 py-3">Mijoz / Obyekt</th>
                      <th className="px-4 py-3">Chek № / Sana</th>
                      <th className="px-4 py-3">Kafolat Muddat</th>
                      <th className="px-4 py-3">Holati</th>
                      <th className="px-4 py-3 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedSoldSerials.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                          Hech qanday qurilma topilmadi
                        </td>
                      </tr>
                    ) : (
                      paginatedSoldSerials.map((s, idx) => (
                        <tr key={`${s.serialNumber}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="px-4 py-3 font-mono font-black text-cyan-600 dark:text-cyan-400">
                            {s.serialNumber}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900 dark:text-white">{s.productName}</div>
                            <div className="text-[10px] text-slate-400">{s.category}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-800 dark:text-slate-200">{s.customerName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{s.customerPhone}</div>
                          </td>
                          <td className="px-4 py-3 font-mono">
                            <div className="font-bold text-slate-700 dark:text-slate-300">{s.receiptNumber}</div>
                            <div className="text-[10px] text-slate-400">{s.saleDate}</div>
                          </td>
                          <td className="px-4 py-3 font-mono">
                            <div>{s.warrantyMonths} oy</div>
                            <div className="text-[10px] text-slate-400">Tugaydi: {s.expiryDate}</div>
                          </td>
                          <td className="px-4 py-3">
                            {s.isUnderWarranty ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                Amalda ({s.remainingMonths} oy)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                Muddati o&apos;tgan
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setInspectQuery(s.serialNumber);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] transition"
                            >
                              Diagnostika
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Sold Serials Pagination */}
              {totalSoldPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Jami <strong className="text-slate-800 dark:text-white font-mono">{filteredSoldSerials.length.toLocaleString()}</strong> tadan {(soldPage - 1) * soldPageSize + 1} - {Math.min(soldPage * soldPageSize, filteredSoldSerials.length).toLocaleString()} ko&apos;rsatilmoqda
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSoldPage(p => Math.max(1, p - 1))}
                      disabled={soldPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {soldPage} / {totalSoldPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSoldPage(p => Math.min(totalSoldPages, p + 1))}
                      disabled={soldPage === totalSoldPages}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700 transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: NEW / EDIT SERVICE TICKET */}
      {/* ------------------------------------------------------------- */}
      {isTicketModalOpen && editingTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {serviceTickets.some(t => t.id === editingTicket.id) ? 'Servis Arizasini Tahrirlash' : 'Nosoz Qurilmani Qabul Qilish (Servis Kvitansiyasi)'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Arizani ro&apos;yxatga olish, mijoz shikoyati va kafolat holatini belgilash
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTicketModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (serviceTickets.some(t => t.id === editingTicket.id)) {
                  onUpdateTicket(editingTicket);
                } else {
                  onAddTicket(editingTicket);
                }
                setIsTicketModalOpen(false);
              }}
              className="p-6 overflow-y-auto space-y-4 text-xs"
            >
              {/* Row 1: S/N and Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    * Seriya Raqami (S/N):
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTicket.serialNumber}
                    onChange={(e) => setEditingTicket({ ...editingTicket, serialNumber: e.target.value.trim().toUpperCase() })}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    placeholder="Masalan: HK-4MP-982101"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    * Qurilma Modeli / Nomi:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTicket.productName}
                    onChange={(e) => setEditingTicket({ ...editingTicket, productName: e.target.value })}
                    placeholder="Masalan: Hikvision DS-2CD1043G0-I 4MP"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Row 2: Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    * Mijoz / Buyurtmachi F.I.Sh.:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTicket.customerName}
                    onChange={(e) => setEditingTicket({ ...editingTicket, customerName: e.target.value })}
                    placeholder="Mijoz ismi yoki tashkilot nomi..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    * Telefon Raqami:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTicket.customerPhone}
                    onChange={(e) => setEditingTicket({ ...editingTicket, customerPhone: e.target.value })}
                    placeholder="+998 90 123 45 67"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Row 3: Issue Description & Presets */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  * Mijoz Shikoyati / Nosozlik Sababi:
                </label>
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  {[
                    'Tungi IR rejim ishlamayapti',
                    'P2P ulanmayapti / Cloud oflayn',
                    'PoE porti / Pitanie kuygan',
                    'Parol esdan chiqqan (Reset)',
                    'Tasvir xira / linza shikastlangan',
                    'Signal uzilib qolmoqda'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditingTicket({ ...editingTicket, issueDescription: preset })}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300 transition"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={3}
                  required
                  value={editingTicket.issueDescription}
                  onChange={(e) => setEditingTicket({ ...editingTicket, issueDescription: e.target.value })}
                  placeholder="Nosozlik belgilarini batafsil yozing..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Row 4: Warranty Options & Cost */}
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={editingTicket.isWarrantyFree}
                      onChange={(e) => setEditingTicket({ ...editingTicket, isWarrantyFree: e.target.checked, repairCost: e.target.checked ? 0 : editingTicket.repairCost })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Kafolat bo&apos;yicha bepul ta&apos;mir (Garantiyada)</span>
                  </label>

                  <span className="text-[11px] font-mono text-slate-500">
                    Kafolat: {editingTicket.warrantyMonths} oy
                  </span>
                </div>

                {!editingTicket.isWarrantyFree && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                      Pullik ta&apos;mir summasi:
                    </span>
                    <div className="relative w-44">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={editingTicket.repairCost || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEditingTicket({ ...editingTicket, repairCost: val, repairCostUSD: Number((val / exchangeRate).toFixed(2)) });
                        }}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                        placeholder="0"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-right font-mono font-bold text-xs text-slate-900 dark:text-white"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">so&apos;m</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 5: Diagnostic & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Ariza Holati:
                  </label>
                  <select
                    value={editingTicket.status}
                    onChange={(e) => setEditingTicket({ ...editingTicket, status: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="received">Qabul qilindi</option>
                    <option value="in_diagnosis">Diagnostikada</option>
                    <option value="in_repair">Ta&apos;mirlanmoqda</option>
                    <option value="ready">Tayyor (Mijozga topshirishga)</option>
                    <option value="replaced">Almashtirildi (Zamen)</option>
                    <option value="returned_to_client">Mijozga topshirildi</option>
                    <option value="cancelled">Bekor qilindi</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Biriktirilgan Usta / Mutaxassis:
                  </label>
                  <input
                    type="text"
                    value={editingTicket.assignedTechnicianName || ''}
                    onChange={(e) => setEditingTicket({ ...editingTicket, assignedTechnicianName: e.target.value })}
                    placeholder="Masalan: Dilshod Karimov"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: REPLACEMENT (ZAMEN) MODAL */}
      {/* ------------------------------------------------------------- */}
      {replacementTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Ombordan Yangisiga Almashtirish (Zamen)
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Chipta: {replacementTicket.ticketNumber} &bull; Eski S/N: {replacementTicket.serialNumber}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplacementTicket(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Kafolat doirasida ushbu nosoz qurilmani ombordagi yangi zaxira apparatga almashtirib berish. 
              Tanlangan yangi seriya raqami ombordan avtomatik yechiladi.
            </p>

            {/* Available Serials Picker */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Omborda Mavjud Yangi Seriya Raqamini Tanlang:
              </label>

              {(() => {
                // Find matching product with available serials
                const matchingProd = products.find(p => p.serialNumbers && p.serialNumbers.length > 0);
                const available = matchingProd ? matchingProd.serialNumbers || [] : [];

                if (available.length === 0) {
                  return (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-xs text-amber-800 dark:text-amber-300 text-center">
                      Omborda ushbu toifada bo&apos;sh seriya raqamli qurilma topilmadi. Avval omborga kirim qiling.
                    </div>
                  );
                }

                return (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto p-1">
                    {available.map(sn => {
                      const isSelected = selectedReplacementSN === sn;
                      return (
                        <button
                          key={sn}
                          type="button"
                          onClick={() => setSelectedReplacementSN(sn)}
                          className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition ${
                            isSelected
                              ? 'bg-cyan-50 dark:bg-cyan-950/50 border-cyan-500 font-bold text-cyan-800 dark:text-cyan-200'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-cyan-400'
                          }`}
                        >
                          <span className="font-mono font-bold">{sn}</span>
                          {isSelected && <Check className="w-4 h-4 text-cyan-600" />}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReplacementTicket(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={!selectedReplacementSN}
                onClick={() => {
                  if (replacementTicket && selectedReplacementSN) {
                    onReplaceDevice(
                      replacementTicket.id,
                      replacementTicket.serialNumber,
                      selectedReplacementSN,
                      replacementTicket.productId
                    );
                    setReplacementTicket(null);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-cyan-600/20"
              >
                Almashtirishni Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: PRINT SERVICE RECEIPT SLIP */}
      {/* ------------------------------------------------------------- */}
      {printingTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 space-y-4 font-mono text-xs">
            <div className="text-center border-b pb-3 space-y-1">
              <h3 className="font-black text-sm uppercase">SMART CONTROL</h3>
              <p className="text-[10px] text-slate-500">Xavfsizlik & Tarmoq Tizimlari</p>
              <p className="font-bold text-xs text-emerald-700 mt-1">SERVIS VA TA&apos;MIR KVITANSIYASI</p>
              <div className="text-[11px] font-bold">№ {printingTicket.ticketNumber}</div>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Sana:</span>
                <strong>{printingTicket.createdAt}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mijoz:</span>
                <strong className="text-right">{printingTicket.customerName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Telefon:</span>
                <strong>{printingTicket.customerPhone}</strong>
              </div>
              <div className="border-t border-dashed my-2" />
              <div>
                <span className="text-slate-500 block">Qurilma:</span>
                <strong className="block text-xs">{printingTicket.productName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">S/N:</span>
                <strong className="text-cyan-700">{printingTicket.serialNumber}</strong>
              </div>
              <div className="border-t border-dashed my-2" />
              <div>
                <span className="text-slate-500 block">Shikoyat / Muammo:</span>
                <p className="italic text-slate-800">{printingTicket.issueDescription}</p>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Kafolat holati:</span>
                <strong className={printingTicket.isWarrantyFree ? 'text-emerald-700' : 'text-rose-700'}>
                  {printingTicket.isWarrantyFree ? 'KAFOLATLI (BEPUL)' : 'PULLIK'}
                </strong>
              </div>
            </div>

            <div className="border-t border-slate-300 pt-6 flex justify-between text-[10px] text-slate-500">
              <div>Topshirdi: _________</div>
              <div>Qabul qildi: _________</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setPrintingTicket(null)}
                className="px-3 py-1.5 rounded-lg border text-xs"
              >
                Yopish
              </button>
              <button
                type="button"
                onClick={() => {
                  const html = `
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta charset="utf-8">
                        <title>Kvitansiya: ${printingTicket.ticketNumber}</title>
                        <style>
                          @page { size: auto; margin: 0; }
                          * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                          html, body {
                            width: 50mm;
                            max-width: 50mm;
                            margin: 0 auto;
                            padding: 4px 2px;
                            background: #fff;
                            color: #000;
                            font-family: monospace;
                            font-size: 10.5px;
                            line-height: 1.2;
                          }
                        </style>
                      </head>
                      <body>
                        <div style="text-align:center; border-bottom:1px dashed #000; padding-bottom:4px; margin-bottom:4px;">
                          <div style="font-weight:900; font-size:13px;">SMART CONTROL</div>
                          <div style="font-size:9px;">Xavfsizlik &amp; Tarmoq Tizimlari</div>
                          <div style="font-weight:bold; font-size:10.5px; margin-top:2px;">SERVIS VA TA'MIR KVITANSIYASI</div>
                          <div style="font-weight:bold; font-size:11px;">№ ${printingTicket.ticketNumber}</div>
                        </div>
                        <div style="border-bottom:1px dashed #000; padding-bottom:4px; margin-bottom:4px; font-size:10px;">
                          <div style="display:flex;justify-content:space-between;"><span>Sana:</span><span>${printingTicket.createdAt}</span></div>
                          <div style="display:flex;justify-content:space-between;"><span>Mijoz:</span><span>${printingTicket.customerName}</span></div>
                          <div style="display:flex;justify-content:space-between;"><span>Tel:</span><span>${printingTicket.customerPhone}</span></div>
                        </div>
                        <div style="border-bottom:1px dashed #000; padding-bottom:4px; margin-bottom:4px; font-size:10px;">
                          <div><span style="color:#555;">Qurilma:</span> <strong>${printingTicket.productName}</strong></div>
                          <div><span style="color:#555;">S/N:</span> <strong>${printingTicket.serialNumber}</strong></div>
                          <div style="margin-top:2px;"><span style="color:#555;">Muammo:</span> <em>${printingTicket.issueDescription}</em></div>
                          <div style="margin-top:2px; font-weight:bold;">Holat: ${printingTicket.isWarrantyFree ? 'KAFOLATLI (BEPUL)' : 'PULLIK'}</div>
                        </div>
                        <div style="font-size:9px; padding-top:4px;">
                          <div style="margin-bottom:6px;">Topshirdi: ________________</div>
                          <div style="margin-bottom:6px;">Qabul qildi: ______________</div>
                          <div style="text-align:center; font-size:8px; margin-top:4px;">Kvitansiyani saqlang!</div>
                        </div>
                      </body>
                    </html>
                  `;
                  printRawHtmlInIframe(html);
                }}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs"
              >
                Chop etish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
