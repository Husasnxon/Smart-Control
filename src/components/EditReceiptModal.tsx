'use client';

import React, { useState, useEffect } from 'react';
import { 
  SaleReceipt, 
  Product, 
  Customer, 
  Employee, 
  CartItem, 
  AssignedTechnician 
} from '../types';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Edit3, 
  PackagePlus, 
  HardHat, 
  MapPin, 
  ShieldCheck, 
  Search, 
  Barcode, 
  Coins, 
  Banknote, 
  CreditCard,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface EditReceiptModalProps {
  receipt: SaleReceipt | null;
  products: Product[];
  customers: Customer[];
  employees: Employee[];
  exchangeRate: number;
  onClose: () => void;
  onSaveEdit: (
    receiptId: string,
    updatedReceipt: SaleReceipt,
    newItemsStockDelta: {
      productId: string;
      quantity: number;
      serialNumbers: string[];
    }[]
  ) => void;
}

export const EditReceiptModal: React.FC<EditReceiptModalProps> = ({
  receipt,
  products,
  customers,
  employees,
  exchangeRate,
  onClose,
  onSaveEdit
}) => {
  if (!receipt) return null;

  // Active Tab
  const [activeTab, setActiveTab] = useState<'add_items' | 'edit_details'>('add_items');

  // Escape key handler to close modal without saving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // --- TAB 1: ADD MORE ITEMS STATE ---
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productSearch, setProductSearch] = useState<string>('');
  const [addQuantity, setAddQuantity] = useState<number>(1);
  const [addPrice, setAddPrice] = useState<number>(0);
  const [addSelectedSerials, setAddSelectedSerials] = useState<string[]>([]);
  const [paymentMethodForNewItems, setPaymentMethodForNewItems] = useState<'cash' | 'card' | 'debt'>('cash');

  // Staging list for newly added items
  const [newlyAddedItems, setNewlyAddedItems] = useState<CartItem[]>([]);

  // --- TAB 2: EDIT DETAILS STATE ---
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(receipt.customer?.id || '');
  const [installationAddress, setInstallationAddress] = useState<string>(receipt.installationAddress || '');
  const [warrantyMonths, setWarrantyMonths] = useState<number>(receipt.warrantyMonths || 12);
  const [receiptNotes, setReceiptNotes] = useState<string>(receipt.notes || '');

  // Assigned Technicians state
  const [assignedTechnicians, setAssignedTechnicians] = useState<AssignedTechnician[]>(
    receipt.technicians && receipt.technicians.length > 0
      ? [...receipt.technicians]
      : receipt.technicianId
      ? [{
          id: receipt.technicianId,
          fullName: receipt.technicianName || '',
          phone: receipt.technicianPhone || '',
          role: 'Montajchi Usta',
          wageUSD: 0,
          wageUZS: 0
        }]
      : []
  );

  // Filter products for search
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.barcode.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // When selectedProduct changes, update default price and serials
  const handleSelectProduct = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setAddPrice(prod.retailPrice);
      setAddQuantity(1);
      setAddSelectedSerials([]);
    }
  };

  // Toggle S/N selection for adding item
  const handleToggleAddSerial = (sn: string) => {
    if (addSelectedSerials.includes(sn)) {
      const updated = addSelectedSerials.filter((s) => s !== sn);
      setAddSelectedSerials(updated);
      setAddQuantity(Math.max(1, updated.length));
    } else {
      const updated = [...addSelectedSerials, sn];
      setAddSelectedSerials(updated);
      setAddQuantity(updated.length);
    }
  };

  // Stage adding an item
  const handleStageAddItem = () => {
    if (!selectedProduct) return;

    if (!selectedProduct.isService && selectedProduct.stockQuantity < addQuantity) {
      alert(`Omborda yetarli mahsulot yo'q! Mavjud: ${selectedProduct.stockQuantity}`);
      return;
    }

    if (selectedProduct.hasSerialNumber && addSelectedSerials.length !== addQuantity) {
      alert(`Tanlangan miqdor (${addQuantity}) bilan belgilangan seriya raqamlari soni (${addSelectedSerials.length}) teng bo'lishi kerak!`);
      return;
    }

    const newItem: CartItem = {
      product: selectedProduct,
      quantity: addQuantity,
      discountPercent: 0,
      appliedPrice: addPrice,
      appliedPriceUSD: exchangeRate > 0 ? Number((addPrice / exchangeRate).toFixed(2)) : 0,
      selectedSerialNumbers: addSelectedSerials.length > 0 ? [...addSelectedSerials] : undefined
    };

    setNewlyAddedItems((prev) => [...prev, newItem]);

    // Reset selection form
    setSelectedProductId('');
    setProductSearch('');
    setAddQuantity(1);
    setAddPrice(0);
    setAddSelectedSerials([]);
  };

  // Remove staged item
  const handleRemoveStagedItem = (index: number) => {
    setNewlyAddedItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Technician management
  const handleAddTechnician = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp || assignedTechnicians.some((t) => t.id === empId)) return;

    setAssignedTechnicians((prev) => [
      ...prev,
      {
        id: emp.id,
        fullName: emp.fullName,
        phone: emp.phone,
        role: emp.role,
        wageUSD: 0,
        wageUZS: 0
      }
    ]);
  };

  const handleRemoveTechnician = (techId: string) => {
    setAssignedTechnicians((prev) => prev.filter((t) => t.id !== techId));
  };

  const handleUpdateTechWage = (techId: string, field: 'wageUSD' | 'wageUZS', val: number) => {
    setAssignedTechnicians((prev) =>
      prev.map((t) => {
        if (t.id === techId) {
          if (field === 'wageUSD') {
            return { ...t, wageUSD: val, wageUZS: Math.round(val * exchangeRate) };
          } else {
            return { ...t, wageUZS: val, wageUSD: Number((val / exchangeRate).toFixed(2)) };
          }
        }
        return t;
      })
    );
  };

  // Calculations for newly added items
  const newlyAddedTotal = newlyAddedItems.reduce(
    (sum, it) => sum + it.quantity * it.appliedPrice,
    0
  );

  // Grand submission
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedCust = customers.find((c) => c.id === selectedCustomerId) || receipt.customer;

    // Merge cart items
    const updatedItems = [...receipt.items];

    // Track stock deductions for new items
    const newItemsStockDelta: {
      productId: string;
      quantity: number;
      serialNumbers: string[];
    }[] = [];

    newlyAddedItems.forEach((newIt) => {
      // Check if product already exists in receipt with same price
      const existingIdx = updatedItems.findIndex(
        (it) => it.product.id === newIt.product.id && it.appliedPrice === newIt.appliedPrice
      );

      if (existingIdx >= 0) {
        const existing = updatedItems[existingIdx];
        updatedItems[existingIdx] = {
          ...existing,
          quantity: existing.quantity + newIt.quantity,
          selectedSerialNumbers: [
            ...(existing.selectedSerialNumbers || []),
            ...(newIt.selectedSerialNumbers || [])
          ]
        };
      } else {
        updatedItems.push(newIt);
      }

      // Record stock delta
      newItemsStockDelta.push({
        productId: newIt.product.id,
        quantity: newIt.quantity,
        serialNumbers: newIt.selectedSerialNumbers || []
      });
    });

    const newSubtotal = receipt.subtotal + newlyAddedTotal;
    const newTotalAmount = receipt.totalAmount + newlyAddedTotal;

    // Adjust payments with newly added total
    const updatedPayments = { ...receipt.payments };
    if (newlyAddedTotal > 0) {
      if (paymentMethodForNewItems === 'cash') {
        updatedPayments.cash += newlyAddedTotal;
      } else if (paymentMethodForNewItems === 'card') {
        updatedPayments.card += newlyAddedTotal;
      } else if (paymentMethodForNewItems === 'debt') {
        updatedPayments.debt += newlyAddedTotal;
      }
      updatedPayments.total = newTotalAmount;
      if (exchangeRate > 0) {
        updatedPayments.totalUSD = Number((newTotalAmount / exchangeRate).toFixed(2));
      }
    }

    const updatedReceipt: SaleReceipt = {
      ...receipt,
      customer: selectedCust,
      installationAddress: installationAddress.trim() || undefined,
      warrantyMonths: warrantyMonths > 0 ? warrantyMonths : undefined,
      notes: receiptNotes.trim() || undefined,
      technicians: assignedTechnicians.length > 0 ? assignedTechnicians : undefined,
      technicianId: assignedTechnicians[0]?.id || undefined,
      technicianName: assignedTechnicians[0]?.fullName || undefined,
      technicianPhone: assignedTechnicians[0]?.phone || undefined,
      items: updatedItems,
      subtotal: newSubtotal,
      totalAmount: newTotalAmount,
      totalAmountUSD: exchangeRate > 0 ? Number((newTotalAmount / exchangeRate).toFixed(2)) : undefined,
      payments: updatedPayments,
      status: receipt.status === 'returned' ? 'returned' : newlyAddedItems.length > 0 ? 'edited' : receipt.status || 'edited',
      updatedAt: new Date().toLocaleString('uz-UZ')
    };

    onSaveEdit(receipt.id, updatedReceipt, newItemsStockDelta);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-cyan-50/50 dark:bg-cyan-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center font-bold">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Chekni Tahrirlash va Tovar Qo&apos;shish
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 font-bold">
                  {receipt.receiptNumber}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chek sanasi: {receipt.createdAt} &bull; Jami: {receipt.totalAmount.toLocaleString()} so&apos;m
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('add_items')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'add_items'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <PackagePlus className="w-4 h-4" />
            <span>Sotuvga Tovar / Xizmat Qo&apos;shish</span>
            {newlyAddedItems.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500 text-white font-extrabold">
                {newlyAddedItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('edit_details')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'edit_details'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Mijoz, Manzil, Ustalar & Kafolat</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFinalSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: ADD MORE ITEMS */}
          {activeTab === 'add_items' && (
            <div className="space-y-5">
              {/* Product Picker Box */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <PackagePlus className="w-4 h-4 text-cyan-500" />
                    Ombordan tovar yoki xizmat tanlang
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Valyuta kursi: 1$ = {exchangeRate.toLocaleString()} so&apos;m
                  </span>
                </div>

                {/* Search & Select */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Qidirish (Nomi, Shtrix-kod):
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Kamera, kabel, xizmat..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Mahsulotni tanlang:
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleSelectProduct(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">-- Tanlang --</option>
                      {filteredProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.isService ? '(Xizmat)' : `[Qoldiq: ${p.stockQuantity} ${p.unit}]`} - {p.retailPrice.toLocaleString()} so&apos;m
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Selected Product Details and Config */}
                {selectedProduct && (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-xs block">
                          {selectedProduct.name}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Kategoriya: {selectedProduct.category} &bull; Birlik: {selectedProduct.unit}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-cyan-600 font-mono">
                          {selectedProduct.retailPrice.toLocaleString()} so&apos;m
                        </span>
                        {selectedProduct.retailPriceUSD && (
                          <span className="text-[10px] text-slate-400 block font-mono">
                            (${selectedProduct.retailPriceUSD})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Serial Numbers selector if serialized */}
                    {selectedProduct.hasSerialNumber && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-cyan-700 dark:text-cyan-400 flex items-center gap-1">
                          <Barcode className="w-3.5 h-3.5" />
                          Ombordagi mavjud seriya raqamlari (S/N) ni tanlang ({addSelectedSerials.length} ta tanlandi):
                        </label>
                        {selectedProduct.serialNumbers && selectedProduct.serialNumbers.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-800/80 rounded border border-slate-200 dark:border-slate-700">
                            {selectedProduct.serialNumbers.map((sn) => {
                              const isChecked = addSelectedSerials.includes(sn);
                              return (
                                <button
                                  type="button"
                                  key={sn}
                                  onClick={() => handleToggleAddSerial(sn)}
                                  className={`px-2 py-0.5 rounded text-[11px] font-mono border transition ${
                                    isChecked
                                      ? 'bg-cyan-500 text-white border-cyan-600 font-bold'
                                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                                  }`}
                                >
                                  {sn} {isChecked ? '✓' : ''}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-xs text-rose-500 italic">
                            Omborda ushbu tovar uchun bo&apos;sh seriya raqami qolmagan!
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quantity & Unit Price inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                          Miqdori ({selectedProduct.unit}):
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={selectedProduct.isService ? 9999 : selectedProduct.stockQuantity}
                          value={addQuantity}
                          disabled={selectedProduct.hasSerialNumber}
                          onChange={(e) => setAddQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none"
                        />
                        {selectedProduct.hasSerialNumber && (
                          <span className="text-[9px] text-slate-400">S/N tanlanganda miqdor avtomatik belgilanadi</span>
                        )}
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                          Sotish narxi (so&apos;mda):
                        </label>
                        <input
                          type="number"
                          value={addPrice}
                          onChange={(e) => setAddPrice(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none"
                        />
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={handleStageAddItem}
                          className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Ro&apos;yxatga qo&apos;shish</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Newly Added Staging Items List */}
              {newlyAddedItems.length > 0 && (
                <div className="border border-cyan-200 dark:border-cyan-900/60 rounded-xl overflow-hidden bg-cyan-50/20">
                  <div className="bg-cyan-100/60 dark:bg-cyan-950/60 px-4 py-2 border-b border-cyan-200 dark:border-cyan-900/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-900 dark:text-cyan-200">
                      Chekga yangi qo&apos;shilayotgan tovarlar ({newlyAddedItems.length} ta)
                    </span>
                    <span className="text-xs font-extrabold text-cyan-700 dark:text-cyan-300 font-mono">
                      +{newlyAddedTotal.toLocaleString()} so&apos;m
                    </span>
                  </div>

                  <div className="divide-y divide-cyan-100 dark:divide-cyan-900/40 p-2">
                    {newlyAddedItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 text-xs">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-100 block">
                            {item.product.name}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {item.quantity} {item.product.unit} x {item.appliedPrice.toLocaleString()} so&apos;m
                            {item.selectedSerialNumbers && item.selectedSerialNumbers.length > 0 && (
                              <span className="text-cyan-700 font-bold ml-2">
                                (S/N: {item.selectedSerialNumbers.join(', ')})
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-extrabold text-cyan-700 dark:text-cyan-300">
                            {(item.quantity * item.appliedPrice).toLocaleString()} so&apos;m
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveStagedItem(idx)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Payment method for added items */}
                  <div className="p-3 bg-white dark:bg-slate-900 border-t border-cyan-200 dark:border-cyan-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Qo&apos;shimcha tovarlar to&apos;lovi qanday qabul qilindi?
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethodForNewItems('cash')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border transition ${
                          paymentMethodForNewItems === 'cash'
                            ? 'bg-emerald-500 text-white border-emerald-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Banknote className="w-3.5 h-3.5" /> Naqd
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethodForNewItems('card')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border transition ${
                          paymentMethodForNewItems === 'card'
                            ? 'bg-blue-500 text-white border-blue-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Karta
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethodForNewItems('debt')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border transition ${
                          paymentMethodForNewItems === 'debt'
                            ? 'bg-amber-500 text-white border-amber-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" /> Nasiya (Qarz)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Already sold items preview */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
                  Ushbu chekdagi mavjud tovarlar ({receipt.items.length} ta)
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 p-2">
                  {receipt.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 text-xs text-slate-700 dark:text-slate-300">
                      <div>
                        <span className="font-semibold">{it.product.name}</span>
                        {it.selectedSerialNumbers && it.selectedSerialNumbers.length > 0 && (
                          <span className="text-[10px] text-cyan-600 block font-mono">
                            S/N: {it.selectedSerialNumbers.join(', ')}
                          </span>
                        )}
                      </div>
                      <div className="text-right font-mono font-bold">
                        {it.quantity} {it.product.unit} x {it.appliedPrice.toLocaleString()} = {(it.quantity * it.appliedPrice).toLocaleString()} so&apos;m
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EDIT RECEIPT DETAILS */}
          {activeTab === 'edit_details' && (
            <div className="space-y-4">
              {/* Customer Selector */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-cyan-600" />
                  Mijozni tanlash yoki o&apos;zgartirish:
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">-- Standart Xaridor (Mijoz biriktirilmagan) --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.phone}) - {c.tier} [Qarzdorlik: {c.debtBalance.toLocaleString()} so&apos;m]
                    </option>
                  ))}
                </select>
              </div>

              {/* Installation Address */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-cyan-600" />
                  Obyekt / O&apos;rnatish manzili:
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Chilonzor 19-mavze, 45-uy, 2-kirish yoki Do'kon nomi..."
                  value={installationAddress}
                  onChange={(e) => setInstallationAddress(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Warranty Months */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Kafolat muddati:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[0, 6, 12, 24, 36].map((months) => (
                    <button
                      type="button"
                      key={months}
                      onClick={() => setWarrantyMonths(months)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                        warrantyMonths === months
                          ? 'bg-blue-600 text-white border-blue-700'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {months === 0 ? 'Kafolatsiz' : `${months} oy`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Technicians Section */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <HardHat className="w-4 h-4 text-amber-500" />
                    Biriktirilgan montajchi ustalar ({assignedTechnicians.length} ta):
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddTechnician(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <option value="">+ Usta qo&apos;shish</option>
                    {employees
                      .filter((e) => !assignedTechnicians.some((t) => t.id === e.id))
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.fullName} ({e.role})
                        </option>
                      ))}
                  </select>
                </div>

                {assignedTechnicians.length === 0 ? (
                  <div className="text-xs text-slate-400 italic">
                    Ushbu savdoga hali usta biriktirilmagan
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assignedTechnicians.map((t) => (
                      <div
                        key={t.id}
                        className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-100 block">
                            {t.fullName}
                          </span>
                          <span className="text-[10px] text-slate-500">{t.role} &bull; {t.phone}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-bold">$</span>
                            <input
                              type="number"
                              placeholder="0"
                              value={t.wageUSD || ''}
                              onChange={(e) => handleUpdateTechWage(t.id, 'wageUSD', parseFloat(e.target.value) || 0)}
                              className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1 text-xs font-mono font-bold text-right text-slate-900 dark:text-white"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              placeholder="So'm"
                              value={t.wageUZS || ''}
                              onChange={(e) => handleUpdateTechWage(t.id, 'wageUZS', parseInt(e.target.value) || 0)}
                              className="w-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1 text-xs font-mono font-bold text-right text-slate-900 dark:text-white"
                            />
                            <span className="text-[10px] text-slate-400">so&apos;m</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveTechnician(t.id)}
                            className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Kassir / Mas&apos;ul izohi:
                </label>
                <textarea
                  rows={2}
                  placeholder="Chek bo'yicha maxsus kelishuv yoki eslatmalar..."
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          )}

          {/* Grand Total Summary Box */}
          <div className="bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-200 dark:border-cyan-900/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs text-cyan-800 dark:text-cyan-300 font-medium block">
                Chekning yangilangan umumiy summasi:
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Avvalgi: {receipt.totalAmount.toLocaleString()} so&apos;m {newlyAddedTotal > 0 && `( +${newlyAddedTotal.toLocaleString()} qo'shildi )`}
              </span>
            </div>

            <div className="text-right">
              <div className="text-xl font-black text-cyan-700 dark:text-cyan-300 font-mono">
                {(receipt.totalAmount + newlyAddedTotal).toLocaleString()} so&apos;m
              </div>
              {exchangeRate > 0 && (
                <div className="text-xs font-bold text-slate-500 font-mono">
                  ~ ${((receipt.totalAmount + newlyAddedTotal) / exchangeRate).toFixed(2)} USD
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
            onClick={handleFinalSubmit}
            className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-600/30 transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>O&apos;zgarishlarni Saqlash</span>
          </button>
        </div>
      </div>
    </div>
  );
};
