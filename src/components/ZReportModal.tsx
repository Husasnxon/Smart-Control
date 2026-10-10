'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { SaleReceipt, Expense, Currency, ZReport } from '../types';
import { formatNumberWithSpaces, formatUSDNumber, isTodayDate } from '../utils/formatters';
import { 
  getTelegramSettings, 
  sendTelegramMessage, 
  generateDailySalesReport 
} from '../utils/telegram';
import { printRawHtmlInIframe } from '../utils/thermalPrinter';
import { 
  X, 
  Printer, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Coins, 
  DollarSign, 
  CreditCard, 
  BookOpen, 
  TrendingDown, 
  RefreshCw,
  Lock
} from 'lucide-react';

interface ZReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipts: SaleReceipt[];
  expenses: Expense[];
  exchangeRate?: number;
  baseCurrency?: Currency;
  cashierName?: string;
  branchName?: string;
  onSaveZReport?: (report: ZReport) => void;
}

export const ZReportModal: React.FC<ZReportModalProps> = ({
  isOpen,
  onClose,
  receipts,
  expenses,
  exchangeRate = 12850,
  baseCurrency = 'UZS',
  cashierName = 'Farrux A.',
  branchName = 'Chilonzor-1 Filiali',
  onSaveZReport
}) => {
  const todayKey = new Date().toISOString().split('T')[0];
  const nowDisplay = new Date().toLocaleString('uz-UZ', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  // Today's receipts & expenses
  const todayReceipts = useMemo(() => {
    return receipts.filter(r => isTodayDate(r.createdAt));
  }, [receipts]);

  const todayExpenses = useMemo(() => {
    return expenses.filter(e => isTodayDate(e.createdAt));
  }, [expenses]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalSales = 0;
    let cashUZS = 0;
    let cardUZS = 0;
    let cashUSD = 0;
    let debtUZS = 0;
    let cashbackUsedUZS = 0;

    todayReceipts.forEach(r => {
      totalSales += r.totalAmount;
      if (r.payments) {
        cashUZS += r.payments.cash || 0;
        cardUZS += r.payments.card || 0;
        cashUSD += r.payments.cashUSD || 0;
        debtUZS += r.payments.debt || 0;
        cashbackUsedUZS += r.payments.cashbackUsed || 0;
      }
    });

    const expensesTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const cashUSDInUZS = cashUSD * exchangeRate;
    const expectedCashInDrawer = (cashUZS + cashUSDInUZS) - expensesTotal;

    return {
      totalSales,
      totalSalesUSD: totalSales / exchangeRate,
      receiptsCount: todayReceipts.length,
      cashUZS,
      cardUZS,
      cashUSD,
      cashUSDInUZS,
      debtUZS,
      cashbackUsedUZS,
      expensesTotal,
      expectedCashInDrawer: Math.max(0, expectedCashInDrawer)
    };
  }, [todayReceipts, todayExpenses, exchangeRate]);

  // Actual counted cash in drawer input
  const [actualCashInput, setActualCashInput] = useState<string>(stats.expectedCashInDrawer.toString());
  const actualCash = Number(actualCashInput) || 0;
  const difference = actualCash - stats.expectedCashInDrawer;

  // Notes
  const [notes, setNotes] = useState('');

  // Telegram dispatch state
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Closed success flag
  const [isShiftClosed, setIsShiftClosed] = useState(false);

  // Escape key to close modal
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

  // Send to Telegram
  const handleSendTelegram = async () => {
    const tgSettings = getTelegramSettings();
    if (!tgSettings.botToken || !tgSettings.chatId) {
      setTelegramStatus({
        success: false,
        message: 'Telegram sozlamalari ulanmagan! "Telegram & Sozlamalar" bo\'limida Bot Token va Chat ID ni kiriting.'
      });
      return;
    }

    setIsSendingTelegram(true);
    setTelegramStatus(null);

    const reportHtml = generateDailySalesReport(
      receipts,
      expenses,
      exchangeRate,
      tgSettings.storeName || 'SMART CONTROL',
      branchName
    );

    const res = await sendTelegramMessage(tgSettings.botToken, tgSettings.chatId, reportHtml);
    setIsSendingTelegram(false);
    setTelegramStatus({
      success: res.success,
      message: res.message
    });
  };

  // Thermal Print Handler (Isolated 58mm / 80mm)
  const handlePrintZReport = () => {
    const is58 = true;
    const paperWidthPx = is58 ? '48mm' : '72mm';
    const zHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Z-Hisobot: ${nowDisplay}</title>
          <style>
            @page { size: auto; margin: 0; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            html, body {
              width: ${paperWidthPx};
              max-width: ${paperWidthPx};
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
          <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 4px;">
            <div style="font-weight: 900; font-size: 14px;">*** Z-HISOBOT ***</div>
            <div style="font-weight: bold; font-size: 11px;">${branchName}</div>
            <div style="font-size: 9px;">SMART CONTROL XAVFSIZLIK &amp; TARMOQ</div>
          </div>
          <div style="border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 4px; font-size: 10px;">
            <div style="display:flex;justify-content:space-between;"><span>Sana/Vaqt:</span><span>${nowDisplay}</span></div>
            <div style="display:flex;justify-content:space-between;"><span>Kassir:</span><span>${cashierName}</span></div>
            <div style="display:flex;justify-content:space-between;"><span>Cheklar soni:</span><span>${stats.receiptsCount} ta</span></div>
          </div>
          <div style="border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 4px;">
            <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:11.5px;">
              <span>JAMI SAVDO:</span>
              <span>${formatNumberWithSpaces(stats.totalSales)} UZS</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9.5px;"><span>Naqd (so'm):</span><span>${formatNumberWithSpaces(stats.cashUZS)}</span></div>
            <div style="display:flex;justify-content:space-between;font-size:9.5px;"><span>Karta (Humo/Uzcard):</span><span>${formatNumberWithSpaces(stats.cardUZS)}</span></div>
            <div style="display:flex;justify-content:space-between;font-size:9.5px;"><span>Naqd ($ USD):</span><span>$${formatUSDNumber(stats.cashUSD)}</span></div>
            <div style="display:flex;justify-content:space-between;font-size:9.5px;"><span>Nasiya (Qarz):</span><span>${formatNumberWithSpaces(stats.debtUZS)}</span></div>
            <div style="display:flex;justify-content:space-between;font-size:9.5px;"><span>Sarflangan cashback:</span><span>${formatNumberWithSpaces(stats.cashbackUsedUZS)}</span></div>
          </div>
          <div style="border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 4px; font-size: 10px;">
            <div style="display:flex;justify-content:space-between;"><span>Chiqim/Xarajat:</span><span>-${formatNumberWithSpaces(stats.expensesTotal)} UZS</span></div>
            <div style="display:flex;justify-content:space-between;font-weight:bold;"><span>Kutilgan Naqd:</span><span>${formatNumberWithSpaces(stats.expectedCashInDrawer)} UZS</span></div>
            <div style="display:flex;justify-content:space-between;font-weight:bold;"><span>Faktik Naqd:</span><span>${formatNumberWithSpaces(actualCash)} UZS</span></div>
            <div style="display:flex;justify-content:space-between;font-size:9.5px;"><span>Tafovut:</span><span>${formatNumberWithSpaces(difference)} UZS</span></div>
          </div>
          <div style="font-size: 9px; padding-top: 4px;">
            <div style="margin-bottom: 8px;">Kassir imzosi: ________________</div>
            <div style="margin-bottom: 8px;">Menejer imzosi: _______________</div>
            <div style="text-align: center; font-weight: bold; margin-top: 5px;">*** SMENA YOPILDI ***</div>
          </div>
        </body>
      </html>
    `;
    printRawHtmlInIframe(zHtml);
  };

  // Close shift, send to Telegram automatically and archive
  const handleConfirmCloseShift = async () => {
    let sentTelegram = false;
    const tgSettings = getTelegramSettings();

    // Avtomatik ravishda Telegramga hisobot yuborish
    if (tgSettings.botToken && tgSettings.chatId) {
      try {
        const reportHtml = generateDailySalesReport(
          receipts,
          expenses,
          exchangeRate,
          tgSettings.storeName || 'SMART CONTROL',
          branchName
        );
        const res = await sendTelegramMessage(tgSettings.botToken, tgSettings.chatId, reportHtml);
        sentTelegram = res.success;
        if (res.success) {
          setTelegramStatus({ success: true, message: 'Z-Hisobot Telegramga avtomatik yuborildi!' });
        }
      } catch (err) {
        console.error('Auto Telegram send on Z-Report error', err);
      }
    }

    const report: ZReport = {
      id: `z-rep-${Date.now()}`,
      reportNumber: `Z-${Date.now().toString().slice(-4)}`,
      closedAt: nowDisplay,
      cashierName,
      branchName,
      receiptsCount: stats.receiptsCount,
      totalSalesUZS: stats.totalSales,
      totalSalesUSD: stats.totalSalesUSD,
      cashUZS: stats.cashUZS,
      cardUZS: stats.cardUZS,
      cashUSD: stats.cashUSD,
      debtUZS: stats.debtUZS,
      cashbackUsedUZS: stats.cashbackUsedUZS,
      expensesUZS: stats.expensesTotal,
      expectedCashUZS: stats.expectedCashInDrawer,
      actualCashUZS: actualCash,
      differenceUZS: difference,
      sentToTelegram: sentTelegram,
      notes: notes.trim() || undefined
    };

    // Save to local storage archive
    try {
      const existing = localStorage.getItem('sc_z_reports');
      const list = existing ? JSON.parse(existing) : [];
      list.unshift(report);
      localStorage.setItem('sc_z_reports', JSON.stringify(list));
      localStorage.setItem('sc_today_z_closed_date', todayKey);
    } catch (e) {
      console.error('Failed to save z-report to localStorage', e);
    }

    if (onSaveZReport) {
      onSaveZReport(report);
    }

    setIsShiftClosed(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="no-print print:hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-sm">
              Z
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-wide">
                  Z-Hisobot: Smenani Yopish
                </h3>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Kun Yopilishi
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kassa tushumlarini tekshirish, naqd pulni inkassatsiya qilish va hisobotni yuborish
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          
          {/* Shift Successful Closure Banner */}
          {isShiftClosed ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-6 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
              <h4 className="text-lg font-black text-emerald-900 dark:text-emerald-200">
                Smena Muvaffaqiyatli Yopildi!
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-md mx-auto leading-relaxed">
                Z-Hisobot arxivlandi. Kassadagi barcha hisob-kitoblar yakunlandi va tizim xotirasiga muhrlandi.
              </p>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handlePrintZReport}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Kvitansiyani Chop Etish</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition"
                >
                  Oynani Yopish
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Meta strip: Date, Cashier, Branch */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Sana va Vaqt:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{nowDisplay}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Mas&apos;ul Kassir:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{cashierName}</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 block font-medium">Filial:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{branchName}</span>
                </div>
              </div>

              {/* Total Sales Big Banner */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-850 p-4 sm:p-5 rounded-2xl text-white shadow-md border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Bugungi Jami Kassa Savdosi
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                    {stats.receiptsCount} ta chek
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between flex-wrap gap-2">
                  <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                    {formatNumberWithSpaces(stats.totalSales)} <span className="text-sm font-bold text-slate-300">so&apos;m</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-cyan-400">
                    ≈ ${formatUSDNumber(stats.totalSalesUSD)} USD
                  </div>
                </div>
              </div>

              {/* Breakdown of Payments Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  To&apos;lov Turlari Bo&apos;yicha Taqsimot
                </span>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                      <Coins className="w-3.5 h-3.5 text-emerald-500" /> Naqd so&apos;m:
                    </span>
                    <strong className="font-mono text-slate-900 dark:text-white">
                      {formatNumberWithSpaces(stats.cashUZS)}
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                      <CreditCard className="w-3.5 h-3.5 text-blue-500" /> Karta (Humo/Uz):
                    </span>
                    <strong className="font-mono text-slate-900 dark:text-white">
                      {formatNumberWithSpaces(stats.cardUZS)}
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                      <DollarSign className="w-3.5 h-3.5 text-cyan-500" /> Naqd ($ USD):
                    </span>
                    <strong className="font-mono text-cyan-600 dark:text-cyan-400">
                      ${formatUSDNumber(stats.cashUSD)}
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                      <BookOpen className="w-3.5 h-3.5 text-amber-500" /> Nasiya (Qarz):
                    </span>
                    <strong className="font-mono text-amber-600 dark:text-amber-400">
                      {formatNumberWithSpaces(stats.debtUZS)}
                    </strong>
                  </div>
                </div>

                {/* Expenses strip */}
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 flex items-center justify-between text-xs">
                  <span className="text-rose-800 dark:text-rose-300 font-bold flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-rose-600" /> Kunlik Xarajatlar (Chiqim):
                  </span>
                  <strong className="font-mono text-rose-600 dark:text-rose-400">
                    - {formatNumberWithSpaces(stats.expensesTotal)} so&apos;m
                  </strong>
                </div>
              </div>

              {/* DRAWER CASH RECONCILIATION & COUNTING */}
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-amber-600" />
                    Kassadagi Naqd Pulni Sanash (Inkassatsiya)
                  </span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400">
                    Kutilayotgan: <strong>{formatNumberWithSpaces(stats.expectedCashInDrawer)} so&apos;m</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kassadagi Haqiqiy Naqd Pul (so&apos;mda):
                    </label>
                    <input
                      type="number"
                      value={actualCashInput}
                      onChange={(e) => setActualCashInput(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-xl px-3 py-2 text-sm font-black font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>

                  <div>
                    <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kassa Tafovuti:
                    </span>
                    <div className={`p-2 rounded-xl text-xs font-bold font-mono flex items-center justify-between ${
                      difference === 0
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : difference > 0
                        ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      <span>
                        {difference === 0 ? '🟢 To\'liq Mos' : difference > 0 ? '🟡 Ortiqcha' : '🔴 Kamomad'}
                      </span>
                      <span>
                        {difference > 0 ? `+${formatNumberWithSpaces(difference)}` : formatNumberWithSpaces(difference)} so&apos;m
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes input */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Smena bo&apos;yicha qo&apos;shimcha izoh yoki tafsilot (ixtiyoriy):
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Inkassatsiyaga topshirildi, qoldiq 500 ming qoldirildi..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              {/* Telegram status message */}
              {telegramStatus && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  telegramStatus.success
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}>
                  {telegramStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>{telegramStatus.message}</span>
                </div>
              )}
            </>
          )}

        </div>

        {/* MODAL FOOTER */}
        {!isShiftClosed && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintZReport}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-[0.98]"
                title="Termal printerda Z-hisobot slipini chiqarish"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Chop Etish</span>
              </button>

              <button
                type="button"
                onClick={handleSendTelegram}
                disabled={isSendingTelegram}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm transition active:scale-[0.98] disabled:opacity-50"
                title="Z-Hisobotni Telegram guruhga yoki xo'jayinga yuborish"
              >
                {isSendingTelegram ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Telegramga Yuborish</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                Bekor Qilish
              </button>

              <button
                type="button"
                onClick={handleConfirmCloseShift}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 transition active:scale-[0.98]"
              >
                <Lock className="w-4 h-4" />
                <span>Smenani Yopish (Tasdiqlash)</span>
              </button>
            </div>

          </div>
        )}

      </div>

      {/* HIDDEN THERMAL PRINTABLE CONTAINER FOR 58MM / 80MM PRINTERS */}
      <div className="printable-receipt hidden print:block bg-white text-black p-4 font-mono text-xs">
        <div className="max-w-[80mm] mx-auto text-center space-y-2">
          <div className="text-base font-black">*** Z-HISOBOT ***</div>
          <div className="font-bold text-sm">{branchName}</div>
          <div className="text-[10px]">SMART CONTROL XAVFSIZLIK &amp; TARMOQ</div>
          <div className="border-b border-black border-dashed my-2" />
          
          <div className="text-left space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Sana/Vaqt:</span>
              <span>{nowDisplay}</span>
            </div>
            <div className="flex justify-between">
              <span>Kassir:</span>
              <span>{cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span>Cheklar soni:</span>
              <span>{stats.receiptsCount} ta</span>
            </div>
          </div>

          <div className="border-b border-black border-dashed my-2" />

          <div className="text-left space-y-1 text-xs">
            <div className="flex justify-between font-bold text-sm">
              <span>JAMI SAVDO:</span>
              <span>{formatNumberWithSpaces(stats.totalSales)} UZS</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Naqd (so&apos;m):</span>
              <span>{formatNumberWithSpaces(stats.cashUZS)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Karta (Humo/Uzcard):</span>
              <span>{formatNumberWithSpaces(stats.cardUZS)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Naqd ($ USD):</span>
              <span>${formatUSDNumber(stats.cashUSD)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Nasiya (Qarz):</span>
              <span>{formatNumberWithSpaces(stats.debtUZS)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Sarflangan cashback:</span>
              <span>{formatNumberWithSpaces(stats.cashbackUsedUZS)}</span>
            </div>
          </div>

          <div className="border-b border-black border-dashed my-2" />

          <div className="text-left space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Chiqim / Xarajatlar:</span>
              <span>-{formatNumberWithSpaces(stats.expensesTotal)} UZS</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Kassada Kutilgan Naqd:</span>
              <span>{formatNumberWithSpaces(stats.expectedCashInDrawer)} UZS</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Kassadagi Faktik Naqd:</span>
              <span>{formatNumberWithSpaces(actualCash)} UZS</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Tafovut:</span>
              <span>{formatNumberWithSpaces(difference)} UZS</span>
            </div>
          </div>

          <div className="border-b border-black border-dashed my-3" />

          <div className="text-[10px] text-left pt-2 space-y-3">
            <div>Kassir imzosi: _____________________</div>
            <div>Menejer imzosi: _____________________</div>
            <div className="text-center pt-2">*** SMENA YOPILDI ***</div>
          </div>
        </div>
      </div>

    </div>
  );
};
