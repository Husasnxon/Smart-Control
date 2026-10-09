'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Expense, 
  ExpenseCategory, 
  Currency, 
  Employee, 
  PayrollRecord, 
  EmployeeAdvance, 
  SaleReceipt, 
  ShipmentOrder, 
  CustomerOrder, 
  Customer,
  PurchaseInvoice,
  ActiveTab 
} from '../types';
import { formatDualMoney, formatMoney, formatUSDNumber, formatNumberWithSpaces, getNowFormatted } from '../utils/formatters';
import { DEFAULT_SUPPLIERS } from '../data/mockData';
import { EmployeesScreen } from './EmployeesScreen';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Calendar, 
  ArrowDownRight, 
  ArrowUpRight,
  ArrowLeftRight,
  TrendingDown, 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  Banknote,
  FileText,
  Building,
  Users,
  Megaphone,
  Truck,
  Coffee,
  Settings2,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  HardHat,
  Package,
  FileSpreadsheet,
  Receipt,
  ExternalLink,
  Printer,
  ShieldCheck,
  Layers,
  Filter,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';

interface ExpensesScreenProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  onAddExpense: (expense: Expense) => void;
  onAddCategory: (category: ExpenseCategory) => void;
  onUpdateCategory: (categoryId: string, newName: string, newDesc?: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onDeleteExpense?: (expenseId: string) => void;
  todaySalesTotal: number;
  baseCurrency?: Currency;
  exchangeRate?: number;
  // Sub-model: Xodimlar va Ish haqi
  employees?: Employee[];
  payrolls?: PayrollRecord[];
  advances?: EmployeeAdvance[];
  receipts?: SaleReceipt[];
  shipments?: ShipmentOrder[];
  customerOrders?: CustomerOrder[];
  customers?: Customer[];
  purchases?: PurchaseInvoice[];
  onAddEmployee?: (emp: Employee) => void;
  onUpdateEmployee?: (emp: Employee) => void;
  onDeleteEmployee?: (empId: string) => void;
  onAddPayroll?: (record: PayrollRecord) => void;
  onAddAdvance?: (advance: EmployeeAdvance) => void;
  onNavigateToTab?: (tab: ActiveTab) => void;
  initialSubTab?: 'all' | 'incomes' | 'expenses' | 'employees';
}

export const ExpensesScreen: React.FC<ExpensesScreenProps> = ({
  expenses,
  categories,
  onAddExpense,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onDeleteExpense,
  todaySalesTotal,
  baseCurrency = 'UZS',
  exchangeRate = 12850,
  employees = [],
  payrolls = [],
  advances = [],
  receipts = [],
  shipments = [],
  customerOrders = [],
  customers = [],
  purchases = [],
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onAddPayroll,
  onAddAdvance,
  onNavigateToTab,
  initialSubTab = 'all'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'incomes' | 'expenses' | 'employees'>(
    initialSubTab === 'employees' ? 'employees' : 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('Barchasi');
  const [selectedPaymentSource, setSelectedPaymentSource] = useState<'all' | 'cash' | 'bank' | 'usd'>('all');
  const [onlyLinkedDocs, setOnlyLinkedDocs] = useState(false);
  
  // Modals state
  const [isAddIncomeModalOpen, setIsAddIncomeModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isCategoryManageModalOpen, setIsCategoryManageModalOpen] = useState(false);
  const [selectedVoucherExpense, setSelectedVoucherExpense] = useState<Expense | null>(null);

  // Keyboard Escape listener to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        setIsAddIncomeModalOpen(false);
        setIsAddExpenseModalOpen(false);
        setIsCategoryManageModalOpen(false);
        setSelectedVoucherExpense(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // New Income form state
  const [incomeAmount, setIncomeAmount] = useState<number>(0);
  const [incomeCurrency, setIncomeCurrency] = useState<Currency>('UZS');
  const [incomeCategory, setIncomeCategory] = useState<string>('Otgruzka / Sotuv to\'lovi');
  const [incomePaymentSource, setIncomePaymentSource] = useState<Expense['paymentSource']>('Kassa (Naqd)');
  const [incomePaidBy, setIncomePaidBy] = useState('');
  const [incomeNotes, setIncomeNotes] = useState('');
  const [incomeLinkType, setIncomeLinkType] = useState<'none' | 'shipment' | 'order' | 'debt'>('shipment');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // New Expense form state
  const [expenseLinkMode, setExpenseLinkMode] = useState<'supplier' | 'general'>('supplier');
  const [selectedSupplierName, setSelectedSupplierName] = useState<string>('');
  const [supplierSearchQuery, setSupplierSearchQuery] = useState<string>('');
  const [expenseSupplierLinkType, setExpenseSupplierLinkType] = useState<'purchase' | 'direct'>('purchase');
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>('');
  const [purchaseSearchQuery, setPurchaseSearchQuery] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseCurrency, setExpenseCurrency] = useState<Currency>('UZS');
  const [expenseCategory, setExpenseCategory] = useState<string>(
    categories.find(c => c.type !== 'income')?.name || 'Mayda xo\'jalik'
  );
  const [expensePaymentSource, setExpensePaymentSource] = useState<Expense['paymentSource']>('Kassa (Naqd)');
  const [expensePaidTo, setExpensePaidTo] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');

  // Category management form state
  const [categoryTab, setCategoryTab] = useState<'all' | 'income' | 'expense'>('all');
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState('#10B981');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('income');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatNameValue, setEditCatNameValue] = useState('');

  // Search & Filtering inside Add Income Modal
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [shipmentSearchQuery, setShipmentSearchQuery] = useState('');
  const [isCustomerSelectorOpen, setIsCustomerSelectorOpen] = useState(false);

  // Filtered customers for income modal
  const filteredCustomersForIncome = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers;
    const q = customerSearchQuery.toLowerCase();
    return customers.filter(c => 
      c.fullName.toLowerCase().includes(q) || 
      c.phone.toLowerCase().includes(q)
    );
  }, [customers, customerSearchQuery]);

  const selectedCustomerObj = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Customer shipments
  const customerShipments = useMemo(() => {
    let list = shipments;
    if (selectedCustomerId) {
      const cust = customers.find(c => c.id === selectedCustomerId);
      if (cust) {
        list = shipments.filter(s => 
          s.customerId === cust.id || 
          (s.customerName && cust.fullName && (
            s.customerName.toLowerCase().includes(cust.fullName.toLowerCase()) || 
            cust.fullName.toLowerCase().includes(s.customerName.toLowerCase())
          ))
        );
      }
    }

    if (shipmentSearchQuery.trim()) {
      const q = shipmentSearchQuery.toLowerCase();
      list = list.filter(s => 
        s.shipmentNumber.toLowerCase().includes(q) || 
        s.customerName?.toLowerCase().includes(q) ||
        s.comment?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [shipments, selectedCustomerId, customers, shipmentSearchQuery]);

  // Customer Orders (Smetalar)
  const customerOrdersList = useMemo(() => {
    let list = customerOrders;
    if (selectedCustomerId) {
      const cust = customers.find(c => c.id === selectedCustomerId);
      if (cust) {
        list = customerOrders.filter(o => 
          o.customerId === cust.id || 
          (o.customerName && cust.fullName && (
            o.customerName.toLowerCase().includes(cust.fullName.toLowerCase()) || 
            cust.fullName.toLowerCase().includes(o.customerName.toLowerCase())
          ))
        );
      }
    }
    return list;
  }, [customerOrders, selectedCustomerId, customers]);

  // List of all suppliers for expense modal
  const allSuppliersList = useMemo(() => {
    const list: string[] = [];
    DEFAULT_SUPPLIERS.forEach(s => {
      if (!list.includes(s)) list.push(s);
    });
    (purchases || []).forEach(p => {
      if (p.supplierName && !list.includes(p.supplierName)) {
        list.push(p.supplierName);
      }
    });
    return list;
  }, [purchases]);

  // Filtered suppliers for expense search
  const filteredSuppliersForExpense = useMemo(() => {
    if (!supplierSearchQuery.trim()) return allSuppliersList;
    const q = supplierSearchQuery.toLowerCase();
    return allSuppliersList.filter(s => s.toLowerCase().includes(q));
  }, [allSuppliersList, supplierSearchQuery]);

  // Selected supplier stats (total debt / haqqi, total purchases)
  const selectedSupplierStats = useMemo(() => {
    if (!selectedSupplierName) return { totalDebtUZS: 0, totalDebtUSD: 0, totalPurchasesUZS: 0, invoicesCount: 0 };
    const supplierInvs = (purchases || []).filter(p => 
      p.supplierName?.toLowerCase().includes(selectedSupplierName.toLowerCase()) ||
      selectedSupplierName.toLowerCase().includes(p.supplierName?.toLowerCase())
    );
    const totalPurchasesUZS = supplierInvs.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalDebtUZS = supplierInvs.reduce((sum, p) => {
      if (p.debtAmount !== undefined && p.debtAmount > 0) return sum + p.debtAmount;
      if (p.paymentStatus === 'debt') return sum + p.totalAmount;
      if (p.paymentStatus === 'partial') return sum + Math.max(0, p.totalAmount - (p.paidAmount || 0));
      return sum;
    }, 0);
    const totalDebtUSD = Number((totalDebtUZS / exchangeRate).toFixed(2));
    return {
      totalDebtUZS,
      totalDebtUSD,
      totalPurchasesUZS,
      invoicesCount: supplierInvs.length
    };
  }, [purchases, selectedSupplierName, exchangeRate]);

  // Selected supplier purchases list (Priyomkalar)
  const selectedSupplierPurchasesList = useMemo(() => {
    if (!selectedSupplierName) return [];
    let list = (purchases || []).filter(p => 
      p.supplierName?.toLowerCase().includes(selectedSupplierName.toLowerCase()) ||
      selectedSupplierName.toLowerCase().includes(p.supplierName?.toLowerCase())
    );
    if (purchaseSearchQuery.trim()) {
      const q = purchaseSearchQuery.toLowerCase();
      list = list.filter(p => 
        p.invoiceNumber.toLowerCase().includes(q) || 
        p.supplierInvoiceNumber?.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q) ||
        p.items.some(item => item.productName.toLowerCase().includes(q))
      );
    }
    return list;
  }, [purchases, selectedSupplierName, purchaseSearchQuery]);

  const handleSelectSupplier = (supName: string) => {
    setSelectedSupplierName(supName);
    setExpensePaidTo(supName);
    setSupplierSearchQuery('');

    // Check if this supplier has invoices
    const supInvs = (purchases || []).filter(p => 
      p.supplierName?.toLowerCase().includes(supName.toLowerCase()) ||
      supName.toLowerCase().includes(p.supplierName?.toLowerCase())
    );

    const debtInv = supInvs.find(p => (p.debtAmount && p.debtAmount > 0) || p.paymentStatus === 'debt' || p.paymentStatus === 'partial');

    if (debtInv) {
      setExpenseSupplierLinkType('purchase');
      handleSelectPurchaseForExpense(debtInv.id, supName);
    } else if (supInvs.length > 0) {
      setExpenseSupplierLinkType('purchase');
      handleSelectPurchaseForExpense(supInvs[0].id, supName);
    } else {
      setExpenseSupplierLinkType('direct');
      setSelectedPurchaseId('');
      setExpenseCategory('Ta\'minotchiga to\'lov');
      setExpenseNotes(`${supName} ta'minotchisiga to'lov`);
    }
  };

  const handleClearSupplier = () => {
    setSelectedSupplierName('');
    setExpensePaidTo('');
    setSelectedPurchaseId('');
    setExpenseAmount(0);
    setExpenseNotes('');
    setExpenseSupplierLinkType('direct');
  };

  const handleSelectPurchaseForExpense = (purchId: string, currentSupName?: string) => {
    setSelectedPurchaseId(purchId);
    const purch = (purchases || []).find(p => p.id === purchId);
    if (purch) {
      const sup = purch.supplierName || currentSupName || selectedSupplierName;
      setExpensePaidTo(sup);
      setExpenseCategory('Ta\'minotchiga to\'lov');
      setExpenseNotes(`${purch.invoiceNumber} priyomkasi bo'yicha to'lov (${sup})`);
      
      const unpaidUZS = purch.debtAmount !== undefined && purch.debtAmount > 0 
        ? purch.debtAmount 
        : (purch.paymentStatus === 'debt' ? purch.totalAmount : (purch.totalAmount - (purch.paidAmount || 0) > 0 ? purch.totalAmount - (purch.paidAmount || 0) : purch.totalAmount));
      
      if (purch.currency === 'USD' && purch.debtAmountUSD) {
        setExpenseAmount(purch.debtAmountUSD * exchangeRate);
        setExpenseCurrency('UZS');
      } else {
        setExpenseAmount(unpaidUZS || purch.totalAmount);
        setExpenseCurrency(purch.currency || 'UZS');
      }
    }
  };

  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomerId(cust.id);
    setIncomePaidBy(cust.fullName);
    setIsCustomerSelectorOpen(false);
    setCustomerSearchQuery('');
    
    // Check if customer has shipments
    const custShips = shipments.filter(s => 
      s.customerId === cust.id || 
      (s.customerName && cust.fullName && (
        s.customerName.toLowerCase().includes(cust.fullName.toLowerCase()) || 
        cust.fullName.toLowerCase().includes(s.customerName.toLowerCase())
      ))
    );

    if (custShips.length > 0) {
      setIncomeLinkType('shipment');
      handleSelectShipmentForIncome(custShips[0].id);
    } else {
      const custOrders = customerOrders.filter(o => 
        o.customerId === cust.id || 
        (o.customerName && cust.fullName && (
          o.customerName.toLowerCase().includes(cust.fullName.toLowerCase()) || 
          cust.fullName.toLowerCase().includes(o.customerName.toLowerCase())
        ))
      );
      if (custOrders.length > 0) {
        setIncomeLinkType('order');
        handleSelectOrderForIncome(custOrders[0].id);
      } else {
        setIncomeLinkType('none');
        setIncomeNotes(`${cust.fullName} to'lovi`);
        if (cust.debtBalance && cust.debtBalance > 0) {
          setIncomeAmount(cust.debtBalance);
          setIncomeCategory('Mijozdan Nasiya to\'lovi');
        }
      }
    }
  };

  const handleClearCustomer = () => {
    setSelectedCustomerId('');
    setIncomePaidBy('');
    setSelectedShipmentId('');
    setSelectedOrderId('');
    setIncomeAmount(0);
    setIncomeNotes('');
    setIncomeLinkType('none');
  };

  // Auto-match shipment selection
  const handleSelectShipmentForIncome = (shipmentId: string) => {
    setSelectedShipmentId(shipmentId);
    const ship = shipments.find(s => s.id === shipmentId);
    if (ship) {
      setIncomePaidBy(ship.customerName || '');
      setIncomeNotes(`${ship.shipmentNumber} otgruzkasi bo'yicha sotilgan mahsulotlar to'lovi`);
      setIncomeCategory('Otgruzka / Sotuv to\'lovi');
      if (ship.currency === 'USD' && ship.totalAmountUSD) {
        setIncomeAmount(ship.totalAmountUSD * exchangeRate);
        setIncomeCurrency('UZS');
      } else {
        setIncomeAmount(ship.totalAmount || 0);
        setIncomeCurrency(ship.currency || 'UZS');
      }
    }
  };

  // Auto-match order selection
  const handleSelectOrderForIncome = (orderId: string) => {
    setSelectedOrderId(orderId);
    const ord = customerOrders.find(o => o.id === orderId);
    if (ord) {
      setIncomePaidBy(ord.customerName || '');
      setIncomeNotes(`${ord.orderNumber} smetasi bo'yicha hisob-kitob to'lovi`);
      setIncomeCategory('Otgruzka / Sotuv to\'lovi');
      setIncomeAmount(ord.totalAmount || 0);
    }
  };

  // Auto-match customer debt selection
  const handleSelectCustomerForIncome = (custId: string) => {
    setSelectedCustomerId(custId);
    const cust = customers.find(c => c.id === custId);
    if (cust) {
      setIncomePaidBy(cust.fullName || '');
      setIncomeNotes(`Mijoz nasiyasi bo'yicha qarz to'lovi (${cust.fullName})`);
      setIncomeCategory('Mijozdan Nasiya to\'lovi');
      setIncomeAmount(cust.debtBalance || 0);
    }
  };

  // Calculations for Totals & KPIs
  const incomesList = useMemo(() => expenses.filter(e => e.type === 'income'), [expenses]);
  const expensesList = useMemo(() => expenses.filter(e => e.type !== 'income'), [expenses]);

  const totalIncomeUZS = useMemo(() => incomesList.reduce((sum, e) => sum + e.amount, 0), [incomesList]);
  const totalExpenseUZS = useMemo(() => expensesList.reduce((sum, e) => sum + e.amount, 0), [expensesList]);
  const netCashFlowUZS = totalIncomeUZS - totalExpenseUZS;

  // Cash and Bank Breakdowns
  const cashIncomeUZS = incomesList
    .filter(e => e.paymentSource === 'Kassa (Naqd)' || e.paymentSource === 'Valyuta (Naqd USD)')
    .reduce((sum, e) => sum + e.amount, 0);

  const cashExpenseUZS = expensesList
    .filter(e => e.paymentSource === 'Kassa (Naqd)' || e.paymentSource === 'Valyuta (Naqd USD)')
    .reduce((sum, e) => sum + e.amount, 0);

  const bankIncomeUZS = incomesList
    .filter(e => e.paymentSource === 'Hisob raqam / Karta')
    .reduce((sum, e) => sum + e.amount, 0);

  const bankExpenseUZS = expensesList
    .filter(e => e.paymentSource === 'Hisob raqam / Karta')
    .reduce((sum, e) => sum + e.amount, 0);

  const netCashDrawerBalance = cashIncomeUZS - cashExpenseUZS;
  const netBankBalance = bankIncomeUZS - bankExpenseUZS;

  // Filtering items
  const filteredTransactions = useMemo(() => {
    return expenses.filter(e => {
      // Sub-tab filter
      if (activeSubTab === 'incomes' && e.type !== 'income') return false;
      if (activeSubTab === 'expenses' && e.type === 'income') return false;

      // Category filter
      if (selectedFilterCategory !== 'Barchasi' && e.category !== selectedFilterCategory) return false;

      // Payment source filter
      if (selectedPaymentSource === 'cash' && e.paymentSource !== 'Kassa (Naqd)') return false;
      if (selectedPaymentSource === 'bank' && e.paymentSource !== 'Hisob raqam / Karta') return false;
      if (selectedPaymentSource === 'usd' && e.paymentSource !== 'Valyuta (Naqd USD)') return false;

      // Only linked docs filter
      if (onlyLinkedDocs && !e.linkedDocNumber) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNotes = e.notes?.toLowerCase().includes(q);
        const matchPaidTo = e.paidTo?.toLowerCase().includes(q);
        const matchPaidBy = e.paidBy?.toLowerCase().includes(q);
        const matchCategory = e.category?.toLowerCase().includes(q);
        const matchDoc = e.linkedDocNumber?.toLowerCase().includes(q);
        const matchCustomer = e.customerName?.toLowerCase().includes(q);
        if (!matchNotes && !matchPaidTo && !matchPaidBy && !matchCategory && !matchDoc && !matchCustomer) {
          return false;
        }
      }

      return true;
    });
  }, [expenses, activeSubTab, selectedFilterCategory, selectedPaymentSource, onlyLinkedDocs, searchQuery]);

  // Handle Creating Income (Prixod)
  const handleCreateIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomeAmount || incomeAmount <= 0) return;

    let linkedDocType: Expense['linkedDocType'] = undefined;
    let linkedDocId: string | undefined = undefined;
    let linkedDocNumber: string | undefined = undefined;
    let custName = incomePaidBy;
    let custId: string | undefined = undefined;

    if (incomeLinkType === 'shipment' && selectedShipmentId) {
      const ship = shipments.find(s => s.id === selectedShipmentId);
      if (ship) {
        linkedDocType = 'shipment';
        linkedDocId = ship.id;
        linkedDocNumber = ship.shipmentNumber;
        custName = ship.customerName || custName;
        custId = ship.customerId;
      }
    } else if (incomeLinkType === 'order' && selectedOrderId) {
      const ord = customerOrders.find(o => o.id === selectedOrderId);
      if (ord) {
        linkedDocType = 'order';
        linkedDocId = ord.id;
        linkedDocNumber = ord.orderNumber;
        custName = ord.customerName || custName;
        custId = ord.customerId;
      }
    } else if (incomeLinkType === 'debt' && selectedCustomerId) {
      const cust = customers.find(c => c.id === selectedCustomerId);
      if (cust) {
        linkedDocType = 'customer_debt';
        linkedDocId = cust.id;
        linkedDocNumber = `NASIYA-${cust.id.slice(-4).toUpperCase()}`;
        custName = cust.fullName;
        custId = cust.id;
      }
    }

    const calculatedAmount = incomeCurrency === 'USD' ? incomeAmount * exchangeRate : incomeAmount;
    const calculatedAmountUSD = incomeCurrency === 'USD' ? incomeAmount : Number((incomeAmount / exchangeRate).toFixed(2));

    const newIncome: Expense = {
      id: `inc-${Date.now()}`,
      type: 'income',
      category: incomeCategory,
      amount: calculatedAmount,
      amountUSD: calculatedAmountUSD,
      currency: incomeCurrency,
      paymentSource: incomePaymentSource,
      paidBy: custName || 'Noma\'lum mijoz / Manba',
      notes: incomeNotes || 'Pul kirimi',
      createdAt: getNowFormatted(),
      createdBy: 'Farrux A. (Kassir)',
      linkedDocType,
      linkedDocId,
      linkedDocNumber,
      customerName: custName,
      customerId: custId
    };

    onAddExpense(newIncome);
    setIsAddIncomeModalOpen(false);
    // Reset form
    setIncomeAmount(0);
    setIncomePaidBy('');
    setIncomeNotes('');
    setSelectedShipmentId('');
    setSelectedOrderId('');
    setSelectedCustomerId('');
  };

  // Handle Creating Expense (Chiqim)
  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || expenseAmount <= 0) return;

    let linkedDocType: Expense['linkedDocType'] = undefined;
    let linkedDocId: string | undefined = undefined;
    let linkedDocNumber: string | undefined = undefined;
    let targetPaidTo = expensePaidTo;

    if (expenseLinkMode === 'supplier') {
      if (expenseSupplierLinkType === 'purchase' && selectedPurchaseId) {
        const purch = (purchases || []).find(p => p.id === selectedPurchaseId);
        if (purch) {
          linkedDocType = 'other';
          linkedDocId = purch.id;
          linkedDocNumber = purch.invoiceNumber;
          targetPaidTo = purch.supplierName || targetPaidTo;
        }
      } else if (selectedSupplierName) {
        targetPaidTo = selectedSupplierName;
      }
    }

    const calculatedAmount = expenseCurrency === 'USD' ? expenseAmount * exchangeRate : expenseAmount;
    const calculatedAmountUSD = expenseCurrency === 'USD' ? expenseAmount : Number((expenseAmount / exchangeRate).toFixed(2));

    const newExp: Expense = {
      id: `exp-${Date.now()}`,
      type: 'expense',
      category: expenseCategory,
      amount: calculatedAmount,
      amountUSD: calculatedAmountUSD,
      currency: expenseCurrency,
      paymentSource: expensePaymentSource,
      paidTo: targetPaidTo || 'Noma\'lum',
      notes: expenseNotes || 'Izohsiz chiqim',
      createdAt: getNowFormatted(),
      createdBy: 'Farrux A. (Kassir)',
      linkedDocType,
      linkedDocId,
      linkedDocNumber
    };

    onAddExpense(newExp);
    setIsAddExpenseModalOpen(false);
    setExpenseAmount(0);
    setExpensePaidTo('');
    setExpenseNotes('');
    setSelectedSupplierName('');
    setSelectedPurchaseId('');
    setExpenseSupplierLinkType('purchase');
  };

  // Handle adding category
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCategory: ExpenseCategory = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      description: newCatDesc.trim() || (newCatType === 'income' ? 'Kirim toifasi' : 'Chiqim toifasi'),
      color: newCatColor,
      type: newCatType,
      isDefault: false
    };

    onAddCategory(newCategory);
    setNewCatName('');
    setNewCatDesc('');
  };

  // Save inline edit category
  const handleSaveEditCategory = (catId: string) => {
    if (!editCatNameValue.trim()) return;
    onUpdateCategory(catId, editCatNameValue.trim());
    setEditingCatId(null);
    setEditCatNameValue('');
  };

  // Print voucher
  const handlePrintVoucher = (expense: Expense) => {
    setSelectedVoucherExpense(expense);
  };

  const incomeCategories = useMemo(() => categories.filter(c => c.type === 'income' || c.type === 'both' || !c.type), [categories]);
  const expenseCategories = useMemo(() => categories.filter(c => c.type === 'expense' || c.type === 'both' || !c.type), [categories]);

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50 dark:bg-slate-950">
      {/* Primary Sub-Module Switcher */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('all')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition active:scale-95 ${
              activeSubTab === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Barcha Tranzaksiyalar</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-white font-mono font-bold">
              {expenses.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('incomes')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition active:scale-95 ${
              activeSubTab === 'incomes'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            <span>Pul Kirimi (Prixod)</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-200 font-mono font-bold">
              {incomesList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('expenses')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition active:scale-95 ${
              activeSubTab === 'expenses'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
            <span>Xarajatlar (Chiqim / OPEX)</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-200 font-mono font-bold">
              {expensesList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('employees')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition active:scale-95 ${
              activeSubTab === 'employees'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>Xodimlar & Ish Haqi (Payroll)</span>
            {employees && employees.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-900 dark:text-amber-200 font-mono font-bold">
                {employees.length}
              </span>
            )}
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono hidden md:block">
          Valyuta kursi: 1$ = {exchangeRate.toLocaleString()} so&apos;m
        </div>
      </div>

      {activeSubTab === 'employees' ? (
        <div className="-mx-6 -my-6">
          <EmployeesScreen
            employees={employees}
            payrolls={payrolls}
            advances={advances}
            receipts={receipts}
            expenses={expenses}
            onAddEmployee={onAddEmployee || (() => {})}
            onUpdateEmployee={onUpdateEmployee || (() => {})}
            onDeleteEmployee={onDeleteEmployee || (() => {})}
            onAddPayroll={onAddPayroll || (() => {})}
            onAddAdvance={onAddAdvance || (() => {})}
          />
        </div>
      ) : (
        <>
          {/* Top Header with Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-indigo-500" />
                Moliya & Pul Oqimi Boshqaruvi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sotuv va otgruzkalar bo&apos;yicha pul kirimi (prixod), xarajatlar (rasxod) va kassa balansi
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Manage Categories Button */}
              <button
                onClick={() => setIsCategoryManageModalOpen(true)}
                className="px-3.5 py-2 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition active:scale-[0.98]"
              >
                <Settings2 className="w-4 h-4 text-purple-500" />
                <span>Toifalar ({categories.length})</span>
              </button>

              {/* Add Expense (Rasxod) Button */}
              <button
                onClick={() => setIsAddExpenseModalOpen(true)}
                className="px-3.5 py-2 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>- Chiqim (Rasxod)</span>
              </button>

              {/* Add Income (Prixod) Button */}
              <button
                onClick={() => setIsAddIncomeModalOpen(true)}
                className="px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/25 flex items-center gap-1.5 transition active:scale-[0.98] animate-pulse hover:animate-none"
              >
                <Plus className="w-4 h-4" />
                <span>+ Yangi Kirim (Prixod)</span>
              </button>
            </div>
          </div>

          {/* KPI Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Income (Prixod) */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-500/20 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Jami Pul Kirimi (Prixod)
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  +{formatDualMoney(totalIncomeUZS, baseCurrency, exchangeRate).primary}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Otgruzkalar & To&apos;lovlar</span>
                  <span className="font-mono text-emerald-500 font-bold">({formatDualMoney(totalIncomeUZS, baseCurrency, exchangeRate).secondary})</span>
                </div>
              </div>
            </div>

            {/* 2. Total Expenses (Rasxod) */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-500/30 dark:border-rose-500/20 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <ArrowDownRight className="w-3.5 h-3.5" /> Jami Xarajatlar (Rasxod)
                </span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-xs">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                  -{formatDualMoney(totalExpenseUZS, baseCurrency, exchangeRate).primary}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Do&apos;kon, ijara, oyliklar</span>
                  <span className="font-mono text-rose-500 font-bold">({formatDualMoney(totalExpenseUZS, baseCurrency, exchangeRate).secondary})</span>
                </div>
              </div>
            </div>

            {/* 3. Cash Drawer Balance (Kassa Naqd Qoldig'i) */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5 text-amber-500" /> Kassa (Naqd) Balansi
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className={`text-2xl font-black font-mono ${netCashDrawerBalance >= 0 ? 'text-amber-500 dark:text-amber-400' : 'text-rose-500'}`}>
                  {netCashDrawerBalance < 0 ? '-' : ''}{formatDualMoney(Math.abs(netCashDrawerBalance), baseCurrency, exchangeRate).primary}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Kirim: {formatMoney(cashIncomeUZS, baseCurrency, exchangeRate)}</span>
                  <span>Chiqim: {formatMoney(cashExpenseUZS, baseCurrency, exchangeRate)}</span>
                </div>
              </div>
            </div>

            {/* 4. Net Cash Flow / Pul Oqimi Sof Balansi */}
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-950 text-white border border-indigo-500/30 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Sof Pul Oqimi (Kirim - Chiqim)
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-black">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className={`text-2xl font-black font-mono ${netCashFlowUZS >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {netCashFlowUZS < 0 ? '-' : '+'}{formatDualMoney(Math.abs(netCashFlowUZS), baseCurrency, exchangeRate).primary}
                </div>
                <div className="text-[11px] text-indigo-200/70 mt-1 flex items-center justify-between">
                  <span>Bank o&apos;tkazma: {formatMoney(netBankBalance, baseCurrency, exchangeRate)}</span>
                  <span className="font-mono text-white font-bold">({formatDualMoney(Math.abs(netCashFlowUZS), baseCurrency, exchangeRate).secondary})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter, Search & Source Toolbar */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Izoh, mijoz, otgruzka (#OTG-2001) yoki toifa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/40 text-slate-800 dark:text-slate-100 font-medium"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Source Selector */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  onClick={() => setSelectedPaymentSource('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${selectedPaymentSource === 'all' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
                >
                  Barchasi
                </button>
                <button
                  onClick={() => setSelectedPaymentSource('cash')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${selectedPaymentSource === 'cash' ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500'}`}
                >
                  <Banknote className="w-3 h-3" /> Naqd
                </button>
                <button
                  onClick={() => setSelectedPaymentSource('bank')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${selectedPaymentSource === 'bank' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500'}`}
                >
                  <CreditCard className="w-3 h-3" /> Bank
                </button>
              </div>

              {/* Linked to Docs Filter Toggle */}
              <button
                onClick={() => setOnlyLinkedDocs(!onlyLinkedDocs)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                  onlyLinkedDocs
                    ? 'bg-teal-500/15 border-teal-500 text-teal-700 dark:text-teal-300'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
                title="Faqat sotilgan mahsulot cheki (otgruzka)ga bog'langan tranzaksiyalarni ko'rish"
              >
                <Package className="w-3.5 h-3.5 text-teal-500" />
                <span>Otgruzkaga bog&apos;langanlar</span>
                {onlyLinkedDocs && <Check className="w-3 h-3 text-teal-500" />}
              </button>

              {/* Category Dropdown */}
              <select
                value={selectedFilterCategory}
                onChange={(e) => setSelectedFilterCategory(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold"
              >
                <option value="Barchasi">Barcha toifalar</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.type === 'income' ? '🟢 ' : c.type === 'expense' ? '🔴 ' : ''}{c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Tranzaksiya Turi</th>
                    <th className="py-3 px-4">Kategoriya & Toifa</th>
                    <th className="py-3 px-4">Bog&apos;langan Hujjat / Otgruzka</th>
                    <th className="py-3 px-4">Izoh va Maqsad</th>
                    <th className="py-3 px-4">Kimdan / Kimga</th>
                    <th className="py-3 px-4 text-center">To&apos;lov Manbai</th>
                    <th className="py-3 px-4 text-right">Summa</th>
                    <th className="py-3 px-4 text-right">Sana / Vaqt</th>
                    <th className="py-3 px-4 text-right">Mas&apos;ul</th>
                    <th className="py-3 px-4 text-center">Hujjat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400/60" />
                        <p className="font-semibold text-xs">Hech qanday moliya yozuvi topilmadi</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((trx) => {
                      const isIncome = trx.type === 'income';
                      const catObj = categories.find((c) => c.name === trx.category);
                      const dotColor = catObj?.color || (isIncome ? '#10B981' : '#EF4444');

                      return (
                        <tr key={trx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                          {/* 1. Type Badge */}
                          <td className="py-3 px-4">
                            {isIncome ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                                PRIXOD (KIRIM)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                <ArrowDownRight className="w-3 h-3 text-rose-500" />
                                RASXOD (CHIQIM)
                              </span>
                            )}
                          </td>

                          {/* 2. Category */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                              <span className="font-bold text-slate-900 dark:text-white">
                                {trx.category}
                              </span>
                            </div>
                          </td>

                          {/* 3. Linked Document / Otgruzka */}
                          <td className="py-3 px-4">
                            {trx.linkedDocNumber ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-mono font-bold text-[11px]">
                                <Package className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                                <span>{trx.linkedDocNumber}</span>
                                {trx.customerName && (
                                  <span className="text-[10px] text-teal-600/70 dark:text-teal-400/70 font-sans font-medium">
                                    ({trx.customerName})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono text-[11px]">-</span>
                            )}
                          </td>

                          {/* 4. Notes & Purpose */}
                          <td className="py-3 px-4 max-w-xs">
                            <span className="text-slate-700 dark:text-slate-200 font-medium block truncate" title={trx.notes}>
                              {trx.notes}
                            </span>
                          </td>

                          {/* 5. Paid To / Paid By */}
                          <td className="py-3 px-4">
                            <span className="text-slate-600 dark:text-slate-400 font-semibold">
                              {isIncome ? (trx.paidBy || trx.customerName || 'Mijoz') : (trx.paidTo || 'Xodim / Ta\'minotchi')}
                            </span>
                          </td>

                          {/* 6. Payment Source */}
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                trx.paymentSource === 'Kassa (Naqd)'
                                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                                  : trx.paymentSource === 'Valyuta (Naqd USD)'
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                              }`}
                            >
                              {trx.paymentSource === 'Kassa (Naqd)' || trx.paymentSource === 'Valyuta (Naqd USD)' ? (
                                <Banknote className="w-3 h-3" />
                              ) : (
                                <CreditCard className="w-3 h-3" />
                              )}
                              {trx.paymentSource}
                            </span>
                          </td>

                          {/* 7. Amount */}
                          <td className="py-3 px-4 text-right">
                            <div className={`font-mono font-black text-sm ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {isIncome ? '+' : '-'}{formatDualMoney(trx.amount, baseCurrency, exchangeRate).primary}
                            </div>
                            <div className="font-mono text-[10px] text-slate-400">
                              {formatDualMoney(trx.amount, baseCurrency, exchangeRate).secondary}
                            </div>
                          </td>

                          {/* 8. Date */}
                          <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {trx.createdAt}
                          </td>

                          {/* 9. Created By */}
                          <td className="py-3 px-4 text-right text-slate-500 font-medium whitespace-nowrap">
                            {trx.createdBy}
                          </td>

                          {/* 10. Actions / Voucher Print */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handlePrintVoucher(trx)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                                title="Kvitansiya / Order chop etish (PKO/RKO)"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              {onDeleteExpense && (
                                <button
                                  onClick={() => {
                                    if (window.confirm("Rostdan ham ushbu moliya yozuvini o'chirmoqchimisiz?")) {
                                      onDeleteExpense(trx.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                                  title="O'chirish"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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

          {/* ========================================================================= */}
          {/* MODAL 1: ADD INCOME (PRIXOD) MODAL WITH CUSTOMER FIRST & SHIPMENT SEARCH */}
          {/* ========================================================================= */}
          {isAddIncomeModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 font-bold shadow-sm">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        Yangi Pul Kirimi (Prixod / Tushum)
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Avval mijozni tanlang, so&apos;ngra shu mijozning otgruzkasiga to&apos;lovni bog&apos;lang
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsAddIncomeModalOpen(false);
                      handleClearCustomer();
                    }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateIncome} className="space-y-4">
                  {/* STEP 1: SELECT CUSTOMER (MIJOZNI TANLASH) */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-emerald-500" />
                        1. Mijozni Tanlang *
                      </label>
                      {selectedCustomerObj && (
                        <button
                          type="button"
                          onClick={handleClearCustomer}
                          className="text-[11px] font-bold text-rose-500 hover:underline flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Boshqa mijozni tanlash
                        </button>
                      )}
                    </div>

                    {selectedCustomerObj ? (
                      /* Selected Customer Banner with PROMINENT DEBT STATUS */
                      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2.5 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                              {selectedCustomerObj.fullName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                                  {selectedCustomerObj.fullName}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                  {selectedCustomerObj.tier || 'Mijoz'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
                                <span>📞 {selectedCustomerObj.phone}</span>
                                {selectedCustomerObj.address && (
                                  <span className="truncate hidden sm:inline">&bull; 📍 {selectedCustomerObj.address}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleClearCustomer}
                            className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition shrink-0"
                            title="Mijozni bekor qilish"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* PROMINENT CUSTOMER DEBT / BALANCE CARD */}
                        <div className={`p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs font-bold ${
                          selectedCustomerObj.debtBalance && selectedCustomerObj.debtBalance > 0
                            ? 'bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300'
                            : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          <div className="flex items-center gap-2">
                            {selectedCustomerObj.debtBalance && selectedCustomerObj.debtBalance > 0 ? (
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                            <span>
                              {selectedCustomerObj.debtBalance && selectedCustomerObj.debtBalance > 0
                                ? "Mijozning nasiya qarzi (Bizning haqimiz):"
                                : "Mijozning qarzdorligi yo'q (Hisob toza)"}
                            </span>
                          </div>
                          {selectedCustomerObj.debtBalance && selectedCustomerObj.debtBalance > 0 && (
                            <div className="text-right shrink-0">
                              <span className="font-mono font-black text-sm">
                                {formatMoney(selectedCustomerObj.debtBalance, baseCurrency, exchangeRate)}
                              </span>
                              <span className="text-[10px] text-rose-500 font-mono block">
                                (${formatUSDNumber(selectedCustomerObj.debtBalanceUSD || selectedCustomerObj.debtBalance / exchangeRate)})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Customer Search Input & List */
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Mijoz ismi yoki telefon raqami bo'yicha qidirish (masalan: Grand, Samirbek)..."
                            value={customerSearchQuery}
                            onChange={(e) => setCustomerSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                          />
                        </div>

                        {/* Filtered Customer Chips / List */}
                        <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                          {filteredCustomersForIncome.slice(0, 6).map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleSelectCustomer(c)}
                              className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 flex items-center justify-between text-left transition group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center font-bold text-[10px] text-slate-700 dark:text-slate-300 transition">
                                  {c.fullName.slice(0, 1)}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                                    {c.fullName}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block truncate">
                                    📞 {c.phone}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                {c.debtBalance && c.debtBalance > 0 ? (
                                  <span className="text-[10px] font-bold text-rose-500 block">
                                    Qarz: {formatNumberWithSpaces(c.debtBalance)} so&apos;m
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-emerald-500 font-semibold block">
                                    Tanlash &rarr;
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}

                          {filteredCustomersForIncome.length === 0 && (
                            <div className="p-3 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                              Mijoz topilmadi. Ismni quyida erkin kiritishingiz mumkin.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* STEP 2: SELECT LINKED SHIPMENT / ORDER / DEBT */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/80 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>2. Mijozning Otgruzkasi / Chekiga bog&apos;lash</span>
                      </label>
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold px-2 py-0.5 rounded-full shrink-0">
                        {customerShipments.length} ta otgruzka mavjud
                      </span>
                    </div>

                    {/* Mode Tabs */}
                    <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setIncomeLinkType('shipment')}
                        className={`py-1.5 px-2 rounded-xl font-bold border transition flex items-center justify-center gap-1.5 ${
                          incomeLinkType === 'shipment'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Otgruzka ({customerShipments.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIncomeLinkType('order')}
                        className={`py-1.5 px-2 rounded-xl font-bold border transition flex items-center justify-center gap-1.5 ${
                          incomeLinkType === 'order'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Smeta ({customerOrdersList.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIncomeLinkType('none');
                          setSelectedShipmentId('');
                          setSelectedOrderId('');
                        }}
                        className={`py-1.5 px-2 rounded-xl font-bold border transition flex items-center justify-center gap-1.5 ${
                          incomeLinkType === 'none'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <span>⛔ Erkin to&apos;lov</span>
                      </button>
                    </div>

                    {/* Shipment Picker with Live Search */}
                    {incomeLinkType === 'shipment' && (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Otgruzka raqami bo'yicha qidirish (masalan: OTG-2001)..."
                            value={shipmentSearchQuery}
                            onChange={(e) => setShipmentSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                          />
                        </div>

                        {customerShipments.length > 0 ? (
                          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                            {customerShipments.map((s) => {
                              const isSelected = selectedShipmentId === s.id;
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => handleSelectShipmentForIncome(s.id)}
                                  className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                                    isSelected
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                                      : 'bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-emerald-700 text-white' : 'bg-teal-500/10 text-teal-600'}`}>
                                      <Package className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-black text-xs">
                                          {s.shipmentNumber}
                                        </span>
                                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                          isSelected ? 'bg-emerald-800 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                        }`}>
                                          {s.status === 'shipped' ? 'Yuklangan' : 'Kutilmoqda'}
                                        </span>
                                      </div>
                                      <span className={`text-[10px] block truncate ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                                        {s.customerName} &bull; {s.shippedAt || s.createdAt}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <div className={`font-mono font-black text-xs ${isSelected ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                      {formatMoney(s.totalAmount, baseCurrency, exchangeRate)}
                                    </div>
                                    {s.totalAmountUSD && (
                                      <div className={`text-[10px] font-mono ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                                        ${formatUSDNumber(s.totalAmountUSD)}
                                      </div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-3 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                            {selectedCustomerObj
                              ? `"${selectedCustomerObj.fullName}" uchun otgruzka topilmadi. Quyida summani kiritib erkin kirim qilishingiz mumkin.`
                              : "Otgruzkalar topilmadi. Avval yuqoridan mijozni tanlang."}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Order Picker */}
                    {incomeLinkType === 'order' && (
                      <div className="space-y-1.5">
                        <select
                          value={selectedOrderId}
                          onChange={(e) => handleSelectOrderForIncome(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium"
                        >
                          <option value="">-- Smetani tanlang --</option>
                          {customerOrdersList.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.orderNumber} &bull; {o.customerName} &bull; {formatMoney(o.totalAmount, baseCurrency, exchangeRate)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* STEP 3: AMOUNT, CATEGORY & PAYMENT DETAILS */}
                  <div className="space-y-3 pt-1">
                    {/* Amount & Currency */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kirim Summasi *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="Masalan: 1 500 000"
                          value={incomeAmount || ''}
                          onChange={(e) => setIncomeAmount(Number(e.target.value))}
                          className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Valyuta</label>
                        <select
                          value={incomeCurrency}
                          onChange={(e) => setIncomeCurrency(e.target.value as Currency)}
                          className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold"
                        >
                          <option value="UZS">UZS (So&apos;m)</option>
                          <option value="USD">USD ($)</option>
                        </select>
                      </div>
                    </div>

                    {/* Auto Category Info or Category Selector */}
                    {incomeLinkType !== 'none' ? (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400">Toifa:</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-300">
                            🟢 {incomeCategory}
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-600/80 font-medium">Avtomatik toifalandi</span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kirim Toifasi</label>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddIncomeModalOpen(false);
                              setIsCategoryManageModalOpen(true);
                              setNewCatType('income');
                            }}
                            className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            + Yangi toifa
                          </button>
                        </div>
                        <select
                          value={incomeCategory}
                          onChange={(e) => setIncomeCategory(e.target.value)}
                          className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium"
                        >
                          {incomeCategories.map((c) => (
                            <option key={c.id} value={c.name}>
                              🟢 {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Payment Source */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Qayerga qabul qilindi? (Kassa / Bank)</label>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setIncomePaymentSource('Kassa (Naqd)')}
                          className={`py-2 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition ${
                            incomePaymentSource === 'Kassa (Naqd)'
                              ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-400'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500'
                          }`}
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          Kassa (Naqd)
                        </button>

                        <button
                          type="button"
                          onClick={() => setIncomePaymentSource('Hisob raqam / Karta')}
                          className={`py-2 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition ${
                            incomePaymentSource === 'Hisob raqam / Karta'
                              ? 'bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-400'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Bank / Karta
                        </button>

                        <button
                          type="button"
                          onClick={() => setIncomePaymentSource('Valyuta (Naqd USD)')}
                          className={`py-2 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition ${
                            incomePaymentSource === 'Valyuta (Naqd USD)'
                              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500'
                          }`}
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          Valyuta (USD)
                        </button>
                      </div>
                    </div>

                    {/* Paid By (Only show manual input when no customer is selected) */}
                    {!selectedCustomerObj && (
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">To&apos;lovchi ismi / Kompaniya (ixtiyoriy)</label>
                        <input
                          type="text"
                          placeholder="Masalan: Erkin to'lovchi yoki Tashkilot..."
                          value={incomePaidBy}
                          onChange={(e) => setIncomePaidBy(e.target.value)}
                          className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Izoh</label>
                      <textarea
                        rows={2}
                        placeholder="Qisqacha izoh..."
                        value={incomeNotes}
                        onChange={(e) => setIncomeNotes(e.target.value)}
                        className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold text-xs text-white transition mt-3 shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pul Kirimini Saqlash va Tasdiqlash</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL 2: ADD EXPENSE (RASXOD) MODAL WITH SUPPLIER & PRIYOMKA INTEGRATION */}
          {/* ========================================================================= */}
          {isAddExpenseModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 font-bold shadow-sm">
                      <ArrowDownRight className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        Yangi Chiqim (Xarajat / Rasxod) Kiritish
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Ta&apos;minotchi qarzini yopish, priyomkaga to&apos;lov yoki oddiy xarajat
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsAddExpenseModalOpen(false);
                      handleClearSupplier();
                    }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Primary Mode Switcher: Ta'minotchiga to'lov vs Boshqa xarajat */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setExpenseLinkMode('supplier');
                      setExpenseCategory('Ta\'minotchiga to\'lov');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
                      expenseLinkMode === 'supplier'
                        ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>🏢 Ta&apos;minotchi to&apos;lovi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExpenseLinkMode('general');
                      handleClearSupplier();
                      setExpenseCategory(expenseCategories[0]?.name || 'Mayda xo\'jalik');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
                      expenseLinkMode === 'general'
                        ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>💼 Boshqa xarajat (OPEX)</span>
                  </button>
                </div>

                <form onSubmit={handleCreateExpense} className="space-y-4">
                  {/* ======================================================== */}
                  {/* FLOW 1: SUPPLIER PAYMENT (TA'MINOTCHIGA TO'LOV) */}
                  {/* ======================================================== */}
                  {expenseLinkMode === 'supplier' && (
                    <>
                      {/* STEP 1: SELECT SUPPLIER */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <Building className="w-4 h-4 text-rose-500" />
                            1. Ta&apos;minotchini Tanlang *
                          </label>
                          {selectedSupplierName && (
                            <button
                              type="button"
                              onClick={handleClearSupplier}
                              className="text-[11px] font-bold text-rose-500 hover:underline flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> Boshqa ta&apos;minotchini tanlash
                            </button>
                          )}
                        </div>

                        {selectedSupplierName ? (
                          /* Selected Supplier Banner with LIVE DEBT BALANCE */
                          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                                  {selectedSupplierName.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                                      {selectedSupplierName}
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[9px] font-black bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                                      Ta&apos;minotchi
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                    <span>📦 Jami priyomkalar: {selectedSupplierStats.invoicesCount} ta</span>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={handleClearSupplier}
                                className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition shrink-0"
                                title="Bekor qilish"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* PROMINENT SUPPLIER DEBT / BALANCE CARD */}
                            <div className={`p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs font-bold ${
                              selectedSupplierStats.totalDebtUZS > 0
                                ? 'bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300'
                                : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                            }`}>
                              <div className="flex items-center gap-2">
                                {selectedSupplierStats.totalDebtUZS > 0 ? (
                                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                )}
                                <span>
                                  {selectedSupplierStats.totalDebtUZS > 0
                                    ? "Bizning qarzimiz (Ularning haqqi):"
                                    : "Bizning qarzimiz yo'q (To'liq hisob-kitob qilingan)"}
                                </span>
                              </div>
                              {selectedSupplierStats.totalDebtUZS > 0 && (
                                <div className="text-right shrink-0">
                                  <span className="font-mono font-black text-sm">
                                    {formatMoney(selectedSupplierStats.totalDebtUZS, baseCurrency, exchangeRate)}
                                  </span>
                                  <span className="text-[10px] text-rose-500 font-mono block">
                                    (${formatUSDNumber(selectedSupplierStats.totalDebtUSD)})
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Supplier Search Input & List */
                          <div className="space-y-2">
                            <div className="relative">
                              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                placeholder="Ta'minotchi korxona nomi bo'yicha qidirish (masalan: Hikvision, Dahua, Malohat)..."
                                value={supplierSearchQuery}
                                onChange={(e) => setSupplierSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                              />
                            </div>

                            {/* Filtered Suppliers List with Debt Badges */}
                            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                              {filteredSuppliersForExpense.map((sName) => {
                                const supInvs = (purchases || []).filter(p => 
                                  p.supplierName?.toLowerCase().includes(sName.toLowerCase()) ||
                                  sName.toLowerCase().includes(p.supplierName?.toLowerCase())
                                );
                                const debtVal = supInvs.reduce((sum, p) => {
                                  if (p.debtAmount !== undefined && p.debtAmount > 0) return sum + p.debtAmount;
                                  if (p.paymentStatus === 'debt') return sum + p.totalAmount;
                                  if (p.paymentStatus === 'partial') return sum + Math.max(0, p.totalAmount - (p.paidAmount || 0));
                                  return sum;
                                }, 0);

                                return (
                                  <button
                                    key={sName}
                                    type="button"
                                    onClick={() => handleSelectSupplier(sName)}
                                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-800 hover:border-rose-500/40 flex items-center justify-between text-left transition group"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 group-hover:bg-rose-600 group-hover:text-white flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 transition shrink-0">
                                        <Building className="w-3.5 h-3.5" />
                                      </div>
                                      <div className="min-w-0">
                                        <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                                          {sName}
                                        </span>
                                        <span className="text-[10px] text-slate-400 block truncate">
                                          {supInvs.length > 0 ? `${supInvs.length} ta priyomka nakladnoy` : "Yangi ta'minotchi"}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                      {debtVal > 0 ? (
                                        <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 block">
                                          Qarz: {formatMoney(debtVal, baseCurrency, exchangeRate)}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-emerald-500 font-semibold block">
                                          Hisob toza &rarr;
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* STEP 2: LINK TO SPECIFIC PRIYOMKA (OR DIRECT SUPPLIER PAYMENT) */}
                      {selectedSupplierName && (
                        <div className="p-3.5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/80 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <label className="text-xs font-black uppercase tracking-wider text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                              <Package className="w-4 h-4 text-rose-500 shrink-0" />
                              <span>2. Priyomka (Kirim cheki)ga bog&apos;lash</span>
                            </label>
                            <span className="text-[10px] bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-bold px-2 py-0.5 rounded-full shrink-0">
                              {selectedSupplierPurchasesList.length} ta priyomka
                            </span>
                          </div>

                          {/* Link Mode Switcher */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => setExpenseSupplierLinkType('purchase')}
                              className={`py-1.5 px-3 rounded-xl font-bold border transition flex items-center justify-center gap-1.5 ${
                                expenseSupplierLinkType === 'purchase'
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              <Package className="w-3.5 h-3.5" />
                              <span>📦 Priyomkaga bog&apos;lash</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setExpenseSupplierLinkType('direct');
                                setSelectedPurchaseId('');
                                setExpenseCategory('Ta\'minotchiga to\'lov');
                                setExpenseNotes(`${selectedSupplierName} ga umumiy to'lov / avans`);
                              }}
                              className={`py-1.5 px-3 rounded-xl font-bold border transition flex items-center justify-center gap-1.5 ${
                                expenseSupplierLinkType === 'direct'
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              <span>⛔ Priyomkasiz to&apos;lov</span>
                            </button>
                          </div>

                          {/* Purchases Picker */}
                          {expenseSupplierLinkType === 'purchase' && (
                            <div className="space-y-2">
                              <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  placeholder="Priyomka raqami bo'yicha qidirish (masalan: PR-1001)..."
                                  value={purchaseSearchQuery}
                                  onChange={(e) => setPurchaseSearchQuery(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                                />
                              </div>

                              {selectedSupplierPurchasesList.length > 0 ? (
                                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                                  {selectedSupplierPurchasesList.map((p) => {
                                    const isSelected = selectedPurchaseId === p.id;
                                    const unpaidAmount = p.debtAmount !== undefined && p.debtAmount > 0 
                                      ? p.debtAmount 
                                      : (p.paymentStatus === 'debt' ? p.totalAmount : 0);

                                    return (
                                      <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => handleSelectPurchaseForExpense(p.id)}
                                        className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                                          isSelected
                                            ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                                            : 'bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-rose-700 text-white' : 'bg-rose-500/10 text-rose-600'}`}>
                                            <Package className="w-4 h-4" />
                                          </div>
                                          <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                              <span className="font-mono font-black text-xs">
                                                {p.invoiceNumber}
                                              </span>
                                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                                isSelected 
                                                  ? 'bg-rose-800 text-white' 
                                                  : p.paymentStatus === 'debt' 
                                                  ? 'bg-rose-100 text-rose-700' 
                                                  : p.paymentStatus === 'partial' 
                                                  ? 'bg-amber-100 text-amber-700' 
                                                  : 'bg-emerald-100 text-emerald-700'
                                              }`}>
                                                {p.paymentStatus === 'debt' ? 'Nasiya' : p.paymentStatus === 'partial' ? 'Qisman' : 'To\'langan'}
                                              </span>
                                            </div>
                                            <span className={`text-[10px] block truncate ${isSelected ? 'text-rose-100' : 'text-slate-400'}`}>
                                              {p.supplierInvoiceNumber ? `SF: ${p.supplierInvoiceNumber} &bull; ` : ''}{p.createdAt}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                          <div className={`font-mono font-black text-xs ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                            {formatMoney(p.totalAmount, baseCurrency, exchangeRate)}
                                          </div>
                                          {unpaidAmount > 0 && (
                                            <div className={`text-[10px] font-mono font-bold ${isSelected ? 'text-rose-100' : 'text-rose-600 dark:text-rose-400'}`}>
                                              Qarz: {formatMoney(unpaidAmount, baseCurrency, exchangeRate)}
                                            </div>
                                          )}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="p-3 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                                  Priyomkalar topilmadi. Priyomkasiz to&apos;lov orqali to&apos;g&apos;ridan-to&apos;g&apos;ri chiqim qilishingiz mumkin.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* ======================================================== */}
                  {/* AMOUNT & PAYMENT DETAILS (CHIQIM SUMMASI VA MANBA) */}
                  {/* ======================================================== */}
                  <div className="space-y-3 pt-1">
                    {/* Amount & Currency */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Chiqim Summasi *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="Masalan: 4 500 000"
                          value={expenseAmount || ''}
                          onChange={(e) => setExpenseAmount(Number(e.target.value))}
                          className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold font-mono text-rose-600 dark:text-rose-400 focus:ring-2 focus:ring-rose-500/40"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Valyuta</label>
                        <select
                          value={expenseCurrency}
                          onChange={(e) => setExpenseCurrency(e.target.value as Currency)}
                          className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold"
                        >
                          <option value="UZS">UZS (So&apos;m)</option>
                          <option value="USD">USD ($)</option>
                        </select>
                      </div>
                    </div>

                    {/* Category */}
                    {expenseLinkMode === 'supplier' ? (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400">Toifa:</span>
                          <span className="font-bold text-rose-700 dark:text-rose-300">
                            🔴 {expenseCategory}
                          </span>
                        </div>
                        <span className="text-[10px] text-rose-600/80 font-medium">Avtomatik belgilandi</span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Xarajat Toifasi</label>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddExpenseModalOpen(false);
                              setIsCategoryManageModalOpen(true);
                              setNewCatType('expense');
                            }}
                            className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                          >
                            + Yangi toifa
                          </button>
                        </div>
                        <select
                          value={expenseCategory}
                          onChange={(e) => setExpenseCategory(e.target.value)}
                          className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium"
                        >
                          {expenseCategories.map((c) => (
                            <option key={c.id} value={c.name}>
                              🔴 {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Payment Source */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Qayerdan to&apos;landi? (Manba)</label>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setExpensePaymentSource('Kassa (Naqd)')}
                          className={`py-2 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition ${
                            expensePaymentSource === 'Kassa (Naqd)'
                              ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-400'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500'
                          }`}
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          Kassa (Naqd)
                        </button>

                        <button
                          type="button"
                          onClick={() => setExpensePaymentSource('Hisob raqam / Karta')}
                          className={`py-2 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition ${
                            expensePaymentSource === 'Hisob raqam / Karta'
                              ? 'bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-400'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Bank / Karta
                        </button>

                        <button
                          type="button"
                          onClick={() => setExpensePaymentSource('Valyuta (Naqd USD)')}
                          className={`py-2 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition ${
                            expensePaymentSource === 'Valyuta (Naqd USD)'
                              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500'
                          }`}
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          Valyuta (USD)
                        </button>
                      </div>
                    </div>

                    {/* Paid To (Only show manual input when general expense) */}
                    {expenseLinkMode === 'general' && (
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kimga to&apos;landi? (Qabul qiluvchi)</label>
                        <input
                          type="text"
                          placeholder="Masalan: Kuryer Rustam, Sarkor Telecom, Chilonzor SM..."
                          value={expensePaidTo}
                          onChange={(e) => setExpensePaidTo(e.target.value)}
                          className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Izoh va Sababi</label>
                      <textarea
                        rows={2}
                        placeholder="Qisqacha izoh..."
                        value={expenseNotes}
                        onChange={(e) => setExpenseNotes(e.target.value)}
                        className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 font-bold text-xs text-white transition mt-3 shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xarajatni Chiqim Qilish va Tasdiqlash</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL 3: CATEGORY MANAGEMENT MODAL */}
          {/* ========================================================================= */}
          {isCategoryManageModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Settings2 className="w-5 h-5 text-purple-600" />
                      Moliya Toifalarini Boshqarish
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Kirim (Prixod) va Chiqim (Rasxod) toifalarini qo&apos;shish va tahrirlash
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCategoryManageModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Sub-tabs for Category Types */}
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setCategoryTab('all')}
                    className={`flex-1 py-1 rounded-lg font-bold transition ${categoryTab === 'all' ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Barchasi ({categories.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryTab('income')}
                    className={`flex-1 py-1 rounded-lg font-bold transition flex items-center justify-center gap-1 ${categoryTab === 'income' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'}`}
                  >
                    🟢 Kirim ({incomeCategories.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryTab('expense')}
                    className={`flex-1 py-1 rounded-lg font-bold transition flex items-center justify-center gap-1 ${categoryTab === 'expense' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500'}`}
                  >
                    🔴 Chiqim ({expenseCategories.length})
                  </button>
                </div>

                {/* Add New Category Box */}
                <form onSubmit={handleCreateCategory} className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-850 space-y-2.5">
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-200 block">
                    + Yangi Moliya Toifasi Qo&apos;shish
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <input
                        type="text"
                        required
                        placeholder="Toifa nomi (masalan: Otgruzka to'lovi, Soliqlar)..."
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/40"
                      />
                    </div>
                    <div>
                      <select
                        value={newCatType}
                        onChange={(e) => setNewCatType(e.target.value as 'income' | 'expense')}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs text-slate-900 dark:text-white font-bold"
                      >
                        <option value="income">🟢 Kirim (Prixod)</option>
                        <option value="expense">🔴 Chiqim (Rasxod)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="w-9 h-8 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
                      title="Toifa rangini tanlang"
                    />
                    <input
                      type="text"
                      placeholder="Qisqacha izoh (ixtiyoriy)..."
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1 text-xs text-slate-600 dark:text-slate-300"
                    />
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shrink-0"
                    >
                      Qo&apos;shish
                    </button>
                  </div>
                </form>

                {/* List of Existing Categories */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {categories
                    .filter(c => categoryTab === 'all' || c.type === categoryTab || (!c.type && categoryTab === 'expense'))
                    .map((cat) => {
                      const isEditing = editingCatId === cat.id;
                      const usageCount = expenses.filter((e) => e.category === cat.name).length;

                      return (
                        <div
                          key={cat.id}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color || '#EF4444' }} />

                            {isEditing ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  value={editCatNameValue}
                                  onChange={(e) => setEditCatNameValue(e.target.value)}
                                  className="flex-1 bg-white dark:bg-slate-900 border border-purple-500 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 dark:text-white"
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
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                                    {cat.name}
                                  </span>
                                  {cat.type === 'income' ? (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                      KIRIM
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                      CHIQIM
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {cat.description || 'Izohsiz'} &bull; {usageCount} ta yozuv
                                </span>
                              </div>
                            )}
                          </div>

                          {!isEditing && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingCatId(cat.id);
                                  setEditCatNameValue(cat.name);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition"
                                title="Toifa nomini o'zgartirish"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  if (window.confirm(`"${cat.name}" toifasini o'chirmoqchimisiz?`)) {
                                    onDeleteCategory(cat.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                                title="Toifani o'chirish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-850 flex justify-end">
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

          {/* ========================================================================= */}
          {/* MODAL 4: VOUCHER PRINT MODAL (PKO / RKO KVITANSIYA) */}
          {/* ========================================================================= */}
          {selectedVoucherExpense && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white text-slate-900 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                {/* Print Header */}
                <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                      SC
                    </div>
                    <div>
                      <h4 className="font-black text-sm tracking-wide">SMART CONTROL</h4>
                      <p className="text-[10px] text-slate-500">Kassa Moliya Kvitansiyasi</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedVoucherExpense(null)}
                    className="text-slate-400 hover:text-slate-700 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Voucher Official Body */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 font-sans">
                  <div className="text-center pb-2 border-b border-dashed border-slate-300">
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-900">
                      {selectedVoucherExpense.type === 'income' 
                        ? 'KIRIM KASSA ORDERI (PKO)' 
                        : 'CHIQIM KASSA ORDERI (RKO)'}
                    </span>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                      № {selectedVoucherExpense.id.toUpperCase()} &bull; {selectedVoucherExpense.createdAt}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">
                        {selectedVoucherExpense.type === 'income' ? 'Kimdan qabul qilindi:' : 'Kimga to\'landi:'}
                      </span>
                      <span className="font-bold text-slate-900">
                        {selectedVoucherExpense.type === 'income' 
                          ? (selectedVoucherExpense.paidBy || selectedVoucherExpense.customerName || 'Mijoz') 
                          : selectedVoucherExpense.paidTo}
                      </span>
                    </div>

                    {selectedVoucherExpense.linkedDocNumber && (
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-500">Bog&apos;langan Hujjat / Otgruzka:</span>
                        <span className="font-bold text-teal-700 font-mono">
                          {selectedVoucherExpense.linkedDocNumber}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Toifa & Maqsad:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedVoucherExpense.category} ({selectedVoucherExpense.notes})
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">To&apos;lov Manbai:</span>
                      <span className="font-bold text-slate-800">{selectedVoucherExpense.paymentSource}</span>
                    </div>

                    <div className="flex justify-between py-2 bg-indigo-50/80 px-3 rounded-xl">
                      <span className="font-bold text-indigo-900">Jami To&apos;lov Summasi:</span>
                      <span className="font-black text-base font-mono text-indigo-950">
                        {selectedVoucherExpense.amount.toLocaleString()} so&apos;m
                        {selectedVoucherExpense.amountUSD && ` ($${formatUSDNumber(selectedVoucherExpense.amountUSD)})`}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 grid grid-cols-2 gap-4 text-[11px] text-slate-600 border-t border-slate-200">
                    <div>
                      <span className="block font-semibold">Kassir / Mas&apos;ul:</span>
                      <div className="mt-4 border-b border-slate-400 w-32 pb-0.5 font-medium">
                        {selectedVoucherExpense.createdBy}
                      </div>
                    </div>
                    <div>
                      <span className="block font-semibold">Qabul qiluvchi / Mijoz:</span>
                      <div className="mt-4 border-b border-slate-400 w-32 pb-0.5 text-slate-400">
                        (imzo)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Print & Close Actions */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setSelectedVoucherExpense(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100"
                  >
                    Yopish
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                  >
                    <Printer className="w-4 h-4" />
                    Chop Etish (Print)
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
