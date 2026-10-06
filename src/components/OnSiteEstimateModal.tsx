'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Product, Customer, CustomerOrder, OrderItem, Employee, Currency, AssignedTechnician } from '../types';
import { formatNumberWithSpaces, formatUSDNumber, formatMoney } from '../utils/formatters';
import { 
  X, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  Cpu, 
  Wrench, 
  Barcode, 
  DollarSign, 
  Calculator, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  MapPin, 
  Phone, 
  Layers, 
  Sparkles,
  ShieldCheck,
  HardHat,
  Bookmark,
  BookmarkPlus,
  Zap,
  Star,
  ChevronRight,
  Check,
  Building,
  Coins
} from 'lucide-react';

interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  badge?: string;
  isCustom?: boolean;
  itemRules: {
    skuOrNameMatch: string;
    quantity: number;
  }[];
}

const BUILTIN_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'tpl-4cam-std',
    name: '📹 4 Kamerali Standart To\'plam',
    description: '4x Dahua 2MP Kamera + 1x PoE Switch + 4x Montaj + Kabel',
    badge: 'Xaridorgir',
    itemRules: [
      { skuOrNameMatch: 'DH-DOME-2MP', quantity: 4 },
      { skuOrNameMatch: 'HIK-POE-0801', quantity: 1 },
      { skuOrNameMatch: 'SRV-CAM-INST', quantity: 4 },
      { skuOrNameMatch: 'CBL-CAT6-OUT', quantity: 1 }
    ]
  },
  {
    id: 'tpl-8cam-biz',
    name: '🏢 8 Kamerali Biznes To\'plam',
    description: '8x Hikvision 4MP IP Kamera + 1x 8-Kanalli NVR + 1x PoE + 8x Montaj',
    badge: 'Biznes',
    itemRules: [
      { skuOrNameMatch: 'HIK-IPC-4MP', quantity: 8 },
      { skuOrNameMatch: 'HIK-NVR-7608', quantity: 1 },
      { skuOrNameMatch: 'HIK-POE-0801', quantity: 1 },
      { skuOrNameMatch: 'SRV-CAM-INST', quantity: 8 }
    ]
  },
  {
    id: 'tpl-domofon',
    name: '🚪 IP Domofon To\'plami',
    description: 'Hikvision IP Domofon monitor + panel + Montaj',
    badge: 'Xonadon',
    itemRules: [
      { skuOrNameMatch: 'HIK-DOM-603', quantity: 1 },
      { skuOrNameMatch: 'SRV-CAM-INST', quantity: 1 }
    ]
  },
  {
    id: 'tpl-fire',
    name: '🔥 Yong\'in Xavfsizligi To\'plami',
    description: '4x Aqlli Optik Tutun Datchigi + Sozlash',
    badge: 'Xavfsizlik',
    itemRules: [
      { skuOrNameMatch: 'FIRE-SMOKE-OPT', quantity: 4 },
      { skuOrNameMatch: 'SRV-CAM-INST', quantity: 1 }
    ]
  },
  {
    id: 'tpl-services',
    name: '⚡ Faqat Montaj & Sozlash Xizmatlari',
    description: '2x Kamera montaji va kabel tortish',
    badge: 'Xizmat',
    itemRules: [
      { skuOrNameMatch: 'SRV-CAM-INST', quantity: 2 }
    ]
  }
];

interface OnSiteEstimateModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers: Customer[];
  activeTechnician: Employee;
  orders: CustomerOrder[];
  exchangeRate: number;
  baseCurrency?: Currency;
  onSaveOrder: (order: CustomerOrder) => void;
  targetOrder?: CustomerOrder | null;
}

export const OnSiteEstimateModal: React.FC<OnSiteEstimateModalProps> = ({
  isOpen,
  onClose,
  products,
  customers,
  activeTechnician,
  orders,
  exchangeRate,
  baseCurrency = 'UZS',
  onSaveOrder,
  targetOrder
}) => {
  // Mode: Link to existing order or new customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => {
    return targetOrder?.customerId || '';
  });
  const [customerName, setCustomerName] = useState<string>(() => {
    return targetOrder?.customerName || '';
  });
  const [customerPhone, setCustomerPhone] = useState<string>(() => {
    return targetOrder?.customerPhone || '';
  });
  const [deliveryAddress, setDeliveryAddress] = useState<string>(() => {
    return targetOrder?.deliveryAddress || '';
  });
  const [projectName, setProjectName] = useState<string>(() => {
    return targetOrder ? `Qo'shimcha: ${targetOrder.projectName || targetOrder.orderNumber}` : '';
  });
  const [comment, setComment] = useState<string>('');
  const [submittedAttempt, setSubmittedAttempt] = useState<boolean>(false);

  // Customer search combobox state
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState<boolean>(false);

  // Cart items for this estimate
  const [items, setItems] = useState<OrderItem[]>([]);
  const [productSearch, setProductSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Barchasi');

  // Custom templates state loaded from localStorage
  const [customTemplates, setCustomTemplates] = useState<TemplateDefinition[]>([]);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState<boolean>(false);
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [templateSuccessToast, setTemplateSuccessToast] = useState<string | null>(null);

  // Load custom templates on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sc_custom_estimate_templates');
      if (saved) {
        setCustomTemplates(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Templates load error", e);
    }
  }, []);

  // Filtered customer list for combobox
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) {
      return customers.slice(0, 8);
    }
    const q = customerSearchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.address && c.address.toLowerCase().includes(q))
    );
  }, [customers, customerSearchQuery]);

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return ['Barchasi', ...Array.from(cats)];
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'Barchasi' || p.category === selectedCategory;
      if (!matchCat) return false;
      if (!productSearch.trim()) return true;
      const q = productSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    });
  }, [products, selectedCategory, productSearch]);

  // Check which items have missing serial numbers
  const missingSNItems = useMemo(() => {
    return items.filter((it) => {
      if (!it.hasSerialNumber || it.isService) return false;
      const validSNs = (it.selectedSerialNumbers || []).filter((sn) => sn && sn.trim().length > 0);
      return validSNs.length < it.quantity;
    });
  }, [items]);

  // All available templates (custom ones first, then builtin)
  const allTemplates = useMemo(() => {
    return [...customTemplates, ...BUILTIN_TEMPLATES];
  }, [customTemplates]);

  // Add single product to estimate
  const handleAddItem = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((it) => it.productId === product.id);
      if (existing) {
        return prev.map((it) => {
          if (it.productId === product.id) {
            const newQty = it.quantity + 1;
            return {
              ...it,
              quantity: newQty,
              totalPrice: Math.round(newQty * it.unitPrice * (1 - it.discountPercent / 100))
            };
          }
          return it;
        });
      }

      const priceUZS = product.retailPrice || (product.retailPriceUSD ? Math.round(product.retailPriceUSD * exchangeRate) : 0);
      const priceUSD = product.retailPriceUSD || (product.retailPrice ? Number((product.retailPrice / exchangeRate).toFixed(2)) : 0);

      const newItem: OrderItem = {
        productId: product.id,
        productName: product.name,
        category: product.category,
        sku: product.sku,
        quantity: 1,
        unit: product.unit || 'dona',
        unitPrice: priceUZS,
        unitPriceUSD: priceUSD,
        discountPercent: 0,
        totalPrice: priceUZS,
        hasSerialNumber: product.hasSerialNumber || false,
        isService: product.isService || false,
        selectedSerialNumbers: []
      };

      return [...prev, newItem];
    });
  };

  // Apply template immediately
  const handleApplyTemplate = (tpl: TemplateDefinition) => {
    const newItems: OrderItem[] = [];

    tpl.itemRules.forEach((rule) => {
      const q = rule.skuOrNameMatch.toLowerCase();
      const matchedProd = products.find(
        (p) =>
          p.id === rule.skuOrNameMatch ||
          p.sku.toLowerCase() === q ||
          p.name.toLowerCase().includes(q)
      );

      if (matchedProd) {
        const priceUZS = matchedProd.retailPrice || (matchedProd.retailPriceUSD ? Math.round(matchedProd.retailPriceUSD * exchangeRate) : 0);
        const priceUSD = matchedProd.retailPriceUSD || (matchedProd.retailPrice ? Number((matchedProd.retailPrice / exchangeRate).toFixed(2)) : 0);

        newItems.push({
          productId: matchedProd.id,
          productName: matchedProd.name,
          category: matchedProd.category,
          sku: matchedProd.sku,
          quantity: rule.quantity,
          unit: matchedProd.unit || 'dona',
          unitPrice: priceUZS,
          unitPriceUSD: priceUSD,
          discountPercent: 0,
          totalPrice: priceUZS * rule.quantity,
          hasSerialNumber: matchedProd.hasSerialNumber || false,
          isService: matchedProd.isService || false,
          selectedSerialNumbers: []
        });
      }
    });

    if (newItems.length > 0) {
      setItems(newItems);
      setTemplateSuccessToast(`✓ "${tpl.name}" shabloni yuklandi (${newItems.length} ta pozitsiya)!`);
      setTimeout(() => setTemplateSuccessToast(null), 4000);
    } else {
      alert("Shablondagi tovarlar hozirgi ombor katalogidan topilmadi.");
    }
  };

  // Save current estimate as a custom template
  const handleSaveCurrentAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;
    if (items.length === 0) {
      alert("Shablon qilish uchun avval kamida bitta mahsulot yoki xizmat qo'shing!");
      return;
    }

    const customTpl: TemplateDefinition = {
      id: `tpl-custom-${Date.now()}`,
      name: newTemplateName.trim(),
      description: `${items.length} ta mahsulot va xizmatlar to'plami`,
      badge: 'Mening Shablonim',
      isCustom: true,
      itemRules: items.map((it) => ({
        skuOrNameMatch: it.sku || it.productId,
        quantity: it.quantity
      }))
    };

    const updated = [customTpl, ...customTemplates];
    setCustomTemplates(updated);
    try {
      localStorage.setItem('sc_custom_estimate_templates', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setNewTemplateName('');
    setIsCreatingTemplate(false);
    setTemplateSuccessToast(`✓ "${customTpl.name}" shabloningiz saqlandi!`);
    setTimeout(() => setTemplateSuccessToast(null), 4000);
  };

  // Delete custom template
  const handleDeleteCustomTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Ushbu shablonni o'chirishni tasdiqlaysizmi?")) return;
    const updated = customTemplates.filter((t) => t.id !== id);
    setCustomTemplates(updated);
    try {
      localStorage.setItem('sc_custom_estimate_templates', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((it) => {
          if (it.productId === productId) {
            const newQty = Math.max(1, it.quantity + delta);
            return {
              ...it,
              quantity: newQty,
              totalPrice: Math.round(newQty * it.unitPrice * (1 - it.discountPercent / 100))
            };
          }
          return it;
        })
        .filter((it) => it.quantity > 0)
    );
  };

  const handleRemoveItem = (productId: string) => {
    setItems((prev) => prev.filter((it) => it.productId !== productId));
  };

  const handleUpdateSerialNumber = (productId: string, snIndex: number, snValue: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.productId === productId) {
          const updatedSNs = [...(it.selectedSerialNumbers || [])];
          updatedSNs[snIndex] = snValue.trim();
          return {
            ...it,
            selectedSerialNumbers: updatedSNs
          };
        }
        return it;
      })
    );
  };

  // Calculations
  const subtotalUZS = useMemo(() => {
    return items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  }, [items]);

  const totalAmountUZS = useMemo(() => {
    return items.reduce((sum, it) => sum + it.totalPrice, 0);
  }, [items]);

  const totalAmountUSD = useMemo(() => {
    return Number((totalAmountUZS / exchangeRate).toFixed(2));
  }, [totalAmountUZS, exchangeRate]);

  // Technician wage estimation
  const estimatedTechnicianWageUSD = useMemo(() => {
    return items.reduce((sum, it) => {
      const prod = products.find((p) => p.id === it.productId);
      if (prod?.isService) {
        const fee = prod.technicianWageUSD ?? (prod.retailPriceUSD ? Math.round(prod.retailPriceUSD * 0.7) : 10);
        return sum + fee * it.quantity;
      }
      return sum;
    }, 0);
  }, [items, products]);

  // When selecting existing customer
  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setCustomerName(c.fullName);
    setCustomerPhone(c.phone);
    if (c.address) setDeliveryAddress(c.address);
    setIsCustomerSearchOpen(false);
    setCustomerSearchQuery('');
  };

  const handleClearCustomer = () => {
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryAddress('');
    setCustomerSearchQuery('');
  };

  // Submit to Main Cashier
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedAttempt(true);

    if (items.length === 0) {
      alert("Iltimos, kamida bitta tovar yoki montaj xizmatini tanlang!");
      return;
    }
    if (!customerName.trim()) {
      alert("Iltimos, mijoz ismini kiriting!");
      return;
    }

    // Strict Serial Number Validation: All serialized devices must have complete S/N
    if (missingSNItems.length > 0) {
      const missingDetails = missingSNItems
        .map((m) => {
          const filled = (m.selectedSerialNumbers || []).filter((s) => s && s.trim().length > 0).length;
          return `• ${m.productName} (${m.quantity} dona talab qilinadi, ${filled} ta kiritilgan)`;
        })
        .join('\n');

      alert(
        `⛔️ SERIYA RAQAMI (S/N) KIRITILMAGAN!\n\nQuyidagi seriya raqamli qurilmalarning S/N raqamlarini to'liq kiritmasdan turib kassirga yuborib bo'lmaydi:\n\n${missingDetails}\n\nIltimos, qizil ramka bilan belgilangan maydonlarga har bir qurilmaning seriya raqamini (S/N) kiriting!`
      );
      return;
    }

    const assignedTech: AssignedTechnician = {
      id: activeTechnician.id,
      fullName: activeTechnician.fullName,
      phone: activeTechnician.phone,
      role: activeTechnician.role,
      wageUSD: estimatedTechnicianWageUSD,
      wageUZS: Math.round(estimatedTechnicianWageUSD * exchangeRate)
    };

    const newOrder: CustomerOrder = {
      id: `ord-site-${Date.now()}`,
      orderNumber: `ZAK-J${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      organization: 'SMART CONTROL',
      customerId: selectedCustomerId || undefined,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryAddress: deliveryAddress.trim() || targetOrder?.deliveryAddress || 'Obyektda',
      projectName: projectName.trim() || `Joyida Smeta (${activeTechnician.fullName})`,
      comment: comment.trim() ? `[Usta joyida]: ${comment.trim()}` : `Usta ${activeTechnician.fullName} tomonidan mijoz obyektida kiritildi`,
      warehouseName: 'Asosiy Ombor',
      currency: 'UZS',
      exchangeRate: exchangeRate,
      items: items,
      subtotal: subtotalUZS,
      discountTotal: subtotalUZS - totalAmountUZS,
      totalAmount: totalAmountUZS,
      totalAmountUSD: totalAmountUSD,
      status: 'pending_cashier_approval', // Kassa tasdig'ini kutmoqda
      createdSource: 'technician_on_site',
      requestedByTechnicianName: activeTechnician.fullName,
      requestedByTechnicianId: activeTechnician.id,
      technicians: [assignedTech],
      technicianId: activeTechnician.id,
      technicianName: activeTechnician.fullName
    };

    onSaveOrder(newOrder);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-950 text-white sm:rounded-3xl border-t sm:border border-slate-800 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-b border-purple-900/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-lg">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">Joyida Hisob-kitob (Smeta)</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Kassa Tasdig&apos;i
                </span>
              </div>
              <p className="text-[11px] text-purple-300">
                Usta: <strong>{activeTechnician.fullName}</strong> &bull; Narxlar kassaga yuboriladi
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

        {/* Success Toast */}
        {templateSuccessToast && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 animate-in slide-in-from-top duration-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>{templateSuccessToast}</span>
          </div>
        )}

        {/* Scrollable Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* 1. Customer & Object Information with Searchable Dropdown */}
          <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-400" />
                Mijoz va Obyekt Ma&apos;lumotlari
              </span>
              {selectedCustomerId && (
                <button
                  type="button"
                  onClick={handleClearCustomer}
                  className="text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <span>Mijozni tozalash</span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Searchable Customer Combobox */}
            <div className="relative">
              <div className="relative">
                <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="🔍 Mavjud mijozni qidirish (Ism, telefon, manzil)..."
                  value={customerSearchQuery}
                  onFocus={() => setIsCustomerSearchOpen(true)}
                  onChange={(e) => {
                    setCustomerSearchQuery(e.target.value);
                    setIsCustomerSearchOpen(true);
                  }}
                  className="w-full bg-slate-950 border border-purple-900/60 focus:border-purple-500 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition"
                />
                {customerSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerSearchQuery('');
                      setIsCustomerSearchOpen(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Customer Search Results Popover */}
              {isCustomerSearchOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-56 overflow-y-auto z-30 divide-y divide-slate-800">
                  <div className="p-2 bg-slate-950/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Mavjud Mijozlar ({filteredCustomers.length})</span>
                    <button
                      type="button"
                      onClick={() => setIsCustomerSearchOpen(false)}
                      className="text-slate-500 hover:text-slate-300 text-xs"
                    >
                      ✕ Yopish
                    </button>
                  </div>

                  {filteredCustomers.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">
                      Mijoz topilmadi. Quyidagi maydonlarga yangi mijoz ma&apos;lumotlarini yozing.
                    </div>
                  ) : (
                    filteredCustomers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectCustomer(c)}
                        className={`p-2.5 hover:bg-purple-950/50 cursor-pointer transition flex items-center justify-between gap-2 ${
                          selectedCustomerId === c.id ? 'bg-purple-950/70 border-l-4 border-purple-500' : ''
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate">{c.fullName}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-purple-300">
                              {c.tier || 'Standard'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>📞 {c.phone}</span>
                            {c.address && <span className="truncate">📍 {c.address}</span>}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {c.debtBalance && c.debtBalance > 0 ? (
                            <span className="text-[10px] text-rose-400 font-mono font-bold block">
                              Qarz: {formatNumberWithSpaces(c.debtBalance)} so&apos;m
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-mono block">
                              ✓ Qarz yo&apos;q
                            </span>
                          )}
                          {c.cashbackBalance && c.cashbackBalance > 0 ? (
                            <span className="text-[9px] text-amber-300 font-mono">
                              🎁 {formatNumberWithSpaces(c.cashbackBalance)} bonus
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Selected Customer Highlight Card */}
            {selectedCustomerId && (
              <div className="p-2.5 bg-purple-950/40 border border-purple-700/60 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-purple-200">
                    Mavjud mijoz: <strong>{customerName}</strong> ({customerPhone})
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                  Tanlandi
                </span>
              </div>
            )}

            {/* Customer Details Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Mijoz F.I.Sh. *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Sardor Rahimov"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Telefon Raqami</label>
                <input
                  type="text"
                  placeholder="+998 90 123 45 67"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-1">Obyekt Manzili</label>
              <input
                type="text"
                placeholder="Masalan: Chilonzor 9-mavze, 45-uy"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* 2. TAYYOR SHABLONLAR VA PAKETLAR (PRESET & CUSTOM TEMPLATES) */}
          <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Tayyor Smeta Shablonlari & Paketlar
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingTemplate((prev) => !prev)}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1 transition"
              >
                <BookmarkPlus className="w-3 h-3" />
                <span>+ Smetani Shablon Qilish</span>
              </button>
            </div>

            {/* Save New Custom Template Box */}
            {isCreatingTemplate && (
              <div className="p-3 bg-slate-950 rounded-xl border border-amber-500/50 space-y-2 animate-in fade-in duration-200">
                <span className="text-[11px] font-bold text-amber-300 block">
                  💾 Hozirgi tanlangan mahsulotlarni yangi shablon qilib saqlash:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Shablon nomi (masalan: Dacha uchun 2-kamera mini)"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCurrentAsTemplate}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition"
                  >
                    Saqlash
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingTemplate(false)}
                    className="p-1.5 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Horizontal Scrollable Templates Carousel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {allTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => handleApplyTemplate(tpl)}
                  className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-1.5 select-none ${
                    tpl.isCustom
                      ? 'bg-amber-950/40 hover:bg-amber-950/60 border-amber-800/80 ring-1 ring-amber-500/30'
                      : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="text-xs font-bold text-white line-clamp-1">{tpl.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {tpl.badge && (
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                          tpl.isCustom ? 'bg-amber-500/30 text-amber-300' : 'bg-purple-900/60 text-purple-300'
                        }`}>
                          {tpl.badge}
                        </span>
                      )}
                      {tpl.isCustom && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCustomTemplate(tpl.id, e)}
                          className="text-slate-500 hover:text-rose-400 p-0.5"
                          title="Shablonni o'chirish"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                    {tpl.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] font-bold text-purple-400">
                    <span>1-bosishda yuklash</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Product / Service Picker */}
          <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              Katalogdan Alohida Mahsulot yoki Xizmat Qo&apos;shish
            </span>

            {/* Search and Category Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Kamera, kabel, montaj qidirish..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Product items quick list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {filteredProducts.slice(0, 10).map((p) => {
                const inCart = items.find((it) => it.productId === p.id);
                const priceUSD = p.retailPriceUSD || (p.retailPrice ? Math.round(p.retailPrice / exchangeRate) : 0);
                const priceUZS = p.retailPrice || Math.round((p.retailPriceUSD || 0) * exchangeRate);

                return (
                  <div
                    key={p.id}
                    onClick={() => handleAddItem(p)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 select-none ${
                      inCart
                        ? 'bg-purple-950/60 border-purple-700/80'
                        : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {p.isService ? (
                          <Wrench className="w-3 h-3 text-pink-400 shrink-0" />
                        ) : (
                          <Cpu className="w-3 h-3 text-cyan-400 shrink-0" />
                        )}
                        <span className="text-xs font-bold text-white truncate block">{p.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ${priceUSD} &bull; {formatNumberWithSpaces(priceUZS)} so&apos;m
                      </span>
                    </div>

                    <button
                      type="button"
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        inCart ? 'bg-purple-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {inCart ? inCart.quantity : <Plus className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Selected Items in Cart & S/N Entry */}
          <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Tanlangan Jihozlar va Xizmatlar ({items.length})
              </span>
              <span className="text-xs font-mono font-bold text-cyan-400">
                Jami: ${totalAmountUSD} (≈ {formatNumberWithSpaces(totalAmountUZS)} so&apos;m)
              </span>
            </div>

            {items.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                Yuqoridagi shablonlardan birini tanlang yoki katalogdan kerakli mahsulotlarni qo&apos;shing.
              </div>
            ) : (
              <div className="space-y-2.5">
                {items.map((it) => (
                  <div
                    key={it.productId}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800/90 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">{it.productName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ${it.unitPriceUSD} &bull; {formatNumberWithSpaces(it.unitPrice)} so&apos;m / {it.unit}
                        </span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(it.productId, -1)}
                          className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold font-mono text-white">
                          {it.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(it.productId, 1)}
                          className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.productId)}
                          className="w-6 h-6 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 flex items-center justify-center ml-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Serial Numbers (S/N) Input for Devices */}
                    {it.hasSerialNumber && !it.isService && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                            <Barcode className="w-3.5 h-3.5 text-amber-400" />
                            Seriya Raqamlari (S/N) — {it.quantity} dona talab qilinadi:
                          </span>
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-700/60">
                            * Majburiy
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Array.from({ length: it.quantity }).map((_, snIdx) => {
                            const val = (it.selectedSerialNumbers && it.selectedSerialNumbers[snIdx]) || '';
                            const isFilled = val.trim().length > 0;
                            const isInvalid = submittedAttempt && !isFilled;

                            return (
                              <div key={snIdx} className="space-y-1">
                                <div className="relative">
                                  <input
                                    type="text"
                                    placeholder={`S/N #${snIdx + 1} (masalan: HK-${snIdx + 101})`}
                                    value={val}
                                    onChange={(e) => handleUpdateSerialNumber(it.productId, snIdx, e.target.value)}
                                    className={`w-full rounded-xl px-3 py-2 text-xs font-mono outline-none transition ${
                                      isInvalid
                                        ? 'bg-rose-950/60 border-2 border-rose-500 text-rose-100 placeholder:text-rose-400/60 ring-2 ring-rose-500/40'
                                        : isFilled
                                        ? 'bg-emerald-950/40 border border-emerald-500/70 text-emerald-200 placeholder:text-slate-600 focus:border-emerald-400'
                                        : 'bg-slate-900 border border-amber-500/50 text-white placeholder:text-slate-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                                    }`}
                                  />
                                  {isFilled && (
                                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-400 text-xs font-bold flex items-center gap-1">
                                      <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                  )}
                                </div>
                                {isInvalid ? (
                                  <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1 px-1">
                                    <AlertCircle className="w-3 h-3" /> S/N #${snIdx + 1} kiritilishi shart!
                                  </span>
                                ) : isFilled ? (
                                  <span className="text-[10px] font-medium text-emerald-400/90 flex items-center gap-1 px-1">
                                    ✓ S/N #${snIdx + 1} qabul qilindi
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium text-amber-400/80 flex items-center gap-1 px-1">
                                    ⚠️ #{snIdx + 1}-qurilma seriya raqamini yozing
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Notes / Comment for Cashier */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 block mb-1">
              Kassir yoki Boshqaruvchiga Izoh / Qo&apos;shimcha ma&apos;lumot
            </label>
            <textarea
              rows={2}
              placeholder="Masalan: Mijoz qo'shimcha 2 ta tashqi kamera va 50m kabel qo'shishni so'radi..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-500"
            />
          </div>

          {/* Missing S/N Warning Banner */}
          {missingSNItems.length > 0 && (
            <div className="p-3.5 bg-rose-950/50 border border-rose-500/60 rounded-2xl flex items-start gap-3 text-xs text-rose-200">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-rose-300 block font-bold text-xs">
                  Seriya Raqamlari (S/N) Kiritilishi Majburiy!
                </strong>
                <p className="text-[11px] text-rose-200/90 mt-0.5">
                  {missingSNItems.length} ta qurilmaning seriya raqami kiritilmagan. Qurilmalarning S/N raqamlarini to&apos;liq kiritmaguningizcha hisob-kitob kassaga yuborilmaydi.
                </p>
              </div>
            </div>
          )}

          {/* Bottom Calculation & Submit */}
          <div className="bg-gradient-to-r from-purple-950/80 to-slate-900 border border-purple-900/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-purple-300 block font-semibold uppercase">Jami Hisob-kitob:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-white font-mono">${totalAmountUSD}</span>
                <span className="text-xs text-purple-200 font-mono">≈ {formatNumberWithSpaces(totalAmountUZS)} so&apos;m</span>
              </div>
              {estimatedTechnicianWageUSD > 0 && (
                <span className="text-[10px] text-emerald-400 font-medium block mt-0.5">
                  ✓ Sizning xizmat haqqingiz: <strong>${estimatedTechnicianWageUSD}</strong>
                </span>
              )}
            </div>

            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition active:scale-98"
            >
              <Send className="w-4 h-4" />
              <span>🚀 Asosiy Kassaga Yuborish (Tasdiqlash)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
