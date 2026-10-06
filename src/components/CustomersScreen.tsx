'use client';

import React, { useState, useMemo } from 'react';
import { Customer, SaleReceipt, CustomerDebtPayment, Currency } from '../types';
import { formatDualMoney, formatMoney, formatUSDNumber, formatNumberWithSpaces } from '../utils/formatters';
import { 
  Users, 
  Gift, 
  Plus, 
  Search, 
  Crown, 
  CreditCard, 
  Phone, 
  ArrowUpRight,
  ArrowDownRight,
  Award, 
  Coins, 
  X,
  Banknote,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
  Eye,
  Receipt,
  BookOpen,
  Check,
  Building2,
  MapPin,
  RefreshCw,
  Wallet,
  Download,
  Bell,
  Send,
  Copy,
  MessageSquare,
  CalendarClock,
  Share2,
  CheckCheck,
  Clock4,
  ExternalLink,
  Megaphone
} from 'lucide-react';
import { exportDebtsToExcel } from '../utils/excel';
import { getTelegramSettings, sendTelegramMessage } from '../utils/telegram';

interface CustomersScreenProps {
  customers: Customer[];
  receipts: SaleReceipt[];
  debtPayments: CustomerDebtPayment[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer?: (customer: Customer) => void;
  onUpdateCashback: (customerId: string, amountToAdd: number) => void;
  onAddDebtPayment: (payment: CustomerDebtPayment) => void;
  baseCurrency?: Currency;
  exchangeRate?: number;
  onViewReceipt?: (receiptId: string) => void;
}

export const CustomersScreen: React.FC<CustomersScreenProps> = ({
  customers,
  receipts,
  debtPayments,
  onAddCustomer,
  onUpdateCustomer,
  onUpdateCashback,
  onAddDebtPayment,
  baseCurrency = 'UZS',
  exchangeRate = 12850,
  onViewReceipt
}) => {
  // Main Tab: 'debts' (Qarz daftari) vs 'customers' (Mijozlar bazasi va cashback)
  const [mainTab, setMainTab] = useState<'debts' | 'customers'>('debts');

  // Sub-tabs in Debts section
  const [debtSubTab, setDebtSubTab] = useState<'debtors' | 'unpaid_receipts' | 'payment_history'>('debtors');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debtFilter, setDebtFilter] = useState<'all' | 'overdue' | 'due_soon' | 'high_debt' | 'has_usd'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);
  const [printingPayment, setPrintingPayment] = useState<CustomerDebtPayment | null>(null);

  // Bulk selection & Akt Sverka states
  const [selectedDebtorIds, setSelectedDebtorIds] = useState<string[]>([]);
  const [isBulkReminderModalOpen, setIsBulkReminderModalOpen] = useState(false);
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);

  // Reminder Modal state
  const [reminderCustomer, setReminderCustomer] = useState<Customer | null>(null);
  const [reminderTemplate, setReminderTemplate] = useState<'polite' | 'urgent' | 'card'>('polite');
  const [reminderDueDate, setReminderDueDate] = useState<string>('');
  const [customCardInfo, setCustomCardInfo] = useState<string>('8600 1234 5678 9012 (SMART CONTROL)');
  const [isCopied, setIsCopied] = useState(false);
  const [customReminderNote, setCustomReminderNote] = useState('');
  const [telegramSendingStatus, setTelegramSendingStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [telegramSendingMsg, setTelegramSendingMsg] = useState('');

  // New customer form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [tier, setTier] = useState<'Standard' | 'Silver' | 'Gold' | 'VIP'>('Standard');

  // -------------------------------------------------------------
  // 1. CALCULATED METRICS
  // -------------------------------------------------------------
  const totalCashbackPool = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.cashbackBalance || 0), 0);
  }, [customers]);

  const totalDebtPool = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.debtBalance || 0), 0);
  }, [customers]);

  const totalDebtUSD = useMemo(() => {
    return Number((totalDebtPool / exchangeRate).toFixed(2));
  }, [totalDebtPool, exchangeRate]);

  const debtors = useMemo(() => {
    return customers.filter(c => (c.debtBalance || 0) > 0);
  }, [customers]);

  const totalCollectedDebt = useMemo(() => {
    return debtPayments.reduce((sum, p) => sum + (p.amountUZS || 0), 0);
  }, [debtPayments]);

  const totalCollectedDebtUSD = useMemo(() => {
    return Number((totalCollectedDebt / exchangeRate).toFixed(2));
  }, [totalCollectedDebt, exchangeRate]);

  // Receipts with debt
  const unpaidReceipts = useMemo(() => {
    return receipts.filter(r => (r.payments?.debt || 0) > 0);
  }, [receipts]);

  // -------------------------------------------------------------
  // 2. FILTERING & PAGINATION: DEBTORS LIST & REMINDER HELPERS
  // -------------------------------------------------------------
  const [debtorPage, setDebtorPage] = useState(1);
  const [debtorPageSize, setDebtorPageSize] = useState(20);

  const getDebtDueInfo = (dueDate?: string) => {
    if (!dueDate) {
      return { 
        status: 'none' as const, 
        label: "Belgilanmagan", 
        daysDiff: 0, 
        color: 'text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' 
      };
    }
    const now = new Date();
    now.setHours(0,0,0,0);
    const target = new Date(dueDate);
    target.setHours(0,0,0,0);
    const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { 
        status: 'overdue' as const, 
        label: `Muddati o'tgan (${Math.abs(diffDays)} kun)`, 
        daysDiff: diffDays, 
        color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800' 
      };
    }
    if (diffDays === 0) {
      return { 
        status: 'due_soon' as const, 
        label: "Bugun to'lanishi kerak!", 
        daysDiff: 0, 
        color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800' 
      };
    }
    if (diffDays <= 3) {
      return { 
        status: 'due_soon' as const, 
        label: `${diffDays} kun qoldi`, 
        daysDiff: diffDays, 
        color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800' 
      };
    }
    return { 
      status: 'ok' as const, 
      label: `${dueDate} (${diffDays} kun)`, 
      daysDiff: diffDays, 
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800' 
    };
  };

  const getReminderText = (cust: Customer, type: 'polite' | 'urgent' | 'card') => {
    const sumStr = formatNumberWithSpaces(cust.debtBalance) + " so'm";
    const usdStr = cust.debtBalanceUSD ? ` ($${formatUSDNumber(cust.debtBalanceUSD)})` : '';
    const dueStr = cust.debtDueDate ? ` (To'lov muddati: ${cust.debtDueDate})` : '';

    if (type === 'polite') {
      return `Assalomu alaykum, hurmatli ${cust.fullName}! "SMART CONTROL" do'konidan xarid qilgan mahsulotlaringiz bo'yicha ${sumStr}${usdStr} nasiya qarzdorlik mavjud${dueStr}. Iltimos, to'lovni o'z vaqtida amalga oshirishingizni so'raymiz. Murojaat: +998 90 123-45-67. Rahmat!`;
    }
    if (type === 'urgent') {
      return `DIQQAT! Hurmatli ${cust.fullName}! "SMART CONTROL" do'koni oldidagi ${sumStr}${usdStr} nasiya qarzdorlik to'lov muddati o'tib ketgan. Iltimos, hisob-kitobni zudlik bilan yakunlashingizni so'raymiz! Ma'lumot uchun: +998 90 123-45-67.`;
    }
    return `Assalomu alaykum, ${cust.fullName}! "SMART CONTROL" do'koni uchun qarz to'lovi miqdori: ${sumStr}${usdStr}. To'lov uchun karta raqami (Uzcard/Humo): ${customCardInfo}. To'lovdan so'ng chekni yuborishingizni so'raymiz. Rahmat!`;
  };

  const handleOpenReminder = (cust: Customer) => {
    setReminderCustomer(cust);
    setReminderDueDate(cust.debtDueDate || '');
    setReminderTemplate(cust.debtDueDate && getDebtDueInfo(cust.debtDueDate).status === 'overdue' ? 'urgent' : 'polite');
    setIsCopied(false);
    setTelegramSendingStatus('idle');
    setTelegramSendingMsg('');
  };

  const handleSaveDueDate = () => {
    if (!reminderCustomer || !onUpdateCustomer) return;
    const updated = {
      ...reminderCustomer,
      debtDueDate: reminderDueDate || undefined
    };
    onUpdateCustomer(updated);
    setReminderCustomer(updated);
  };

  const handleMarkReminderSent = () => {
    if (!reminderCustomer || !onUpdateCustomer) return;
    const updated = {
      ...reminderCustomer,
      lastReminderSent: new Date().toLocaleString('uz-UZ')
    };
    onUpdateCustomer(updated);
    setReminderCustomer(updated);
  };

  const handleSendTelegramBotReminder = async () => {
    if (!reminderCustomer) return;
    const tgSettings = getTelegramSettings();
    if (!tgSettings.botToken || !tgSettings.chatId) {
      setTelegramSendingStatus('error');
      setTelegramSendingMsg("Sozlamalar bo'limidan Telegram Bot Token va Chat ID kiritilmagan!");
      return;
    }

    setTelegramSendingStatus('sending');
    setTelegramSendingMsg("Telegram botga yuborilmoqda...");

    const text = getReminderText(reminderCustomer, reminderTemplate);
    const htmlMsg = `🔔 <b>QARZ ESLATMASI (SMART CONTROL)</b>\n\n👤 <b>Mijoz:</b> ${reminderCustomer.fullName}\n📞 <b>Telefon:</b> ${reminderCustomer.phone}\n💰 <b>Qarz Miqdori:</b> <b>${formatNumberWithSpaces(reminderCustomer.debtBalance)} so'm</b>${reminderCustomer.debtBalanceUSD ? ` ($${formatUSDNumber(reminderCustomer.debtBalanceUSD)})` : ''}\n📅 <b>To'lov Muddati:</b> ${reminderCustomer.debtDueDate || "Belgilanmagan"}\n\n💬 <b>Xabar Matni:</b>\n<i>${text}</i>`;

    const res = await sendTelegramMessage(tgSettings.botToken, tgSettings.chatId, htmlMsg);
    if (res.success) {
      setTelegramSendingStatus('sent');
      setTelegramSendingMsg("✓ Telegram bot orqali xabar muvaffaqiyatli yuborildi!");
      handleMarkReminderSent();
      setTimeout(() => setTelegramSendingStatus('idle'), 3000);
    } else {
      setTelegramSendingStatus('error');
      setTelegramSendingMsg(`Xatolik: ${res.message}`);
    }
  };

  const handleSelectAllDebtors = () => {
    if (selectedDebtorIds.length === filteredDebtors.length && filteredDebtors.length > 0) {
      setSelectedDebtorIds([]);
    } else {
      setSelectedDebtorIds(filteredDebtors.map(c => c.id));
    }
  };

  const handleToggleDebtor = (id: string) => {
    setSelectedDebtorIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const filteredDebtors = useMemo(() => {
    let list = debtors;
    const q = searchQuery.trim().toLowerCase();

    if (q) {
      list = list.filter(c => 
        c.fullName.toLowerCase().includes(q) ||
        c.phone.includes(q)
      );
    }

    if (debtFilter === 'overdue') {
      list = list.filter(c => getDebtDueInfo(c.debtDueDate).status === 'overdue');
    } else if (debtFilter === 'due_soon') {
      list = list.filter(c => getDebtDueInfo(c.debtDueDate).status === 'due_soon');
    } else if (debtFilter === 'high_debt') {
      list = list.filter(c => c.debtBalance >= 1000000);
    } else if (debtFilter === 'has_usd') {
      list = list.filter(c => (c.debtBalanceUSD || 0) > 0);
    }

    // Sort by largest debt first
    return [...list].sort((a, b) => b.debtBalance - a.debtBalance);
  }, [debtors, searchQuery, debtFilter]);

  const totalDebtorPages = Math.max(1, Math.ceil(filteredDebtors.length / debtorPageSize));
  const paginatedDebtors = useMemo(() => {
    const start = (debtorPage - 1) * debtorPageSize;
    return filteredDebtors.slice(start, start + debtorPageSize);
  }, [filteredDebtors, debtorPage, debtorPageSize]);

  // -------------------------------------------------------------
  // 3. FILTERING & PAGINATION: UNPAID RECEIPTS
  // -------------------------------------------------------------
  const [receiptPage, setReceiptPage] = useState(1);
  const [receiptPageSize, setReceiptPageSize] = useState(20);

  const filteredUnpaidReceipts = useMemo(() => {
    let list = unpaidReceipts;
    const q = searchQuery.trim().toLowerCase();

    if (q) {
      list = list.filter(r => 
        r.receiptNumber.toLowerCase().includes(q) ||
        (r.customer?.fullName || '').toLowerCase().includes(q) ||
        (r.customer?.phone || '').includes(q) ||
        (r.installationAddress || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [unpaidReceipts, searchQuery]);

  const totalReceiptPages = Math.max(1, Math.ceil(filteredUnpaidReceipts.length / receiptPageSize));
  const paginatedUnpaidReceipts = useMemo(() => {
    const start = (receiptPage - 1) * receiptPageSize;
    return filteredUnpaidReceipts.slice(start, start + receiptPageSize);
  }, [filteredUnpaidReceipts, receiptPage, receiptPageSize]);

  // -------------------------------------------------------------
  // 4. FILTERING & PAGINATION: PAYMENT HISTORY
  // -------------------------------------------------------------
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentPageSize, setPaymentPageSize] = useState(20);

  const filteredPayments = useMemo(() => {
    let list = debtPayments;
    const q = searchQuery.trim().toLowerCase();

    if (q) {
      list = list.filter(p => 
        p.paymentNumber.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        (p.customerPhone || '').includes(q) ||
        (p.receiptNumber || '').toLowerCase().includes(q) ||
        (p.notes || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [debtPayments, searchQuery]);

  const totalPaymentPages = Math.max(1, Math.ceil(filteredPayments.length / paymentPageSize));
  const paginatedPayments = useMemo(() => {
    const start = (paymentPage - 1) * paymentPageSize;
    return filteredPayments.slice(start, start + paymentPageSize);
  }, [filteredPayments, paymentPage, paymentPageSize]);

  // -------------------------------------------------------------
  // 5. FILTERING & PAGINATION: ALL CUSTOMERS (LOYALTY)
  // -------------------------------------------------------------
  const [customerPage, setCustomerPage] = useState(1);
  const [customerPageSize, setCustomerPageSize] = useState(25);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c => 
      c.fullName.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  }, [customers, searchQuery]);

  const totalCustomerPages = Math.max(1, Math.ceil(filteredCustomers.length / customerPageSize));
  const paginatedCustomers = useMemo(() => {
    const start = (customerPage - 1) * customerPageSize;
    return filteredCustomers.slice(start, start + customerPageSize);
  }, [filteredCustomers, customerPage, customerPageSize]);

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------
  const handleOpenPaymentModal = (cust?: Customer) => {
    setSelectedCustomerForPayment(cust || null);
    setIsPaymentModalOpen(true);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const rateMap = { Standard: 1, Silver: 2, Gold: 3, VIP: 5 };

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      fullName: name,
      phone,
      cashbackBalance: 10000, // 10 000 so'm welcome bonus!
      totalPurchases: 0,
      debtBalance: 0,
      debtBalanceUSD: 0,
      tier,
      cashbackRate: rateMap[tier],
      registeredDate: new Date().toISOString().split('T')[0]
    };

    onAddCustomer(newCust);
    setIsAddModalOpen(false);
    setName('');
    setPhone('+998 ');
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-500" />
              <span>Nasiyalar (Qarz Daftari) & Mijozlar</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-mono">
              {debtors.length} ta qarzdor
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Mijozlar qarzdorligi, qarz to&apos;lovlarini qabul qilish, kvitansiya chop etish va cashback boshqaruvi
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportDebtsToExcel(customers, debtPayments, exchangeRate)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition active:scale-[0.98]"
            title="Qarzdorlar ro'yxati va qarz to'lovlari tarixini Excelga eksport qilish"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Excel Eksport</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenPaymentModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20 transition active:scale-[0.98]"
          >
            <Wallet className="w-4 h-4" />
            <span>+ Qarz To&apos;lovini Qabul Qilish</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20 transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yangi Mijoz</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {/* SUMMARY STATS TILES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Tile 1: Total Debt Balance */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/40 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Jami Nasiyalar (Qarz)
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                {formatNumberWithSpaces(totalDebtPool)} <span className="text-xs font-bold text-slate-400">so&apos;m</span>
              </div>
              <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                ≈ ${formatUSDNumber(totalDebtUSD)} USD
              </div>
            </div>
          </div>

          {/* Tile 2: Total Debtors count */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Qarzdor Mijozlar
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                {debtors.length} <span className="text-xs font-bold text-slate-400">ta mijoz</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Barcha mijozlarning {Math.round((debtors.length / Math.max(1, customers.length)) * 100)}% qismi
              </div>
            </div>
          </div>

          {/* Tile 3: Total Collected Debt */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Undirilgan Qarzlar
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {formatNumberWithSpaces(totalCollectedDebt)} <span className="text-xs font-bold text-slate-400">so&apos;m</span>
              </div>
              <div className="text-xs font-bold font-mono text-slate-400 mt-0.5">
                {debtPayments.length} ta to&apos;lov tranzaksiyasi
              </div>
            </div>
          </div>

          {/* Tile 4: Total Cashback Pool */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Cashback Jamg&apos;armasi
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                <Gift className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
                {formatNumberWithSpaces(totalCashbackPool)} <span className="text-xs font-bold text-slate-400">so&apos;m</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Mijozlar hisobidagi rag&apos;batlar
              </div>
            </div>
          </div>
        </div>

        {/* PRIMARY TAB SWITCHER */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setMainTab('debts');
                setSearchQuery('');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                mainTab === 'debts'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Nasiyalar & Qarz Daftari ({debtors.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMainTab('customers');
                setSearchQuery('');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                mainTab === 'customers'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Barcha Mijozlar & Sodiqlik ({customers.length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            Kurs: 1$ = {exchangeRate.toLocaleString()} so&apos;m
          </div>
        </div>

        {/* ============================================================= */}
        {/* MAIN TAB 1: NASIYALAR & QARZ DAFTARI */}
        {/* ============================================================= */}
        {mainTab === 'debts' && (
          <div className="space-y-4">
            {/* Sub-tabs & Search Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              {/* Sub-tab pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => {
                    setDebtSubTab('debtors');
                    setDebtorPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    debtSubTab === 'debtors'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Qarzdor Mijozlar ({debtors.length})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDebtSubTab('unpaid_receipts');
                    setReceiptPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    debtSubTab === 'unpaid_receipts'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Nasiya Cheklar ({unpaidReceipts.length})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDebtSubTab('payment_history');
                    setPaymentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    debtSubTab === 'payment_history'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  To&apos;lovlar Tarixi ({debtPayments.length})
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Mijoz, telefon yoki chek raqami..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs focus:ring-2 focus:ring-amber-500/40 text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>
            </div>

            {/* ----------------------------------------------------------- */}
            {/* SUB-TAB 1: DEBTORS LIST */}
            {/* ----------------------------------------------------------- */}
            {debtSubTab === 'debtors' && (
              <div className="space-y-4">
                {/* Secondary Filter Chips & Page Size */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDebtFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        debtFilter === 'all'
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      Barchasi ({debtors.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDebtFilter('overdue')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                        debtFilter === 'overdue'
                          ? 'bg-rose-600 text-white'
                          : 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100'
                      }`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      Muddati o&apos;tganlar ({debtors.filter(c => getDebtDueInfo(c.debtDueDate).status === 'overdue').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDebtFilter('due_soon')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                        debtFilter === 'due_soon'
                          ? 'bg-amber-500 text-white'
                          : 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100'
                      }`}
                    >
                      <Clock4 className="w-3 h-3" />
                      Yaqinlashganlar ({debtors.filter(c => getDebtDueInfo(c.debtDueDate).status === 'due_soon').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDebtFilter('high_debt')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        debtFilter === 'high_debt'
                          ? 'bg-purple-600 text-white'
                          : 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100'
                      }`}
                    >
                      Yirik qarzlar (&gt;1 mln) ({debtors.filter(c => c.debtBalance >= 1000000).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDebtFilter('has_usd')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        debtFilter === 'has_usd'
                          ? 'bg-emerald-600 text-white'
                          : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100'
                      }`}
                    >
                      $ Dollarda ({debtors.filter(c => (c.debtBalanceUSD || 0) > 0).length})
                    </button>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-slate-400 font-mono">{filteredDebtors.length} ta qarzdor</span>
                    <select
                      value={debtorPageSize}
                      onChange={(e) => {
                        setDebtorPageSize(Number(e.target.value));
                        setDebtorPage(1);
                      }}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <option value={20}>20 tadan</option>
                      <option value={50}>50 tadan</option>
                      <option value={100}>100 tadan</option>
                    </select>
                  </div>
                </div>

                {/* Bulk Actions Floating / Sticky Bar */}
                {selectedDebtorIds.length > 0 && (
                  <div className="p-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl text-white shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xs">
                        {selectedDebtorIds.length}
                      </span>
                      <div>
                        <div className="font-bold text-xs">
                          {selectedDebtorIds.length} ta qarzdor mijoz tanlandi
                        </div>
                        <div className="text-[11px] text-white/80 font-mono">
                          Jami qarz: {formatNumberWithSpaces(
                            customers.filter(c => selectedDebtorIds.includes(c.id)).reduce((s, c) => s + c.debtBalance, 0)
                          )} so&apos;m
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsBulkReminderModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-white text-indigo-700 hover:bg-slate-100 font-bold text-xs shadow-md flex items-center gap-1.5 transition active:scale-[0.98]"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>📢 Ommaviy Eslatma Yuborish</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedDebtorIds([])}
                        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
                      >
                        Bekor qilish
                      </button>
                    </div>
                  </div>
                )}

                {/* Debtors Table */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={filteredDebtors.length > 0 && selectedDebtorIds.length === filteredDebtors.length}
                              onChange={handleSelectAllDebtors}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                              title="Barcha qarzdorlarni tanlash"
                            />
                          </th>
                          <th className="py-3 px-4">Qarzdor Mijoz</th>
                          <th className="py-3 px-4">Telefon</th>
                          <th className="py-3 px-4">To&apos;lov Muddati & Holat</th>
                          <th className="py-3 px-4 text-right">Qarzdorlik (So&apos;m)</th>
                          <th className="py-3 px-4 text-right">Qarzdorlik ($ USD)</th>
                          <th className="py-3 px-4 text-right">Jami Xaridlari</th>
                          <th className="py-3 px-4 text-right">Amallar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {paginatedDebtors.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-slate-400">
                              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-60" />
                              <div className="font-bold text-slate-700 dark:text-slate-300">
                                Hech qanday qarzdor topilmadi!
                              </div>
                              <p className="text-xs text-slate-400 mt-1">Tanlangan filtr bo&apos;yicha qarzdorlar mavjud emas</p>
                            </td>
                          </tr>
                        ) : (
                          paginatedDebtors.map((cust) => {
                            const custUSD = cust.debtBalanceUSD || Number((cust.debtBalance / exchangeRate).toFixed(2));
                            const dueInfo = getDebtDueInfo(cust.debtDueDate);
                            const isSelected = selectedDebtorIds.includes(cust.id);

                            return (
                              <tr 
                                key={cust.id} 
                                className={`transition ${
                                  isSelected 
                                    ? 'bg-blue-50/70 dark:bg-blue-950/40' 
                                    : 'hover:bg-amber-50/40 dark:hover:bg-amber-950/20'
                                }`}
                              >
                                <td className="py-3 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleDebtor(cust.id)}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  />
                                </td>

                                <td className="py-3 px-4">
                                  <div className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>{cust.fullName}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    Ro&apos;yxatdan: {cust.registeredDate}
                                  </div>
                                </td>

                                <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                                  <div className="flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    <span>{cust.phone}</span>
                                  </div>
                                </td>

                                <td className="py-3 px-4">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReminder(cust)}
                                    title="Muddatni belgilash yoki eslatma yuborish"
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition hover:opacity-80 ${dueInfo.color}`}
                                  >
                                    <CalendarClock className="w-3 h-3" />
                                    <span>{dueInfo.label}</span>
                                  </button>
                                  {cust.lastReminderSent && (
                                    <div className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1">
                                      <Send className="w-2.5 h-2.5 text-emerald-500" />
                                      <span>Yuborilgan: {cust.lastReminderSent.slice(0, 10)}</span>
                                    </div>
                                  )}
                                </td>

                                <td className="py-3 px-4 text-right font-mono font-black text-sm text-rose-600 dark:text-rose-400">
                                  {formatNumberWithSpaces(cust.debtBalance)} so&apos;m
                                </td>

                                <td className="py-3 px-4 text-right font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                                  ${formatUSDNumber(custUSD)}
                                </td>

                                <td className="py-3 px-4 text-right font-mono text-slate-500">
                                  {formatMoney(cust.totalPurchases, baseCurrency, exchangeRate)}
                                </td>

                                <td className="py-3 px-4 text-right">
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setStatementCustomer(cust)}
                                      className="px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800 transition flex items-center gap-1"
                                      title="Akt Sverka (Taqqoslash dalolatnomasi)ni ko'rish va chop etish"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                      <span className="hidden sm:inline">Akt Sverka</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenReminder(cust)}
                                      className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-xs border border-blue-200 dark:border-blue-800 transition flex items-center gap-1"
                                      title="SMS / Telegram eslatma yuborish"
                                    >
                                      <Bell className="w-3.5 h-3.5" />
                                      <span className="hidden sm:inline">Eslatma</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenPaymentModal(cust)}
                                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition active:scale-[0.98] inline-flex items-center gap-1.5"
                                    >
                                      <Wallet className="w-3.5 h-3.5" />
                                      <span>To&apos;lov</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  {totalDebtorPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">
                        Jami <strong className="text-slate-800 dark:text-white font-mono">{filteredDebtors.length}</strong> tadan {(debtorPage - 1) * debtorPageSize + 1} - {Math.min(debtorPage * debtorPageSize, filteredDebtors.length)} ko&apos;rsatilmoqda
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDebtorPage(p => Math.max(1, p - 1))}
                          disabled={debtorPage === 1}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700 transition"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {debtorPage} / {totalDebtorPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setDebtorPage(p => Math.min(totalDebtorPages, p + 1))}
                          disabled={debtorPage === totalDebtorPages}
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

            {/* ----------------------------------------------------------- */}
            {/* SUB-TAB 2: UNPAID / PARTIAL RECEIPTS */}
            {/* ----------------------------------------------------------- */}
            {debtSubTab === 'unpaid_receipts' && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Chek № / Sana</th>
                          <th className="py-3 px-4">Xaridor</th>
                          <th className="py-3 px-4">Obyekt / Manzil</th>
                          <th className="py-3 px-4 text-right">Chek Summasi</th>
                          <th className="py-3 px-4 text-right">To&apos;langan</th>
                          <th className="py-3 px-4 text-right">Nasiya (Qarz)</th>
                          <th className="py-3 px-4 text-right">Amal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {paginatedUnpaidReceipts.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400">
                              Nasiyaga berilgan cheklar topilmadi
                            </td>
                          </tr>
                        ) : (
                          paginatedUnpaidReceipts.map((r) => {
                            const paidPart = (r.payments?.cash || 0) + (r.payments?.card || 0) + (r.payments?.cashbackUsed || 0);
                            const debtPart = r.payments?.debt || 0;

                            return (
                              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                <td className="py-3 px-4 font-mono">
                                  <div className="font-bold text-slate-900 dark:text-white">{r.receiptNumber}</div>
                                  <div className="text-[10px] text-slate-400">{r.createdAt}</div>
                                </td>

                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-800 dark:text-slate-200">
                                    {r.customer?.fullName || 'Noma\'lum xaridor'}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {r.customer?.phone || '-'}
                                  </div>
                                </td>

                                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                                  {r.installationAddress ? (
                                    <div className="flex items-center gap-1 text-[11px]">
                                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                      <span className="truncate max-w-xs">{r.installationAddress}</span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>

                                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                                  {formatNumberWithSpaces(r.totalAmount)} so&apos;m
                                </td>

                                <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                                  {formatNumberWithSpaces(paidPart)} so&apos;m
                                </td>

                                <td className="py-3 px-4 text-right font-mono font-black text-rose-600 dark:text-rose-400">
                                  {formatNumberWithSpaces(debtPart)} so&apos;m
                                </td>

                                <td className="py-3 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (r.customer) {
                                        handleOpenPaymentModal(r.customer);
                                      }
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold text-xs transition"
                                  >
                                    To&apos;lov
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  {totalReceiptPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">
                        Jami <strong className="text-slate-800 dark:text-white font-mono">{filteredUnpaidReceipts.length}</strong> tadan {(receiptPage - 1) * receiptPageSize + 1} - {Math.min(receiptPage * receiptPageSize, filteredUnpaidReceipts.length)} ko&apos;rsatilmoqda
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setReceiptPage(p => Math.max(1, p - 1))}
                          disabled={receiptPage === 1}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700 transition"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {receiptPage} / {totalReceiptPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setReceiptPage(p => Math.min(totalReceiptPages, p + 1))}
                          disabled={receiptPage === totalReceiptPages}
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

            {/* ----------------------------------------------------------- */}
            {/* SUB-TAB 3: PAYMENT HISTORY LOG */}
            {/* ----------------------------------------------------------- */}
            {debtSubTab === 'payment_history' && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Kvitansiya №</th>
                          <th className="py-3 px-4">Sana va Vaqt</th>
                          <th className="py-3 px-4">Mijoz</th>
                          <th className="py-3 px-4">To&apos;lov Usuli</th>
                          <th className="py-3 px-4 text-right">To&apos;langan Summa</th>
                          <th className="py-3 px-4 text-right">Qoldiq Qarz</th>
                          <th className="py-3 px-4">Kassir / Izoh</th>
                          <th className="py-3 px-4 text-right">Chek</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {paginatedPayments.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-slate-400">
                              Hech qanday qarz to&apos;lovi qayd etilmagan
                            </td>
                          </tr>
                        ) : (
                          paginatedPayments.map((p) => {
                            const methodLabels: Record<string, string> = {
                              cash: 'Naqd (so\'m)',
                              cashUSD: 'Naqd ($ Dollar)',
                              card: 'Bank Kartasi',
                              bank_transfer: 'Hisob raqam'
                            };

                            return (
                              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                                  {p.paymentNumber}
                                </td>

                                <td className="py-3 px-4 font-mono text-slate-500">
                                  {p.createdAt}
                                </td>

                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-900 dark:text-white">{p.customerName}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{p.customerPhone}</div>
                                </td>

                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                    {methodLabels[p.paymentMethod] || p.paymentMethod}
                                  </span>
                                </td>

                                <td className="py-3 px-4 text-right font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                                  +{formatNumberWithSpaces(p.amountUZS)} so&apos;m
                                  {p.amountUSD > 0 && (
                                    <div className="text-[10px] text-slate-400 font-normal">
                                      (${formatUSDNumber(p.amountUSD)})
                                    </div>
                                  )}
                                </td>

                                <td className="py-3 px-4 text-right font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                                  {formatNumberWithSpaces(p.remainingDebtUZS)} so&apos;m
                                </td>

                                <td className="py-3 px-4 text-slate-500">
                                  <div className="text-slate-700 dark:text-slate-300 font-medium">{p.cashierName}</div>
                                  {p.notes && <div className="text-[10px] text-slate-400 truncate max-w-xs">&quot;{p.notes}&quot;</div>}
                                </td>

                                <td className="py-3 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setPrintingPayment(p)}
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                                    title="Kvitansiya chop etish"
                                  >
                                    <Printer className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  {totalPaymentPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">
                        Jami <strong className="text-slate-800 dark:text-white font-mono">{filteredPayments.length}</strong> tadan {(paymentPage - 1) * paymentPageSize + 1} - {Math.min(paymentPage * paymentPageSize, filteredPayments.length)} ko&apos;rsatilmoqda
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPaymentPage(p => Math.max(1, p - 1))}
                          disabled={paymentPage === 1}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700 transition"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {paymentPage} / {totalPaymentPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPaymentPage(p => Math.min(totalPaymentPages, p + 1))}
                          disabled={paymentPage === totalPaymentPages}
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
        )}

        {/* ============================================================= */}
        {/* MAIN TAB 2: MIJOZLAR BAZASI & SODIQLIK (CASHBACK) */}
        {/* ============================================================= */}
        {mainTab === 'customers' && (
          <div className="space-y-5">
            {/* Loyalty Tiers Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Standard</span>
                  <span className="text-xs font-bold text-slate-500">1% Cashback</span>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-slate-500">Boshlang&apos;ich daraja</div>
                  <div className="text-[11px] text-slate-400 mt-1">Har qanday xaridda 1% qaytadi</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-blue-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Silver</span>
                  <span className="text-xs font-bold text-blue-600">2% Cashback</span>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-slate-500">1.5 mln xariddan so&apos;ng</div>
                  <div className="text-[11px] text-slate-400 mt-1">Doimiy mijozlar uchun</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 bg-amber-50/20 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-amber-500">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <Award className="w-4 h-4" /> Gold
                  </span>
                  <span className="text-xs font-bold text-amber-600">3% Cashback</span>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-slate-500">3 mln xariddan so&apos;ng</div>
                  <div className="text-[11px] text-slate-400 mt-1">Yuqori faol mijozlar</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-tr from-purple-900/90 to-indigo-900/90 text-white border border-purple-500/40 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-purple-200">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <Crown className="w-4 h-4 text-amber-400" /> VIP
                  </span>
                  <span className="text-xs font-bold text-amber-300">5% Cashback</span>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-purple-200">7 mln xariddan so&apos;ng</div>
                  <div className="text-[11px] text-purple-300 mt-1">Maksimal imtiyozlar</div>
                </div>
              </div>
            </div>

            {/* Search and stats bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Mijoz ismi yoki telefon raqami..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCustomerPage(1);
                  }}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs focus:ring-2 focus:ring-purple-500/40 text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-mono">
                  {filteredCustomers.length} ta mijoz
                </span>
                <select
                  value={customerPageSize}
                  onChange={(e) => {
                    setCustomerPageSize(Number(e.target.value));
                    setCustomerPage(1);
                  }}
                  className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300"
                >
                  <option value={25}>25 tadan</option>
                  <option value={50}>50 tadan</option>
                  <option value={100}>100 tadan</option>
                </select>
              </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Mijoz Ismi & Telefon</th>
                      <th className="py-3 px-4 text-center">Status / Tier</th>
                      <th className="py-3 px-4 text-right">Cashback Stavka</th>
                      <th className="py-3 px-4 text-right">To&apos;plangan Cashback</th>
                      <th className="py-3 px-4 text-right">Jami Xaridlari</th>
                      <th className="py-3 px-4 text-right">Nasiya / Qarz</th>
                      <th className="py-3 px-4 text-right">Bonus Qo&apos;shish</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedCustomers.map((customer) => {
                      const tierColors = {
                        Standard: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
                        Silver: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
                        Gold: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
                        VIP: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 font-bold'
                      };

                      return (
                        <tr key={customer.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {customer.fullName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" />
                              {customer.phone}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tierColors[customer.tier]}`}>
                              {customer.tier}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-purple-600">
                            {customer.cashbackRate}%
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-extrabold text-sm text-purple-600 dark:text-purple-400">
                            {customer.cashbackBalance.toLocaleString()} so&apos;m
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                            {formatMoney(customer.totalPurchases, baseCurrency, exchangeRate)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            {customer.debtBalance > 0 ? (
                              <span className="text-amber-600 font-bold">
                                {formatMoney(customer.debtBalance, baseCurrency, exchangeRate)}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => onUpdateCashback(customer.id, 5000)}
                              className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-600 hover:text-white font-bold text-[11px] transition"
                              title="+5 000 so'm rag'batlantirish cashbacki berish"
                            >
                              +5 000 cb
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              {totalCustomerPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Jami <strong className="text-slate-800 dark:text-white font-mono">{filteredCustomers.length}</strong> tadan {(customerPage - 1) * customerPageSize + 1} - {Math.min(customerPage * customerPageSize, filteredCustomers.length)} ko&apos;rsatilmoqda
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCustomerPage(p => Math.max(1, p - 1))}
                      disabled={customerPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {customerPage} / {totalCustomerPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomerPage(p => Math.min(totalCustomerPages, p + 1))}
                      disabled={customerPage === totalCustomerPages}
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
      {/* MODAL 1: ACCEPT DEBT REPAYMENT MODAL */}
      {/* ------------------------------------------------------------- */}
      {isPaymentModalOpen && (
        <AcceptDebtPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          customers={customers}
          receipts={unpaidReceipts}
          preselectedCustomer={selectedCustomerForPayment}
          exchangeRate={exchangeRate}
          onSubmitPayment={(payment) => {
            onAddDebtPayment(payment);
            setIsPaymentModalOpen(false);
            setPrintingPayment(payment);
          }}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: PRINT DEBT REPAYMENT SLIP */}
      {/* ------------------------------------------------------------- */}
      {printingPayment && (
        <DebtReceiptPrintModal
          payment={printingPayment}
          exchangeRate={exchangeRate}
          onClose={() => setPrintingPayment(null)}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: ADD NEW CUSTOMER MODAL */}
      {/* ------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                <span>Yangi Mijozni Ro&apos;yxatdan O&apos;tkazish</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mijoz Ism-Familiyasi</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Sardor Eshmatov (Grand MCHJ)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Telefon Raqami (SMS xabarnomalar uchun)</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Boshlang&apos;ich Status</label>
                <select
                  value={tier}
                  onChange={(e: any) => setTier(e.target.value)}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                >
                  <option value="Standard">Standard (1% Cashback)</option>
                  <option value="Silver">Silver (2% Cashback)</option>
                  <option value="Gold">Gold (3% Cashback)</option>
                  <option value="VIP">VIP (5% Cashback)</option>
                </select>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 text-[11px] text-purple-800 dark:text-purple-300">
                🎁 Ro&apos;yxatdan o&apos;tgan har bir yangi mijozga <strong>10 000 so&apos;m</strong> bonus cashback avtomatik taqdim etiladi!
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white transition mt-3 shadow-lg shadow-purple-600/20"
              >
                Mijozni Saqlash
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------- */}
      {/* MODAL: DEBT REMINDER (NASIYA ESLATMA TIZIMI)                    */}
      {/* --------------------------------------------------------------- */}
      {reminderCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Nasiya Eslatmasi Yuborish
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {reminderCustomer.fullName} · {reminderCustomer.phone}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReminderCustomer(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Debt Overview Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Qarzdorlik miqdori:
                </span>
                <span className="text-base font-black font-mono text-rose-600 dark:text-rose-400">
                  {formatNumberWithSpaces(reminderCustomer.debtBalance)} so&apos;m
                </span>
                {reminderCustomer.debtBalanceUSD && (
                  <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 ml-2">
                    (${formatUSDNumber(reminderCustomer.debtBalanceUSD)})
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  To&apos;lov holati:
                </span>
                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${getDebtDueInfo(reminderCustomer.debtDueDate).color}`}>
                  {getDebtDueInfo(reminderCustomer.debtDueDate).label}
                </span>
              </div>
            </div>

            {/* Set / Change Due Date */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5 text-amber-500" />
                <span>To&apos;lov muddati (Due Date)ni belgilash:</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={reminderDueDate}
                  onChange={(e) => setReminderDueDate(e.target.value)}
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveDueDate}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
                >
                  Saqlash
                </button>
              </div>
            </div>

            {/* Template Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Eslatma shablonini tanlang:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setReminderTemplate('polite')}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition ${
                    reminderTemplate === 'polite'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-400'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  🌸 Muloyim
                </button>
                <button
                  type="button"
                  onClick={() => setReminderTemplate('urgent')}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition ${
                    reminderTemplate === 'urgent'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-400'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  ⚠️ Muddati o&apos;tgan
                </button>
                <button
                  type="button"
                  onClick={() => setReminderTemplate('card')}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition ${
                    reminderTemplate === 'card'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-400'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  💳 Karta bilan
                </button>
              </div>
            </div>

            {reminderTemplate === 'card' && (
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Karta rekvizitlari:
                </label>
                <input
                  type="text"
                  value={customCardInfo}
                  onChange={(e) => setCustomCardInfo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            )}

            {/* Message Preview Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Xabar matni (SMS / Telegram):
                </label>
                <span className="text-[10px] text-slate-400">
                  {getReminderText(reminderCustomer, reminderTemplate).length} ta belgi
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 font-sans leading-relaxed select-all">
                {getReminderText(reminderCustomer, reminderTemplate)}
              </div>
            </div>

            {/* Telegram Bot Direct Dispatch */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleSendTelegramBotReminder}
                disabled={telegramSendingStatus === 'sending'}
                className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                  telegramSendingStatus === 'sent'
                    ? 'bg-emerald-600 text-white'
                    : telegramSendingStatus === 'error'
                    ? 'bg-rose-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                }`}
              >
                <Send className={`w-4 h-4 ${telegramSendingStatus === 'sending' ? 'animate-spin' : ''}`} />
                <span>
                  {telegramSendingStatus === 'sending'
                    ? 'Telegram Botga Yuborilmoqda...'
                    : telegramSendingStatus === 'sent'
                    ? '✓ Telegram Botga Muvaffaqiyatli Yuborildi!'
                    : '🤖 Do\'kon Telegram Botiga Yuborish'}
                </span>
              </button>
              {telegramSendingMsg && (
                <p className={`text-[11px] mt-1.5 text-center font-medium ${
                  telegramSendingStatus === 'error' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {telegramSendingMsg}
                </p>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  const text = getReminderText(reminderCustomer, reminderTemplate);
                  navigator.clipboard.writeText(text);
                  setIsCopied(true);
                  handleMarkReminderSent();
                  setTimeout(() => setIsCopied(false), 2500);
                }}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                  isCopied
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {isCopied ? <CheckCheck className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{isCopied ? 'Nusxa olindi!' : 'SMS Nusxalash'}</span>
              </button>

              <a
                href={`https://t.me/share/url?text=${encodeURIComponent(getReminderText(reminderCustomer, reminderTemplate))}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleMarkReminderSent()}
                className="py-2.5 px-3 rounded-xl font-bold text-xs bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/20 flex items-center justify-center gap-1.5 transition text-center"
              >
                <Send className="w-4 h-4" />
                <span>Telegram</span>
              </a>

              <a
                href={`tel:${reminderCustomer.phone}`}
                className="py-2.5 px-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition text-center"
              >
                <Phone className="w-4 h-4" />
                <span>Qo&apos;ng&apos;iroq</span>
              </a>
            </div>

            {/* Mark as sent & Close */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400">
                {reminderCustomer.lastReminderSent ? `Oxirgi eslatma: ${reminderCustomer.lastReminderSent}` : "Hali eslatma yuborilmagan"}
              </span>
              <button
                type="button"
                onClick={() => setReminderCustomer(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------- */}
      {/* MODAL: STATEMENT OF ACCOUNT (AKT SVERKA / TAQQOSLASH DALOLATNOMASI) */}
      {/* --------------------------------------------------------------- */}
      {statementCustomer && (
        <StatementOfAccountModal
          customer={statementCustomer}
          receipts={receipts}
          debtPayments={debtPayments}
          exchangeRate={exchangeRate}
          onClose={() => setStatementCustomer(null)}
        />
      )}

      {/* --------------------------------------------------------------- */}
      {/* MODAL: BULK DEBT REMINDERS (OMMAVIY ESLATMALAR)                 */}
      {/* --------------------------------------------------------------- */}
      {isBulkReminderModalOpen && (
        <BulkReminderModal
          selectedDebtors={debtors.filter(c => selectedDebtorIds.includes(c.id))}
          exchangeRate={exchangeRate}
          onClose={() => setIsBulkReminderModalOpen(false)}
        />
      )}
    </div>
  );
};

// =====================================================================
// SUB-COMPONENT: ACCEPT DEBT REPAYMENT MODAL
// =====================================================================
interface AcceptDebtPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  receipts: SaleReceipt[];
  preselectedCustomer: Customer | null;
  exchangeRate: number;
  onSubmitPayment: (payment: CustomerDebtPayment) => void;
}

const AcceptDebtPaymentModal: React.FC<AcceptDebtPaymentModalProps> = ({
  isOpen,
  onClose,
  customers,
  receipts,
  preselectedCustomer,
  exchangeRate,
  onSubmitPayment
}) => {
  // Select customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    preselectedCustomer ? preselectedCustomer.id : (customers.find(c => c.debtBalance > 0)?.id || customers[0]?.id || '')
  );

  const customer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const currentDebtUZS = customer?.debtBalance || 0;
  const currentDebtUSD = Number((currentDebtUZS / exchangeRate).toFixed(2));

  // Payment form states
  const [currency, setCurrency] = useState<'UZS' | 'USD'>('UZS');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'cashUSD' | 'card' | 'bank_transfer'>('cash');
  const [amountInput, setAmountInput] = useState<number>(0);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Unpaid receipts for this customer
  const customerUnpaidReceipts = useMemo(() => {
    if (!selectedCustomerId) return [];
    return receipts.filter(r => r.customer?.id === selectedCustomerId && (r.payments?.debt || 0) > 0);
  }, [receipts, selectedCustomerId]);

  // Convert amounts
  const amountUZS = currency === 'UZS' ? amountInput : Math.round(amountInput * exchangeRate);
  const amountUSD = currency === 'USD' ? amountInput : Number((amountInput / exchangeRate).toFixed(2));

  const remainingDebtUZS = Math.max(0, currentDebtUZS - amountUZS);
  const remainingDebtUSD = Number((remainingDebtUZS / exchangeRate).toFixed(2));

  const handleCurrencyChange = (curr: 'UZS' | 'USD') => {
    setCurrency(curr);
    if (curr === 'USD') {
      setPaymentMethod('cashUSD');
      setAmountInput(currentDebtUSD);
    } else {
      setPaymentMethod('cash');
      setAmountInput(currentDebtUZS);
    }
  };

  // Set preset
  const handleSetFullDebt = () => {
    if (currency === 'USD') {
      setAmountInput(currentDebtUSD);
    } else {
      setAmountInput(currentDebtUZS);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    if (amountUZS <= 0) {
      alert("Iltimos, to'lov summasini kiriting!");
      return;
    }

    const linkedReceipt = receipts.find(r => r.id === selectedReceiptId);

    const payment: CustomerDebtPayment = {
      id: `cdp-${Date.now()}`,
      paymentNumber: `QP-${1000 + Math.floor(Math.random() * 9000)}`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      customerId: customer.id,
      customerName: customer.fullName,
      customerPhone: customer.phone,
      amountUZS,
      amountUSD,
      currencyPaid: currency,
      paymentMethod,
      exchangeRate,
      previousDebtUZS: currentDebtUZS,
      remainingDebtUZS,
      receiptId: linkedReceipt?.id,
      receiptNumber: linkedReceipt?.receiptNumber,
      notes: notes.trim() || undefined,
      cashierName: 'Kassir / Menejer'
    };

    onSubmitPayment(payment);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-600/10 text-amber-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Qarz To&apos;lovini Qabul Qilish
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mijoz qarzini so&apos;ndirish va to&apos;lov kvitansiyasini chop etish
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 1. Customer Select */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Mijozni Tanlang
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                const match = customers.find(c => c.id === e.target.value);
                if (match) {
                  setAmountInput(currency === 'USD' ? Number((match.debtBalance / exchangeRate).toFixed(2)) : match.debtBalance);
                }
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none font-bold"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.phone}) — Qarz: {c.debtBalance.toLocaleString()} so&apos;m
                </option>
              ))}
            </select>
          </div>

          {/* Current Debt Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                Mijozning Hozirgi Qarzi:
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                {formatNumberWithSpaces(currentDebtUZS)} <span className="text-xs font-bold text-slate-400">so&apos;m</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-mono block">Ekvivalent:</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                ${formatUSDNumber(currentDebtUSD)} USD
              </span>
            </div>
          </div>

          {/* 2. Currency Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              To&apos;lov Valyutasi
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleCurrencyChange('UZS')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  currency === 'UZS'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Coins className="w-4 h-4 text-emerald-500" />
                <span>So&apos;m (UZS)</span>
              </button>

              <button
                type="button"
                onClick={() => handleCurrencyChange('USD')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  currency === 'USD'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>AQSH Dollari ($ USD)</span>
              </button>
            </div>
          </div>

          {/* 3. Payment Method */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              To&apos;lov Usuli
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
                  paymentMethod === 'cash'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-4 h-4 text-amber-500" />
                <span className="text-[11px]">Naqd (so&apos;m)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cashUSD')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
                  paymentMethod === 'cashUSD'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span className="text-[11px]">Naqd ($)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
                  paymentMethod === 'card'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4 text-blue-500" />
                <span className="text-[11px]">Karta</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4 text-purple-500" />
                <span className="text-[11px]">O&apos;tkazma</span>
              </button>
            </div>
          </div>

          {/* 4. Payment Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                To&apos;lov Summasi ({currency})
              </label>
              <button
                type="button"
                onClick={handleSetFullDebt}
                className="text-[11px] font-bold text-amber-600 hover:underline"
              >
                To&apos;liq qarzni kiritish ({currency === 'USD' ? `$${formatUSDNumber(currentDebtUSD)}` : `${formatNumberWithSpaces(currentDebtUZS)} so'm`})
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                step={currency === 'USD' ? '0.01' : '1000'}
                value={amountInput || ''}
                onChange={(e) => setAmountInput(Number(e.target.value))}
                onFocus={(e) => e.target.select()}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                placeholder="0"
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-amber-500/60 focus:border-amber-500 rounded-xl px-4 py-3 text-lg font-mono font-black text-slate-900 dark:text-white outline-none transition"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold font-mono text-sm text-slate-400">
                {currency}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto text-[11px] font-mono">
              <span className="text-slate-400 text-xs mr-1">Shablonlar:</span>
              {currency === 'UZS' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setAmountInput(100000)}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    100 ming
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountInput(500000)}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    500 ming
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountInput(1000000)}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    1 mln
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountInput(Math.round(currentDebtUZS / 2))}
                    className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold"
                  >
                    50% qarz
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setAmountInput(20)}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    $20
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountInput(50)}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    $50
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountInput(100)}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    $100
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 5. Optional Linked Receipt */}
          {customerUnpaidReceipts.length > 0 && (
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Aynan bitta chek uchun to&apos;lovmi? (Ixtiyoriy)
              </label>
              <select
                value={selectedReceiptId}
                onChange={(e) => setSelectedReceiptId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
              >
                <option value="">Umumiy qarz hisobidan yechish</option>
                {customerUnpaidReceipts.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.receiptNumber} ({r.createdAt}) — Nasiya: {formatNumberWithSpaces(r.payments.debt)} so&apos;m
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 6. Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Izoh / Eslatma (Ixtiyoriy)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Masalan: 4 ta kamera montaji uchun naqd berildi..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
            />
          </div>

          {/* 7. REAL-TIME RECONCILIATION SUMMARY BOX */}
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Oldingi umumiy qarz:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {formatNumberWithSpaces(currentDebtUZS)} so&apos;m (${formatUSDNumber(currentDebtUSD)})
              </span>
            </div>
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold">
              <span>Qabul qilinayotgan to&apos;lov:</span>
              <span className="font-mono">
                +{formatNumberWithSpaces(amountUZS)} so&apos;m (${formatUSDNumber(amountUSD)})
              </span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex items-center justify-between font-black">
              <span className="text-slate-900 dark:text-white">To&apos;lovdan keyin qoladigan qarz:</span>
              <span className={`font-mono text-sm ${remainingDebtUZS === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {remainingDebtUZS === 0 ? '0 so\'m (To\'liq yopiladi! 🎉)' : `${formatNumberWithSpaces(remainingDebtUZS)} so'm ($${formatUSDNumber(remainingDebtUSD)})`}
              </span>
            </div>
          </div>

          {/* Action Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={amountUZS <= 0}
              className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-600/20 transition active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>To&apos;lovni Tasdiqlash va Kvitansiya Chiqarish</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =====================================================================
// SUB-COMPONENT: DEBT REPAYMENT THERMAL RECEIPT SLIP PRINT MODAL
// =====================================================================
interface DebtReceiptPrintModalProps {
  payment: CustomerDebtPayment;
  exchangeRate: number;
  onClose: () => void;
}

const DebtReceiptPrintModal: React.FC<DebtReceiptPrintModalProps> = ({
  payment,
  exchangeRate,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  const methodNames: Record<string, string> = {
    cash: 'Naqd pul (so\'m)',
    cashUSD: 'Naqd pul ($ AQSH Dollari)',
    card: 'Bank kartasi (Uzcard / Humo)',
    bank_transfer: 'Hisob-raqam / O\'tkazma'
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[95vh]">
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 dark:text-white">
              To&apos;lov Kvitansiyasini Chop Etish (Slip 58/80mm)
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Slip Preview */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 dark:bg-slate-950 flex justify-center">
          <div
            id="debt-receipt-slip"
            className="w-full max-w-[320px] bg-white text-black p-5 rounded-lg shadow-sm border border-slate-200 font-mono text-xs space-y-3"
          >
            {/* Header */}
            <div className="text-center border-b border-dashed border-slate-400 pb-3">
              <div className="text-base font-black tracking-wider">SMART CONTROL</div>
              <div className="text-[10px] text-slate-600">Xavfsizlik & Tarmoq Tizimlari</div>
              <div className="text-[9px] text-slate-500 mt-1">Tel: +998 90 123 45 67 | +998 71 200 00 00</div>
              <div className="text-[11px] font-black uppercase mt-2 text-slate-800">
                QARZ TO&apos;LOVI KVITANSIYASI
              </div>
            </div>

            {/* Slip Meta */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-400 pb-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Kvitansiya:</span>
                <span className="font-bold">{payment.paymentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sana:</span>
                <span>{payment.createdAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mijoz:</span>
                <span className="font-bold text-right">{payment.customerName}</span>
              </div>
              {payment.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Telefon:</span>
                  <span>{payment.customerPhone}</span>
                </div>
              )}
              {payment.receiptNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Chek bog&apos;lanishi:</span>
                  <span className="font-bold">{payment.receiptNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">To&apos;lov usuli:</span>
                <span className="font-bold">{methodNames[payment.paymentMethod] || payment.paymentMethod}</span>
              </div>
            </div>

            {/* Financial Details */}
            <div className="space-y-1.5 py-2 border-b border-dashed border-slate-400 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Oldingi umumiy qarz:</span>
                <span className="font-bold">{formatNumberWithSpaces(payment.previousDebtUZS)} so&apos;m</span>
              </div>

              <div className="flex justify-between text-xs font-black text-black">
                <span>QABUL QILINDI:</span>
                <span>{formatNumberWithSpaces(payment.amountUZS)} so&apos;m</span>
              </div>

              {payment.amountUSD > 0 && (
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>Valyutadagi qiymat:</span>
                  <span className="font-bold">${formatUSDNumber(payment.amountUSD)} USD</span>
                </div>
              )}

              <div className="flex justify-between text-xs font-black pt-1 border-t border-slate-300">
                <span>QOLGAN QARZ BALANSI:</span>
                <span>{formatNumberWithSpaces(payment.remainingDebtUZS)} so&apos;m</span>
              </div>
            </div>

            {payment.notes && (
              <div className="text-[10px] text-slate-600 italic border-b border-dashed border-slate-400 pb-2">
                Izoh: &quot;{payment.notes}&quot;
              </div>
            )}

            {/* Signatures */}
            <div className="pt-3 space-y-4 text-[10px]">
              <div className="flex justify-between items-center">
                <span>Kassir: {payment.cashierName}</span>
                <span>Imzo: ____________</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Mijoz: {payment.customerName.slice(0, 15)}</span>
                <span>Imzo: ____________</span>
              </div>
              <div className="text-center text-[9px] text-slate-500 pt-2">
                To&apos;lovingiz uchun rahmat! Xaridingiz barakali bo&apos;lsin!
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            Yopish
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-md transition"
          >
            <Printer className="w-4 h-4" />
            <span>Chop Etish (Print)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================================
// SUB-COMPONENT: STATEMENT OF ACCOUNT (AKT SVERKA / TAQQOSLASH DALOLATNOMASI)
// =====================================================================
interface StatementOfAccountModalProps {
  customer: Customer;
  receipts: SaleReceipt[];
  debtPayments: CustomerDebtPayment[];
  exchangeRate: number;
  onClose: () => void;
}

const StatementOfAccountModal: React.FC<StatementOfAccountModalProps> = ({
  customer,
  receipts,
  debtPayments,
  exchangeRate,
  onClose
}) => {
  // Build chronological ledger entries
  const customerReceipts = receipts.filter(r => r.customer?.id === customer.id || (r.customer?.fullName && r.customer.fullName.toLowerCase() === customer.fullName.toLowerCase()));
  const customerPayments = debtPayments.filter(p => p.customerId === customer.id || (p.customerPhone && p.customerPhone === customer.phone));

  type LedgerEntry = {
    id: string;
    date: string;
    type: 'sale' | 'payment';
    docNumber: string;
    description: string;
    debitUZS: number; // Qarz ko'paydi
    creditUZS: number; // Qarz to'landi
    balanceUZS: number; // Joriy qoldiq
  };

  const ledger: LedgerEntry[] = useMemo(() => {
    const rawEvents: Array<{
      id: string;
      date: string;
      type: 'sale' | 'payment';
      docNumber: string;
      description: string;
      debitUZS: number;
      creditUZS: number;
    }> = [];

    // Sales events with debt
    customerReceipts.forEach(r => {
      const debtAmount = r.payments?.debt || 0;
      if (debtAmount > 0) {
        const itemSummary = r.items?.map(i => `${i.product.name} (${i.quantity}x)`).join(', ') || 'Tovarlar xaridi';
        rawEvents.push({
          id: r.id,
          date: r.createdAt,
          type: 'sale',
          docNumber: r.receiptNumber,
          description: itemSummary,
          debitUZS: debtAmount,
          creditUZS: 0
        });
      }
    });

    // Payment events
    customerPayments.forEach(p => {
      rawEvents.push({
        id: p.id,
        date: p.createdAt,
        type: 'payment',
        docNumber: p.paymentNumber,
        description: p.notes ? `Qarz to'lovi: ${p.notes}` : `Qarz to'lovi (${p.paymentMethod === 'cash' ? 'Naqd so\'m' : p.paymentMethod === 'cashUSD' ? 'Naqd $' : p.paymentMethod === 'card' ? 'Karta' : 'O\'tkazma'})`,
        debitUZS: 0,
        creditUZS: p.amountUZS
      });
    });

    // Sort chronologically ascending
    rawEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let currentBal = 0;
    return rawEvents.map(ev => {
      currentBal = currentBal + ev.debitUZS - ev.creditUZS;
      return {
        ...ev,
        balanceUZS: currentBal
      };
    });
  }, [customerReceipts, customerPayments]);

  const totalDebit = ledger.reduce((acc, curr) => acc + curr.debitUZS, 0);
  const totalCredit = ledger.reduce((acc, curr) => acc + curr.creditUZS, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh] print:max-h-none print:h-auto print:border-none print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                O&apos;zaro Hisob-Kitob Taqqoslash Dalolatnomasi (Akt Sverka)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {customer.fullName} · {customer.phone}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-bold text-xs shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Chop Etish</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white text-slate-900 font-sans space-y-6 print:p-0 print:overflow-visible">
          {/* Official Document Title */}
          <div className="text-center border-b pb-4 border-slate-300">
            <h1 className="text-lg font-black uppercase tracking-wider text-slate-900">
              O&apos;ZARO HISOB-KITOB TAQQOSLASH DALOLATNOMASI
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              (Tovar yetkazib berish va o&apos;zaro to&apos;lovlar bo&apos;yicha AKT SVERKA)
            </p>
            <div className="text-xs text-slate-600 font-mono mt-2 flex justify-between px-2">
              <span>Shahar: Toshkent sh.</span>
              <span>Sana: {new Date().toLocaleDateString('uz-UZ')}</span>
            </div>
          </div>

          {/* Parties Meta */}
          <div className="grid grid-cols-2 gap-4 text-xs border border-slate-200 p-4 rounded-xl bg-slate-50 print:bg-transparent">
            <div>
              <span className="font-bold uppercase text-slate-400 text-[10px] block">Yetkazib Beruvchi (Sotuvchi):</span>
              <p className="font-black text-slate-800 text-sm mt-0.5">SMART CONTROL MCHJ</p>
              <p className="text-slate-600 mt-1">Xavfsizlik, videokuzatuv va tarmoq tizimlari</p>
              <p className="text-slate-600">Tel: +998 90 123-45-67, +998 71 200-00-00</p>
            </div>
            <div>
              <span className="font-bold uppercase text-slate-400 text-[10px] block">Mijoz (Qarzdor):</span>
              <p className="font-black text-slate-800 text-sm mt-0.5">{customer.fullName}</p>
              <p className="text-slate-600 mt-1">Telefon: {customer.phone}</p>
              {customer.address && <p className="text-slate-600">Manzil: {customer.address}</p>}
              {customer.tier && <p className="text-slate-600">Status: {customer.tier}</p>}
            </div>
          </div>

          {/* Statement Preamble */}
          <p className="text-xs text-slate-700 leading-relaxed">
            Biz, quyida imzo chekuvchilar, &quot;SMART CONTROL&quot; nomidan bir tomondan va mijoz <strong>{customer.fullName}</strong> ikkinchi tomondan, {new Date().toLocaleDateString('uz-UZ')} holatiga ko&apos;ra o&apos;zaro hisob-kitoblarni taqqoslab, quyidagilarni tasdiqlaymiz:
          </p>

          {/* Chronological Ledger Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                  <th className="py-2.5 px-3 w-8 text-center">№</th>
                  <th className="py-2.5 px-3">Sana & Vaqt</th>
                  <th className="py-2.5 px-3">Hujjat №</th>
                  <th className="py-2.5 px-3">Operatsiya mazmuni</th>
                  <th className="py-2.5 px-3 text-right">Debet (+Qarz)</th>
                  <th className="py-2.5 px-3 text-right">Kredit (-To&apos;lov)</th>
                  <th className="py-2.5 px-3 text-right">Qoldiq Balans</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-400 font-sans">
                      Ushbu mijoz bo&apos;yicha nasiya yoki to&apos;lov tranzaksiyalari topilmadi.
                    </td>
                  </tr>
                ) : (
                  ledger.map((entry, idx) => (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-center text-slate-400 font-sans">{idx + 1}</td>
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{entry.date}</td>
                      <td className="py-2 px-3 font-bold text-slate-800 whitespace-nowrap">{entry.docNumber}</td>
                      <td className="py-2 px-3 font-sans text-slate-700 max-w-xs truncate" title={entry.description}>
                        {entry.description}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-rose-600">
                        {entry.debitUZS > 0 ? formatNumberWithSpaces(entry.debitUZS) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-600">
                        {entry.creditUZS > 0 ? formatNumberWithSpaces(entry.creditUZS) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-black text-slate-900">
                        {formatNumberWithSpaces(entry.balanceUZS)} so&apos;m
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-xs">
                <tr>
                  <td colSpan={4} className="py-3 px-3 text-right font-sans uppercase">
                    Jami aylanmalar va Yakuniy qoldiq:
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-rose-600">
                    {formatNumberWithSpaces(totalDebit)} so&apos;m
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-600">
                    {formatNumberWithSpaces(totalCredit)} so&apos;m
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-slate-900 text-sm">
                    {formatNumberWithSpaces(customer.debtBalance)} so&apos;m
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Current Debt Verdict */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <p className="font-bold text-slate-800">
              {new Date().toLocaleDateString('uz-UZ')} holatiga ko&apos;ra mijoz <strong>{customer.fullName}</strong> ning &quot;SMART CONTROL&quot; oldidagi jami qarzdorlik qoldig&apos;i:
            </p>
            <p className="text-base font-black font-mono text-rose-600">
              {formatNumberWithSpaces(customer.debtBalance)} so&apos;m 
              {customer.debtBalanceUSD ? ` (AQSH Dollari ekvivalentida: $${formatUSDNumber(customer.debtBalanceUSD)} USD)` : ''}
            </p>
          </div>

          {/* Signatures */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-4">
              <p className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                Yetkazib beruvchi vakili:
              </p>
              <div className="border-b border-slate-400 pb-1 flex justify-between">
                <span>Rahbar / Hisobchi:</span>
                <span className="font-serif italic">_________________</span>
              </div>
              <p className="text-[10px] text-slate-400">M.O&apos; (Muxr o&apos;rni)</p>
            </div>

            <div className="space-y-4">
              <p className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                Mijoz / Qabul qiluvchi:
              </p>
              <div className="border-b border-slate-400 pb-1 flex justify-between">
                <span>{customer.fullName}:</span>
                <span className="font-serif italic">_________________</span>
              </div>
              <p className="text-[10px] text-slate-400">(Imzo va sana)</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between shrink-0 print:hidden">
          <span className="text-xs text-slate-500">
            Akt Sverka rasmiy hujjat hisoblanadi va chop etishga tayyor.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================================
// SUB-COMPONENT: BULK DEBT REMINDERS MODAL (OMMAVIY ESLATMALAR TIZIMI)
// =====================================================================
interface BulkReminderModalProps {
  selectedDebtors: Customer[];
  exchangeRate: number;
  onClose: () => void;
}

const BulkReminderModal: React.FC<BulkReminderModalProps> = ({
  selectedDebtors,
  exchangeRate,
  onClose
}) => {
  const [templateType, setTemplateType] = useState<'polite' | 'urgent'>('polite');
  const [isCopiedAll, setIsCopiedAll] = useState(false);
  const [isSendingTgBulk, setIsSendingTgBulk] = useState(false);
  const [bulkTgProgress, setBulkTgProgress] = useState<{ current: number; total: number; success: number; fail: number } | null>(null);
  const [bulkTgResultMsg, setBulkTgResultMsg] = useState<string>('');

  const totalDebtUZS = selectedDebtors.reduce((acc, c) => acc + c.debtBalance, 0);
  const totalDebtUSD = selectedDebtors.reduce((acc, c) => acc + (c.debtBalanceUSD || Number((c.debtBalance / exchangeRate).toFixed(2))), 0);

  // Generate formatted SMS lines for each debtor
  const generatedMessages = useMemo(() => {
    return selectedDebtors.map(c => {
      const sumStr = formatNumberWithSpaces(c.debtBalance) + " so'm";
      const usdStr = c.debtBalanceUSD ? ` ($${formatUSDNumber(c.debtBalanceUSD)})` : '';
      const dueStr = c.debtDueDate ? ` (Muddat: ${c.debtDueDate})` : '';

      let text = '';
      if (templateType === 'urgent') {
        text = `DIQQAT! Hurmatli ${c.fullName}! "SMART CONTROL" oldidagi ${sumStr}${usdStr} nasiya qarzdorlik to'lov muddati o'tgan. Iltimos, hisob-kitobni zudlik bilan yakunlashingizni so'raymiz! Tel: +998 90 123-45-67`;
      } else {
        text = `Assalomu alaykum, ${c.fullName}! "SMART CONTROL" do'konidan nasiya qarzdorligingiz: ${sumStr}${usdStr}${dueStr}. Iltimos, to'lovni o'z vaqtida amalga oshiring. Tel: +998 90 123-45-67`;
      }

      return {
        customer: c,
        phone: c.phone,
        text,
        fullLine: `${c.phone}; ${text}`
      };
    });
  }, [selectedDebtors, templateType]);

  const handleCopyAll = () => {
    const fullContent = generatedMessages.map(m => m.fullLine).join('\n');
    navigator.clipboard.writeText(fullContent);
    setIsCopiedAll(true);
    setTimeout(() => setIsCopiedAll(false), 2500);
  };

  const handleSendBulkTelegram = async () => {
    const tgSettings = getTelegramSettings();
    if (!tgSettings.botToken || !tgSettings.chatId) {
      setBulkTgResultMsg("⚠️ Sozlamalar bo'limida Telegram Bot Token va Chat ID kiritilmagan!");
      return;
    }

    setIsSendingTgBulk(true);
    setBulkTgProgress({ current: 0, total: generatedMessages.length, success: 0, fail: 0 });
    setBulkTgResultMsg('');

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < generatedMessages.length; i++) {
      const msg = generatedMessages[i];
      const htmlMsg = `📢 <b>OMMAVIY QARZ ESLATMASI (${i + 1}/${generatedMessages.length})</b>\n\n👤 <b>Mijoz:</b> ${msg.customer.fullName}\n📞 <b>Telefon:</b> ${msg.customer.phone}\n💰 <b>Qarz Miqdori:</b> <b>${formatNumberWithSpaces(msg.customer.debtBalance)} so'm</b>\n\n💬 <b>Matn:</b>\n<i>${msg.text}</i>`;

      const res = await sendTelegramMessage(tgSettings.botToken, tgSettings.chatId, htmlMsg);
      if (res.success) {
        successCount++;
      } else {
        failCount++;
      }

      setBulkTgProgress({
        current: i + 1,
        total: generatedMessages.length,
        success: successCount,
        fail: failCount
      });

      // Small throttle delay between telegram API requests
      await new Promise(r => setTimeout(r, 400));
    }

    setIsSendingTgBulk(false);
    setBulkTgResultMsg(`✓ Ommaviy xabar yakunlandi: ${successCount} ta muvaffaqiyatli, ${failCount} ta xato.`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-600/10 text-amber-600 flex items-center justify-center">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Ommaviy Nasiya Eslatmalari (SMS & Telegram)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tanlangan {selectedDebtors.length} ta qarzdor mijozga umumiy xabarnoma tayyorlash
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                Tanlangan qarzdorlar soni:
              </span>
              <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                {selectedDebtors.length} ta mijoz
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Jami undiriladigan qarz:
              </span>
              <span className="text-lg font-black font-mono text-rose-600 dark:text-rose-400">
                {formatNumberWithSpaces(totalDebtUZS)} so&apos;m
              </span>
              <div className="text-xs font-mono font-bold text-emerald-600">
                (${formatUSDNumber(totalDebtUSD)} USD)
              </div>
            </div>
          </div>

          {/* Template Switcher */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Xabar Ohangini Tanlang:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTemplateType('polite')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  templateType === 'polite'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-400'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                🌸 Muloyim & Rasmiy Eslatma
              </button>
              <button
                type="button"
                onClick={() => setTemplateType('urgent')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  templateType === 'urgent'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-400'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                ⚠️ Muddati O&apos;tgan / Qat&apos;iy Talab
              </button>
            </div>
          </div>

          {/* Dispatch Actions Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyAll}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                isCopiedAll
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700'
              }`}
            >
              {isCopiedAll ? <CheckCheck className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{isCopiedAll ? 'Barcha Xabarlar Nusxalandi!' : 'SMS Gateway Uchun Nusxa Olish'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendBulkTelegram}
              disabled={isSendingTgBulk}
              className="py-2.5 px-4 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 transition"
            >
              <Send className={`w-4 h-4 ${isSendingTgBulk ? 'animate-spin' : ''}`} />
              <span>{isSendingTgBulk ? `Telegramga yuborilmoqda (${bulkTgProgress?.current}/${bulkTgProgress?.total})...` : '🤖 Telegram Botga Ommaviy Yuborish'}</span>
            </button>
          </div>

          {/* Progress / Status feedback */}
          {bulkTgResultMsg && (
            <div className={`p-3 rounded-xl text-xs font-bold text-center ${bulkTgResultMsg.startsWith('✓') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'}`}>
              {bulkTgResultMsg}
            </div>
          )}

          {/* Debtor messages preview list */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Mijozlar bo&apos;yicha tayyorlangan xabarlar:</span>
              <span className="text-[10px] text-slate-400">{generatedMessages.length} ta tayyor</span>
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {generatedMessages.map((item, idx) => (
                <div key={item.customer.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {idx + 1}. {item.customer.fullName} ({item.phone})
                    </span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      {formatNumberWithSpaces(item.customer.debtBalance)} so&apos;m
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Xabarlarni Eskiz, PlayMobile yoki Telegram bot orqali tarqatishingiz mumkin.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
