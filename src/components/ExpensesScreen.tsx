'use client';

import React, { useState } from 'react';
import { Expense, ExpenseCategory, Currency, Employee, PayrollRecord, EmployeeAdvance, SaleReceipt } from '../types';
import { formatDualMoney, formatMoney, getNowFormatted } from '../utils/formatters';
import { EmployeesScreen } from './EmployeesScreen';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Calendar, 
  ArrowDownRight, 
  TrendingDown, 
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
  HardHat
} from 'lucide-react';

interface ExpensesScreenProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  onAddExpense: (expense: Expense) => void;
  onAddCategory: (category: ExpenseCategory) => void;
  onUpdateCategory: (categoryId: string, newName: string, newDesc?: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  todaySalesTotal: number;
  baseCurrency?: Currency;
  exchangeRate?: number;
  // Sub-model: Xodimlar va Ish haqi
  employees?: Employee[];
  payrolls?: PayrollRecord[];
  advances?: EmployeeAdvance[];
  receipts?: SaleReceipt[];
  onAddEmployee?: (emp: Employee) => void;
  onUpdateEmployee?: (emp: Employee) => void;
  onDeleteEmployee?: (empId: string) => void;
  onAddPayroll?: (record: PayrollRecord) => void;
  onAddAdvance?: (advance: EmployeeAdvance) => void;
  initialSubTab?: 'expenses' | 'employees';
}

export const ExpensesScreen: React.FC<ExpensesScreenProps> = ({
  expenses,
  categories,
  onAddExpense,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  todaySalesTotal,
  baseCurrency = 'UZS',
  exchangeRate = 12850,
  employees = [],
  payrolls = [],
  advances = [],
  receipts = [],
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onAddPayroll,
  onAddAdvance,
  initialSubTab = 'expenses'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'expenses' | 'employees'>(initialSubTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('Barchasi');
  
  // Modals state
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isCategoryManageModalOpen, setIsCategoryManageModalOpen] = useState(false);

  // New expense form
  const [amount, setAmount] = useState<number>(0);
  const [categoryName, setCategoryName] = useState<string>(categories[0]?.name || 'Mayda xo\'jalik');
  const [paymentSource, setPaymentSource] = useState<Expense['paymentSource']>('Kassa (Naqd)');
  const [paidTo, setPaidTo] = useState('');
  const [notes, setNotes] = useState('');

  // Category management form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState('#8B5CF6');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatNameValue, setEditCatNameValue] = useState('');

  const filterCategories = ['Barchasi', ...categories.map((c) => c.name)];

  const filtered = expenses.filter((e) => {
    const matchCat = selectedFilterCategory === 'Barchasi' || e.category === selectedFilterCategory;
    const matchSearch =
      e.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.paidTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const cashExpenses = expenses
    .filter((e) => e.paymentSource === 'Kassa (Naqd)')
    .reduce((sum, e) => sum + e.amount, 0);
  const bankExpenses = expenses
    .filter((e) => e.paymentSource === 'Hisob raqam / Karta')
    .reduce((sum, e) => sum + e.amount, 0);

  // Net cash balance
  const netDailyProfit = todaySalesTotal - totalExpenses;

  // Handle adding expense
  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    const newExp: Expense = {
      id: `exp-${Date.now()}`,
      category: categoryName,
      amount,
      paymentSource,
      paidTo: paidTo || 'Noma\'lum',
      notes: notes || 'Izohsiz',
      createdAt: getNowFormatted(),
      createdBy: 'Farrux A. (Kassir)'
    };

    onAddExpense(newExp);
    setIsAddExpenseModalOpen(false);
    setAmount(0);
    setPaidTo('');
    setNotes('');
  };

  // Handle adding category
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCategory: ExpenseCategory = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      description: newCatDesc.trim() || 'Foydalanuvchi toifasi',
      color: newCatColor,
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

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50 dark:bg-slate-950">
      {/* Primary Sub-Module Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('expenses')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition active:scale-95 ${
              activeSubTab === 'expenses'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            <span>Operatsion Xarajatlar (OPEX)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('employees')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition active:scale-95 ${
              activeSubTab === 'employees'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Xodimlar & Ish Haqi (Payroll & Avans)</span>
            {employees && employees.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-900 dark:text-amber-200 font-mono font-bold">
                {employees.length}
              </span>
            )}
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono hidden sm:block">
          Kurs: 1$ = {exchangeRate.toLocaleString()} so&apos;m
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
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                Moliya va Xarajatlar Boshqaruvi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Do&apos;kon xarajatlari, oyliklar, ijara, toifalar boshqaruvi va sof foyda hisobi
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Manage Categories Button */}
              <button
                onClick={() => setIsCategoryManageModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition active:scale-[0.98]"
              >
                <Settings2 className="w-4 h-4 text-purple-500" />
                <span>Toifalarni Boshqarish ({categories.length})</span>
              </button>

              {/* Add Expense Button */}
              <button
                onClick={() => setIsAddExpenseModalOpen(true)}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 flex items-center gap-2 transition active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Yangi Xarajat Kiritish (Chiqim)</span>
              </button>
            </div>
          </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expenses */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Jami Xarajatlar</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-red-600 dark:text-red-400 font-mono">
              -{formatDualMoney(totalExpenses, baseCurrency, exchangeRate).primary}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Barcha toifalar</span>
              <span className="font-mono text-slate-500">({formatDualMoney(totalExpenses, baseCurrency, exchangeRate).secondary})</span>
            </div>
          </div>
        </div>

        {/* Cash Drawer Expenses */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Kassadan Naqd Chiqim</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              -{formatDualMoney(cashExpenses, baseCurrency, exchangeRate).primary}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Kassir qo&apos;lidan</span>
              <span className="font-mono text-slate-500">({formatDualMoney(cashExpenses, baseCurrency, exchangeRate).secondary})</span>
            </div>
          </div>
        </div>

        {/* Bank / Card Expenses */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Bank / Hisob Raqam</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
              -{formatDualMoney(bankExpenses, baseCurrency, exchangeRate).primary}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>O&apos;tkazma orqali</span>
              <span className="font-mono text-slate-500">({formatDualMoney(bankExpenses, baseCurrency, exchangeRate).secondary})</span>
            </div>
          </div>
        </div>

        {/* Net Profit / Balance */}
        <div className="p-4 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-950 text-white border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Savdo Tushumi vs Xarajat</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {netDailyProfit < 0 ? '-' : ''}{formatDualMoney(Math.abs(netDailyProfit), baseCurrency, exchangeRate).primary}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Savdo ({formatMoney(todaySalesTotal, baseCurrency, exchangeRate)}) - Xarajat</span>
              <span className="font-mono text-slate-300">({formatDualMoney(Math.abs(netDailyProfit), baseCurrency, exchangeRate).secondary})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Izoh, qabul qiluvchi yoki kategoriya..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs focus:ring-2 focus:ring-red-500/40 text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar">
          {filterCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedFilterCategory === cat
                  ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Kategoriya & Toifa</th>
                <th className="py-3 px-4">Izoh va Maqsad</th>
                <th className="py-3 px-4">Kimga to&apos;landi</th>
                <th className="py-3 px-4 text-center">To&apos;lov Manbai</th>
                <th className="py-3 px-4 text-right">Summa</th>
                <th className="py-3 px-4 text-right">Sana / Vaqt</th>
                <th className="py-3 px-4 text-right">Mas&apos;ul</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((expense) => {
                const catObj = categories.find((c) => c.name === expense.category);
                const dotColor = catObj?.color || '#EF4444';

                return (
                  <tr key={expense.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                        <span className="font-bold text-slate-900 dark:text-white">
                          {expense.category}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-700 dark:text-slate-200 font-medium block">
                        {expense.notes}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-600 dark:text-slate-400 font-semibold">
                        {expense.paidTo}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          expense.paymentSource === 'Kassa (Naqd)'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {expense.paymentSource === 'Kassa (Naqd)' ? (
                          <Banknote className="w-3 h-3" />
                        ) : (
                          <CreditCard className="w-3 h-3" />
                        )}
                        {expense.paymentSource}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="font-mono font-black text-sm text-red-600 dark:text-red-400">
                        -{formatDualMoney(expense.amount, baseCurrency, exchangeRate).primary}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {formatDualMoney(expense.amount, baseCurrency, exchangeRate).secondary}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                      {expense.createdAt}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 font-medium">
                      {expense.createdBy}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD EXPENSE MODAL */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                Yangi Xarajat (Chiqim) Kiritish
              </h3>
              <button
                onClick={() => setIsAddExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Xarajat Summasi (so&apos;m)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Masalan: 50 000"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500/40"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Xarajat Toifasi</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddExpenseModalOpen(false);
                      setIsCategoryManageModalOpen(true);
                    }}
                    className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    + Yangi toifa qo&apos;shish
                  </button>
                </div>
                <select
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium"
                >
                  {categories.map((c) => (
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
                    onClick={() => setPaymentSource('Kassa (Naqd)')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      paymentSource === 'Kassa (Naqd)'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    Kassa (Naqd)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentSource('Hisob raqam / Karta')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      paymentSource === 'Hisob raqam / Karta'
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
                  placeholder="Masalan: Kuryer Rustam, Sarkor Telecom, va h.k."
                  value={paidTo}
                  onChange={(e) => setPaidTo(e.target.value)}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Izoh va Sababi</label>
                <textarea
                  rows={2}
                  placeholder="Qisqacha izoh..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-xs text-white transition mt-3 shadow-lg shadow-red-600/20"
              >
                Xarajatni Chiqim Qilish
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CATEGORY MANAGEMENT (ADMIN PANEL) */}
      {isCategoryManageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-purple-600" />
                  Xarajat Toifalarini Boshqarish (Admin)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Yangi toifalar qo&apos;shish, nomini o&apos;zgartirish yoki tahrirlash
                </p>
              </div>
              <button
                onClick={() => setIsCategoryManageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add New Category Box */}
            <form onSubmit={handleCreateCategory} className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-850 space-y-2.5">
              <span className="text-xs font-bold text-purple-900 dark:text-purple-200 block">
                + Yangi Xarajat Toifasi Qo&apos;shish
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Toifa nomi (masalan: Soliqlar, Jihozlar, Yoqilg'i)..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/40"
                />
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="w-9 h-8 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
                  title="Toifa rangini tanlang"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shrink-0"
                >
                  Qo&apos;shish
                </button>
              </div>
              <input
                type="text"
                placeholder="Qisqacha izoh (ixtiyoriy)..."
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1 text-xs text-slate-600 dark:text-slate-300"
              />
            </form>

            {/* List of Existing Categories with Rename & Delete */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Mavjud Toifalar Ro&apos;yxati ({categories.length})
              </span>

              {categories.map((cat) => {
                const isEditing = editingCatId === cat.id;
                const expenseCount = expenses.filter((e) => e.category === cat.name).length;

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
                          <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                            {cat.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {cat.description || 'Izohsiz'} &bull; {expenseCount} ta chiqim yozilgan
                          </span>
                        </div>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Rename / Edit Button */}
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

                        {/* Delete Button */}
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
        </>
      )}
    </div>
  );
};
