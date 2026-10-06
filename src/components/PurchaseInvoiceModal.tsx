'use client';

import React from 'react';
import { PurchaseInvoice } from '../types';
import { formatNumberWithSpaces, formatUSDNumber } from '../utils/formatters';
import { 
  X, 
  Printer, 
  Truck, 
  Calendar, 
  Building2, 
  Phone, 
  Barcode, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  Check
} from 'lucide-react';

interface PurchaseInvoiceModalProps {
  invoice: PurchaseInvoice | null;
  onClose: () => void;
}

export const PurchaseInvoiceModal: React.FC<PurchaseInvoiceModalProps> = ({
  invoice,
  onClose
}) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:rounded-none">
        {/* Modal Top Actions */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 print:hidden">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-cyan-500" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Kirim Nakladnoy {invoice.invoiceNumber}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              invoice.status === 'received'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
            }`}>
              {invoice.status === 'received' ? '✓ Qabul qilindi & Omborda' : 'Kutilmoqda'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Chop etish</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-900 dark:text-slate-100 print:text-black">
          {/* Header */}
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-wide text-slate-900 dark:text-white">SMART CONTROL</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                  Omborga Kirim (Приход)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Xavfsizlik & Tarmoq Tizimlari Do&apos;koni va Ombori</p>
              <p className="text-xs text-slate-500">Ombor: <strong>{invoice.warehouseName}</strong></p>
            </div>

            <div className="text-left sm:text-right font-mono text-xs">
              <div className="text-base font-black text-slate-900 dark:text-white">{invoice.invoiceNumber}</div>
              <div className="text-slate-500 flex items-center sm:justify-end gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5" /> {invoice.createdAt}
              </div>
              {invoice.supplierInvoiceNumber && (
                <div className="text-slate-500 mt-0.5">
                  Faktura №: <strong>{invoice.supplierInvoiceNumber}</strong>
                </div>
              )}
              <div className="text-[11px] text-cyan-600 font-semibold mt-0.5">
                Kurs: 1$ = {formatNumberWithSpaces(invoice.exchangeRate)} so&apos;m
              </div>
            </div>
          </div>

          {/* Supplier Info */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Yetkazib beruvchi (Ta&apos;minotchi)</span>
              <span className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-4 h-4 text-cyan-600" />
                {invoice.supplierName}
              </span>
              {invoice.supplierPhone && (
                <span className="text-slate-500 flex items-center gap-1.5 mt-1 font-mono text-[11px]">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {invoice.supplierPhone}
                </span>
              )}
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">To&apos;lov & Mas&apos;ul</span>
              <div className="mt-1 flex items-center sm:justify-end gap-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  invoice.paymentStatus === 'paid'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                    : invoice.paymentStatus === 'partial'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                }`}>
                  {invoice.paymentStatus === 'paid' ? "To'langan" : invoice.paymentStatus === 'partial' ? "Qisman to'langan" : "Nasiya (Qarz)"}
                </span>
                {invoice.paymentMethod && (
                  <span className="text-xs text-slate-500 uppercase font-semibold">({invoice.paymentMethod})</span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Qabul qildi: <strong>{invoice.receivedBy}</strong>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">№</th>
                  <th className="py-2.5 px-3">Mahsulot Nomi</th>
                  <th className="py-2.5 px-3 text-center">Miqdor</th>
                  <th className="py-2.5 px-3 text-right">Kirim Tannarxi ($)</th>
                  <th className="py-2.5 px-3 text-right">Kirim Tannarxi (so&apos;m)</th>
                  <th className="py-2.5 px-3 text-right">Jami Summa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 text-slate-400 font-sans">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-bold text-slate-900 dark:text-white leading-tight">
                        {item.productName}
                      </div>
                      {item.sku && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Artikul: {item.sku}
                        </div>
                      )}

                      {/* Serial Numbers Badge */}
                      {item.hasSerialNumber && item.serialNumbers && item.serialNumbers.length > 0 && (
                        <div className="mt-1.5 p-1.5 rounded-lg bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-200/80 dark:border-cyan-800/60 font-mono text-[10px]">
                          <span className="font-bold text-cyan-800 dark:text-cyan-300 flex items-center gap-1 mb-0.5">
                            <Barcode className="w-3 h-3 text-cyan-600" />
                            Kirim qilingan S/N ({item.serialNumbers.length} ta):
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {item.serialNumbers.map((sn, sIdx) => (
                              <span key={sIdx} className="bg-white dark:bg-slate-900 px-1.5 py-0.2 rounded border border-cyan-200 text-slate-700 dark:text-slate-300">
                                {sn}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right text-cyan-600 dark:text-cyan-400 font-bold">
                      ${formatUSDNumber(item.costPriceUSD || (item.costPrice / invoice.exchangeRate))}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                      {formatNumberWithSpaces(item.costPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 dark:text-white">
                      {formatNumberWithSpaces(item.totalCost)} so&apos;m
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-mono">
            <div className="text-xs text-slate-500 font-sans">
              <span>Jami pozitsiyalar: <strong>{invoice.items.length}</strong></span> &bull; <span>Jami miqdor: <strong>{invoice.totalQuantity} dona</strong></span>
              {invoice.notes && (
                <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 italic">
                  Izoh: {invoice.notes}
                </div>
              )}
            </div>

            <div className="text-right space-y-1">
              <div className="text-xs text-slate-400">Jami Faktura Summasi:</div>
              {invoice.currency === 'UZS' ? (
                <>
                  <div className="text-xl font-black text-cyan-600 dark:text-cyan-400">
                    {formatNumberWithSpaces(invoice.totalAmount)} so&apos;m
                  </div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    ≈ ${formatUSDNumber(invoice.totalAmountUSD || (invoice.totalAmount / invoice.exchangeRate))} USD
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xl font-black text-cyan-600 dark:text-cyan-400">
                    ${formatUSDNumber(invoice.totalAmountUSD || (invoice.totalAmount / invoice.exchangeRate))} USD
                  </div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    ≈ {formatNumberWithSpaces(invoice.totalAmount)} so&apos;m
                  </div>
                </>
              )}

              {/* Paid & Debt breakdown */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-end gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>To&apos;langan:</span>
                  <span>
                    {invoice.currency === 'USD' 
                      ? `$${formatUSDNumber(invoice.paidAmountUSD || 0)}` 
                      : `${formatNumberWithSpaces(invoice.paidAmount || 0)} so'm`}
                  </span>
                </div>
                {(invoice.debtAmount || 0) > 0 && (
                  <div className="flex items-center justify-end gap-2 text-rose-600 dark:text-rose-400 font-bold mt-0.5">
                    <span>Qolgan Qarz:</span>
                    <span>
                      {invoice.currency === 'USD' 
                        ? `$${formatUSDNumber(invoice.debtAmountUSD || 0)}` 
                        : `${formatNumberWithSpaces(invoice.debtAmount || 0)} so'm`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attached Payment History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                Ushbu Nakladnoyga Biriktirilgan To&apos;lovlar Tarixi ({invoice.payments.length} ta):
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] text-slate-500 uppercase font-bold border-b border-emerald-200 dark:border-emerald-900/40">
                    <tr>
                      <th className="py-1 px-2">Sana</th>
                      <th className="py-1 px-2">To&apos;lov Usuli</th>
                      <th className="py-1 px-2 text-right">Summa ($)</th>
                      <th className="py-1 px-2 text-right">Summa (so&apos;m)</th>
                      <th className="py-1 px-2">Mas&apos;ul & Izoh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100 dark:divide-emerald-900/30 font-mono text-[11px]">
                    {invoice.payments.map((pm, pIdx) => (
                      <tr key={pIdx}>
                        <td className="py-1.5 px-2">{pm.date}</td>
                        <td className="py-1.5 px-2 font-sans capitalize">{pm.paymentMethod}</td>
                        <td className="py-1.5 px-2 text-right text-emerald-700 dark:text-emerald-400 font-bold">
                          ${formatUSDNumber(pm.amountUSD)}
                        </td>
                        <td className="py-1.5 px-2 text-right">
                          {formatNumberWithSpaces(pm.amount)}
                        </td>
                        <td className="py-1.5 px-2 font-sans text-slate-500 truncate max-w-xs">
                          {pm.paidBy || 'Kassir'} {pm.notes ? `• ${pm.notes}` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="pt-6 border-t border-dashed border-slate-300 dark:border-slate-700 grid grid-cols-2 gap-8 text-xs text-slate-500">
            <div>
              <span className="block mb-6">Topshirdi (Yetkazib beruvchi vakili):</span>
              <div className="border-b border-slate-400 w-44 mb-1"></div>
              <span className="text-[10px] text-slate-400">F.I.Sh. va Imzo</span>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="block mb-6">Qabul qildi (Ombor mudiri):</span>
              <div className="border-b border-slate-400 w-44 mb-1"></div>
              <span className="text-[10px] text-slate-400">{invoice.receivedBy}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
