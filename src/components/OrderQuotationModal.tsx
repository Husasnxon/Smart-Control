'use client';

import React, { useEffect } from 'react';
import { CustomerOrder } from '../types';
import { 
  X, 
  Printer, 
  FileText, 
  MapPin, 
  Phone, 
  Calendar, 
  Building2, 
  ShieldCheck,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

interface OrderQuotationModalProps {
  order: CustomerOrder | null;
  onClose: () => void;
  onConvertToShipment?: (order: CustomerOrder) => void;
  onDirectSale?: (order: CustomerOrder) => void;
}

export const OrderQuotationModal: React.FC<OrderQuotationModalProps> = ({
  order,
  onClose,
  onConvertToShipment,
  onDirectSale
}) => {
  // Escape key listener to close modal
  useEffect(() => {
    if (!order) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [order, onClose]);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Top Bar */}
        <div className="no-print px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Tijoriy Taklif / Smeta Hisob-kitobi: {order.orderNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Chop etish"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Quotation Content (A4 / Document styling) */}
        <div className="p-6 overflow-y-auto bg-slate-100 dark:bg-slate-950 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          <div className="printable-document w-full max-w-2xl bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-md border border-slate-200 font-sans text-xs space-y-5 print:border-none print:shadow-none">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b pb-4 border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-600 text-white font-extrabold flex items-center justify-center text-sm shadow">
                    SC
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 tracking-tight">SMART CONTROL</h2>
                    <p className="text-[10px] text-slate-500 font-semibold">{order.organization || 'WST Namangan'}</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 mt-2 font-medium">
                  Xavfsizlik tizimlari &bull; Kuzatuv kameralari &bull; Domofoniya &bull; Wi-Fi & Tarmoq &bull; Montaj xizmatlari
                </p>
                <p className="text-[10px] text-slate-500">Tel: +998 90 123 45 67 | +998 97 765 43 21</p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-sky-700 uppercase tracking-widest block">
                  TIJORIY TAKLIF (SMETA)
                </span>
                <span className="font-mono text-sm font-extrabold text-slate-900 block mt-0.5">
                  № {order.orderNumber}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Sana: {order.createdAt}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Valyuta: {order.currency === 'USD' ? '$ AQSH Dollari' : 'O\'zbek so\'mi'}
                </span>
              </div>
            </div>

            {/* Client & Project Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Buyurtmachi (Mijoz):
                </span>
                <span className="text-xs font-bold text-slate-900 block">
                  {order.customerName || 'Hurmatli Buyurtmachi'}
                </span>
                {order.customerPhone && (
                  <span className="text-[11px] text-slate-600 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {order.customerPhone}
                  </span>
                )}
                {order.deliveryAddress && (
                  <span className="text-[11px] text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-sky-600 shrink-0" /> {order.deliveryAddress}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Loyiha / Obyekt:
                </span>
                <span className="text-xs font-semibold text-slate-900 block">
                  {order.projectName || 'Standart o\'rnatish va ta\'minot'}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Ombor: {order.warehouseName || 'Asosiy ombor'}
                </span>
                {order.comment && (
                  <span className="text-[10px] text-slate-600 italic block">
                    Izoh: {order.comment}
                  </span>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-8 text-center">№</th>
                    <th className="py-2.5 px-3">Mahsulot / Xizmat Tavsifi</th>
                    <th className="py-2.5 px-3 text-center">Birlik</th>
                    <th className="py-2.5 px-3 text-center">Soni</th>
                    <th className="py-2.5 px-3 text-right">
                      Narxi ({order.currency === 'USD' ? '$ USD' : "so'm"})
                    </th>
                    <th className="py-2.5 px-3 text-right">
                      Summasi ({order.currency === 'USD' ? '$ USD' : "so'm"})
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800 block">
                          {item.productName}
                        </span>
                        {item.isService && (
                          <span className="text-[9px] text-purple-600 font-medium">[Montaj / Sozlash Xizmati]</span>
                        )}
                        {item.hasSerialNumber && (
                          <span className="text-[9px] text-sky-600 font-medium ml-1.5">[Kafolatli S/N]</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500">
                        {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold font-mono">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {order.currency === 'USD'
                          ? `$${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : `${Math.round(item.unitPrice).toLocaleString('uz-UZ')} so'm`}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">
                        {order.currency === 'USD'
                          ? `$${item.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : `${Math.round(item.totalPrice).toLocaleString('uz-UZ')} so'm`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Breakdown */}
            <div className="flex justify-end">
              <div className="w-72 space-y-1.5 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Oraliq jami:</span>
                  <span className="font-mono">
                    {order.currency === 'USD'
                      ? `$${order.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : `${Math.round(order.subtotal).toLocaleString('uz-UZ')} so'm`}
                  </span>
                </div>
                {order.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Chegirma:</span>
                    <span className="font-mono">
                      {order.currency === 'USD'
                        ? `-$${order.discountTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `-${Math.round(order.discountTotal).toLocaleString('uz-UZ')} so'm`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-300 pt-1.5">
                  <span>JAMI QIYMAT:</span>
                  <span className="font-mono text-sky-700">
                    {order.currency === 'USD'
                      ? `$${order.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : `${Math.round(order.totalAmount).toLocaleString('uz-UZ')} so'm`}
                  </span>
                </div>
                {order.exchangeRate > 0 && (
                  <div className="flex justify-between text-[11px] font-bold text-slate-600 pt-0.5 border-t border-dashed border-slate-200">
                    <span>{order.currency === 'USD' ? 'So\'m ekvivalentida:' : '$ USD ekvivalentida:'}</span>
                    <span className="font-mono text-slate-800">
                      {order.currency === 'USD'
                        ? `~ ${Math.round(order.totalAmount * order.exchangeRate).toLocaleString('uz-UZ')} so'm`
                        : `~ $${(order.totalAmount / order.exchangeRate).toFixed(2)} USD`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Terms and Warranty */}
            <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-lg text-[10px] text-sky-900 space-y-1">
              <div className="font-bold flex items-center gap-1 text-sky-800">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>Kafolat va Yetkazib berish shartlari:</span>
              </div>
              <p className="leading-relaxed text-slate-600">
                1. Barcha qurilmalarga rasmiy ishlab chiqaruvchi kafolati taqdim etiladi. Plomba buzilmagan bo&apos;lishi shart.
                <br />
                2. Ushbu tijoriy hisob-kitob narxlari 5 kun davomida o&apos;zgarishsiz amal qiladi.
                <br />
                3. Montaj va sozlash ishlari malakali mutaxassislar tomonidan sifatli amalga oshiriladi.
              </p>
            </div>

            {/* Signatures */}
            <div className="pt-6 border-t border-slate-200 flex justify-between text-xs text-slate-600">
              <div>
                <span className="block font-bold">Ijrochi: Smart Control</span>
                <span className="text-[10px] text-slate-400">Mas&apos;ul menejer: _________________</span>
              </div>
              <div className="text-right">
                <span className="block font-bold">Buyurtmachi: {order.customerName || 'Mijoz'}</span>
                <span className="text-[10px] text-slate-400">Imzo: _________________</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="no-print print:hidden p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
          >
            Yopish
          </button>

          <div className="flex items-center gap-2">
            {onDirectSale && order.status !== 'shipped' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDirectSale(order);
                }}
                className="px-4 py-2 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Darhol Sotish</span>
              </button>
            )}

            {onConvertToShipment && order.status !== 'shipped' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onConvertToShipment(order);
                }}
                className="px-5 py-2 rounded-xl font-extrabold text-xs bg-sky-600 hover:bg-sky-700 text-white transition flex items-center gap-1.5 shadow-lg shadow-sky-600/30"
              >
                <span>Otgruzkaga o&apos;tkazish (S/N kiritish) &rarr;</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
