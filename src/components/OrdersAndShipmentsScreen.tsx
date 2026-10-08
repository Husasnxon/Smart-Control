'use client';

import React, { useState } from 'react';
import { 
  CustomerOrder, 
  ShipmentOrder, 
  OrderItem, 
  Product, 
  Customer, 
  Employee, 
  AssignedTechnician, 
  PaymentDetails, 
  Currency,
  ObjectHandover
} from '../types';
import { formatDualMoney, formatMoney, formatNumberWithSpaces, formatUSDNumber, getNowFormatted } from '../utils/formatters';
import { 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Trash2, 
  Edit3, 
  X, 
  Save, 
  Barcode, 
  Building2, 
  MapPin, 
  Phone, 
  Calendar, 
  DollarSign, 
  Coins, 
  Banknote, 
  CreditCard, 
  HardHat, 
  ArrowRight, 
  FileText, 
  AlertTriangle,
  UserPlus,
  PackageCheck,
  Package,
  Camera,
  Star,
  ShieldCheck,
  ExternalLink,
  Navigation,
  Check,
  Minus,
  Hash
} from 'lucide-react';
import { OrderQuotationModal } from './OrderQuotationModal';
import { HandoverModal } from './HandoverModal';

interface OrdersAndShipmentsScreenProps {
  orders: CustomerOrder[];
  shipments: ShipmentOrder[];
  products: Product[];
  customers: Customer[];
  employees: Employee[];
  exchangeRate: number;
  baseCurrency?: Currency;
  onSaveOrder: (order: CustomerOrder) => void;
  onDeleteOrder: (orderId: string) => void;
  onSaveShipment: (shipment: ShipmentOrder) => void;
  onCompleteShipmentSale: (
    shipment: ShipmentOrder,
    paymentDetails: PaymentDetails,
    assignedTechs: AssignedTechnician[]
  ) => void;
  onAddCustomer: (customer: Customer) => void;
  currentUser?: Employee | null;
  handovers?: ObjectHandover[];
  onSaveHandover?: (handover: ObjectHandover) => void;
  onClearAllOrders?: () => void;
}

export const OrdersAndShipmentsScreen: React.FC<OrdersAndShipmentsScreenProps> = ({
  orders,
  shipments,
  products,
  customers,
  employees,
  exchangeRate,
  baseCurrency = 'UZS',
  onSaveOrder,
  onDeleteOrder,
  onSaveShipment,
  onCompleteShipmentSale,
  onAddCustomer,
  currentUser,
  handovers = [],
  onSaveHandover,
  onClearAllOrders
}) => {
  // Main Sub-tabs: 'orders' (Hisob-kitob / Zakaz) or 'shipments' (Otgruzka) or 'handovers' (Obyekt topshirish)
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'shipments' | 'handovers'>('orders');

  // Search queries & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'new' | 'approved' | 'shipped'>('all');

  // Modals state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<CustomerOrder | null>(null);

  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
  const [activeShipment, setActiveShipment] = useState<ShipmentOrder | null>(null);

  const [quotationOrder, setQuotationOrder] = useState<CustomerOrder | null>(null);

  // Handover Modal State
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [selectedHandoverOrder, setSelectedHandoverOrder] = useState<CustomerOrder | null>(null);
  const [selectedViewingHandover, setSelectedViewingHandover] = useState<ObjectHandover | null>(null);

  // New inline customer modal state
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // ----------------------------------------------------
  // ORDER FORM STATE (Zakaz xaridori / Hisob-kitob)
  // ----------------------------------------------------
  const [formOrganization, setFormOrganization] = useState('WST Namangan');
  const [formWarehouse, setFormWarehouse] = useState('Asosiy ombor');
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formDeliveryAddress, setFormDeliveryAddress] = useState('');
  const [formProjectName, setFormProjectName] = useState('');
  const [formComment, setFormComment] = useState('');
  const [formCurrency, setFormCurrency] = useState<'UZS' | 'USD'>('UZS');
  const [formItems, setFormItems] = useState<OrderItem[]>([]);
  const [productSearch, setProductSearch] = useState('');

  // ----------------------------------------------------
  // SHIPMENT MODAL STATE (Otgruzka & Seriya raqamlari)
  // ----------------------------------------------------
  const [shipmentItemsWithSerials, setShipmentItemsWithSerials] = useState<OrderItem[]>([]);
  const [manualSerialInput, setManualSerialInput] = useState<{ [itemIdx: number]: string }>({});
  const [shipmentPaymentMethod, setShipmentPaymentMethod] = useState<'cash' | 'card' | 'debt' | 'usd'>('cash');
  const [assignedTechnicians, setAssignedTechnicians] = useState<AssignedTechnician[]>([]);
  const [shipmentProductSearch, setShipmentProductSearch] = useState('');

  // Open Order Modal for New or Edit
  const handleOpenNewOrder = () => {
    setEditingOrder(null);
    setFormOrganization('WST Namangan');
    setFormWarehouse('Asosiy ombor');
    setFormCustomerId('');
    setFormDeliveryAddress('');
    setFormProjectName('');
    setFormComment('');
    setFormCurrency(baseCurrency || 'UZS');
    setFormItems([]);
    setProductSearch('');
    setIsOrderModalOpen(true);
  };

  const handleOpenEditOrder = (order: CustomerOrder) => {
    setEditingOrder(order);
    setFormOrganization(order.organization || 'WST Namangan');
    setFormWarehouse(order.warehouseName || 'Asosiy ombor');
    setFormCustomerId(order.customerId || '');
    setFormDeliveryAddress(order.deliveryAddress || '');
    setFormProjectName(order.projectName || '');
    setFormComment(order.comment || '');
    setFormCurrency(order.currency || 'UZS');
    setFormItems([...order.items]);
    setProductSearch('');
    setIsOrderModalOpen(true);
  };

  // Add Product to Order form
  const handleAddProductToOrder = (prod: Product) => {
    const isUSD = formCurrency === 'USD';
    const rate = exchangeRate > 0 ? exchangeRate : 12850;
    const unitPrice = isUSD
      ? (prod.retailPriceUSD && prod.retailPriceUSD > 0
          ? prod.retailPriceUSD
          : Number((prod.retailPrice / rate).toFixed(2)))
      : prod.retailPrice;

    const existingIdx = formItems.findIndex((it) => it.productId === prod.id);
    if (existingIdx >= 0) {
      const updated = [...formItems];
      updated[existingIdx].quantity += 1;
      const disc = (updated[existingIdx].discountPercent || 0) / 100;
      const rawTotal = updated[existingIdx].quantity * updated[existingIdx].unitPrice * (1 - disc);
      updated[existingIdx].totalPrice = isUSD ? Number(rawTotal.toFixed(2)) : Math.round(rawTotal);
      setFormItems(updated);
    } else {
      const newItem: OrderItem = {
        productId: prod.id,
        productName: prod.name,
        quantity: 1,
        unit: prod.unit,
        unitPrice: unitPrice,
        unitPriceUSD: isUSD ? unitPrice : (prod.retailPriceUSD || (exchangeRate > 0 ? Number((unitPrice / exchangeRate).toFixed(2)) : undefined)),
        discountPercent: 0,
        totalPrice: unitPrice,
        hasSerialNumber: prod.hasSerialNumber,
        isService: prod.isService
      };
      setFormItems((prev) => [...prev, newItem]);
    }
  };

  // Convert already added items when document currency is switched
  const handleCurrencyChange = (newCurr: 'UZS' | 'USD') => {
    if (newCurr === formCurrency) return;
    setFormCurrency(newCurr);

    const rate = exchangeRate > 0 ? exchangeRate : 12850;
    setFormItems((prev) =>
      prev.map((item) => {
        let newUnitPrice: number;
        if (newCurr === 'USD') {
          // UZS -> USD
          newUnitPrice = item.unitPriceUSD && item.unitPriceUSD > 0
            ? item.unitPriceUSD
            : Number((item.unitPrice / rate).toFixed(2));
        } else {
          // USD -> UZS
          newUnitPrice = Math.round(item.unitPrice * rate);
        }
        const disc = (item.discountPercent || 0) / 100;
        const rawTotal = item.quantity * newUnitPrice * (1 - disc);
        const newTotal = newCurr === 'USD' ? Number(rawTotal.toFixed(2)) : Math.round(rawTotal);

        return {
          ...item,
          unitPrice: newUnitPrice,
          unitPriceUSD: newCurr === 'USD' ? newUnitPrice : item.unitPriceUSD,
          totalPrice: newTotal
        };
      })
    );
  };

  const handleUpdateOrderItem = (idx: number, field: 'quantity' | 'unitPrice' | 'discountPercent', val: number) => {
    setFormItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[idx], [field]: val };
      if (field === 'unitPrice') {
        if (formCurrency === 'USD') {
          item.unitPriceUSD = val;
        } else {
          item.unitPriceUSD = exchangeRate > 0 ? Number((val / exchangeRate).toFixed(2)) : undefined;
        }
      }
      const disc = (item.discountPercent || 0) / 100;
      const discountedPrice = item.unitPrice * (1 - disc);
      const rawTotal = item.quantity * discountedPrice;
      item.totalPrice = formCurrency === 'USD' ? Number(rawTotal.toFixed(2)) : Math.round(rawTotal);
      updated[idx] = item;
      return updated;
    });
  };

  const handleRemoveOrderItem = (idx: number) => {
    setFormItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Save Order
  const handleSaveOrderSubmit = (targetStatus: 'new' | 'calculated' | 'approved' = 'new') => {
    if (formItems.length === 0) {
      alert("Iltimos, hisob-kitob uchun kamida bitta tovar yoki xizmat tanlang!");
      return;
    }

    const isUSD = formCurrency === 'USD';
    const rate = exchangeRate > 0 ? exchangeRate : 12850;
    const selectedCust = customers.find((c) => c.id === formCustomerId);
    const rawSubtotal = formItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
    const rawTotal = formItems.reduce((sum, it) => sum + it.totalPrice, 0);
    const subtotal = isUSD ? Number(rawSubtotal.toFixed(2)) : Math.round(rawSubtotal);
    const totalAmount = isUSD ? Number(rawTotal.toFixed(2)) : Math.round(rawTotal);
    const discountTotal = isUSD ? Number((subtotal - totalAmount).toFixed(2)) : Math.round(subtotal - totalAmount);

    const totalAmountUSD = isUSD ? totalAmount : Number((totalAmount / rate).toFixed(2));

    const orderNumber = editingOrder ? editingOrder.orderNumber : `ZK-${1000 + orders.length + 1}`;

    const newOrder: CustomerOrder = {
      id: editingOrder ? editingOrder.id : `order-${Date.now()}`,
      orderNumber,
      createdAt: editingOrder ? editingOrder.createdAt : getNowFormatted(),
      organization: formOrganization,
      customerId: formCustomerId || undefined,
      customerName: selectedCust ? selectedCust.fullName : 'Standart Xaridor',
      customerPhone: selectedCust ? selectedCust.phone : undefined,
      warehouseName: formWarehouse,
      deliveryAddress: formDeliveryAddress.trim() || undefined,
      projectName: formProjectName.trim() || undefined,
      comment: formComment.trim() || undefined,
      currency: formCurrency,
      exchangeRate: rate,
      items: formItems,
      subtotal,
      discountTotal,
      totalAmount,
      totalAmountUSD,
      status: targetStatus
    };

    onSaveOrder(newOrder);
    setIsOrderModalOpen(false);
  };

  // Convert Order to Shipment (Otgruzkaga o'tkazish)
  const handleConvertOrderToShipment = (order: CustomerOrder) => {
    // Check if an existing shipment already exists for this order
    const existingShipment = shipments.find((s) => s.orderId === order.id);
    if (existingShipment) {
      handleOpenProcessShipment(existingShipment);
      return;
    }

    const newShipmentNumber = `OTG-${2000 + shipments.length + 1}`;
    const newShipment: ShipmentOrder = {
      id: `shipment-${Date.now()}`,
      shipmentNumber: newShipmentNumber,
      orderId: order.id,
      orderNumber: order.orderNumber,
      createdAt: getNowFormatted(),
      organization: order.organization || 'WST Namangan',
      customerId: order.customerId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      warehouseName: order.warehouseName,
      deliveryAddress: order.deliveryAddress,
      projectName: order.projectName,
      comment: order.comment,
      currency: order.currency,
      exchangeRate: order.exchangeRate,
      items: order.items.map((it) => ({ ...it, selectedSerialNumbers: [] })),
      subtotal: order.subtotal,
      discountTotal: order.discountTotal,
      totalAmount: order.totalAmount,
      totalAmountUSD: order.totalAmountUSD,
      status: 'pending',
      paymentMethod: 'cash'
    };

    onSaveShipment(newShipment);
    // Update order status to approved
    onSaveOrder({ ...order, status: 'approved', shipmentId: newShipment.id });

    // Open shipment processing modal directly
    handleOpenProcessShipment(newShipment);
  };

  // Open New Shipment directly
  const handleOpenNewShipment = () => {
    const newShipmentNumber = `OTG-${2000 + shipments.length + 1}`;
    const newShipment: ShipmentOrder = {
      id: `shipment-${Date.now()}`,
      shipmentNumber: newShipmentNumber,
      createdAt: getNowFormatted(),
      organization: 'WST Namangan',
      customerName: 'Standart Xaridor',
      warehouseName: 'Asosiy ombor',
      currency: baseCurrency || 'UZS',
      exchangeRate: exchangeRate > 0 ? exchangeRate : 12850,
      items: [],
      subtotal: 0,
      discountTotal: 0,
      totalAmount: 0,
      totalAmountUSD: 0,
      status: 'pending',
      paymentMethod: 'cash'
    };
    setActiveShipment(newShipment);
    setShipmentItemsWithSerials([]);
    setShipmentPaymentMethod('cash');
    setAssignedTechnicians([]);
    setShipmentProductSearch('');
    setIsShipmentModalOpen(true);
  };

  // Open Shipment Processing Modal
  const handleOpenProcessShipment = (shipment: ShipmentOrder) => {
    setActiveShipment(shipment);
    setShipmentItemsWithSerials(shipment.items.map((it) => ({
      ...it,
      selectedSerialNumbers: it.selectedSerialNumbers ? [...it.selectedSerialNumbers] : []
    })));
    setShipmentPaymentMethod(shipment.paymentMethod || 'cash');
    setAssignedTechnicians(shipment.technicians ? [...shipment.technicians] : []);
    setShipmentProductSearch('');
    setIsShipmentModalOpen(true);
  };

  // Add Product directly into Shipment
  const handleAddProductToShipment = (product: Product) => {
    if (!activeShipment) return;
    const isUSD = activeShipment.currency === 'USD';
    const rate = exchangeRate > 0 ? exchangeRate : 12850;
    const unitPrice = isUSD 
      ? (product.retailPriceUSD || Number((product.retailPrice / rate).toFixed(2)))
      : product.retailPrice;
    const unitPriceUSD = isUSD ? unitPrice : (product.retailPriceUSD || Number((product.retailPrice / rate).toFixed(2)));

    setShipmentItemsWithSerials((prev) => {
      const existingIdx = prev.findIndex((it) => it.productId === product.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const it = updated[existingIdx];
        const newQty = it.quantity + 1;
        const disc = (it.discountPercent || 0) / 100;
        const discountedPrice = it.unitPrice * (1 - disc);
        const rawTotal = newQty * discountedPrice;
        updated[existingIdx] = {
          ...it,
          quantity: newQty,
          totalPrice: isUSD ? Number(rawTotal.toFixed(2)) : Math.round(rawTotal)
        };
        return updated;
      }

      const newItem: OrderItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice,
        unitPriceUSD,
        discountPercent: 0,
        totalPrice: unitPrice,
        unit: product.unit || 'dona',
        hasSerialNumber: product.hasSerialNumber,
        selectedSerialNumbers: []
      };
      return [...prev, newItem];
    });
  };

  // Update Shipment Item Quantity / Price / Discount
  const handleUpdateShipmentItem = (idx: number, field: 'quantity' | 'unitPrice' | 'discountPercent', val: number) => {
    if (!activeShipment) return;
    const isUSD = activeShipment.currency === 'USD';
    const rate = exchangeRate > 0 ? exchangeRate : 12850;

    setShipmentItemsWithSerials((prev) => {
      const updated = [...prev];
      const it = { ...updated[idx], [field]: val };
      if (field === 'quantity' && val <= 0) {
        return prev.filter((_, i) => i !== idx);
      }
      if (field === 'unitPrice') {
        if (isUSD) {
          it.unitPriceUSD = val;
        } else {
          it.unitPriceUSD = rate > 0 ? Number((val / rate).toFixed(2)) : undefined;
        }
      }
      const disc = (it.discountPercent || 0) / 100;
      const discountedPrice = it.unitPrice * (1 - disc);
      const rawTotal = it.quantity * discountedPrice;
      it.totalPrice = isUSD ? Number(rawTotal.toFixed(2)) : Math.round(rawTotal);

      if (it.hasSerialNumber && it.selectedSerialNumbers && it.selectedSerialNumbers.length > it.quantity) {
        it.selectedSerialNumbers = it.selectedSerialNumbers.slice(0, it.quantity);
      }

      updated[idx] = it;
      return updated;
    });
  };

  // Remove Item from Shipment
  const handleRemoveShipmentItem = (idx: number) => {
    setShipmentItemsWithSerials((prev) => prev.filter((_, i) => i !== idx));
  };

  // Toggle Serial Number in Shipment
  const handleToggleShipmentSerial = (itemIdx: number, sn: string) => {
    setShipmentItemsWithSerials((prev) => {
      const updated = [...prev];
      const item = { ...updated[itemIdx] };
      const currentSerials = item.selectedSerialNumbers || [];

      if (currentSerials.includes(sn)) {
        item.selectedSerialNumbers = currentSerials.filter((s) => s !== sn);
      } else {
        if (currentSerials.length >= item.quantity) {
          alert(`Ushbu tovardan faqat ${item.quantity} ta kerak! Ortig'ini tanlab bo'lmaydi.`);
          return prev;
        }
        item.selectedSerialNumbers = [...currentSerials, sn];
      }

      updated[itemIdx] = item;
      return updated;
    });
  };

  // Add Manual / Scanned S/N
  const handleAddManualSerial = (itemIdx: number) => {
    const inputVal = (manualSerialInput[itemIdx] || '').trim();
    if (!inputVal) return;

    const currentItem = shipmentItemsWithSerials[itemIdx];
    if (!currentItem) return;

    const catalogProd = products.find((p) => p.id === currentItem.productId);
    const availableWarehouseSerials = catalogProd?.serialNumbers || [];

    // STRICT VALIDATION: Check if inputVal exists in warehouse stock!
    const matchedSN = availableWarehouseSerials.find((s) => s.toLowerCase() === inputVal.toLowerCase());
    if (!matchedSN) {
      alert(`❌ Xatolik: "${inputVal}" seriya raqami ushbu tovar bo'yicha omborda mavjud emas!\n\nPrixod qilinmagan tovar otgruzka bo'lishining oldini olish uchun faqat ombordagi haqiqiy S/N larni kiritish mumkin.`);
      return;
    }

    setShipmentItemsWithSerials((prev) => {
      const updated = [...prev];
      const item = { ...updated[itemIdx] };
      const currentSerials = item.selectedSerialNumbers || [];

      if (currentSerials.includes(matchedSN)) {
        alert("Ushbu seriya raqami allaqachon tanlangan!");
        return prev;
      }
      if (currentSerials.length >= item.quantity) {
        alert(`Ushbu tovardan faqat ${item.quantity} ta kerak! Ortig'ini tanlab bo'lmaydi.`);
        return prev;
      }

      item.selectedSerialNumbers = [...currentSerials, matchedSN];
      updated[itemIdx] = item;
      return updated;
    });

    setManualSerialInput((prev) => ({ ...prev, [itemIdx]: '' }));
  };

  // Technician allocation in Shipment
  const handleAddTechToShipment = (empId: string) => {
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

  const handleRemoveTechFromShipment = (techId: string) => {
    setAssignedTechnicians((prev) => prev.filter((t) => t.id !== techId));
  };

  // Save Shipment as Draft (pending)
  const handleSaveShipmentDraft = () => {
    if (!activeShipment) return;
    const isUSD = activeShipment.currency === 'USD';
    const rate = exchangeRate > 0 ? exchangeRate : 12850;
    const currentSubtotal = shipmentItemsWithSerials.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
    const currentTotal = shipmentItemsWithSerials.reduce((sum, it) => sum + it.totalPrice, 0);
    const currentDiscount = currentSubtotal - currentTotal;
    const totalAmountUSD = isUSD ? currentTotal : Number((currentTotal / rate).toFixed(2));

    const updatedShipment: ShipmentOrder = {
      ...activeShipment,
      items: shipmentItemsWithSerials,
      subtotal: isUSD ? Number(currentSubtotal.toFixed(2)) : Math.round(currentSubtotal),
      discountTotal: isUSD ? Number(currentDiscount.toFixed(2)) : Math.round(currentDiscount),
      totalAmount: isUSD ? Number(currentTotal.toFixed(2)) : Math.round(currentTotal),
      totalAmountUSD,
      technicians: assignedTechnicians,
      paymentMethod: shipmentPaymentMethod
    };

    onSaveShipment(updatedShipment);
    setIsShipmentModalOpen(false);
  };

  // Complete Shipment & Sell
  const handleConfirmShipmentAndSell = () => {
    if (!activeShipment) return;

    if (shipmentItemsWithSerials.length === 0) {
      alert("Iltimos, otgruzka qilish uchun kamida bitta mahsulot qo'shing!");
      return;
    }

    // Validate that all serialized items have required serial numbers chosen!
    for (let i = 0; i < shipmentItemsWithSerials.length; i++) {
      const item = shipmentItemsWithSerials[i];
      if (item.hasSerialNumber) {
        const chosen = item.selectedSerialNumbers?.length || 0;
        if (chosen < item.quantity) {
          alert(`Diqqat! "${item.productName}" uchun ${item.quantity} ta seriya raqami kerak, lekin ${chosen} ta kiritilgan. Iltimos, seriya raqamlarini to'liq tanlang yoki skaner qiling!`);
          return;
        }
      }
    }

    const isUSD = activeShipment.currency === 'USD';
    const rate = exchangeRate > 0 ? exchangeRate : 12850;
    const currentSubtotal = shipmentItemsWithSerials.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
    const currentTotal = shipmentItemsWithSerials.reduce((sum, it) => sum + it.totalPrice, 0);
    const currentDiscount = currentSubtotal - currentTotal;

    const totalAmountUZS = isUSD ? Math.round(currentTotal * rate) : currentTotal;
    const totalAmountUSD = isUSD ? currentTotal : Number((currentTotal / rate).toFixed(2));

    const paymentDetails: PaymentDetails = {
      cash: shipmentPaymentMethod === 'cash' ? totalAmountUZS : 0,
      cashUSD: shipmentPaymentMethod === 'usd' ? totalAmountUSD : undefined,
      card: shipmentPaymentMethod === 'card' ? totalAmountUZS : 0,
      debt: shipmentPaymentMethod === 'debt' ? totalAmountUZS : 0,
      cashbackUsed: 0,
      total: totalAmountUZS,
      currencyPaid: shipmentPaymentMethod === 'usd' ? 'USD' : 'UZS'
    };

    const updatedShipment: ShipmentOrder = {
      ...activeShipment,
      items: shipmentItemsWithSerials,
      subtotal: isUSD ? Number(currentSubtotal.toFixed(2)) : Math.round(currentSubtotal),
      discountTotal: isUSD ? Number(currentDiscount.toFixed(2)) : Math.round(currentDiscount),
      totalAmount: isUSD ? Number(currentTotal.toFixed(2)) : Math.round(currentTotal),
      totalAmountUSD,
      technicians: assignedTechnicians,
      paymentMethod: shipmentPaymentMethod,
      status: 'shipped'
    };

    // Trigger complete sale & inventory deduction
    onSaveShipment(updatedShipment);
    onCompleteShipmentSale(updatedShipment, paymentDetails, assignedTechnicians);

    // If linked to an order, mark the order as shipped
    if (activeShipment.orderId) {
      const linked = orders.find((o) => o.id === activeShipment.orderId);
      if (linked) {
        onSaveOrder({ ...linked, status: 'shipped', shipmentId: updatedShipment.id });
      }
    }

    setIsShipmentModalOpen(false);
  };

  // Inline Quick Add Customer
  const handleCreateCustomer = () => {
    if (!newCustName.trim() || !newCustPhone.trim()) {
      alert("Iltimos, mijoz ismi va telefon raqamini kiriting!");
      return;
    }
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      fullName: newCustName.trim(),
      phone: newCustPhone.trim(),
      cashbackBalance: 0,
      totalPurchases: 0,
      debtBalance: 0,
      tier: 'Standard',
      cashbackRate: 1,
      registeredDate: new Date().toLocaleDateString('uz-UZ')
    };
    onAddCustomer(newCust);
    setFormCustomerId(newCust.id);
    setIsAddCustomerOpen(false);
    setNewCustName('');
    setNewCustPhone('');
  };

  // Filter permissions logic
  const isOnlyAssigned = currentUser?.permissions?.onlyAssignedOrders ?? (currentUser?.systemRole === 'technician');
  const canCreateOrders = currentUser?.permissions?.canCreateOrders !== false;
  const canCreateShipments = currentUser?.permissions?.canCreateShipments !== false;
  const canDeleteOrders = currentUser?.permissions?.canDeleteOrders !== false;

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    // If technician is restricted to only assigned orders:
    if (isOnlyAssigned && currentUser) {
      const isAssigned = 
        (o.technicians && o.technicians.some(t => t.id === currentUser.id)) ||
        o.technicianId === currentUser.id ||
        (o.technicianName && o.technicianName.toLowerCase().includes(currentUser.fullName.toLowerCase()));
      if (!isAssigned) return false;
    }

    if (orderStatusFilter === 'new' && o.status !== 'new' && o.status !== 'calculated') return false;
    if (orderStatusFilter === 'approved' && o.status !== 'approved') return false;
    if (orderStatusFilter === 'shipped' && o.status !== 'shipped') return false;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      (o.customerPhone && o.customerPhone.includes(q)) ||
      (o.deliveryAddress && o.deliveryAddress.toLowerCase().includes(q)) ||
      (o.projectName && o.projectName.toLowerCase().includes(q)) ||
      (o.technicianName && o.technicianName.toLowerCase().includes(q))
    );
  });

  // Filter shipments
  const filteredShipments = shipments.filter((s) => {
    // If technician is restricted to only assigned shipments:
    if (isOnlyAssigned && currentUser) {
      const isAssigned = s.technicians && s.technicians.some(t => t.id === currentUser.id);
      if (!isAssigned) return false;
    }

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.shipmentNumber.toLowerCase().includes(q) ||
      s.customerName.toLowerCase().includes(q) ||
      (s.customerPhone && s.customerPhone.includes(q)) ||
      (s.deliveryAddress && s.deliveryAddress.toLowerCase().includes(q))
    );
  });

  // Available catalog products for picker
  const filteredCatalogProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.barcode.includes(productSearch) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 bg-slate-50 dark:bg-slate-950 print:p-0 print:bg-white print:overflow-visible">
      {/* Background Screen Container (Hidden when printing modal) */}
      <div className={`space-y-5 ${isHandoverModalOpen || quotationOrder || isOrderModalOpen || isShipmentModalOpen ? 'no-print print:hidden' : ''}`}>
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-sky-500" />
            Klient uchun Hisob-kitob (Smeta) va Otgruzka
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Mijozga avval smeta hisoblab berish, tijoriy taklif chiqarish va rozi bo&apos;lganda seriya raqamlari (S/N) bilan otgruzka qilib sotish
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5">
          {onClearAllOrders && (currentUser?.systemRole === 'admin' || currentUser?.systemRole === 'manager' || !currentUser?.systemRole) && (orders.length > 0 || shipments.length > 0) && (
            <button
              onClick={() => {
                if (window.confirm("Haqiqatan ham barcha eski buyurtmalar, hisob-kitoblar va otgruzkani tozalab o'chirib tashlamoqchimisiz?")) {
                  onClearAllOrders();
                }
              }}
              className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/30 transition flex items-center gap-1.5 shadow-sm"
              title="Barcha buyurtmalarni tozalash"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Barcha Zakazlarni Tozalash</span>
            </button>
          )}

          {activeSubTab === 'orders' && canCreateOrders && (
            <button
              onClick={handleOpenNewOrder}
              className="px-4 py-2.5 rounded-xl font-extrabold text-xs bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-600/30 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Yangi Hisob-kitob (Zakaz)</span>
            </button>
          )}

          {activeSubTab === 'shipments' && canCreateShipments && (
            <button
              onClick={handleOpenNewShipment}
              className="px-4 py-2.5 rounded-xl font-extrabold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
            >
              <Truck className="w-4 h-4" />
              <span>+ Yangi Otgruzka Yaratish</span>
            </button>
          )}
        </div>
      </div>

      {/* Restricted Access Badge for Technicians */}
      {isOnlyAssigned && currentUser && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-xs text-amber-700 dark:text-amber-300">
          <HardHat className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <span className="font-bold">Biriktirilgan ko&apos;rinish (Usta huquqi): </span>
            <span>
              Sizga faqat o&apos;zingiz montajchi usta sifatida biriktirilgan (qatnashgan) hisob-kitob smetalari va otgruzkalar ko&apos;rsatilmoqda ({currentUser.fullName}).
            </span>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Jami Hisob-kitoblar (Zakazlar)</span>
            <FileSpreadsheet className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
            {orders.length} ta
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Mijozlarga hisoblangan smetalar
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-amber-500 text-xs font-semibold">
            <span>Kutilayotgan Otgruzkalar</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-extrabold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {shipments.filter((s) => s.status === 'pending').length} ta
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            S/N kiritilishi va topshirilishi kutilmoqda
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 text-xs font-semibold">
            <span>Otgruzka qilingan (Sotilgan)</span>
            <PackageCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {shipments.filter((s) => s.status === 'shipped').length} ta
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Muvaffaqiyatli topshirildi va sotildi
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-sky-600 text-xs font-semibold">
            <span>Smetalar Umumiy Summasi</span>
            <DollarSign className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl font-extrabold font-mono text-sky-700 dark:text-sky-300 mt-1">
            {formatDualMoney(
              orders.reduce((sum, o) => sum + (o.currency === 'USD' ? Math.round(o.totalAmount * (o.exchangeRate || exchangeRate)) : o.totalAmount), 0),
              baseCurrency,
              exchangeRate
            ).primary}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 flex justify-between items-center">
            <span>Barcha hisob-kitoblar</span>
            <span className="font-mono text-slate-500">
              ({formatDualMoney(
                orders.reduce((sum, o) => sum + (o.currency === 'USD' ? Math.round(o.totalAmount * (o.exchangeRate || exchangeRate)) : o.totalAmount), 0),
                baseCurrency,
                exchangeRate
              ).secondary})
            </span>
          </div>
        </div>
      </div>

      {/* Main Sub-Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'orders'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>1. Mijoz uchun Hisob-kitob (Zakaz / Smeta)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-900/60 text-white font-mono">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('shipments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'shipments'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>2. Otgruzka (Yuklash & S/N)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-900/60 text-white font-mono">
              {shipments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('handovers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'handovers'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            <Camera className="w-4 h-4 text-purple-400" />
            <span>3. Obyekt Topshirish & Foto-Aktlar</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-900/60 text-white font-mono">
              {handovers.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeSubTab === 'orders' ? "Zakaz №, mijoz, manzil..." : "Otgruzka №, mijoz..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: ORDERS / HISOB-KITOB (ZAKAZLAR) LIST */}
      {/* ======================================================== */}
      {activeSubTab === 'orders' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">№ Zakaz & Vaqti</th>
                  <th className="py-3 px-4">Tashkilot & Ombor</th>
                  <th className="py-3 px-4">Mijoz / Kontragent</th>
                  <th className="py-3 px-4">Obyekt / Manzil</th>
                  <th className="py-3 px-4">Mahsulotlar</th>
                  <th className="py-3 px-4 text-right">Jami Summa</th>
                  <th className="py-3 px-4 text-center">Holat</th>
                  <th className="py-3 px-4 text-center">Tezkor Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Hisob-kitob smetalari mavjud emas. Yuqoridagi &ldquo;+ Yangi Hisob-kitob&rdquo; tugmasi orqali yangi smeta tuzishingiz mumkin.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isShipped = order.status === 'shipped';
                    const isApproved = order.status === 'approved';

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-900 dark:text-white block">
                            {order.orderNumber}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {order.createdAt}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                            {order.organization || 'WST Namangan'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {order.warehouseName || 'Asosiy ombor'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {order.customerName}
                          </span>
                          {order.customerPhone && (
                            <span className="text-[10px] text-slate-400">
                              {order.customerPhone}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-slate-700 dark:text-slate-300 block">
                            {order.projectName || 'Standart loyiha'}
                          </span>
                          {order.deliveryAddress && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 line-clamp-1">
                              <MapPin className="w-2.5 h-2.5 text-sky-500 shrink-0" />
                              {order.deliveryAddress}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-800 dark:text-slate-200 block">
                            {order.items.length} xil pozitsiya
                          </span>
                          <span className="text-[10px] text-slate-400 line-clamp-1">
                            {order.items.map((it) => `${it.productName} (${it.quantity})`).join(', ')}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white block">
                            {formatDualMoney(
                              order.currency === 'USD' ? Math.round(order.totalAmount * (order.exchangeRate || exchangeRate)) : order.totalAmount,
                              baseCurrency,
                              exchangeRate
                            ).primary}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {formatDualMoney(
                              order.currency === 'USD' ? Math.round(order.totalAmount * (order.exchangeRate || exchangeRate)) : order.totalAmount,
                              baseCurrency,
                              exchangeRate
                            ).secondary}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {order.status === 'pending_cashier_approval' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                              🟡 Kassa tasdig&apos;i kutilmoqda
                            </span>
                          ) : order.status === 'rejected' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              ❌ Rad etilgan
                            </span>
                          ) : isShipped ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                              Otgruzka bo&apos;ldi
                            </span>
                          ) : isApproved ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300">
                              Mijoz rozi bo&apos;ldi
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                              Hisoblangan
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Smeta View & Print */}
                            <button
                              onClick={() => setQuotationOrder(order)}
                              className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 hover:bg-sky-100 transition border border-sky-200 dark:border-sky-900/50"
                              title="Tijoriy taklif (Smeta) ko'rish va chop etish"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            {/* Handover Act Button (Obyekt topshirish) */}
                            {(() => {
                              const matchingHandover = handovers.find((h) => h.orderId === order.id || h.orderNumber === order.orderNumber);
                              if (matchingHandover) {
                                return (
                                  <button
                                    onClick={() => {
                                      setSelectedViewingHandover(matchingHandover);
                                      setSelectedHandoverOrder(order);
                                      setIsHandoverModalOpen(true);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition border border-purple-200 dark:border-purple-800 text-[10px] font-bold flex items-center gap-1"
                                    title="Obyekt qabul qilish dalolatnomasini ko'rish va chop etish"
                                  >
                                    <ShieldCheck className="w-3 h-3 text-purple-600" />
                                    <span>✓ Akt</span>
                                  </button>
                                );
                              }
                              return (
                                <button
                                  onClick={() => {
                                    setSelectedHandoverOrder(order);
                                    setSelectedViewingHandover(null);
                                    setIsHandoverModalOpen(true);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] transition flex items-center gap-1 shadow-sm"
                                  title="Usta ishini topshirish (Foto-hisobot, GPS, Mijoz imzosi)"
                                >
                                  <Camera className="w-3 h-3" />
                                  <span>📸 Akt</span>
                                </button>
                              );
                            })()}

                            {/* Convert to Shipment */}
                            {!isShipped && (
                              <button
                                onClick={() => handleConvertOrderToShipment(order)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] transition flex items-center gap-1 shadow-sm"
                                title="Mijoz rozi — Otgruzkaga o'tkazish va Seriya raqamini kiritish"
                              >
                                <Truck className="w-3 h-3" />
                                <span>Otgruzka &rarr;</span>
                              </button>
                            )}

                            {/* Edit */}
                            {!isShipped && (
                              <button
                                onClick={() => handleOpenEditOrder(order)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
                                title="Tahrirlash"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => {
                                if (confirm(`"${order.orderNumber}" hisob-kitob smetasini o'chirmoqchimisiz?`)) {
                                  onDeleteOrder(order.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-500 hover:bg-rose-100 transition"
                              title="O'chirish"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: SHIPMENTS / OTGRUZKA LIST */}
      {/* ======================================================== */}
      {activeSubTab === 'shipments' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">№ Otgruzka & Vaqti</th>
                  <th className="py-3 px-4">Asos (Zakaz)</th>
                  <th className="py-3 px-4">Mijoz / Kontragent</th>
                  <th className="py-3 px-4">Obyekt / Manzil</th>
                  <th className="py-3 px-4">Yuklanadigan tovarlar</th>
                  <th className="py-3 px-4 text-right">Summa</th>
                  <th className="py-3 px-4 text-center">Holat</th>
                  <th className="py-3 px-4 text-center">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredShipments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Hozircha otgruzkalar mavjud emas. Hisob-kitob bo&apos;limidan mijoz rozi bo&apos;lgan buyurtmalarni &ldquo;Otgruzkaga o&apos;tkazish&rdquo; tugmasi orqali bu yerga yuborishingiz mumkin.
                    </td>
                  </tr>
                ) : (
                  filteredShipments.map((shipment) => {
                    const isShipped = shipment.status === 'shipped';

                    return (
                      <tr key={shipment.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-900 dark:text-white block">
                            {shipment.shipmentNumber}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {shipment.createdAt}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {shipment.orderNumber ? (
                            <span className="font-mono text-sky-600 font-bold">
                              {shipment.orderNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400">To&apos;g&apos;ridan-to&apos;g&apos;ri</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {shipment.customerName}
                          </span>
                          {shipment.customerPhone && (
                            <span className="text-[10px] text-slate-400">
                              {shipment.customerPhone}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-slate-700 dark:text-slate-300 block">
                            {shipment.projectName || '—'}
                          </span>
                          {shipment.deliveryAddress && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 line-clamp-1">
                              <MapPin className="w-2.5 h-2.5 text-sky-500 shrink-0" />
                              {shipment.deliveryAddress}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-800 dark:text-slate-200 block">
                            {shipment.items.length} xil mahsulot
                          </span>
                          <span className="text-[10px] text-slate-400 line-clamp-1">
                            {shipment.items.map((it) => it.productName).join(', ')}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white block">
                            {formatDualMoney(
                              shipment.currency === 'USD' ? Math.round(shipment.totalAmount * (shipment.exchangeRate || exchangeRate)) : shipment.totalAmount,
                              baseCurrency,
                              exchangeRate
                            ).primary}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {formatDualMoney(
                              shipment.currency === 'USD' ? Math.round(shipment.totalAmount * (shipment.exchangeRate || exchangeRate)) : shipment.totalAmount,
                              baseCurrency,
                              exchangeRate
                            ).secondary}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isShipped ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                              ✓ Sotildi & Yuklandi
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 animate-pulse">
                              ⏳ S/N kiritish kutilmoqda
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleOpenProcessShipment(shipment)}
                            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-1.5 shadow ${
                              isShipped
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                            }`}
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>{isShipped ? "Ko'rish" : "S/N Kiritish & Sotish"}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: OBYEKT TOPSHIRISH & FOTO-AKTLAR GALLERY */}
      {/* ======================================================== */}
      {activeSubTab === 'handovers' && (
        <div className="space-y-5">
          {/* Subtab Header Banner */}
          <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900/80 to-slate-900 p-5 sm:p-6 rounded-3xl border border-purple-500/30 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
                <Camera className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    Obyektni Topshirish & Qabul Qilish Dalolatnomalari
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                    Foto-Hisobot & E-Imzo
                  </span>
                </div>
                <p className="text-xs text-purple-200/80 mt-1 max-w-2xl">
                  Ustalarning montaj va sozlash ishlarini tugatgandan so&apos;ng yuklagan fotosuratlari, GPS koordinatasi, mijoz fikri va sensor ekrandagi raqamli imzosi.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedHandoverOrder(orders[0] || null);
                setSelectedViewingHandover(null);
                setIsHandoverModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Yangi Obyekt Akti Rasmiylashtirish</span>
            </button>
          </div>

          {/* Handovers List / Cards Grid */}
          {handovers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3 shadow-sm">
              <Camera className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Hozircha obyekt topshirish aktlari mavjud emas
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Hisob-kitob smetalar bo&apos;limidan istalgan buyurtma yonidagi &quot;📸 Akt&quot; tugmasini bosib, fotosuratlar va mijoz imzosini kiritishingiz mumkin.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {handovers.map((handover) => (
                <div
                  key={handover.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                            #{handover.handoverNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {handover.createdAt}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1">
                          {handover.projectName || handover.customerName}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Topshirildi</span>
                        </span>
                      </div>
                    </div>

                    {/* Customer & Address & GPS */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Buyurtmachi:</span>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{handover.customerName}</div>
                        <div className="text-slate-500 text-[11px]">{handover.customerPhone}</div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Montajchi Usta:</span>
                        <div className="font-bold text-purple-700 dark:text-purple-300">
                          {handover.technicians.map((t) => t.fullName).join(', ') || handover.createdBy}
                        </div>
                        <div className="text-slate-400 text-[10px]">Kafolat: {handover.warrantyPeriodMonths || 12} oy</div>
                      </div>
                    </div>

                    {/* Address & GPS */}
                    {handover.installationAddress && (
                      <div className="flex items-start justify-between gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{handover.installationAddress}</span>
                        </div>

                        {handover.gpsLocation && (
                          <a
                            href={handover.gpsLocation.mapUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-bold text-purple-600 hover:underline flex items-center gap-1 shrink-0"
                          >
                            <span>Xaritada</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Photos Preview Strip */}
                    {handover.photos && handover.photos.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Camera className="w-3 h-3 text-purple-500" />
                            <span>Obyekt suratlari ({handover.photos.length} ta):</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {handover.photos.slice(0, 3).map((photo, idx) => (
                            <div
                              key={photo.id || idx}
                              className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 group"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={photo.url}
                                alt={photo.caption || 'Foto'}
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-1">
                                <span className="text-[9px] text-white font-medium truncate">
                                  {photo.caption || `Surat #${idx + 1}`}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Client Feedback & Rating */}
                    <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-1 text-amber-500">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= handover.clientRating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300 dark:text-slate-700'
                              }`}
                            />
                          ))}
                          <span className="font-bold text-slate-800 dark:text-slate-200 ml-1 text-[11px]">
                            {handover.clientRating}/5
                          </span>
                        </div>
                        {handover.clientFeedback && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 italic mt-0.5 line-clamp-1">
                            &quot;{handover.clientFeedback}&quot;
                          </p>
                        )}
                      </div>

                      {/* Client Signature Badge */}
                      {handover.clientSignature && (
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <Check className="w-3 h-3" />
                            <span>Mijoz imzolagan</span>
                          </div>
                          <span className="text-[9px] text-slate-400 block font-mono">
                            {handover.clientNameConfirmed || handover.customerName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedViewingHandover(handover);
                        setIsHandoverModalOpen(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-bold transition border border-purple-200 dark:border-purple-800/60"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Rasmiy Aktni Ko&apos;rish (PDF / Chop)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: ORDER / HISOB-KITOB FORM (MoySklad Style) */}
      {/* ======================================================== */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Top Bar matching Screenshot 1 */}
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-extrabold text-xs font-mono">
                  Заказ покупателя (Mijoz buyurtmasi / Smeta)
                </span>
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {editingOrder ? editingOrder.orderNumber : 'Yangi Zakaz'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveOrderSubmit('new')}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Сохранить (Saqlash)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Header Fields (Form) */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                {/* Organizatsiya */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    * Организация:
                  </label>
                  <input
                    type="text"
                    value={formOrganization}
                    onChange={(e) => setFormOrganization(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Kontragent (Customer) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      * Контрагент (Mijoz):
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddCustomerOpen(true)}
                      className="text-[10px] text-sky-600 hover:underline font-bold flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Yangi
                    </button>
                  </div>
                  <select
                    value={formCustomerId}
                    onChange={(e) => {
                      setFormCustomerId(e.target.value);
                      const c = customers.find((cust) => cust.id === e.target.value);
                      if (c) {
                        setFormDeliveryAddress(c.phone ? `Tel: ${c.phone}` : '');
                      }
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">-- Standart Xaridor --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.phone}) - {c.tier}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sklad */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    * Склад (Ombor):
                  </label>
                  <input
                    type="text"
                    value={formWarehouse}
                    onChange={(e) => setFormWarehouse(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Valyuta */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    * Валюта документа:
                  </label>
                  <select
                    value={formCurrency}
                    onChange={(e) => handleCurrencyChange(e.target.value as 'UZS' | 'USD')}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="UZS">So&apos;m (UZS)</option>
                    <option value="USD">Dollar ($ USD)</option>
                  </select>
                </div>

                {/* Adres dostavki / Loyiha manzili */}
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Адрес доставки / O&apos;rnatish manzili:
                  </label>
                  <input
                    type="text"
                    placeholder="Masalan: Namangan sh., Nodira ko'chasi 14-uy..."
                    value={formDeliveryAddress}
                    onChange={(e) => setFormDeliveryAddress(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Loyiha nomi */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Проект / Shartnoma:
                  </label>
                  <input
                    type="text"
                    placeholder="Masalan: 4 ta kamera montaj..."
                    value={formProjectName}
                    onChange={(e) => setFormProjectName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Izoh */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Комментарий (Izoh):
                  </label>
                  <input
                    type="text"
                    placeholder="Qo'shimcha kelishuvlar..."
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Product Picker Search Input */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Позиции — Добавить товар / услугу в смету:
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Smeta bosqichida seriya raqami talab qilinmaydi
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Mahsulot nomi, model, shtrix-kod orqali qidiring va tanlang..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Search Quick Dropdown */}
                {productSearch.trim().length > 0 && (
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
                    {filteredCatalogProducts.length === 0 ? (
                      <div className="p-3 text-xs text-slate-400 text-center">
                        Mos keluvchi tovar topilmadi
                      </div>
                    ) : (
                      filteredCatalogProducts.slice(0, 10).map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => {
                            handleAddProductToOrder(prod);
                            setProductSearch('');
                          }}
                          className="p-2.5 hover:bg-sky-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs transition gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 p-0.5">
                              {prod.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-contain" />
                              ) : (
                                <Package className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 dark:text-white block truncate">
                                {prod.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {prod.category} &bull; Qoldiq: {prod.stockQuantity} {prod.unit}
                                {prod.hasSerialNumber && ' (S/N bor)'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-sky-600 font-mono">
                              {formCurrency === 'USD'
                                ? `$${(prod.retailPriceUSD ? prod.retailPriceUSD : (prod.retailPrice / (exchangeRate || 12850))).toFixed(2)}`
                                : `${prod.retailPrice.toLocaleString()} so'm`}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {formCurrency === 'USD'
                                ? `(${prod.retailPrice.toLocaleString()} so'm)`
                                : prod.retailPriceUSD
                                ? `($${prod.retailPriceUSD})`
                                : `($${(prod.retailPrice / (exchangeRate || 12850)).toFixed(2)})`}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Items Table matching Screenshot 1 */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] uppercase border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Наименование (Nomi)</th>
                      <th className="py-2.5 px-3 text-center w-28">Количество</th>
                      <th className="py-2.5 px-3 text-right w-36">
                        Цена ({formCurrency === 'USD' ? '$ USD' : "so'm"})
                      </th>
                      <th className="py-2.5 px-3 text-center w-20">Скидка %</th>
                      <th className="py-2.5 px-3 text-right w-36">
                        Сумма ({formCurrency === 'USD' ? '$ USD' : "so'm"})
                      </th>
                      <th className="py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {formItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                          Hozircha hisob-kitobga tovarlar qo&apos;shilmagan. Yuqoridagi qidiruv orqali tovar yoki xizmat qo&apos;shing.
                        </td>
                      </tr>
                    ) : (
                      formItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">
                              {item.productName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Birlik: {item.unit} {item.hasSerialNumber ? '• Seriya raqami bor' : ''}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleUpdateOrderItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-20 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1 text-center font-bold font-mono text-xs text-slate-900 dark:text-white"
                            />
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <div className="relative inline-flex items-center justify-end">
                              {formCurrency === 'USD' && (
                                <span className="text-xs font-bold text-slate-400 mr-1">$</span>
                              )}
                              <input
                                type="number"
                                step={formCurrency === 'USD' ? "0.01" : "500"}
                                value={item.unitPrice}
                                onChange={(e) => handleUpdateOrderItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1 text-right font-bold font-mono text-xs text-slate-900 dark:text-white"
                              />
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={item.discountPercent || ''}
                              placeholder="0"
                              onChange={(e) => handleUpdateOrderItem(idx, 'discountPercent', parseFloat(e.target.value) || 0)}
                              className="w-14 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1 text-center font-bold font-mono text-xs text-emerald-600"
                            />
                          </td>

                          <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900 dark:text-white">
                            {formCurrency === 'USD'
                              ? `$${formatUSDNumber(item.totalPrice)}`
                              : `${formatNumberWithSpaces(item.totalPrice)} so'm`}
                          </td>

                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveOrderItem(idx)}
                              className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Box matching Screenshot 1 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500">
                  Позиций: <strong>{formItems.length}</strong> &bull; Общее количество: <strong>{formItems.reduce((s, it) => s + it.quantity, 0)}</strong>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-xs text-slate-500">
                    Промежуточный итог: {formCurrency === 'USD'
                      ? `$${formatUSDNumber(formItems.reduce((s, it) => s + it.quantity * it.unitPrice, 0))}`
                      : `${formatNumberWithSpaces(formItems.reduce((s, it) => s + it.quantity * it.unitPrice, 0))} so'm`}
                  </div>
                  <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
                    Общая стоимость: {formCurrency === 'USD'
                      ? `$${formatUSDNumber(formItems.reduce((s, it) => s + it.totalPrice, 0))}`
                      : `${formatNumberWithSpaces(formItems.reduce((s, it) => s + it.totalPrice, 0))} so'm`}
                  </div>
                  {exchangeRate > 0 && (
                    <div className="text-xs font-bold text-sky-600 font-mono">
                      {formCurrency === 'USD' ? (
                        <span>~ {formatNumberWithSpaces(formItems.reduce((s, it) => s + it.totalPrice, 0) * exchangeRate)} so&apos;m</span>
                      ) : (
                        <span>~ ${formatUSDNumber(formItems.reduce((s, it) => s + it.totalPrice, 0) / exchangeRate)} USD</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions matching Screenshot 1 */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
              >
                Закрыть (Yopish)
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleSaveOrderSubmit('new');
                    // Create temporary order to preview quotation
                    const tempOrder: CustomerOrder = {
                      id: editingOrder ? editingOrder.id : `order-${Date.now()}`,
                      orderNumber: editingOrder ? editingOrder.orderNumber : `ZK-${1000 + orders.length + 1}`,
                      createdAt: getNowFormatted(),
                      organization: formOrganization,
                      customerId: formCustomerId,
                      customerName: customers.find((c) => c.id === formCustomerId)?.fullName || 'Standart Xaridor',
                      customerPhone: customers.find((c) => c.id === formCustomerId)?.phone,
                      warehouseName: formWarehouse,
                      deliveryAddress: formDeliveryAddress,
                      projectName: formProjectName,
                      comment: formComment,
                      currency: formCurrency,
                      exchangeRate,
                      items: formItems,
                      subtotal: formItems.reduce((s, it) => s + it.quantity * it.unitPrice, 0),
                      discountTotal: 0,
                      totalAmount: formItems.reduce((s, it) => s + it.totalPrice, 0),
                      status: 'new'
                    };
                    setQuotationOrder(tempOrder);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Печать (Smeta chop etish)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const subtotal = formItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
                    const totalAmount = formItems.reduce((sum, it) => sum + it.totalPrice, 0);
                    const tempOrder: CustomerOrder = {
                      id: editingOrder ? editingOrder.id : `order-${Date.now()}`,
                      orderNumber: editingOrder ? editingOrder.orderNumber : `ZK-${1000 + orders.length + 1}`,
                      createdAt: getNowFormatted(),
                      organization: formOrganization,
                      customerId: formCustomerId,
                      customerName: customers.find((c) => c.id === formCustomerId)?.fullName || 'Standart Xaridor',
                      customerPhone: customers.find((c) => c.id === formCustomerId)?.phone,
                      warehouseName: formWarehouse,
                      deliveryAddress: formDeliveryAddress,
                      projectName: formProjectName,
                      comment: formComment,
                      currency: formCurrency,
                      exchangeRate,
                      items: formItems,
                      subtotal,
                      discountTotal: subtotal - totalAmount,
                      totalAmount,
                      status: 'approved'
                    };
                    onSaveOrder(tempOrder);
                    setIsOrderModalOpen(false);
                    handleConvertOrderToShipment(tempOrder);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-600/30 transition flex items-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  <span>Mijoz rozi — Otgruzkaga o&apos;tkazish &rarr;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: SHIPMENT PROCESSING (OTGRUZKA & MAHSULOT QO'SHISH & SERIYA RAQAMLARI) */}
      {/* ======================================================== */}
      {isShipmentModalOpen && activeShipment && (() => {
        const isUSD = activeShipment.currency === 'USD';
        const rate = exchangeRate > 0 ? exchangeRate : 12850;
        const currentSubtotal = shipmentItemsWithSerials.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
        const currentTotal = shipmentItemsWithSerials.reduce((s, it) => s + it.totalPrice, 0);
        const currentDiscount = currentSubtotal - currentTotal;
        const totalItemsCount = shipmentItemsWithSerials.reduce((s, it) => s + it.quantity, 0);

        const filteredShipmentProducts = products.filter((p) => {
          if (!shipmentProductSearch.trim()) return false;
          const q = shipmentProductSearch.toLowerCase().trim();
          return (
            p.name.toLowerCase().includes(q) ||
            p.barcode.includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            (p.serialNumbers && p.serialNumbers.some((sn) => sn.toLowerCase().includes(q)))
          );
        });

        const handleBarcodeOrProductSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          const q = shipmentProductSearch.trim();
          if (!q) return;

          // 1. Check exact barcode or SKU match
          const matched = products.find(
            (p) => p.barcode === q || p.sku.toLowerCase() === q.toLowerCase() || p.name.toLowerCase() === q.toLowerCase()
          );
          if (matched) {
            handleAddProductToShipment(matched);
            setShipmentProductSearch('');
            return;
          }

          // 2. If single item in filtered list
          if (filteredShipmentProducts.length === 1) {
            handleAddProductToShipment(filteredShipmentProducts[0]);
            setShipmentProductSearch('');
            return;
          }
        };

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-50/60 dark:bg-emerald-950/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      Отгрузка № {activeShipment.shipmentNumber}
                      {activeShipment.orderNumber && (
                        <span className="text-[11px] font-normal text-slate-500">
                          (Asos: {activeShipment.orderNumber})
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Tashkilot: {activeShipment.organization} &bull; Mijoz: {activeShipment.customerName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveShipmentDraft}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Qoralama Saqlash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsShipmentModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 overflow-y-auto space-y-4">
                {/* Top Info / Customer & Warehouse Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  {/* Mijoz / Kontragent */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        * Kontragent (Mijoz):
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsAddCustomerOpen(true)}
                        className="text-[10px] text-emerald-600 hover:underline font-bold flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Yangi
                      </button>
                    </div>
                    <select
                      value={activeShipment.customerId || ''}
                      onChange={(e) => {
                        const custId = e.target.value;
                        const c = customers.find((cust) => cust.id === custId);
                        setActiveShipment((prev) => prev ? ({
                          ...prev,
                          customerId: custId || undefined,
                          customerName: c ? c.fullName : 'Standart Xaridor',
                          customerPhone: c ? c.phone : undefined,
                          deliveryAddress: c?.phone ? `Tel: ${c.phone}` : prev.deliveryAddress
                        }) : null);
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Standart Xaridor --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} ({c.phone}) - {c.tier}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ombor */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      * Ombor (Склад):
                    </label>
                    <input
                      type="text"
                      value={activeShipment.warehouseName || 'Asosiy ombor'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setActiveShipment((prev) => prev ? { ...prev, warehouseName: val } : null);
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Yetkazish manzili */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Yetkazish manzili / Obyekt:
                    </label>
                    <input
                      type="text"
                      placeholder="Manzil, bino yoki tel..."
                      value={activeShipment.deliveryAddress || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setActiveShipment((prev) => prev ? { ...prev, deliveryAddress: val } : null);
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Valyuta */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Hujjat Valyutasi:
                    </label>
                    <div className="flex rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (activeShipment.currency === 'UZS') return;
                          setActiveShipment((prev) => prev ? { ...prev, currency: 'UZS' } : null);
                          setShipmentItemsWithSerials((prev) =>
                            prev.map((it) => {
                              const newPrice = Math.round(it.unitPrice * rate);
                              const disc = (it.discountPercent || 0) / 100;
                              return {
                                ...it,
                                unitPrice: newPrice,
                                totalPrice: Math.round(it.quantity * newPrice * (1 - disc))
                              };
                            })
                          );
                        }}
                        className={`flex-1 py-1 text-xs font-extrabold rounded-md transition ${
                          activeShipment.currency === 'UZS'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        SO&apos;M (UZS)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (activeShipment.currency === 'USD') return;
                          setActiveShipment((prev) => prev ? { ...prev, currency: 'USD' } : null);
                          setShipmentItemsWithSerials((prev) =>
                            prev.map((it) => {
                              const newPrice = it.unitPriceUSD && it.unitPriceUSD > 0
                                ? it.unitPriceUSD
                                : Number((it.unitPrice / rate).toFixed(2));
                              const disc = (it.discountPercent || 0) / 100;
                              return {
                                ...it,
                                unitPrice: newPrice,
                                totalPrice: Number((it.quantity * newPrice * (1 - disc)).toFixed(2))
                              };
                            })
                          );
                        }}
                        className={`flex-1 py-1 text-xs font-extrabold rounded-md transition ${
                          activeShipment.currency === 'USD'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        USD ($)
                      </button>
                    </div>
                  </div>
                </div>

                {/* PRODUCT SEARCH & ADD SECTION (MAHSULOT QO'SHISH) */}
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border-2 border-emerald-500/40 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                      <Package className="w-4 h-4 text-emerald-600" />
                      Otgruzkaga tovar yoki xizmat qo&apos;shish:
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Shtrixkod skanerlang yoki tovar nomini yozing
                    </span>
                  </div>

                  <form onSubmit={handleBarcodeOrProductSubmit} className="relative">
                    <div className="relative flex items-center">
                      <Barcode className="w-4 h-4 text-emerald-600 absolute left-3 pointer-events-none" />
                      <input
                        type="text"
                        value={shipmentProductSearch}
                        onChange={(e) => setShipmentProductSearch(e.target.value)}
                        placeholder="Mahsulot nomi, shtrixkod yoki modelini qidirish..."
                        className="w-full pl-9 pr-24 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 focus:border-emerald-500 rounded-lg text-xs font-semibold text-slate-900 dark:text-white outline-none shadow-sm"
                      />
                      {shipmentProductSearch && (
                        <button
                          type="button"
                          onClick={() => setShipmentProductSearch('')}
                          className="absolute right-20 text-slate-400 hover:text-slate-600 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={!shipmentProductSearch.trim()}
                        className="absolute right-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-md text-xs font-bold transition shadow"
                      >
                        + Qo&apos;shish
                      </button>
                    </div>

                    {/* Autocomplete dropdown */}
                    {shipmentProductSearch.trim() && filteredShipmentProducts.length > 0 && (
                      <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-100">
                        {filteredShipmentProducts.map((p) => {
                          const itemPrice = isUSD
                            ? (p.retailPriceUSD || Number((p.retailPrice / rate).toFixed(2)))
                            : p.retailPrice;
                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                handleAddProductToShipment(p);
                                setShipmentProductSearch('');
                              }}
                              className="p-2.5 hover:bg-emerald-50/80 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between text-xs transition"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                                  <Package className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800 dark:text-slate-100">{p.name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {p.barcode} &bull; Qoldiq: <strong>{p.stockQuantity} {p.unit}</strong>
                                    {p.hasSerialNumber && ' • S/N mavjud'}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                  {isUSD ? `$${formatUSDNumber(itemPrice)}` : `${formatNumberWithSpaces(itemPrice)} so'm`}
                                </div>
                                <span className="text-[10px] text-sky-600 font-bold">+ Tanlash</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </form>
                </div>

                {/* Items with Serial Number Pickers */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    <span>Otgruzkadagi Mahsulotlar & S/N ({shipmentItemsWithSerials.length} ta pozitsiya)</span>
                    <span>Miqdor / Summa</span>
                  </div>

                  {shipmentItemsWithSerials.length === 0 ? (
                    <div className="p-8 text-center space-y-2 bg-white dark:bg-slate-900">
                      <Package className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        Otgruzkada hali mahsulotlar yo&apos;q
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        Yuqoridagi qidiruv maydonidan mahsulot tanlang yoki shtrixkod skaneri orqali qo&apos;shing.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {shipmentItemsWithSerials.map((item, idx) => {
                        const catalogProd = products.find((p) => p.id === item.productId);
                        const availableWarehouseSerials = catalogProd?.serialNumbers || [];
                        const selectedSerials = item.selectedSerialNumbers || [];
                        const isFullySelected = selectedSerials.length === item.quantity;

                        return (
                          <div key={idx} className="p-4 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              {/* Product Info */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                                    {item.productName}
                                  </span>
                                  {item.hasSerialNumber && (
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      isFullySelected 
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300' 
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                                    }`}>
                                      {isFullySelected ? `✓ ${item.quantity}/${item.quantity} S/N kiritildi` : `⚠ ${selectedSerials.length}/${item.quantity} S/N tanlandi`}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  Birlik: {item.unit} &bull; Ombordagi qoldiq: {catalogProd?.stockQuantity ?? 0} {item.unit}
                                </span>
                              </div>

                              {/* Editable Quantity, Price, Total & Delete */}
                              <div className="flex items-center gap-3">
                                {/* Quantity editor */}
                                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateShipmentItem(idx, 'quantity', item.quantity - 1)}
                                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <input
                                    type="number"
                                    min={1}
                                    value={item.quantity}
                                    onChange={(e) => handleUpdateShipmentItem(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-10 bg-transparent text-center font-mono font-bold text-xs text-slate-900 dark:text-white outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateShipmentItem(idx, 'quantity', item.quantity + 1)}
                                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                {/* Unit Price editor */}
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-slate-400">{isUSD ? '$' : 'so\'m'}</span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={item.unitPrice}
                                    onChange={(e) => handleUpdateShipmentItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    className="w-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 text-xs font-mono font-bold text-slate-900 dark:text-white text-right outline-none"
                                  />
                                </div>

                                {/* Total Price */}
                                <div className="w-28 text-right font-mono font-extrabold text-xs text-emerald-700 dark:text-emerald-300">
                                  {isUSD
                                    ? `$${formatUSDNumber(item.totalPrice)}`
                                    : `${formatNumberWithSpaces(item.totalPrice)} so'm`}
                                </div>

                                {/* Delete item */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveShipmentItem(idx)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                                  title="O'chirish"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Serial Numbers selector if serialized */}
                            {item.hasSerialNumber && (
                              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/80 space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <Barcode className="w-3.5 h-3.5 text-sky-600" />
                                    Ombordagi mavjud S/N lardan tanlang yoki skaner qiling:
                                  </span>

                                  {/* Manual Input for scanning S/N */}
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      placeholder="Skaner / Yangi S/N..."
                                      value={manualSerialInput[idx] || ''}
                                      onChange={(e) => setManualSerialInput((prev) => ({ ...prev, [idx]: e.target.value }))}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleAddManualSerial(idx);
                                        }
                                      }}
                                      className="w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono outline-none focus:ring-1 focus:ring-sky-500"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleAddManualSerial(idx)}
                                      className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-sm"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>

                                {/* Available Serials Chips */}
                                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                                  {availableWarehouseSerials.length === 0 ? (
                                    <span className="text-xs text-rose-500 italic">
                                      Omborda ushbu tovar uchun seriya raqami mavjud emas! Iltimos, avval tovar kirimini (prixod) amalga oshiring.
                                    </span>
                                  ) : (
                                    availableWarehouseSerials.map((sn) => {
                                      const isChecked = selectedSerials.includes(sn);
                                      return (
                                        <button
                                          type="button"
                                          key={sn}
                                          onClick={() => handleToggleShipmentSerial(idx, sn)}
                                          className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition flex items-center gap-1 ${
                                            isChecked
                                              ? 'bg-emerald-600 text-white border-emerald-700 font-bold shadow-sm'
                                              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-emerald-500'
                                          }`}
                                        >
                                          <Hash className="w-3 h-3 opacity-60" />
                                          <span>{sn}</span>
                                          {isChecked && <Check className="w-3.5 h-3.5 ml-0.5" />}
                                        </button>
                                      );
                                    })
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

                {/* Technicians (Ustalar) Allocation for installation */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <HardHat className="w-4 h-4 text-amber-500" />
                      Obyektga biriktirilgan montajchi ustalar ({assignedTechnicians.length} ta):
                    </span>

                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddTechToShipment(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="">+ Usta biriktirish</option>
                      {employees
                        .filter((e) => !assignedTechnicians.some((t) => t.id === e.id))
                        .map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.fullName} ({e.role})
                          </option>
                        ))}
                    </select>
                  </div>

                  {assignedTechnicians.length > 0 && (
                    <div className="space-y-2">
                      {assignedTechnicians.map((t) => (
                        <div
                          key={t.id}
                          className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-100 block">{t.fullName}</span>
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
                                className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1 text-xs font-mono font-bold text-right"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                placeholder="So'm"
                                value={t.wageUZS || ''}
                                onChange={(e) => handleUpdateTechWage(t.id, 'wageUZS', parseInt(e.target.value) || 0)}
                                className="w-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1 text-xs font-mono font-bold text-right"
                              />
                              <span className="text-[10px] text-slate-400">so&apos;m</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveTechFromShipment(t.id)}
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment Method Selector */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    To&apos;lov qanday qabul qilinadi?
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setShipmentPaymentMethod('cash')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                        shipmentPaymentMethod === 'cash'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Banknote className="w-4 h-4" /> Naqd pul
                    </button>

                    <button
                      type="button"
                      onClick={() => setShipmentPaymentMethod('card')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                        shipmentPaymentMethod === 'card'
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" /> Karta / O&apos;tkazma
                    </button>

                    <button
                      type="button"
                      onClick={() => setShipmentPaymentMethod('debt')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                        shipmentPaymentMethod === 'debt'
                          ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Coins className="w-4 h-4" /> Nasiya (Qarz)
                    </button>

                    <button
                      type="button"
                      onClick={() => setShipmentPaymentMethod('usd')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                        shipmentPaymentMethod === 'usd'
                          ? 'bg-cyan-600 text-white border-cyan-700 shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <DollarSign className="w-4 h-4" /> Dollar ($ USD)
                    </button>
                  </div>
                </div>

                {/* Total Box */}
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold block">
                      Otgruzka & Sotuvning umumiy summasi:
                    </span>
                    <span className="text-xs text-slate-500">
                      Pozitsiyalar: <strong>{shipmentItemsWithSerials.length}</strong> &bull; Jami tovar: <strong>{totalItemsCount} dona</strong> &bull; Mijoz: <strong>{activeShipment.customerName}</strong>
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                      {isUSD
                        ? `$${formatUSDNumber(currentTotal)}`
                        : `${formatNumberWithSpaces(currentTotal)} so'm`}
                    </div>
                    {rate > 0 && (
                      <div className="text-xs font-bold text-slate-500 font-mono">
                        {isUSD
                          ? `~ ${formatNumberWithSpaces(currentTotal * rate)} so'm`
                          : `~ $${formatUSDNumber(currentTotal / rate)} USD`}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsShipmentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
                >
                  Bekor qilish
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveShipmentDraft}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 transition flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Qoralama Saqlash</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmShipmentAndSell}
                    disabled={activeShipment.status === 'shipped' || shipmentItemsWithSerials.length === 0}
                    className="px-6 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>
                      Otgruzka Qilish va Sotuvni Yakunlash ({isUSD
                        ? `$${formatUSDNumber(currentTotal)}`
                        : `${formatNumberWithSpaces(currentTotal)} so'm`})
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 3: Printable Smeta Quotation Modal */}
      <OrderQuotationModal
        order={quotationOrder}
        onClose={() => setQuotationOrder(null)}
        onConvertToShipment={(ord) => handleConvertOrderToShipment(ord)}
      />

      {/* MODAL 3.5: Handover Report (Obyekt Topshirish & Foto-Akt) Modal */}
      <HandoverModal
        isOpen={isHandoverModalOpen}
        onClose={() => {
          setIsHandoverModalOpen(false);
          setSelectedHandoverOrder(null);
          setSelectedViewingHandover(null);
        }}
        order={selectedHandoverOrder}
        existingHandover={selectedViewingHandover}
        employees={employees}
        currentUser={currentUser}
        onSaveHandover={(handover) => {
          if (onSaveHandover) {
            onSaveHandover(handover);
          }
          setSelectedViewingHandover(handover);
        }}
      />

      {/* MODAL 4: Quick Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-sky-500" />
                Yangi Mijoz Qo&apos;shish
              </h3>
              <button onClick={() => setIsAddCustomerOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  F.I.Sh. yoki Kompaniya:
                </label>
                <input
                  type="text"
                  placeholder="Ali Valiyev..."
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Telefon raqami:
                </label>
                <input
                  type="text"
                  placeholder="+998 90 123 45 67"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={handleCreateCustomer}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white"
                >
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
