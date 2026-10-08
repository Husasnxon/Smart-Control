'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CustomerOrder, SaleReceipt, Product, Customer, CartItem, PaymentDetails, Currency, OrderItem } from '../types';
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
  ArrowRight,
  Plus,
  Minus,
  Trash2,
  Edit3,
  Search
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

  // Editable items state for the currently active order
  const [editableItems, setEditableItems] = useState<OrderItem[]>([]);
  const [isAddingProduct, setIsAddingProduct] = useState<boolean>(false);
  const [productSearch, setProductSearch] = useState<string>('');

  // Sync editable items whenever selected order changes or modal opens
  useEffect(() => {
    if (selectedOrder) {
      setEditableItems(selectedOrder.items ? JSON.parse(JSON.stringify(selectedOrder.items)) : []);
      setIsAddingProduct(false);
      setProductSearch('');
    }
  }, [selectedOrder?.id, isOpen]);

  // Calculations from editable items
  const computedTotalUZS = useMemo(() => {
    return editableItems.reduce((sum, it) => sum + (it.totalPrice || it.unitPrice * it.quantity), 0);
  }, [editableItems]);

  const computedTotalUSD = useMemo(() => {
    return Number((computedTotalUZS / (selectedOrder?.exchangeRate || exchangeRate || 12850)).toFixed(2));
  }, [computedTotalUZS, selectedOrder?.exchangeRate, exchangeRate]);

  // Filter products for adding new items
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 10);
    const q = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q))
    ).slice(0, 15);
  }, [products, productSearch]);

  const handleUpdateItemQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    setEditableItems((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          const discount = item.discountPercent || 0;
          const discountedUnit = item.unitPrice * (1 - discount / 100);
          return {
            ...item,
            quantity: newQty,
            totalPrice: Math.round(discountedUnit * newQty)
          };
        }
        return item;
      })
    );
  };

  const handleUpdateItemPriceUSD = (index: number, priceUSD: number) => {
    const rate = selectedOrder?.exchangeRate || exchangeRate || 12850;
    const priceUZS = Math.round(priceUSD * rate);
    setEditableItems((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          const discount = item.discountPercent || 0;
          const discountedUnit = priceUZS * (1 - discount / 100);
          return {
            ...item,
            unitPrice: priceUZS,
            unitPriceUSD: priceUSD,
            totalPrice: Math.round(discountedUnit * item.quantity)
          };
        }
        return item;
      })
    );
  };

  const handleUpdateItemPriceUZS = (index: number, priceUZS: number) => {
    const rate = selectedOrder?.exchangeRate || exchangeRate || 12850;
    const priceUSD = Number((priceUZS / rate).toFixed(2));
    setEditableItems((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          const discount = item.discountPercent || 0;
          const discountedUnit = priceUZS * (1 - discount / 100);
          return {
            ...item,
            unitPrice: priceUZS,
            unitPriceUSD: priceUSD,
            totalPrice: Math.round(discountedUnit * item.quantity)
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (index: number) => {
    setEditableItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddNewItem = (prod: Product) => {
    const rate = selectedOrder?.exchangeRate || exchangeRate || 12850;
    const priceUZS = prod.retailPrice || (prod.retailPriceUSD ? Math.round(prod.retailPriceUSD * rate) : 0);
    const priceUSD = prod.retailPriceUSD || Number((priceUZS / rate).toFixed(2));

    const newItem: OrderItem = {
      productId: prod.id,
      productName: prod.name,
      quantity: 1,
      unit: prod.unit || 'dona',
      unitPrice: priceUZS,
      unitPriceUSD: priceUSD,
      discountPercent: 0,
      totalPrice: priceUZS,
      hasSerialNumber: prod.hasSerialNumber,
      isService: prod.isService,
      category: prod.category
    };

    setEditableItems((prev) => [...prev, newItem]);
    setIsAddingProduct(false);
    setProductSearch('');
  };

  const getFinalOrder = (): CustomerOrder => {
    return {
      ...selectedOrder,
      items: editableItems,
      subtotal: computedTotalUZS,
      totalAmount: computedTotalUZS,
      totalAmountUSD: computedTotalUSD
    };
  };

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

                  {/* Editable Items List & Toolbar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        Mahsulotlar va Xizmatlar ({editableItems.length} ta) — <span className="text-amber-400 font-normal">Kassir narx/miqdorni o&apos;zgartirishi mumkin</span>:
                      </span>
                      
                      <button
                        type="button"
                        onClick={() => setIsAddingProduct(!isAddingProduct)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 text-xs font-bold border border-indigo-700/60 flex items-center gap-1 transition shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Qo&apos;shish</span>
                      </button>
                    </div>

                    {/* Quick Add Product Dropdown / Search */}
                    {isAddingProduct && (
                      <div className="p-3 bg-slate-900 rounded-2xl border border-indigo-600/50 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Ombordan tovar yoki xizmat qidiring..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 pl-8 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500"
                            autoFocus
                          />
                          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                        </div>

                        <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-slate-800/60 pr-1">
                          {filteredProducts.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => handleAddNewItem(p)}
                              className="p-1.5 hover:bg-slate-800 rounded-lg cursor-pointer flex items-center justify-between text-xs transition"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="font-semibold text-slate-200 truncate">{p.name}</div>
                                <span className="text-[10px] text-slate-400 font-mono">{p.sku} &bull; Qoldiq: {p.isService ? '∞' : p.stockQuantity}</span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-mono font-bold text-emerald-400 block">${p.retailPriceUSD || Number((p.retailPrice / (selectedOrder.exchangeRate || exchangeRate)).toFixed(1))}</span>
                                <span className="text-[10px] text-slate-500 font-mono">{formatNumberWithSpaces(p.retailPrice)} so&apos;m</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Editable items list */}
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {editableItems.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500 bg-slate-900 rounded-xl border border-dashed border-slate-800">
                          Smetada tovarlar mavjud emas. Yuqoridagi &quot;Qo&apos;shish&quot; tugmasi orqali tovar qo&apos;shishingiz mumkin.
                        </div>
                      ) : (
                        editableItems.map((it, idx) => {
                          const itemUnitUSD = it.unitPriceUSD ?? Number((it.unitPrice / (selectedOrder.exchangeRate || exchangeRate || 12850)).toFixed(2));
                          const itemTotalUSD = Number((itemUnitUSD * it.quantity).toFixed(2));

                          return (
                            <div
                              key={idx}
                              className="p-2.5 bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-slate-700 text-xs space-y-2 transition"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  {it.isService ? (
                                    <Wrench className="w-4 h-4 text-pink-400 shrink-0" />
                                  ) : (
                                    <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
                                  )}
                                  <span className="font-bold text-white truncate">{it.productName}</span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                                  title="O'chirish"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Editable Quantity & Price Inputs */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
                                {/* Quantity Stepper */}
                                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                                  <span className="text-[10px] text-slate-400 font-semibold pl-1.5">Miqdor:</span>
                                  <div className="flex items-center gap-1 ml-auto">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateItemQty(idx, it.quantity - 1)}
                                      className="w-5 h-5 rounded-md bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 font-bold"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <input
                                      type="number"
                                      min="1"
                                      value={it.quantity}
                                      onChange={(e) => handleUpdateItemQty(idx, Math.max(1, Number(e.target.value) || 1))}
                                      className="w-10 bg-transparent text-center font-mono font-bold text-white text-xs focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateItemQty(idx, it.quantity + 1)}
                                      className="w-5 h-5 rounded-md bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 font-bold"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                    <span className="text-[10px] text-slate-400 font-semibold pr-1">{it.unit || 'dona'}</span>
                                  </div>
                                </div>

                                {/* Unit Price in Dollar ($) & UZS */}
                                <div className="flex items-center gap-2 bg-slate-950 p-1 px-2 rounded-xl border border-slate-800 justify-between">
                                  <span className="text-[10px] text-slate-400 font-semibold">Dona narxi ($):</span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-cyan-400 font-bold text-xs">$</span>
                                    <input
                                      type="number"
                                      step="any"
                                      min="0"
                                      value={itemUnitUSD}
                                      onChange={(e) => handleUpdateItemPriceUSD(idx, Number(e.target.value) || 0)}
                                      className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-0.5 text-right font-mono font-bold text-cyan-300 text-xs focus:ring-1 focus:ring-cyan-500"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Row Subtotal Calculation Display */}
                              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                                <span className="font-mono">
                                  {it.quantity} &times; {formatNumberWithSpaces(it.unitPrice)} so&apos;m
                                </span>
                                <div className="font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                                  <span>= ${itemTotalUSD}</span>
                                  <span className="text-slate-500 font-normal">({formatNumberWithSpaces(it.totalPrice)} so&apos;m)</span>
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
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Area: Total & Approvals */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-baseline justify-between p-3 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 rounded-2xl border border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-slate-300 block">Jami Tasdiqlanadigan Summa:</span>
                      <span className="text-[10px] text-slate-500">Kurs: 1$ = {formatNumberWithSpaces(selectedOrder.exchangeRate || exchangeRate)} so&apos;m</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-emerald-400 font-mono">
                        ${computedTotalUSD}
                      </span>
                      <span className="text-xs text-slate-400 font-mono block">
                        ≈ {formatNumberWithSpaces(computedTotalUZS)} so&apos;m
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* 1. Direct Approve into Otgruzka */}
                    <button
                      type="button"
                      disabled={editableItems.length === 0}
                      onClick={() => {
                        onDirectApproveSale(getFinalOrder(), 'cash');
                        onClose();
                      }}
                      className="py-3 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition active:scale-98"
                      title="Smetani kassa tomonidan tasdiqlab to'g'ridan-to'g'ri otgruzka va montajga o'tkazish"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>✓ Tasdiqlash (Otgruzka)</span>
                    </button>

                    {/* 2. Load into POS Cart for payment checkout */}
                    <button
                      type="button"
                      disabled={editableItems.length === 0}
                      onClick={() => {
                        onApproveAndLoadToCart(getFinalOrder());
                        onClose();
                      }}
                      className="py-3 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/30 transition active:scale-98"
                      title="Mahsulotlar va xizmatlarni POS savatchasiga yuklab to'lov qabul qilish"
                    >
                      <ShoppingCart className="w-4 h-4 shrink-0" />
                      <span>🛒 Savatga Yuklash (Kassa)</span>
                    </button>

                    {/* 3. Reject */}
                    <button
                      type="button"
                      onClick={() => {
                        const reason = window.prompt("Rad etish sababini kiriting (ixtiyoriy):", "Tovarlar omborda yetarli emas yoki narx xato");
                        if (reason !== null) {
                          onRejectOrder(selectedOrder.id, reason);
                        }
                      }}
                      className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-rose-950 text-rose-400 hover:text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-800 hover:border-rose-800 transition"
                    >
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>Rad Etish</span>
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
