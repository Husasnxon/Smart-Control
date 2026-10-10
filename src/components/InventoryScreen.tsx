'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Product, ProductCategory, Currency, PurchaseInvoice, PurchasePaymentRecord, Employee } from '../types';
import { formatMoney, formatDualMoney, formatNumberWithSpaces, formatUSDNumber } from '../utils/formatters';
import { NewPurchaseModal } from './NewPurchaseModal';
import { PurchaseInvoiceModal } from './PurchaseInvoiceModal';
import { SupplierPaymentModal } from './SupplierPaymentModal';
import { 
  Package, 
  Plus, 
  Search, 
  Barcode, 
  AlertTriangle, 
  Check, 
  Settings2, 
  Edit2, 
  Trash2, 
  X,
  ShieldCheck,
  Wrench,
  Hash,
  Copy,
  CheckCheck,
  Cpu,
  Camera,
  Image as ImageIcon,
  DollarSign,
  HardHat,
  Truck,
  FileText,
  ArrowDownLeft,
  Calendar,
  Building2,
  Phone,
  Eye,
  Ban,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpRight,
  CreditCard,
  Receipt,
  FileSpreadsheet,
  Download,
  Upload
} from 'lucide-react';
import { exportProductsToExcel, exportPurchasesToExcel } from '../utils/excel';
import { ExcelImportModal } from './ExcelImportModal';

interface InventoryScreenProps {
  products: Product[];
  categories: ProductCategory[];
  purchases?: PurchaseInvoice[];
  onSavePurchase?: (invoice: PurchaseInvoice, updatedProducts: Product[]) => void;
  onRecordSupplierPayment?: (payment: PurchasePaymentRecord, updatedInvoice: PurchaseInvoice) => void;
  onCancelPurchase?: (invoiceId: string) => void;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateStock: (productId: string, newStock: number) => void;
  onAddProductCategory: (category: ProductCategory) => void;
  onUpdateProductCategory: (categoryId: string, newName: string, newDesc?: string) => void;
  onDeleteProductCategory: (categoryId: string) => void;
  exchangeRate?: number;
  baseCurrency?: Currency;
  currentUser?: Employee | null;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  products,
  categories,
  purchases = [],
  onSavePurchase,
  onRecordSupplierPayment,
  onCancelPurchase,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateStock,
  onAddProductCategory,
  onUpdateProductCategory,
  onDeleteProductCategory,
  exchangeRate = 12850,
  baseCurrency = 'UZS',
  currentUser = null
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'purchases' | 'supplier_payments'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Barchasi');
  
  // Purchases management state
  const [isNewPurchaseModalOpen, setIsNewPurchaseModalOpen] = useState(false);
  const [editingPurchaseInvoice, setEditingPurchaseInvoice] = useState<PurchaseInvoice | null>(null);
  const [viewingPurchaseInvoice, setViewingPurchaseInvoice] = useState<PurchaseInvoice | null>(null);
  const [purchaseSearchQuery, setPurchaseSearchQuery] = useState('');
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState<'all' | 'paid' | 'debt' | 'cancelled'>('all');

  // Supplier payments state
  const [isSupplierPaymentModalOpen, setIsSupplierPaymentModalOpen] = useState(false);
  const [paymentModalPurchaseId, setPaymentModalPurchaseId] = useState<string | null>(null);
  const [paymentModalSupplierName, setPaymentModalSupplierName] = useState<string | null>(null);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('all');
  const [supplierDebtStatusFilter, setSupplierDebtStatusFilter] = useState<'all' | 'with_debt' | 'settled'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryManageModalOpen, setIsCategoryManageModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingSerialProduct, setViewingSerialProduct] = useState<Product | null>(null);
  const [quickStockProduct, setQuickStockProduct] = useState<Product | null>(null);
  const [quickNewSerialsText, setQuickNewSerialsText] = useState('');
  const [copiedSn, setCopiedSn] = useState<string | null>(null);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);

  const handleImportProducts = (importedProducts: Product[], mode: 'append' | 'merge') => {
    if (mode === 'append') {
      importedProducts.forEach(p => onAddProduct(p));
    } else {
      // Merge mode
      importedProducts.forEach(newP => {
        const existing = products.find(p => (p.sku && p.sku === newP.sku) || (p.barcode && p.barcode === newP.barcode));
        if (existing) {
          const mergedSerials = [...(existing.serialNumbers || [])];
          if (newP.serialNumbers) {
            newP.serialNumbers.forEach(sn => {
              if (!mergedSerials.includes(sn)) mergedSerials.push(sn);
            });
          }
          onUpdateProduct({
            ...existing,
            stockQuantity: existing.isService ? 9999 : (existing.hasSerialNumber ? mergedSerials.length : existing.stockQuantity + newP.stockQuantity),
            serialNumbers: existing.hasSerialNumber ? mergedSerials : existing.serialNumbers,
            costPrice: newP.costPrice > 0 ? newP.costPrice : existing.costPrice,
            retailPrice: newP.retailPrice > 0 ? newP.retailPrice : existing.retailPrice
          });
        } else {
          onAddProduct(newP);
        }
      });
    }
  };

  // New product form state
  const [newProductCurrency, setNewProductCurrency] = useState<'UZS' | 'USD'>(baseCurrency || 'UZS');
  const [newName, setNewName] = useState('');
  const [newBarcode, setNewBarcode] = useState('');
  const [newCategory, setNewCategory] = useState(categories[0]?.name || 'Kuzatuv kameralari (CCTV)');
  const [newCostPrice, setNewCostPrice] = useState<number>(0);
  const [newRetailPrice, setNewRetailPrice] = useState<number>(0);
  const [newStock, setNewStock] = useState<number>(0);
  const [newUnit, setNewUnit] = useState('dona');
  const [newHasSerialNumber, setNewHasSerialNumber] = useState<boolean>(true);
  const [newSerialNumbersText, setNewSerialNumbersText] = useState<string>('');
  const [newIsService, setNewIsService] = useState<boolean>(false);
  const [newTechnicianWageUSD, setNewTechnicianWageUSD] = useState<number>(0);
  const [newTechnicianWageUZS, setNewTechnicianWageUZS] = useState<number>(0);
  const [newWarrantyMonths, setNewWarrantyMonths] = useState<number>(24);
  const [newImageUrl, setNewImageUrl] = useState<string>('');

  // Edit product form state
  const [editProductCurrency, setEditProductCurrency] = useState<'UZS' | 'USD'>(baseCurrency || 'UZS');
  const [editName, setEditName] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editCostPrice, setEditCostPrice] = useState<number>(0);
  const [editRetailPrice, setEditRetailPrice] = useState<number>(0);
  const [editWholesalePrice, setEditWholesalePrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [editMinStock, setEditMinStock] = useState<number>(2);
  const [editUnit, setEditUnit] = useState('dona');
  const [editHasSerialNumber, setEditHasSerialNumber] = useState<boolean>(false);
  const [editSerialNumbersText, setEditSerialNumbersText] = useState<string>('');
  const [editIsService, setEditIsService] = useState<boolean>(false);
  const [editTechnicianWageUSD, setEditTechnicianWageUSD] = useState<number>(0);
  const [editTechnicianWageUZS, setEditTechnicianWageUZS] = useState<number>(0);
  const [editWarrantyMonths, setEditWarrantyMonths] = useState<number>(12);
  const [editImageUrl, setEditImageUrl] = useState<string>('');

  // Category management state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState('#06B6D4');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatNameValue, setEditCatNameValue] = useState('');

  const filterCategoryNames = ['Barchasi', ...categories.map((c) => c.name)];

  const filtered = products.filter((p) => {
    const matchCat = selectedCategory === 'Barchasi' || p.category === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.serialNumbers && p.serialNumbers.some((sn) => sn.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchCat && matchSearch;
  });

  // Global Escape key listener to close any open modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddModalOpen(false);
        setEditingProduct(null);
        setViewingSerialProduct(null);
        setQuickStockProduct(null);
        setIsCategoryManageModalOpen(false);
        setIsExcelImportModalOpen(false);
        setViewingPurchaseInvoice(null);
        setIsNewPurchaseModalOpen(false);
        setIsSupplierPaymentModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const parseSerials = (text: string): string[] => {
    return text
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  const handleSwitchNewCurrency = (newCurr: 'UZS' | 'USD') => {
    if (newCurr === newProductCurrency) return;
    const rate = exchangeRate > 0 ? exchangeRate : 12850;
    if (newCurr === 'USD') {
      setNewCostPrice(newCostPrice > 0 ? Number((newCostPrice / rate).toFixed(2)) : 0);
      setNewRetailPrice(newRetailPrice > 0 ? Number((newRetailPrice / rate).toFixed(2)) : 0);
    } else {
      setNewCostPrice(newCostPrice > 0 ? Math.round(newCostPrice * rate) : 0);
      setNewRetailPrice(newRetailPrice > 0 ? Math.round(newRetailPrice * rate) : 0);
    }
    setNewProductCurrency(newCurr);
  };

  const handleSwitchEditCurrency = (newCurr: 'UZS' | 'USD') => {
    if (newCurr === editProductCurrency) return;
    const rate = exchangeRate > 0 ? exchangeRate : 12850;
    if (newCurr === 'USD') {
      setEditCostPrice(editCostPrice > 0 ? Number((editCostPrice / rate).toFixed(2)) : 0);
      setEditRetailPrice(editRetailPrice > 0 ? Number((editRetailPrice / rate).toFixed(2)) : 0);
      setEditWholesalePrice(editWholesalePrice > 0 ? Number((editWholesalePrice / rate).toFixed(2)) : 0);
    } else {
      setEditCostPrice(editCostPrice > 0 ? Math.round(editCostPrice * rate) : 0);
      setEditRetailPrice(editRetailPrice > 0 ? Math.round(editRetailPrice * rate) : 0);
      setEditWholesalePrice(editWholesalePrice > 0 ? Math.round(editWholesalePrice * rate) : 0);
    }
    setEditProductCurrency(newCurr);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    let parsedSerials: string[] = [];
    let finalStock = newStock;

    if (newIsService) {
      finalStock = 9999;
      parsedSerials = [];
    } else if (newHasSerialNumber) {
      parsedSerials = parseSerials(newSerialNumbersText);
      finalStock = parsedSerials.length;
    }

    const rate = exchangeRate > 0 ? exchangeRate : 12850;
    const isUSD = newProductCurrency === 'USD';

    const costPriceUZS = isUSD ? Math.round(newCostPrice * rate) : newCostPrice;
    const costPriceUSD = isUSD ? newCostPrice : (costPriceUZS > 0 ? Number((costPriceUZS / rate).toFixed(2)) : undefined);

    const retailPriceUZS = isUSD ? Math.round(newRetailPrice * rate) : newRetailPrice;
    const retailPriceUSD = isUSD ? newRetailPrice : (retailPriceUZS > 0 ? Number((retailPriceUZS / rate).toFixed(2)) : undefined);

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      barcode: newBarcode || `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`,
      sku: `SKU-${Math.floor(100 + Math.random() * 900)}`,
      name: newName,
      category: newCategory,
      costPrice: costPriceUZS,
      costPriceUSD: costPriceUSD,
      retailPrice: retailPriceUZS,
      retailPriceUSD: retailPriceUSD,
      wholesalePrice: Math.round(retailPriceUZS * 0.9),
      stockQuantity: finalStock,
      minStockAlert: newIsService ? 0 : 2,
      unit: newIsService ? (newUnit === 'dona' ? 'nuqta' : newUnit) : newUnit,
      hasSerialNumber: newIsService ? false : newHasSerialNumber,
      serialNumbers: parsedSerials,
      isService: newIsService,
      technicianWageUSD: newIsService ? (newTechnicianWageUSD || undefined) : undefined,
      technicianWageUZS: newIsService ? (newTechnicianWageUZS || undefined) : undefined,
      warrantyMonths: newWarrantyMonths,
      imageUrl: newImageUrl.trim() || undefined,
    };

    onAddProduct(newProd);
    setIsAddModalOpen(false);
    // Reset
    setNewName('');
    setNewBarcode('');
    setNewCostPrice(0);
    setNewRetailPrice(0);
    setNewStock(0);
    setNewSerialNumbersText('');
    setNewHasSerialNumber(true);
    setNewIsService(false);
    setNewTechnicianWageUSD(0);
    setNewTechnicianWageUZS(0);
    setNewImageUrl('');
  };

  const handleOpenEditProduct = (prod: Product) => {
    const isUSD = baseCurrency === 'USD';
    const rate = exchangeRate > 0 ? exchangeRate : 12850;
    setEditProductCurrency(baseCurrency || 'UZS');
    setEditingProduct(prod);
    setEditName(prod.name);
    setEditBarcode(prod.barcode);
    setEditSku(prod.sku);
    setEditCategory(prod.category);

    if (isUSD) {
      const costUSD = prod.costPriceUSD ?? (prod.costPrice > 0 ? Number((prod.costPrice / rate).toFixed(2)) : 0);
      const retailUSD = prod.retailPriceUSD ?? (prod.retailPrice > 0 ? Number((prod.retailPrice / rate).toFixed(2)) : 0);
      setEditCostPrice(costUSD);
      setEditRetailPrice(retailUSD);
      setEditWholesalePrice(Number((retailUSD * 0.9).toFixed(2)));
    } else {
      setEditCostPrice(prod.costPrice);
      setEditRetailPrice(prod.retailPrice);
      setEditWholesalePrice(prod.wholesalePrice || Math.round(prod.retailPrice * 0.9));
    }

    setEditStock(prod.stockQuantity);
    setEditMinStock(prod.minStockAlert);
    setEditUnit(prod.unit);
    setEditHasSerialNumber(!!prod.hasSerialNumber);
    setEditSerialNumbersText((prod.serialNumbers || []).join('\n'));
    setEditIsService(!!prod.isService);
    setEditTechnicianWageUSD(prod.technicianWageUSD || 0);
    setEditTechnicianWageUZS(prod.technicianWageUZS || (prod.technicianWageUSD ? Math.round(prod.technicianWageUSD * rate) : 0));
    setEditWarrantyMonths(prod.warrantyMonths !== undefined ? prod.warrantyMonths : 12);
    setEditImageUrl(prod.imageUrl || '');
  };

  const handleSaveEditedProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editName.trim()) return;

    let parsedSerials: string[] = [];
    let finalStock = editStock;

    if (editIsService) {
      finalStock = 9999;
      parsedSerials = [];
    } else if (editHasSerialNumber) {
      parsedSerials = parseSerials(editSerialNumbersText);
      finalStock = parsedSerials.length;
    }

    const rate = exchangeRate > 0 ? exchangeRate : 12850;
    const isUSD = editProductCurrency === 'USD';

    const costPriceUZS = isUSD ? Math.round(editCostPrice * rate) : editCostPrice;
    const costPriceUSD = isUSD ? editCostPrice : (costPriceUZS > 0 ? Number((costPriceUZS / rate).toFixed(2)) : undefined);

    const retailPriceUZS = isUSD ? Math.round(editRetailPrice * rate) : editRetailPrice;
    const retailPriceUSD = isUSD ? editRetailPrice : (retailPriceUZS > 0 ? Number((retailPriceUZS / rate).toFixed(2)) : undefined);

    const wholesalePriceUZS = isUSD ? Math.round(editWholesalePrice * rate) : (editWholesalePrice || Math.round(retailPriceUZS * 0.9));

    const updated: Product = {
      ...editingProduct,
      name: editName,
      barcode: editBarcode,
      sku: editSku,
      category: editCategory,
      costPrice: costPriceUZS,
      costPriceUSD: costPriceUSD,
      retailPrice: retailPriceUZS,
      retailPriceUSD: retailPriceUSD,
      wholesalePrice: wholesalePriceUZS,
      stockQuantity: finalStock,
      minStockAlert: editIsService ? 0 : editMinStock,
      unit: editUnit,
      hasSerialNumber: editIsService ? false : editHasSerialNumber,
      serialNumbers: parsedSerials,
      isService: editIsService,
      technicianWageUSD: editIsService ? (editTechnicianWageUSD || undefined) : undefined,
      technicianWageUZS: editIsService ? (editTechnicianWageUZS || undefined) : undefined,
      warrantyMonths: editWarrantyMonths,
      imageUrl: editImageUrl.trim() || undefined,
    };

    onUpdateProduct(updated);
    setEditingProduct(null);
  };

  // Quick addition of serial numbers to stock
  const handleQuickAddSerials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickStockProduct) return;

    const newSerials = parseSerials(quickNewSerialsText);
    if (newSerials.length === 0) return;

    const currentSerials = quickStockProduct.serialNumbers || [];
    const combined = [...currentSerials, ...newSerials];

    const updatedProduct: Product = {
      ...quickStockProduct,
      serialNumbers: combined,
      stockQuantity: combined.length
    };

    onUpdateProduct(updatedProduct);
    setQuickStockProduct(null);
    setQuickNewSerialsText('');
  };

  const handleCopySerial = (sn: string) => {
    navigator.clipboard?.writeText(sn);
    setCopiedSn(sn);
    setTimeout(() => setCopiedSn(null), 2000);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCat: ProductCategory = {
      id: `pcat-${Date.now()}`,
      name: newCatName.trim(),
      description: newCatDesc.trim() || "Xavfsizlik va tarmoq toifasi",
      color: newCatColor
    };

    onAddProductCategory(newCat);
    setNewCatName('');
    setNewCatDesc('');
  };

  const handleSaveEditCategory = (catId: string) => {
    if (!editCatNameValue.trim()) return;
    onUpdateProductCategory(catId, editCatNameValue.trim());
    setEditingCatId(null);
    setEditCatNameValue('');
  };

  // KPI Metrics Calculations
  const physicalProducts = useMemo(() => products.filter((p) => !p.isService), [products]);
  const totalStockUnits = useMemo(() => physicalProducts.reduce((sum, p) => sum + p.stockQuantity, 0), [physicalProducts]);
  const totalSerialNumbers = useMemo(() => physicalProducts.reduce((sum, p) => sum + (p.serialNumbers?.length || 0), 0), [physicalProducts]);
  
  // Cost Valuation ($ and UZS)
  const totalCostUZS = useMemo(() => physicalProducts.reduce((sum, p) => sum + (p.costPrice * p.stockQuantity), 0), [physicalProducts]);
  const totalCostUSD = useMemo(() => physicalProducts.reduce((sum, p) => sum + ((p.costPriceUSD || (p.costPrice / (exchangeRate || 12850))) * p.stockQuantity), 0), [physicalProducts, exchangeRate]);

  // Retail Valuation ($ and UZS)
  const totalRetailUZS = useMemo(() => physicalProducts.reduce((sum, p) => sum + (p.retailPrice * p.stockQuantity), 0), [physicalProducts]);
  const totalRetailUSD = useMemo(() => physicalProducts.reduce((sum, p) => sum + ((p.retailPriceUSD || (p.retailPrice / (exchangeRate || 12850))) * p.stockQuantity), 0), [physicalProducts, exchangeRate]);

  // Low stock alerts
  const lowStockCount = useMemo(() => physicalProducts.filter((p) => p.stockQuantity <= p.minStockAlert).length, [physicalProducts]);

  // Purchases Metrics
  const currentPurchases = useMemo(() => purchases || [], [purchases]);
  const totalPurchasesUZS = useMemo(() => 
    currentPurchases.filter((p) => p.status !== 'cancelled').reduce((sum, p) => sum + p.totalAmount, 0),
    [currentPurchases]
  );
  const totalPurchasesUSD = useMemo(() => 
    currentPurchases.filter((p) => p.status !== 'cancelled').reduce((sum, p) => sum + (p.totalAmountUSD || (p.exchangeRate ? p.totalAmount / p.exchangeRate : p.totalAmount / (exchangeRate || 12850))), 0),
    [currentPurchases, exchangeRate]
  );

  const totalSupplierDebtUZS = useMemo(() => 
    currentPurchases.filter((p) => p.status !== 'cancelled').reduce((sum, p) => sum + (p.debtAmount || 0), 0),
    [currentPurchases]
  );
  const totalSupplierDebtUSD = useMemo(() => 
    currentPurchases.filter((p) => p.status !== 'cancelled').reduce((sum, p) => sum + (p.debtAmountUSD || (p.exchangeRate ? (p.debtAmount || 0) / p.exchangeRate : (p.debtAmount || 0) / (exchangeRate || 12850))), 0),
    [currentPurchases, exchangeRate]
  );

  const totalSupplierPaidUZS = useMemo(() => 
    currentPurchases.filter((p) => p.status !== 'cancelled').reduce((sum, p) => sum + (p.paidAmount || 0), 0),
    [currentPurchases]
  );
  const totalSupplierPaidUSD = useMemo(() => 
    currentPurchases.filter((p) => p.status !== 'cancelled').reduce((sum, p) => sum + (p.paidAmountUSD || (p.exchangeRate ? (p.paidAmount || 0) / p.exchangeRate : (p.paidAmount || 0) / (exchangeRate || 12850))), 0),
    [currentPurchases, exchangeRate]
  );

  // All supplier payments aggregated
  const allSupplierPayments = useMemo(() => {
    const list: PurchasePaymentRecord[] = [];
    currentPurchases.forEach((p) => {
      if (p.payments && p.payments.length > 0) {
        list.push(...p.payments);
      }
    });
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [currentPurchases]);

  // Suppliers summary breakdown
  const suppliersSummary = useMemo(() => {
    const map = new Map<string, {
      name: string;
      phone?: string;
      invoicesCount: number;
      paidInvoicesCount: number;
      debtInvoicesCount: number;
      totalPurchasesUZS: number;
      totalPurchasesUSD: number;
      totalPaidUZS: number;
      totalPaidUSD: number;
      totalDebtUZS: number;
      totalDebtUSD: number;
    }>();

    currentPurchases.filter(p => p.status !== 'cancelled').forEach((p) => {
      const name = p.supplierName;
      if (!map.has(name)) {
        map.set(name, {
          name,
          phone: p.supplierPhone,
          invoicesCount: 0,
          paidInvoicesCount: 0,
          debtInvoicesCount: 0,
          totalPurchasesUZS: 0,
          totalPurchasesUSD: 0,
          totalPaidUZS: 0,
          totalPaidUSD: 0,
          totalDebtUZS: 0,
          totalDebtUSD: 0
        });
      }
      const s = map.get(name)!;
      s.invoicesCount++;
      s.totalPurchasesUZS += p.totalAmount;
      s.totalPurchasesUSD += (p.totalAmountUSD || Number((p.totalAmount / (p.exchangeRate || exchangeRate)).toFixed(2)));
      s.totalPaidUZS += (p.paidAmount || 0);
      s.totalPaidUSD += (p.paidAmountUSD || Number(((p.paidAmount || 0) / (p.exchangeRate || exchangeRate)).toFixed(2)));

      const debtUZS = p.debtAmount !== undefined
        ? p.debtAmount
        : (p.paymentStatus === 'paid' ? 0 : p.paymentStatus === 'debt' ? p.totalAmount : Math.max(0, p.totalAmount - (p.paidAmount || 0)));
      const debtUSD = p.debtAmountUSD !== undefined
        ? p.debtAmountUSD
        : Number((debtUZS / (p.exchangeRate || exchangeRate)).toFixed(2));

      s.totalDebtUZS += debtUZS;
      s.totalDebtUSD += debtUSD;

      if (debtUZS <= 0 && p.paymentStatus === 'paid') {
        s.paidInvoicesCount++;
      } else {
        s.debtInvoicesCount++;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalDebtUZS - a.totalDebtUZS);
  }, [currentPurchases, exchangeRate]);

  // Filtered suppliers summary based on search, supplier dropdown filter, and debt status filter
  const filteredSuppliersSummary = useMemo(() => {
    const q = supplierSearchQuery.toLowerCase().trim();
    return suppliersSummary.filter(s => {
      // 1. Search query
      const matchSearch = !q || s.name.toLowerCase().includes(q) || (s.phone && s.phone.includes(q));
      if (!matchSearch) return false;

      // 2. Specific supplier filter dropdown
      if (selectedSupplierFilter !== 'all' && s.name !== selectedSupplierFilter) {
        return false;
      }

      // 3. Debt status filter
      if (supplierDebtStatusFilter === 'with_debt' && s.totalDebtUZS <= 0) {
        return false;
      }
      if (supplierDebtStatusFilter === 'settled' && s.totalDebtUZS > 0) {
        return false;
      }

      return true;
    });
  }, [suppliersSummary, supplierSearchQuery, selectedSupplierFilter, supplierDebtStatusFilter]);

  // Dynamic Debt & Paid totals reflecting active filter
  const filteredSupplierDebtUZS = useMemo(() => 
    filteredSuppliersSummary.reduce((sum, s) => sum + s.totalDebtUZS, 0),
    [filteredSuppliersSummary]
  );
  const filteredSupplierDebtUSD = useMemo(() => 
    filteredSuppliersSummary.reduce((sum, s) => sum + s.totalDebtUSD, 0),
    [filteredSuppliersSummary]
  );
  const filteredSupplierPaidUZS = useMemo(() => 
    filteredSuppliersSummary.reduce((sum, s) => sum + s.totalPaidUZS, 0),
    [filteredSuppliersSummary]
  );

  // Filtered Purchases list
  const filteredPurchases = useMemo(() => {
    return currentPurchases.filter((p) => {
      const q = purchaseSearchQuery.toLowerCase();
      const matchSearch = 
        p.invoiceNumber.toLowerCase().includes(q) ||
        p.supplierName.toLowerCase().includes(q) ||
        (p.supplierPhone && p.supplierPhone.includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q)) ||
        p.items.some(i => i.productName.toLowerCase().includes(q) || (i.serialNumbers && i.serialNumbers.some(sn => sn.toLowerCase().includes(q))));

      if (!matchSearch) return false;

      if (purchaseStatusFilter === 'paid') return p.paymentStatus === 'paid' && p.status !== 'cancelled';
      if (purchaseStatusFilter === 'debt') return (p.paymentStatus === 'debt' || p.paymentStatus === 'partial') && p.status !== 'cancelled';
      if (purchaseStatusFilter === 'cancelled') return p.status === 'cancelled';

      return true;
    });
  }, [currentPurchases, purchaseSearchQuery, purchaseStatusFilter]);

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50 dark:bg-slate-950">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-500" />
            Xavfsizlik & Tarmoq Uskunalari Ombora Boshqaruvi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kamera, NVR, router, optika, seriya raqamlari (S/N) va yetkazib beruvchilar kirim hujjati (Prixod)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Top Prixod Button */}
          <button
            onClick={() => {
              setEditingPurchaseInvoice(null);
              setIsNewPurchaseModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/25 flex items-center gap-2 transition active:scale-[0.98]"
          >
            <Truck className="w-4 h-4" />
            <span>+ Yangi Kirim (Prixod)</span>
          </button>

          {/* Manage Categories Button */}
          <button
            onClick={() => setIsCategoryManageModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition active:scale-[0.98]"
          >
            <Settings2 className="w-4 h-4 text-cyan-500" />
            <span>Kategoriyalar ({categories.length})</span>
          </button>

          {/* Excel Export Button */}
          <button
            type="button"
            onClick={() => exportProductsToExcel(products)}
            className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition active:scale-[0.98]"
            title="Ombordagi barcha tovarlarni Excel (.xlsx) faylga yuklab olish"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>Excel Eksport</span>
          </button>

          {/* Excel Import Button */}
          <button
            type="button"
            onClick={() => setIsExcelImportModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-1.5 transition active:scale-[0.98]"
            title="Excel fayl orqali tovarlarni ommaviy yuklash"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Excel Import</span>
          </button>

          {/* Add Product Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Tovar / Montaj</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Stock Quantity */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ombor Qoldig&apos;i</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {formatNumberWithSpaces(totalStockUnits)}
            </span>
            <span className="text-xs text-slate-500 font-medium">dona tovar</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-1">
              <Hash className="w-3 h-3" />
              {totalSerialNumbers} ta S/N
            </span>
            {lowStockCount > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {lowStockCount} kam qolgan
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Zaxira yetarli</span>
            )}
          </div>
        </div>

        {/* Card 2: Cost Valuation */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tannarx Balansi (Xarid)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {baseCurrency === 'USD' ? `$${formatUSDNumber(totalCostUSD)}` : `${formatNumberWithSpaces(totalCostUZS)} so'm`}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              ≈ {baseCurrency === 'USD' ? `${formatNumberWithSpaces(totalCostUZS)} so'm` : `$${formatUSDNumber(totalCostUSD)}`}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Tovarlarga tikilgan pul</span>
            <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{physicalProducts.length} xil uskuna</span>
          </div>
        </div>

        {/* Card 3: Retail Valuation */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kutilayotgan Sotish Qiymati</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {baseCurrency === 'USD' ? `$${formatUSDNumber(totalRetailUSD)}` : `${formatNumberWithSpaces(totalRetailUZS)} so'm`}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              ≈ {baseCurrency === 'USD' ? `${formatNumberWithSpaces(totalRetailUZS)} so'm` : `$${formatUSDNumber(totalRetailUSD)}`}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Kutilayotgan sof marja</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              +{baseCurrency === 'USD' ? `$${formatUSDNumber(totalRetailUSD - totalCostUSD)}` : `${formatNumberWithSpaces(totalRetailUZS - totalCostUZS)} so'm`}
            </span>
          </div>
        </div>

        {/* Card 4: Supplier Debt */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ta&apos;minotchilardan Qarz</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              totalSupplierDebtUZS > 0 
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400' 
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
            }`}>
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-xl font-black font-mono ${
              totalSupplierDebtUZS > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
            }`}>
              {baseCurrency === 'USD' ? `$${formatUSDNumber(totalSupplierDebtUSD)}` : `${formatNumberWithSpaces(totalSupplierDebtUZS)} so'm`}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              ≈ {baseCurrency === 'USD' ? `${formatNumberWithSpaces(totalSupplierDebtUZS)} so'm` : `$${formatUSDNumber(totalSupplierDebtUSD)}`}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] flex items-center justify-between">
            <span className="text-slate-500">Jami kirim fakturalari:</span>
            <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{currentPurchases.length} ta nakladnoy</span>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('products')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeSubTab === 'products'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Mahsulotlar & Xizmatlar</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeSubTab === 'products' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            {products.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('purchases')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeSubTab === 'purchases'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Omborga Kirimlar (Prixod / Nakladnoy)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeSubTab === 'purchases' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            {currentPurchases.length}
          </span>
          {totalSupplierDebtUZS > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="To'lanmagan qarz mavjud" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('supplier_payments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeSubTab === 'supplier_payments'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Ta&apos;minotchilarga To&apos;lovlar & Qarzlar</span>
          {totalSupplierDebtUZS > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500 text-white font-bold">
              {formatMoney(totalSupplierDebtUZS, baseCurrency, exchangeRate)}
            </span>
          ) : (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeSubTab === 'supplier_payments' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {suppliersSummary.length}
            </span>
          )}
        </button>
      </div>

      {/* CONDITIONAL SUB-TAB: PRODUCTS */}
      {activeSubTab === 'products' && (
        <div className="space-y-6">

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Nomi, S/N seriya raqami, shtrix-kod..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500/40 text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar">
          {filterCategoryNames.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Qurilma / Xizmat Nomi</th>
                <th className="py-3 px-4">Kategoriya & Turi</th>
                <th className="py-3 px-4 text-center">Seriya Raqami (S/N)</th>
                <th className="py-3 px-4 text-center">Kafolat</th>
                <th className="py-3 px-4 text-right">Tannarx</th>
                <th className="py-3 px-4 text-right">Sotish Narxi</th>
                <th className="py-3 px-4 text-center">Qoldiq</th>
                <th className="py-3 px-4 text-right">Amallar & Kirim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((product) => {
                const catObj = categories.find((c) => c.name === product.category);
                const catColor = catObj?.color || '#06B6D4';
                const isService = !!product.isService;
                const hasSN = !!product.hasSerialNumber;
                const snCount = product.serialNumbers?.length || 0;
                const isLow = !isService && product.stockQuantity <= product.minStockAlert;

                return (
                  <tr key={product.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    {/* Device / Service Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {/* Thumbnail */}
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 p-0.5">
                          {product.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              loading="lazy"
                              className="w-full h-full object-contain"
                            />
                          ) : isService ? (
                            <Wrench className="w-5 h-5 text-pink-500" />
                          ) : hasSN ? (
                            <Camera className="w-5 h-5 text-cyan-500" />
                          ) : (
                            <Package className="w-5 h-5 text-amber-500" />
                          )}
                        </div>

                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{product.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {product.barcode} &bull; {product.sku}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category & Type */}
                    <td className="py-3 px-4">
                      <span 
                        className="px-2.5 py-0.5 rounded-md font-bold text-[10px] inline-flex items-center gap-1.5"
                        style={{ backgroundColor: `${catColor}15`, color: catColor }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                        {product.category}
                      </span>
                    </td>

                    {/* Serial Numbers (S/N) status */}
                    <td className="py-3 px-4 text-center">
                      {isService ? (
                        <span className="text-[11px] text-slate-400 italic">Xizmat (S/Nsiz)</span>
                      ) : hasSN ? (
                        <button
                          onClick={() => setViewingSerialProduct(product)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 font-mono font-bold text-[11px] border border-cyan-200 dark:border-cyan-800 transition"
                          title="Mavjud seriya raqamlarini ko'rish"
                        >
                          <Hash className="w-3 h-3 text-cyan-600" />
                          <span>{snCount} ta S/N</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Oddiy tovar</span>
                      )}
                    </td>

                    {/* Warranty */}
                    <td className="py-3 px-4 text-center">
                      {product.warrantyMonths ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
                          <ShieldCheck className="w-3 h-3 text-blue-500" />
                          {product.warrantyMonths} oy
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">-</span>
                      )}
                    </td>

                    {/* Cost & Retail Price (Dual Currency) */}
                    <td className="py-3 px-4 text-right font-mono">
                      <div className="font-semibold text-slate-500">
                        {baseCurrency === 'USD' 
                          ? `$${formatUSDNumber(product.costPriceUSD || (product.costPrice / (exchangeRate || 12850)))}` 
                          : `${formatNumberWithSpaces(product.costPrice)} so'm`}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold">
                        {baseCurrency === 'USD' 
                          ? `${formatNumberWithSpaces(product.costPrice)} so'm` 
                          : `$${formatUSDNumber(product.costPriceUSD || (product.costPrice / (exchangeRate || 12850)))}`}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {baseCurrency === 'USD'
                          ? `$${formatUSDNumber(product.retailPriceUSD || (product.retailPrice / (exchangeRate || 12850)))}`
                          : `${formatNumberWithSpaces(product.retailPrice)} so'm`}
                      </div>
                      <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">
                        {baseCurrency === 'USD'
                          ? `${formatNumberWithSpaces(product.retailPrice)} so'm`
                          : `$${formatUSDNumber(product.retailPriceUSD || (product.retailPrice / (exchangeRate || 12850)))}`}
                      </div>
                    </td>

                    {/* Stock Status */}
                    <td className="py-3 px-4 text-center font-mono font-extrabold text-sm">
                      {isService ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300">
                            Cheksiz (Xizmat)
                          </span>
                          {(product.technicianWageUSD || product.technicianWageUZS) && (
                            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5">
                              <HardHat className="w-2.5 h-2.5" />
                              Ustaga: ${product.technicianWageUSD || Number(((product.technicianWageUZS || 0) / exchangeRate).toFixed(1))}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className={isLow ? 'text-amber-600' : 'text-slate-900 dark:text-slate-100'}>
                          {product.stockQuantity} {product.unit}
                        </span>
                      )}
                    </td>

                    {/* Actions & Quick Stock In */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick S/N Kirim or Standard Stock Increment */}
                        {hasSN ? (
                          <button
                            onClick={() => {
                              setQuickStockProduct(product);
                              setQuickNewSerialsText('');
                            }}
                            className="px-2 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-500 hover:text-white text-cyan-700 dark:text-cyan-300 font-bold font-mono transition text-[11px] border border-cyan-200 dark:border-cyan-800 flex items-center gap-1"
                            title="Yangi seriya raqamlarni kirim qilish"
                          >
                            <Plus className="w-3 h-3" /> S/N Kirim
                          </button>
                        ) : !isService ? (
                          <>
                            <button
                              onClick={() => onUpdateStock(product.id, product.stockQuantity + 5)}
                              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white text-slate-700 dark:text-slate-300 font-bold font-mono transition text-[11px]"
                              title="+5 dona qo'shish"
                            >
                              +5
                            </button>
                            <button
                              onClick={() => onUpdateStock(product.id, product.stockQuantity + 20)}
                              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white text-slate-700 dark:text-slate-300 font-bold font-mono transition text-[11px]"
                              title="+20 dona qo'shish"
                            >
                              +20
                            </button>
                          </>
                        ) : null}

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditProduct(product)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white text-slate-600 dark:text-slate-300 transition"
                          title="Tahrirlash (Redakt)"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            if (window.confirm(`"${product.name}" mahsulotini o'chirmoqchimisiz?`)) {
                              onDeleteProduct(product.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-500 hover:text-white text-slate-400 transition"
                          title="O'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

  {/* CONDITIONAL SUB-TAB: PURCHASES (PRIXOD / NAKLADNOY) */}
  {activeSubTab === 'purchases' && (
    <div className="space-y-4">
      {/* Purchases Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Nakladnoy №, yetkazib beruvchi, S/N seriya raqami..."
            value={purchaseSearchQuery}
            onChange={(e) => setPurchaseSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs focus:ring-2 focus:ring-cyan-500/40 text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setPurchaseStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                purchaseStatusFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Barchasi ({currentPurchases.length})
            </button>
            <button
              onClick={() => setPurchaseStatusFilter('paid')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                purchaseStatusFilter === 'paid'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              To&apos;langan
            </button>
            <button
              onClick={() => setPurchaseStatusFilter('debt')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                purchaseStatusFilter === 'debt'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Qarz / Nasiya
            </button>
            <button
              onClick={() => setPurchaseStatusFilter('cancelled')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                purchaseStatusFilter === 'cancelled'
                  ? 'bg-white dark:bg-slate-700 text-slate-500 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Bekor qilingan
            </button>
          </div>

          <button
            onClick={() => exportPurchasesToExcel(currentPurchases)}
            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-[0.98]"
            title="Kirim nakladnoylar ro'yxatini Excelga yuklash"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel Eksport</span>
          </button>

          <button
            onClick={() => {
              setPaymentModalPurchaseId(null);
              setPaymentModalSupplierName(null);
              setIsSupplierPaymentModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-[0.98]"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>+ Ta&apos;minotchiga To&apos;lov</span>
          </button>

          <button
            onClick={() => {
              setEditingPurchaseInvoice(null);
              setIsNewPurchaseModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-[0.98]"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>+ Yangi Kirim</span>
          </button>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {filteredPurchases.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 mx-auto flex items-center justify-center mb-3">
              <Truck className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Kirim hujjati topilmadi
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Yetkazib beruvchilar va dilerlardan kelgan yangi tovarlarni ro&apos;yxatga olish uchun yangi kirim nakladnoyini shakllantiring.
            </p>
            <button
              onClick={() => setIsNewPurchaseModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-cyan-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi Kirim Yaratish</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nakladnoy & Sana</th>
                  <th className="py-3 px-4">Yetkazib Beruvchi (Supplier)</th>
                  <th className="py-3 px-4">Keltirilgan Tovarlar</th>
                  <th className="py-3 px-4 text-center">S/N Seriya</th>
                  <th className="py-3 px-4 text-right">Jami Summa</th>
                  <th className="py-3 px-4 text-center">To&apos;lov & Usul</th>
                  <th className="py-3 px-4 text-center">Holati</th>
                  <th className="py-3 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPurchases.map((purchase) => {
                  const totalQty = purchase.items.reduce((s, i) => s + i.quantity, 0);
                  const totalSerials = purchase.items.reduce((s, i) => s + (i.serialNumbers?.length || 0), 0);
                  const isCancelled = purchase.status === 'cancelled';
                  const purchaseUZS = purchase.totalAmount;
                  const purchaseUSD = purchase.totalAmountUSD || (purchase.exchangeRate ? Number((purchase.totalAmount / purchase.exchangeRate).toFixed(2)) : Number((purchase.totalAmount / (exchangeRate || 12850)).toFixed(2)));

                  return (
                    <tr 
                      key={purchase.id} 
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                        isCancelled ? 'opacity-60 bg-slate-50/40 dark:bg-slate-900/40' : ''
                      }`}
                    >
                      {/* Invoice # & Date */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                          <span>{purchase.invoiceNumber}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{purchase.createdAt}</span>
                        </div>
                        {purchase.receivedBy && (
                          <div className="text-[10px] text-slate-600 dark:text-slate-300 font-medium mt-0.5 flex items-center gap-1" title="Kirim qilgan mas'ul xodim">
                            <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="truncate max-w-[150px]">{purchase.receivedBy}</span>
                          </div>
                        )}
                      </td>

                      {/* Supplier */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{purchase.supplierName}</span>
                        </div>
                        {purchase.supplierPhone && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" />
                            <span>{purchase.supplierPhone}</span>
                          </div>
                        )}
                      </td>

                      {/* Items summary */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {purchase.items.length} xil mahsulot ({totalQty} dona)
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                          {purchase.items.map(i => i.productName).join(', ')}
                        </div>
                      </td>

                      {/* S/N Count */}
                      <td className="py-3 px-4 text-center">
                        {totalSerials > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 font-mono font-bold text-[10px] border border-cyan-200 dark:border-cyan-800">
                            <Hash className="w-2.5 h-2.5" />
                            <span>{totalSerials} ta S/N</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">S/Nsiz</span>
                        )}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-mono font-extrabold text-slate-900 dark:text-white">
                          {baseCurrency === 'USD' ? `$${formatUSDNumber(purchaseUSD)}` : `${formatNumberWithSpaces(purchaseUZS)} so'm`}
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                          ≈ {baseCurrency === 'USD' ? `${formatNumberWithSpaces(purchaseUZS)} so'm` : `$${formatUSDNumber(purchaseUSD)}`}
                          <span className="text-[8px] text-slate-400/80 ml-1">({formatNumberWithSpaces(purchase.exchangeRate || exchangeRate)})</span>
                        </div>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-0.5">
                          {purchase.paymentStatus === 'paid' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              ✓ To&apos;langan
                            </span>
                          ) : purchase.paymentStatus === 'debt' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                              Nasiya (Qarz)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                              Qisman to&apos;lov
                            </span>
                          )}
                          <span className="text-[9px] text-slate-400 uppercase font-mono">
                            {purchase.paymentMethod === 'usd' ? '$ Naqd' : purchase.paymentMethod === 'bank_transfer' ? 'Perechisleniye' : purchase.paymentMethod === 'card' ? 'Karta' : 'Naqd so\'m'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {isCancelled ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Bekor qilingan
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300">
                            ✓ Qabul qilingan
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View / Print Invoice */}
                          <button
                            onClick={() => setViewingPurchaseInvoice(purchase)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-cyan-500 hover:text-white text-slate-700 dark:text-slate-200 font-bold text-[11px] transition flex items-center gap-1"
                            title="Fakturani ko'rish va chop etish"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ko&apos;rish</span>
                          </button>

                          {/* Edit Purchase Invoice */}
                          {!isCancelled && (
                            <button
                              onClick={() => {
                                setEditingPurchaseInvoice(purchase);
                                setIsNewPurchaseModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-500 hover:text-white text-amber-700 dark:text-amber-300 font-bold text-[11px] transition flex items-center gap-1"
                              title="Kirim fakturasini tahrirlash (redakt)"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Tahrirlash</span>
                            </button>
                          )}

                          {/* Pay Supplier / To'lov qilish */}
                          {!isCancelled && purchase.paymentStatus !== 'paid' && (
                            <button
                              onClick={() => {
                                setPaymentModalPurchaseId(purchase.id);
                                setPaymentModalSupplierName(purchase.supplierName);
                                setIsSupplierPaymentModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 font-bold text-[11px] transition flex items-center gap-1 shadow-sm"
                              title="Ushbu nakladnoyga to'lov biriktirish"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>To&apos;lov</span>
                            </button>
                          )}

                          {/* Cancel Invoice */}
                          {!isCancelled && onCancelPurchase && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Haqiqatan ham #${purchase.invoiceNumber} kirim fakturasini bekor qilmoqchimisiz?`)) {
                                  onCancelPurchase(purchase.id);
                                }
                              }}
                              className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 transition"
                              title="Bekor qilish"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )}

  {/* CONDITIONAL SUB-TAB: SUPPLIER PAYMENTS & DEBT MANAGEMENT */}
  {activeSubTab === 'supplier_payments' && (
    <div className="space-y-6">
      {/* Header, Search & Suppliers Filters */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Text Search */}
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ta'minotchi qidirish..."
              value={supplierSearchQuery}
              onChange={(e) => setSupplierSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500/40 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Supplier Dropdown Filter */}
          <div className="relative min-w-[200px]">
            <select
              value={selectedSupplierFilter}
              onChange={(e) => setSelectedSupplierFilter(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="all">🏢 Barcha Ta&apos;minotchilar ({suppliersSummary.length} ta)</option>
              {suppliersSummary.map((supp, idx) => (
                <option key={idx} value={supp.name}>
                  {supp.name} {supp.totalDebtUZS > 0 ? `(Qarz: ${formatNumberWithSpaces(supp.totalDebtUZS)} so'm)` : `(Qarzsiz)`}
                </option>
              ))}
            </select>
          </div>

          {/* Debt Status Quick Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSupplierDebtStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition ${
                supplierDebtStatusFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Barchasi
            </button>
            <button
              type="button"
              onClick={() => setSupplierDebtStatusFilter('with_debt')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition ${
                supplierDebtStatusFilter === 'with_debt'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <span>Faqat Qarzlar</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200">
                {suppliersSummary.filter(s => s.totalDebtUZS > 0).length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSupplierDebtStatusFilter('settled')}
              className={`px-2.5 py-1 rounded-lg transition ${
                supplierDebtStatusFilter === 'settled'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              Qarzsizlar
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-center">
          <button
            onClick={() => {
              setPaymentModalPurchaseId(null);
              setPaymentModalSupplierName(selectedSupplierFilter !== 'all' ? selectedSupplierFilter : null);
              setIsSupplierPaymentModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition active:scale-[0.98] shrink-0"
          >
            <CreditCard className="w-4 h-4" />
            <span>+ Yangi To&apos;lov Qilish</span>
          </button>
        </div>
      </div>

      {/* KPI Strip for Suppliers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Debt Owed (Filtered vs All) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {selectedSupplierFilter !== 'all' ? `Qarz: ${selectedSupplierFilter}` : "Filtr Bo'yicha Qarz (Jami)"}
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              filteredSupplierDebtUZS > 0 
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400' 
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
            }`}>
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-xl font-black font-mono ${
              filteredSupplierDebtUZS > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
            }`}>
              {formatMoney(filteredSupplierDebtUZS, baseCurrency, exchangeRate)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              ≈ {formatMoney(filteredSupplierDebtUZS, baseCurrency === 'UZS' ? 'USD' : 'UZS', exchangeRate)}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] flex items-center justify-between">
            <span className="text-slate-500">
              {selectedSupplierFilter !== 'all' ? 'Ushbu ta\'minotchi' : `Ta'minotchilar: ${filteredSuppliersSummary.length} ta`}
            </span>
            <span className={`font-bold ${filteredSupplierDebtUZS > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
              {filteredSupplierDebtUZS > 0 ? 'Qarz mavjud' : 'To\'liq yopilgan'}
            </span>
          </div>
        </div>

        {/* Card 2: Total Paid to Suppliers */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">To&apos;langan Jami Summa</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {formatMoney(totalSupplierPaidUZS, baseCurrency, exchangeRate)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              ≈ {formatMoney(totalSupplierPaidUZS, baseCurrency === 'UZS' ? 'USD' : 'UZS', exchangeRate)}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] flex items-center justify-between">
            <span className="text-slate-500">Jami xarid ulushi:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
              {totalPurchasesUZS > 0 ? Math.round((totalSupplierPaidUZS / totalPurchasesUZS) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Card 3: Suppliers Count */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Qarzdor Ta&apos;minotchilar</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {suppliersSummary.filter(s => s.totalDebtUZS > 0).length}
            </span>
            <span className="text-xs text-slate-500 font-medium">/ {suppliersSummary.length} ta hamkor</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] flex items-center justify-between">
            <span className="text-slate-500">To&apos;liq yopilgan:</span>
            <span className="font-mono text-emerald-600 font-bold">
              {suppliersSummary.filter(s => s.totalDebtUZS === 0).length} ta ta&apos;minotchi
            </span>
          </div>
        </div>

        {/* Card 4: Payments count */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Amalga Oshirilgan To&apos;lovlar</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {allSupplierPayments.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">ta tranzaksiya</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] flex items-center justify-between">
            <span className="text-slate-500">Nakladnoylar:</span>
            <span className="font-mono text-cyan-600 font-bold">{currentPurchases.length} ta qabul qilingan</span>
          </div>
        </div>
      </div>

      {/* Section 1: Supplier Balances Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-600" />
            <span>Ta&apos;minotchilar Balansi va Qarzdorliklari ({filteredSuppliersSummary.length} ta hamkor):</span>
          </h3>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Yetkazib Beruvchi (Ta&apos;minotchi)</th>
                  <th className="py-3 px-4 text-center">Nakladnoylar</th>
                  <th className="py-3 px-4 text-right">Jami Xarid Hajmi</th>
                  <th className="py-3 px-4 text-right">To&apos;langan Summa</th>
                  <th className="py-3 px-4 text-right">Qolgan Qarzimiz</th>
                  <th className="py-3 px-4 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSuppliersSummary.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Ta&apos;minotchilar topilmadi
                    </td>
                  </tr>
                ) : (
                  filteredSuppliersSummary.map((supp, sIdx) => {
                    const hasDebt = supp.totalDebtUZS > 0;
                    return (
                      <tr key={sIdx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        {/* Supplier Name & Phone */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span>{supp.name}</span>
                          </div>
                          {supp.phone && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" />
                              <span>{supp.phone}</span>
                            </div>
                          )}
                        </td>

                        {/* Invoices Count */}
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {supp.invoicesCount} ta
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {supp.paidInvoicesCount} to&apos;langan &bull; {supp.debtInvoicesCount} qarz
                          </div>
                        </td>

                        {/* Total Purchases */}
                        <td className="py-3 px-4 text-right">
                          <div className="font-mono font-bold text-slate-900 dark:text-white">
                            {formatMoney(supp.totalPurchasesUZS, baseCurrency, exchangeRate)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            ≈ {formatMoney(supp.totalPurchasesUZS, baseCurrency === 'UZS' ? 'USD' : 'UZS', exchangeRate)}
                          </div>
                        </td>

                        {/* Total Paid */}
                        <td className="py-3 px-4 text-right">
                          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatMoney(supp.totalPaidUZS, baseCurrency, exchangeRate)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            ≈ {formatMoney(supp.totalPaidUZS, baseCurrency === 'UZS' ? 'USD' : 'UZS', exchangeRate)}
                          </div>
                        </td>

                        {/* Remaining Debt */}
                        <td className="py-3 px-4 text-right">
                          {hasDebt ? (
                            <div>
                              <div className="font-mono font-black text-rose-600 dark:text-rose-400">
                                {formatMoney(supp.totalDebtUZS, baseCurrency, exchangeRate)}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                ≈ {formatMoney(supp.totalDebtUZS, baseCurrency === 'UZS' ? 'USD' : 'UZS', exchangeRate)}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              ✓ Qarz yo&apos;q
                            </span>
                          )}
                        </td>

                        {/* Action Button */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {hasDebt ? (
                              <button
                                onClick={() => {
                                  setPaymentModalSupplierName(supp.name);
                                  setPaymentModalPurchaseId(null);
                                  setIsSupplierPaymentModalOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition active:scale-[0.98]"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>To&apos;lov Qilish</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setPurchaseSearchQuery(supp.name);
                                  setActiveSubTab('purchases');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 text-xs font-semibold transition"
                              >
                                Kirimlar
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

      {/* Section 2: Linked Payment History Log */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>Qabul Qilingan Nakladnoylarga Biriktirilgan To&apos;lovlar Tarixi ({allSupplierPayments.length} ta):</span>
          </h3>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          {allSupplierPayments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Hozircha nakladnoylarga biriktirilgan to&apos;lovlar tarixi mavjud emas. Yuqoridagi &quot;+ Yangi To&apos;lov Qilish&quot; tugmasi orqali to&apos;lov kiriting.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Sana & Vaqt</th>
                    <th className="py-3 px-4">Ta&apos;minotchi</th>
                    <th className="py-3 px-4">Biriktirilgan Nakladnoy</th>
                    <th className="py-3 px-4 text-right">To&apos;langan Summa ($)</th>
                    <th className="py-3 px-4 text-right">To&apos;langan Summa (so&apos;m)</th>
                    <th className="py-3 px-4 text-center">To&apos;lov Usuli</th>
                    <th className="py-3 px-4">Mas&apos;ul & Izoh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {allSupplierPayments.map((pm) => {
                    const targetInvoice = currentPurchases.find(p => p.id === pm.purchaseId);
                    return (
                      <tr key={pm.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{pm.date}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-white">
                          {pm.supplierName}
                        </td>

                        <td className="py-3 px-4">
                          {targetInvoice ? (
                            <button
                              type="button"
                              onClick={() => setViewingPurchaseInvoice(targetInvoice)}
                              className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                              title="Fakturani ko'rish"
                            >
                              <FileText className="w-3 h-3" />
                              <span>#{pm.invoiceNumber}</span>
                            </button>
                          ) : (
                            <span className="text-slate-500 font-bold">#{pm.invoiceNumber}</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                          ${formatUSDNumber(pm.amountUSD)}
                        </td>

                        <td className="py-3 px-4 text-right text-slate-800 dark:text-slate-200 font-bold">
                          {formatNumberWithSpaces(pm.amount)} so&apos;m
                        </td>

                        <td className="py-3 px-4 text-center font-sans">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                            {pm.paymentMethod === 'usd' ? '$ Naqd' : pm.paymentMethod === 'bank_transfer' ? 'Perechisleniye' : pm.paymentMethod === 'card' ? 'Karta' : 'Naqd so\'m'}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-sans text-slate-500 text-[11px] truncate max-w-xs">
                          {pm.paidBy ? <strong className="text-slate-700 dark:text-slate-300">{pm.paidBy}: </strong> : null}
                          {pm.notes || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )}

      {/* MODAL 1: ADD PRODUCT / SERVICE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-500" />
                Yangi Qurilma yoki Montaj Xizmati Qo&apos;shish
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5 overflow-y-auto pr-1 flex-1">
              {/* Type Switches: Service or Serialized */}
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsService}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setNewIsService(isChecked);
                      if (isChecked) {
                        setNewHasSerialNumber(false);
                        setNewUnit('nuqta');
                        // Avtomatik ravishda toifani montaj/o'rnatish xizmatiga o'tkazish
                        const serviceCat = categories.find(c => 
                          c.name.toLowerCase().includes('montaj') || 
                          c.name.toLowerCase().includes('o\'rnatish') || 
                          c.name.toLowerCase().includes('xizmat')
                        );
                        if (serviceCat) {
                          setNewCategory(serviceCat.name);
                        } else if (categories.length > 0) {
                          setNewCategory("O'rnatish & Montaj xizmatlari");
                        }
                      } else {
                        setNewUnit('dona');
                        // Mahsulotga qaytganda CCTV yoki birinchi mavjud mahsulot toifasiga qaytarish
                        const cctvCat = categories.find(c => 
                          !c.name.toLowerCase().includes('montaj') && 
                          !c.name.toLowerCase().includes('xizmat')
                        );
                        if (cctvCat) {
                          setNewCategory(cctvCat.name);
                        }
                      }
                    }}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Montaj / O&apos;rnatish Xizmati</span>
                    <span className="text-[10px] text-slate-400 block">Ombor hisobi yuritilmaydi</span>
                  </div>
                </label>

                {!newIsService && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newHasSerialNumber}
                      onChange={(e) => setNewHasSerialNumber(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Seriya Raqamli (S/N)</span>
                      <span className="text-[10px] text-slate-400 block">Kamera, NVR, Router</span>
                    </div>
                  </label>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nomi</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Hikvision 4MP IP Tashqi Kamera yoki Kamera Montaji (1 nuqta)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              {/* Product Image Section */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Mahsulot Rasmi / Surati (Ixtiyoriy)</span>
                  </label>
                  {newImageUrl && (
                    <button
                      type="button"
                      onClick={() => setNewImageUrl('')}
                      className="text-[10px] text-rose-500 hover:underline font-semibold"
                    >
                      Suratni o&apos;chirish
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Live Preview Box */}
                  <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 p-1">
                    {newImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={newImageUrl} alt="Preview" className="w-full h-full object-contain" />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      placeholder="Rasm havolasi (URL) yoki fayl yuklang..."
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                    />
                    
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 text-cyan-700 dark:text-cyan-300 text-[11px] font-bold border border-cyan-200 dark:border-cyan-800 transition">
                        <Upload className="w-3 h-3" />
                        <span>Fayldan tanlash</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                if (evt.target?.result) {
                                  setNewImageUrl(evt.target.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <span className="text-[10px] text-slate-400">JPG, PNG, WebP</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kategoriya</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddModalOpen(false);
                        setIsCategoryManageModalOpen(true);
                      }}
                      className="text-[10px] text-cyan-600 font-semibold hover:underline"
                    >
                      + Toifa
                    </button>
                  </div>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">O&apos;lchov birligi</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="dona">dona</option>
                    <option value="nuqta">nuqta (montaj)</option>
                    <option value="xizmat">xizmat (sozlash)</option>
                    <option value="metr">metr (kabel)</option>
                    <option value="quti">quti (305m)</option>
                    <option value="to'plam">to&apos;plam</option>
                  </select>
                </div>
              </div>

              {/* Price & Currency Section */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Narxlar va Valyuta</span>
                  </label>

                  {/* Currency Switcher */}
                  <div className="flex rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-0.5">
                    <button
                      type="button"
                      onClick={() => handleSwitchNewCurrency('UZS')}
                      className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md transition ${
                        newProductCurrency === 'UZS'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      SO&apos;M (UZS)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchNewCurrency('USD')}
                      className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md transition ${
                        newProductCurrency === 'USD'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      USD ($)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Tannarx ({newProductCurrency === 'USD' ? '$ USD' : 'so\'m'}):
                    </label>
                    <input
                      type="number"
                      step={newProductCurrency === 'USD' ? '0.01' : '1'}
                      value={newCostPrice === 0 ? '' : newCostPrice}
                      placeholder="0"
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewCostPrice(val === '' ? 0 : parseFloat(val) || 0);
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      {newProductCurrency === 'USD'
                        ? `~ ${formatNumberWithSpaces(Math.round(newCostPrice * exchangeRate))} so'm`
                        : `~ $${formatUSDNumber(newCostPrice / exchangeRate)}`}
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      * Sotish Narxi ({newProductCurrency === 'USD' ? '$ USD' : 'so\'m'}):
                    </label>
                    <input
                      type="number"
                      step={newProductCurrency === 'USD' ? '0.01' : '1'}
                      required
                      value={newRetailPrice === 0 ? '' : newRetailPrice}
                      placeholder="0"
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewRetailPrice(val === '' ? 0 : parseFloat(val) || 0);
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-full bg-white dark:bg-slate-900 border-2 border-emerald-500/50 focus:border-emerald-500 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 outline-none"
                    />
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold block mt-0.5">
                      {newProductCurrency === 'USD'
                        ? `~ ${formatNumberWithSpaces(Math.round(newRetailPrice * exchangeRate))} so'm`
                        : `~ $${formatUSDNumber(newRetailPrice / exchangeRate)}`}
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Kafolat (oy):
                    </label>
                    <input
                      type="number"
                      value={newWarrantyMonths === 0 ? '' : newWarrantyMonths}
                      placeholder="0"
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewWarrantyMonths(val === '' ? 0 : Math.max(0, parseInt(val) || 0));
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Technician Wage for Services */}
              {newIsService && (
                <div className="p-3 rounded-xl bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-pink-900 dark:text-pink-200 flex items-center gap-1.5">
                      <HardHat className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
                      <span>Montajchi Ustaga To&apos;lanadigan Xizmat Haqqi</span>
                    </label>
                    <span className="text-[10px] text-pink-600 dark:text-pink-300 font-semibold">
                      Masalan: Domofon 25$, Kamera 8$ yoki 12$
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Ustaga ($ Dollarda):</span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-pink-600">$</span>
                        <input
                          type="number"
                          step="0.5"
                          placeholder="25"
                          value={newTechnicianWageUSD || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setNewTechnicianWageUSD(val);
                            setNewTechnicianWageUZS(Math.round(val * exchangeRate));
                          }}
                          className="w-full bg-white dark:bg-slate-900 border border-pink-200 dark:border-pink-800 rounded-xl pl-6 pr-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Ustaga (So&apos;mda):</span>
                      <input
                        type="number"
                        placeholder="320000"
                        value={newTechnicianWageUZS || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setNewTechnicianWageUZS(val);
                          setNewTechnicianWageUSD(Number((val / exchangeRate).toFixed(1)));
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-pink-200 dark:border-pink-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Serial Numbers entry or standard stock */}
              {newHasSerialNumber && !newIsService ? (
                <div className="p-3 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-cyan-900 dark:text-cyan-200 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-cyan-600" />
                      Seriya Raqamlarini Kiriting (S/N)
                    </label>
                    <span className="text-[11px] font-mono font-bold text-cyan-700 dark:text-cyan-300">
                      {parseSerials(newSerialNumbersText).length} ta dona
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="S/N larni skanerlang yoki kiriting (har bir qatorda bittadan yoki vergul bilan):&#10;HK-4MP-001&#10;HK-4MP-002"
                    value={newSerialNumbersText}
                    onChange={(e) => setNewSerialNumbersText(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-cyan-300 dark:border-cyan-700 rounded-xl p-2.5 text-xs font-mono text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-cyan-700/80 dark:text-cyan-400">
                    Shtrix-kod skanerdan ketma-ket o&apos;tkazish mumkin. Zaxira qoldig&apos;i kiritilgan S/N soniga teng bo&apos;ladi.
                  </p>
                </div>
              ) : !newIsService ? (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Boshlang&apos;ich Qoldiq</label>
                    <input
                      type="number"
                      value={newStock || ''}
                      onChange={(e) => setNewStock(Number(e.target.value))}
                      className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Shtrix-kod</label>
                    <input
                      type="text"
                      placeholder="Avtomat generatsiya"
                      value={newBarcode}
                      onChange={(e) => setNewBarcode(e.target.value)}
                      className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              ) : null}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition mt-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
              >
                Omborga Kiritish
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT PRODUCT / SERVICE */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-amber-500" />
                  Mahsulotni Tahrirlash (Redakt)
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  ID: {editingProduct.id} &bull; {editingProduct.sku}
                </p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedProduct} className="space-y-3.5 overflow-y-auto pr-1 flex-1">
              {/* Type Switches */}
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsService}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setEditIsService(isChecked);
                      if (isChecked) {
                        setEditHasSerialNumber(false);
                        const serviceCat = categories.find(c => 
                          c.name.toLowerCase().includes('montaj') || 
                          c.name.toLowerCase().includes('o\'rnatish') || 
                          c.name.toLowerCase().includes('xizmat')
                        );
                        if (serviceCat) {
                          setEditCategory(serviceCat.name);
                        } else if (categories.length > 0) {
                          setEditCategory("O'rnatish & Montaj xizmatlari");
                        }
                      }
                    }}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Montaj / Xizmat</span>
                    <span className="text-[10px] text-slate-400 block">Cheksiz miqdor</span>
                  </div>
                </label>

                {!editIsService && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editHasSerialNumber}
                      onChange={(e) => setEditHasSerialNumber(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Seriya Raqamli (S/N)</span>
                      <span className="text-[10px] text-slate-400 block">Alohida S/N nazorati</span>
                    </div>
                  </label>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nomi</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              {/* Product Image Section (Edit Mode) */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                    <span>Mahsulot Rasmi / Surati (Ixtiyoriy)</span>
                  </label>
                  {editImageUrl && (
                    <button
                      type="button"
                      onClick={() => setEditImageUrl('')}
                      className="text-[10px] text-rose-500 hover:underline font-semibold"
                    >
                      Suratni o&apos;chirish
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Live Preview Box */}
                  <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 p-1">
                    {editImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={editImageUrl} alt="Preview" className="w-full h-full object-contain" />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      placeholder="Rasm havolasi (URL) yoki fayl yuklang..."
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                    />
                    
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-[11px] font-bold border border-amber-200 dark:border-amber-800 transition">
                        <Upload className="w-3 h-3" />
                        <span>Fayldan tanlash</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                if (evt.target?.result) {
                                  setEditImageUrl(evt.target.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <span className="text-[10px] text-slate-400">JPG, PNG, WebP</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kategoriya</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">O&apos;lchov Birligi</label>
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="dona">dona</option>
                    <option value="nuqta">nuqta (montaj)</option>
                    <option value="xizmat">xizmat (sozlash)</option>
                    <option value="metr">metr (kabel)</option>
                    <option value="quti">quti (305m)</option>
                    <option value="to'plam">to&apos;plam</option>
                  </select>
                </div>
              </div>

              {/* Price & Currency Section (Edit Mode) */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                    <span>Narxlar va Valyuta</span>
                  </label>

                  {/* Currency Switcher */}
                  <div className="flex rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-0.5">
                    <button
                      type="button"
                      onClick={() => handleSwitchEditCurrency('UZS')}
                      className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md transition ${
                        editProductCurrency === 'UZS'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      SO&apos;M (UZS)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchEditCurrency('USD')}
                      className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md transition ${
                        editProductCurrency === 'USD'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      USD ($)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Tannarx ({editProductCurrency === 'USD' ? '$ USD' : 'so\'m'}):
                    </label>
                    <input
                      type="number"
                      step={editProductCurrency === 'USD' ? '0.01' : '1'}
                      value={editCostPrice === 0 ? '' : editCostPrice}
                      placeholder="0"
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditCostPrice(val === '' ? 0 : parseFloat(val) || 0);
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      {editProductCurrency === 'USD'
                        ? `~ ${formatNumberWithSpaces(Math.round(editCostPrice * exchangeRate))} so'm`
                        : `~ $${formatUSDNumber(editCostPrice / exchangeRate)}`}
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      * Sotish Narxi ({editProductCurrency === 'USD' ? '$ USD' : 'so\'m'}):
                    </label>
                    <input
                      type="number"
                      step={editProductCurrency === 'USD' ? '0.01' : '1'}
                      required
                      value={editRetailPrice === 0 ? '' : editRetailPrice}
                      placeholder="0"
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditRetailPrice(val === '' ? 0 : parseFloat(val) || 0);
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-full bg-white dark:bg-slate-900 border-2 border-emerald-500/50 focus:border-emerald-500 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 outline-none"
                    />
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold block mt-0.5">
                      {editProductCurrency === 'USD'
                        ? `~ ${formatNumberWithSpaces(Math.round(editRetailPrice * exchangeRate))} so'm`
                        : `~ $${formatUSDNumber(editRetailPrice / exchangeRate)}`}
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Kafolat (oy):
                    </label>
                    <input
                      type="number"
                      value={editWarrantyMonths === 0 ? '' : editWarrantyMonths}
                      placeholder="0"
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditWarrantyMonths(val === '' ? 0 : Math.max(0, parseInt(val) || 0));
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Technician Wage for Services (Edit Mode) */}
              {editIsService && (
                <div className="p-3 rounded-xl bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-pink-900 dark:text-pink-200 flex items-center gap-1.5">
                      <HardHat className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
                      <span>Montajchi Ustaga To&apos;lanadigan Xizmat Haqqi</span>
                    </label>
                    <span className="text-[10px] text-pink-600 dark:text-pink-300 font-semibold">
                      Masalan: Domofon 25$, Kamera 8$ yoki 12$
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Ustaga ($ Dollarda):</span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-pink-600">$</span>
                        <input
                          type="number"
                          step="0.5"
                          placeholder="25"
                          value={editTechnicianWageUSD === 0 ? '' : editTechnicianWageUSD}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Number(e.target.value) || 0;
                            setEditTechnicianWageUSD(val);
                            setEditTechnicianWageUZS(Math.round(val * exchangeRate));
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-full bg-white dark:bg-slate-900 border border-pink-200 dark:border-pink-800 rounded-xl pl-6 pr-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Ustaga (So&apos;mda):</span>
                      <input
                        type="number"
                        placeholder="320000"
                        value={editTechnicianWageUZS === 0 ? '' : editTechnicianWageUZS}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : Number(e.target.value) || 0;
                          setEditTechnicianWageUZS(val);
                          setEditTechnicianWageUSD(Number((val / exchangeRate).toFixed(1)));
                        }}
                        onFocus={(e) => e.target.select()}
                        className="w-full bg-white dark:bg-slate-900 border border-pink-200 dark:border-pink-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editHasSerialNumber && !editIsService ? (
                <div className="p-3 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-cyan-900 dark:text-cyan-200 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-cyan-600" />
                      Mavjud Seriya Raqamlari (S/N)
                    </label>
                    <span className="text-[11px] font-mono font-bold text-cyan-700 dark:text-cyan-300">
                      {parseSerials(editSerialNumbersText).length} ta mavjud
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={editSerialNumbersText}
                    onChange={(e) => setEditSerialNumbersText(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-cyan-300 dark:border-cyan-700 rounded-xl p-2.5 text-xs font-mono text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-cyan-700/80 dark:text-cyan-400">
                    Siz seriya raqamlarini to&apos;g&apos;ridan-to&apos;g&apos;ri tahrirlashingiz, yangisini qo&apos;shishingiz yoki o&apos;chirishingiz mumkin.
                  </p>
                </div>
              ) : !editIsService ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Ombordagi Qoldiq</label>
                    <input
                      type="number"
                      value={editStock === 0 ? '' : editStock}
                      placeholder="0"
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditStock(val === '' ? 0 : Number(val) || 0);
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Min. Zaxira Chegarasi</label>
                    <input
                      type="number"
                      value={editMinStock === 0 ? '' : editMinStock}
                      placeholder="0"
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditMinStock(val === '' ? 0 : Number(val) || 0);
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Shtrix-kod</label>
                  <input
                    type="text"
                    value={editBarcode}
                    onChange={(e) => setEditBarcode(e.target.value)}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Artikul (SKU)</label>
                  <input
                    type="text"
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`"${editingProduct.name}" tovarini butunlay o'chirib tashlamoqchimisiz?`)) {
                      onDeleteProduct(editingProduct.id);
                      setEditingProduct(null);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 transition"
                >
                  O&apos;chirish
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-lg shadow-emerald-600/20 transition active:scale-[0.98]"
                  >
                    O&apos;zgarishlarni Saqlash
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW SERIAL NUMBERS (S/N INSPECTOR) */}
      {viewingSerialProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Hash className="w-5 h-5 text-cyan-500" />
                  Mavjud Seriya Raqamlari (S/N)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                  {viewingSerialProduct.name}
                </p>
              </div>
              <button
                onClick={() => setViewingSerialProduct(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {(viewingSerialProduct.serialNumbers && viewingSerialProduct.serialNumbers.length > 0) ? (
                viewingSerialProduct.serialNumbers.map((sn, idx) => (
                  <div
                    key={sn + idx}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span className="w-5 h-5 rounded-md bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{sn}</span>
                    </div>

                    <button
                      onClick={() => handleCopySerial(sn)}
                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                      title="Nusxa olish"
                    >
                      {copiedSn === sn ? (
                        <CheckCheck className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-xs text-slate-400">
                  Ushbu mahsulotda hozircha omborda seriya raqami mavjud emas
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-medium">
                Jami: {viewingSerialProduct.serialNumbers?.length || 0} dona
              </span>
              <button
                onClick={() => {
                  setQuickStockProduct(viewingSerialProduct);
                  setViewingSerialProduct(null);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Yangi S/N Kirim qilish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: QUICK S/N STOCK ENTRY (KIRIM QILISH) */}
      {quickStockProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-cyan-500" />
                  Yangi Seriya Raqamlari Kirimi (S/N)
                </h3>
                <p className="text-xs text-slate-500 truncate max-w-xs">{quickStockProduct.name}</p>
              </div>
              <button
                onClick={() => setQuickStockProduct(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddSerials} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Shtrix-kod skanerdan o&apos;tkazing yoki yozing:
                  </label>
                  <span className="text-xs font-mono font-bold text-cyan-600">
                    +{parseSerials(quickNewSerialsText).length} ta yangi dona
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  autoFocus
                  placeholder="Masalan:&#10;HK-4MP-982105&#10;HK-4MP-982106"
                  value={quickNewSerialsText}
                  onChange={(e) => setQuickNewSerialsText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/40"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Mavjud ombor qoldig&apos;iga qo&apos;shiladi ({quickStockProduct.stockQuantity} dona hozirda bor).
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickStockProduct(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 transition active:scale-[0.98]"
                >
                  Kirimni Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: CATEGORIES MANAGEMENT (ADMIN) */}
      {isCategoryManageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-cyan-500" />
                  Mahsulot Kategoriyalarini Boshqarish (Admin)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Yangi sohaviy kategoriyalar qo&apos;shish, nomini o&apos;zgartirish yoki tahrirlash
                </p>
              </div>
              <button
                onClick={() => setIsCategoryManageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add New Category Box */}
            <form onSubmit={handleCreateCategory} className="p-3.5 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900/60 space-y-2.5">
              <span className="text-xs font-bold text-cyan-900 dark:text-cyan-200 block">
                + Yangi Mahsulot Kategoriyasi Qo&apos;shish
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Kategoriya nomi (masalan: Optik tolali uskunalar, Quvvat manbalari)..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/40"
                />
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="w-9 h-8 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
                  title="Kategoriya rangini tanlang"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shrink-0"
                >
                  Qo&apos;shish
                </button>
              </div>
              <input
                type="text"
                placeholder="Qisqacha izoh (ixtiyoriy)..."
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1 text-xs text-slate-600 dark:text-slate-300"
              />
            </form>

            {/* List of Existing Product Categories with Rename & Delete */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Mavjud Kategoriyalar Ro&apos;yxati ({categories.length})
              </span>

              {categories.map((cat) => {
                const isEditing = editingCatId === cat.id;
                const productCount = products.filter((p) => p.category === cat.name).length;

                return (
                  <div
                    key={cat.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color || '#06B6D4' }} />

                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editCatNameValue}
                            onChange={(e) => setEditCatNameValue(e.target.value)}
                            className="flex-1 bg-white dark:bg-slate-900 border border-cyan-500 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 dark:text-white"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEditCategory(cat.id)}
                            className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                            title="Saqlash"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingCatId(null)}
                            className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200"
                            title="Bekor qilish"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                            {cat.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {cat.description || 'Izohsiz'} &bull; {productCount} ta mahsulot mavjud
                          </span>
                        </div>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Rename / Edit Button */}
                        <button
                          onClick={() => {
                            setEditingCatId(cat.id);
                            setEditCatNameValue(cat.name);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 transition"
                          title="Kategoriya nomini o'zgartirish"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            if (window.confirm(`"${cat.name}" kategoriyasini o'chirmoqchimisiz?`)) {
                              onDeleteProductCategory(cat.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                          title="Kategoriyani o'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsCategoryManageModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 transition"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: NEW PURCHASE / PRIXOD FAKTURA */}
      <NewPurchaseModal
        isOpen={isNewPurchaseModalOpen}
        onClose={() => {
          setIsNewPurchaseModalOpen(false);
          setEditingPurchaseInvoice(null);
        }}
        editingPurchase={editingPurchaseInvoice}
        products={products}
        categories={categories}
        exchangeRate={exchangeRate}
        baseCurrency={baseCurrency}
        currentUser={currentUser}
        onConfirmPurchase={(invoice, updatedProducts) => {
          if (onSavePurchase) {
            onSavePurchase(invoice, updatedProducts);
          }
          setIsNewPurchaseModalOpen(false);
          setEditingPurchaseInvoice(null);
        }}
      />

      {/* MODAL 6: VIEW & PRINT PURCHASE INVOICE */}
      <PurchaseInvoiceModal
        invoice={viewingPurchaseInvoice}
        onClose={() => setViewingPurchaseInvoice(null)}
      />

      {/* MODAL 7: SUPPLIER PAYMENT MODAL */}
      <SupplierPaymentModal
        isOpen={isSupplierPaymentModalOpen}
        onClose={() => {
          setIsSupplierPaymentModalOpen(false);
          setPaymentModalPurchaseId(null);
          setPaymentModalSupplierName(null);
        }}
        purchases={currentPurchases}
        preselectedPurchaseId={paymentModalPurchaseId}
        preselectedSupplierName={paymentModalSupplierName}
        exchangeRate={exchangeRate}
        baseCurrency={baseCurrency}
        onConfirmPayment={(payment, updatedInvoice) => {
          if (onRecordSupplierPayment) {
            onRecordSupplierPayment(payment, updatedInvoice);
          } else if (onSavePurchase) {
            onSavePurchase(updatedInvoice, products);
          }
          setIsSupplierPaymentModalOpen(false);
          setPaymentModalPurchaseId(null);
          setPaymentModalSupplierName(null);
        }}
      />

      {/* MODAL 8: EXCEL IMPORT MODAL */}
      {isExcelImportModalOpen && (
        <ExcelImportModal
          isOpen={isExcelImportModalOpen}
          onClose={() => setIsExcelImportModalOpen(false)}
          onImportProducts={handleImportProducts}
        />
      )}
    </div>
  );
};
