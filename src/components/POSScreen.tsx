'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Product, Customer, CartItem, SaleReceipt, PaymentDetails, Employee, AssignedTechnician, Currency, CustomerOrder } from '../types';
import { 
  Search, 
  Barcode, 
  Trash2, 
  Plus, 
  Minus, 
  UserCheck, 
  UserPlus,
  CreditCard, 
  Pause, 
  Play, 
  Gift, 
  ShoppingBag,
  AlertTriangle,
  Hash,
  ShieldCheck,
  Wrench,
  Cpu,
  Camera,
  Package,
  MapPin,
  X,
  Check,
  DollarSign,
  ArrowRightLeft,
  Edit2,
  HardHat,
  Users,
  CheckSquare,
  Square,
  Sliders,
  ChevronDown,
  ChevronUp,
  Lock,
  Bell,
  BellRing,
  Zap
} from 'lucide-react';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { CashierOrderApprovalModal } from './CashierOrderApprovalModal';
import { formatNumberWithSpaces, formatUSDNumber, formatMoney, getNowFormatted } from '../utils/formatters';

interface POSScreenProps {
  products: Product[];
  customers: Customer[];
  employees?: Employee[];
  customerOrders?: CustomerOrder[];
  onCompleteSale: (receipt: SaleReceipt) => void;
  onAddCustomer: (customer: Customer) => void;
  onSaveOrder?: (order: CustomerOrder) => void;
  isOffline: boolean;
  exchangeRate?: number;
  onUpdateExchangeRate?: (rate: number) => void;
  baseCurrency?: Currency;
  onUpdateBaseCurrency?: (curr: Currency) => void;
}

export const POSScreen: React.FC<POSScreenProps> = ({
  products,
  customers,
  employees = [],
  customerOrders = [],
  onCompleteSale,
  onAddCustomer,
  onSaveOrder,
  isOffline,
  exchangeRate = 12850,
  onUpdateExchangeRate,
  baseCurrency = 'UZS',
  onUpdateBaseCurrency
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Barchasi');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
  const [selectedTechnicians, setSelectedTechnicians] = useState<AssignedTechnician[]>([]);
  const [generalDiscountPercent, setGeneralDiscountPercent] = useState<number>(0);
  const [installationAddress, setInstallationAddress] = useState<string>('');
  const [isTechniciansExpanded, setIsTechniciansExpanded] = useState<boolean>(true);

  // Approval modal states
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState<boolean>(false);
  const [linkedApprovalOrderId, setLinkedApprovalOrderId] = useState<string | null>(null);

  // Pending technician orders awaiting cashier confirmation
  const pendingTechnicianOrders = useMemo(() => {
    return (customerOrders || []).filter((o) => o.status === 'pending_cashier_approval');
  }, [customerOrders]);

  // Unified base currency check
  const isUSDBase = baseCurrency === 'USD';

  // Technicians list (Montajchi ustalar va muhandislar)
  const technicians = useMemo(() => {
    return (employees || []).filter((e) => e.role !== 'Kassir / Menejer');
  }, [employees]);

  // Check if cart contains any installation service and get services list
  const serviceItems = useMemo(() => {
    return cart.filter((item) => item.product.isService);
  }, [cart]);

  const cartHasService = serviceItems.length > 0;

  // Calculate total installer fee earned for this job ($ and so'm)
  const totalServiceWageUSD = useMemo(() => {
    return serviceItems.reduce((sum, item) => {
      // Prioritize product.technicianWageUSD if specified (e.g. 25$ for intercom, 8$ or 12$ for camera)
      const wagePerUnit = item.product.technicianWageUSD ?? 
        (item.product.retailPriceUSD ? Math.round(item.product.retailPriceUSD * 0.7) : Math.round((item.appliedPrice / exchangeRate) * 0.7));
      return sum + (wagePerUnit * item.quantity);
    }, 0);
  }, [serviceItems, exchangeRate]);

  const totalServiceWageUZS = Math.round(totalServiceWageUSD * exchangeRate);

  // Helper to split wage equally among assigned technicians
  const calculateEqualSplit = (techList: AssignedTechnician[], totalUSD: number) => {
    if (techList.length === 0) return [];
    const perTechUSD = Number((totalUSD / techList.length).toFixed(2));
    const perTechUZS = Math.round((totalUSD * exchangeRate) / techList.length);
    return techList.map((t) => ({
      ...t,
      wageUSD: perTechUSD,
      wageUZS: perTechUZS
    }));
  };

  // Toggle technician in/out
  const handleToggleTechnician = (emp: Employee) => {
    const isSelected = selectedTechnicians.some((t) => t.id === emp.id);
    let updated: AssignedTechnician[];
    if (isSelected) {
      updated = selectedTechnicians.filter((t) => t.id !== emp.id);
    } else {
      updated = [
        ...selectedTechnicians,
        {
          id: emp.id,
          fullName: emp.fullName,
          phone: emp.phone,
          role: emp.role,
          wageUSD: 0,
          wageUZS: 0
        }
      ];
    }
    setSelectedTechnicians(calculateEqualSplit(updated, totalServiceWageUSD));
  };

  // Update specific technician's wage in USD
  const handleUpdateTechnicianWageUSD = (techId: string, newUSD: number) => {
    setSelectedTechnicians((prev) =>
      prev.map((t) => {
        if (t.id === techId) {
          const wageUSD = Math.max(0, newUSD);
          const wageUZS = Math.round(wageUSD * exchangeRate);
          return { ...t, wageUSD, wageUZS };
        }
        return t;
      })
    );
  };

  // Reset to equal split
  const handleResetSplit = () => {
    setSelectedTechnicians((prev) => calculateEqualSplit(prev, totalServiceWageUSD));
  };

  // Held carts feature (Kassani kutishga qo'yish)
  const [heldCarts, setHeldCarts] = useState<{ id: string; customer?: Customer; technicians?: AssignedTechnician[]; items: CartItem[]; address?: string; time: string }[]>([]);

  // S/N Picker modal state
  const [snPickerProduct, setSnPickerProduct] = useState<Product | null>(null);
  const [snPickerSelected, setSnPickerSelected] = useState<string>('');
  const [snSearchQuery, setSnSearchQuery] = useState<string>('');
  const snInputRef = useRef<HTMLInputElement>(null);

  // Auto focus S/N scanner input when modal opens
  useEffect(() => {
    if (snPickerProduct) {
      setSnSearchQuery('');
      const timer = setTimeout(() => {
        snInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [snPickerProduct]);

  // New Customer Modal state (POS ichidan qo'shish)
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustTier, setNewCustTier] = useState<'Standard' | 'Silver' | 'Gold' | 'VIP'>('Standard');
  const [newCustBonus, setNewCustBonus] = useState<number>(10000);

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [lastReceipt, setLastReceipt] = useState<SaleReceipt | null>(null);

  // Barcode input ref
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Categories list
  const categories = useMemo(() => {
    const cats = ['Barchasi', ...Array.from(new Set(products.map((p) => p.category)))];
    return cats;
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'Barchasi' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.serialNumbers && p.serialNumbers.some((sn) => sn.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Handle adding product to cart
  const handleProductClick = (product: Product) => {
    if (product.hasSerialNumber && product.serialNumbers && product.serialNumbers.length > 0) {
      const existingInCart = cart.find((item) => item.product.id === product.id);
      const usedSerials = existingInCart?.selectedSerialNumbers || [];
      const availableSerials = product.serialNumbers.filter((sn) => !usedSerials.includes(sn));

      if (availableSerials.length === 0) {
        alert("Bu mahsulotning barcha seriya raqamlari savatga qo'shilgan yoki omborda qolmagan!");
        return;
      }

      if (availableSerials.length === 1) {
        addSerializedItemToCart(product, availableSerials[0]);
      } else {
        setSnPickerProduct(product);
        setSnPickerSelected(availableSerials[0]);
      }
    } else {
      addStandardItemToCart(product);
    }
  };

  const addStandardItemToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prevCart,
        {
          product,
          quantity: 1,
          discountPercent: 0,
          appliedPrice: product.retailPrice,
          appliedPriceUSD: Number((product.retailPrice / exchangeRate).toFixed(2))
        }
      ];
    });
  };

  const addSerializedItemToCart = (product: Product, serialNumber: string) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        const currentSerials = existing.selectedSerialNumbers || [];
        if (currentSerials.includes(serialNumber)) return prevCart;

        return prevCart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                selectedSerialNumbers: [...currentSerials, serialNumber]
              }
            : item
        );
      }

      return [
        ...prevCart,
        {
          product,
          quantity: 1,
          discountPercent: 0,
          appliedPrice: product.retailPrice,
          appliedPriceUSD: Number((product.retailPrice / exchangeRate).toFixed(2)),
          selectedSerialNumbers: [serialNumber]
        }
      ];
    });
  };

  // Change quantity
  const updateQuantity = (productId: string, delta: number) => {
    const targetItem = cart.find((item) => item.product.id === productId);
    if (!targetItem) return;

    if (delta > 0 && targetItem.product.hasSerialNumber) {
      handleProductClick(targetItem.product);
      return;
    }

    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;

            let updatedSerials = item.selectedSerialNumbers;
            if (item.product.hasSerialNumber && updatedSerials && updatedSerials.length > newQty) {
              updatedSerials = updatedSerials.slice(0, newQty);
            }

            return {
              ...item,
              quantity: newQty,
              selectedSerialNumbers: updatedSerials
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(undefined);
    setSelectedTechnicians([]);
    setGeneralDiscountPercent(0);
    setInstallationAddress('');
  };

  // Hold current cart
  const handleHoldCart = () => {
    if (cart.length === 0) return;
    setHeldCarts((prev) => [
      ...prev,
      {
        id: `hold-${Date.now()}`,
        customer: selectedCustomer,
        technicians: selectedTechnicians,
        items: cart,
        address: installationAddress,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    clearCart();
  };

  // Resume held cart
  const handleResumeCart = (holdId: string) => {
    const target = heldCarts.find((h) => h.id === holdId);
    if (!target) return;
    setCart(target.items);
    setSelectedCustomer(target.customer);
    setSelectedTechnicians(target.technicians || []);
    setInstallationAddress(target.address || '');
    setHeldCarts((prev) => prev.filter((h) => h.id !== holdId));
  };

  // Quick Customer Creation from POS
  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const cashbackRates = {
      Standard: 1,
      Silver: 2,
      Gold: 3,
      VIP: 5
    };

    const createdCust: Customer = {
      id: `cust-${Date.now()}`,
      fullName: newCustName.trim(),
      phone: newCustPhone.trim() || '+998 90 000 00 00',
      cashbackBalance: newCustBonus,
      totalPurchases: 0,
      debtBalance: 0,
      tier: newCustTier,
      cashbackRate: cashbackRates[newCustTier],
      registeredDate: new Date().toISOString().split('T')[0]
    };

    onAddCustomer(createdCust);
    setSelectedCustomer(createdCust);
    setIsAddCustomerModalOpen(false);
    // Reset form
    setNewCustName('');
    setNewCustPhone('');
    setNewCustBonus(10000);
    setNewCustTier('Standard');
  };

  // Barcode / S/N enter trigger
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // 1. Check if query matches a specific Serial Number!
    const productBySN = products.find(
      (p) => p.serialNumbers && p.serialNumbers.some((sn) => sn.toLowerCase() === query.toLowerCase())
    );

    if (productBySN) {
      const matchedSN = productBySN.serialNumbers?.find((sn) => sn.toLowerCase() === query.toLowerCase()) || query;
      addSerializedItemToCart(productBySN, matchedSN);
      setSearchQuery('');
      return;
    }

    // 2. Check if barcode or SKU matches
    const matched = products.find(
      (p) => p.barcode === query || p.sku.toLowerCase() === query.toLowerCase()
    );

    if (matched) {
      handleProductClick(matched);
      setSearchQuery('');
    }
  };

  // Escape key handler for POSScreen modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (snPickerProduct) {
          setSnPickerProduct(null);
          setSnPickerSelected('');
        } else if (isAddCustomerModalOpen) {
          setIsAddCustomerModalOpen(false);
        } else if (isPaymentModalOpen) {
          setIsPaymentModalOpen(false);
        } else if (isApprovalModalOpen) {
          setIsApprovalModalOpen(false);
        } else if (lastReceipt) {
          setLastReceipt(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [snPickerProduct, isAddCustomerModalOpen, isPaymentModalOpen, isApprovalModalOpen, lastReceipt]);

  // Totals calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity * item.appliedPrice, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return Math.round((subtotal * generalDiscountPercent) / 100);
  }, [subtotal, generalDiscountPercent]);

  const totalAmount = Math.max(0, subtotal - discountAmount);
  const totalAmountUSD = Number((totalAmount / exchangeRate).toFixed(2));

  // Max warranty
  const maxWarranty = useMemo(() => {
    const warranties = cart
      .map((item) => item.product.warrantyMonths)
      .filter((w): w is number => typeof w === 'number' && w > 0);
    return warranties.length > 0 ? Math.max(...warranties) : 0;
  }, [cart]);

  // Complete sale callback
  const handleConfirmPayment = (payment: PaymentDetails, cashbackEarned: number) => {
    const newReceipt: SaleReceipt = {
      id: `rec-${Date.now()}`,
      receiptNumber: `#SC-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: getNowFormatted(),
      cashierName: 'Farrux A.',
      customer: selectedCustomer,
      items: cart,
      subtotal,
      discountTotal: discountAmount,
      totalAmount,
      totalAmountUSD,
      exchangeRate,
      payments: payment,
      cashbackEarned,
      isOffline,
      synced: !isOffline,
      branchName: 'Smart Control (Bosh Filial)',
      installationAddress: installationAddress.trim() || undefined,
      warrantyMonths: maxWarranty || undefined,
      technicians: selectedTechnicians.length > 0 ? selectedTechnicians : undefined,
      technicianId: selectedTechnicians[0]?.id,
      technicianName: selectedTechnicians.map((t) => t.fullName).join(' & ') || undefined,
      technicianPhone: selectedTechnicians[0]?.phone
    };

    onCompleteSale(newReceipt);
    setLastReceipt(newReceipt);
    setIsPaymentModalOpen(false);

    // If linked to a pending technician order, mark it approved and link receipt
    if (linkedApprovalOrderId && onSaveOrder && customerOrders) {
      const targetOrd = customerOrders.find((o) => o.id === linkedApprovalOrderId);
      if (targetOrd) {
        onSaveOrder({
          ...targetOrd,
          status: 'approved',
          receiptId: newReceipt.id
        });
      }
      setLinkedApprovalOrderId(null);
    }

    clearCart();
  };

  // 1. Approve order and load items into POS cart
  const handleApproveAndLoadToCart = (order: CustomerOrder) => {
    const newCartItems: CartItem[] = order.items.map((it) => {
      let prod = products.find((p) => p.id === it.productId || (it.sku && p.sku === it.sku));
      if (!prod) {
        prod = {
          id: it.productId,
          barcode: '',
          name: it.productName,
          sku: it.sku || 'ITEM',
          category: it.category || 'Boshqa',
          retailPrice: it.unitPrice,
          retailPriceUSD: it.unitPriceUSD || Number((it.unitPrice / exchangeRate).toFixed(2)),
          wholesalePrice: it.unitPrice,
          costPrice: 0,
          stockQuantity: 999,
          minStockAlert: 5,
          unit: it.unit,
          hasSerialNumber: it.hasSerialNumber || false,
          isService: it.isService || false,
          serialNumbers: it.selectedSerialNumbers || []
        };
      }
      return {
        product: prod,
        quantity: it.quantity,
        appliedPrice: it.unitPrice,
        discountPercent: it.discountPercent || 0,
        selectedSerialNumbers: it.selectedSerialNumbers || []
      };
    });

    setCart(newCartItems);

    if (order.customerId) {
      const foundCust = customers.find((c) => c.id === order.customerId);
      if (foundCust) setSelectedCustomer(foundCust);
    } else if (order.customerName) {
      setSelectedCustomer({
        id: `cust-temp-${Date.now()}`,
        fullName: order.customerName,
        phone: order.customerPhone || '',
        address: order.deliveryAddress || '',
        cashbackBalance: 0,
        totalPurchases: 0,
        debtBalance: 0,
        tier: 'Standard',
        cashbackRate: 1,
        registeredDate: new Date().toLocaleDateString('uz-UZ')
      });
    }

    if (order.deliveryAddress) {
      setInstallationAddress(order.deliveryAddress);
    }

    if (order.technicians && order.technicians.length > 0) {
      setSelectedTechnicians(order.technicians);
    }

    setLinkedApprovalOrderId(order.id);
  };

  // 2. Direct approve without POS checkout
  const handleDirectApproveSale = (order: CustomerOrder, paymentMethod: 'cash' | 'card' | 'debt' | 'usd') => {
    if (onSaveOrder) {
      onSaveOrder({
        ...order,
        status: 'approved'
      });
    }
  };

  // 3. Reject order
  const handleRejectOrder = (orderId: string, reason: string) => {
    if (onSaveOrder && customerOrders) {
      const targetOrd = customerOrders.find((o) => o.id === orderId);
      if (targetOrd) {
        onSaveOrder({
          ...targetOrd,
          status: 'rejected',
          rejectionReason: reason
        });
      }
    }
  };

  // Quick 1-Click Instant Cash Sale (Fast checkout without opening detailed split modal)
  const handleQuickCashSale = () => {
    if (cart.length === 0) return;
    const payment: PaymentDetails = {
      cash: totalAmount,
      card: 0,
      debt: 0,
      cashbackUsed: 0,
      total: totalAmount,
      totalUSD: totalAmountUSD,
      exchangeRate: exchangeRate,
      currencyPaid: 'UZS'
    };
    handleConfirmPayment(payment, 0);
  };

  // Keyboard shortcut listener (F2 for quick cash, F4 for detailed payment)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2' && cart.length > 0) {
        e.preventDefault();
        handleQuickCashSale();
      } else if (e.key === 'F4' && cart.length > 0) {
        e.preventDefault();
        setIsPaymentModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, totalAmount]);

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* LEFT/CENTER: Products catalog and categories */}
      <div className="flex-1 flex flex-col border-r border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Top Filter Bar */}
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-3">
          
          {/* Ustalardan kelgan smetalarni tasdiqlash uchun jonli ogohlantirish banneri */}
          {pendingTechnicianOrders.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/60 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 animate-bounce">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-900 dark:text-amber-300">
                    Ustalardan {pendingTechnicianOrders.length} ta yangi hisob-kitob (smeta) keldi!
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Mijoz obyektida kiritilgan jihoz va xizmatlarni tasdiqlab, chek urishga yuklang
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsApprovalModalOpen(true)}
                className="py-1.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0"
              >
                <span>Ko&apos;rib chiqish ({pendingTechnicianOrders.length})</span>
                <span className="text-xs">&rarr;</span>
              </button>
            </div>
          )}

          {/* Top row: Barcode & S/N Search */}
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2 w-full">
            <div className="relative flex-1">
              <Barcode className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="S/N seriya raqami, tovar nomi yoki shtrix-kod skanerlang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 text-slate-800 dark:text-slate-100"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-800 transition shrink-0 shadow-sm"
            >
              Qidirish
            </button>
          </form>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Tiles Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const isService = !!product.isService;
              const hasSN = !!product.hasSerialNumber;
              const isLowStock = !isService && product.stockQuantity <= product.minStockAlert;
              const priceUSD = Number((product.retailPrice / exchangeRate).toFixed(2));

              return (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col justify-between hover:border-cyan-500/60 dark:hover:border-cyan-500/60 hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-200 cursor-pointer active:scale-[0.98] select-none"
                >
                  <div>
                    {/* Vitrina Image Container (Rounded Showcase Box) */}
                    <div className="relative w-full h-28 sm:h-32 mb-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 overflow-hidden flex items-center justify-center p-2 border border-slate-100 dark:border-slate-800/80 group-hover:border-cyan-500/30 transition">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          loading="lazy"
                          className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                          {isService ? (
                            <Wrench className="w-9 h-9 text-pink-400/70" />
                          ) : hasSN ? (
                            <Camera className="w-9 h-9 text-cyan-400/70" />
                          ) : (
                            <Package className="w-9 h-9 text-amber-400/70" />
                          )}
                        </div>
                      )}

                      {/* Category Badge overlay (Top Left) */}
                      <span className="absolute top-1.5 left-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-2 py-0.5 rounded-md truncate max-w-[105px] border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                        {product.category}
                      </span>

                      {/* Stock / S/N / Service Badge overlay (Top Right) */}
                      {isService ? (
                        <span className="absolute top-1.5 right-1.5 text-[9px] font-bold px-2 py-0.5 rounded-md bg-pink-500 text-white flex items-center gap-0.5 shadow-xs">
                          <Wrench className="w-2.5 h-2.5" /> Montaj
                        </span>
                      ) : hasSN ? (
                        <span className="absolute top-1.5 right-1.5 text-[9px] font-bold px-2 py-0.5 rounded-md bg-cyan-600 text-white flex items-center gap-0.5 font-mono shadow-xs">
                          <Hash className="w-2.5 h-2.5" /> {product.serialNumbers?.length || product.stockQuantity} S/N
                        </span>
                      ) : (
                        <span
                          className={`absolute top-1.5 right-1.5 text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5 shadow-xs ${
                            isLowStock
                              ? 'bg-amber-500 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {isLowStock && <AlertTriangle className="w-2.5 h-2.5" />}
                          {product.stockQuantity} {product.unit}
                        </span>
                      )}
                    </div>

                    {/* Product Name */}
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition">
                      {product.name}
                    </h4>

                    {/* Warranty badge */}
                    {product.warrantyMonths ? (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Kafolat: {product.warrantyMonths} oy</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Price (Dual Currency) */}
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-end justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 font-mono">{product.sku}</div>
                      
                      <div>
                        {baseCurrency === 'USD' ? (
                          <>
                            <div className="text-sm font-extrabold text-cyan-600 dark:text-cyan-400 font-mono">
                              ${priceUSD}
                            </div>
                            <div className="text-[11px] font-semibold text-slate-500 font-mono">
                              {formatNumberWithSpaces(product.retailPrice)} so&apos;m
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                              {formatNumberWithSpaces(product.retailPrice)} <small className="text-[9px] font-normal text-slate-400">so&apos;m</small>
                            </div>
                            <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                              ${priceUSD}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-cyan-600 group-hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center transition shrink-0">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT: Cart & Register Panel */}
      <div className="w-96 xl:w-[415px] bg-white dark:bg-slate-900 flex flex-col h-full shrink-0 shadow-xl z-10 border-l border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* SCROLLABLE MAIN BODY: Customer, Address, Technicians, and Cart items */}
        <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-slate-100 dark:divide-slate-800">
          {/* Section 1: Customer, Address & Technicians configuration */}
          <div className="p-3.5 space-y-2.5">
            {/* Customer Selection Dropdown + Add Customer Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  Buyurtmachi / Mijoz
                </label>
                
                <div className="flex items-center gap-1.5">
                  {/* Ustalardan kelgan smetalar qongiroqcha tugmasi */}
                  <button
                    type="button"
                    onClick={() => setIsApprovalModalOpen(true)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition border shadow-sm ${
                      pendingTechnicianOrders.length > 0
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 font-extrabold animate-pulse'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                    title={`Ustalardan kelgan joyida hisob-kitoblar (Smetalar)${pendingTechnicianOrders.length > 0 ? `: ${pendingTechnicianOrders.length} ta tasdiqlash kutilmoqda` : ''}`}
                  >
                    {pendingTechnicianOrders.length > 0 ? (
                      <BellRing className="w-3 h-3 text-slate-950 fill-slate-950 shrink-0 animate-bounce" />
                    ) : (
                      <Bell className="w-3 h-3 text-slate-500 dark:text-slate-400 shrink-0" />
                    )}
                    <span>Usta Smetasi</span>
                    {pendingTechnicianOrders.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center shadow">
                        {pendingTechnicianOrders.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAddCustomerModalOpen(true)}
                    className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold flex items-center gap-1 transition"
                    title="Kassaning o'zidan yangi mijoz kiritish"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>+ Yangi Mijoz</span>
                  </button>

                  {selectedCustomer && (
                    <button
                      onClick={() => setSelectedCustomer(undefined)}
                      className="text-[10px] text-red-500 hover:underline"
                    >
                      O&apos;chirish
                    </button>
                  )}
                </div>
              </div>

              <select
                value={selectedCustomer ? selectedCustomer.id : ''}
                onChange={(e) => {
                  const found = customers.find((c) => c.id === e.target.value);
                  setSelectedCustomer(found);
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/40"
              >
                <option value="">Oddiy Xaridor (Cashbacksiz)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.cashbackBalance.toLocaleString()} cb &bull; {c.tier})
                  </option>
                ))}
              </select>
            </div>

            {/* Installation Address / Object field */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 mb-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-500" />
                O&apos;rnatish Manzili / Obyekt (Ixtiyoriy)
              </label>
              <input
                type="text"
                placeholder="Masalan: Chilonzor 9-mavze, 12-uy (ofis)..."
                value={installationAddress}
                onChange={(e) => setInstallationAddress(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>

            {/* Assigned Technicians / Multi-Installer & Wage Split */}
            <div className={`p-2.5 rounded-2xl border transition ${
              cartHasService && selectedTechnicians.length === 0
                ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
                : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsTechniciansExpanded(!isTechniciansExpanded)}
                  className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 hover:text-cyan-600 transition"
                >
                  <HardHat className="w-3.5 h-3.5 text-amber-500" />
                  <span>Mas&apos;ul Ustalar &amp; Xizmat Haqqi</span>
                  {selectedTechnicians.length > 0 && (
                    <span className="text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                      {selectedTechnicians.length} ta
                    </span>
                  )}
                  {isTechniciansExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                <div className="flex items-center gap-2">
                  {selectedTechnicians.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedTechnicians([])}
                      className="text-[10px] text-red-500 hover:underline font-medium"
                    >
                      Tozalash
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsed summary pill */}
              {!isTechniciansExpanded && (
                <div 
                  onClick={() => setIsTechniciansExpanded(true)}
                  className="mt-1.5 cursor-pointer text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 hover:border-amber-400 transition"
                >
                  <span>
                    {selectedTechnicians.length > 0 ? (
                      <strong className="text-amber-600 dark:text-amber-400 font-semibold">
                        {selectedTechnicians.map((t) => t.fullName.split(' ')[0]).join(', ')} (${selectedTechnicians.reduce((s, t) => s + t.wageUSD, 0)})
                      </strong>
                    ) : (
                      <span>Usta tanlanmagan {cartHasService && <strong className="text-amber-500">(Xizmat bor!)</strong>}</span>
                    )}
                  </span>
                  <span className="text-[9px] text-cyan-600 font-bold">Ochish &darr;</span>
                </div>
              )}

              {/* Expanded content */}
              {isTechniciansExpanded && (
                <div className="mt-2 space-y-2">
                  {/* Service & Wage Info Banner */}
                  {cartHasService && (
                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                          Xizmatlar bo&apos;yicha usta haqqi:
                        </span>
                        <span className="font-extrabold font-mono text-amber-950 dark:text-amber-100">
                          ${totalServiceWageUSD} <small className="text-[10px] font-normal text-amber-800 dark:text-amber-300">({formatNumberWithSpaces(totalServiceWageUZS)} so&apos;m)</small>
                        </span>
                      </div>
                      {/* Breakdown of services in cart */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {serviceItems.map((item, idx) => {
                          const unitWage = item.product.technicianWageUSD ?? Math.round(item.appliedPrice / exchangeRate);
                          return (
                            <span key={idx} className="text-[9px] bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded-md border border-amber-300/60 dark:border-amber-700/60 font-medium">
                              {item.quantity}x {item.product.name.split('(')[0].trim()}: <strong>${unitWage * item.quantity}</strong>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quick Technicians Selection Grid */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Ustalarni tanlang:</span>
                      <span className="text-[9px] font-normal text-slate-400">{technicians.length} ta usta</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {technicians.map((tech) => {
                        const isSelected = selectedTechnicians.some((t) => t.id === tech.id);
                        return (
                          <button
                            key={tech.id}
                            type="button"
                            onClick={() => handleToggleTechnician(tech)}
                            className={`flex items-center gap-1.5 p-1.5 rounded-xl text-left border transition text-xs ${
                              isSelected
                                ? 'bg-amber-500/15 border-amber-500 text-amber-950 dark:text-amber-100 font-bold shadow-sm ring-1 ring-amber-500/30'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            {isSelected ? (
                              <CheckSquare className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[11px] leading-tight">{tech.fullName}</div>
                              <div className="text-[9px] text-slate-400 font-normal truncate">
                                {tech.role} &bull; {tech.status === 'on_site' ? "Obyektda" : "Ishda"}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Assigned Technicians Wage Inputs & Split */}
                  {selectedTechnicians.length > 0 && (
                    <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-700/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Sliders className="w-3 h-3 text-cyan-500" />
                          Har bir ustaga to&apos;lov ($):
                        </span>
                        {selectedTechnicians.length > 1 && (
                          <button
                            type="button"
                            onClick={handleResetSplit}
                            className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
                            title="Xizmat haqini teng taqsimlash"
                          >
                            Teng bo&apos;lish (${(totalServiceWageUSD / selectedTechnicians.length).toFixed(1)})
                          </button>
                        )}
                      </div>

                      <div className="space-y-1">
                        {selectedTechnicians.map((t) => (
                          <div key={t.id} className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-[11px] text-slate-800 dark:text-slate-100 truncate">
                                {t.fullName}
                              </div>
                              <div className="text-[9px] text-slate-400 flex items-center gap-1">
                                <span>{t.role}</span>
                                <span>&bull;</span>
                                <span>{t.phone}</span>
                              </div>
                            </div>

                            {/* Wage input in USD & UZS */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">$</span>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={t.wageUSD}
                                  onChange={(e) => handleUpdateTechnicianWageUSD(t.id, Number(e.target.value))}
                                  className="w-16 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-5 pr-1 py-0.5 text-xs font-mono font-bold text-slate-900 dark:text-white text-right focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>
                              <div className="text-right text-[10px] min-w-[65px]">
                                <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                  {formatNumberWithSpaces(t.wageUZS)}
                                </div>
                                <div className="text-[8px] text-slate-400">so&apos;m</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const emp = technicians.find(e => e.id === t.id);
                                  if (emp) handleToggleTechnician(emp);
                                }}
                                className="p-1 text-slate-400 hover:text-red-500 rounded"
                                title="Ushbu ustani bekor qilish"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total Distributed Check */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 px-1 pt-0.5">
                        <span>Jami ustalarga beriladi:</span>
                        <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          ${selectedTechnicians.reduce((s, t) => s + t.wageUSD, 0).toFixed(1)} ({formatNumberWithSpaces(selectedTechnicians.reduce((s, t) => s + t.wageUZS, 0))} so&apos;m)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Active Customer Cashback Banner */}
            {selectedCustomer && (
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <div>
                    <div className="font-bold text-purple-900 dark:text-purple-200">
                      {formatNumberWithSpaces(selectedCustomer.cashbackBalance)} so&apos;m cashback
                    </div>
                    <div className="text-[10px] text-purple-700 dark:text-purple-300">
                      {selectedCustomer.tier} &bull; {selectedCustomer.cashbackRate}% qaytadi
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Held Receipts Tabs if any */}
            {heldCarts.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Kutilayotgan:</span>
                {heldCarts.map((h, i) => (
                  <button
                    key={h.id}
                    onClick={() => handleResumeCart(h.id)}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1 hover:bg-amber-100 transition"
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
                    #{i + 1} ({h.time})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Cart Items List */}
          <div className="p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-cyan-500" />
                <span>Savatchadagi tovarlar ({cart.length})</span>
              </span>
              {cart.length > 0 && (
                <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                  {isUSDBase ? `$${(subtotal / exchangeRate).toFixed(2)}` : `${formatNumberWithSpaces(subtotal)} so'm`}
                </span>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400 text-center">
                <ShoppingBag className="w-10 h-10 stroke-[1.2] mb-1.5 opacity-50 text-cyan-500" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Savatcha bo&apos;sh</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tovar tanlang yoki shtrix-kod skanerlang
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => {
                  const itemTotalUZS = item.appliedPrice * item.quantity;
                  const itemTotalUSD = (itemTotalUZS / exchangeRate).toFixed(2);

                  return (
                    <div
                      key={item.product.id}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        {/* Cart Item Mini Thumbnail */}
                        <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 p-0.5">
                          {item.product.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              loading="lazy"
                              className="w-full h-full object-contain"
                            />
                          ) : item.product.isService ? (
                            <Wrench className="w-4 h-4 text-pink-500" />
                          ) : (
                            <Camera className="w-4 h-4 text-cyan-500" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                              {item.product.name}
                            </h5>
                          </div>

                          <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-baseline gap-1.5">
                            <span>{item.quantity} {item.product.unit || 'dona'} =</span>
                            {isUSDBase ? (
                              <>
                                <strong className="text-cyan-600 dark:text-cyan-400 font-bold">
                                  ${itemTotalUSD}
                                </strong>
                                <span className="text-slate-400 font-normal text-[10px]">
                                  ({formatNumberWithSpaces(itemTotalUZS)} so&apos;m)
                                </span>
                              </>
                            ) : (
                              <>
                                <strong className="text-slate-800 dark:text-slate-200 font-bold">
                                  {formatNumberWithSpaces(itemTotalUZS)} so&apos;m
                                </strong>
                                <span className="text-cyan-600 font-semibold">
                                  (${itemTotalUSD})
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Counter & Delete */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-slate-100 transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-bold font-mono text-xs text-slate-900 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-slate-100 transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="w-6 h-6 rounded-lg text-slate-400 hover:text-red-500 flex items-center justify-center transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Serial Numbers Badge in Cart Item */}
                      {item.product.hasSerialNumber && (
                        <div className="bg-cyan-50 dark:bg-cyan-950/40 p-1.5 rounded-lg border border-cyan-200 dark:border-cyan-800 text-[10px]">
                          <div className="flex items-center justify-between text-cyan-800 dark:text-cyan-200 font-semibold mb-0.5">
                            <span className="flex items-center gap-1">
                              <Hash className="w-3 h-3 text-cyan-600" />
                              Seriya Raqamlari (S/N):
                            </span>
                            {item.product.warrantyMonths ? (
                              <span className="text-blue-600 dark:text-blue-400">
                                {item.product.warrantyMonths} oy kafolat
                              </span>
                            ) : null}
                          </div>
                          <div className="font-mono text-cyan-700 dark:text-cyan-300 font-bold truncate">
                            {item.selectedSerialNumbers && item.selectedSerialNumbers.length > 0 ? (
                              item.selectedSerialNumbers.join(', ')
                            ) : (
                              <span className="text-amber-600">S/N tanlanmagan!</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* PINNED BOTTOM CHECKOUT BAR: ALWAYS VISIBLE AND ACCESSIBLE */}
        <div className="shrink-0 p-3.5 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-[0_-6px_20px_rgba(0,0,0,0.08)] space-y-2.5 z-20">
          {/* Quick Hold & Clear buttons */}
          <div className="flex items-center justify-between text-xs">
            <button
              onClick={handleHoldCart}
              disabled={cart.length === 0}
              className="flex items-center gap-1 font-semibold text-amber-600 hover:text-amber-700 disabled:opacity-40 transition"
            >
              <Pause className="w-3.5 h-3.5" />
              Kutishga qo&apos;yish
            </button>
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="font-semibold text-red-500 hover:text-red-600 disabled:opacity-40 transition"
            >
              Savatchani tozalash
            </button>
          </div>

          {/* Subtotal & Discount row */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Oraliq jami:</span>
              <div className="text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                {isUSDBase ? (
                  <>
                    <span className="text-cyan-600 font-bold">${((subtotal / exchangeRate)).toFixed(2)}</span>
                    <span className="text-slate-400 text-[11px] ml-1.5">({formatNumberWithSpaces(subtotal)} so&apos;m)</span>
                  </>
                ) : (
                  <>
                    <span>{formatNumberWithSpaces(subtotal)} so&apos;m</span>
                    <span className="text-cyan-600 text-[11px] ml-1.5">(${((subtotal / exchangeRate)).toFixed(2)})</span>
                  </>
                )}
              </div>
            </div>

            {/* Discount selector */}
            <div className="flex items-center justify-between text-slate-500">
              <span>Chegirma:</span>
              <div className="flex items-center gap-1">
                {[0, 3, 5, 10].map((d) => (
                  <button
                    key={d}
                    onClick={() => setGeneralDiscountPercent(d)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      generalDiscountPercent === d
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {d}%
                  </button>
                ))}
              </div>
            </div>

            {maxWarranty > 0 && (
              <div className="flex justify-between text-blue-600 dark:text-blue-400 text-[11px] font-semibold">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Kafolat:
                </span>
                <span>{maxWarranty} oy (S/N asosida)</span>
              </div>
            )}

            {/* Grand Total (Dual Currency) */}
            <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">JAMI TO&apos;LOV:</span>
                {isUSDBase ? (
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                    ~ {formatNumberWithSpaces(totalAmount)} so&apos;m
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                    ${totalAmountUSD} USD
                  </span>
                )}
              </div>
              {isUSDBase ? (
                <span className="text-xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
                  ${totalAmountUSD} <small className="text-xs font-semibold text-slate-400">USD</small>
                </span>
              ) : (
                <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  {formatNumberWithSpaces(totalAmount)} <small className="text-xs font-normal text-slate-400">so&apos;m</small>
                </span>
              )}
            </div>
          </div>

          {/* Dual Checkout Action Buttons: 1-Click Fast Cash (F2) + Detailed Payment Modal (F4) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleQuickCashSale}
              disabled={cart.length === 0}
              className="py-3 px-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:hover:from-emerald-600 disabled:hover:to-teal-600 text-white font-black text-xs tracking-wide shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
              title="Bir zumda naqd to'lov bilan chek yopish (F2)"
            >
              <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
              <span>⚡ Tezkor Naqd (F2)</span>
            </button>

            <button
              onClick={() => setIsPaymentModalOpen(true)}
              disabled={cart.length === 0}
              className="py-3 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-cyan-300 border border-slate-700 font-bold text-xs tracking-wide shadow-md flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
              title="Nasiya, Karta, O'tkazma yoki Aralash to'lov (F4)"
            >
              <CreditCard className="w-4 h-4 text-cyan-400" />
              <span>Batafsil To&apos;lov (F4)</span>
            </button>
          </div>
        </div>
      </div>

      {/* S/N PICKER MODAL (SERIYA RAQAMINI TANLASH VA SKANER QILISH) */}
      {snPickerProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Barcode className="w-5 h-5 text-cyan-500" />
                  Seriya Raqamini (S/N) Skaner Qiling
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{snPickerProduct.name}</p>
              </div>
              <button
                onClick={() => {
                  setSnPickerProduct(null);
                  setSnSearchQuery('');
                  setSnPickerSelected('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const existing = cart.find((i) => i.product.id === snPickerProduct.id);
              const used = existing?.selectedSerialNumbers || [];
              const available = (snPickerProduct.serialNumbers || []).filter((s) => !used.includes(s));
              const query = snSearchQuery.trim();
              const filtered = available.filter((s) => s.toLowerCase().includes(query.toLowerCase()));

              const handleConfirmSerial = (snToUse: string) => {
                const finalSN = snToUse.trim();
                if (!finalSN) return;
                addSerializedItemToCart(snPickerProduct, finalSN);
                setSnPickerProduct(null);
                setSnPickerSelected('');
                setSnSearchQuery('');
              };

              const handleFormSubmit = (e: React.FormEvent) => {
                e.preventDefault();
                if (!query) {
                  if (snPickerSelected && available.includes(snPickerSelected)) {
                    handleConfirmSerial(snPickerSelected);
                  }
                  return;
                }

                // 1. Exact match in available
                const exact = available.find((s) => s.toLowerCase() === query.toLowerCase());
                if (exact) {
                  handleConfirmSerial(exact);
                  return;
                }

                // 2. If filtered has single match
                if (filtered.length === 1) {
                  handleConfirmSerial(filtered[0]);
                  return;
                }

                // 3. STRICT CHECK: Block non-existent serial numbers!
                alert(`❌ Xatolik: "${query}" seriya raqami ushbu tovar bo'yicha omborda mavjud emas!\n\nOmborda ro'yxatdan o'tmagan tovar sotilishining oldini olish uchun faqat avval kirim (prixod) qilingan seriya raqamlarini skanerlash mumkin.`);
              };

              return (
                <div className="space-y-3">
                  {/* Dedicated Barcode Scanner Input */}
                  <form onSubmit={handleFormSubmit} className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                      <span>Skaner yoki klaviatura orqali S/N:</span>
                      <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-normal">Faqat ombordagi S/N</span>
                    </label>
                    <div className="relative flex items-center">
                      <Barcode className="w-5 h-5 text-cyan-500 absolute left-3 pointer-events-none" />
                      <input
                        ref={snInputRef}
                        type="text"
                        autoFocus
                        value={snSearchQuery}
                        onChange={(e) => {
                          setSnSearchQuery(e.target.value);
                          setSnPickerSelected(e.target.value);
                        }}
                        placeholder="Ombordagi S/N ni skaner qiling (Enter)..."
                        className="w-full pl-10 pr-24 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-2 border-cyan-500/60 focus:border-cyan-500 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-none shadow-sm transition"
                      />
                      <button
                        type="submit"
                        disabled={!snSearchQuery.trim() && !snPickerSelected}
                        className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 text-white font-bold text-xs shadow transition flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Tanlash</span>
                      </button>
                    </div>
                  </form>

                  {/* Available Serials List */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-0.5">
                      <span>Ombordagi mavjud seriyalar:</span>
                      <span>{available.length} ta bo&apos;sh</span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {available.length === 0 && (
                        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center space-y-1">
                          <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                            Omborda bo&apos;sh seriya raqami qolmagan!
                          </p>
                          <p className="text-[10px] text-amber-600 dark:text-amber-400">
                            Iltimos, avval tovar kirimi (prixod) qiling yoki qoldiqlarni tekshiring.
                          </p>
                        </div>
                      )}

                      {filtered.map((sn) => (
                        <button
                          key={sn}
                          type="button"
                          onClick={() => {
                            setSnPickerSelected(sn);
                            handleConfirmSerial(sn);
                          }}
                          className={`w-full p-2.5 rounded-xl border flex items-center justify-between font-mono text-xs font-bold transition text-left ${
                            snPickerSelected === sn || query.toLowerCase() === sn.toLowerCase()
                              ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/50 text-cyan-800 dark:text-cyan-200 shadow-sm'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Hash className="w-3.5 h-3.5 text-slate-400" />
                            {sn}
                          </span>
                          <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-sans font-normal">
                            Tanlash ↵
                          </span>
                        </button>
                      ))}

                      {query && filtered.length === 0 && available.length > 0 && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300">
                          <div className="font-bold flex items-center gap-1.5 mb-0.5">
                            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                            Seriya raqami topilmadi!
                          </div>
                          <div className="text-[11px] text-rose-600 dark:text-rose-400">
                            &quot;{query}&quot; seriya raqami omborda yo&apos;q. Faqat ombordagi mavjud seriyalarni tanlashingiz mumkin.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSnPickerProduct(null);
                        setSnSearchQuery('');
                        setSnPickerSelected('');
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="button"
                      disabled={!snPickerSelected || !available.includes(snPickerSelected)}
                      onClick={() => {
                        if (snPickerSelected && available.includes(snPickerSelected)) {
                          handleConfirmSerial(snPickerSelected);
                        }
                      }}
                      className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 transition active:scale-[0.98]"
                    >
                      Savatga Qo&apos;shish
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW CUSTOMER DIRECTLY IN POS */}
      {isAddCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-500" />
                Kassada Yangi Mijoz Qo&apos;shish
              </h3>
              <button
                onClick={() => setIsAddCustomerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Mijoz F.I.Sh. yoki Kompaniya / Obyekt Nomi
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Masalan: Sardor Rahimov (Delta MCHJ)"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Telefon Raqami
                </label>
                <input
                  type="text"
                  placeholder="+998 90 123 45 67"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Sodiqlik Darajasi
                  </label>
                  <select
                    value={newCustTier}
                    onChange={(e) => setNewCustTier(e.target.value as any)}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="Standard">Standard (1% cb)</option>
                    <option value="Silver">Silver (2% cb)</option>
                    <option value="Gold">Gold (3% cb)</option>
                    <option value="VIP">VIP (5% cb)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Bonus Cashback (so&apos;m)
                  </label>
                  <input
                    type="number"
                    value={newCustBonus}
                    onChange={(e) => setNewCustBonus(Number(e.target.value) || 0)}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900/60">
                ✓ Mijoz saqlanishi bilanoq joriy savatchaga avtomatik biriktiriladi.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition active:scale-[0.98]"
                >
                  Mijozni Qo&apos;shish & Tanlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* PAYMENT MODAL */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={totalAmount}
        customer={selectedCustomer}
        onConfirmPayment={handleConfirmPayment}
        isOffline={isOffline}
        exchangeRate={exchangeRate}
        baseCurrency={baseCurrency}
      />

      {/* RECEIPT MODAL */}
      <ReceiptModal
        receipt={lastReceipt}
        onClose={() => setLastReceipt(null)}
      />

      {/* CASHIER ORDER APPROVAL MODAL (FOR TECHNICIAN ON-SITE ESTIMATES) */}
      <CashierOrderApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        pendingOrders={pendingTechnicianOrders}
        products={products}
        exchangeRate={exchangeRate}
        baseCurrency={baseCurrency}
        onApproveAndLoadToCart={handleApproveAndLoadToCart}
        onDirectApproveSale={handleDirectApproveSale}
        onRejectOrder={handleRejectOrder}
      />
    </div>
  );
};
