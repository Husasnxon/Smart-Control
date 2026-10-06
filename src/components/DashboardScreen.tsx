'use client';

import React, { useState, useMemo } from 'react';
import { Product, Customer, SaleReceipt, AIInsight, Expense, Currency } from '../types';
import { formatDualMoney, formatMoney, formatNumberWithSpaces, formatUSDNumber, isTodayDate, getNormalizedDateKey } from '../utils/formatters';
import { 
  TrendingUp, 
  TrendingDown,
  ShoppingBag, 
  Users, 
  Coins, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight,
  Package, 
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Gift,
  BarChart3,
  PieChart,
  DollarSign,
  Wallet,
  CreditCard,
  Building2,
  Percent,
  Layers,
  Activity,
  ArrowRight,
  Award
} from 'lucide-react';

interface DashboardScreenProps {
  products: Product[];
  customers: Customer[];
  receipts: SaleReceipt[];
  expenses: Expense[];
  aiInsights: AIInsight[];
  onNavigateTab: (tab: any) => void;
  isOffline: boolean;
  baseCurrency?: Currency;
  exchangeRate?: number;
}

type PeriodFilter = '7d' | '30d' | 'all';

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  products,
  customers,
  receipts,
  expenses,
  aiInsights,
  onNavigateTab,
  isOffline,
  baseCurrency = 'UZS',
  exchangeRate = 12850
}) => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('7d');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // 1. Overall Totals for Today
  const todayReceipts = useMemo(() => {
    return receipts.filter(r => isTodayDate(r.createdAt));
  }, [receipts]);

  const todayExpensesList = useMemo(() => {
    return expenses.filter(e => isTodayDate(e.createdAt));
  }, [expenses]);

  const todaySales = todayReceipts.reduce((sum, r) => sum + r.totalAmount, 0);
  const todayExpenses = todayExpensesList.reduce((sum, e) => sum + e.amount, 0);
  const todayProfit = todaySales - todayExpenses;

  const totalAllSales = receipts.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalAllExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalGrossProfit = totalAllSales - totalAllExpenses;
  const averageReceipt = receipts.length > 0 ? Math.round(totalAllSales / receipts.length) : 0;

  // Inventory value
  const totalInventoryCost = products.reduce((sum, p) => sum + (p.costPrice * (p.isService ? 0 : p.stockQuantity)), 0);
  const totalInventoryCostUSD = products.reduce((sum, p) => sum + ((p.costPriceUSD || (p.costPrice / (exchangeRate || 12850))) * (p.isService ? 0 : p.stockQuantity)), 0);
  const totalInventoryRetail = products.reduce((sum, p) => sum + (p.retailPrice * (p.isService ? 0 : p.stockQuantity)), 0);
  const totalInventoryRetailUSD = products.reduce((sum, p) => sum + ((p.retailPriceUSD || (p.retailPrice / (exchangeRate || 12850))) * (p.isService ? 0 : p.stockQuantity)), 0);
  const totalPotentialProfit = totalInventoryRetail - totalInventoryCost;
  const criticalStockCount = products.filter((p) => p.stockQuantity <= p.minStockAlert).length;

  // Customers and debts
  const totalDebts = customers.reduce((sum, c) => sum + (c.debtBalance || 0), 0);
  const totalCashback = customers.reduce((sum, c) => sum + (c.cashbackBalance || 0), 0);

  // 2. Multi-Day Sales Data for Interactive Chart
  const chartData = useMemo(() => {
    const daysCount = periodFilter === '7d' ? 7 : periodFilter === '30d' ? 30 : 14;
    const result: { dateKey: string; label: string; sales: number; expenses: number; receiptsCount: number }[] = [];
    
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayLabel = `${d.getDate()}-${['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek'][d.getMonth()]}`;

      const dayReceipts = receipts.filter(r => getNormalizedDateKey(r.createdAt) === dateStr);
      const daySales = dayReceipts.reduce((sum, r) => sum + r.totalAmount, 0);

      const dayExpenses = expenses.filter(e => getNormalizedDateKey(e.createdAt) === dateStr).reduce((sum, e) => sum + e.amount, 0);

      result.push({
        dateKey: dateStr,
        label: dayLabel,
        sales: daySales,
        expenses: dayExpenses,
        receiptsCount: dayReceipts.length
      });
    }

    return result;
  }, [receipts, expenses, periodFilter]);

  const maxChartValue = Math.max(...chartData.map(d => Math.max(d.sales, d.expenses)), 1000000);

  // 3. Category Breakdown
  const categoryStats = useMemo(() => {
    const map: Record<string, { name: string; totalRevenue: number; count: number }> = {};

    receipts.forEach(r => {
      r.items.forEach(item => {
        const cat = item.product.category || 'Boshqa';
        if (!map[cat]) {
          map[cat] = { name: cat, totalRevenue: 0, count: 0 };
        }
        map[cat].totalRevenue += item.quantity * item.appliedPrice;
        map[cat].count += item.quantity;
      });
    });

    const list = Object.values(map);
    const sumRevenue = list.reduce((s, c) => s + c.totalRevenue, 0) || 1;

    return list
      .map(c => ({
        ...c,
        percentage: Math.round((c.totalRevenue / sumRevenue) * 100)
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [receipts]);

  // 4. Top Selling Products Leaderboard
  const topProducts = useMemo(() => {
    const map: Record<string, { product: Product; totalQty: number; totalSum: number }> = {};

    receipts.forEach(r => {
      r.items.forEach(item => {
        const id = item.product.id;
        if (!map[id]) {
          map[id] = { product: item.product, totalQty: 0, totalSum: 0 };
        }
        map[id].totalQty += item.quantity;
        map[id].totalSum += item.quantity * item.appliedPrice;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.totalSum - a.totalSum)
      .slice(0, 5);
  }, [receipts]);

  // 5. Payment Methods Distribution
  const paymentStats = useMemo(() => {
    let cashUZS = 0;
    let cashUSD = 0;
    let card = 0;
    let debt = 0;
    let cashback = 0;

    receipts.forEach(r => {
      cashUZS += r.payments.cash || 0;
      cashUSD += (r.payments.cashUSD || 0) * (r.payments.exchangeRate || exchangeRate);
      card += r.payments.card || 0;
      debt += r.payments.debt || 0;
      cashback += r.payments.cashbackUsed || 0;
    });

    const total = cashUZS + cashUSD + card + debt + cashback || 1;

    return [
      { label: 'Naqd So\'m', amount: cashUZS, percent: Math.round((cashUZS / total) * 100), color: 'bg-emerald-500' },
      { label: 'Naqd Dollar ($)', amount: cashUSD, percent: Math.round((cashUSD / total) * 100), color: 'bg-cyan-500' },
      { label: 'Karta (Humo/Uzcard)', amount: card, percent: Math.round((card / total) * 100), color: 'bg-blue-500' },
      { label: 'Nasiya (Qarz)', amount: debt, percent: Math.round((debt / total) * 100), color: 'bg-amber-500' },
      { label: 'Cashback', amount: cashback, percent: Math.round((cashback / total) * 100), color: 'bg-purple-500' }
    ].filter(p => p.amount > 0);
  }, [receipts, exchangeRate]);

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            <span>Biznes Boshqaruv & Tahlil Markazi</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real vaqtdagi savdo ko&apos;rsatkichlari, daromad dinamikasi va ombor tahlili
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateTab('financial_reports')}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition active:scale-[0.98]"
            title="Foyda va Zarar (P&L) hisoboti, tovarlar marjasi va ustalar tahliliga o'tish"
          >
            <BarChart3 className="w-4 h-4" />
            <span>📊 Hisobotlar & P&L</span>
          </button>
          <button
            onClick={() => onNavigateTab('pos')}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center gap-1.5 transition active:scale-[0.98]"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>Kassa (Savdo)</span>
          </button>
          <button
            onClick={() => onNavigateTab('ai_advisor')}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">AI Tahlil</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Bugungi Savdo */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bugungi Savdo</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {formatNumberWithSpaces(todaySales)} <span className="text-xs font-bold text-slate-400">so&apos;m</span>
            </div>
            <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              ≈ ${formatUSDNumber(todaySales / exchangeRate)} USD
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
              <span>{todayReceipts.length} ta chek</span>
              <span className="font-semibold text-emerald-600">Sof: {formatNumberWithSpaces(todayProfit)} so&apos;m</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Jami Savdo & Sof Foyda */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Jami Daromad</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {formatNumberWithSpaces(totalAllSales)} <span className="text-xs font-bold text-slate-400">so&apos;m</span>
            </div>
            <div className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
              Xarajatlar: {formatNumberWithSpaces(totalAllExpenses)} so&apos;m
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              O&apos;rtacha chek: <strong className="text-slate-800 dark:text-slate-200">{formatNumberWithSpaces(averageReceipt)} so&apos;m</strong>
            </div>
          </div>
        </div>

        {/* KPI 3: Nasiyalar & Qarzlar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 shadow-sm cursor-pointer hover:border-amber-400 transition" onClick={() => onNavigateTab('customers')}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Mijozlar Qarzdorligi</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {formatNumberWithSpaces(totalDebts)} <span className="text-xs font-bold text-slate-400">so&apos;m</span>
            </div>
            <div className="text-xs font-bold font-mono text-emerald-600 mt-0.5">
              ≈ ${formatUSDNumber(totalDebts / exchangeRate)} USD
            </div>
            <div className="text-[10px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
              <span>Qarz daftari & eslatmalar &rarr;</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Ombor Mahsulotlar Qiymati */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:border-cyan-400 transition" onClick={() => onNavigateTab('inventory')}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ombor Qiymati</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
              {baseCurrency === 'USD' ? `$${formatUSDNumber(totalInventoryRetailUSD)}` : `${formatNumberWithSpaces(totalInventoryRetail)} so'm`}
            </div>
            <div className="text-xs font-bold text-slate-500 mt-0.5">
              Tannarx: {baseCurrency === 'USD' ? `$${formatUSDNumber(totalInventoryCostUSD)}` : `${formatNumberWithSpaces(totalInventoryCost)} so'm`}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
              <span>{products.length} turdagi tovar</span>
              {criticalStockCount > 0 && (
                <span className="font-bold text-amber-600">⚠️ {criticalStockCount} ta kam qolgan</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Section: Interactive Sales Dynamics Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <span>Savdo va Xarajatlar Dinamikasi</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Kunlik tushumlar, chiqimlar va cheklar soni statistikasi
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setPeriodFilter('7d')}
                className={`px-3 py-1 rounded-lg transition ${
                  periodFilter === '7d'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                7 kun
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('30d')}
                className={`px-3 py-1 rounded-lg transition ${
                  periodFilter === '30d'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                30 kun
              </button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-300">Sotuv tushumi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-rose-400" />
            <span className="text-slate-600 dark:text-slate-300">Xarajatlar</span>
          </div>
        </div>

        {/* Bar Chart Visualizer */}
        <div className="pt-4 pb-2">
          <div className="h-56 flex items-end gap-2 sm:gap-4 justify-between border-b border-slate-200 dark:border-slate-800 pb-2 px-1">
            {chartData.map((d, idx) => {
              const salesHeight = Math.max(8, Math.round((d.sales / maxChartValue) * 100));
              const expHeight = Math.max(4, Math.round((d.expenses / maxChartValue) * 100));
              const isHovered = hoveredBarIndex === idx;

              return (
                <div
                  key={d.dateKey}
                  className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative cursor-pointer"
                  onMouseEnter={() => setHoveredBarIndex(idx)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                >
                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div className="absolute bottom-full mb-2 z-20 bg-slate-900 text-white rounded-xl p-2.5 text-[10px] shadow-2xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 border border-slate-700">
                      <div className="font-bold text-amber-400">{d.label} ({d.dateKey})</div>
                      <div className="text-emerald-400 font-mono mt-0.5">
                        Savdo: {formatNumberWithSpaces(d.sales)} so&apos;m
                      </div>
                      <div className="text-rose-400 font-mono">
                        Xarajat: {formatNumberWithSpaces(d.expenses)} so&apos;m
                      </div>
                      <div className="text-slate-300 mt-0.5">
                        Cheklar: {d.receiptsCount} ta
                      </div>
                    </div>
                  )}

                  {/* Dual Bar (Sales + Expense) */}
                  <div className="w-full flex items-end justify-center gap-1 h-full">
                    {/* Sales Bar */}
                    <div
                      style={{ height: `${salesHeight}%` }}
                      className={`w-full max-w-[20px] rounded-t-lg transition-all duration-300 ${
                        isHovered ? 'bg-emerald-400 ring-2 ring-emerald-500/50' : 'bg-emerald-500'
                      }`}
                    />
                    {/* Expense Bar */}
                    {d.expenses > 0 && (
                      <div
                        style={{ height: `${expHeight}%` }}
                        className={`w-full max-w-[10px] rounded-t-lg transition-all duration-300 ${
                          isHovered ? 'bg-rose-500 ring-2 ring-rose-400/50' : 'bg-rose-400'
                        }`}
                      />
                    )}
                  </div>

                  {/* X-axis Label */}
                  <span className="text-[9px] font-mono text-slate-400 truncate w-full text-center mt-1">
                    {d.label.split('-')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two-Column Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Top Selling Products */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Eng Ko&apos;p Sotilgan Mahsulotlar (Top-5)</span>
            </h3>
            <button
              onClick={() => onNavigateTab('sales_history')}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              Barchasi <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Hali sotuvlar mavjud emas
              </div>
            ) : (
              topProducts.map((item, index) => {
                const maxTopSum = topProducts[0]?.totalSum || 1;
                const percent = Math.round((item.totalSum / maxTopSum) * 100);

                return (
                  <div key={item.product.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${
                          index === 0 ? 'bg-amber-100 text-amber-800' :
                          index === 1 ? 'bg-slate-200 text-slate-700' :
                          index === 2 ? 'bg-amber-50 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="line-clamp-1">{item.product.name}</span>
                      </div>
                      <div className="text-right shrink-0 font-mono">
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {formatNumberWithSpaces(item.totalSum)} so&apos;m
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1.5">
                          ({item.totalQty} {item.product.unit})
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Categories & Payment Types Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
          {/* Payment Methods */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-cyan-500" />
                <span>To&apos;lov Turlari Taqsimoti</span>
              </h3>
            </div>

            {/* Stacked Percentage Bar */}
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              {paymentStats.map((p, i) => (
                <div
                  key={i}
                  style={{ width: `${p.percent}%` }}
                  className={`${p.color} transition-all duration-300`}
                  title={`${p.label}: ${p.percent}%`}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              {paymentStats.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">{p.label}</span>
                  </div>
                  <span className="font-black font-mono text-slate-800 dark:text-white text-[11px]">
                    {p.percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Categories */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-500" />
              <span>Kategoriyalar Bo&apos;yicha Savdo</span>
            </h3>

            <div className="space-y-2">
              {categoryStats.slice(0, 4).map((cat, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{cat.name}</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">
                      {formatNumberWithSpaces(cat.totalRevenue)} so&apos;m ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${cat.percentage}%` }}
                      className="h-full bg-purple-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
