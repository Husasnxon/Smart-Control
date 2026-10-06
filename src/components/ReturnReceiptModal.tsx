'use client';

import React, { useState } from 'react';
import { SaleReceipt, ReturnedItemRecord, Customer } from '../types';
import { 
  X, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Banknote, 
  CreditCard, 
  Coins, 
  Barcode, 
  ShieldAlert,
  Info
} from 'lucide-react';

interface ReturnReceiptModalProps {
  receipt: SaleReceipt | null;
  onClose: () => void;
  onConfirmReturn: (
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
  exchangeRate: number;
}

export const ReturnReceiptModal: React.FC<ReturnReceiptModalProps> = ({
  receipt,
  onClose,
  onConfirmReturn,
  exchangeRate
}) => {
  if (!receipt) return null;

  // Track return quantities and selected serial numbers per cart item index
  // Key: itemIndex
  const [returnQtys, setReturnQtys] = useState<{ [itemIndex: number]: number }>(() => {
    const init: { [key: number]: number } = {};
    receipt.items.forEach((_, idx) => {
      init[idx] = 0;
    });
    return init;
  });

  const [selectedSerials, setSelectedSerials] = useState<{ [itemIndex: number]: string[] }>(() => {
    const init: { [key: number]: string[] } = {};
    receipt.items.forEach((_, idx) => {
      init[idx] = [];
    });
    return init;
  });

  const [refundMethod, setRefundMethod] = useState<'cash' | 'card' | 'debt_deduction'>('cash');
  const [reason, setReason] = useState<string>('Mijoz xohishi bilan');
  const [customReason, setCustomReason] = useState<string>('');

  // Calculate returnable quantity for each item
  const getReturnableQty = (itemIndex: number) => {
    const item = receipt.items[itemIndex];
    const alreadyReturned = item.returnedQuantity || 0;
    return Math.max(0, item.quantity - alreadyReturned);
  };

  // Get available serial numbers that haven't been returned yet
  const getAvailableSerials = (itemIndex: number) => {
    const item = receipt.items[itemIndex];
    const alreadyReturnedSerials = item.returnedSerialNumbers || [];
    return (item.selectedSerialNumbers || []).filter((s) => !alreadyReturnedSerials.includes(s));
  };

  // Handle Serial Number toggle for serialized items
  const handleToggleSerial = (itemIndex: number, sn: string) => {
    const current = selectedSerials[itemIndex] || [];
    let updated: string[];
    if (current.includes(sn)) {
      updated = current.filter((s) => s !== sn);
    } else {
      updated = [...current, sn];
    }

    setSelectedSerials((prev) => ({ ...prev, [itemIndex]: updated }));
    // For serialized items, return qty matches selected serial numbers
    setReturnQtys((prev) => ({ ...prev, [itemIndex]: updated.length }));
  };

  // Handle quantity change for non-serialized items
  const handleQtyChange = (itemIndex: number, newQty: number) => {
    const maxQty = getReturnableQty(itemIndex);
    const validQty = Math.max(0, Math.min(newQty, maxQty));
    setReturnQtys((prev) => ({ ...prev, [itemIndex]: validQty }));
  };

  // Compute totals
  let totalRefundAmount = 0;
  let totalItemsCount = 0;

  receipt.items.forEach((item, idx) => {
    const qty = returnQtys[idx] || 0;
    if (qty > 0) {
      totalItemsCount += qty;
      totalRefundAmount += qty * item.appliedPrice;
    }
  });

  const totalRefundAmountUSD = exchangeRate > 0 ? (totalRefundAmount / exchangeRate).toFixed(2) : '0';

  // Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (totalItemsCount === 0) {
      alert("Iltimos, qaytarish uchun kamida bitta tovar yoki seriya raqamini tanlang!");
      return;
    }

    const itemsToReturn = receipt.items
      .map((item, idx) => {
        const qty = returnQtys[idx] || 0;
        if (qty <= 0) return null;
        return {
          productId: item.product.id,
          productName: item.product.name,
          quantity: qty,
          serialNumbers: selectedSerials[idx] || [],
          unitPrice: item.appliedPrice,
          totalRefund: qty * item.appliedPrice
        };
      })
      .filter(Boolean) as {
        productId: string;
        productName: string;
        quantity: number;
        serialNumbers: string[];
        unitPrice: number;
        totalRefund: number;
      }[];

    const finalReason = customReason.trim() ? `${reason}: ${customReason.trim()}` : reason;

    onConfirmReturn(receipt.id, {
      itemsToReturn,
      refundMethod,
      reason: finalReason
    });

    onClose();
  };

  const quickReasons = [
    'Mijoz xohishi bilan',
    'Nosozlik / Brak (Kafolat)',
    'Noto\'g\'ri model berilgan',
    'Hajmi yoki parametri to\'g\'ri kelmadi',
    'Boshqa tovar bilan almashtirish'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Tovarlarni Qaytarish (Vozvrat)
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold">
                  {receipt.receiptNumber}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sana: {receipt.createdAt} &bull; Mijoz: {receipt.customer?.fullName || 'Standart Xaridor'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Instructions banner */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <span className="font-bold">Eslatma:</span> Qaytarilgan mahsulotlar avtomatik ravishda ombor qoldig&apos;iga qaytariladi. Agar tovar seriya raqamiga ega bo&apos;lsa, aynan qaytarilgan seriya raqami (S/N) omborga qaytadi.
            </div>
          </div>

          {/* Items Return Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              <span>Xarid qilingan tovarlar</span>
              <span>Qaytarish miqdori</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {receipt.items.map((item, idx) => {
                const returnable = getReturnableQty(idx);
                const isFullyReturned = returnable <= 0;
                const hasSN = item.product.hasSerialNumber && (item.selectedSerialNumbers?.length || 0) > 0;
                const availableSerials = getAvailableSerials(idx);
                const currentQty = returnQtys[idx] || 0;

                return (
                  <div key={idx} className={`p-4 transition ${isFullyReturned ? 'bg-slate-50/60 dark:bg-slate-900/40 opacity-60' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            {item.product.name}
                          </span>
                          {item.product.isService && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-semibold">
                              Xizmat
                            </span>
                          )}
                          {hasSN && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 font-semibold flex items-center gap-1">
                              <Barcode className="w-3 h-3" /> S/N mavjud
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>Sotilgan: <strong>{item.quantity} {item.product.unit}</strong></span>
                          <span>&bull;</span>
                          <span>Dona narxi: <strong>{item.appliedPrice.toLocaleString()} so&apos;m</strong></span>
                          {(item.returnedQuantity || 0) > 0 && (
                            <>
                              <span>&bull;</span>
                              <span className="text-rose-600 font-semibold">
                                Avval qaytarilgan: {item.returnedQuantity} {item.product.unit}
                              </span>
                            </>
                          )}
                          <span>&bull;</span>
                          <span className="text-emerald-600 font-semibold">
                            Qaytarsa bo&apos;ladigan: {returnable} {item.product.unit}
                          </span>
                        </div>

                        {/* Serial numbers checkboxes if product has serial numbers */}
                        {hasSN && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                              Qaytariladigan seriya raqamlarini (S/N) belgilang:
                            </span>
                            {availableSerials.length === 0 ? (
                              <span className="text-xs text-slate-400 italic">Barcha seriya raqamlari qaytarilgan</span>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {availableSerials.map((sn) => {
                                  const isSelected = (selectedSerials[idx] || []).includes(sn);
                                  return (
                                    <button
                                      type="button"
                                      key={sn}
                                      onClick={() => handleToggleSerial(idx, sn)}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition flex items-center gap-1.5 border ${
                                        isSelected 
                                          ? 'bg-rose-500 text-white border-rose-600 shadow-sm' 
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-400'
                                      }`}
                                    >
                                      <span>{sn}</span>
                                      {isSelected && <span className="font-bold">&times;</span>}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right controls: Quantity and amount */}
                      <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0">
                        {isFullyReturned ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-400">
                            To&apos;liq qaytarilgan
                          </span>
                        ) : hasSN ? (
                          <div className="text-right">
                            <span className="text-xs text-slate-500 block">Qaytarilmoqda:</span>
                            <span className="text-base font-extrabold text-rose-600 font-mono">
                              {currentQty} {item.product.unit}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => handleQtyChange(idx, currentQty - 1)}
                              disabled={currentQty <= 0}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 disabled:opacity-30 hover:bg-slate-200 transition"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={returnable}
                              value={currentQty === 0 ? '' : currentQty}
                              placeholder="0"
                              onChange={(e) => handleQtyChange(idx, parseInt(e.target.value) || 0)}
                              className="w-12 text-center bg-transparent font-bold font-mono text-sm text-slate-900 dark:text-white outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleQtyChange(idx, currentQty + 1)}
                              disabled={currentQty >= returnable}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 disabled:opacity-30 hover:bg-slate-200 transition"
                            >
                              +
                            </button>
                          </div>
                        )}

                        {currentQty > 0 && (
                          <div className="text-right font-mono text-xs font-bold text-rose-600">
                            +{(currentQty * item.appliedPrice).toLocaleString()} so&apos;m
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Refund Options & Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Refund Payout Method */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Pulni qaytarish usuli:
              </label>
              <div className="space-y-2">
                <label className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition ${refundMethod === 'cash' ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 text-cyan-900 dark:text-cyan-200 font-bold' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}>
                  <input
                    type="radio"
                    name="refundMethod"
                    value="cash"
                    checked={refundMethod === 'cash'}
                    onChange={() => setRefundMethod('cash')}
                    className="text-cyan-600"
                  />
                  <Banknote className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Kassadan Naqd pul qaytarish</span>
                </label>

                <label className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition ${refundMethod === 'card' ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 text-cyan-900 dark:text-cyan-200 font-bold' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}>
                  <input
                    type="radio"
                    name="refundMethod"
                    value="card"
                    checked={refundMethod === 'card'}
                    onChange={() => setRefundMethod('card')}
                    className="text-cyan-600"
                  />
                  <CreditCard className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Plastik kartaga qaytarish</span>
                </label>

                <label className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition ${refundMethod === 'debt_deduction' ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 text-cyan-900 dark:text-cyan-200 font-bold' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}>
                  <input
                    type="radio"
                    name="refundMethod"
                    value="debt_deduction"
                    checked={refundMethod === 'debt_deduction'}
                    onChange={() => setRefundMethod('debt_deduction')}
                    className="text-cyan-600"
                  />
                  <Coins className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Mijozning qarzidan ayirish / kamaytirish</span>
                </label>
              </div>
            </div>

            {/* Return Reason */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Qaytarish sababi:
              </label>

              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-rose-500"
              >
                {quickReasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Qo'shimcha izoh yoki sabab tafsiloti..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Refund Summary Box */}
          <div className="bg-rose-500/10 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-900/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs text-rose-700 dark:text-rose-300 font-medium block">
                Qaytariladigan umumiy miqdor:
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Tanlangan tovarlar soni: <strong>{totalItemsCount} ta</strong>
              </span>
            </div>

            <div className="text-right">
              <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
                {totalRefundAmount.toLocaleString()} so&apos;m
              </div>
              {exchangeRate > 0 && totalRefundAmount > 0 && (
                <div className="text-xs font-bold text-slate-500 font-mono">
                  ~ ${totalRefundAmountUSD} USD
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            Bekor qilish
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={totalItemsCount === 0}
            className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Vozvratni tasdiqlash ({totalRefundAmount.toLocaleString()} so&apos;m)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
