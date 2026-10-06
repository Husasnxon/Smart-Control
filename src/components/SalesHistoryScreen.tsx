'use client';

import React, { useState } from 'react';
import { SaleReceipt, Product, Customer, Employee, Currency } from '../types';
import { formatDualMoney, formatMoney } from '../utils/formatters';
import { 
  History, 
  Search, 
  Printer, 
  CheckCircle2, 
  WifiOff, 
  Filter, 
  Gift, 
  CreditCard,
  Banknote,
  Coins,
  HardHat,
  RotateCcw,
  Edit3,
  PackagePlus,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Barcode,
  Download
} from 'lucide-react';
import { exportSalesToExcel } from '../utils/excel';
import { ReceiptModal } from './ReceiptModal';
import { ReturnReceiptModal } from './ReturnReceiptModal';
import { EditReceiptModal } from './EditReceiptModal';

interface SalesHistoryScreenProps {
  receipts: SaleReceipt[];
  products: Product[];
  customers: Customer[];
  employees: Employee[];
  exchangeRate: number;
  baseCurrency?: Currency;
  currentUser?: Employee | null;
  onReturnReceipt: (
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
  onSaveEditReceipt: (
    receiptId: string,
    updatedReceipt: SaleReceipt,
    newItemsStockDelta: {
      productId: string;
      quantity: number;
      serialNumbers: string[];
    }[]
  ) => void;
}

export const SalesHistoryScreen: React.FC<SalesHistoryScreenProps> = ({
  receipts,
  products,
  customers,
  employees,
  exchangeRate,
  baseCurrency = 'UZS',
  currentUser,
  onReturnReceipt,
  onSaveEditReceipt
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'returned' | 'debt'>('all');

  // Modal states
  const [viewingReceipt, setViewingReceipt] = useState<SaleReceipt | null>(null);
  const [returningReceipt, setReturningReceipt] = useState<SaleReceipt | null>(null);
  const [editingReceipt, setEditingReceipt] = useState<SaleReceipt | null>(null);
  const [editInitialTab, setEditInitialTab] = useState<'add_items' | 'edit_details'>('add_items');

  // Handlers to open modals
  const handleOpenReturn = (receipt: SaleReceipt) => {
    setReturningReceipt(receipt);
  };

  const handleOpenEdit = (receipt: SaleReceipt, tab: 'add_items' | 'edit_details' = 'add_items') => {
    setEditInitialTab(tab);
    setEditingReceipt(receipt);
  };

  // Filter receipts
  const filtered = receipts.filter((r) => {
    // Status filter
    if (statusFilter === 'completed' && (r.status === 'returned' || r.status === 'partially_returned')) {
      return false;
    }
    if (statusFilter === 'returned' && r.status !== 'returned' && r.status !== 'partially_returned') {
      return false;
    }
    if (statusFilter === 'debt' && (!r.payments.debt || r.payments.debt <= 0)) {
      return false;
    }

    // Search query filter
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const matchesNumber = r.receiptNumber.toLowerCase().includes(query);
    const matchesCashier = r.cashierName.toLowerCase().includes(query);
    const matchesCustomer = r.customer && (
      r.customer.fullName.toLowerCase().includes(query) ||
      r.customer.phone.includes(query)
    );
    const matchesAddress = r.installationAddress?.toLowerCase().includes(query);
    const matchesItems = r.items.some(
      (it) =>
        it.product.name.toLowerCase().includes(query) ||
        it.product.barcode.includes(query) ||
        it.selectedSerialNumbers?.some((sn) => sn.toLowerCase().includes(query))
    );

    return matchesNumber || matchesCashier || matchesCustomer || matchesAddress || matchesItems;
  });

  // Calculate high-level financial stats
  const totalSalesGross = receipts.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalRefunds = receipts.reduce((sum, r) => sum + (r.totalRefunded || 0), 0);
  const totalNet = totalSalesGross - totalRefunds;
  const returnedCount = receipts.filter((r) => r.status === 'returned' || r.status === 'partially_returned').length;

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 bg-slate-50 dark:bg-slate-950 print:p-0 print:bg-white print:overflow-visible">
      {/* Background Screen Container */}
      <div className={`space-y-5 ${viewingReceipt ? 'no-print print:hidden' : ''}`}>
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-500" />
            Sotuvlar Tarixi, Cheklar va Vozvrat
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Jami {receipts.length} ta operatsiya amalga oshirilgan &bull; Har bir chekdan tovar qaytarish yoki yangi tovar qo&apos;shish mumkin
          </p>
        </div>

        {/* Search and Export */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Chek raqami, mijoz, tovar yoki S/N..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs focus:ring-2 focus:ring-cyan-500/40 text-slate-800 dark:text-slate-100 shadow-sm"
            />
          </div>

          <button
            type="button"
            onClick={() => exportSalesToExcel(filtered)}
            className="px-3.5 py-2 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition active:scale-[0.98] shrink-0"
            title="Sotuvlar tarixini Excel (.xlsx) faylga yuklab olish"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>Excel Eksport</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Jami Savdolar</span>
            <FileText className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-lg font-extrabold font-mono text-slate-900 dark:text-white mt-1">
            {formatDualMoney(totalSalesGross, baseCurrency, exchangeRate).primary}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 flex justify-between items-center">
            <span>{receipts.length} ta chek</span>
            <span className="font-mono text-slate-500">({formatDualMoney(totalSalesGross, baseCurrency, exchangeRate).secondary})</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-rose-500 text-xs font-semibold">
            <span>Jami Vozvrat (Qaytarilgan)</span>
            <RotateCcw className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-lg font-extrabold font-mono text-rose-600 dark:text-rose-400 mt-1">
            -{formatDualMoney(totalRefunds, baseCurrency, exchangeRate).primary}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 flex justify-between items-center">
            <span>{returnedCount} ta chekda</span>
            <span className="font-mono text-slate-500">({formatDualMoney(totalRefunds, baseCurrency, exchangeRate).secondary})</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 text-xs font-semibold">
            <span>Sof Savdo Tushumi</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {formatDualMoney(totalNet, baseCurrency, exchangeRate).primary}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 flex justify-between items-center">
            <span>Vozvrat chegirilgan sof</span>
            <span className="font-mono text-slate-500">({formatDualMoney(totalNet, baseCurrency, exchangeRate).secondary})</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-cyan-600 text-xs font-semibold">
            <span>Asosiy Valyuta</span>
            <DollarSign className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-lg font-extrabold font-mono text-cyan-600 dark:text-cyan-400 mt-1">
            {baseCurrency === 'USD' ? 'AQSH Dollari ($)' : "O'zbek so'mi (UZS)"}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Kurs: 1$ = {exchangeRate.toLocaleString()} so&apos;m
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
            statusFilter === 'all'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
          }`}
        >
          Barchasi ({receipts.length})
        </button>

        <button
          onClick={() => setStatusFilter('completed')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
            statusFilter === 'completed'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
          }`}
        >
          Faol Sotuvlar ({receipts.filter((r) => r.status !== 'returned' && r.status !== 'partially_returned').length})
        </button>

        <button
          onClick={() => setStatusFilter('returned')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            statusFilter === 'returned'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-800 hover:bg-rose-50'
          }`}
        >
          <RotateCcw className="w-3 h-3" />
          <span>Vozvratlar ({returnedCount})</span>
        </button>

        <button
          onClick={() => setStatusFilter('debt')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            statusFilter === 'debt'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-800 hover:bg-amber-50'
          }`}
        >
          <Coins className="w-3 h-3" />
          <span>Nasiya / Qarzli Cheklar ({receipts.filter((r) => (r.payments.debt || 0) > 0).length})</span>
        </button>
      </div>

      {/* Receipts Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Chek & Holat</th>
                <th className="py-3 px-4">Mijoz & Ustalar</th>
                <th className="py-3 px-4">Xarid Tovarlari</th>
                <th className="py-3 px-4 text-right">To&apos;lov Usuli</th>
                <th className="py-3 px-4 text-right">Jami & Sof Summa</th>
                <th className="py-3 px-4 text-right">Cashback</th>
                <th className="py-3 px-4 text-center">Tarmoq</th>
                <th className="py-3 px-4 text-center">Tezkor Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Mos keluvchi savdo cheklari topilmadi
                  </td>
                </tr>
              ) : (
                filtered.map((receipt) => {
                  const isFullyReturned = receipt.status === 'returned';
                  const isPartiallyReturned = receipt.status === 'partially_returned';
                  const isEdited = receipt.status === 'edited';
                  const netAmount = receipt.totalAmount - (receipt.totalRefunded || 0);

                  return (
                    <tr 
                      key={receipt.id} 
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                        isFullyReturned ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Receipt number, date, status */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {receipt.receiptNumber}
                          </span>
                          {/* Status Badge */}
                          {isFullyReturned ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                              Vozvrat
                            </span>
                          ) : isPartiallyReturned ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                              Qisman qaytgan
                            </span>
                          ) : isEdited ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                              Tahrirlangan
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                              Yakunlangan
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {receipt.createdAt} &bull; {receipt.cashierName}
                        </span>

                        {receipt.updatedAt && (
                          <span className="text-[9px] text-blue-500 block">
                            Yangilandi: {receipt.updatedAt}
                          </span>
                        )}
                      </td>

                      {/* Customer & Technicians */}
                      <td className="py-3 px-4">
                        {receipt.customer ? (
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                              {receipt.customer.fullName}
                            </span>
                            <span className="text-[10px] text-purple-600 font-medium">
                              {receipt.customer.tier} ({receipt.customer.phone})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal">Standart Xaridor</span>
                        )}

                        {receipt.installationAddress && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block line-clamp-1 mt-0.5">
                            📍 {receipt.installationAddress}
                          </span>
                        )}

                        {receipt.technicians && receipt.technicians.length > 0 ? (
                          <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-1">
                            <HardHat className="w-3 h-3 shrink-0" />
                            <span>
                              {receipt.technicians.length} ta usta: {receipt.technicians.map((t) => t.fullName.split(' ')[0]).join(', ')}
                              <strong className="ml-1 text-emerald-600 font-mono">(${receipt.technicians.reduce((s, t) => s + t.wageUSD, 0)})</strong>
                            </span>
                          </div>
                        ) : receipt.technicianName ? (
                          <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-1">
                            <HardHat className="w-3 h-3 shrink-0" />
                            <span>Usta: {receipt.technicianName}</span>
                          </div>
                        ) : null}
                      </td>

                      {/* Items */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-700 dark:text-slate-300 block">
                          {receipt.items.length} xil tovar
                        </span>
                        <span className="text-[10px] text-slate-400 line-clamp-1">
                          {receipt.items.map((it) => `${it.product.name} (${it.quantity})`).join(', ')}
                        </span>
                        {/* Serial Numbers Badge preview */}
                        {receipt.items.some((it) => it.selectedSerialNumbers && it.selectedSerialNumbers.length > 0) && (
                          <div className="flex items-center gap-1 text-[9px] text-cyan-600 font-mono mt-0.5">
                            <Barcode className="w-2.5 h-2.5" />
                            <span>S/N biriktirilgan</span>
                          </div>
                        )}
                      </td>

                      {/* Payments */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex flex-col items-end gap-0.5 text-[10px]">
                          {receipt.payments.cashUSD && receipt.payments.cashUSD > 0 && (
                            <span className="text-cyan-600 font-bold font-mono">
                              ${receipt.payments.cashUSD}
                            </span>
                          )}
                          {receipt.payments.cash > 0 && (
                            <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                              <Banknote className="w-3 h-3 text-emerald-500" />
                              {receipt.payments.cash.toLocaleString()}
                            </span>
                          )}
                          {receipt.payments.card > 0 && (
                            <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                              <CreditCard className="w-3 h-3 text-blue-500" />
                              {receipt.payments.card.toLocaleString()}
                            </span>
                          )}
                          {receipt.payments.debt > 0 && (
                            <span className="text-amber-600 font-bold flex items-center gap-1">
                              <Coins className="w-3 h-3" />
                              Qarz: {receipt.payments.debt.toLocaleString()}
                            </span>
                          )}
                          {receipt.payments.cashbackUsed > 0 && (
                            <span className="text-purple-600 font-bold flex items-center gap-1">
                              <Gift className="w-3 h-3" />
                              -{receipt.payments.cashbackUsed.toLocaleString()} cb
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Totals & Refunds */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">
                          {formatDualMoney(receipt.totalAmount, baseCurrency, exchangeRate).primary}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {formatDualMoney(receipt.totalAmount, baseCurrency, exchangeRate).secondary}
                        </div>
                        {receipt.totalRefunded && receipt.totalRefunded > 0 ? (
                          <div className="text-[10px] font-bold text-rose-600 font-mono mt-0.5">
                            Vozvrat: -{formatMoney(receipt.totalRefunded, baseCurrency, exchangeRate)}
                            <div className="text-[10px] text-emerald-600 font-bold">
                              Sof: {formatMoney(netAmount, baseCurrency, exchangeRate)}
                            </div>
                          </div>
                        ) : null}
                      </td>

                      {/* Cashback */}
                      <td className="py-3 px-4 text-right font-mono text-purple-600 font-bold">
                        {receipt.cashbackEarned > 0 ? `+${receipt.cashbackEarned.toLocaleString()}` : '—'}
                      </td>

                      {/* Sync status */}
                      <td className="py-3 px-4 text-center">
                        {receipt.isOffline ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            <WifiOff className="w-2.5 h-2.5" />
                            Oflayn
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Bulutda
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1. View & Print */}
                          <button
                            onClick={() => setViewingReceipt(receipt)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                            title="Chekni ko'rish va chop etish"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Vozvrat (Return) */}
                          {currentUser?.permissions?.canReturnReceipts !== false && (
                            <button
                              onClick={() => handleOpenReturn(receipt)}
                              disabled={isFullyReturned}
                              className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 transition disabled:opacity-30 disabled:cursor-not-allowed border border-rose-200 dark:border-rose-900/50"
                              title={isFullyReturned ? "Ushbu chek to'liq qaytarilgan" : "Tovarni qaytarish (Vozvrat)"}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* 3. Add more items to sale */}
                          {currentUser?.permissions?.canEditReceipts !== false && (
                            <button
                              onClick={() => handleOpenEdit(receipt, 'add_items')}
                              disabled={isFullyReturned}
                              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 transition disabled:opacity-30 disabled:cursor-not-allowed border border-emerald-200 dark:border-emerald-900/50"
                              title="Sotuvga yana tovar yoki xizmat qo'shish"
                            >
                              <PackagePlus className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* 4. Edit Receipt Details */}
                          {currentUser?.permissions?.canEditReceipts !== false && (
                            <button
                              onClick={() => handleOpenEdit(receipt, 'edit_details')}
                              className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-600 dark:text-cyan-300 transition border border-cyan-200 dark:border-cyan-900/50"
                              title="Chek ma'lumotlarini o'zgartirish (Mijoz, Manzil, Ustalar)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
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
      </div>

      {/* Modal 1: Receipt Print/View Modal */}
      <ReceiptModal
        receipt={viewingReceipt}
        onClose={() => setViewingReceipt(null)}
        onOpenReturn={(r) => handleOpenReturn(r)}
        onOpenEdit={(r) => handleOpenEdit(r, 'add_items')}
      />

      {/* Modal 2: Return (Vozvrat) Modal */}
      <ReturnReceiptModal
        receipt={returningReceipt}
        onClose={() => setReturningReceipt(null)}
        onConfirmReturn={onReturnReceipt}
        exchangeRate={exchangeRate}
      />

      {/* Modal 3: Edit & Add Items Modal */}
      <EditReceiptModal
        receipt={editingReceipt}
        products={products}
        customers={customers}
        employees={employees}
        exchangeRate={exchangeRate}
        onClose={() => setEditingReceipt(null)}
        onSaveEdit={onSaveEditReceipt}
      />
    </div>
  );
};
