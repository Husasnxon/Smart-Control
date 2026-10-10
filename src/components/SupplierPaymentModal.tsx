'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  CreditCard, 
  Check, 
  DollarSign, 
  Calendar, 
  Building2, 
  FileText, 
  Clock, 
  AlertCircle, 
  ArrowRight,
  UserCheck,
  Search,
  ChevronDown,
  Phone
} from 'lucide-react';
import { PurchaseInvoice, PurchasePaymentRecord, Currency } from '@/types';
import { DEFAULT_SUPPLIERS } from '@/data/mockData';

interface SupplierPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchases: PurchaseInvoice[];
  preselectedPurchaseId?: string | null;
  preselectedSupplierName?: string | null;
  exchangeRate: number;
  baseCurrency?: Currency;
  onConfirmPayment: (payment: PurchasePaymentRecord, updatedInvoice: PurchaseInvoice) => void;
}

export const SupplierPaymentModal: React.FC<SupplierPaymentModalProps> = ({
  isOpen,
  onClose,
  purchases,
  preselectedPurchaseId = null,
  preselectedSupplierName = null,
  exchangeRate = 12850,
  baseCurrency = 'UZS',
  onConfirmPayment
}) => {
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [supplierSearchQuery, setSupplierSearchQuery] = useState<string>('');
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState<boolean>(false);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>('');
  const [paymentCurrency, setPaymentCurrency] = useState<'USD' | 'UZS'>(baseCurrency);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'usd' | 'bank_transfer' | 'cash' | 'card'>('usd');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paidBy, setPaidBy] = useState<string>('Boshqaruvchi / Kassir');
  const [notes, setNotes] = useState<string>('');

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target as Node)) {
        setIsSupplierDropdownOpen(false);
      }
    };
    if (isSupplierDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSupplierDropdownOpen]);

  // All active (non-cancelled) purchases
  const activePurchases = useMemo(() => {
    return purchases.filter((p) => p.status !== 'cancelled');
  }, [purchases]);

  // Extract unique suppliers with debt calculations
  const suppliersWithDebtInfo = useMemo(() => {
    const map = new Map<string, {
      name: string;
      phone?: string;
      totalPurchasesUZS: number;
      totalPaidUZS: number;
      totalDebtUZS: number;
      totalDebtUSD: number;
      unpaidInvoices: PurchaseInvoice[];
    }>();

    activePurchases.forEach((p) => {
      const name = p.supplierName;
      if (!map.has(name)) {
        map.set(name, {
          name,
          phone: p.supplierPhone,
          totalPurchasesUZS: 0,
          totalPaidUZS: 0,
          totalDebtUZS: 0,
          totalDebtUSD: 0,
          unpaidInvoices: []
        });
      }

      const rec = map.get(name)!;
      rec.totalPurchasesUZS += p.totalAmount;
      rec.totalPaidUZS += (p.paidAmount || 0);

      // Remaining debt on this invoice
      const invoiceDebtUZS = p.debtAmount !== undefined 
        ? p.debtAmount 
        : (p.paymentStatus === 'paid' ? 0 : p.paymentStatus === 'debt' ? p.totalAmount : Math.max(0, p.totalAmount - (p.paidAmount || 0)));
      
      const invoiceDebtUSD = p.debtAmountUSD !== undefined
        ? p.debtAmountUSD
        : Number((invoiceDebtUZS / (p.exchangeRate || exchangeRate)).toFixed(2));

      rec.totalDebtUZS += invoiceDebtUZS;
      rec.totalDebtUSD += invoiceDebtUSD;

      if (invoiceDebtUZS > 0 || p.paymentStatus !== 'paid') {
        rec.unpaidInvoices.push(p);
      }
    });

    // Also include default suppliers if they don't have purchase records yet
    DEFAULT_SUPPLIERS.forEach((name) => {
      if (!map.has(name)) {
        map.set(name, {
          name,
          phone: undefined,
          totalPurchasesUZS: 0,
          totalPaidUZS: 0,
          totalDebtUZS: 0,
          totalDebtUSD: 0,
          unpaidInvoices: []
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalDebtUZS - a.totalDebtUZS);
  }, [activePurchases, exchangeRate]);

  // Filter suppliers by search query
  const filteredSuppliers = useMemo(() => {
    const q = supplierSearchQuery.trim().toLowerCase();
    if (!q) return suppliersWithDebtInfo;
    return suppliersWithDebtInfo.filter((s) => 
      s.name.toLowerCase().includes(q) || (s.phone && s.phone.toLowerCase().includes(q))
    );
  }, [suppliersWithDebtInfo, supplierSearchQuery]);

  // Setup initial selection on open
  useEffect(() => {
    if (isOpen) {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
      setPaymentDate(now);
      setNotes('');
      setPaidBy('Boshqaruvchi / Kassir');
      setSupplierSearchQuery('');
      setIsSupplierDropdownOpen(false);

      if (preselectedPurchaseId) {
        const foundInvoice = activePurchases.find((p) => p.id === preselectedPurchaseId);
        if (foundInvoice) {
          setSelectedSupplier(foundInvoice.supplierName);
          setSelectedPurchaseId(foundInvoice.id);
          setPaymentCurrency(foundInvoice.currency);
          setPaymentMethod(foundInvoice.currency === 'USD' ? 'usd' : 'cash');
          
          const debtUSD = foundInvoice.debtAmountUSD ?? Number(((foundInvoice.debtAmount || 0) / (foundInvoice.exchangeRate || exchangeRate)).toFixed(2));
          const debtUZS = foundInvoice.debtAmount ?? Math.max(0, foundInvoice.totalAmount - (foundInvoice.paidAmount || 0));

          const defaultAmount = foundInvoice.currency === 'USD' ? debtUSD : debtUZS;
          setPaymentAmount(defaultAmount > 0 ? String(defaultAmount) : '');
          return;
        }
      }

      if (preselectedSupplierName) {
        const supplierInfo = suppliersWithDebtInfo.find((s) => s.name === preselectedSupplierName);
        if (supplierInfo) {
          setSelectedSupplier(supplierInfo.name);
          const firstUnpaid = supplierInfo.unpaidInvoices[0];
          if (firstUnpaid) {
            setSelectedPurchaseId(firstUnpaid.id);
            setPaymentCurrency(firstUnpaid.currency);
            setPaymentMethod(firstUnpaid.currency === 'USD' ? 'usd' : 'cash');
            const debt = firstUnpaid.currency === 'USD' 
              ? (firstUnpaid.debtAmountUSD ?? Number(((firstUnpaid.debtAmount || 0) / (firstUnpaid.exchangeRate || exchangeRate)).toFixed(2)))
              : (firstUnpaid.debtAmount ?? Math.max(0, firstUnpaid.totalAmount - (firstUnpaid.paidAmount || 0)));
            setPaymentAmount(debt > 0 ? String(debt) : '');
          } else {
            setSelectedPurchaseId('');
            setPaymentAmount('');
          }
          return;
        }
      }

      // Default: pick first supplier with debt
      const firstWithDebt = suppliersWithDebtInfo.find((s) => s.totalDebtUZS > 0) || suppliersWithDebtInfo[0];
      if (firstWithDebt) {
        setSelectedSupplier(firstWithDebt.name);
        const firstUnpaid = firstWithDebt.unpaidInvoices[0];
        if (firstUnpaid) {
          setSelectedPurchaseId(firstUnpaid.id);
          setPaymentCurrency(firstUnpaid.currency);
          setPaymentMethod(firstUnpaid.currency === 'USD' ? 'usd' : 'cash');
          const debt = firstUnpaid.currency === 'USD' 
            ? (firstUnpaid.debtAmountUSD ?? Number(((firstUnpaid.debtAmount || 0) / (firstUnpaid.exchangeRate || exchangeRate)).toFixed(2)))
            : (firstUnpaid.debtAmount ?? Math.max(0, firstUnpaid.totalAmount - (firstUnpaid.paidAmount || 0)));
          setPaymentAmount(debt > 0 ? String(debt) : '');
        } else {
          setSelectedPurchaseId('');
          setPaymentAmount('');
        }
      }
    }
  }, [isOpen, preselectedPurchaseId, preselectedSupplierName, activePurchases, suppliersWithDebtInfo, exchangeRate]);

  // Selected supplier object
  const currentSupplierInfo = useMemo(() => {
    return suppliersWithDebtInfo.find((s) => s.name === selectedSupplier);
  }, [suppliersWithDebtInfo, selectedSupplier]);

  // Unpaid invoices of selected supplier
  const availableInvoices = useMemo(() => {
    if (!currentSupplierInfo) return [];
    return currentSupplierInfo.unpaidInvoices;
  }, [currentSupplierInfo]);

  // Selected invoice object
  const selectedInvoice = useMemo(() => {
    return activePurchases.find((p) => p.id === selectedPurchaseId);
  }, [activePurchases, selectedPurchaseId]);

  // Selected invoice's current debt
  const selectedInvoiceDebtUZS = useMemo(() => {
    if (!selectedInvoice) return 0;
    if (selectedInvoice.debtAmount !== undefined) return selectedInvoice.debtAmount;
    if (selectedInvoice.paymentStatus === 'paid') return 0;
    if (selectedInvoice.paymentStatus === 'debt') return selectedInvoice.totalAmount;
    return Math.max(0, selectedInvoice.totalAmount - (selectedInvoice.paidAmount || 0));
  }, [selectedInvoice]);

  const selectedInvoiceDebtUSD = useMemo(() => {
    if (!selectedInvoice) return 0;
    if (selectedInvoice.debtAmountUSD !== undefined) return selectedInvoice.debtAmountUSD;
    return Number((selectedInvoiceDebtUZS / (selectedInvoice.exchangeRate || exchangeRate)).toFixed(2));
  }, [selectedInvoice, selectedInvoiceDebtUZS, exchangeRate]);

  // Handle supplier change
  const handleSupplierChange = (newSupplier: string) => {
    setSelectedSupplier(newSupplier);
    setSupplierSearchQuery('');
    setIsSupplierDropdownOpen(false);
    const supp = suppliersWithDebtInfo.find((s) => s.name === newSupplier);
    if (supp && supp.unpaidInvoices.length > 0) {
      const inv = supp.unpaidInvoices[0];
      setSelectedPurchaseId(inv.id);
      setPaymentCurrency(inv.currency);
      setPaymentMethod(inv.currency === 'USD' ? 'usd' : 'cash');
      const debt = inv.currency === 'USD'
        ? (inv.debtAmountUSD ?? Number(((inv.debtAmount || 0) / (inv.exchangeRate || exchangeRate)).toFixed(2)))
        : (inv.debtAmount ?? Math.max(0, inv.totalAmount - (inv.paidAmount || 0)));
      setPaymentAmount(debt > 0 ? String(debt) : '');
    } else {
      setSelectedPurchaseId('');
      setPaymentAmount('');
    }
  };

  // Handle invoice change
  const handleInvoiceChange = (invId: string) => {
    setSelectedPurchaseId(invId);
    const inv = activePurchases.find((p) => p.id === invId);
    if (inv) {
      setPaymentCurrency(inv.currency);
      setPaymentMethod(inv.currency === 'USD' ? 'usd' : 'cash');
      const debt = inv.currency === 'USD'
        ? (inv.debtAmountUSD ?? Number(((inv.debtAmount || 0) / (inv.exchangeRate || exchangeRate)).toFixed(2)))
        : (inv.debtAmount ?? Math.max(0, inv.totalAmount - (inv.paidAmount || 0)));
      setPaymentAmount(debt > 0 ? String(debt) : '');
    }
  };

  // Numerical payment amount
  const numericAmount = Math.max(0, parseFloat(paymentAmount) || 0);

  // Computed payment in both currencies
  const paymentUSD = paymentCurrency === 'USD' 
    ? Number(numericAmount.toFixed(2)) 
    : Number((numericAmount / exchangeRate).toFixed(2));
  const paymentUZS = paymentCurrency === 'UZS' 
    ? Math.round(numericAmount) 
    : Math.round(numericAmount * exchangeRate);

  // New remaining debt after payment
  const remainingDebtUZS = Math.max(0, selectedInvoiceDebtUZS - paymentUZS);
  const remainingDebtUSD = Number(Math.max(0, selectedInvoiceDebtUSD - paymentUSD).toFixed(2));
  const willBeFullyPaid = remainingDebtUZS <= 0;

  // Submit payment
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInvoice) {
      alert("Iltimos, to'lov biriktiriladigan kirim nakladnoyini tanlang!");
      return;
    }

    if (numericAmount <= 0) {
      alert("To'lov summasi 0 dan katta bo'lishi kerak!");
      return;
    }

    const paymentRecord: PurchasePaymentRecord = {
      id: `ppay-${Date.now()}`,
      purchaseId: selectedInvoice.id,
      invoiceNumber: selectedInvoice.invoiceNumber,
      supplierName: selectedInvoice.supplierName,
      amount: paymentUZS,
      amountUSD: paymentUSD,
      currency: paymentCurrency,
      paymentMethod,
      date: paymentDate || new Date().toISOString().replace('T', ' ').slice(0, 16),
      notes: notes.trim() || undefined,
      paidBy: paidBy.trim() || undefined
    };

    const newPaidUZS = (selectedInvoice.paidAmount || 0) + paymentUZS;
    const newPaidUSD = Number(((selectedInvoice.paidAmountUSD || 0) + paymentUSD).toFixed(2));
    const newDebtUZS = Math.max(0, selectedInvoice.totalAmount - newPaidUZS);
    const newDebtUSD = Number(Math.max(0, selectedInvoice.totalAmountUSD - newPaidUSD).toFixed(2));
    const newPaymentStatus = newDebtUZS <= 0 ? 'paid' : 'partial';

    const updatedInvoice: PurchaseInvoice = {
      ...selectedInvoice,
      paidAmount: newPaidUZS,
      paidAmountUSD: newPaidUSD,
      debtAmount: newDebtUZS,
      debtAmountUSD: newDebtUSD,
      paymentStatus: newPaymentStatus,
      payments: [...(selectedInvoice.payments || []), paymentRecord]
    };

    onConfirmPayment(paymentRecord, updatedInvoice);
    onClose();
  };

  // Escape key handler to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (isSupplierDropdownOpen) {
          setIsSupplierDropdownOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSupplierDropdownOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Ta&apos;minotchiga To&apos;lov Qilish
              </h3>
              <p className="text-xs text-slate-500">
                Yetkazib beruvchining qabul qilingan kirim nakladnoylariga to&apos;lov biriktirish va qarzni yopish
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Supplier Select */}
          {/* Supplier Searchable Combobox */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Yetkazib Beruvchi (Ta&apos;minotchi):
            </label>
            <div className="relative" ref={supplierDropdownRef}>
              <div
                onClick={() => setIsSupplierDropdownOpen((prev) => !prev)}
                className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs flex items-center justify-between cursor-pointer transition select-none ${
                  isSupplierDropdownOpen 
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      {selectedSupplier || "Ta'minotchini tanlang..."}
                    </span>
                    {currentSupplierInfo && currentSupplierInfo.phone && (
                      <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                        ({currentSupplierInfo.phone})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {currentSupplierInfo && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                      currentSupplierInfo.totalDebtUSD > 0
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}>
                      {currentSupplierInfo.totalDebtUSD > 0 
                        ? `Qarz: $${currentSupplierInfo.totalDebtUSD.toLocaleString()}` 
                        : "Qarz yo'q"}
                    </span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isSupplierDropdownOpen ? 'rotate-180 text-emerald-600' : ''}`} />
                </div>
              </div>

              {/* Dropdown Menu with Search */}
              {isSupplierDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
                  {/* Search Input */}
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        autoFocus
                        value={supplierSearchQuery}
                        onChange={(e) => setSupplierSearchQuery(e.target.value)}
                        placeholder="Ta'minotchi nomi yoki telefon raqamini yozing..."
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                      />
                      {supplierSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setSupplierSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filtered Supplier List */}
                  <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                    {filteredSuppliers.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        <AlertCircle className="w-5 h-5 mx-auto mb-1 opacity-40 text-amber-500" />
                        &quot;{supplierSearchQuery}&quot; bo&apos;yicha ta&apos;minotchi topilmadi
                      </div>
                    ) : (
                      filteredSuppliers.map((s) => {
                        const isSelected = s.name === selectedSupplier;
                        return (
                          <button
                            key={s.name}
                            type="button"
                            onClick={() => {
                              handleSupplierChange(s.name);
                            }}
                            className={`w-full text-left p-2.5 rounded-lg text-xs flex items-center justify-between gap-3 transition ${
                              isSelected
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`font-bold truncate ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-white'}`}>
                                  {s.name}
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                {s.phone && (
                                  <span className="flex items-center gap-1 font-mono">
                                    <Phone className="w-2.5 h-2.5" />
                                    {s.phone}
                                  </span>
                                )}
                                <span>&bull;</span>
                                <span>
                                  {s.unpaidInvoices.length > 0 
                                    ? `${s.unpaidInvoices.length} ta ochiq nakladnoy` 
                                    : "Barchasi to'langan"}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              {s.totalDebtUZS > 0 ? (
                                <div>
                                  <div className="font-black font-mono text-rose-600 dark:text-rose-400">
                                    ${s.totalDebtUSD.toLocaleString()}
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-400">
                                    {(s.totalDebtUZS / 1000).toLocaleString()} ming so&apos;m
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  Qarz yo&apos;q
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Supplier Overall Debt Info Pill */}
          {currentSupplierInfo && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-600" />
                <span className="font-bold text-slate-800 dark:text-slate-200">{currentSupplierInfo.name}</span>
                {currentSupplierInfo.phone && (
                  <span className="text-slate-400 font-mono text-[11px]">&bull; {currentSupplierInfo.phone}</span>
                )}
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-500">Jami qarzimiz:</span>
                <span className="font-black text-rose-600 dark:text-rose-400">
                  ${currentSupplierInfo.totalDebtUSD.toLocaleString()}
                </span>
                <span className="text-slate-400 text-[11px]">
                  ({currentSupplierInfo.totalDebtUZS.toLocaleString()} so&apos;m)
                </span>
              </div>
            </div>
          )}

          {/* Available Invoices to link to */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>To&apos;lov Biriktiriladigan Kirim Nakladnoyi:</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {availableInvoices.length} ta ochiq nakladnoy
              </span>
            </div>

            {availableInvoices.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
                Ushbu ta&apos;minotchi bo&apos;yicha qarzdor nakladnoylar mavjud emas. Barcha hisob-kitoblar yopilgan!
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {availableInvoices.map((inv) => {
                  const isSelected = inv.id === selectedPurchaseId;
                  const invDebtUZS = inv.debtAmount !== undefined 
                    ? inv.debtAmount 
                    : (inv.paymentStatus === 'paid' ? 0 : inv.paymentStatus === 'debt' ? inv.totalAmount : Math.max(0, inv.totalAmount - (inv.paidAmount || 0)));
                  const invDebtUSD = inv.debtAmountUSD !== undefined
                    ? inv.debtAmountUSD
                    : Number((invDebtUZS / (inv.exchangeRate || exchangeRate)).toFixed(2));

                  return (
                    <div
                      key={inv.id}
                      onClick={() => handleInvoiceChange(inv.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30 ring-1 ring-emerald-500' 
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-400'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <div>
                          <div className="font-mono font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                            <span>#{inv.invoiceNumber}</span>
                            {inv.supplierInvoiceNumber && (
                              <span className="text-[10px] font-normal text-slate-400">
                                (Sf: {inv.supplierInvoiceNumber})
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 font-sans">
                            <span>{inv.createdAt}</span>
                            <span>&bull;</span>
                            <span>{inv.items.length} xil tovar ({inv.totalQuantity} dona)</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-xs font-black text-rose-600 dark:text-rose-400">
                          Qarz: ${invDebtUSD.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Jami: ${inv.totalAmountUSD.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment Amount & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            {/* Amount input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  To&apos;lov Summasi:
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentCurrency('USD');
                      if (selectedInvoice) {
                        setPaymentAmount(String(selectedInvoiceDebtUSD));
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      paymentCurrency === 'USD' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    $ USD
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentCurrency('UZS');
                      if (selectedInvoice) {
                        setPaymentAmount(String(selectedInvoiceDebtUZS));
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      paymentCurrency === 'UZS' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    So&apos;m
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step={paymentCurrency === 'USD' ? '0.01' : '1000'}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  placeholder="0.00"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-emerald-500 rounded-xl px-3 py-2 text-sm font-black font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">
                  {paymentCurrency === 'USD' ? '$ USD' : 'so\'m'}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
                <span>≈ {paymentCurrency === 'USD' ? `${paymentUZS.toLocaleString()} so'm` : `$${paymentUSD.toLocaleString()} USD`}</span>
                {selectedInvoice && (
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentAmount(paymentCurrency === 'USD' ? String(selectedInvoiceDebtUSD) : String(selectedInvoiceDebtUZS));
                    }}
                    className="text-emerald-600 font-bold hover:underline"
                  >
                    To&apos;liq to&apos;lash
                  </button>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                To&apos;lov Usuli:
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="usd">Dollar ($ USD - Naqd)</option>
                <option value="cash">So&apos;m Naqd</option>
                <option value="bank_transfer">Hisob-raqamdan o&apos;tkazma (Perechisleniye)</option>
                <option value="card">Bank kartasi (Uzcard / Humo / Korporativ)</option>
              </select>

              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">To&apos;lov sanasi:</label>
                  <input
                    type="datetime-local"
                    value={paymentDate.replace(' ', 'T')}
                    onChange={(e) => setPaymentDate(e.target.value.replace('T', ' '))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-[11px] font-mono outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Mas&apos;ul xodim:</label>
                  <input
                    type="text"
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-[11px] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Izoh / Kvitansiya yoki To&apos;lov topshirig&apos;i №:
            </label>
            <input
              type="text"
              placeholder="Masalan: To'lov topshirig'i №142, kassadan berildi..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Live Outcome Preview Box */}
          {selectedInvoice && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 block">
                To&apos;lov natijasi va hisob-kitob xulosasi:
              </span>
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Hozirgi qarz:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">${selectedInvoiceDebtUSD.toLocaleString()}</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] text-emerald-600 block">Kiritilayotgan to&apos;lov:</span>
                  <span className="font-bold text-emerald-600">+${paymentUSD.toLocaleString()}</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Qoladigan qarz:</span>
                  <span className={`font-bold ${willBeFullyPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ${remainingDebtUSD.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-center font-semibold pt-1">
                {willBeFullyPaid ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                    <Check className="w-3.5 h-3.5" /> #{selectedInvoice.invoiceNumber} nakladnoy to&apos;liq yopiladi!
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">
                    #{selectedInvoice.invoiceNumber} nakladnoy bo&apos;yicha ${remainingDebtUSD.toLocaleString()} qarz qoladi.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Bekor qilish
            </button>

            <button
              type="submit"
              disabled={!selectedInvoice || numericAmount <= 0}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition active:scale-[0.99] flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>To&apos;lovni Tasdiqlash va Nakladnoyga Biriktirish</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
