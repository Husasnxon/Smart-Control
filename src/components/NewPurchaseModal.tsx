'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, ProductCategory, PurchaseInvoice, PurchaseItem, PurchasePaymentRecord, Currency, Employee } from '../types';
import { DEFAULT_SUPPLIERS } from '../data/mockData';
import { formatNumberWithSpaces, formatUSDNumber } from '../utils/formatters';
import { 
  X, 
  Plus, 
  Trash2, 
  Barcode, 
  Truck, 
  DollarSign, 
  Check, 
  AlertTriangle, 
  Search, 
  Building2, 
  CreditCard, 
  Banknote, 
  Calendar, 
  Layers, 
  ArrowRight, 
  PackagePlus, 
  Hash, 
  ChevronDown, 
  Cpu, 
  Package,
  Lock,
  ShieldCheck,
  Phone,
  MapPin
} from 'lucide-react';

interface SupplierRecord {
  name: string;
  phone?: string;
  address?: string;
}

interface NewPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: ProductCategory[];
  exchangeRate: number;
  baseCurrency?: Currency;
  currentUser?: Employee | null;
  onConfirmPurchase: (purchase: PurchaseInvoice, updatedProducts: Product[]) => void;
  editingPurchase?: PurchaseInvoice | null;
}

interface DraftPurchaseItem {
  id: string; // Temporary ID for list key
  productId: string;
  productName: string;
  category: string;
  sku: string;
  quantity: number;
  unit: string;
  costPrice: number;       // So'm
  costPriceUSD: number;    // $
  retailPrice: number;     // So'm
  retailPriceUSD: number;  // $
  hasSerialNumber: boolean;
  serialNumbers: string[];
  manualSerialInput: string;
  isBulkPasteOpen?: boolean;
  bulkPasteText?: string;
}

const generatePurchaseInvoiceNumber = () => `PR-${1000 + Math.floor(Math.random() * 9000)}`;
const generatePurchaseInvoiceId = () => `purch-${Date.now()}`;

export const NewPurchaseModal: React.FC<NewPurchaseModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  exchangeRate,
  baseCurrency = 'UZS',
  currentUser = null,
  onConfirmPurchase,
  editingPurchase = null
}) => {
  // Saved suppliers persistent state
  const [savedSuppliers, setSavedSuppliers] = useState<SupplierRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('sc_suppliers_v2');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error("Error loading suppliers", e);
      }
    }
    return DEFAULT_SUPPLIERS.map(s => ({ name: s, phone: '+998 ' }));
  });

  // Add new supplier modal state
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('+998 ');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');

  // Formatted logged in user name and role for permanent audit liability
  const loggedInUserFormatted = useMemo(() => {
    if (!currentUser) return 'Omborchi (Mas\'ul xodim)';
    const name = currentUser.fullName || currentUser.username || 'Xodim';
    const role = currentUser.role || (currentUser.systemRole === 'admin' ? 'Bosh Administrator' : currentUser.systemRole === 'manager' ? 'Menejer' : currentUser.systemRole || 'Omborchi');
    return `${name} (${role})`;
  }, [currentUser]);

  // Invoice header state
  const [supplierName, setSupplierName] = useState(DEFAULT_SUPPLIERS[0]);
  const [supplierSearchText, setSupplierSearchText] = useState(DEFAULT_SUPPLIERS[0] || '');
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  const [customSupplier, setCustomSupplier] = useState('');
  const [isCustomSupplier, setIsCustomSupplier] = useState(false);
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('+998 ');
  const [warehouseName, setWarehouseName] = useState('Asosiy Ombor');
  const [invoiceCurrency, setInvoiceCurrency] = useState<'USD' | 'UZS'>(baseCurrency);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'debt' | 'partial'>('paid');
  const [paymentMethod, setPaymentMethod] = useState<'usd' | 'bank_transfer' | 'cash' | 'card'>(baseCurrency === 'USD' ? 'usd' : 'cash');
  const [notes, setNotes] = useState('');
  const [receivedBy, setReceivedBy] = useState('Omborchi (Mas\'ul xodim)');
  const [customPaidAmount, setCustomPaidAmount] = useState<string>('');

  // Close supplier dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target as Node)) {
        setIsSupplierDropdownOpen(false);
      }
    };
    if (isSupplierDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSupplierDropdownOpen]);

  const availableSuppliers = useMemo(() => {
    const list: string[] = savedSuppliers.map(s => s.name);
    DEFAULT_SUPPLIERS.forEach(s => {
      if (!list.includes(s)) list.push(s);
    });
    if (editingPurchase && !list.includes(editingPurchase.supplierName)) {
      list.unshift(editingPurchase.supplierName);
    }
    return Array.from(new Set(list));
  }, [savedSuppliers, editingPurchase]);

  const filteredSuppliers = useMemo(() => {
    const q = supplierSearchText.trim().toLowerCase();
    if (!q) return availableSuppliers;
    return availableSuppliers.filter((s) => s.toLowerCase().includes(q));
  }, [availableSuppliers, supplierSearchText]);

  // Items table state
  const [items, setItems] = useState<DraftPurchaseItem[]>([]);
  const [productSearchText, setProductSearchText] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

  // Sync initial state when modal opens or editingPurchase changes
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (editingPurchase) {
        // Populate existing purchase data for editing
        setSupplierName(editingPurchase.supplierName);
        setSupplierSearchText(editingPurchase.supplierName);
        if (DEFAULT_SUPPLIERS.includes(editingPurchase.supplierName)) {
          setIsCustomSupplier(false);
          setCustomSupplier('');
        } else {
          setIsCustomSupplier(true);
          setCustomSupplier(editingPurchase.supplierName);
        }
        setSupplierInvoiceNumber(editingPurchase.supplierInvoiceNumber || '');
        setSupplierPhone(editingPurchase.supplierPhone || '+998 ');
        setWarehouseName(editingPurchase.warehouseName || 'Asosiy Ombor');
        setInvoiceCurrency(editingPurchase.currency);
        setPaymentStatus(editingPurchase.paymentStatus);
        if (editingPurchase.paymentStatus === 'partial') {
          if (editingPurchase.currency === 'USD') {
            const pUSD = editingPurchase.paidAmountUSD ?? (editingPurchase.paidAmount ? Number((editingPurchase.paidAmount / (editingPurchase.exchangeRate || exchangeRate)).toFixed(2)) : 0);
            setCustomPaidAmount(pUSD > 0 ? String(pUSD) : '');
          } else {
            const pUZS = editingPurchase.paidAmount ?? 0;
            setCustomPaidAmount(pUZS > 0 ? String(pUZS) : '');
          }
        } else {
          setCustomPaidAmount('');
        }
        setPaymentMethod(editingPurchase.paymentMethod || (editingPurchase.currency === 'USD' ? 'usd' : 'cash'));
        setNotes(editingPurchase.notes || '');
        setReceivedBy(editingPurchase.receivedBy || loggedInUserFormatted);

        // Populate items
        const mappedItems: DraftPurchaseItem[] = editingPurchase.items.map((it, idx) => ({
          id: `item-edit-${idx}-${Date.now()}`,
          productId: it.productId,
          productName: it.productName,
          category: it.category || categories[0]?.name || 'Kuzatuv kameralari (CCTV)',
          sku: it.sku || '',
          quantity: it.quantity,
          unit: it.unit || 'dona',
          costPrice: it.costPrice,
          costPriceUSD: it.costPriceUSD || Number((it.costPrice / exchangeRate).toFixed(2)),
          retailPrice: it.retailPrice,
          retailPriceUSD: it.retailPriceUSD || Number((it.retailPrice / exchangeRate).toFixed(2)),
          hasSerialNumber: !!it.hasSerialNumber,
          serialNumbers: it.serialNumbers ? [...it.serialNumbers] : [],
          manualSerialInput: '',
          isBulkPasteOpen: false,
          bulkPasteText: ''
        }));
        setItems(mappedItems);
      } else {
        // Reset to fresh purchase
        setSupplierName(DEFAULT_SUPPLIERS[0]);
        setCustomSupplier('');
        setIsCustomSupplier(false);
        setSupplierInvoiceNumber('');
        setSupplierPhone('+998 ');
        setWarehouseName('Asosiy Ombor');
        setInvoiceCurrency(baseCurrency);
        setPaymentStatus('paid');
        setCustomPaidAmount('');
        setPaymentMethod(baseCurrency === 'USD' ? 'usd' : 'cash');
        setNotes('');
        setReceivedBy(loggedInUserFormatted);
        setItems([]);
      }
      setProductSearchText('');
      setIsSearchDropdownOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen, editingPurchase, baseCurrency, exchangeRate, categories, loggedInUserFormatted]);

  // Add new custom supplier to list and select it
  const handleCreateSupplier = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = newSupplierName.trim();
    if (!trimmedName) return;

    const phoneVal = newSupplierPhone.trim() && newSupplierPhone.trim() !== '+998' ? newSupplierPhone.trim() : '+998 ';
    const newEntry: SupplierRecord = {
      name: trimmedName,
      phone: phoneVal,
      address: newSupplierAddress.trim() || undefined
    };

    const updatedSuppliers = [newEntry, ...savedSuppliers.filter(s => s.name.toLowerCase() !== trimmedName.toLowerCase())];
    setSavedSuppliers(updatedSuppliers);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sc_suppliers_v2', JSON.stringify(updatedSuppliers));
      } catch (err) {
        console.error("Failed to save supplier to localStorage", err);
      }
    }

    setSupplierName(trimmedName);
    setSupplierSearchText(trimmedName);
    if (phoneVal && phoneVal !== '+998 ') {
      setSupplierPhone(phoneVal);
    }
    setIsAddSupplierModalOpen(false);
    setNewSupplierName('');
    setNewSupplierPhone('+998 ');
    setNewSupplierAddress('');
    setIsSupplierDropdownOpen(false);
  };

  const handleCurrencyChange = (newCurr: 'USD' | 'UZS') => {
    if (newCurr !== invoiceCurrency && customPaidAmount) {
      const val = parseFloat(customPaidAmount);
      if (!isNaN(val) && val > 0) {
        if (newCurr === 'UZS') {
          setCustomPaidAmount(String(Math.round(val * exchangeRate)));
        } else {
          setCustomPaidAmount(String(Number((val / exchangeRate).toFixed(2))));
        }
      }
    }
    setInvoiceCurrency(newCurr);
    if (newCurr === 'UZS' && paymentMethod === 'usd') {
      setPaymentMethod('cash');
    } else if (newCurr === 'USD' && paymentMethod !== 'usd') {
      setPaymentMethod('usd');
    }
  };

  const handlePaymentStatusChange = (newStatus: 'paid' | 'debt' | 'partial') => {
    setPaymentStatus(newStatus);
    if (newStatus === 'partial' && (!customPaidAmount || Number(customPaidAmount) <= 0)) {
      const half = invoiceCurrency === 'USD' 
        ? Number((totalAmountUSD / 2).toFixed(2)) 
        : Math.round(totalAmountUZS / 2);
      setCustomPaidAmount(half > 0 ? String(half) : '');
    }
  };

  // Collect all existing serial numbers across inventory to detect duplicates
  const existingWarehouseSerials = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      (p.serialNumbers || []).forEach((sn) => set.add(sn.trim().toUpperCase()));
    });
    return set;
  }, [products]);

  // Filter matched products based on user search (model, name, sku, barcode, S/N)
  const matchedProducts = useMemo(() => {
    const q = productSearchText.trim().toLowerCase();
    const physicalOnly = products.filter((p) => !p.isService);
    if (!q) {
      return physicalOnly;
    }
    return physicalOnly.filter((p) => 
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.serialNumbers && p.serialNumbers.some(sn => sn.toLowerCase().includes(q)))
    );
  }, [products, productSearchText]);

  if (!isOpen) return null;

  // Add an existing product to items
  const handleAddProductItem = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    // Default cost and retail based on exchangeRate
    const costUZS = prod.costPrice || 0;
    const costUSD = prod.costPriceUSD || Number((costUZS / exchangeRate).toFixed(2));
    const retailUZS = prod.retailPrice || 0;
    const retailUSD = prod.retailPriceUSD || Number((retailUZS / exchangeRate).toFixed(2));

    const newItem: DraftPurchaseItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      productId: prod.id,
      productName: prod.name,
      category: prod.category,
      sku: prod.sku,
      quantity: 1,
      unit: prod.unit || 'dona',
      costPrice: costUZS,
      costPriceUSD: costUSD,
      retailPrice: retailUZS,
      retailPriceUSD: retailUSD,
      hasSerialNumber: !!prod.hasSerialNumber,
      serialNumbers: [],
      manualSerialInput: '',
      isBulkPasteOpen: false,
      bulkPasteText: ''
    };

    setItems((prev) => [...prev, newItem]);
    setProductSearchText('');
    setIsSearchDropdownOpen(false);
  };

  // Add custom non-catalog new product directly
  const handleAddCustomNewProduct = (initialName?: string) => {
    const newSku = `SKU-${Date.now().toString().slice(-4)}`;
    const costUSD = 25;
    const costUZS = Math.round(costUSD * exchangeRate);
    const retailUSD = 35;
    const retailUZS = Math.round(retailUSD * exchangeRate);

    const newItem: DraftPurchaseItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      productId: `prod-new-${Date.now()}`,
      productName: initialName?.trim() || 'Yangi Qurilma',
      category: categories[0]?.name || 'Kuzatuv kameralari (CCTV)',
      sku: newSku,
      quantity: 1,
      unit: 'dona',
      costPrice: costUZS,
      costPriceUSD: costUSD,
      retailPrice: retailUZS,
      retailPriceUSD: retailUSD,
      hasSerialNumber: true,
      serialNumbers: [],
      manualSerialInput: '',
      isBulkPasteOpen: false,
      bulkPasteText: ''
    };
    setItems((prev) => [...prev, newItem]);
    setProductSearchText('');
    setIsSearchDropdownOpen(false);
  };

  // Update item field
  const handleUpdateItem = <K extends keyof DraftPurchaseItem,>(
    index: number,
    field: K,
    value: DraftPurchaseItem[K]
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      // Sync USD <-> UZS automatically when either is edited
      if (field === 'costPriceUSD') {
        item.costPrice = Math.round(Number(value) * exchangeRate);
      } else if (field === 'costPrice') {
        item.costPriceUSD = Number((Number(value) / exchangeRate).toFixed(2));
      } else if (field === 'retailPriceUSD') {
        item.retailPrice = Math.round(Number(value) * exchangeRate);
      } else if (field === 'retailPrice') {
        item.retailPriceUSD = Number((Number(value) / exchangeRate).toFixed(2));
      }

      updated[index] = item;
      return updated;
    });
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Add single S/N via scanner or enter
  const handleAddSingleSerial = (index: number) => {
    const item = items[index];
    const sn = item.manualSerialInput.trim();
    if (!sn) return;

    if (item.serialNumbers.includes(sn)) {
      alert(`"${sn}" seriya raqami bu tovar uchun allaqachon kiritilgan!`);
      return;
    }

    const updatedSerials = [...item.serialNumbers, sn];
    // If entered serials exceeds quantity, automatically bump quantity
    const newQty = Math.max(item.quantity, updatedSerials.length);

    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        serialNumbers: updatedSerials,
        quantity: newQty,
        manualSerialInput: ''
      };
      return copy;
    });
  };

  // Batch paste serial numbers from Excel or text
  const handleApplyBulkSerials = (index: number) => {
    const item = items[index];
    const raw = item.bulkPasteText || '';
    if (!raw.trim()) return;

    // Split by newlines, commas, semicolons, tabs or spaces
    const tokens = raw
      .split(/[\r\n,;\t]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const merged = Array.from(new Set([...item.serialNumbers, ...tokens]));
    const newQty = Math.max(item.quantity, merged.length);

    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        serialNumbers: merged,
        quantity: newQty,
        isBulkPasteOpen: false,
        bulkPasteText: ''
      };
      return copy;
    });
  };

  // Remove a single S/N chip
  const handleRemoveSerialChip = (itemIndex: number, serialToRemove: string) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[itemIndex] = {
        ...copy[itemIndex],
        serialNumbers: copy[itemIndex].serialNumbers.filter((s) => s !== serialToRemove)
      };
      return copy;
    });
  };

  // Total invoice calculations
  const totalQuantity = items.reduce((sum, it) => sum + (it.quantity || 0), 0);
  const totalAmountUZS = items.reduce((sum, it) => sum + (it.quantity * it.costPrice), 0);
  const totalAmountUSD = items.reduce((sum, it) => sum + (it.quantity * it.costPriceUSD), 0);

  // Paid and remaining debt calculations
  const numericPaidInput = Math.max(0, parseFloat(customPaidAmount) || 0);

  let currentPaidUSD = 0;
  let currentPaidUZS = 0;
  let currentDebtUSD = 0;
  let currentDebtUZS = 0;

  if (paymentStatus === 'paid') {
    currentPaidUSD = Number(totalAmountUSD.toFixed(2));
    currentPaidUZS = totalAmountUZS;
    currentDebtUSD = 0;
    currentDebtUZS = 0;
  } else if (paymentStatus === 'debt') {
    currentPaidUSD = 0;
    currentPaidUZS = 0;
    currentDebtUSD = Number(totalAmountUSD.toFixed(2));
    currentDebtUZS = totalAmountUZS;
  } else {
    // partial
    if (invoiceCurrency === 'USD') {
      currentPaidUSD = Number(Math.min(totalAmountUSD, numericPaidInput).toFixed(2));
      currentPaidUZS = Math.round(currentPaidUSD * exchangeRate);
    } else {
      currentPaidUZS = Math.min(totalAmountUZS, Math.round(numericPaidInput));
      currentPaidUSD = Number((currentPaidUZS / exchangeRate).toFixed(2));
    }
    currentDebtUSD = Number(Math.max(0, totalAmountUSD - currentPaidUSD).toFixed(2));
    currentDebtUZS = Math.max(0, totalAmountUZS - currentPaidUZS);
  }

  // Submit and apply purchase to inventory
  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      alert("Iltimos, omborga kirim qilish uchun kamida bitta tovar qo'shing!");
      return;
    }

    // Check if any serialized items lack serial numbers
    for (const it of items) {
      if (it.hasSerialNumber && it.serialNumbers.length === 0) {
        const proceed = confirm(
          `"${it.productName}" mahsuloti seriya raqamli hisoblanadi, lekin bironorta ham S/N kiritilmagan. Davom ettirilsinmi?`
        );
        if (!proceed) return;
      }
    }

    const finalSupplier = (supplierSearchText.trim() || supplierName.trim() || (isCustomSupplier ? customSupplier.trim() : '') || 'Noma\'lum Yetkazib beruvchi');
    const invNumber = editingPurchase ? editingPurchase.invoiceNumber : generatePurchaseInvoiceNumber();

    const purchaseItems: PurchaseItem[] = items.map((it) => ({
      productId: it.productId,
      productName: it.productName,
      category: it.category,
      sku: it.sku,
      quantity: it.quantity,
      unit: it.unit,
      costPrice: it.costPrice,
      costPriceUSD: it.costPriceUSD,
      retailPrice: it.retailPrice,
      retailPriceUSD: it.retailPriceUSD,
      totalCost: it.quantity * it.costPrice,
      hasSerialNumber: it.hasSerialNumber,
      serialNumbers: it.serialNumbers
    }));

    const finalInvoice: PurchaseInvoice = {
      id: editingPurchase ? editingPurchase.id : generatePurchaseInvoiceId(),
      invoiceNumber: invNumber,
      supplierInvoiceNumber: supplierInvoiceNumber.trim() || undefined,
      supplierName: finalSupplier,
      supplierPhone: supplierPhone.trim() || undefined,
      createdAt: editingPurchase ? editingPurchase.createdAt : new Date().toISOString().replace('T', ' ').slice(0, 16),
      warehouseName,
      currency: invoiceCurrency,
      exchangeRate,
      items: purchaseItems,
      totalQuantity,
      totalAmount: totalAmountUZS,
      totalAmountUSD: Number(totalAmountUSD.toFixed(2)),
      paymentStatus,
      paymentMethod,
      paidAmount: currentPaidUZS,
      paidAmountUSD: currentPaidUSD,
      debtAmount: currentDebtUZS,
      debtAmountUSD: currentDebtUSD,
      payments: editingPurchase?.payments || [],
      status: editingPurchase ? editingPurchase.status : 'received',
      notes: notes.trim() || undefined,
      receivedBy: editingPurchase ? (editingPurchase.receivedBy || loggedInUserFormatted) : loggedInUserFormatted,
      receivedById: currentUser?.id
    };

    // Calculate updated products state
    const updatedProducts = [...products];

    // If editing an existing purchase invoice, first revert its old items from inventory
    if (editingPurchase) {
      editingPurchase.items.forEach((oldItem) => {
        const existingIdx = updatedProducts.findIndex((p) => p.id === oldItem.productId);
        if (existingIdx >= 0) {
          const existing = updatedProducts[existingIdx];
          const oldSerialsSet = new Set(oldItem.serialNumbers || []);
          const revertedSerials = (existing.serialNumbers || []).filter((sn) => !oldSerialsSet.has(sn));

          updatedProducts[existingIdx] = {
            ...existing,
            stockQuantity: Math.max(0, existing.stockQuantity - oldItem.quantity),
            serialNumbers: revertedSerials
          };
        }
      });
    }

    // Now apply current purchase items into inventory
    items.forEach((item) => {
      const existingIdx = updatedProducts.findIndex((p) => p.id === item.productId);

      if (existingIdx >= 0) {
        const existing = updatedProducts[existingIdx];
        const existingSerials = existing.serialNumbers || [];
        // Append new serial numbers without duplicating
        const newSerialsCombined = Array.from(new Set([...existingSerials, ...item.serialNumbers]));

        updatedProducts[existingIdx] = {
          ...existing,
          name: item.productName || existing.name,
          category: item.category || existing.category,
          stockQuantity: existing.stockQuantity + item.quantity,
          costPrice: item.costPrice > 0 ? item.costPrice : existing.costPrice,
          costPriceUSD: item.costPriceUSD > 0 ? item.costPriceUSD : existing.costPriceUSD,
          retailPrice: item.retailPrice > 0 ? item.retailPrice : existing.retailPrice,
          retailPriceUSD: item.retailPriceUSD > 0 ? item.retailPriceUSD : existing.retailPriceUSD,
          hasSerialNumber: existing.hasSerialNumber || item.hasSerialNumber,
          serialNumbers: newSerialsCombined
        };
      } else {
        // Create new catalog product if added as a new product in invoice
        const newProduct: Product = {
          id: item.productId,
          barcode: `${Date.now().toString().slice(-12)}`,
          sku: item.sku || `SKU-${Date.now().toString().slice(-4)}`,
          name: item.productName,
          category: item.category || categories[0]?.name || 'Kuzatuv kameralari (CCTV)',
          costPrice: item.costPrice,
          costPriceUSD: item.costPriceUSD,
          retailPrice: item.retailPrice,
          retailPriceUSD: item.retailPriceUSD,
          wholesalePrice: Math.round(item.retailPrice * 0.9),
          stockQuantity: item.quantity,
          minStockAlert: 2,
          unit: item.unit || 'dona',
          hasSerialNumber: item.hasSerialNumber,
          serialNumbers: item.serialNumbers,
          warrantyMonths: 24,
          isService: false
        };
        updatedProducts.push(newProduct);
      }
    });

    onConfirmPurchase(finalInvoice, updatedProducts);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-600/10 text-cyan-600 flex items-center justify-center">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {editingPurchase ? `Kirim Nakladnoyini Tahrirlash (${editingPurchase.invoiceNumber})` : "Omborga Yangi Kirim (Приход / Nakladnoy)"}
              </h3>
              <p className="text-xs text-slate-500">
                {editingPurchase
                  ? "Yetkazib beruvchidan kelgan nakladnoy ma'lumotlari, narxlar va seriya raqamlarini o'zgartirish"
                  : "Yetkazib beruvchidan kelgan tovarlar partiyasini va seriya raqamlarini (S/N) qabul qilish"}
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmitPurchase} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Section 1: Invoice & Supplier Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            {/* Supplier */}
            {/* Supplier Searchable Combobox */}
            <div className="md:col-span-2 relative" ref={supplierDropdownRef}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-600" />
                  * Yetkazib beruvchi (Ta&apos;minotchi):
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setNewSupplierName(supplierSearchText !== DEFAULT_SUPPLIERS[0] ? supplierSearchText : '');
                    setNewSupplierPhone('+998 ');
                    setNewSupplierAddress('');
                    setIsAddSupplierModalOpen(true);
                  }}
                  className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center gap-1 bg-cyan-50 dark:bg-cyan-950/50 px-2 py-0.5 rounded-md border border-cyan-200 dark:border-cyan-800 transition"
                  title="Yangi ta'minotchi kiritish"
                >
                  <Plus className="w-3 h-3" />
                  + Yangi Ta&apos;minotchi
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={supplierSearchText}
                  onChange={(e) => {
                    setSupplierSearchText(e.target.value);
                    setSupplierName(e.target.value);
                    setIsSupplierDropdownOpen(true);
                  }}
                  onFocus={(e) => {
                    e.target.select();
                    setIsSupplierDropdownOpen(true);
                  }}
                  onClick={(e) => {
                    (e.target as HTMLInputElement).select();
                    setIsSupplierDropdownOpen(true);
                  }}
                  placeholder="Ta'minotchi nomini qidiring yoki yangisini yozing..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-8 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setIsSupplierDropdownOpen(!isSupplierDropdownOpen)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSupplierDropdownOpen ? 'rotate-180 text-cyan-600' : ''}`} />
                </button>
              </div>

              {/* Autocomplete / Search Dropdown */}
              {isSupplierDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto p-1 space-y-0.5 animate-in fade-in-50 zoom-in-95 duration-100">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span>Mavjud Ta&apos;minotchilar ({filteredSuppliers.length})</span>
                    <button
                      type="button"
                      onClick={() => {
                        setNewSupplierName(supplierSearchText !== DEFAULT_SUPPLIERS[0] ? supplierSearchText : '');
                        setIsAddSupplierModalOpen(true);
                      }}
                      className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5 font-semibold"
                    >
                      <Plus className="w-2.5 h-2.5" /> Yangi
                    </button>
                  </div>

                  {filteredSuppliers.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400 space-y-1.5">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block truncate">
                        &quot;{supplierSearchText}&quot; topilmadi
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setNewSupplierName(supplierSearchText.trim());
                          setIsAddSupplierModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white font-bold text-xs inline-flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="w-3 h-3" />
                        Ta&apos;minotchi sifatida saqlash
                      </button>
                    </div>
                  ) : (
                    <>
                      {filteredSuppliers.map((s) => {
                        const isSelected = s.toLowerCase() === supplierSearchText.toLowerCase();
                        const record = savedSuppliers.find(r => r.name.toLowerCase() === s.toLowerCase());
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setSupplierName(s);
                              setSupplierSearchText(s);
                              if (record?.phone && record.phone.trim() !== '+998') {
                                setSupplierPhone(record.phone.trim());
                              }
                              setIsSupplierDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition ${
                              isSelected
                                ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-200 dark:border-cyan-800'
                                : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex flex-col truncate">
                              <span className="truncate">{s}</span>
                              {record?.phone && record.phone !== '+998 ' && (
                                <span className="text-[10px] text-slate-400 font-mono">{record.phone}</span>
                              )}
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600 shrink-0" />}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          setNewSupplierName(supplierSearchText.trim() !== DEFAULT_SUPPLIERS[0] ? supplierSearchText.trim() : '');
                          setIsAddSupplierModalOpen(true);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs text-cyan-600 dark:text-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/30 hover:bg-cyan-100/50 border border-dashed border-cyan-300 dark:border-cyan-800 font-bold flex items-center gap-1.5 mt-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Yangi ta&apos;minotchi kiritish</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Supplier Invoice # */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Faktura / Nakladnoy №:
              </label>
              <input
                type="text"
                placeholder="Masalan: HIK-9942/UZ"
                value={supplierInvoiceNumber}
                onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Currency & Rate */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Hujjat Valyutasi & Kurs:
              </label>
              <div className="flex items-center gap-1.5">
                <select
                  value={invoiceCurrency}
                  onChange={(e) => handleCurrencyChange(e.target.value as 'USD' | 'UZS')}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold text-cyan-600 outline-none"
                >
                  <option value="UZS">So&apos;m (UZS)</option>
                  <option value="USD">Dollar ($ USD)</option>
                </select>
                <span className="text-[10px] font-mono text-slate-400">
                  1$ = {formatNumberWithSpaces(exchangeRate)}
                </span>
              </div>
            </div>

            {/* Warehouse */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Qabul qiluvchi Ombor:
              </label>
              <input
                type="text"
                value={warehouseName}
                onChange={(e) => setWarehouseName(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-semibold text-slate-900 dark:text-white outline-none"
              />
            </div>

            {/* Received by (Locked for audit & personal accountability) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-500" />
                  * Qabul qiluvchi mas&apos;ul:
                </label>
                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tight flex items-center gap-0.5">
                  Moddiy javobgar
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  disabled
                  value={receivedBy}
                  className="w-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg pl-7 pr-2 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-not-allowed select-none opacity-95"
                  title="Tizimga kirgan xodim hisobidan avtomatik olinadi va o'zgartirib bo'lmaydi"
                />
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 font-medium">
                <Lock className="w-2.5 h-2.5 shrink-0" />
                Tizim hisobi avtomatik biriktirilgan (o&apos;zgartirib bo&apos;lmaydi)
              </p>
            </div>

            {/* Payment status */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                To&apos;lov holati:
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => handlePaymentStatusChange(e.target.value as 'paid' | 'debt' | 'partial')}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="paid">✓ To&apos;liq to&apos;landi</option>
                <option value="debt">⏳ Nasiya (Yetkazib beruvchidan qarz)</option>
                <option value="partial">Aralash / Qisman to&apos;landi</option>
              </select>
            </div>

            {/* Payment method */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                To&apos;lov usuli:
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PurchasePaymentRecord['paymentMethod'])}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
              >
                {invoiceCurrency === 'UZS' ? (
                  <>
                    <option value="cash">Naqd So&apos;m</option>
                    <option value="bank_transfer">Bank hisob-raqam / O&apos;tkazma (Perechisleniye)</option>
                    <option value="card">Karta / Korporativ</option>
                    <option value="usd">Dollar ($ USD)</option>
                  </>
                ) : (
                  <>
                    <option value="usd">Dollar ($ USD)</option>
                    <option value="bank_transfer">Bank hisob-raqam / O&apos;tkazma</option>
                    <option value="cash">Naqd So&apos;m</option>
                    <option value="card">Karta / Korporativ</option>
                  </>
                )}
              </select>
            </div>

            {/* Partial Payment Input Banner */}
            {paymentStatus === 'partial' && (
              <div className="col-span-1 sm:col-span-2 lg:col-span-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                      %
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                        Qisman To&apos;lov Summasi (Oldindan to&apos;langan summa / Avans)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Hozir berilgan summani kiriting, qolgan qismi avtomatik ta&apos;minotchi qarziga yoziladi
                      </span>
                    </div>
                  </div>

                  {/* Quick percentage buttons */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <span className="text-[10px] text-slate-400 font-semibold mr-1">Tezkor:</span>
                    {[20, 30, 50, 70].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          const val = invoiceCurrency === 'USD' 
                            ? Number((totalAmountUSD * (pct / 100)).toFixed(2)) 
                            : Math.round(totalAmountUZS * (pct / 100));
                          setCustomPaidAmount(String(val));
                        }}
                        className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/60 text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Paid amount input */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Hozir to&apos;langan summa ({invoiceCurrency === 'USD' ? 'AQSH dollari $' : 'So\'m UZS'}):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max={invoiceCurrency === 'USD' ? totalAmountUSD : totalAmountUZS}
                        step={invoiceCurrency === 'USD' ? '0.01' : '1000'}
                        value={customPaidAmount}
                        onChange={(e) => setCustomPaidAmount(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                        placeholder="0.00"
                        className="w-full bg-white dark:bg-slate-900 border-2 border-amber-400/80 rounded-xl px-3 py-2 text-sm font-black font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-600 dark:text-amber-400">
                        {invoiceCurrency === 'USD' ? '$ USD' : 'UZS'}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">
                      ≈ {invoiceCurrency === 'USD' ? `${formatNumberWithSpaces(currentPaidUZS)} so'm` : `$${formatUSDNumber(currentPaidUSD)} USD`}
                    </div>
                  </div>

                  {/* Calculated Debt Display */}
                  <div className="bg-white/90 dark:bg-slate-900/90 rounded-xl p-2.5 border border-amber-200 dark:border-amber-900/50 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        Qolgan Qarzimiz (Ta&apos;minotchiga):
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                        Nasiya
                      </span>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <div className="text-base font-black font-mono text-rose-600 dark:text-rose-400">
                        {invoiceCurrency === 'USD' ? `$${formatUSDNumber(currentDebtUSD)}` : `${formatNumberWithSpaces(currentDebtUZS)} so'm`}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        ≈ {invoiceCurrency === 'USD' ? `${formatNumberWithSpaces(currentDebtUZS)} so'm` : `$${formatUSDNumber(currentDebtUSD)} USD`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Items Ingestion Table */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-600" />
                Kirim qilinayotgan tovarlar ro&apos;yxati ({items.length} ta pozitsiya):
              </span>

              {/* Searchable Add Product Tools */}
              <div className="flex items-center gap-2 flex-1 max-w-md relative">
                <div className="relative flex-1">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Model yoki tovar nomi (masalan: 1043, Hikvision)..."
                      value={productSearchText}
                      onChange={(e) => {
                        setProductSearchText(e.target.value);
                        setIsSearchDropdownOpen(true);
                      }}
                      onFocus={() => setIsSearchDropdownOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (matchedProducts.length > 0) {
                            handleAddProductItem(matchedProducts[0].id);
                          } else if (productSearchText.trim()) {
                            handleAddCustomNewProduct(productSearchText);
                          }
                        } else if (e.key === 'Escape') {
                          setIsSearchDropdownOpen(false);
                        }
                      }}
                      className="w-full bg-white dark:bg-slate-800 border-2 border-cyan-500/60 focus:border-cyan-500 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none shadow-sm"
                    />
                    {productSearchText ? (
                      <button
                        type="button"
                        onClick={() => {
                          setProductSearchText('');
                          setIsSearchDropdownOpen(false);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsSearchDropdownOpen(!isSearchDropdownOpen)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-500"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Results list */}
                  {isSearchDropdownOpen && (
                    <>
                      {/* Backdrop for closing */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsSearchDropdownOpen(false)} 
                      />
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-100">
                        <div className="p-2 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 flex items-center justify-between">
                          <span>Ombordagi tovarlar ({matchedProducts.length} ta)</span>
                          <span className="text-[10px] text-slate-400 font-normal">Tanlash uchun bosing</span>
                        </div>

                        {matchedProducts.length === 0 ? (
                          <div className="p-4 text-center space-y-2">
                            <p className="text-xs text-slate-500">
                              &ldquo;{productSearchText}&rdquo; bo&apos;yicha tovar topilmadi.
                            </p>
                            <button
                              type="button"
                              onClick={() => handleAddCustomNewProduct(productSearchText)}
                              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs inline-flex items-center gap-1 shadow-sm"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Yangi tovar sifatida qo&apos;shish</span>
                            </button>
                          </div>
                        ) : (
                          matchedProducts.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => handleAddProductItem(p.id)}
                              className="p-2.5 hover:bg-cyan-50/70 dark:hover:bg-cyan-950/40 cursor-pointer transition flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  {p.hasSerialNumber ? (
                                    <Cpu className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                                  ) : (
                                    <Package className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  )}
                                  <span className="truncate">{p.name}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                                  <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{p.sku}</span>
                                  <span>&bull;</span>
                                  <span>{p.category}</span>
                                  {p.barcode && (
                                    <>
                                      <span>&bull;</span>
                                      <span>{p.barcode}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                  Qoldiq: <span className={p.stockQuantity <= p.minStockAlert ? 'text-amber-500' : 'text-emerald-500'}>{p.stockQuantity} {p.unit}</span>
                                </div>
                                <div className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
                                  {invoiceCurrency === 'UZS' 
                                    ? `${formatNumberWithSpaces(p.costPrice)} so'm` 
                                    : `$${p.costPriceUSD || (p.costPrice / exchangeRate).toFixed(2)}`}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleAddCustomNewProduct()}
                  className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1 transition shadow-sm shrink-0 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yangi tovar</span>
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 space-y-2">
                <PackagePlus className="w-10 h-10 mx-auto opacity-40 text-cyan-500" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Hozircha kirimga tovar qo&apos;shilmadi
                </p>
                <p className="text-[11px] text-slate-400">
                  Yuqoridagi &ldquo;+ Ombordagi tovardan tanlash&rdquo; yoki &ldquo;Yangi tovar yaratish&rdquo; tugmasi orqali faktura tovarlarini kiriting.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, idx) => {
                  const isSerialMatches = !item.hasSerialNumber || item.serialNumbers.length === item.quantity;
                  const itemTotalCost = item.quantity * item.costPrice;
                  const itemTotalCostUSD = item.quantity * item.costPriceUSD;

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-sm space-y-3"
                    >
                      {/* Item Header & Inputs */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={item.productName}
                            onChange={(e) => handleUpdateItem(idx, 'productName', e.target.value)}
                            className="font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-cyan-500 outline-none w-full text-sm"
                            placeholder="Tovar nomi..."
                          />
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="text"
                              value={item.sku}
                              placeholder="SKU / Artikul"
                              onChange={(e) => handleUpdateItem(idx, 'sku', e.target.value)}
                              className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                            />
                            <label className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.hasSerialNumber}
                                onChange={(e) => handleUpdateItem(idx, 'hasSerialNumber', e.target.checked)}
                                className="rounded text-cyan-600 focus:ring-0"
                              />
                              <span>Seriya raqamli (S/N)</span>
                            </label>
                          </div>
                        </div>

                        {/* Quantity, Cost and Retail Inputs */}
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Quantity */}
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 block mb-0.5">Miqdori:</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => handleUpdateItem(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                onFocus={(e) => e.target.select()}
                                onClick={(e) => (e.target as HTMLInputElement).select()}
                                className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-center font-bold font-mono text-xs"
                              />
                              <span className="text-[10px] text-slate-400">{item.unit}</span>
                            </div>
                          </div>

                          {invoiceCurrency === 'UZS' ? (
                            <>
                              {/* Cost Price (UZS) */}
                              <div>
                                <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 block mb-0.5">Kirim Tannarxi (so&apos;m):</span>
                                <div className="relative">
                                  <input
                                    type="number"
                                    step="1000"
                                    value={item.costPrice || ''}
                                    onChange={(e) => handleUpdateItem(idx, 'costPrice', parseFloat(e.target.value) || 0)}
                                    onFocus={(e) => e.target.select()}
                                    onClick={(e) => (e.target as HTMLInputElement).select()}
                                    placeholder="0"
                                    className="w-28 bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-lg px-2 py-1.5 text-right font-bold font-mono text-xs text-cyan-700 dark:text-cyan-300 outline-none"
                                  />
                                  <div className="text-[9px] font-mono text-slate-400 text-right mt-0.5">
                                    ≈ ${formatUSDNumber(item.costPriceUSD)}
                                  </div>
                                </div>
                              </div>

                              {/* Retail Price (UZS) */}
                              <div>
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">Sotuv Narxi (so&apos;m):</span>
                                <div className="relative">
                                  <input
                                    type="number"
                                    step="1000"
                                    value={item.retailPrice || ''}
                                    onChange={(e) => handleUpdateItem(idx, 'retailPrice', parseFloat(e.target.value) || 0)}
                                    onFocus={(e) => e.target.select()}
                                    onClick={(e) => (e.target as HTMLInputElement).select()}
                                    placeholder="0"
                                    className="w-28 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg px-2 py-1.5 text-right font-bold font-mono text-xs text-emerald-700 dark:text-emerald-300 outline-none"
                                  />
                                  <div className="text-[9px] font-mono text-slate-400 text-right mt-0.5">
                                    ≈ ${formatUSDNumber(item.retailPriceUSD)}
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              {/* Cost Price ($) */}
                              <div>
                                <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 block mb-0.5">Kirim Tannarxi ($):</span>
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-cyan-600">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={item.costPriceUSD || ''}
                                    onChange={(e) => handleUpdateItem(idx, 'costPriceUSD', parseFloat(e.target.value) || 0)}
                                    onFocus={(e) => e.target.select()}
                                    onClick={(e) => (e.target as HTMLInputElement).select()}
                                    placeholder="0"
                                    className="w-20 bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-lg pl-5 pr-1.5 py-1.5 text-right font-bold font-mono text-xs text-cyan-700 dark:text-cyan-300 outline-none"
                                  />
                                  <div className="text-[9px] font-mono text-slate-400 text-right mt-0.5">
                                    ≈ {formatNumberWithSpaces(item.costPrice)} so&apos;m
                                  </div>
                                </div>
                              </div>

                              {/* Retail Price ($) */}
                              <div>
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">Sotuv Narxi ($):</span>
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={item.retailPriceUSD || ''}
                                    onChange={(e) => handleUpdateItem(idx, 'retailPriceUSD', parseFloat(e.target.value) || 0)}
                                    onFocus={(e) => e.target.select()}
                                    onClick={(e) => (e.target as HTMLInputElement).select()}
                                    placeholder="0"
                                    className="w-20 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg pl-5 pr-1.5 py-1.5 text-right font-bold font-mono text-xs text-emerald-700 dark:text-emerald-300 outline-none"
                                  />
                                  <div className="text-[9px] font-mono text-slate-400 text-right mt-0.5">
                                    ≈ {formatNumberWithSpaces(item.retailPrice)} so&apos;m
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          {/* Row Total Cost */}
                          <div className="text-right min-w-[110px]">
                            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Jami Tannarx:</span>
                            {invoiceCurrency === 'UZS' ? (
                              <>
                                <div className="font-mono font-black text-sm text-slate-900 dark:text-white">
                                  {formatNumberWithSpaces(itemTotalCost)} so&apos;m
                                </div>
                                <div className="text-[10px] font-mono text-slate-400">
                                  ≈ ${formatUSDNumber(itemTotalCostUSD)}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="font-mono font-black text-sm text-slate-900 dark:text-white">
                                  ${formatUSDNumber(itemTotalCostUSD)}
                                </div>
                                <div className="text-[10px] font-mono text-slate-400">
                                  ≈ {formatNumberWithSpaces(itemTotalCost)} so&apos;m
                                </div>
                              </>
                            )}
                          </div>

                          {/* Delete Item */}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="O'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* S/N Ingestion Sub-section if item is serialized */}
                      {item.hasSerialNumber && (
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700/80 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Barcode className="w-4 h-4 text-cyan-600" />
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Ushbu partiyadagi Seriya Raqamlari (S/N):
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isSerialMatches
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                              }`}>
                                {isSerialMatches
                                  ? `✓ ${item.serialNumbers.length}/${item.quantity} S/N to'liq kiritildi`
                                  : `⚠ ${item.serialNumbers.length}/${item.quantity} S/N kiritildi`}
                              </span>
                            </div>

                            {/* Batch Paste Toggle */}
                            <button
                              type="button"
                              onClick={() => handleUpdateItem(idx, 'isBulkPasteOpen', !item.isBulkPasteOpen)}
                              className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline font-bold"
                            >
                              {item.isBulkPasteOpen ? "Yopish" : "📋 Excel / Matndan ommaviy nusxalash (Paste)"}
                            </button>
                          </div>

                          {/* Bulk Paste Area if opened */}
                          {item.isBulkPasteOpen && (
                            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-cyan-300 dark:border-cyan-700 space-y-2 animate-in fade-in duration-150">
                              <label className="text-[10px] font-semibold text-slate-500 block">
                                Excel ustuni yoki schot-fakturaning S/N qatorini bu yerga tashlang (qatorlar, vergullar avtomat ajratiladi):
                              </label>
                              <textarea
                                rows={3}
                                placeholder="HK-4MP-982101&#10;HK-4MP-982102&#10;HK-4MP-982103..."
                                value={item.bulkPasteText || ''}
                                onChange={(e) => handleUpdateItem(idx, 'bulkPasteText', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs font-mono outline-none focus:ring-1 focus:ring-cyan-500"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItem(idx, 'isBulkPasteOpen', false)}
                                  className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded"
                                >
                                  Bekor qilish
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApplyBulkSerials(idx)}
                                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold"
                                >
                                  S/N larni Qo&apos;shish
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Scanner Input Row */}
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Shtrix-kod skaner qiling yoki S/N yozib Enter bosing..."
                              value={item.manualSerialInput}
                              onChange={(e) => handleUpdateItem(idx, 'manualSerialInput', e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddSingleSerial(idx);
                                }
                              }}
                              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddSingleSerial(idx)}
                              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-cyan-600 hover:text-white rounded-lg text-xs font-bold transition"
                            >
                              + S/N qo&apos;shish
                            </button>
                          </div>

                          {/* S/N Chips List */}
                          {item.serialNumbers.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
                              {item.serialNumbers.map((sn, sIdx) => {
                                const isDuplicateInWarehouse = existingWarehouseSerials.has(sn.trim().toUpperCase());
                                return (
                                  <span
                                    key={sIdx}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono border ${
                                      isDuplicateInWarehouse
                                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                                    }`}
                                  >
                                    <span>{sn}</span>
                                    {isDuplicateInWarehouse && (
                                      <span className="text-[9px] font-bold text-rose-600" title="Ushbu S/N omborda avvaldan mavjud!">
                                        (Mavjud!)
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSerialChip(idx, sn)}
                                      className="text-slate-400 hover:text-rose-500 ml-0.5"
                                    >
                                      &times;
                                    </button>
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Notes & Grand Totals Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Kirim haqida qo&apos;shimcha izoh:
              </label>
              <textarea
                rows={2}
                placeholder="Yetkazib berish shartlari, shartnoma raqami yoki boshqa ma'lumotlar..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="flex flex-col justify-center items-end text-right space-y-1 font-mono">
              <span className="text-xs text-slate-500 font-sans">
                Jami miqdor: <strong>{totalQuantity} dona</strong> &bull; Pozitsiyalar: <strong>{items.length} xil</strong>
              </span>
              {invoiceCurrency === 'UZS' ? (
                <>
                  <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                    {formatNumberWithSpaces(totalAmountUZS)} <small className="text-xs font-normal text-slate-400">so&apos;m</small>
                  </div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    ≈ ${formatUSDNumber(totalAmountUSD)} USD
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                    ${formatUSDNumber(totalAmountUSD)} <small className="text-xs font-normal text-slate-400">USD</small>
                  </div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    ≈ {formatNumberWithSpaces(totalAmountUZS)} so&apos;m
                  </div>
                </>
              )}

              {paymentStatus === 'partial' && (
                <div className="mt-1 pt-1 border-t border-slate-200 dark:border-slate-800 text-right text-[11px] font-mono">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    To&apos;langan: {invoiceCurrency === 'USD' ? `$${formatUSDNumber(currentPaidUSD)}` : `${formatNumberWithSpaces(currentPaidUZS)} so'm`}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600 mx-1.5">&bull;</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    Qarz: {invoiceCurrency === 'USD' ? `$${formatUSDNumber(currentDebtUSD)}` : `${formatNumberWithSpaces(currentDebtUZS)} so'm`}
                  </span>
                </div>
              )}
              {paymentStatus === 'debt' && (
                <div className="mt-1 text-right text-[11px] text-rose-600 dark:text-rose-400 font-bold font-sans">
                  ⏳ To&apos;liq Nasiya (Qarzga olingan)
                </div>
              )}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Bekor qilish
            </button>

            <button
              type="submit"
              disabled={items.length === 0}
              className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-cyan-600/25 transition active:scale-[0.99] flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{editingPurchase ? "O'zgarishlarni Saqlash va Omborni Yangilash" : "Kirimni Tasdiqlash va Omborni To'ldirish"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* POPUP MODAL: ADD NEW SUPPLIER */}
      {isAddSupplierModalOpen && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-600/10 text-cyan-600 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Yangi Ta&apos;minotchi Qo&apos;shish
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Kompaniya, diler yoki yetkazib beruvchi shaxs
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSupplierModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  * Ta&apos;minotchi / Korxona nomi:
                </label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    placeholder="Masalan: Hikvision Official Diler (Toshkent)"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Telefon raqami (Aloqa uchun):
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={newSupplierPhone}
                    onChange={(e) => setNewSupplierPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Manzil yoki Izoh (Ixtiyoriy):
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 -translate-y-1/2" />
                  <input
                    type="text"
                    value={newSupplierAddress}
                    onChange={(e) => setNewSupplierAddress(e.target.value)}
                    placeholder="Masalan: Toshkent sh., Chilonzor 2-mavze"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={!newSupplierName.trim()}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ta&apos;minotchini Saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
