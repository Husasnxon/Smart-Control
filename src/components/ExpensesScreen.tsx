'use client';

import React, { useState, useMemo } from 'react';
import { 
  Expense, 
  ExpenseCategory, 
  Currency, 
  Employee, 
  PayrollRecord, 
  EmployeeAdvance, 
  SaleReceipt, 
  ShipmentOrder, 
  CustomerOrder, 
  Customer,
  ActiveTab 
} from '../types';
import { formatDualMoney, formatMoney, formatUSDNumber, formatNumberWithSpaces, getNowFormatted } from '../utils/formatters';
import { EmployeesScreen } from './EmployeesScreen';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Calendar, 
  ArrowDownRight, 
  ArrowUpRight,
  ArrowLeftRight,
  TrendingDown, 
  TrendingUp,
  Wallet, 
  CreditCard, 
  Banknote,
  FileText,
  Building,
  Users,
  Megaphone,
  Truck,
  Coffee,
  Settings2,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  HardHat,
  Package,
  FileSpreadsheet,
  Receipt,
  ExternalLink,
  Printer,
  ShieldCheck,
  Layers,
  Filter,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';

interface ExpensesScreenProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  onAddExpense: (expense: Expense) => void;
  onAddCategory: (category: ExpenseCategory) => void;
  onUpdateCategory: (categoryId: string, newName: string, newDesc?: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onDeleteExpense?: (expenseId: string) => void;
  todaySalesTotal: number;
  baseCurrency?: Currency;
  exchangeRate?: number;
  // Sub-model: Xodimlar va Ish haqi
  employees?: Employee[];
  payrolls?: PayrollRecord[];
  advances?: EmployeeAdvance[];
  receipts?: SaleReceipt[];
  shipments?: ShipmentOrder[];
  customerOrders?: CustomerOrder[];
  customers?: Customer[];
  onAddEmployee?: (emp: Employee) => void;
  onUpdateEmployee?: (emp: Employee) => void;
  onDeleteEmployee?: (empId: string) => void;
  onAddPayroll?: (record: PayrollRecord) => void;
  onAddAdvance?: (advance: EmployeeAdvance) => void;
  onNavigateToTab?: (tab: ActiveTab) => void;
  initialSubTab?: 'all' | 'incomes' | 'expenses' | 'employees';
}

export const ExpensesScreen: React.FC<ExpensesScreenProps> = ({
  expenses,
  categories,
  onAddExpense,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onDeleteExpense,
  todaySalesTotal,
  baseCurrency = 'UZS',
  exchangeRate = 12850,
  employees = [],
  payrolls = [],
  advances = [],
  receipts = [],
  shipments = [],
  customerOrders = [],
  customers = [],
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onAddPayroll,
  onAddAdvance,
  onNavigateToTab,
  initialSubTab = 'all'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'incomes' | 'expenses' | 'employees'>(
    initialSubTab === 'employees' ? 'employees' : 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('Barchasi');
  const [selectedPaymentSource, setSelectedPaymentSource] = useState<'all' | 'cash' | 'bank' | 'usd'>('all');
  const [onlyLinkedDocs, setOnlyLinkedDocs] = useState(false);
  
  // Modals state
  const [isAddIncomeModalOpen, setIsAddIncomeModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isCategoryManageModalOpen, setIsCategoryManageModalOpen] = useState(false);
  const [selectedVoucherExpense, setSelectedVoucherExpense] = useState<Expense | null>(null);

  // New Income form state
  const [incomeAmount, setIncomeAmount] = useState<number>(0);
  const [incomeCurrency, setIncomeCurrency] = useState<Currency>('UZS');
  const [incomeCategory, setIncomeCategory] = useState<string>('Otgruzka / Sotuv to\'lovi');
  const [incomePaymentSource, setIncomePaymentSource] = useState<Expense['paymentSource']>('Kassa (Naqd)');
  const [incomePaidBy, setIncomePaidBy] = useState('');
  const [incomeNotes, setIncomeNotes] = useState('');
  const [incomeLinkType, setIncomeLinkType] = useState<'none' | 'shipment' | 'order' | 'debt'>('shipment');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // New Expense form state
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseCurrency, setExpenseCurrency] = useState<Currency>('UZS');
  const [expenseCategory, setExpenseCategory] = useState<string>(
    categories.find(c => c.type !== 'income')?.name || 'Mayda xo\'jalik'
  );
  const [expensePaymentSource, setExpensePaymentSource] = useState<Expense['paymentSource']>('Kassa (Naqd)');
  const [expensePaidTo, setExpensePaidTo] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');

  // Category management form state
  const [categoryTab, setCategoryTab] = useState<'all' | 'income' | 'expense'>('all');
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState('#10B981');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('income');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatNameValue, setEditCatNameValue] = useState('');

  // Auto-match shipment selection
  const handleSelectShipmentForIncome = (shipmentId: string) => {
    setSelectedShipmentId(shipmentId);
    const ship = shipments.find(s => s.id === shipmentId);
    if (ship) {
      setIncomePaidBy(ship.customerName || '');
      setIncomeNotes(`${ship.shipmentNumber} otgruzkasi bo'yicha sotilgan mahsulotlar to'lovi`);
      if (ship.currency === 'USD' && ship.totalAmountUSD) {
        setIncomeAmount(ship.totalAmountUSD * exchangeRate);
        setIncomeCurrency('UZS');
      } else {
        setIncomeAmount(ship.totalAmount || 0);
        setIncomeCurrency(ship.currency || 'UZS');
      }
    }
  };

  // Auto-match order selection
  const handleSelectOrderForIncome = (orderId: string) => {
    setSelectedOrderId(orderId);
    const ord = customerOrders.find(o => o.id === orderId);
    if (ord) {
      setIncomePaidBy(ord.customerName || '');
      setIncomeNotes(`${ord.orderNumber} smetasi bo'yicha hisob-kitob to'lovi`);
      setIncomeAmount(ord.totalAmount || 0);
    }
  };

  // Auto-match customer debt selection
  const handleSelectCustomerForIncome = (custId: string) => {
    setSelectedCustomerId(custId);
    const cust = customers.find(c => c.id === custId);
    if (cust) {
      setIncomePaidBy(cust.fullName || '');
      setIncomeNotes(`Mijoz nasiyasi bo'yicha qarz to'lovi (${cust.fullName})`);
      setIncomeAmount(cust.debtBalance || 0);
    }
  };

  // Calculations for Totals & KPIs
  const incomesList = useMemo(() => expenses.filter(e => e.type === 'income'), [expenses]);
  const expensesList = useMemo(() => expenses.filter(e => e.type !== 'income'), [expenses]);

  const totalIncomeUZS = useMemo(() => incomesList.reduce((sum, e) => sum + e.amount, 0), [incomesList]);
  const totalExpenseUZS = useMemo(() => expensesList.reduce((sum, e) => sum + e.amount, 0), [expensesList]);
  const netCashFlowUZS = totalIncomeUZS - totalExpenseUZS;

  // Cash and Bank Breakdowns
  const cashIncomeUZS = incomesList
    .filter(e => e.paymentSource === 'Kassa (Naqd)' || e.paymentSource === 'Valyuta (Naqd USD)')
    .reduce((sum, e) => sum + e.amount, 0);

  const cashExpenseUZS = expensesList
    .filter(e => e.paymentSource === 'Kassa (Naqd)' || e.paymentSource === 'Valyuta (Naqd USD)')
    .reduce((sum, e) => sum + e.amount, 0);

  const bankIncomeUZS = incomesList
    .filter(e => e.paymentSource === 'Hisob raqam / Karta')
    .reduce((sum, e) => sum + e.amount, 0);

  const bankExpenseUZS = expensesList
    .filter(e => e.paymentSource === 'Hisob raqam / Karta')
    .reduce((sum, e) => sum + e.amount, 0);

  const netCashDrawerBalance = cashIncomeUZS - cashExpenseUZS;
  const netBankBalance = bankIncomeUZS - bankExpenseUZS;

  // Filtering items
  const filteredTransactions = useMemo(() => {
    return expenses.filter(e => {
      // Sub-tab filter
      if (activeSubTab === 'incomes' && e.type !== 'income') return false;
      if (activeSubTab === 'expenses' && e.type === 'income') return false;

      // Category filter
      if (selectedFilterCategory !== 'Barchasi' && e.category !== selectedFilterCategory) return false;

      // Payment source filter
      if (selectedPaymentSource === 'cash' && e.paymentSource !== 'Kassa (Naqd)') return false;
      if (selectedPaymentSource === 'bank' && e.paymentSource !== 'Hisob raqam / Karta') return false;
      if (selectedPaymentSource === 'usd' && e.paymentSource !== 'Valyuta (Naqd USD)') return false;

      // Only linked docs filter
      if (onlyLinkedDocs && !e.linkedDocNumber) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNotes = e.notes?.toLowerCase().includes(q);
        const matchPaidTo = e.paidTo?.toLowerCase().includes(q);
        const matchPaidBy = e.paidBy?.toLowerCase().includes(q);
        const matchCategory = e.category?.toLowerCase().includes(q);
        const matchDoc = e.linkedDocNumber?.toLowerCase().includes(q);
        const matchCustomer = e.customerName?.toLowerCase().includes(q);
        if (!matchNotes && !matchPaidTo && !matchPaidBy && !matchCategory && !matchDoc && !matchCustomer) {
          return false;
        }
      }

      return true;
    });
  }, [expenses, activeSubTab, selectedFilterCategory, selectedPaymentSource, onlyLinkedDocs, searchQuery]);

  // Handle Creating Income (Prixod)
  const handleCreateIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomeAmount || incomeAmount <= 0) return;

    let linkedDocType: Expense['linkedDocType'] = undefined;
    let linkedDocId: string | undefined = undefined;
    let linkedDocNumber: string | undefined = undefined;
    let custName = incomePaidBy;
    let custId: string | undefined = undefined;

    if (incomeLinkType === 'shipment' && selectedShipmentId) {
      const ship = shipments.find(s => s.id === selectedShipmentId);
      if (ship) {
        linkedDocType = 'shipment';
        linkedDocId = ship.id;
        linkedDocNumber = ship.shipmentNumber;
        custName = ship.customerName || custName;
        custId = ship.customerId;
      }
    } else if (incomeLinkType === 'order' && selectedOrderId) {
      const ord = customerOrders.find(o => o.id === selectedOrderId);
      if (ord) {
        linkedDocType = 'order';
        linkedDocId = ord.id;
        linkedDocNumber = ord.orderNumber;
        custName = ord.customerName || custName;
        custId = ord.customerId;
      }
    } else if (incomeLinkType === 'debt' && selectedCustomerId) {
      const cust = customers.find(c => c.id === selectedCustomerId);
      if (cust) {
        linkedDocType = 'customer_debt';
        linkedDocId = cust.id;
        linkedDocNumber = `NASIYA-${cust.id.slice(-4).toUpperCase()}`;
        custName = cust.fullName;
        custId = cust.id;
      }
    }

    const calculatedAmount = incomeCurrency === 'USD' ? incomeAmount * exchangeRate : incomeAmount;
    const calculatedAmountUSD = incomeCurrency === 'USD' ? incomeAmount : Number((incomeAmount / exchangeRate).toFixed(2));

    const newIncome: Expense = {
      id: `inc-${Date.now()}`,
      type: 'income',
      category: incomeCategory,
      amount: calculatedAmount,
      amountUSD: calculatedAmountUSD,
      currency: incomeCurrency,
      paymentSource: incomePaymentSource,
      paidBy: custName || 'Noma\'lum mijoz / Manba',
      notes: incomeNotes || 'Pul kirimi',
      createdAt: getNowFormatted(),
      createdBy: 'Farrux A. (Kassir)',
      linkedDocType,
      linkedDocId,
      linkedDocNumber,
      customerName: custName,
      customerId: custId
    };

    onAddExpense(newIncome);
    setIsAddIncomeModalOpen(false);
    // Reset form
    setIncomeAmount(0);
    setIncomePaidBy('');
    setIncomeNotes('');
    setSelectedShipmentId('');
    setSelectedOrderId('');
    setSelectedCustomerId('');
  };

  // Handle Creating Expense (Chiqim)
  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || expenseAmount <= 0) return;

    const calculatedAmount = expenseCurrency === 'USD' ? expenseAmount * exchangeRate : expenseAmount;
    const calculatedAmountUSD = expenseCurrency === 'USD' ? expenseAmount : Number((expenseAmount / exchangeRate).toFixed(2));

    const newExp: Expense = {
      id: `exp-${Date.now()}`,
      type: 'expense',
      category: expenseCategory,
      amount: calculatedAmount,
      amountUSD: calculatedAmountUSD,
      currency: expenseCurrency,
      paymentSource: expensePaymentSource,
      paidTo: expensePaidTo || 'Noma\'lum',
      notes: expenseNotes || 'Izohsiz chiqim',
      createdAt: getNowFormatted(),
      createdBy: 'Farrux A. (Kassir)'
    };

    onAddExpense(newExp);
    setIsAddExpenseModalOpen(false);
    setExpenseAmount(0);
    setExpensePaidTo('');
    setExpenseNotes('');
  };

  // Handle adding category
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCategory: ExpenseCategory = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      description: newCatDesc.trim() || (newCatType === 'income' ? 'Kirim toifasi' : 'Chiqim toifasi'),
      color: newCatColor,
      type: newCatType,
      isDefault: false
    };

    onAddCategory(newCategory);
    setNewCatName('');
    setNewCatDesc('');
  };

  // Save inline edit category
  const handleSaveEditCategory = (catId: string) => {
    if (!editCatNameValue.trim()) return;
    onUpdateCategory(catId, editCatNameValue.trim());
    setEditingCatId(null);
    setEditCatNameValue('');
  };

  // Print voucher
  const handlePrintVoucher = (expense: Expense) => {
    setSelectedVoucherExpense(expense);
  };

  const incomeCategories = useMemo(() => categories.filter(c => c.type === 'income' || c.type === 'both' || !c.type), [categories]);
  const expenseCategories = useMemo(() => categories.filter(c => c.type === 'expense' || c.type === 'both' || !c.type), [categories]);

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50 dark:bg-slate-950">
      {/* Primary Sub-Module Switcher */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('all')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition active:scale-95 ${
              activeSubTab === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Barcha Tranzaksiyalar</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-white font-mono font-bold">
              {expenses.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('incomes')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition active:scale-95 ${
              activeSubTab === 'incomes'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            <span>Pul Kirimi (Prixod)</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-200 font-mono font-bold">
              {incomesList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('expenses')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition active:scale-95 ${
              activeSubTab === 'expenses'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
            <span>Xarajatlar (Chiqim / OPEX)</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-200 font-mono font-bold">
              {expensesList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('employees')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition active:scale-95 ${
              activeSubTab === 'employees'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>Xodimlar & Ish Haqi (Payroll)</span>
            {employees && employees.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-900 dark:text-amber-200 font-mono font-bold">
                {employees.length}
              </span>
            )}
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono hidden md:block">
          Valyuta kursi: 1$ = {exchangeRate.toLocaleString()} so&apos;m
        </div>
      </div>

      {activeSubTab === 'employees' ? (
        <div className="-mx-6 -my-6">
          <EmployeesScreen
            employees={employees}
            payrolls={payrolls}
            advances={advances}
            receipts={receipts}
            expenses={expenses}
            onAddEmployee={onAddEmployee || (() => {})}
            onUpdateEmployee={onUpdateEmployee || (() => {})}
            onDeleteEmployee={onDeleteEmployee || (() => {})}
            onAddPayroll={onAddPayroll || (() => {})}
            onAddAdvance={onAddAdvance || (() => {})}
          />
        </div>
      ) : (
        <>
          {/* Top Header with Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-indigo-500" />
                Moliya & Pul Oqimi Boshqaruvi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sotuv va otgruzkalar bo&apos;yicha pul kirimi (prixod), xarajatlar (rasxod) va kassa balansi
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Manage Categories Button */}
              <button
                onClick={() => setIsCategoryManageModalOpen(true)}
                className="px-3.5 py-2 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition active:scale-[0.98]"
              >
                <Settings2 className="w-4 h-4 text-purple-500" />
                <span>Toifalar ({categories.length})</span>
              </button>

              {/* Add Expense (Rasxod) Button */}
              <button
                onClick={() => setIsAddExpenseModalOpen(true)}
                className="px-3.5 py-2 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>- Chiqim (Rasxod)</span>
              </button>

              {/* Add Income (Prixod) Button */}
              <button
                onClick={() => setIsAddIncomeModalOpen(true)}
                className="px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/25 flex items-center gap-1.5 transition active:scale-[0.98] animate-pulse hover:animate-none"
              >
                <Plus className="w-4 h-4" />
                <span>+ Yangi Kirim (Prixod)</span>
              </button>
            </div>
          </div>

          {/* KPI Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Income (Prixod) */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-500/20 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Jami Pul Kirimi (Prixod)
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  +{formatDualMoney(totalIncomeUZS, baseCurrency, exchangeRate).primary}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Otgruzkalar & To&apos;lovlar</span>
                  <span className="font-mono text-emerald-500 font-bold">({formatDualMoney(totalIncomeUZS, baseCurrency, exchangeRate).secondary})</span>
                </div>
              </div>
            </div>

            {/* 2. Total Expenses (Rasxod) */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-500/30 dark:border-rose-500/20 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <ArrowDownRight className="w-3.5 h-3.5" /> Jami Xarajatlar (Rasxod)
                </span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-xs">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                  -{formatDualMoney(totalExpenseUZS, baseCurrency, exchangeRate).primary}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Do&apos;kon, ijara, oyliklar</span>
                  <span className="font-mono text-rose-500 font-bold">({formatDualMoney(totalExpenseUZS, baseCurrency, exchangeRate).secondary})</span>
                </div>
              </div>
            </div>

            {/* 3. Cash Drawer Balance (Kassa Naqd Qoldig'i) */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5 text-amber-500" /> Kassa (Naqd) Balansi
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className={`text-2xl font-black font-mono ${netCashDrawerBalance >= 0 ? 'text-amber-500 dark:text-amber-400' : 'text-rose-500'}`}>
                  {netCashDrawerBalance < 0 ? '-' : ''}{formatDualMoney(Math.abs(netCashDrawerBalance), baseCurrency, exchangeRate).primary}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Kirim: {formatMoney(cashIncomeUZS, baseCurrency, exchangeRate)}</span>
                  <span>Chiqim: {formatMoney(cashExpenseUZS, baseCurrency, exchangeRate)}</span>
                </div>
              </div>
            </div>

            {/* 4. Net Cash Flow / Pul Oqimi Sof Balansi */}
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-950 text-white border border-indigo-500/30 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Sof Pul Oqimi (Kirim - Chiqim)
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-black">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className={`text-2xl font-black font-mono ${netCashFlowUZS >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {netCashFlowUZS < 0 ? '-' : '+'}{formatDualMoney(Math.abs(netCashFlowUZS), baseCurrency, exchangeRate).primary}
                </div>
                <div className="text-[11px] text-indigo-200/70 mt-1 flex items-center justify-between">
                  <span>Bank o&apos;tkazma: {formatMoney(netBankBalance, baseCurrency, exchangeRate)}</span>
                  <span className="font-mono text-white font-bold">({formatDualMoney(Math.abs(netCashFlowUZS), baseCurrency, exchangeRate).secondary})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter, Search & Source Toolbar */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Izoh, mijoz, otgruzka (#OTG-2001) yoki toifa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/40 text-slate-800 dark:text-slate-100 font-medium"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Source Selector */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  onClick={() => setSelectedPaymentSource('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${selectedPaymentSource === 'all' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
                >
                  Barchasi
                </button>
                <button
                  onClick={() => setSelectedPaymentSource('cash')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${selectedPaymentSource === 'cash' ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500'}`}
                >
                  <Banknote className="w-3 h-3" /> Naqd
                </button>
                <button
                  onClick={() => setSelectedPaymentSource('bank')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${selectedPaymentSource === 'bank' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500'}`}
                >
                  <CreditCard className="w-3 h-3" /> Bank
                </button>
              </div>

              {/* Linked to Docs Filter Toggle */}
              <button
                onClick={() => setOnlyLinkedDocs(!onlyLinkedDocs)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                  onlyLinkedDocs
                    ? 'bg-teal-500/15 border-teal-500 text-teal-700 dark:text-teal-300'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
                title="Faqat sotilgan mahsulot cheki (otgruzka)ga bog'langan tranzaksiyalarni ko'rish"
              >
                <Package className="w-3.5 h-3.5 text-teal-500" />
                <span>Otgruzkaga bog&apos;langanlar</span>
                {onlyLinkedDocs && <Check className="w-3 h-3 text-teal-500" />}
              </button>

              {/* Category Dropdown */}
              <select
                value={selectedFilterCategory}
                onChange={(e) => setSelectedFilterCategory(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold"
              >
                <option value="Barchasi">Barcha toifalar</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.type === 'income' ? '🟢 ' : c.type === 'expense' ? '🔴 ' : ''}{c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Tranzaksiya Turi</th>
                    <th className="py-3 px-4">Kategoriya & Toifa</th>
                    <th className="py-3 px-4">Bog&apos;langan Hujjat / Otgruzka</th>
                    <th className="py-3 px-4">Izoh va Maqsad</th>
                    <th className="py-3 px-4">Kimdan / Kimga</th>
                    <th className="py-3 px-4 text-center">To&apos;lov Manbai</th>
                    <th className="py-3 px-4 text-right">Summa</th>
                    <th className="py-3 px-4 text-right">Sana / Vaqt</th>
                    <th className="py-3 px-4 text-right">Mas&apos;ul</th>
                    <th className="py-3 px-4 text-center">Hujjat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400/60" />
                        <p className="font-semibold text-xs">Hech qanday moliya yozuvi topilmadi</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((trx) => {
                      const isIncome = trx.type === 'income';
                      const catObj = categories.find((c) => c.name === trx.category);
                      const dotColor = catObj?.color || (isIncome ? '#10B981' : '#EF4444');

                      return (
                        <tr key={trx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                          {/* 1. Type Badge */}
                          <td className="py-3 px-4">
                            {isIncome ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                                PRIXOD (KIRIM)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                <ArrowDownRight className="w-3 h-3 text-rose-500" />
                                RASXOD (CHIQIM)
                              </span>
                            )}
                          </td>

                          {/* 2. Category */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                              <span className="font-bold text-slate-900 dark:text-white">
                                {trx.category}
                              </span>
                            </div>
                          </td>

                          {/* 3. Linked Document / Otgruzka */}
                          <td className="py-3 px-4">
                            {trx.linkedDocNumber ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-mono font-bold text-[11px]">
                                <Package className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                                <span>{trx.linkedDocNumber}</span>
                                {trx.customerName && (
                                  <span className="text-[10px] text-teal-600/70 dark:text-teal-400/70 font-sans font-medium">
                                    ({trx.customerName})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono text-[11px]">-</span>
                            )}
                          </td>

                          {/* 4. Notes & Purpose */}
                          <td className="py-3 px-4 max-w-xs">
                            <span className="text-slate-700 dark:text-slate-200 font-medium block truncate" title={trx.notes}>
                              {trx.notes}
                            </span>
                          </td>

                          {/* 5. Paid To / Paid By */}
                          <td className="py-3 px-4">
                            <span className="text-slate-600 dark:text-slate-400 font-semibold">
                              {isIncome ? (trx.paidBy || trx.customerName || 'Mijoz') : (trx.paidTo || 'Xodim / Ta\'minotchi')}
                            </span>
                          </td>

                          {/* 6. Payment Source */}
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                trx.paymentSource === 'Kassa (Naqd)'
                                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                                  : trx.paymentSource === 'Valyuta (Naqd USD)'
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                              }`}
                            >
                              {trx.paymentSource === 'Kassa (Naqd)' || trx.paymentSource === 'Valyuta (Naqd USD)' ? (
                                <Banknote className="w-3 h-3" />
                              ) : (
                                <CreditCard className="w-3 h-3" />
                              )}
                              {trx.paymentSource}
                            </span>
                          </td>

                          {/* 7. Amount */}
                          <td className="py-3 px-4 text-right">
                            <div className={`font-mono font-black text-sm ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {isIncome ? '+' : '-'}{formatDualMoney(trx.amount, baseCurrency, exchangeRate).primary}
                            </div>
                            <div className="font-mono text-[10px] text-slate-400">
                              {formatDualMoney(trx.amount, baseCurrency, exchangeRate).secondary}
                            </div>
                          </td>

                          {/* 8. Date */}
                          <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {trx.createdAt}
                          </td>

                          {/* 9. Created By */}
                          <td className="py-3 px-4 text-right text-slate-500 font-medium whitespace-nowrap">
                            {trx.createdBy}
                          </td>

                          {/* 10. Actions / Voucher Print */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handlePrintVoucher(trx)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                                title="Kvitansiya / Order chop etish (PKO/RKO)"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              {onDeleteExpense && (
                                <button
                                  onClick={() => {
                                    if (window.confirm("Rostdan ham ushbu moliya yozuvini o'chirmoqchimisiz?")) {
                                      onDeleteExpense(trx.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                                  title="O'chirish"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MODAL 1: ADD INCOME (PRIXOD) MODAL WITH SHIPMENT LINKING */}
          {/* ========================================================================= */}
          {isAddIncomeModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 font-bold">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        Yangi Pul Kirimi (Prixod / Tushum)
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Sotilgan mahsulot cheki (otgruzka) yoki mustaqil kirim kiritish
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAddIncomeModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateIncome} className="space-y-3.5">
                  {/* Document Linking Option */}
                  <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-2">
                    <label className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-emerald-500" />
                        Sotilgan mahsulot cheki (Otgruzka)ga bog&apos;lash
                      </span>
                    </label>

                    {/* Radio Select for Document Type */}
                    <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setIncomeLinkType('shipment')}
                        className={`py-1.5 px-2 rounded-lg font-bold border transition ${
                          incomeLinkType === 'shipment'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        📦 Otgruzka
                      </button>
                      <button
                        type="button"
                        onClick={() => setIncomeLinkType('order')}
                        className={`py-1.5 px-2 rounded-lg font-bold border transition ${
                          incomeLinkType === 'order'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        📄 Smeta / Zakaz
                      </button>
                      <button
                        type="button"
                        onClick={() => setIncomeLinkType('none')}
                        className={`py-1.5 px-2 rounded-lg font-bold border transition ${
                          incomeLinkType === 'none'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        ⛔ Bog&apos;lanmagan
                      </button>
                    </div>

                    {/* Shipment Dropdown Picker */}
                    {incomeLinkType === 'shipment' && (
                      <div className="mt-2 space-y-1">
                        <span className="text-[10px] text-slate-400 font-semibold block">Mavjud Otgruzkalardan tanlang:</span>
                        <select
                          value={selectedShipmentId}
                          onChange={(e) => handleSelectShipmentForIncome(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium"
                        >
                          <option value="">-- Otgruzkani tanlang --</option>
                          {shipments.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.shipmentNumber} &bull; {s.customerName} &bull; {formatMoney(s.totalAmount, baseCurrency, exchangeRate)} ({s.status})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Order Dropdown Picker */}
                    {incomeLinkType === 'order' && (
                      <div className="mt-2 space-y-1">
                        <span className="text-[10px] text-slate-400 font-semibold block">Hisob-kitob Smetasini tanlang:</span>
                        <select
                          value={selectedOrderId}
                          onChange={(e) => handleSelectOrderForIncome(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium"
                        >
                          <option value="">-- Smetani tanlang --</option>
                          {customerOrders.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.orderNumber} &bull; {o.customerName} &bull; {formatMoney(o.totalAmount, baseCurrency, exchangeRate)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Amount & Currency */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kirim Summasi *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="Masalan: 1 500 000"
                        value={incomeAmount || ''}
                        onChange={(e) => setIncomeAmount(Number(e.target.value))}
                        className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Valyuta</label>
                      <select
                        value={incomeCurrency}
                        onChange={(e) => setIncomeCurrency(e.target.value as Currency)}
                        className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold"
                      >
                        <option value="UZS">UZS (So&apos;m)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kirim Toifasi</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddIncomeModalOpen(false);
                          setIsCategoryManageModalOpen(true);
                          setNewCatType('income');
                        }}
                        className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        + Yangi toifa
                      </button>
                    </div>
                    <select
                      value={incomeCategory}
                      onChange={(e) => setIncomeCategory(e.target.value)}
                      className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium"
                    >
                      {incomeCategories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Source */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Qayerga qabul qilindi? (Manba)</label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setIncomePaymentSource('Kassa (Naqd)')}
                        className={`py-2 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition ${
                          incomePaymentSource === 'Kassa (Naqd)'
                            ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        Kassa (Naqd)
                      </button>

                      <button
                        type="button"
                        onClick={() => setIncomePaymentSource('Hisob raqam / Karta')}
                        className={`py-2 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition ${
                          incomePaymentSource === 'Hisob raqam / Karta'
                            ? 'bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Bank / Karta
                      </button>

                      <button
                        type="button"
                        onClick={() => setIncomePaymentSource('Valyuta (Naqd USD)')}
                        className={`py-2 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition ${
                          incomePaymentSource === 'Valyuta (Naqd USD)'
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        Valyuta (USD)
                      </button>
                    </div>
                  </div>

                  {/* Paid By */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kimdan qabul qilindi? (Mijoz / Kontragent)</label>
                    <input
                      type="text"
                      placeholder="Masalan: Grand Qurilish MCHJ, Farrux aka..."
                      value={incomePaidBy}
                      onChange={(e) => setIncomePaidBy(e.target.value)}
                      className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Izoh va Maqsad</label>
                    <textarea
                      rows={2}
                      placeholder="Qisqacha izoh yoki to'lov maqsadi..."
                      value={incomeNotes}
                      onChange={(e) => setIncomeNotes(e.target.value)}
                      className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold text-xs text-white transition mt-3 shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pul Kirimini Saqlash va Tasdiqlash</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL 2: ADD EXPENSE (RASXOD) MODAL */}
          {/* ========================================================================= */}
          {isAddExpenseModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-rose-500" />
                    Yangi Xarajat (Chiqim / Rasxod) Kiritish
                  </h3>
                  <button
                    onClick={() => setIsAddExpenseModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateExpense} className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Xarajat Summasi *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="Masalan: 120 000"
                        value={expenseAmount || ''}
                        onChange={(e) => setExpenseAmount(Number(e.target.value))}
                        className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold font-mono text-rose-600 dark:text-rose-400 focus:ring-2 focus:ring-rose-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Valyuta</label>
                      <select
                        value={expenseCurrency}
                        onChange={(e) => setExpenseCurrency(e.target.value as Currency)}
                        className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold"
                      >
                        <option value="UZS">UZS (So&apos;m)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Xarajat Toifasi</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddExpenseModalOpen(false);
                          setIsCategoryManageModalOpen(true);
                          setNewCatType('expense');
                        }}
                        className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                      >
                        + Yangi toifa
                      </button>
                    </div>
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value)}
                      className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium"
                    >
                      {expenseCategories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Qayerdan to&apos;landi? (Manba)</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setExpensePaymentSource('Kassa (Naqd)')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          expensePaymentSource === 'Kassa (Naqd)'
                            ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        Kassa (Naqd)
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpensePaymentSource('Hisob raqam / Karta')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          expensePaymentSource === 'Hisob raqam / Karta'
                            ? 'bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Hisob raqam / Karta
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kimga to&apos;landi? (Qabul qiluvchi)</label>
                    <input
                      type="text"
                      placeholder="Masalan: Kuryer Rustam, Sarkor Telecom..."
                      value={expensePaidTo}
                      onChange={(e) => setExpensePaidTo(e.target.value)}
                      className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Izoh va Sababi</label>
                    <textarea
                      rows={2}
                      placeholder="Qisqacha izoh..."
                      value={expenseNotes}
                      onChange={(e) => setExpenseNotes(e.target.value)}
                      className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-xs text-white transition mt-3 shadow-lg shadow-rose-600/20 active:scale-95"
                  >
                    Xarajatni Chiqim Qilish
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL 3: CATEGORY MANAGEMENT MODAL */}
          {/* ========================================================================= */}
          {isCategoryManageModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Settings2 className="w-5 h-5 text-purple-600" />
                      Moliya Toifalarini Boshqarish
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Kirim (Prixod) va Chiqim (Rasxod) toifalarini qo&apos;shish va tahrirlash
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCategoryManageModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Sub-tabs for Category Types */}
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setCategoryTab('all')}
                    className={`flex-1 py-1 rounded-lg font-bold transition ${categoryTab === 'all' ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Barchasi ({categories.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryTab('income')}
                    className={`flex-1 py-1 rounded-lg font-bold transition flex items-center justify-center gap-1 ${categoryTab === 'income' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'}`}
                  >
                    🟢 Kirim ({incomeCategories.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryTab('expense')}
                    className={`flex-1 py-1 rounded-lg font-bold transition flex items-center justify-center gap-1 ${categoryTab === 'expense' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500'}`}
                  >
                    🔴 Chiqim ({expenseCategories.length})
                  </button>
                </div>

                {/* Add New Category Box */}
                <form onSubmit={handleCreateCategory} className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-850 space-y-2.5">
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-200 block">
                    + Yangi Moliya Toifasi Qo&apos;shish
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <input
                        type="text"
                        required
                        placeholder="Toifa nomi (masalan: Otgruzka to'lovi, Soliqlar)..."
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/40"
                      />
                    </div>
                    <div>
                      <select
                        value={newCatType}
                        onChange={(e) => setNewCatType(e.target.value as 'income' | 'expense')}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs text-slate-900 dark:text-white font-bold"
                      >
                        <option value="income">🟢 Kirim (Prixod)</option>
                        <option value="expense">🔴 Chiqim (Rasxod)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="w-9 h-8 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
                      title="Toifa rangini tanlang"
                    />
                    <input
                      type="text"
                      placeholder="Qisqacha izoh (ixtiyoriy)..."
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1 text-xs text-slate-600 dark:text-slate-300"
                    />
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shrink-0"
                    >
                      Qo&apos;shish
                    </button>
                  </div>
                </form>

                {/* List of Existing Categories */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {categories
                    .filter(c => categoryTab === 'all' || c.type === categoryTab || (!c.type && categoryTab === 'expense'))
                    .map((cat) => {
                      const isEditing = editingCatId === cat.id;
                      const usageCount = expenses.filter((e) => e.category === cat.name).length;

                      return (
                        <div
                          key={cat.id}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color || '#EF4444' }} />

                            {isEditing ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  value={editCatNameValue}
                                  onChange={(e) => setEditCatNameValue(e.target.value)}
                                  className="flex-1 bg-white dark:bg-slate-900 border border-purple-500 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 dark:text-white"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSaveEditCategory(cat.id)}
                                  className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                                  title="Saqlash"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingCatId(null)}
                                  className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200"
                                  title="Bekor qilish"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                                    {cat.name}
                                  </span>
                                  {cat.type === 'income' ? (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                      KIRIM
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                      CHIQIM
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {cat.description || 'Izohsiz'} &bull; {usageCount} ta yozuv
                                </span>
                              </div>
                            )}
                          </div>

                          {!isEditing && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingCatId(cat.id);
                                  setEditCatNameValue(cat.name);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition"
                                title="Toifa nomini o'zgartirish"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  if (window.confirm(`"${cat.name}" toifasini o'chirmoqchimisiz?`)) {
                                    onDeleteCategory(cat.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                                title="Toifani o'chirish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-850 flex justify-end">
                  <button
                    onClick={() => setIsCategoryManageModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 transition"
                  >
                    Yopish
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL 4: VOUCHER PRINT MODAL (PKO / RKO KVITANSIYA) */}
          {/* ========================================================================= */}
          {selectedVoucherExpense && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white text-slate-900 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                {/* Print Header */}
                <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                      SC
                    </div>
                    <div>
                      <h4 className="font-black text-sm tracking-wide">SMART CONTROL</h4>
                      <p className="text-[10px] text-slate-500">Kassa Moliya Kvitansiyasi</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedVoucherExpense(null)}
                    className="text-slate-400 hover:text-slate-700 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Voucher Official Body */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 font-sans">
                  <div className="text-center pb-2 border-b border-dashed border-slate-300">
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-900">
                      {selectedVoucherExpense.type === 'income' 
                        ? 'KIRIM KASSA ORDERI (PKO)' 
                        : 'CHIQIM KASSA ORDERI (RKO)'}
                    </span>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                      № {selectedVoucherExpense.id.toUpperCase()} &bull; {selectedVoucherExpense.createdAt}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">
                        {selectedVoucherExpense.type === 'income' ? 'Kimdan qabul qilindi:' : 'Kimga to\'landi:'}
                      </span>
                      <span className="font-bold text-slate-900">
                        {selectedVoucherExpense.type === 'income' 
                          ? (selectedVoucherExpense.paidBy || selectedVoucherExpense.customerName || 'Mijoz') 
                          : selectedVoucherExpense.paidTo}
                      </span>
                    </div>

                    {selectedVoucherExpense.linkedDocNumber && (
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-500">Bog&apos;langan Hujjat / Otgruzka:</span>
                        <span className="font-bold text-teal-700 font-mono">
                          {selectedVoucherExpense.linkedDocNumber}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Toifa & Maqsad:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedVoucherExpense.category} ({selectedVoucherExpense.notes})
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">To&apos;lov Manbai:</span>
                      <span className="font-bold text-slate-800">{selectedVoucherExpense.paymentSource}</span>
                    </div>

                    <div className="flex justify-between py-2 bg-indigo-50/80 px-3 rounded-xl">
                      <span className="font-bold text-indigo-900">Jami To&apos;lov Summasi:</span>
                      <span className="font-black text-base font-mono text-indigo-950">
                        {selectedVoucherExpense.amount.toLocaleString()} so&apos;m
                        {selectedVoucherExpense.amountUSD && ` ($${formatUSDNumber(selectedVoucherExpense.amountUSD)})`}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 grid grid-cols-2 gap-4 text-[11px] text-slate-600 border-t border-slate-200">
                    <div>
                      <span className="block font-semibold">Kassir / Mas&apos;ul:</span>
                      <div className="mt-4 border-b border-slate-400 w-32 pb-0.5 font-medium">
                        {selectedVoucherExpense.createdBy}
                      </div>
                    </div>
                    <div>
                      <span className="block font-semibold">Qabul qiluvchi / Mijoz:</span>
                      <div className="mt-4 border-b border-slate-400 w-32 pb-0.5 text-slate-400">
                        (imzo)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Print & Close Actions */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setSelectedVoucherExpense(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100"
                  >
                    Yopish
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                  >
                    <Printer className="w-4 h-4" />
                    Chop Etish (Print)
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
