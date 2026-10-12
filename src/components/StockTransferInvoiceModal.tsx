'use client';

import React from 'react';
import { StockTransfer, Currency } from '../types';
import { Printer, X, Building2, ArrowRight, Package, Calendar, User, FileText, CheckCircle2 } from 'lucide-react';
import { formatMoney, formatDualMoney } from '../utils/formatters';

interface StockTransferInvoiceModalProps {
  transfer: StockTransfer | null;
  isOpen: boolean;
  onClose: () => void;
  baseCurrency?: Currency;
  exchangeRate?: number;
}

export const StockTransferInvoiceModal: React.FC<StockTransferInvoiceModalProps> = ({
  transfer,
  isOpen,
  onClose,
  baseCurrency = 'UZS',
  exchangeRate = 12850
}) => {
  if (!isOpen || !transfer) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white text-slate-900 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:rounded-none print:w-full">
        
        {/* Header - Hidden on Print */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base flex items-center gap-2">
                <span>Peremesheniya Nakladnoyi</span>
                <span className="font-mono text-purple-400 text-xs px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-800">
                  #{transfer.transferNumber}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Filiallararo tovar ko&apos;chirish rasmiy dalolatnomasi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Chop Etish</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 print:p-4 print:space-y-4 font-sans text-xs sm:text-sm">
          
          {/* Document Top Header */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-black text-sm flex items-center justify-center">
                    SC
                  </div>
                  <h1 className="font-black text-xl tracking-tight text-slate-900">
                    SMART CONTROL
                  </h1>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Xavfsizlik & Tarmoq Tizimlari ERP Boshqaruvi
                </p>
              </div>

              <div className="text-right">
                <div className="text-lg font-black text-purple-700 font-mono">
                  {transfer.transferNumber}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Sana: <strong className="text-slate-800 font-mono">{transfer.createdAt}</strong>
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{transfer.status === 'completed' ? 'Yakunlangan' : 'Yo\'lda'}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900 underline underline-offset-4">
                FILIALLARARO TOVAR KO&apos;CHIRISH (PEREMESHENIYE) DALOLATNOMASI
              </h2>
            </div>
          </div>

          {/* Route Box: From Branch -> To Branch */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Chiqaruvchi Filial (Qayerdan):
              </span>
              <div className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-purple-600" />
                <span>{transfer.fromBranchName}</span>
              </div>
              <div className="text-xs text-slate-600">
                Mas&apos;ul: <strong className="text-slate-900">{transfer.sentBy}</strong>
              </div>
            </div>

            <div className="space-y-1 border-l border-slate-200 pl-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Qabul Qiluvchi Filial (Qayerga):
              </span>
              <div className="text-sm font-black text-emerald-700 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>{transfer.toBranchName}</span>
              </div>
              <div className="text-xs text-slate-600">
                Mas&apos;ul: <strong className="text-slate-900">{transfer.receivedBy || 'Qabul qiluvchi mas\'ul'}</strong>
              </div>
            </div>
          </div>

          {/* Notes if any */}
          {transfer.notes && (
            <div className="bg-amber-50/60 border border-amber-200 p-2.5 rounded-xl text-xs text-amber-900">
              <strong>Sabab / Izoh:</strong> {transfer.notes}
            </div>
          )}

          {/* Goods Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">№</th>
                  <th className="py-2.5 px-3">Mahsulot Nomi & Artikuli</th>
                  <th className="py-2.5 px-3 text-center">Miqdor</th>
                  <th className="py-2.5 px-3 text-right">Narxi</th>
                  <th className="py-2.5 px-3 text-right">Jami Qiymat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {transfer.items.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      {item.sku && (
                        <div className="text-[10px] text-slate-400 font-mono">Artikul: {item.sku}</div>
                      )}
                      {item.serialNumbers && item.serialNumbers.length > 0 && (
                        <div className="text-[10px] text-purple-700 font-mono font-semibold mt-0.5">
                          S/N: {item.serialNumbers.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800 font-mono">
                      {item.quantity} {item.unit || 'dona'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {formatMoney(item.retailPrice || 0, baseCurrency, exchangeRate)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                      {formatMoney((item.retailPrice || 0) * item.quantity, baseCurrency, exchangeRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                <tr>
                  <td colSpan={2} className="py-2.5 px-3 text-right uppercase text-[11px] text-slate-600">
                    Jami Ko&apos;chirilgan Tovar:
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900 text-sm">
                    {transfer.totalQuantity} dona
                  </td>
                  <td className="py-2.5 px-3 text-right uppercase text-[11px] text-slate-600">
                    Jami Summa:
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-purple-700 text-sm">
                    {formatDualMoney(transfer.totalAmountUZS, baseCurrency, exchangeRate).primary}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signatures & Stamps */}
          <div className="pt-6 grid grid-cols-2 gap-8 border-t border-slate-200 text-xs">
            <div className="space-y-4">
              <span className="font-bold text-slate-700 block">
                Topshirdi (Chiqaruvchi filial mas&apos;uli):
              </span>
              <div className="space-y-1">
                <div className="text-slate-800 font-semibold">{transfer.sentBy}</div>
                <div className="border-b border-slate-400 w-48 pt-6"></div>
                <div className="text-[10px] text-slate-400">(imzo va muhr o&apos;rni)</div>
              </div>
            </div>

            <div className="space-y-4">
              <span className="font-bold text-slate-700 block">
                Qabul qildi (Qabul qiluvchi filial mas&apos;uli):
              </span>
              <div className="space-y-1">
                <div className="text-slate-800 font-semibold">{transfer.receivedBy || '_________________'}</div>
                <div className="border-b border-slate-400 w-48 pt-6"></div>
                <div className="text-[10px] text-slate-400">(imzo va muhr o&apos;rni)</div>
              </div>
            </div>
          </div>

          {/* Legal / Note footer */}
          <div className="pt-2 text-[10px] text-slate-400 text-center border-t border-dashed border-slate-200">
            Ushbu hujjat 2 nusxada tuzildi: 1-nusxa chiqaruvchi omborda qoladi, 2-nusxa qabul qiluvchi filialga topshiriladi.
          </div>

        </div>

        {/* Modal Footer - Hidden on Print */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 print:hidden">
          <span className="text-xs text-slate-400">
            Hujjat № {transfer.transferNumber} &bull; Smart Control ERP
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
            >
              Yopish
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Chop Etish</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
