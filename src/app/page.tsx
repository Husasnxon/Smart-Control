'use client';

import React, { useState, useEffect } from 'react';
import { ActiveTab, Product, Customer, SaleReceipt, AIInsight, Expense, ExpenseCategory, ProductCategory, Employee, CustomerOrder, ShipmentOrder, AssignedTechnician, PaymentDetails, CartItem, Currency, PurchaseInvoice, PurchasePaymentRecord, ServiceTicket, CustomerDebtPayment, ZReport, PayrollRecord, EmployeeAdvance, ObjectHandover, DEFAULT_ROLE_TABS } from '../types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_CUSTOMERS, 
  INITIAL_RECEIPTS, 
  INITIAL_AI_INSIGHTS, 
  INITIAL_EXPENSES, 
  INITIAL_EXPENSE_CATEGORIES, 
  INITIAL_PRODUCT_CATEGORIES, 
  INITIAL_EMPLOYEES, 
  INITIAL_CUSTOMER_ORDERS, 
  INITIAL_SHIPMENTS, 
  INITIAL_PURCHASES, 
  INITIAL_SERVICE_TICKETS, 
  INITIAL_CUSTOMER_DEBT_PAYMENTS, 
  INITIAL_PAYROLLS, 
  INITIAL_ADVANCES,
  INITIAL_HANDOVERS 
} from '../data/mockData';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { POSScreen } from '../components/POSScreen';
import { DashboardScreen } from '../components/DashboardScreen';
import { InventoryScreen } from '../components/InventoryScreen';
import { CustomersScreen } from '../components/CustomersScreen';
import { ExpensesScreen } from '../components/ExpensesScreen';
import { AIAdvisorScreen } from '../components/AIAdvisorScreen';
import { SalesHistoryScreen } from '../components/SalesHistoryScreen';
import { EmployeesScreen } from '../components/EmployeesScreen';
import { OrdersAndShipmentsScreen } from '../components/OrdersAndShipmentsScreen';
import { WarrantyScreen } from '../components/WarrantyScreen';
import { SettingsScreen } from '../components/SettingsScreen';
import { TechnicianPortalScreen } from '../components/TechnicianPortalScreen';
import { FinancialReportsScreen } from '../components/FinancialReportsScreen';
import { ZReportModal } from '../components/ZReportModal';
import { LoginScreen } from '../components/LoginScreen';
import { getTelegramSettings, sendTelegramMessage, generateDailySalesReport } from '../utils/telegram';
import { isTodayDate, getNowFormatted } from '../utils/formatters';
import { CheckCircle2, CloudLightning, X } from 'lucide-react';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [isSwitchUserModalOpen, setIsSwitchUserModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>(INITIAL_PRODUCT_CATEGORIES);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [receipts, setReceipts] = useState<SaleReceipt[]>(INITIAL_RECEIPTS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(INITIAL_EXPENSE_CATEGORIES);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>(INITIAL_CUSTOMER_ORDERS);
  const [shipments, setShipments] = useState<ShipmentOrder[]>(INITIAL_SHIPMENTS);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>(INITIAL_PURCHASES);
  const [serviceTickets, setServiceTickets] = useState<ServiceTicket[]>(INITIAL_SERVICE_TICKETS);
  const [customerDebtPayments, setCustomerDebtPayments] = useState<CustomerDebtPayment[]>(INITIAL_CUSTOMER_DEBT_PAYMENTS);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>(INITIAL_PAYROLLS);
  const [advances, setAdvances] = useState<EmployeeAdvance[]>(INITIAL_ADVANCES);
  const [handovers, setHandovers] = useState<ObjectHandover[]>(INITIAL_HANDOVERS);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>(INITIAL_AI_INSIGHTS);
  const [exchangeRate, setExchangeRate] = useState<number>(12850);
  const [baseCurrency, setBaseCurrency] = useState<Currency>('UZS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isZReportOpen, setIsZReportOpen] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // 1. Dastur ochilganda kompyuterning lokal xotirasidan ma'lumotlarni yuklash
  useEffect(() => {
    try {
      const savedRate = localStorage.getItem('sc_exchange_rate');
      if (savedRate && !isNaN(Number(savedRate))) {
        setExchangeRate(Number(savedRate));
      }
      const savedCurrency = localStorage.getItem('sc_base_currency');
      if (savedCurrency === 'UZS' || savedCurrency === 'USD') {
        setBaseCurrency(savedCurrency);
      }
      const savedProducts = localStorage.getItem('sc_products');
      if (savedProducts) {
        const parsed: Product[] = JSON.parse(savedProducts);
        const isOldData = parsed.some((p) => p.sku === 'BEV-001' || p.category === 'Ichimliklar');
        if (isOldData) {
          setProducts(INITIAL_PRODUCTS);
          setProductCategories(INITIAL_PRODUCT_CATEGORIES);
          setCustomers(INITIAL_CUSTOMERS);
          setReceipts(INITIAL_RECEIPTS);
          setExpenses(INITIAL_EXPENSES);
          setExpenseCategories(INITIAL_EXPENSE_CATEGORIES);
          setAiInsights(INITIAL_AI_INSIGHTS);
        } else {
          // Merge image URLs from INITIAL_PRODUCTS and heal any dollar amounts saved in UZS fields
          const rateToUse = exchangeRate > 0 ? exchangeRate : 12850;
          const enriched = parsed.map((p) => {
            let retailPrice = p.retailPrice;
            let costPrice = p.costPrice;
            let retailPriceUSD = p.retailPriceUSD;
            let costPriceUSD = p.costPriceUSD;

            // Auto-heal if price was saved as raw USD ($) into UZS field (e.g. 36 instead of 462,600)
            if (retailPrice > 0 && retailPrice < 500) {
              retailPriceUSD = retailPrice;
              retailPrice = Math.round(retailPrice * rateToUse);
            }
            if (costPrice > 0 && costPrice < 500) {
              costPriceUSD = costPrice;
              costPrice = Math.round(costPrice * rateToUse);
            }

            if (!p.imageUrl) {
              const match = INITIAL_PRODUCTS.find((ip) => ip.id === p.id || ip.sku === p.sku);
              if (match?.imageUrl) return { ...p, retailPrice, costPrice, retailPriceUSD, costPriceUSD, imageUrl: match.imageUrl };
            }
            return { ...p, retailPrice, costPrice, retailPriceUSD, costPriceUSD };
          });
          setProducts(enriched);
        }
      }

      const savedCustomers = localStorage.getItem('sc_customers');
      if (savedCustomers) {
        const parsedCust = JSON.parse(savedCustomers);
        if (!parsedCust.some((c: any) => c.fullName.includes('Grand Qurilish'))) {
          setCustomers(INITIAL_CUSTOMERS);
        } else {
          setCustomers(parsedCust);
        }
      }

      const savedReceipts = localStorage.getItem('sc_receipts');
      if (savedReceipts) setReceipts(JSON.parse(savedReceipts));

      const savedExpenses = localStorage.getItem('sc_expenses');
      if (savedExpenses) setExpenses(JSON.parse(savedExpenses));

      const savedCategories = localStorage.getItem('sc_categories');
      if (savedCategories) setExpenseCategories(JSON.parse(savedCategories));

      const savedProdCats = localStorage.getItem('sc_product_categories');
      if (savedProdCats) setProductCategories(JSON.parse(savedProdCats));

      const savedEmployees = localStorage.getItem('sc_employees');
      if (savedEmployees) {
        try {
          let parsedEmp: Employee[] = JSON.parse(savedEmployees);
          // Check if admin user is present and has username
          const hasAdmin = parsedEmp.some((e) => e.username === 'admin');
          if (!hasAdmin) {
            setEmployees(INITIAL_EMPLOYEES);
          } else {
            // Guarantee technician_portal is included for all technicians
            parsedEmp = parsedEmp.map((emp) => {
              if (emp.systemRole === 'technician' || emp.role.toLowerCase().includes('usta') || emp.role.toLowerCase().includes('muhandis')) {
                const tabs: ActiveTab[] = emp.allowedTabs ? [...emp.allowedTabs] : (['technician_portal', 'orders', 'warranty'] as ActiveTab[]);
                if (!tabs.includes('technician_portal')) {
                  tabs.unshift('technician_portal');
                }
                return { ...emp, allowedTabs: tabs };
              }
              if (emp.systemRole === 'admin' || emp.systemRole === 'manager' || !emp.systemRole) {
                const tabs: ActiveTab[] = emp.allowedTabs ? [...emp.allowedTabs] : ([...DEFAULT_ROLE_TABS[emp.systemRole || 'admin']] as ActiveTab[]);
                if (!tabs.includes('financial_reports')) {
                  tabs.splice(1, 0, 'financial_reports');
                }
                if (!tabs.includes('technician_portal')) {
                  tabs.push('technician_portal');
                }
                return { ...emp, allowedTabs: tabs };
              }
              return emp;
            });
            setEmployees(parsedEmp);
          }
        } catch (e) {
          setEmployees(INITIAL_EMPLOYEES);
        }
      } else {
        setEmployees(INITIAL_EMPLOYEES);
      }

      const savedUser = localStorage.getItem('sc_current_user');
      if (savedUser) {
        try {
          let user: Employee = JSON.parse(savedUser);
          if (user.systemRole === 'technician' || user.role.toLowerCase().includes('usta') || user.role.toLowerCase().includes('muhandis')) {
            const tabs: ActiveTab[] = user.allowedTabs ? [...user.allowedTabs] : (['technician_portal', 'orders', 'warranty'] as ActiveTab[]);
            if (!tabs.includes('technician_portal')) {
              tabs.unshift('technician_portal');
            }
            user = { ...user, allowedTabs: tabs };
          } else if (user.systemRole === 'admin' || user.systemRole === 'manager' || !user.systemRole) {
            const tabs: ActiveTab[] = user.allowedTabs ? [...user.allowedTabs] : ([...DEFAULT_ROLE_TABS[user.systemRole || 'admin']] as ActiveTab[]);
            if (!tabs.includes('financial_reports')) {
              tabs.splice(1, 0, 'financial_reports');
            }
            if (!tabs.includes('technician_portal')) {
              tabs.push('technician_portal');
            }
            user = { ...user, allowedTabs: tabs };
          }
          setCurrentUser(user);
        } catch (e) {
          console.error("User parse error", e);
        }
      }

      const savedOrders = localStorage.getItem('sc_customer_orders');
      if (savedOrders) setCustomerOrders(JSON.parse(savedOrders));

      const savedShipments = localStorage.getItem('sc_shipments');
      if (savedShipments) setShipments(JSON.parse(savedShipments));

      const savedPurchases = localStorage.getItem('sc_purchases');
      if (savedPurchases) setPurchases(JSON.parse(savedPurchases));

      const savedTickets = localStorage.getItem('sc_service_tickets');
      if (savedTickets) setServiceTickets(JSON.parse(savedTickets));

      const savedDebtPayments = localStorage.getItem('sc_customer_debt_payments');
      if (savedDebtPayments) setCustomerDebtPayments(JSON.parse(savedDebtPayments));

      const savedPayrolls = localStorage.getItem('sc_payrolls');
      if (savedPayrolls) setPayrolls(JSON.parse(savedPayrolls));

      const savedAdvances = localStorage.getItem('sc_advances');
      if (savedAdvances) setAdvances(JSON.parse(savedAdvances));

      const savedHandovers = localStorage.getItem('sc_handovers');
      if (savedHandovers) setHandovers(JSON.parse(savedHandovers));
    } catch (e) {
      console.error("Local storage load error", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 2. Har bir o'zgarishni (sotuv, xarajat, tovar, kirim, servis, qarz) darhol kompyuter xotirasiga yozib borish
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('sc_products', JSON.stringify(products));
      localStorage.setItem('sc_product_categories', JSON.stringify(productCategories));
      localStorage.setItem('sc_customers', JSON.stringify(customers));
      localStorage.setItem('sc_receipts', JSON.stringify(receipts));
      localStorage.setItem('sc_expenses', JSON.stringify(expenses));
      localStorage.setItem('sc_categories', JSON.stringify(expenseCategories));
      localStorage.setItem('sc_employees', JSON.stringify(employees));
      localStorage.setItem('sc_customer_orders', JSON.stringify(customerOrders));
      localStorage.setItem('sc_shipments', JSON.stringify(shipments));
      localStorage.setItem('sc_purchases', JSON.stringify(purchases));
      localStorage.setItem('sc_service_tickets', JSON.stringify(serviceTickets));
      localStorage.setItem('sc_customer_debt_payments', JSON.stringify(customerDebtPayments));
      localStorage.setItem('sc_payrolls', JSON.stringify(payrolls));
      localStorage.setItem('sc_advances', JSON.stringify(advances));
      localStorage.setItem('sc_handovers', JSON.stringify(handovers));
      localStorage.setItem('sc_base_currency', baseCurrency);
    } catch (e) {
      console.error("Local storage save error", e);
    }
  }, [products, productCategories, customers, receipts, expenses, expenseCategories, employees, customerOrders, shipments, purchases, serviceTickets, customerDebtPayments, payrolls, advances, handovers, baseCurrency, isLoaded]);

  // 3. Avtomatik 23:59 da Z-Hisobotni yopish va Telegramga yuborish
  useEffect(() => {
    if (!isLoaded) return;

    const checkAutoCloseShift = async () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const todayKey = now.toISOString().split('T')[0];

      // Soat 23:59 ga yetganda
      if (hours === 23 && minutes >= 59) {
        const lastAutoCloseDate = localStorage.getItem('sc_last_auto_z_date');
        const manualClosedDate = localStorage.getItem('sc_today_z_closed_date');

        // Agar bugun hali na avtomat, na qo'lda yopilmagan bo'lsa
        if (lastAutoCloseDate !== todayKey && manualClosedDate !== todayKey) {
          const todayReceipts = receipts.filter(r => isTodayDate(r.createdAt));
          const todayExpenses = expenses.filter(e => isTodayDate(e.createdAt));

          const tgSettings = getTelegramSettings();
          let sentTelegram = false;

          if (tgSettings.botToken && tgSettings.chatId) {
            try {
              const reportHtml = generateDailySalesReport(
                receipts,
                expenses,
                exchangeRate,
                tgSettings.storeName || 'SMART CONTROL',
                'Chilonzor-1 Filiali',
                todayKey
              );
              const res = await sendTelegramMessage(tgSettings.botToken, tgSettings.chatId, reportHtml);
              sentTelegram = res.success;
            } catch (err) {
              console.error('Auto 23:59 telegram send error', err);
            }
          }

          // Arxivga avtomatik Z-Hisobot yozish
          const autoReport: ZReport = {
            id: `z-auto-${Date.now()}`,
            reportNumber: `Z-AUTO-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`,
            closedAt: `${todayKey} 23:59 (Avtomatik)`,
            cashierName: 'Avtomatik Tizim (23:59)',
            branchName: 'Chilonzor-1 Filiali',
            receiptsCount: todayReceipts.length,
            totalSalesUZS: todayReceipts.reduce((sum, r) => sum + r.totalAmount, 0),
            totalSalesUSD: todayReceipts.reduce((sum, r) => sum + (r.totalAmountUSD || (r.totalAmount / exchangeRate)), 0),
            cashUZS: todayReceipts.reduce((sum, r) => sum + (r.payments?.cash || 0), 0),
            cardUZS: todayReceipts.reduce((sum, r) => sum + (r.payments?.card || 0), 0),
            cashUSD: todayReceipts.reduce((sum, r) => sum + (r.payments?.cashUSD || 0), 0),
            debtUZS: todayReceipts.reduce((sum, r) => sum + (r.payments?.debt || 0), 0),
            cashbackUsedUZS: todayReceipts.reduce((sum, r) => sum + (r.payments?.cashbackUsed || 0), 0),
            expensesUZS: todayExpenses.reduce((sum, e) => sum + e.amount, 0),
            expectedCashUZS: 0,
            actualCashUZS: 0,
            differenceUZS: 0,
            sentToTelegram: sentTelegram,
            notes: '23:59 da tizim tomonidan avtomatik yopildi va Telegramga yuborildi.'
          };

          try {
            const existing = localStorage.getItem('sc_z_reports');
            const list = existing ? JSON.parse(existing) : [];
            list.unshift(autoReport);
            localStorage.setItem('sc_z_reports', JSON.stringify(list));
            localStorage.setItem('sc_last_auto_z_date', todayKey);
            localStorage.setItem('sc_today_z_closed_date', todayKey);
            showToast('23:59 — Kunlik smena avtomatik yopildi va Telegramga hisobot yuborildi!');
          } catch (e) {
            console.error('Failed to save auto z-report', e);
          }
        }
      }
    };

    const interval = setInterval(checkAutoCloseShift, 30000);
    checkAutoCloseShift();

    return () => clearInterval(interval);
  }, [isLoaded, receipts, expenses, exchangeRate]);

  // Offline receipts count
  const offlineReceipts = receipts.filter((r) => r.isOffline && !r.synced);
  const offlineCount = offlineReceipts.length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Login handler
  const handleLoginSuccess = (emp: Employee) => {
    setCurrentUser(emp);
    try {
      localStorage.setItem('sc_current_user', JSON.stringify(emp));
    } catch (e) {
      console.error(e);
    }
    setIsSwitchUserModalOpen(false);

    // Switch to first allowed tab if current activeTab is not permitted
    const allowed: ActiveTab[] = emp.allowedTabs && emp.allowedTabs.length > 0 
      ? emp.allowedTabs 
      : emp.systemRole 
      ? DEFAULT_ROLE_TABS[emp.systemRole] 
      : (['pos'] as ActiveTab[]);

    if (!allowed.includes(activeTab)) {
      setActiveTab((allowed[0] || 'pos') as ActiveTab);
    }

    showToast(`Xush kelibsiz, ${emp.fullName}!`);
  };

  // Logout handler
  const handleLogout = () => {
    if (window.confirm("Tizimdan chiqishni tasdiqlaysizmi?")) {
      setCurrentUser(null);
      localStorage.removeItem('sc_current_user');
      setIsSwitchUserModalOpen(false);
      showToast("Tizimdan muvaffaqiyatli chiqildi");
    }
  };

  // Complete a sale
  const handleCompleteSale = (newReceipt: SaleReceipt) => {
    const finalReceipt: SaleReceipt = {
      ...newReceipt,
      cashierName: currentUser ? currentUser.fullName : (newReceipt.cashierName || 'Farrux A.')
    };

    // 1. Add receipt
    setReceipts((prev) => [finalReceipt, ...prev]);

    // 2. Decrement stock from products with S/N and Service logic
    setProducts((prev) =>
      prev.map((prod) => {
        const soldItem = newReceipt.items.find((item) => item.product.id === prod.id);
        if (soldItem) {
          // O'rnatish va montaj xizmatlarida jismoniy ombor qoldig'i kamaytirilmaydi
          if (prod.isService) {
            return prod;
          }

          // Seriya raqamli mahsulot bo'lsa, sotilgan S/N lar ombordan chiqariladi
          if (prod.hasSerialNumber && soldItem.selectedSerialNumbers && soldItem.selectedSerialNumbers.length > 0) {
            const currentSerials = prod.serialNumbers || [];
            const remainingSerials = currentSerials.filter(
              (sn) => !soldItem.selectedSerialNumbers?.includes(sn)
            );
            return {
              ...prod,
              serialNumbers: remainingSerials,
              stockQuantity: remainingSerials.length
            };
          }

          const newQty = Math.max(0, prod.stockQuantity - soldItem.quantity);
          return { ...prod, stockQuantity: newQty };
        }
        return prod;
      })
    );

    // 3. Update customer cashback and purchases if customer selected
    if (newReceipt.customer) {
      setCustomers((prev) =>
        prev.map((cust) => {
          if (cust.id === newReceipt.customer?.id) {
            const updatedCashback =
              cust.cashbackBalance -
              newReceipt.payments.cashbackUsed +
              newReceipt.cashbackEarned;
            const updatedPurchases = cust.totalPurchases + newReceipt.totalAmount;
            const updatedDebt = cust.debtBalance + newReceipt.payments.debt;

            return {
              ...cust,
              cashbackBalance: Math.max(0, updatedCashback),
              totalPurchases: updatedPurchases,
              debtBalance: updatedDebt
            };
          }
          return cust;
        })
      );
    }

    // 4. Update technician stats if assigned to this sale (multi-technician support)
    if (newReceipt.technicians && newReceipt.technicians.length > 0) {
      setEmployees((prev) =>
        prev.map((emp) => {
          const match = newReceipt.technicians?.find((t) => t.id === emp.id);
          if (match) {
            const addedEarnings = match.wageUZS > 0 ? match.wageUZS : Math.round(match.wageUSD * exchangeRate);
            return {
              ...emp,
              installationsCompleted: emp.installationsCompleted + 1,
              totalEarned: emp.totalEarned + addedEarnings
            };
          }
          return emp;
        })
      );
    } else if (newReceipt.technicianId) {
      setEmployees((prev) =>
        prev.map((emp) => {
          if (emp.id === newReceipt.technicianId) {
            const addedEarnings = emp.commissionPerInstall || 0;
            return {
              ...emp,
              installationsCompleted: emp.installationsCompleted + 1,
              totalEarned: emp.totalEarned + addedEarnings
            };
          }
          return emp;
        })
      );
    }

    if (newReceipt.isOffline) {
      showToast("⚡ Chek oflayn saqlandi! Tarmoq ulanganda bulutga sinxronlanadi.");
    } else {
      showToast(`✓ Sotuv yakunlandi! Chek ${newReceipt.receiptNumber} yaratildi.`);
    }
  };

  // Synchronize offline receipts to cloud
  const handleSync = () => {
    if (offlineCount === 0) return;

    setReceipts((prev) =>
      prev.map((r) => (r.isOffline ? { ...r, isOffline: false, synced: true } : r))
    );

    showToast(`✓ Barcha ${offlineCount} ta oflayn cheklar bulutga muvaffaqiyatli sinxronlandi!`);
  };

  // Handle Return (Vozvrat) of items from a completed receipt
  const handleReturnReceipt = (
    receiptId: string,
    returnData: {
      itemsToReturn: {
        productId: string;
        productName: string;
        quantity: number;
        serialNumbers: string[];
        unitPrice: number;
        totalRefund: number;
      }[];
      refundMethod: 'cash' | 'card' | 'debt_deduction';
      reason: string;
    }
  ) => {
    const targetReceipt = receipts.find((r) => r.id === receiptId);
    if (!targetReceipt) return;

    let totalRefundSum = 0;

    // 1. Reconcile Products (Add stock and S/N back to inventory)
    setProducts((prev) =>
      prev.map((prod) => {
        const returnedMatch = returnData.itemsToReturn.find((it) => it.productId === prod.id);
        if (returnedMatch) {
          const newQty = prod.isService ? prod.stockQuantity : prod.stockQuantity + returnedMatch.quantity;
          
          let updatedSerials = prod.serialNumbers ? [...prod.serialNumbers] : [];
          if (returnedMatch.serialNumbers && returnedMatch.serialNumbers.length > 0) {
            returnedMatch.serialNumbers.forEach((sn) => {
              if (!updatedSerials.includes(sn)) {
                updatedSerials.push(sn);
              }
            });
          }

          return {
            ...prod,
            stockQuantity: newQty,
            serialNumbers: prod.hasSerialNumber ? updatedSerials : prod.serialNumbers
          };
        }
        return prod;
      })
    );

    // 2. Calculate total refund
    returnData.itemsToReturn.forEach((it) => {
      totalRefundSum += it.totalRefund;
    });

    // 3. Reconcile Customer if attached
    if (targetReceipt.customer) {
      setCustomers((prev) =>
        prev.map((cust) => {
          if (cust.id === targetReceipt.customer?.id) {
            const newPurchases = Math.max(0, cust.totalPurchases - totalRefundSum);

            let newDebt = cust.debtBalance;
            if (returnData.refundMethod === 'debt_deduction') {
              newDebt = Math.max(0, cust.debtBalance - totalRefundSum);
            }

            const cashbackRate = cust.cashbackRate || 1;
            const cashbackToReverse = Math.round(totalRefundSum * (cashbackRate / 100));
            const newCashback = Math.max(0, cust.cashbackBalance - cashbackToReverse);

            return {
              ...cust,
              totalPurchases: newPurchases,
              debtBalance: newDebt,
              cashbackBalance: newCashback
            };
          }
          return cust;
        })
      );
    }

    // 4. Update the receipt
    const returnTimestamp = new Date().toLocaleString('uz-UZ');
    const newReturnedRecords = returnData.itemsToReturn.map((it, idx) => ({
      id: `ret-${Date.now()}-${idx}`,
      productId: it.productId,
      productName: it.productName,
      quantity: it.quantity,
      serialNumbers: it.serialNumbers.length > 0 ? it.serialNumbers : undefined,
      unitPrice: it.unitPrice,
      totalRefund: it.totalRefund,
      refundMethod: returnData.refundMethod,
      reason: returnData.reason,
      returnedAt: returnTimestamp
    }));

    setReceipts((prev) =>
      prev.map((r) => {
        if (r.id === receiptId) {
          const updatedItems = r.items.map((item) => {
            const retMatch = returnData.itemsToReturn.find((it) => it.productId === item.product.id);
            if (retMatch) {
              const prevReturned = item.returnedQuantity || 0;
              const prevSerials = item.returnedSerialNumbers || [];
              return {
                ...item,
                returnedQuantity: prevReturned + retMatch.quantity,
                returnedSerialNumbers: [...prevSerials, ...retMatch.serialNumbers]
              };
            }
            return item;
          });

          const allFullyReturned = updatedItems.every(
            (it) => (it.returnedQuantity || 0) >= it.quantity
          );

          const totalRefundedSoFar = (r.totalRefunded || 0) + totalRefundSum;

          return {
            ...r,
            items: updatedItems,
            status: allFullyReturned ? 'returned' : 'partially_returned',
            totalRefunded: totalRefundedSoFar,
            returnedItems: [...(r.returnedItems || []), ...newReturnedRecords],
            updatedAt: returnTimestamp
          };
        }
        return r;
      })
    );

    showToast(`✓ Tovarlar omborga muvaffaqiyatli qaytarildi! (Vozvrat: ${totalRefundSum.toLocaleString()} so'm)`);
  };

  // Handle Save Edit Receipt and Add More Items
  const handleSaveEditReceipt = (
    receiptId: string,
    updatedReceipt: SaleReceipt,
    newItemsStockDelta: {
      productId: string;
      quantity: number;
      serialNumbers: string[];
    }[]
  ) => {
    // 1. Deduct newly added items from inventory
    if (newItemsStockDelta && newItemsStockDelta.length > 0) {
      setProducts((prev) =>
        prev.map((prod) => {
          const delta = newItemsStockDelta.find((d) => d.productId === prod.id);
          if (delta) {
            if (prod.isService) return prod;

            const newStock = Math.max(0, prod.stockQuantity - delta.quantity);
            let updatedSerials = prod.serialNumbers ? [...prod.serialNumbers] : [];
            if (delta.serialNumbers.length > 0) {
              updatedSerials = updatedSerials.filter((s) => !delta.serialNumbers.includes(s));
            }

            return {
              ...prod,
              stockQuantity: newStock,
              serialNumbers: prod.hasSerialNumber ? updatedSerials : prod.serialNumbers
            };
          }
          return prod;
        })
      );
    }

    // 2. Find old receipt to compute changes in customer debt/purchases
    const oldReceipt = receipts.find((r) => r.id === receiptId);
    if (oldReceipt) {
      const addedAmount = updatedReceipt.totalAmount - oldReceipt.totalAmount;
      const addedDebt = updatedReceipt.payments.debt - oldReceipt.payments.debt;

      if (updatedReceipt.customer && (addedAmount !== 0 || addedDebt !== 0)) {
        setCustomers((prev) =>
          prev.map((cust) => {
            if (cust.id === updatedReceipt.customer?.id) {
              const updatedPurchases = Math.max(0, cust.totalPurchases + addedAmount);
              const updatedDebt = Math.max(0, cust.debtBalance + addedDebt);
              return {
                ...cust,
                totalPurchases: updatedPurchases,
                debtBalance: updatedDebt
              };
            }
            return cust;
          })
        );
      }
    }

    // 3. Update the receipt in state
    setReceipts((prev) =>
      prev.map((r) => (r.id === receiptId ? updatedReceipt : r))
    );

    showToast(`✓ Chek ${updatedReceipt.receiptNumber} muvaffaqiyatli yangilandi!`);
  };

  // Orders & Shipments Handlers
  const handleSaveOrder = (newOrder: CustomerOrder) => {
    setCustomerOrders((prev) => {
      const idx = prev.findIndex((o) => o.id === newOrder.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = newOrder;
        return updated;
      }
      return [newOrder, ...prev];
    });

    if (newOrder.status === 'pending_cashier_approval') {
      showToast(`🔔 Usta smetasi yuborildi (#${newOrder.orderNumber}). Asosiy kassa tasdig'i kutilmoqda!`);

      // Try to notify Telegram bot if enabled
      try {
        const tg = getTelegramSettings();
        if (tg.enabled && tg.botToken && tg.chatId) {
          const msg = `🔔 *YANGI JOYIDA SMETA / BUYURTMA!*\n\n` +
            `📋 *Smeta raqami:* #${newOrder.orderNumber}\n` +
            `🛠️ *Usta:* ${newOrder.requestedByTechnicianName || newOrder.technicianName || 'Usta'}\n` +
            `👤 *Mijoz:* ${newOrder.customerName} (${newOrder.customerPhone || '—'})\n` +
            `📍 *Manzil:* ${newOrder.deliveryAddress || '—'}\n` +
            `💰 *Jami Summa:* $${newOrder.totalAmountUSD || Number((newOrder.totalAmount / exchangeRate).toFixed(1))} (${newOrder.totalAmount.toLocaleString()} so'm)\n` +
            `📦 *Pozitsiyalar:* ${newOrder.items.length} ta\n` +
            `⚠️ *Holat:* Asosiy kassa tasdig'i kutilmoqda ⏳`;
          sendTelegramMessage(tg.botToken, tg.chatId, msg);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      showToast(`✓ Hisob-kitob (Smeta) ${newOrder.orderNumber} muvaffaqiyatli saqlandi!`);
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    setCustomerOrders((prev) => prev.filter((o) => o.id !== orderId));
    showToast("✓ Hisob-kitob smetasi o'chirildi.");
  };

  const handleSaveShipment = (newShipment: ShipmentOrder) => {
    setShipments((prev) => {
      const idx = prev.findIndex((s) => s.id === newShipment.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = newShipment;
        return updated;
      }
      return [newShipment, ...prev];
    });
    showToast(`✓ Otgruzka hujjati ${newShipment.shipmentNumber} saqlandi!`);
  };

  const handleCompleteShipmentSale = (
    shipment: ShipmentOrder,
    paymentDetails: PaymentDetails,
    assignedTechs: AssignedTechnician[]
  ) => {
    const newReceiptNumber = `CR-${1000 + receipts.length + 1}`;
    const cartItems: CartItem[] = shipment.items.map((it) => {
      const prod = products.find((p) => p.id === it.productId) || {
        id: it.productId,
        barcode: '',
        sku: '',
        name: it.productName,
        category: 'Kuzatuv kameralari (CCTV)',
        costPrice: 0,
        retailPrice: it.unitPrice,
        stockQuantity: 0,
        minStockAlert: 1,
        unit: it.unit,
        hasSerialNumber: it.hasSerialNumber,
        isService: it.isService
      };

      return {
        product: prod,
        quantity: it.quantity,
        discountPercent: it.discountPercent,
        appliedPrice: it.unitPrice * (1 - (it.discountPercent || 0) / 100),
        appliedPriceUSD: it.unitPriceUSD,
        selectedSerialNumbers: it.selectedSerialNumbers && it.selectedSerialNumbers.length > 0 ? it.selectedSerialNumbers : undefined
      };
    });

    const isUSD = shipment.currency === 'USD';
    const rate = exchangeRate > 0 ? exchangeRate : 12850;
    const totalAmountUZS = isUSD ? Math.round(shipment.totalAmount * rate) : shipment.totalAmount;
    const subtotalUZS = isUSD ? Math.round(shipment.subtotal * rate) : shipment.subtotal;
    const discountUZS = isUSD ? Math.round(shipment.discountTotal * rate) : shipment.discountTotal;
    const totalAmountUSD = isUSD ? shipment.totalAmount : Number((shipment.totalAmount / rate).toFixed(2));

    const cust = customers.find((c) => c.id === shipment.customerId);
    const cashbackRate = cust?.cashbackRate || 1;
    const cashbackEarned = Math.round(totalAmountUZS * (cashbackRate / 100));

    const newReceipt: SaleReceipt = {
      id: `receipt-${Date.now()}`,
      receiptNumber: newReceiptNumber,
      createdAt: getNowFormatted(),
      cashierName: 'Farrux A. (Menejer)',
      customer: cust,
      items: cartItems,
      subtotal: subtotalUZS,
      discountTotal: discountUZS,
      totalAmount: totalAmountUZS,
      totalAmountUSD: totalAmountUSD,
      exchangeRate: rate,
      payments: paymentDetails,
      cashbackEarned,
      isOffline,
      synced: !isOffline,
      branchName: shipment.organization || 'WST Namangan',
      installationAddress: shipment.deliveryAddress,
      warrantyMonths: 24,
      technicians: assignedTechs.length > 0 ? assignedTechs : undefined,
      technicianId: assignedTechs[0]?.id,
      technicianName: assignedTechs[0]?.fullName,
      technicianPhone: assignedTechs[0]?.phone,
      status: 'completed',
      notes: shipment.comment ? `Otgruzka: ${shipment.shipmentNumber}. ${shipment.comment}` : `Otgruzka: ${shipment.shipmentNumber}`
    };

    setReceipts((prev) => [newReceipt, ...prev]);

    setProducts((prev) =>
      prev.map((prod) => {
        const shippedItem = shipment.items.find((item) => item.productId === prod.id);
        if (shippedItem) {
          if (prod.isService) return prod;

          const newStock = Math.max(0, prod.stockQuantity - shippedItem.quantity);
          let updatedSerials = prod.serialNumbers ? [...prod.serialNumbers] : [];

          if (shippedItem.selectedSerialNumbers && shippedItem.selectedSerialNumbers.length > 0) {
            updatedSerials = updatedSerials.filter((s) => !shippedItem.selectedSerialNumbers?.includes(s));
          }

          return {
            ...prod,
            stockQuantity: newStock,
            serialNumbers: prod.hasSerialNumber ? updatedSerials : prod.serialNumbers
          };
        }
        return prod;
      })
    );

    if (cust) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === cust.id) {
            return {
              ...c,
              totalPurchases: c.totalPurchases + totalAmountUZS,
              debtBalance: c.debtBalance + (paymentDetails.debt || 0),
              cashbackBalance: c.cashbackBalance + cashbackEarned
            };
          }
          return c;
        })
      );
    }

    if (assignedTechs.length > 0) {
      setEmployees((prev) =>
        prev.map((emp) => {
          const match = assignedTechs.find((t) => t.id === emp.id);
          if (match) {
            const addedEarnings = match.wageUZS > 0 ? match.wageUZS : Math.round(match.wageUSD * exchangeRate);
            return {
              ...emp,
              installationsCompleted: emp.installationsCompleted + 1,
              totalEarned: emp.totalEarned + addedEarnings
            };
          }
          return emp;
        })
      );
    }

    setShipments((prev) =>
      prev.map((s) => (s.id === shipment.id ? { ...shipment, status: 'shipped', receiptId: newReceipt.id } : s))
    );

    showToast(`✓ Otgruzka muvaffaqiyatli yakunlandi! Sotuv cheki ${newReceiptNumber} yaratildi.`);
  };

  // Add Product
  const handleAddProduct = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
    showToast(`✓ "${newProd.name}" omborga muvaffaqiyatli qo'shildi.`);
  };

  // Update Stock
  const handleUpdateStock = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stockQuantity: newStock } : p))
    );
    showToast("✓ Ombordagi qoldiq yangilandi.");
  };

  // Update Product (Redakt qilish)
  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    showToast(`✓ "${updatedProduct.name}" tahrirlandi.`);
  };

  // Delete Product (O'chirish)
  const handleDeleteProduct = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    showToast(`✓ "${prod?.name || 'Tovar'}" ombordan o'chirildi.`);
  };

  // Omborga tovar kirimi (Prixod / Nakladnoy) - Yangi qo'shish va Tahrirlash (Redakt)
  const handleSavePurchase = (invoice: PurchaseInvoice, updatedProducts: Product[]) => {
    setPurchases((prev) => {
      const exists = prev.some((p) => p.id === invoice.id);
      if (exists) {
        return prev.map((p) => (p.id === invoice.id ? invoice : p));
      }
      return [invoice, ...prev];
    });
    setProducts(updatedProducts);
    showToast(`✓ Kirim nakladnoyi #${invoice.invoiceNumber} saqlandi va ombor qoldig'i yangilandi!`);
  };

  // Ta'minotchiga to'lov qilish va nakladnoyga biriktirish
  const handleRecordSupplierPayment = (payment: PurchasePaymentRecord, updatedInvoice: PurchaseInvoice) => {
    setPurchases((prev) =>
      prev.map((p) => (p.id === updatedInvoice.id ? updatedInvoice : p))
    );
    const amountStr = payment.currency === 'USD' 
      ? `$${payment.amountUSD}` 
      : `${payment.amount.toLocaleString()} so'm`;
    showToast(`✓ "${payment.supplierName}"ga ${amountStr} to'lov #${updatedInvoice.invoiceNumber} nakladnoyga biriktirildi!`);
  };

  // Kirim nakladnoyini bekor qilish
  const handleCancelPurchase = (invoiceId: string) => {
    setPurchases((prev) =>
      prev.map((p) => (p.id === invoiceId ? { ...p, status: 'cancelled' as const } : p))
    );
    showToast(`✓ Kirim nakladnoyi bekor qilindi.`);
  };

  // Add Customer
  const handleAddCustomer = (newCustomer: Customer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
    showToast(`✓ Mijoz "${newCustomer.fullName}" ro'yxatga olindi (+10 000 so'm cashback berildi).`);
  };

  // Update Customer
  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
    );
    showToast(`✓ "${updatedCustomer.fullName}" ma'lumotlari yangilandi.`);
  };

  // Add manual cashback bonus
  const handleUpdateCashback = (customerId: string, amount: number) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId ? { ...c, cashbackBalance: c.cashbackBalance + amount } : c
      )
    );
    showToast(`✓ Mijozga +${amount.toLocaleString()} so'm cashback qo'shildi!`);
  };

  // Add Expense
  const handleAddExpense = (newExp: Expense) => {
    setExpenses((prev) => [newExp, ...prev]);
    showToast(`✓ Xarajat kiritildi: ${newExp.amount.toLocaleString()} so'm (${newExp.category})`);
  };

  // Category management handlers
  const handleAddCategory = (newCat: ExpenseCategory) => {
    setExpenseCategories((prev) => [...prev, newCat]);
    showToast(`✓ Yangi toifa qo'shildi: "${newCat.name}"`);
  };

  const handleUpdateCategory = (categoryId: string, newName: string, newDesc?: string) => {
    const oldCat = expenseCategories.find((c) => c.id === categoryId);
    const oldName = oldCat?.name;

    setExpenseCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, name: newName, description: newDesc ?? c.description } : c))
    );

    if (oldName && oldName !== newName) {
      setExpenses((prev) =>
        prev.map((e) => (e.category === oldName ? { ...e, category: newName } : e))
      );
    }

    showToast(`✓ Toifa nomi yangilandi: "${newName}"`);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const catToDelete = expenseCategories.find((c) => c.id === categoryId);
    if (!catToDelete) return;

    setExpenseCategories((prev) => prev.filter((c) => c.id !== categoryId));
    showToast(`✓ Toifa o'chirildi: "${catToDelete.name}"`);
  };

  // Product Category management handlers
  const handleAddProductCategory = (newCat: ProductCategory) => {
    setProductCategories((prev) => [...prev, newCat]);
    showToast(`✓ Yangi mahsulot kategoriyasi: "${newCat.name}"`);
  };

  const handleUpdateProductCategory = (categoryId: string, newName: string, newDesc?: string) => {
    const oldCat = productCategories.find((c) => c.id === categoryId);
    const oldName = oldCat?.name;

    setProductCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, name: newName, description: newDesc ?? c.description } : c))
    );

    // Cascade rename to all existing products in this category
    if (oldName && oldName !== newName) {
      setProducts((prev) =>
        prev.map((p) => (p.category === oldName ? { ...p, category: newName } : p))
      );
    }

    showToast(`✓ Kategoriya nomi o'zgartirildi: "${newName}"`);
  };

  const handleDeleteProductCategory = (categoryId: string) => {
    const catToDelete = productCategories.find((c) => c.id === categoryId);
    if (!catToDelete) return;

    setProductCategories((prev) => prev.filter((c) => c.id !== categoryId));
    showToast(`✓ Kategoriya o'chirildi: "${catToDelete.name}"`);
  };

  // Employee Management handlers
  const handleAddEmployee = (newEmp: Employee) => {
    setEmployees((prev) => [newEmp, ...prev]);
    showToast(`✓ Xodim "${newEmp.fullName}" muvaffaqiyatli qo'shildi.`);
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e))
    );
    showToast(`✓ "${updatedEmp.fullName}" ma'lumotlari yangilandi.`);
  };

  const handleDeleteEmployee = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    setEmployees((prev) => prev.filter((e) => e.id !== empId));
    showToast(`✓ "${emp?.fullName || 'Xodim'}" ro'yxatdan o'chirildi.`);
  };

  const handleUpdateEmployeeStatus = (employeeId: string, newStatus: 'active' | 'on_site' | 'on_leave') => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === employeeId ? { ...e, status: newStatus } : e))
    );
    if (currentUser && currentUser.id === employeeId) {
      setCurrentUser((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    const statusLabels: Record<string, string> = {
      active: "Faol (Bo'sh / Ishda)",
      on_site: "Obyektda (Montaj jarayonida)",
      on_leave: "Ta'tilda / Damda"
    };
    showToast(`✓ Usta holati yangilandi: ${statusLabels[newStatus] || newStatus}`);
  };

  // Payroll & Advance Handlers
  const handleAddPayroll = (record: PayrollRecord) => {
    setPayrolls((prev) => [record, ...prev]);

    // Avtomatik xarajat sifatida kiritish (kassa va buxgalteriya balansi uchun)
    const newExp: Expense = {
      id: `exp-pay-${Date.now()}`,
      category: 'Ish haqi / Oylik',
      amount: record.totalNet,
      paymentSource: record.paymentMethod === 'cash' ? 'Kassa (Naqd)' : 'Hisob raqam / Karta',
      paidTo: record.employeeName,
      notes: `${record.periodLabel} uchun ish haqi to'lovi (#${record.payrollNumber})`,
      createdAt: new Date().toISOString(),
      createdBy: 'Menejer'
    };
    setExpenses((prev) => [newExp, ...prev]);

    showToast(`✓ "${record.employeeName}"ga ${record.totalNet.toLocaleString()} so'm maosh to'landi (#${record.payrollNumber})`);
  };

  const handleAddAdvance = (advance: EmployeeAdvance) => {
    setAdvances((prev) => [advance, ...prev]);

    // Avtomatik xarajat sifatida kiritish
    const newExp: Expense = {
      id: `exp-adv-${Date.now()}`,
      category: 'Ish haqi / Oylik',
      amount: advance.amount,
      paymentSource: advance.paymentMethod === 'cash' ? 'Kassa (Naqd)' : 'Hisob raqam / Karta',
      paidTo: advance.employeeName,
      notes: `${advance.periodMonth} uchun avans (#${advance.advanceNumber})`,
      createdAt: new Date().toISOString(),
      createdBy: 'Menejer'
    };
    setExpenses((prev) => [newExp, ...prev]);

    showToast(`✓ "${advance.employeeName}"ga ${advance.amount.toLocaleString()} so'm avans berildi (#${advance.advanceNumber})`);
  };

  // Update Dollar Exchange Rate
  const handleUpdateExchangeRate = (newRate: number) => {
    setExchangeRate(newRate);
    try {
      localStorage.setItem('sc_exchange_rate', newRate.toString());
    } catch (e) {
      console.error(e);
    }
    showToast(`✓ Valyuta kursi yangilandi: 1$ = ${newRate.toLocaleString()} so'm`);
  };

  // Update Base System Currency
  const handleUpdateBaseCurrency = (currency: Currency) => {
    setBaseCurrency(currency);
    try {
      localStorage.setItem('sc_base_currency', currency);
    } catch (e) {
      console.error(e);
    }
    showToast(
      currency === 'USD'
        ? "✓ Asosiy tizim valyutasi AQSH Dollari ($ USD) ga o'zgartirildi"
        : "✓ Asosiy tizim valyutasi O'zbek so'mi (UZS) ga o'zgartirildi"
    );
  };

  // Service Ticket Handlers (Kafolat va Servis)
  const handleAddServiceTicket = (ticket: ServiceTicket) => {
    setServiceTickets((prev) => [ticket, ...prev]);
    showToast(`"${ticket.ticketNumber}" raqamli yangi servis arizasi ochildi!`);
  };

  const handleUpdateServiceTicket = (updated: ServiceTicket) => {
    setServiceTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    showToast(`"${updated.ticketNumber}" arizasi yangilandi!`);
  };

  const handleDeleteServiceTicket = (ticketId: string) => {
    setServiceTickets((prev) => prev.filter((t) => t.id !== ticketId));
    showToast("Servis arizasi o'chirildi");
  };

  const handleReplaceDevice = (ticketId: string, oldSerial: string, newSerial: string, productId: string) => {
    // 1. Update ticket with replaced status and replacementSerialNumber
    setServiceTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'replaced',
              replacementSerialNumber: newSerial,
              solutionNotes: `Nosoz ${oldSerial} ombordagi yangi ${newSerial} qurilmasiga almashtirildi.`
            }
          : t
      )
    );

    // 2. Decrement newSerial from warehouse product stock
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId || (p.serialNumbers && p.serialNumbers.includes(newSerial))) {
          const updatedSerials = (p.serialNumbers || []).filter((sn) => sn !== newSerial);
          return {
            ...p,
            stockQuantity: Math.max(0, p.stockQuantity - 1),
            serialNumbers: updatedSerials
          };
        }
        return p;
      })
    );

    showToast(`Qurilma muvaffaqiyatli almashtirildi! Yangi S/N: ${newSerial}`);
  };

  // Handover Report Handler (Obyekt Topshirish & Foto-Akt)
  const handleSaveHandover = (handover: ObjectHandover) => {
    setHandovers((prev) => {
      const exists = prev.some((h) => h.id === handover.id);
      const updated = exists ? prev.map((h) => (h.id === handover.id ? handover : h)) : [handover, ...prev];
      try {
        localStorage.setItem('sc_handovers', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    // If linked to an order, update order
    if (handover.orderId) {
      setCustomerOrders((prev) =>
        prev.map((o) => (o.id === handover.orderId ? { ...o, hasHandoverReport: true, handoverReportId: handover.id } : o))
      );
    }

    // Try to notify Telegram bot if enabled
    try {
      const tg = getTelegramSettings();
      if (tg.enabled && tg.botToken && tg.chatId) {
        const msg = `📸 *YANGI OBYEKT TOPSHIRILDI!*\n\n` +
          `📋 *Dalolatnoma:* #${handover.handoverNumber}\n` +
          `👤 *Mijoz:* ${handover.customerName} (${handover.customerPhone || '—'})\n` +
          `📍 *Manzil:* ${handover.installationAddress}\n` +
          (handover.gpsLocation ? `🗺️ *GPS:* [Xaritada ko'rish](${handover.gpsLocation.mapUrl})\n` : '') +
          `🛠️ *Ustalar:* ${handover.technicians.map(t => t.fullName).join(', ')}\n` +
          `⭐ *Mijoz Bahosi:* ${'⭐'.repeat(handover.clientRating)} (${handover.clientRating}/5)\n` +
          (handover.clientFeedback ? `💬 *Fikr:* _"${handover.clientFeedback}"_\n` : '') +
          `🖼️ *Suratlar soni:* ${handover.photos.length} ta\n` +
          `✍️ *Mijoz imzosi:* Tasdiqlangan ✅\n` +
          `🕒 *Vaqt:* ${handover.createdAt}`;
        sendTelegramMessage(tg.botToken, tg.chatId, msg);
      }
    } catch (e) {
      console.error(e);
    }

    showToast(`✓ Obyekt topshirildi! Qabul dalolatnomasi #${handover.handoverNumber} saqlandi.`);
  };

  const handleAddCustomerDebtPayment = (payment: CustomerDebtPayment) => {
    // 1. Update customer's debt balance
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === payment.customerId) {
          const newDebtUZS = Math.max(0, (c.debtBalance || 0) - payment.amountUZS);
          const newDebtUSD = Number((newDebtUZS / exchangeRate).toFixed(2));
          return {
            ...c,
            debtBalance: newDebtUZS,
            debtBalanceUSD: newDebtUSD
          };
        }
        return c;
      })
    );

    // 2. If payment is linked to a specific receipt, also deduct debt on that receipt
    if (payment.receiptId) {
      setReceipts((prev) =>
        prev.map((r) => {
          if (r.id === payment.receiptId) {
            const currentDebt = r.payments?.debt || 0;
            const newDebt = Math.max(0, currentDebt - payment.amountUZS);
            return {
              ...r,
              payments: {
                ...r.payments,
                debt: newDebt
              }
            };
          }
          return r;
        })
      );
    }

    // 3. Add to payment history
    setCustomerDebtPayments((prev) => [payment, ...prev]);

    showToast(`✓ Qarz to'lovi muvaffaqiyatli qabul qilindi! Kvitansiya ${payment.paymentNumber}`);
  };

  // Calculate today's sales for header
  const todaySalesTotal = receipts.filter(r => isTodayDate(r.createdAt)).reduce((sum, r) => sum + r.totalAmount, 0);

  // Active tickets count for badge
  const activeServiceCount = serviceTickets.filter(
    (t) => t.status === 'in_diagnosis' || t.status === 'in_repair' || t.status === 'received'
  ).length;

  // Debtors count for badge
  const debtorsCount = customers.filter((c) => (c.debtBalance || 0) > 0).length;

  // If not authenticated, render LoginScreen
  if (!currentUser && isLoaded) {
    return (
      <LoginScreen
        employees={employees}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 antialiased">
      {/* Left Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        offlineCount={offlineCount}
        isOffline={isOffline}
        activeServiceCount={activeServiceCount}
        debtorsCount={debtorsCount}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchUser={() => setIsSwitchUserModalOpen(true)}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          isOffline={isOffline}
          setIsOffline={setIsOffline}
          offlineCount={offlineCount}
          onSync={handleSync}
          todaySalesTotal={todaySalesTotal}
          exchangeRate={exchangeRate}
          onUpdateExchangeRate={handleUpdateExchangeRate}
          baseCurrency={baseCurrency}
          onUpdateBaseCurrency={handleUpdateBaseCurrency}
          onOpenZReport={() => setIsZReportOpen(true)}
          currentUser={currentUser}
          onSwitchUser={() => setIsSwitchUserModalOpen(true)}
          onToggleMobileMenu={() => setIsMobileNavOpen((prev) => !prev)}
        />

        {/* Dynamic Screen View */}
        <main className="flex-1 flex overflow-hidden">
          {activeTab === 'pos' && (
            <POSScreen
              products={products}
              customers={customers}
              employees={employees}
              customerOrders={customerOrders}
              onCompleteSale={handleCompleteSale}
              onAddCustomer={handleAddCustomer}
              onSaveOrder={handleSaveOrder}
              isOffline={isOffline}
              exchangeRate={exchangeRate}
              onUpdateExchangeRate={handleUpdateExchangeRate}
              baseCurrency={baseCurrency}
              onUpdateBaseCurrency={handleUpdateBaseCurrency}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersAndShipmentsScreen
              orders={customerOrders}
              shipments={shipments}
              products={products}
              customers={customers}
              employees={employees}
              exchangeRate={exchangeRate}
              baseCurrency={baseCurrency}
              currentUser={currentUser}
              handovers={handovers}
              onSaveOrder={handleSaveOrder}
              onDeleteOrder={handleDeleteOrder}
              onSaveShipment={handleSaveShipment}
              onCompleteShipmentSale={handleCompleteShipmentSale}
              onAddCustomer={handleAddCustomer}
              onSaveHandover={handleSaveHandover}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardScreen
              products={products}
              customers={customers}
              receipts={receipts}
              expenses={expenses}
              aiInsights={aiInsights}
              onNavigateTab={(tab) => setActiveTab(tab)}
              isOffline={isOffline}
              baseCurrency={baseCurrency}
              exchangeRate={exchangeRate}
            />
          )}

          {activeTab === 'financial_reports' && (
            <FinancialReportsScreen
              receipts={receipts}
              expenses={expenses}
              products={products}
              employees={employees}
              payrolls={payrolls}
              purchases={purchases}
              customers={customers}
              baseCurrency={baseCurrency}
              exchangeRate={exchangeRate}
              currentUser={currentUser}
              onReturnReceipt={handleReturnReceipt}
              onSaveEditReceipt={handleSaveEditReceipt}
              initialSubTab="pnl"
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryScreen
              products={products}
              categories={productCategories}
              purchases={purchases}
              onSavePurchase={handleSavePurchase}
              onRecordSupplierPayment={handleRecordSupplierPayment}
              onCancelPurchase={handleCancelPurchase}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onUpdateStock={handleUpdateStock}
              onAddProductCategory={handleAddProductCategory}
              onUpdateProductCategory={handleUpdateProductCategory}
              onDeleteProductCategory={handleDeleteProductCategory}
              exchangeRate={exchangeRate}
              baseCurrency={baseCurrency}
            />
          )}

          {activeTab === 'warranty' && (
            <WarrantyScreen
              products={products}
              receipts={receipts}
              purchases={purchases}
              serviceTickets={serviceTickets}
              onAddTicket={handleAddServiceTicket}
              onUpdateTicket={handleUpdateServiceTicket}
              onDeleteTicket={handleDeleteServiceTicket}
              onReplaceDevice={handleReplaceDevice}
              exchangeRate={exchangeRate}
              baseCurrency={baseCurrency}
              onViewReceipt={(receiptId) => {
                setActiveTab('financial_reports');
              }}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersScreen
              customers={customers}
              receipts={receipts}
              debtPayments={customerDebtPayments}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onUpdateCashback={handleUpdateCashback}
              onAddDebtPayment={handleAddCustomerDebtPayment}
              baseCurrency={baseCurrency}
              exchangeRate={exchangeRate}
              onViewReceipt={(receiptId) => {
                setActiveTab('financial_reports');
              }}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesScreen
              expenses={expenses}
              categories={expenseCategories}
              onAddExpense={handleAddExpense}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              todaySalesTotal={todaySalesTotal}
              baseCurrency={baseCurrency}
              exchangeRate={exchangeRate}
              employees={employees}
              payrolls={payrolls}
              advances={advances}
              receipts={receipts}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              onAddPayroll={handleAddPayroll}
              onAddAdvance={handleAddAdvance}
              initialSubTab="expenses"
            />
          )}

          {activeTab === 'ai_advisor' && (
            <AIAdvisorScreen
              products={products}
              insights={aiInsights}
            />
          )}

          {activeTab === 'sales_history' && (
            <FinancialReportsScreen
              receipts={receipts}
              expenses={expenses}
              products={products}
              employees={employees}
              payrolls={payrolls}
              purchases={purchases}
              customers={customers}
              baseCurrency={baseCurrency}
              exchangeRate={exchangeRate}
              currentUser={currentUser}
              onReturnReceipt={handleReturnReceipt}
              onSaveEditReceipt={handleSaveEditReceipt}
              initialSubTab="sales_history"
            />
          )}

          {activeTab === 'employees' && (
            <ExpensesScreen
              expenses={expenses}
              categories={expenseCategories}
              onAddExpense={handleAddExpense}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              todaySalesTotal={todaySalesTotal}
              baseCurrency={baseCurrency}
              exchangeRate={exchangeRate}
              employees={employees}
              payrolls={payrolls}
              advances={advances}
              receipts={receipts}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              onAddPayroll={handleAddPayroll}
              onAddAdvance={handleAddAdvance}
              initialSubTab="employees"
            />
          )}

          {activeTab === 'settings' && (
            <SettingsScreen
              products={products}
              receipts={receipts}
              expenses={expenses}
              employees={employees}
              customers={customers}
              debtPayments={customerDebtPayments}
              serviceTickets={serviceTickets}
              purchases={purchases}
              exchangeRate={exchangeRate}
              onUpdateExchangeRate={handleUpdateExchangeRate}
              baseCurrency={baseCurrency}
              onUpdateBaseCurrency={handleUpdateBaseCurrency}
              currentUser={currentUser}
              onUpdateEmployee={handleUpdateEmployee}
            />
          )}

          {activeTab === 'technician_portal' && (
            <TechnicianPortalScreen
              currentUser={currentUser}
              employees={employees}
              orders={customerOrders}
              shipments={shipments}
              handovers={handovers}
              serviceTickets={serviceTickets}
              products={products}
              customers={customers}
              exchangeRate={exchangeRate}
              baseCurrency={baseCurrency}
              onSaveHandover={handleSaveHandover}
              onSaveOrder={handleSaveOrder}
              onUpdateEmployeeStatus={handleUpdateEmployeeStatus}
            />
          )}
        </main>
      </div>

      {/* Z-Report (Shift Closure) Modal */}
      <ZReportModal
        isOpen={isZReportOpen}
        onClose={() => setIsZReportOpen(false)}
        receipts={receipts}
        expenses={expenses}
        exchangeRate={exchangeRate}
        baseCurrency={baseCurrency}
        cashierName={currentUser?.fullName || "Farrux A."}
        branchName="Chilonzor-1 Filiali"
        onSaveZReport={(report) => {
          showToast(`Smena muvaffaqiyatli yopildi! Z-Hisobot: ${report.reportNumber}`);
        }}
      />

      {/* Switch Account Quick Modal */}
      {isSwitchUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl">
            <button
              type="button"
              onClick={() => setIsSwitchUserModalOpen(false)}
              className="absolute -top-12 right-0 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
            <LoginScreen
              employees={employees}
              onLoginSuccess={handleLoginSuccess}
            />
          </div>
        </div>
      )}

      {/* Real-time Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-slate-900 text-white border border-slate-700/80 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
