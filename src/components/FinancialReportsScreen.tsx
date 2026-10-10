'use client';

import React, { useState, useMemo } from 'react';
import { SalesHistoryScreen } from './SalesHistoryScreen';
import { 
  Product, 
  SaleReceipt, 
  Expense, 
  Employee, 
  PayrollRecord, 
  PurchaseInvoice, 
  Customer,
  Currency 
} from '../types';
import { 
  formatNumberWithSpaces, 
  formatUSDNumber, 
  formatMoney, 
  getNormalizedDateKey 
} from '../utils/formatters';
import * as XLSX from 'xlsx';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Download, 
  Printer, 
  Calendar, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  Percent, 
  Package, 
  HardHat, 
  Wallet, 
  CreditCard, 
  Building2, 
  Layers, 
  FileText,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  Clock,
  ArrowRight,
  Sparkles,
  History
} from 'lucide-react';

interface FinancialReportsScreenProps {
  receipts: SaleReceipt[];
  expenses: Expense[];
  products: Product[];
  employees: Employee[];
  payrolls: PayrollRecord[];
  purchases: PurchaseInvoice[];
  customers?: Customer[];
  baseCurrency?: Currency;
  exchangeRate?: number;
  currentUser?: Employee | null;
  onReturnReceipt?: (
    receiptId: string,
    returnData: {
      itemsToReturn: {
        productId: string;
        productName: string;
        quantity: number;
        serialNumbers: string[];
        unitPrice: number;
        totalRefund: number;
      }[];
      refundMethod: 'cash' | 'card' | 'debt_deduction';
      reason: string;
    }
  ) => void;
  onSaveEditReceipt?: (
    receiptId: string,
    updatedReceipt: SaleReceipt,
    newItemsStockDelta: {
      productId: string;
      quantity: number;
      serialNumbers: string[];
    }[]
  ) => void;
  initialSubTab?: SubReportTab;
}

type PeriodPreset = 'today' | 'yesterday' | 'last7days' | 'this_month' | 'last_month' | 'this_year' | 'all' | 'custom';
type SubReportTab = 'pnl' | 'products' | 'technicians' | 'cash_flow' | 'sales_history';

const MONTHS_LIST = [
  { value: 0, label: 'Yanvar' },
  { value: 1, label: 'Fevral' },
  { value: 2, label: 'Mart' },
  { value: 3, label: 'Aprel' },
  { value: 4, label: 'May' },
  { value: 5, label: 'Iyun' },
  { value: 6, label: 'Iyul' },
  { value: 7, label: 'Avgust' },
  { value: 8, label: 'Sentyabr' },
  { value: 9, label: 'Oktyabr' },
  { value: 10, label: 'Noyabr' },
  { value: 11, label: 'Dekabr' }
];

export const FinancialReportsScreen: React.FC<FinancialReportsScreenProps> = ({
  receipts,
  expenses,
  products,
  employees,
  payrolls,
  purchases,
  customers = [],
  baseCurrency = 'UZS',
  exchangeRate = 12850,
  currentUser,
  onReturnReceipt,
  onSaveEditReceipt,
  initialSubTab = 'pnl'
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodPreset>('this_month');
  const [activeSubTab, setActiveSubTab] = useState<SubReportTab>(initialSubTab);
  const [productSearch, setProductSearch] = useState<string>('');
  const [productSortBy, setProductSortBy] = useState<'profit' | 'revenue' | 'qty' | 'margin'>('profit');

  // Helper to format Date -> 'YYYY-MM-DD'
  const formatDateISO = (date: Date) => 
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const now = new Date();
  const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const todayStr = formatDateISO(now);

  const [customStartDate, setCustomStartDate] = useState<string>(currentMonthStart);
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);

  // Helper date boundaries based on preset
  const { startDate, endDate, periodLabel, daysCount } = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth(); // 0-indexed
    const d = today.getDate();

    let s = '';
    let e = '';
    let label = '';

    if (selectedPeriod === 'today') {
      s = formatDateISO(today);
      e = formatDateISO(today);
      label = "Bugungi hisobot";
    } else if (selectedPeriod === 'yesterday') {
      const yDate = new Date(today);
      yDate.setDate(d - 1);
      s = formatDateISO(yDate);
      e = formatDateISO(yDate);
      label = "Kechagi hisobot";
    } else if (selectedPeriod === 'last7days') {
      const sDate = new Date(today);
      sDate.setDate(d - 6);
      s = formatDateISO(sDate);
      e = formatDateISO(today);
      label = "Oxirgi 7 kunlik hisobot";
    } else if (selectedPeriod === 'this_month') {
      const start = new Date(y, m, 1);
      s = formatDateISO(start);
      e = formatDateISO(today);
      label = `${MONTHS_LIST[m].label} ${y} oylik hisobot`;
    } else if (selectedPeriod === 'last_month') {
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      s = formatDateISO(start);
      e = formatDateISO(end);
      label = `${MONTHS_LIST[start.getMonth()].label} ${start.getFullYear()} oylik hisobot`;
    } else if (selectedPeriod === 'this_year') {
      const start = new Date(y, 0, 1);
      s = formatDateISO(start);
      e = formatDateISO(today);
      label = `${y} yillik (YTD) hisobot`;
    } else if (selectedPeriod === 'custom') {
      s = customStartDate || formatDateISO(today);
      e = customEndDate || formatDateISO(today);
      label = `${s} dan ${e} gacha`;
    } else {
      // 'all'
      s = '2020-01-01';
      e = '2099-12-31';
      label = "Barcha davrlar bo'yicha hisobot";
    }

    let calculatedDays = 1;
    try {
      const startMs = new Date(s).getTime();
      const endMs = new Date(e).getTime();
      if (!isNaN(startMs) && !isNaN(endMs)) {
        calculatedDays = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1);
      }
    } catch {
      calculatedDays = 1;
    }

    return { startDate: s, endDate: e, periodLabel: label, daysCount: calculatedDays };
  }, [selectedPeriod, customStartDate, customEndDate]);

  const handleSelectPreset = (preset: PeriodPreset) => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();

    if (preset === 'today') {
      const s = formatDateISO(today);
      setCustomStartDate(s);
      setCustomEndDate(s);
    } else if (preset === 'yesterday') {
      const yDate = new Date(today);
      yDate.setDate(d - 1);
      const s = formatDateISO(yDate);
      setCustomStartDate(s);
      setCustomEndDate(s);
    } else if (preset === 'last7days') {
      const sDate = new Date(today);
      sDate.setDate(d - 6);
      setCustomStartDate(formatDateISO(sDate));
      setCustomEndDate(formatDateISO(today));
    } else if (preset === 'this_month') {
      const start = new Date(y, m, 1);
      setCustomStartDate(formatDateISO(start));
      setCustomEndDate(formatDateISO(today));
    } else if (preset === 'last_month') {
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      setCustomStartDate(formatDateISO(start));
      setCustomEndDate(formatDateISO(end));
    } else if (preset === 'this_year') {
      const start = new Date(y, 0, 1);
      setCustomStartDate(formatDateISO(start));
      setCustomEndDate(formatDateISO(today));
    } else if (preset === 'all') {
      setCustomStartDate('2020-01-01');
      setCustomEndDate(formatDateISO(today));
    }
    setSelectedPeriod(preset);
  };

  const handleSelectSpecificMonth = (year: number, monthIndex: number) => {
    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 0);
    setCustomStartDate(formatDateISO(start));
    setCustomEndDate(formatDateISO(end));
    setSelectedPeriod('custom');
  };

  const handleShiftMonth = (direction: -1 | 1) => {
    const base = new Date(customStartDate || todayStr);
    const newDate = new Date(base.getFullYear(), base.getMonth() + direction, 1);
    handleSelectSpecificMonth(newDate.getFullYear(), newDate.getMonth());
  };

  const handleCustomStartDateChange = (val: string) => {
    setCustomStartDate(val);
    setSelectedPeriod('custom');
  };

  const handleCustomEndDateChange = (val: string) => {
    setCustomEndDate(val);
    setSelectedPeriod('custom');
  };

  // Filter receipts within period
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const key = getNormalizedDateKey(r.createdAt);
      return key >= startDate && key <= endDate;
    });
  }, [receipts, startDate, endDate]);

  // Filter expenses within period
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const key = getNormalizedDateKey(e.createdAt);
      return key >= startDate && key <= endDate;
    });
  }, [expenses, startDate, endDate]);

  // Filter payrolls within period
  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((p) => {
      const key = p.paidAt ? getNormalizedDateKey(p.paidAt) : `${p.periodMonth}-01`;
      return key >= startDate && key <= endDate;
    });
  }, [payrolls, startDate, endDate]);

  // -------------------------------------------------------------
  // P&L CALCULATIONS (Financial Core)
  // -------------------------------------------------------------
  const pnlData = useMemo(() => {
    let grossProductSalesUZS = 0;
    let grossServiceSalesUZS = 0;
    let totalDiscountUZS = 0;
    let totalRefundsUZS = 0;
    let totalCOGS_UZS = 0; // Cost of goods sold (tannarx)
    let technicianWagesUZS = 0; // Wages assigned directly in receipts

    // Aggregators for payments
    let cashUZS = 0;
    let cardUZS = 0;
    let bankUZS = 0;
    let usdCashRaw = 0;
    let debtUZS = 0;
    let cashbackUsedUZS = 0;

    // Per-product breakdown map
    const productStatsMap = new Map<string, {
      productId: string;
      productName: string;
      category: string;
      sku?: string;
      isService: boolean;
      totalQty: number;
      revenueUZS: number;
      costUZS: number;
      grossProfitUZS: number;
    }>();

    // Per-technician breakdown map
    const technicianStatsMap = new Map<string, {
      technicianId: string;
      technicianName: string;
      role: string;
      jobsCount: number;
      salesSumUZS: number;
      wageSumUZS: number;
      wageSumUSD: number;
    }>();

    filteredReceipts.forEach((r) => {
      totalDiscountUZS += (r.discountTotal || 0);
      totalRefundsUZS += (r.totalRefunded || 0);

      // Payment splits
      cashUZS += (r.payments?.cash || 0);
      cardUZS += (r.payments?.card || 0);
      debtUZS += (r.payments?.debt || 0);
      cashbackUsedUZS += (r.payments?.cashbackUsed || 0);

      // Technician wages in receipt
      if (r.technicians && r.technicians.length > 0) {
        r.technicians.forEach((t) => {
          const wUZS = t.wageUZS || (t.wageUSD ? Math.round(t.wageUSD * exchangeRate) : 0);
          technicianWagesUZS += wUZS;

          if (!technicianStatsMap.has(t.id)) {
            technicianStatsMap.set(t.id, {
              technicianId: t.id,
              technicianName: t.fullName,
              role: t.role || "Montajchi Usta",
              jobsCount: 0,
              salesSumUZS: 0,
              wageSumUZS: 0,
              wageSumUSD: 0
            });
          }
          const techStat = technicianStatsMap.get(t.id)!;
          techStat.jobsCount += 1;
          techStat.salesSumUZS += (r.totalAmount / r.technicians!.length);
          techStat.wageSumUZS += wUZS;
          techStat.wageSumUSD += (t.wageUSD || Number((wUZS / exchangeRate).toFixed(1)));
        });
      } else if (r.technicianId && r.technicianName) {
        if (!technicianStatsMap.has(r.technicianId)) {
          technicianStatsMap.set(r.technicianId, {
            technicianId: r.technicianId,
            technicianName: r.technicianName,
            role: "Montajchi Usta",
            jobsCount: 0,
            salesSumUZS: 0,
            wageSumUZS: 0,
            wageSumUSD: 0
          });
        }
        const techStat = technicianStatsMap.get(r.technicianId)!;
        techStat.jobsCount += 1;
        techStat.salesSumUZS += r.totalAmount;
      }

      // Line items analysis
      r.items.forEach((item) => {
        const itemTotal = item.quantity * item.appliedPrice;
        const catalogProd = products.find((p) => p.id === item.product.id) || item.product;
        const unitCost = catalogProd.costPrice || 0;
        const itemCost = catalogProd.isService ? 0 : item.quantity * unitCost;

        if (catalogProd.isService) {
          grossServiceSalesUZS += itemTotal;
        } else {
          grossProductSalesUZS += itemTotal;
          totalCOGS_UZS += itemCost;
        }

        // Aggregate to product stats
        const pId = catalogProd.id;
        if (!productStatsMap.has(pId)) {
          productStatsMap.set(pId, {
            productId: pId,
            productName: catalogProd.name,
            category: catalogProd.category || "Boshqa",
            sku: catalogProd.sku,
            isService: !!catalogProd.isService,
            totalQty: 0,
            revenueUZS: 0,
            costUZS: 0,
            grossProfitUZS: 0
          });
        }
        const pStat = productStatsMap.get(pId)!;
        pStat.totalQty += item.quantity;
        pStat.revenueUZS += itemTotal;
        pStat.costUZS += itemCost;
        pStat.grossProfitUZS += (itemTotal - itemCost);
      });
    });

    // Expenses breakdown by category
    const expenseCategoryMap = new Map<string, number>();
    let totalExpensesUZS = 0;

    filteredExpenses.forEach((e) => {
      totalExpensesUZS += e.amount;
      const cat = e.category || "Boshqa xarajatlar";
      expenseCategoryMap.set(cat, (expenseCategoryMap.get(cat) || 0) + e.amount);
    });

    // Payroll total
    const totalPayrollGrossUZS = filteredPayrolls.reduce((sum, p) => sum + p.totalGross, 0);
    const totalPayrollNetUZS = filteredPayrolls.reduce((sum, p) => sum + p.totalNet, 0);

    // High Level Totals
    const grossRevenueUZS = grossProductSalesUZS + grossServiceSalesUZS;
    const netRevenueUZS = grossRevenueUZS - totalRefundsUZS;
    const grossProfitUZS = netRevenueUZS - totalCOGS_UZS;
    const grossMarginPercent = netRevenueUZS > 0 ? (grossProfitUZS / netRevenueUZS) * 100 : 0;

    // Total Operating Expenses (OPEX): exclude expenses categorized as "Oylik / Ish haqi" if payroll records exist to avoid double count
    const opexWithoutSalaryUZS = filteredExpenses
      .filter((e) => !e.category.toLowerCase().includes('ish haqi') && !e.category.toLowerCase().includes('oylik'))
      .reduce((sum, e) => sum + e.amount, 0);

    const totalLaborCostsUZS = totalPayrollNetUZS > 0 ? totalPayrollNetUZS : (technicianWagesUZS + (totalExpensesUZS - opexWithoutSalaryUZS));

    const totalOperatingCostUZS = opexWithoutSalaryUZS + totalLaborCostsUZS;
    const netProfitUZS = grossProfitUZS - totalOperatingCostUZS;
    const netProfitMarginPercent = netRevenueUZS > 0 ? (netProfitUZS / netRevenueUZS) * 100 : 0;

    return {
      grossProductSalesUZS,
      grossServiceSalesUZS,
      grossRevenueUZS,
      totalDiscountUZS,
      totalRefundsUZS,
      netRevenueUZS,
      totalCOGS_UZS,
      grossProfitUZS,
      grossMarginPercent,
      opexWithoutSalaryUZS,
      expenseCategoryMap: Array.from(expenseCategoryMap.entries()).map(([name, amount]) => ({ name, amount })),
      totalLaborCostsUZS,
      totalOperatingCostUZS,
      netProfitUZS,
      netProfitMarginPercent,
      receiptsCount: filteredReceipts.length,
      cashFlow: {
        cashUZS,
        cardUZS,
        bankUZS,
        debtUZS,
        cashbackUsedUZS
      },
      productStats: Array.from(productStatsMap.values()),
      technicianStats: Array.from(technicianStatsMap.values())
    };
  }, [filteredReceipts, filteredExpenses, filteredPayrolls, products, exchangeRate]);

  // Product profitability list sorted & filtered
  const sortedProductStats = useMemo(() => {
    let list = pnlData.productStats;
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase().trim();
      list = list.filter((p) => 
        p.productName.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) || 
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }

    return [...list].sort((a, b) => {
      if (productSortBy === 'profit') return b.grossProfitUZS - a.grossProfitUZS;
      if (productSortBy === 'revenue') return b.revenueUZS - a.revenueUZS;
      if (productSortBy === 'qty') return b.totalQty - a.totalQty;
      if (productSortBy === 'margin') {
        const marginA = a.revenueUZS > 0 ? (a.grossProfitUZS / a.revenueUZS) * 100 : 0;
        const marginB = b.revenueUZS > 0 ? (b.grossProfitUZS / b.revenueUZS) * 100 : 0;
        return marginB - marginA;
      }
      return 0;
    });
  }, [pnlData.productStats, productSearch, productSortBy]);

  // Excel Export Handler
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: P&L Summary Statement
    const pnlRows = [
      ["SMART CONTROL - FOYDA VA ZARAR (P&L) HISOBOTI"],
      [`Davr: ${periodLabel} (${startDate} - ${endDate})`],
      [`Valyuta kursi: 1$ = ${formatNumberWithSpaces(exchangeRate)} so'm`],
      [""],
      ["KO'RSATKICH NOMI", "SUMMA (SO'M)", "SUMMA ($ USD)", "ULUSHI / FOIZ (%)"],
      ["1. DAROMADLAR (REVENUE)", "", "", ""],
      ["  Mahsulotlar savdosi", pnlData.grossProductSalesUZS, Number((pnlData.grossProductSalesUZS / exchangeRate).toFixed(2)), "-"],
      ["  Montaj & Sozlash xizmatlari", pnlData.grossServiceSalesUZS, Number((pnlData.grossServiceSalesUZS / exchangeRate).toFixed(2)), "-"],
      ["  Chegirmalar (Skidka)", -pnlData.totalDiscountUZS, -Number((pnlData.totalDiscountUZS / exchangeRate).toFixed(2)), "-"],
      ["  Qaytarilgan tovarlar (Vozvrat)", -pnlData.totalRefundsUZS, -Number((pnlData.totalRefundsUZS / exchangeRate).toFixed(2)), "-"],
      ["SOF TUSHUM (NET REVENUE)", pnlData.netRevenueUZS, Number((pnlData.netRevenueUZS / exchangeRate).toFixed(2)), "100.0%"],
      [""],
      ["2. SOTILGAN TOVARLAR TANNARXI (COGS)", "", "", ""],
      ["  Mahsulotlar kirim (prixod) qiymati", pnlData.totalCOGS_UZS, Number((pnlData.totalCOGS_UZS / exchangeRate).toFixed(2)), `${((pnlData.totalCOGS_UZS / (pnlData.netRevenueUZS || 1)) * 100).toFixed(1)}%`],
      ["YALPI FOYDA (GROSS PROFIT)", pnlData.grossProfitUZS, Number((pnlData.grossProfitUZS / exchangeRate).toFixed(2)), `${pnlData.grossMarginPercent.toFixed(1)}%`],
      [""],
      ["3. OPERATSION XARAJATLAR (OPEX)", "", "", ""],
      ...pnlData.expenseCategoryMap.map(c => [
        `  ${c.name}`, c.amount, Number((c.amount / exchangeRate).toFixed(2)), `${((c.amount / (pnlData.netRevenueUZS || 1)) * 100).toFixed(1)}%`
      ]),
      ["JAMI OPERATSION CHIQIMLAR", pnlData.opexWithoutSalaryUZS, Number((pnlData.opexWithoutSalaryUZS / exchangeRate).toFixed(2)), `${((pnlData.opexWithoutSalaryUZS / (pnlData.netRevenueUZS || 1)) * 100).toFixed(1)}%`],
      [""],
      ["4. MEHNAT HAQI VA USTA XARAJATLARI (PAYROLL)", "", "", ""],
      ["  Xodimlar va montaj ustalari ish haqi", pnlData.totalLaborCostsUZS, Number((pnlData.totalLaborCostsUZS / exchangeRate).toFixed(2)), `${((pnlData.totalLaborCostsUZS / (pnlData.netRevenueUZS || 1)) * 100).toFixed(1)}%`],
      [""],
      ["5. SOF FOYDA (NET PROFIT)", pnlData.netProfitUZS, Number((pnlData.netProfitUZS / exchangeRate).toFixed(2)), `${pnlData.netProfitMarginPercent.toFixed(1)}%`]
    ];

    const wsPnL = XLSX.utils.aoa_to_sheet(pnlRows);
    XLSX.utils.book_append_sheet(wb, wsPnL, "P&L Hisoboti");

    // Sheet 2: Products Profitability
    const prodRows = [
      ["№", "Mahsulot Nomi", "Kategoriya", "Artikul", "Sotilgan Soni", "Jami Tushum (so'm)", "Jami Tushum ($)", "Tannarxi (so'm)", "Sof Foyda (so'm)", "Sof Foyda ($)", "Marja (%)"],
      ...pnlData.productStats.map((p, idx) => {
        const margin = p.revenueUZS > 0 ? (p.grossProfitUZS / p.revenueUZS) * 100 : 0;
        return [
          idx + 1,
          p.productName,
          p.category,
          p.sku || "",
          p.totalQty,
          p.revenueUZS,
          Number((p.revenueUZS / exchangeRate).toFixed(2)),
          p.costUZS,
          p.grossProfitUZS,
          Number((p.grossProfitUZS / exchangeRate).toFixed(2)),
          `${margin.toFixed(1)}%`
        ];
      })
    ];

    const wsProd = XLSX.utils.aoa_to_sheet(prodRows);
    XLSX.utils.book_append_sheet(wb, wsProd, "Tovarlar Marjasi");

    // Sheet 3: Technician Performance
    const techRows = [
      ["№", "Usta F.I.Sh.", "Lavozimi", "Bajarilgan Obyektlar", "Keltirgan Tushumi (so'm)", "Keltirgan Tushumi ($)", "To'langan Ish Haqi (so'm)", "To'langan Ish Haqi ($)"],
      ...pnlData.technicianStats.map((t, idx) => [
        idx + 1,
        t.technicianName,
        t.role,
        t.jobsCount,
        t.salesSumUZS,
        Number((t.salesSumUZS / exchangeRate).toFixed(2)),
        t.wageSumUZS,
        t.wageSumUSD
      ])
    ];

    const wsTech = XLSX.utils.aoa_to_sheet(techRows);
    XLSX.utils.book_append_sheet(wb, wsTech, "Ustalar Samaradorligi");

    XLSX.writeFile(wb, `SmartControl_Moliyaviy_Hisobot_${startDate}_${endDate}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50 dark:bg-slate-950 print:p-2 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 print:border-b-2">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Moliyaviy Tahlil & P&L Hisoboti
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono">
                  {periodLabel}
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Kompaniyaning sof foydasi, tovarlar marjasi, operatsion xarajatlar va kassa pul oqimi tahlili
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition active:scale-[0.98]"
            title="Barcha jadvallarni Excel (.xlsx) faylga eksport qilish"
          >
            <Download className="w-4 h-4" />
            <span>Excel Eksport</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition active:scale-[0.98]"
            title="Hisobotni chop etish yoki PDF shaklida saqlash"
          >
            <Printer className="w-4 h-4" />
            <span>Chop etish / PDF</span>
          </button>
        </div>
      </div>

      {/* Date Filter & Range Control Panel */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5 print:hidden">
        {/* Row 1: Period Presets & Quick Month Jump */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Davr:
            </span>
            {[
              { id: 'today', label: 'Bugun' },
              { id: 'yesterday', label: 'Kecha' },
              { id: 'last7days', label: '7 kun' },
              { id: 'this_month', label: 'Shu oy' },
              { id: 'last_month', label: "O'tgan oy" },
              { id: 'this_year', label: 'Yil (YTD)' },
              { id: 'all', label: 'Barchasi' }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectPreset(item.id as PeriodPreset)}
                className={`px-3 py-1.5 rounded-xl font-bold transition text-xs active:scale-95 ${
                  selectedPeriod === item.id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Quick Month Switcher */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleShiftMonth(-1)}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Oldingi oyga o'tish"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Month & Year Selectors */}
            <div className="flex items-center gap-1">
              <select
                value={new Date(startDate || todayStr).getMonth()}
                onChange={(e) => {
                  const currYear = new Date(startDate || todayStr).getFullYear();
                  handleSelectSpecificMonth(currYear, Number(e.target.value));
                }}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
              >
                {MONTHS_LIST.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>

              <select
                value={new Date(startDate || todayStr).getFullYear()}
                onChange={(e) => {
                  const currMonth = new Date(startDate || todayStr).getMonth();
                  handleSelectSpecificMonth(Number(e.target.value), currMonth);
                }}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-white outline-none font-mono cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => handleShiftMonth(1)}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Keyingi oyga o'tish"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Row 2: Direct Date Inputs (Boshlanish va Tugash sanasi) */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CalendarRange className="w-4 h-4 text-amber-500" />
              <span>Aniq sanani belgilash:</span>
            </span>

            {/* Start Date */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
              <span className="text-slate-400 text-[11px] font-medium">Dan:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleCustomStartDateChange(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white font-mono font-bold text-xs outline-none cursor-pointer"
              />
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />

            {/* End Date */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
              <span className="text-slate-400 text-[11px] font-medium">Gacha:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleCustomEndDateChange(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white font-mono font-bold text-xs outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Active Period Feedback & Duration */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium text-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                <strong>{daysCount} kunlik</strong> hisobot ({startDate} — {endDate})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 6 Executive KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* KPI 1: Yalpi Tushum */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Yalpi Tushum</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg font-black text-slate-900 dark:text-white font-mono leading-tight">
              {baseCurrency === 'USD' 
                ? `$${formatUSDNumber(pnlData.netRevenueUZS / exchangeRate)}` 
                : `${formatNumberWithSpaces(pnlData.netRevenueUZS)} so'm`}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              ≈ {baseCurrency === 'USD' 
                ? `${formatNumberWithSpaces(pnlData.netRevenueUZS)} so'm` 
                : `$${formatUSDNumber(pnlData.netRevenueUZS / exchangeRate)}`}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>{pnlData.receiptsCount} ta savdo cheki</span>
          </div>
        </div>

        {/* KPI 2: Mahsulot Tannarxi (COGS) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Tannarx (COGS)</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg font-black text-slate-700 dark:text-slate-300 font-mono leading-tight">
              {baseCurrency === 'USD' 
                ? `$${formatUSDNumber(pnlData.totalCOGS_UZS / exchangeRate)}` 
                : `${formatNumberWithSpaces(pnlData.totalCOGS_UZS)} so'm`}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              ≈ {baseCurrency === 'USD' 
                ? `${formatNumberWithSpaces(pnlData.totalCOGS_UZS)} so'm` 
                : `$${formatUSDNumber(pnlData.totalCOGS_UZS / exchangeRate)}`}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Sotilgan tovarlar xaridi</span>
          </div>
        </div>

        {/* KPI 3: Yalpi Foyda (Gross Profit) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Yalpi Foyda</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono leading-tight">
              {baseCurrency === 'USD' 
                ? `$${formatUSDNumber(pnlData.grossProfitUZS / exchangeRate)}` 
                : `${formatNumberWithSpaces(pnlData.grossProfitUZS)} so'm`}
            </div>
            <div className="text-[10px] text-emerald-600 font-bold font-mono mt-0.5">
              Marja: {pnlData.grossMarginPercent.toFixed(1)}%
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
            <span>Tushum - Tovar tannarxi</span>
          </div>
        </div>

        {/* KPI 4: Operatsion Chiqimlar (OPEX) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Xarajatlar (OPEX)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono leading-tight">
              {baseCurrency === 'USD' 
                ? `$${formatUSDNumber(pnlData.opexWithoutSalaryUZS / exchangeRate)}` 
                : `${formatNumberWithSpaces(pnlData.opexWithoutSalaryUZS)} so'm`}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              ≈ {baseCurrency === 'USD' 
                ? `${formatNumberWithSpaces(pnlData.opexWithoutSalaryUZS)} so'm` 
                : `$${formatUSDNumber(pnlData.opexWithoutSalaryUZS / exchangeRate)}`}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
            <span>Ijara, kommunal, transport</span>
          </div>
        </div>

        {/* KPI 5: Mehnat Haqi (Payroll) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Ish Haqi (Usta/Xodim)</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <HardHat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono leading-tight">
              {baseCurrency === 'USD' 
                ? `$${formatUSDNumber(pnlData.totalLaborCostsUZS / exchangeRate)}` 
                : `${formatNumberWithSpaces(pnlData.totalLaborCostsUZS)} so'm`}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              ≈ {baseCurrency === 'USD' 
                ? `${formatNumberWithSpaces(pnlData.totalLaborCostsUZS)} so'm` 
                : `$${formatUSDNumber(pnlData.totalLaborCostsUZS / exchangeRate)}`}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
            <span>Montaj & oylik maoshlar</span>
          </div>
        </div>

        {/* KPI 6: SOF FOYDA (NET PROFIT) */}
        <div className={`p-4 rounded-2xl border shadow-sm relative overflow-hidden ${
          pnlData.netProfitUZS >= 0
            ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border-emerald-300 dark:border-emerald-700/60'
            : 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            <span>SOF FOYDA (NET)</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              pnlData.netProfitUZS >= 0 
                ? 'bg-emerald-600 text-white' 
                : 'bg-rose-600 text-white'
            }`}>
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-xl font-black font-mono leading-tight ${
              pnlData.netProfitUZS >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
            }`}>
              {pnlData.netProfitUZS >= 0 ? '+' : ''}
              {baseCurrency === 'USD' 
                ? `$${formatUSDNumber(pnlData.netProfitUZS / exchangeRate)}` 
                : `${formatNumberWithSpaces(pnlData.netProfitUZS)} so'm`}
            </div>
            <div className="text-[10px] font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
              Sof Rentabellik: {pnlData.netProfitMarginPercent.toFixed(1)}%
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/40 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
            <span>Kompaniyaning yakuniy foydasi</span>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 print:hidden">
        <button
          onClick={() => setActiveSubTab('sales_history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeSubTab === 'sales_history'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-extrabold'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <History className="w-4 h-4 text-emerald-400" />
          <span>🧾 Savdo Tarixi & Cheklar ({filteredReceipts.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('pnl')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeSubTab === 'pnl'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-extrabold'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>📊 Foyda va Zarar (P&L Buxgalteriya)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('products')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeSubTab === 'products'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-extrabold'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Package className="w-4 h-4 text-cyan-400" />
          <span>📦 Tovarlar Rentabelligi & Marja ({pnlData.productStats.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('technicians')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeSubTab === 'technicians'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-extrabold'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <HardHat className="w-4 h-4 text-purple-400" />
          <span>👷‍♂️ Ustalar Samaradorligi ({pnlData.technicianStats.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('cash_flow')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeSubTab === 'cash_flow'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-extrabold'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4 text-amber-400" />
          <span>💳 Kassa & Pul Oqimi</span>
        </button>
      </div>

      {/* SUB-TAB 1: P&L Statement (Formal Financial Table) */}
      {activeSubTab === 'pnl' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                Foyda va Zarar Hisoboti (Profit & Loss Statement)
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Barcha summalar qat&apos;iy xarid kungi kurs va amaldagi cheklar asosida
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-bold text-[10px] text-slate-500 tracking-wider">
                <tr>
                  <th className="py-3 px-5">Buxgalteriya Moddasi</th>
                  <th className="py-3 px-4 text-right">Summa (so&apos;m)</th>
                  <th className="py-3 px-4 text-right">Summa ($ USD)</th>
                  <th className="py-3 px-4 text-right">Tushumdagi Ulushi (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {/* 1. REVENUE SECTION */}
                <tr className="bg-slate-50/60 dark:bg-slate-800/30 font-bold text-slate-800 dark:text-slate-200">
                  <td className="py-2.5 px-5 font-sans flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    1. JAMI TUSHUMLAR VA DAROMADLAR (REVENUE)
                  </td>
                  <td className="py-2.5 px-4 text-right">{formatNumberWithSpaces(pnlData.netRevenueUZS)}</td>
                  <td className="py-2.5 px-4 text-right text-blue-600 dark:text-blue-400">${formatUSDNumber(pnlData.netRevenueUZS / exchangeRate)}</td>
                  <td className="py-2.5 px-4 text-right text-slate-500">100.0%</td>
                </tr>
                <tr className="text-slate-600 dark:text-slate-400 hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                  <td className="py-2 px-8 font-sans">&bull; Mahsulot va uskunalar savdosi</td>
                  <td className="py-2 px-4 text-right">{formatNumberWithSpaces(pnlData.grossProductSalesUZS)}</td>
                  <td className="py-2 px-4 text-right">${formatUSDNumber(pnlData.grossProductSalesUZS / exchangeRate)}</td>
                  <td className="py-2 px-4 text-right">{((pnlData.grossProductSalesUZS / (pnlData.netRevenueUZS || 1)) * 100).toFixed(1)}%</td>
                </tr>
                <tr className="text-slate-600 dark:text-slate-400 hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                  <td className="py-2 px-8 font-sans">&bull; Montaj va sozlash xizmatlari</td>
                  <td className="py-2 px-4 text-right">{formatNumberWithSpaces(pnlData.grossServiceSalesUZS)}</td>
                  <td className="py-2 px-4 text-right">${formatUSDNumber(pnlData.grossServiceSalesUZS / exchangeRate)}</td>
                  <td className="py-2 px-4 text-right">{((pnlData.grossServiceSalesUZS / (pnlData.netRevenueUZS || 1)) * 100).toFixed(1)}%</td>
                </tr>
                {pnlData.totalDiscountUZS > 0 && (
                  <tr className="text-amber-600 hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                    <td className="py-2 px-8 font-sans">&bull; Berilgan chegirmalar (Skidka)</td>
                    <td className="py-2 px-4 text-right">-{formatNumberWithSpaces(pnlData.totalDiscountUZS)}</td>
                    <td className="py-2 px-4 text-right">-${formatUSDNumber(pnlData.totalDiscountUZS / exchangeRate)}</td>
                    <td className="py-2 px-4 text-right">-{((pnlData.totalDiscountUZS / (pnlData.netRevenueUZS || 1)) * 100).toFixed(1)}%</td>
                  </tr>
                )}
                {pnlData.totalRefundsUZS > 0 && (
                  <tr className="text-rose-600 hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                    <td className="py-2 px-8 font-sans">&bull; Qaytarilgan tovarlar (Vozvrat)</td>
                    <td className="py-2 px-4 text-right">-{formatNumberWithSpaces(pnlData.totalRefundsUZS)}</td>
                    <td className="py-2 px-4 text-right">-${formatUSDNumber(pnlData.totalRefundsUZS / exchangeRate)}</td>
                    <td className="py-2 px-4 text-right">-{((pnlData.totalRefundsUZS / (pnlData.netRevenueUZS || 1)) * 100).toFixed(1)}%</td>
                  </tr>
                )}

                {/* 2. COGS SECTION */}
                <tr className="bg-slate-50/60 dark:bg-slate-800/30 font-bold text-slate-800 dark:text-slate-200">
                  <td className="py-2.5 px-5 font-sans flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                    2. SOTILGAN TOVARLAR TANNARXI (COGS - COST OF GOODS SOLD)
                  </td>
                  <td className="py-2.5 px-4 text-right">{formatNumberWithSpaces(pnlData.totalCOGS_UZS)}</td>
                  <td className="py-2.5 px-4 text-right">${formatUSDNumber(pnlData.totalCOGS_UZS / exchangeRate)}</td>
                  <td className="py-2.5 px-4 text-right">{((pnlData.totalCOGS_UZS / (pnlData.netRevenueUZS || 1)) * 100).toFixed(1)}%</td>
                </tr>

                {/* GROSS PROFIT ROW */}
                <tr className="bg-emerald-50 dark:bg-emerald-950/40 font-extrabold text-emerald-800 dark:text-emerald-300 text-sm border-y-2 border-emerald-200 dark:border-emerald-800/60">
                  <td className="py-3 px-5 font-sans flex items-center gap-1.5">
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    YALPI FOYDA (GROSS PROFIT)
                  </td>
                  <td className="py-3 px-4 text-right">{formatNumberWithSpaces(pnlData.grossProfitUZS)}</td>
                  <td className="py-3 px-4 text-right">${formatUSDNumber(pnlData.grossProfitUZS / exchangeRate)}</td>
                  <td className="py-3 px-4 text-right font-black">{pnlData.grossMarginPercent.toFixed(1)}%</td>
                </tr>

                {/* 3. OPEX SECTION */}
                <tr className="bg-slate-50/60 dark:bg-slate-800/30 font-bold text-slate-800 dark:text-slate-200">
                  <td className="py-2.5 px-5 font-sans flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    3. OPERATSION XARAJATLAR (OPEX)
                  </td>
                  <td className="py-2.5 px-4 text-right">{formatNumberWithSpaces(pnlData.opexWithoutSalaryUZS)}</td>
                  <td className="py-2.5 px-4 text-right text-rose-600 dark:text-rose-400">${formatUSDNumber(pnlData.opexWithoutSalaryUZS / exchangeRate)}</td>
                  <td className="py-2.5 px-4 text-right">{((pnlData.opexWithoutSalaryUZS / (pnlData.netRevenueUZS || 1)) * 100).toFixed(1)}%</td>
                </tr>
                {pnlData.expenseCategoryMap.map((cat, cIdx) => (
                  <tr key={cIdx} className="text-slate-600 dark:text-slate-400 hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                    <td className="py-2 px-8 font-sans">&bull; {cat.name}</td>
                    <td className="py-2 px-4 text-right">{formatNumberWithSpaces(cat.amount)}</td>
                    <td className="py-2 px-4 text-right">${formatUSDNumber(cat.amount / exchangeRate)}</td>
                    <td className="py-2 px-4 text-right">{((cat.amount / (pnlData.netRevenueUZS || 1)) * 100).toFixed(1)}%</td>
                  </tr>
                ))}

                {/* 4. PAYROLL & LABOR COSTS */}
                <tr className="bg-slate-50/60 dark:bg-slate-800/30 font-bold text-slate-800 dark:text-slate-200">
                  <td className="py-2.5 px-5 font-sans flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    4. MEHNAT HAQI VA USTA KOMISSIYASI (PAYROLL & LABOR)
                  </td>
                  <td className="py-2.5 px-4 text-right">{formatNumberWithSpaces(pnlData.totalLaborCostsUZS)}</td>
                  <td className="py-2.5 px-4 text-right text-amber-600 dark:text-amber-400">${formatUSDNumber(pnlData.totalLaborCostsUZS / exchangeRate)}</td>
                  <td className="py-2.5 px-4 text-right">{((pnlData.totalLaborCostsUZS / (pnlData.netRevenueUZS || 1)) * 100).toFixed(1)}%</td>
                </tr>

                {/* NET PROFIT FINAL ROW */}
                <tr className={`font-black text-sm border-t-2 ${
                  pnlData.netProfitUZS >= 0
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-emerald-400 dark:border-emerald-600'
                    : 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border-rose-400 dark:border-rose-600'
                }`}>
                  <td className="py-4 px-5 font-sans flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                    5. SOF DAROMAD / SOF FOYDA (NET PROFIT / EBITDA)
                  </td>
                  <td className="py-4 px-4 text-right text-base">
                    {pnlData.netProfitUZS >= 0 ? '+' : ''}{formatNumberWithSpaces(pnlData.netProfitUZS)} so&apos;m
                  </td>
                  <td className="py-4 px-4 text-right text-base">
                    {pnlData.netProfitUZS >= 0 ? '+' : ''}${formatUSDNumber(pnlData.netProfitUZS / exchangeRate)}
                  </td>
                  <td className="py-4 px-4 text-right text-base font-black">
                    {pnlData.netProfitMarginPercent.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Product Profitability Matrix */}
      {activeSubTab === 'products' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
          {/* Filter & Search Bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Mahsulot nomi yoki artikul..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
              <span className="text-slate-400 font-bold">Saralash:</span>
              <select
                value={productSortBy}
                onChange={(e) => setProductSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200"
              >
                <option value="profit">Eng ko&apos;p sof foyda keltirgan</option>
                <option value="revenue">Eng yuqori tushum (savdo)</option>
                <option value="qty">Eng ko&apos;p sotilgan dona</option>
                <option value="margin">Eng yuqori marja %</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-bold text-[10px] text-slate-500 tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">№</th>
                  <th className="py-2.5 px-4">Mahsulot / Xizmat</th>
                  <th className="py-2.5 px-4">Kategoriya</th>
                  <th className="py-2.5 px-3 text-center">Sotilgan</th>
                  <th className="py-2.5 px-4 text-right">Jami Tushum</th>
                  <th className="py-2.5 px-4 text-right">Xarid Tannarxi</th>
                  <th className="py-2.5 px-4 text-right">Sof Yalpi Foyda</th>
                  <th className="py-2.5 px-3 text-center">Marja %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {sortedProductStats.map((p, idx) => {
                  const margin = p.revenueUZS > 0 ? (p.grossProfitUZS / p.revenueUZS) * 100 : 0;
                  return (
                    <tr key={p.productId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 text-slate-400 font-sans">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-sans">
                        <div className="font-bold text-slate-900 dark:text-white leading-tight">
                          {p.productName}
                        </div>
                        {p.sku && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {p.sku}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-white">
                        {p.totalQty} dona
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-900 dark:text-white">
                        <div>{formatNumberWithSpaces(p.revenueUZS)} so&apos;m</div>
                        <div className="text-[10px] text-slate-400">${formatUSDNumber(p.revenueUZS / exchangeRate)}</div>
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-500">
                        <div>{formatNumberWithSpaces(p.costUZS)} so&apos;m</div>
                        <div className="text-[10px] text-slate-400">${formatUSDNumber(p.costUZS / exchangeRate)}</div>
                      </td>
                      <td className="py-2.5 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                        <div>+{formatNumberWithSpaces(p.grossProfitUZS)} so&apos;m</div>
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-300">+${formatUSDNumber(p.grossProfitUZS / exchangeRate)}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                          margin >= 40 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                            : margin >= 20 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {margin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Technician Efficiency */}
      {activeSubTab === 'technicians' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <HardHat className="w-4 h-4 text-purple-500" />
              Montaj Ustalari Samaradorligi va Daromadi
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-bold text-[10px] text-slate-500 tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">№</th>
                  <th className="py-2.5 px-4">Usta F.I.Sh.</th>
                  <th className="py-2.5 px-4">Lavozim / Roli</th>
                  <th className="py-2.5 px-3 text-center">Bajarilgan Obyektlar</th>
                  <th className="py-2.5 px-4 text-right">Kompaniyaga Keltirgan Tushumi</th>
                  <th className="py-2.5 px-4 text-right">Ustaga To&apos;langan Ish Haqi</th>
                  <th className="py-2.5 px-4 text-right">Kompaniyada Qolgan Sof Foyda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {pnlData.technicianStats.map((t, idx) => {
                  const companyKept = Math.max(0, t.salesSumUZS - t.wageSumUZS);
                  return (
                    <tr key={t.technicianId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-400 font-sans">{idx + 1}</td>
                      <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-white">
                        {t.technicianName}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-500">
                        {t.role}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-purple-600 dark:text-purple-400">
                        {t.jobsCount} ta obyekt
                      </td>
                      <td className="py-3 px-4 text-right text-slate-900 dark:text-white">
                        <div>{formatNumberWithSpaces(t.salesSumUZS)} so&apos;m</div>
                        <div className="text-[10px] text-slate-400">${formatUSDNumber(t.salesSumUZS / exchangeRate)}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-600 dark:text-amber-400">
                        <div>{formatNumberWithSpaces(t.wageSumUZS)} so&apos;m</div>
                        <div className="text-[10px] text-amber-700 dark:text-amber-300">${formatUSDNumber(t.wageSumUSD)}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                        <div>+{formatNumberWithSpaces(companyKept)} so&apos;m</div>
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-300">+${formatUSDNumber(companyKept / exchangeRate)}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Cash Flow Breakdown */}
      {activeSubTab === 'cash_flow' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
              <span>Naqd So&apos;m Tushumlari</span>
              <Wallet className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {formatNumberWithSpaces(pnlData.cashFlow.cashUZS)} so&apos;m
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              ≈ ${formatUSDNumber(pnlData.cashFlow.cashUZS / exchangeRate)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
              <span>Karta / Uzcard / Humo</span>
              <CreditCard className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-2 text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {formatNumberWithSpaces(pnlData.cashFlow.cardUZS)} so&apos;m
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              ≈ ${formatUSDNumber(pnlData.cashFlow.cardUZS / exchangeRate)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
              <span>Nasiya / Qarzga Ketgan</span>
              <TrendingDown className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-2 text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {formatNumberWithSpaces(pnlData.cashFlow.debtUZS)} so&apos;m
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              ≈ ${formatUSDNumber(pnlData.cashFlow.debtUZS / exchangeRate)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
              <span>Keshbekdan To&apos;langan</span>
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>
            <div className="mt-2 text-xl font-black text-purple-600 dark:text-purple-400 font-mono">
              {formatNumberWithSpaces(pnlData.cashFlow.cashbackUsedUZS)} so&apos;m
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              ≈ ${formatUSDNumber(pnlData.cashFlow.cashbackUsedUZS / exchangeRate)}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: Sales History Screen */}
      {activeSubTab === 'sales_history' && (
        <div className="-mx-6 -my-6">
          <SalesHistoryScreen
            receipts={filteredReceipts}
            products={products}
            customers={customers}
            employees={employees}
            exchangeRate={exchangeRate}
            baseCurrency={baseCurrency}
            currentUser={currentUser}
            onReturnReceipt={onReturnReceipt || (() => {})}
            onSaveEditReceipt={onSaveEditReceipt || (() => {})}
          />
        </div>
      )}
    </div>
  );
};
