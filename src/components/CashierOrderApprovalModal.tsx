'use client';

import React, { useState } from 'react';
import { CustomerOrder, SaleReceipt, Product, Customer, CartItem, PaymentDetails, Currency } from '../types';
import { formatNumberWithSpaces, formatUSDNumber, formatMoney } from '../utils/formatters';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  ShoppingCart, 
  User, 
  Phone, 
  MapPin, 
  HardHat, 
  Cpu, 
  Wrench, 
  Barcode, 
  Clock, 
  AlertTriangle, 
  Send,
  DollarSign,
  Layers,
  ArrowRight
} from 'lucide-react';

interface CashierOrderApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingOrders: CustomerOrder[];
  products: Product[];
  exchangeRate: number;
  baseCurrency?: Currency;
  onApproveAndLoadToCart: (order: CustomerOrder) => void;
  onDirectApproveSale: (order: CustomerOrder, paymentMethod: 'cash' | 'card' | 'debt' | 'usd') => void;
  onRejectOrder: (orderId: string, reason: string) => void;
}

export const CashierOrderApprovalModal: React.FC<CashierOrderApprovalModalProps> = ({
  isOpen,
  onClose,
  pendingOrders,
  products,
  exchangeRate,
  baseCurrency = 'UZS',
  onApproveAndLoadToCart,
  onDirectApproveSale,
  onRejectOrder
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(() => {
    return pendingOrders[0]?.id || '';
  });

  const selectedOrder = pendingOrders.find((o) => o.id === selectedOrderId) || pendingOrders[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-950 text-white rounded-3xl border border-amber-500/30 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 border-b border-amber-900/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Ustalardan Kelgan Joyida Hisob-kitoblar</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                  {pendingOrders.length} ta kutmoqda
                </span>
              </div>
              <p className="text-[11px] text-amber-300">
                Usta mijoz obyektida tuzgan smetani tasdiqlang yoki POS kassaga chek urishga yuklang
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Left List + Right Detail */}
        {pendingOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">Kassada tasdiqlanmagan buyurtmalar yo&apos;q</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Ustalar mijoz obyektida qo&apos;shimcha mahsulot yoki xizmat kiritganda bu yerda avtomatik xabar paydo bo&apos;ladi.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800">
            
            {/* Left Column: Orders List */}
            <div className="overflow-y-auto p-3 space-y-2 max-h-56 md:max-h-full">
              {pendingOrders.map((ord) => {
                const isSelected = selectedOrder?.id === ord.id;
                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrderId(ord.id)}
                    className={`p-3 rounded-2xl border transition cursor-pointer select-none space-y-1.5 ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-500/80 shadow-md'
                        : 'bg-slate-900 hover:bg-slate-850 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-400">#{ord.orderNumber}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{ord.createdAt}</span>
                    </div>

                    <h4 className="text-xs font-black text-white truncate">{ord.customerName}</h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span className="flex items-center gap-1 text-purple-300 truncate">
                        <HardHat className="w-3 h-3 shrink-0" />
                        <span>{ord.requestedByTechnicianName || ord.technicianName || 'Usta'}</span>
                      </span>
                      <span className="font-mono font-black text-emerald-400">
                        ${ord.totalAmountUSD || Number((ord.totalAmount / exchangeRate).toFixed(1))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Order Details & Approval Actions */}
            {selectedOrder && (
              <div className="md:col-span-2 overflow-y-auto p-4 sm:p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Top Order Meta */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-900 rounded-2xl border border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-amber-400 font-mono">#{selectedOrder.orderNumber}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Tasdiqlash kutilmoqda
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-0.5">{selectedOrder.projectName || 'Joyida Hisob-kitob'}</h3>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 block font-semibold">Yuborgan Usta:</span>
                      <strong className="text-xs text-purple-300 flex items-center gap-1">
                        <HardHat className="w-3.5 h-3.5" />
                        {selectedOrder.requestedByTechnicianName || selectedOrder.technicianName || 'Usta'}
                      </strong>
                    </div>
                  </div>

                  {/* Customer Info Box */}
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Buyurtmachi:</span>
                      <strong className="text-white">{selectedOrder.customerName}</strong>
                    </div>
                    {selectedOrder.customerPhone && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Telefon:</span>
                        <strong className="text-slate-200">{selectedOrder.customerPhone}</strong>
                      </div>
                    )}
                    {selectedOrder.deliveryAddress && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Manzil:</span>
                        <strong className="text-slate-200">{selectedOrder.deliveryAddress}</strong>
                      </div>
                    )}
                    {selectedOrder.comment && (
                      <div className="pt-1 text-[11px] text-amber-300 italic border-t border-slate-800">
                        Izoh: {selectedOrder.comment}
                      </div>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Hisoblangan Mahsulotlar va Montaj Xizmatlari ({selectedOrder.items.length} ta):
                    </span>
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {selectedOrder.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-xs flex flex-col gap-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {it.isService ? (
                                <Wrench className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                              ) : (
                                <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              )}
                              <span className="font-bold text-white truncate">{it.productName}</span>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-mono font-bold text-white">
                                {it.quantity} {it.unit} &times; ${it.unitPriceUSD || Math.round(it.unitPrice / exchangeRate)}
                              </span>
                              <span className="text-[10px] text-cyan-400 font-mono block">
                                = ${it.unitPriceUSD ? (it.unitPriceUSD * it.quantity).toFixed(1) : Math.round(it.totalPrice / exchangeRate)}
                              </span>
                            </div>
                          </div>

                          {/* Serial Numbers if provided */}
                          {it.selectedSerialNumbers && it.selectedSerialNumbers.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-slate-800/80">
                              <Barcode className="w-3 h-3 text-purple-400 shrink-0" />
                              <span className="text-[10px] text-slate-400 font-semibold">S/N:</span>
                              {it.selectedSerialNumbers.map((sn, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="text-[10px] font-mono font-bold bg-purple-950 text-purple-300 px-1.5 py-0.2 rounded border border-purple-800"
                                >
                                  {sn}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Area: Total & Approvals */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-baseline justify-between p-3 bg-gradient-to-r from-slate-900 to-amber-950/40 rounded-2xl border border-slate-800">
                    <span className="text-xs font-bold text-slate-300">Jami Tasdiqlanadigan Summa:</span>
                    <div className="text-right">
                      <span className="text-xl font-black text-emerald-400 font-mono">
                        ${selectedOrder.totalAmountUSD || Number((selectedOrder.totalAmount / exchangeRate).toFixed(1))}
                      </span>
                      <span className="text-xs text-slate-400 font-mono block">
                        ≈ {formatNumberWithSpaces(selectedOrder.totalAmount)} so&apos;m
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* 1. Load into POS Cart */}
                    <button
                      type="button"
                      onClick={() => {
                        onApproveAndLoadToCart(selectedOrder);
                        onClose();
                      }}
                      className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition active:scale-98"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>🛒 Kassaga Yuklash (Chek Urish)</span>
                    </button>

                    {/* 2. Reject */}
                    <button
                      type="button"
                      onClick={() => {
                        const reason = window.prompt("Rad etish sababini kiriting (ixtiyoriy):", "Tovarlar omborda yetarli emas yoki narx xato");
                        if (reason !== null) {
                          onRejectOrder(selectedOrder.id, reason);
                        }
                      }}
                      className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-rose-950 text-rose-400 hover:text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-800 hover:border-rose-800 transition"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Rad Etish (Bekor qilish)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
