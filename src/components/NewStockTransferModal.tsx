'use client';

import React, { useState, useEffect } from 'react';
import { Branch, Product, StockTransfer, StockTransferItem, Employee, Currency } from '../types';
import { 
  X, 
  ArrowRight, 
  Package, 
  Building2, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  Search, 
  Hash, 
  Calendar,
  Layers,
  ArrowLeftRight
} from 'lucide-react';
import { formatMoney, formatDualMoney } from '../utils/formatters';
import { 
  getProductStockForBranch, 
  getProductSerialsForBranch, 
  transferProductStock 
} from '../utils/productUtils';

interface NewStockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  currentBranch?: Branch | null;
  products: Product[];
  currentUser?: Employee | null;
  exchangeRate?: number;
  baseCurrency?: Currency;
  onSaveTransfer: (transfer: StockTransfer, updatedProducts: Product[]) => void;
}

export const NewStockTransferModal: React.FC<NewStockTransferModalProps> = ({
  isOpen,
  onClose,
  branches,
  currentBranch,
  products,
  currentUser,
  exchangeRate = 12850,
  baseCurrency = 'UZS',
  onSaveTransfer
}) => {
  const [fromBranchId, setFromBranchId] = useState<string>('');
  const [toBranchId, setToBranchId] = useState<string>('');
  const [transferItems, setTransferItems] = useState<StockTransferItem[]>([]);
  
  // Item selector state
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [transferQty, setTransferQty] = useState<number>(1);
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState<string>('');
  
  // Metadata state
  const [sentBy, setSentBy] = useState<string>('');
  const [receivedBy, setReceivedBy] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize branches and sender
  useEffect(() => {
    if (isOpen) {
      const activeBranches = branches.filter(b => b.status === 'active');
      const initialFrom = currentBranch?.id || activeBranches[0]?.id || '';
      setFromBranchId(initialFrom);
      
      const otherBranch = activeBranches.find(b => b.id !== initialFrom);
      setToBranchId(otherBranch?.id || '');
      
      setTransferItems([]);
      setSelectedProductId('');
      setTransferQty(1);
      setSelectedSerials([]);
      setProductSearch('');
      setSentBy(currentUser?.fullName || 'Kassir / Omborchi');
      setReceivedBy(otherBranch?.managerName || '');
      setNotes('');
      setErrorMessage(null);
    }
  }, [isOpen, branches, currentBranch, currentUser]);

  if (!isOpen) return null;

  const activeBranches = branches.filter(b => b.status === 'active');
  const defaultBranchId = branches.find(b => b.isMain)?.id || 'branch-1';
  const selectedProduct = products.find(p => p.id === selectedProductId);

  const selectedProductSourceStock = selectedProduct
    ? getProductStockForBranch(selectedProduct, fromBranchId, defaultBranchId)
    : 0;
  const selectedProductSourceSerials = selectedProduct
    ? getProductSerialsForBranch(selectedProduct, fromBranchId, defaultBranchId)
    : [];

  // Filter available products (exclude services, only tangible goods with stock > 0 in the source branch)
  const availableProducts = products.filter(p => {
    if (p.isService) return false;
    const stockInSource = getProductStockForBranch(p, fromBranchId, defaultBranchId);
    if (stockInSource <= 0) return false;
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  });

  // When a product is selected
  const handleSelectProduct = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setTransferQty(1);
      const branchSns = getProductSerialsForBranch(prod, fromBranchId, defaultBranchId);
      if (prod.hasSerialNumber && branchSns.length > 0) {
        setSelectedSerials([branchSns[0]]);
      } else {
        setSelectedSerials([]);
      }
    }
  };

  // Toggle serial number selection
  const handleToggleSerial = (sn: string) => {
    if (selectedSerials.includes(sn)) {
      const updated = selectedSerials.filter(s => s !== sn);
      setSelectedSerials(updated);
      setTransferQty(Math.max(1, updated.length));
    } else {
      const updated = [...selectedSerials, sn];
      setSelectedSerials(updated);
      setTransferQty(updated.length);
    }
  };

  // Add item to transfer basket
  const handleAddItem = () => {
    if (!selectedProduct) return;
    setErrorMessage(null);

    if (transferQty <= 0) {
      setErrorMessage("Miqdor 1 dan kam bo'lishi mumkin emas!");
      return;
    }

    if (transferQty > selectedProductSourceStock) {
      setErrorMessage(`Tanlangan filial omborida faqat ${selectedProductSourceStock} ta ${selectedProduct.unit} mavjud!`);
      return;
    }

    if (selectedProduct.hasSerialNumber && selectedSerials.length !== transferQty) {
      setErrorMessage(`Tanlangan seriya raqamlari soni (${selectedSerials.length}) ko'chirilayotgan miqdorga (${transferQty}) teng bo'lishi shart!`);
      return;
    }

    // Check if already added
    const existingIndex = transferItems.findIndex(i => i.productId === selectedProduct.id);
    if (existingIndex >= 0) {
      setErrorMessage("Ushbu mahsulot allaqachon qo'shilgan! O'chirib, qaytadan qo'shing.");
      return;
    }

    const newItem: StockTransferItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      sku: selectedProduct.sku,
      category: selectedProduct.category,
      quantity: transferQty,
      unit: selectedProduct.unit || 'dona',
      costPrice: selectedProduct.costPrice,
      retailPrice: selectedProduct.retailPrice,
      hasSerialNumber: selectedProduct.hasSerialNumber,
      serialNumbers: selectedProduct.hasSerialNumber ? [...selectedSerials] : undefined
    };

    setTransferItems([...transferItems, newItem]);
    setSelectedProductId('');
    setTransferQty(1);
    setSelectedSerials([]);
    setProductSearch('');
  };

  const handleRemoveItem = (index: number) => {
    setTransferItems(transferItems.filter((_, i) => i !== index));
  };

  // Submit transfer
  const handleSubmitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fromBranchId || !toBranchId) {
      setErrorMessage("Iltimos, chiqaruvchi va qabul qiluvchi filiallarni tanlang!");
      return;
    }

    if (fromBranchId === toBranchId) {
      setErrorMessage("Chiqaruvchi va qabul qiluvchi filial bir xil bo'lishi mumkin emas!");
      return;
    }

    if (transferItems.length === 0) {
      setErrorMessage("Hech bo'lmaganda 1 ta tovar ko'chirilishi shart!");
      return;
    }

    const fromBranch = branches.find(b => b.id === fromBranchId);
    const toBranch = branches.find(b => b.id === toBranchId);

    const totalQty = transferItems.reduce((acc, it) => acc + it.quantity, 0);
    const totalAmountUZS = transferItems.reduce((acc, it) => acc + ((it.retailPrice || 0) * it.quantity), 0);
    const totalAmountUSD = Number((totalAmountUZS / exchangeRate).toFixed(2));

    const newTransfer: StockTransfer = {
      id: `tr-${Date.now()}`,
      transferNumber: `TR-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toLocaleString('uz-UZ', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      }).replace(',', ''),
      fromBranchId,
      fromBranchName: fromBranch?.name || 'Chiqaruvchi Filial',
      toBranchId,
      toBranchName: toBranch?.name || 'Qabul Qiluvchi Filial',
      items: transferItems,
      totalQuantity: totalQty,
      totalAmountUZS,
      totalAmountUSD,
      sentBy: sentBy.trim() || 'Kassir',
      receivedBy: receivedBy.trim() || toBranch?.managerName || 'Mas\'ul xodim',
      status: 'completed',
      notes: notes.trim() || undefined
    };

    // Move stock and transferred serial numbers between branches
    const updatedProducts = products.map(prod => {
      const transferred = transferItems.find(it => it.productId === prod.id);
      if (!transferred) return prod;

      return transferProductStock(
        prod,
        fromBranchId,
        toBranchId,
        transferred.quantity,
        transferred.serialNumbers || [],
        defaultBranchId
      );
    });

    onSaveTransfer(newTransfer, updatedProducts);
    onClose();
  };

  const totalTransferQty = transferItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalTransferSum = transferItems.reduce((sum, i) => sum + ((i.retailPrice || 0) * i.quantity), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight flex items-center gap-2">
                <span>Filiallararo Peremesheniya (Tovar Ko&apos;chirish)</span>
              </h3>
              <p className="text-xs text-purple-200">
                Tovarlarni bir filial omboridan boshqa filial omboriga rasmiylashtirish
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-purple-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmitTransfer} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Route Selector: From Branch -> To Branch */}
          <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              1. Ko&apos;chirish Marshruti (Filiallar)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Chiqaruvchi Filial (Qayerdan):
                </label>
                <div className="relative">
                  <select
                    value={fromBranchId}
                    onChange={(e) => setFromBranchId(e.target.value)}
                    required
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {activeBranches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code}){b.isMain ? ' - Asosiy' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Qabul Qiluvchi Filial (Qayerga):
                </label>
                <div className="relative">
                  <select
                    value={toBranchId}
                    onChange={(e) => setToBranchId(e.target.value)}
                    required
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- Filialni tanlang --</option>
                    {activeBranches
                      .filter(b => b.id !== fromBranchId)
                      .map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Product Picker & Serial Numbers */}
          <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              2. Ko&apos;chiriladigan Mahsulotni Tanlash
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Product Search & Select */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mahsulotni tanlang (Qoldig&apos;i bor tovarlar):
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleSelectProduct(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- Mahsulotni tanlang ({availableProducts.length} ta) --</option>
                  {availableProducts.map(p => {
                    const bStock = getProductStockForBranch(p, fromBranchId, defaultBranchId);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} (Qoldiq: {bStock} {p.unit}) - {formatMoney(p.retailPrice, baseCurrency, exchangeRate)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Miqdori ({selectedProduct?.unit || 'dona'}):
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedProductSourceStock || 1}
                  value={transferQty}
                  onChange={(e) => setTransferQty(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={!selectedProduct || (selectedProduct?.hasSerialNumber && selectedProductSourceSerials.length > 0)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Serial Numbers Checkbox Selector if product has serials */}
            {selectedProduct && selectedProduct.hasSerialNumber && selectedProductSourceSerials.length > 0 && (
              <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" />
                    <span>Ko&apos;chirilayotgan Seriya Raqamlarini (S/N) Tanlang:</span>
                  </span>
                  <span className="font-mono text-purple-700 dark:text-purple-300 font-bold">
                    Tanlandi: {selectedSerials.length} / {selectedProductSourceStock} ta
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                  {selectedProductSourceSerials.map(sn => {
                    const isSelected = selectedSerials.includes(sn);
                    return (
                      <button
                        key={sn}
                        type="button"
                        onClick={() => handleToggleSerial(sn)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1 ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-purple-400'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{sn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add to list button */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddItem}
                disabled={!selectedProduct}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>Ro&apos;yxatga Qo&apos;shish</span>
              </button>
            </div>
          </div>

          {/* 3. Basket Table: Items added to transfer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                3. Ko&apos;chirish Ro&apos;yxati ({transferItems.length} ta mahsulot)
              </span>
              {transferItems.length > 0 && (
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono">
                  Jami: {totalTransferQty} dona &bull; {formatDualMoney(totalTransferSum, baseCurrency, exchangeRate).primary}
                </span>
              )}
            </div>

            {transferItems.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
                Hozircha hech qanday tovar qo&apos;shilmadi. Yuqoridagi bo&apos;limdan mahsulot tanlang.
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Mahsulot Nomi</th>
                      <th className="py-2.5 px-3 text-center">Miqdor</th>
                      <th className="py-2.5 px-3 text-right">Narxi</th>
                      <th className="py-2.5 px-3 text-right">Jami Summa</th>
                      <th className="py-2.5 px-3 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                    {transferItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 dark:text-white">{item.productName}</div>
                          {item.serialNumbers && item.serialNumbers.length > 0 && (
                            <div className="text-[10px] text-purple-600 dark:text-purple-400 font-mono mt-0.5">
                              S/N: {item.serialNumbers.join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold font-mono text-slate-800 dark:text-slate-200">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                          {formatMoney(item.retailPrice || 0, baseCurrency, exchangeRate)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                          {formatMoney((item.retailPrice || 0) * item.quantity, baseCurrency, exchangeRate)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 4. Responsible Persons & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Topshiruvchi Mas&apos;ul:
              </label>
              <input
                type="text"
                value={sentBy}
                onChange={(e) => setSentBy(e.target.value)}
                placeholder="Farrux Aliyev"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Qabul Qiluvchi Mas&apos;ul:
              </label>
              <input
                type="text"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                placeholder="Jamshid Normurodov"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Sabab / Izoh (Ixtiyoriy):
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Zaxira to'ldirish uchun"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Footer Submit Button */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              * Tasdiqlangandan so&apos;ng chiqaruvchi ombordan tovarlar avtomatik yechiladi
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Bekor Qilish
              </button>
              
              <button
                type="submit"
                disabled={transferItems.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-600/25 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Peremesheniyani Tasdiqlash & Yakunlash</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
